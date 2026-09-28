// ═══════════════════════════════════════════════════════════════
// ScoutIt Airtable Public-API Call Budget (U-042)
//
// Airtable Free allows 1,000 Public API calls per calendar month. In October
// the site reached that ceiling and every public CMS read failed for the rest
// of the month. The counter in cmsCache.js is per-process and reset by cold
// starts, and the cooldown in airtable.js only engages *after* Airtable has
// already returned 429 — by then the month is spent. This module keeps one
// shared count in Redis so the spend is visible before it is exhausted, and
// so routine rebuilds can stop themselves instead of being stopped by Airtable.
//
// Deliberate limits:
//  - This counts *attempts*, not successes. A timeout still billed a call, so
//    counting only 2xx responses would understate the thing being guarded.
//  - Publisher-driven rebuilds are never blocked (see cmsCache.js). A listing
//    that must go up, or come down, always reaches Airtable. The guard only
//    declines routine TTL-expiry refreshes and serves the last good snapshot.
//  - Without Redis there is no shared count, so nothing here can guard. Reads
//    proceed and the budget reports itself unavailable rather than pretending.
// ═══════════════════════════════════════════════════════════════

import { Redis } from "@upstash/redis";

const KEY_PREFIX = "airtable_public_calls";
const COUNTER_TTL_S = 60 * 60 * 24 * 40; // outlives its month, then self-cleans

// Airtable Free caps at 1,000/month. 900 leaves ~100 calls of headroom for
// publisher rebuilds and staff sessions after routine reads have been declined.
export const DEFAULT_MONTHLY_BUDGET = 900;

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      cache: "default", // same documented Upstash workaround cmsCache.js uses
    });
  } catch (err) {
    console.error("[AirtableBudget] Redis unavailable; budget guard disabled:", err?.message);
  }
}

/** Ceiling for the current month, overridable per-environment. */
export function airtableMonthlyBudget() {
  const configured = Number(process.env.AIRTABLE_MONTHLY_BUDGET);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_MONTHLY_BUDGET;
}

/** UTC calendar month Airtable meters against, e.g. "2026-10". */
export function airtableBudgetMonth(date = new Date()) {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}`;
}

/** False when Redis is absent — meaning the count is unknown, not zero. */
export function isAirtableBudgetTracked() {
  return Boolean(redis);
}

/**
 * Add one Airtable Public API call to this month's shared count.
 * Fire-and-forget by contract: the count must never fail the read it counts.
 */
export async function recordAirtableCall(count = 1) {
  if (!redis || !Number.isFinite(count) || count <= 0) return null;
  try {
    const key = `${KEY_PREFIX}:${airtableBudgetMonth()}`;
    const attempts = await redis.incrby(key, Math.trunc(count));
    await redis.expire(key, COUNTER_TTL_S);
    return attempts;
  } catch (err) {
    console.error("[AirtableBudget] Could not record call count:", err?.message);
    return null;
  }
}

/**
 * The current spend. `tracked: false` means no shared counter exists; it must
 * not be read as "zero calls made".
 */
export async function getAirtableBudgetStatus() {
  const budget = airtableMonthlyBudget();
  const month = airtableBudgetMonth();
  if (!redis) {
    return { tracked: false, month, attempts: null, budget, remaining: null, exhausted: false };
  }
  try {
    const stored = await redis.get(`${KEY_PREFIX}:${month}`);
    const attempts = Number(stored ?? 0);
    const safeAttempts = Number.isFinite(attempts) && attempts > 0 ? attempts : 0;
    return {
      tracked: true,
      month,
      attempts: safeAttempts,
      budget,
      remaining: Math.max(0, budget - safeAttempts),
      exhausted: safeAttempts >= budget,
    };
  } catch (err) {
    console.error("[AirtableBudget] Could not read call count:", err?.message);
    return { tracked: false, month, attempts: null, budget, remaining: null, exhausted: false };
  }
}

/** Test seam; never changes Airtable's actual workspace quota. */
export function __resetAirtableBudgetClientForTests(client) {
  redis = client;
}
