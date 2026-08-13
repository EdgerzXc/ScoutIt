// ─────────────────────────────────────────────────────────────────────────
// FIXED-WINDOW RATE LIMIT (in-process, bounded)
// Master Action Plan §1.0B — "Fix Storage Exhaustion via Telemetry"
//
// ── WHAT THIS IS, HONESTLY ───────────────────────────────────────────
// This is a per-instance limiter. On Vercel each serverless instance keeps
// its own counters, so the effective global ceiling is
// (limit × concurrent instances), not `limit`. That is a real limitation
// and it is stated here rather than implied away.
//
// It is still worth having: the attack it blocks is one client looping a
// cheap unauthenticated POST, and a single looping client lands on a small
// number of warm instances. It is the cheap half of the defence — the
// structural half is the database-side uniqueness invariant added in
// 20260812000001, which caps how many ROWS any volume of requests can
// create. Neither alone is sufficient; together the write path is bounded
// in both rate and size.
//
// If a distributed counter becomes necessary, the Upstash Redis client is
// already a dependency (see cmsCache.js) and this module's surface is the
// place to swap it in.
// ─────────────────────────────────────────────────────────────────────────

import { BoundedCache } from "@/lib/boundedCache";

const DEFAULT_MAX_TRACKED_KEYS = 5000;

/**
 * Create an isolated fixed-window limiter.
 *
 * @param {object} options
 * @param {number} options.limit      permitted requests per window
 * @param {number} options.windowMs   window length in milliseconds
 * @param {number} [options.maxKeys]  cap on tracked identities (the limiter
 *                                    must not itself become the memory leak)
 */
export function createRateLimiter({ limit, windowMs, maxKeys = DEFAULT_MAX_TRACKED_KEYS }) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeWindow = Math.max(1, Number(windowMs) || 1);
  // TTL is two windows so a stale bucket can never wrongly deny a later one.
  const buckets = new BoundedCache({ maxEntries: maxKeys, ttlMs: safeWindow * 2 });

  /**
   * @param {string} key identity to meter (never user-supplied free text)
   * @returns {{allowed: boolean, remaining: number, retryAfterSeconds: number}}
   */
  return function check(key) {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now - bucket.windowStart >= safeWindow) {
      buckets.set(key, { windowStart: now, count: 1 });
      return { allowed: true, remaining: safeLimit - 1, retryAfterSeconds: 0 };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > safeLimit) {
      const elapsed = now - bucket.windowStart;
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((safeWindow - elapsed) / 1000)),
      };
    }

    return { allowed: true, remaining: safeLimit - bucket.count, retryAfterSeconds: 0 };
  };
}

export default createRateLimiter;
