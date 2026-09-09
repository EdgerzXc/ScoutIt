import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { isQuestItPath, shouldBlockQuestIt } from '@/lib/questItGate';
import { isSensitivePath, rateLimitTier } from '@/lib/sensitiveRoutes';

// ── Rate limiting (B4) ──────────────────────────────────────────────────────
// Sensitive routes (auth, uploads, AI) FAIL CLOSED when the limiter is
// unavailable — better a brief 503 on those than an unmetered attack window.
// Everything else keeps failing open so a Redis hiccup can't take the site down.

let standardLimiter;
let strictLimiter;
let aiLimiter;

function initLimiters() {
  if (!standardLimiter || !strictLimiter) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = Redis.fromEnv();

      standardLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(30, '10 s'),
        analytics: true,
      });

      strictLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(5, '10 s'),
        analytics: true,
      });

      aiLimiter = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(15, '10 s'),
        analytics: true,
      });
    }
  }
}

// ── The masked-IP anomaly guard was RETIRED here on 2026-09-04 (A-080) ──────
// Owner decision. This file used to define `maskIp`, `getBanSet`,
// `recordAccess` and their caches, written for "A7 Phase 2" — and never wired
// into `proxy()`. Nothing called them, so `blocked_access` had no reader and
// blocking an IP in Mission Control did nothing at all.
//
// Finishing it would have been worse than deleting it. The table the console
// ranks on, `security_access_logs`, is fed by `/api/telemetry/device`: 1,755 of
// its 1,820 rows are anonymous visitor analytics, so its "velocity" ordering is
// page views and every flagged anomaly is one product event,
// `abandoned_inquiry_modal`. The two live `blocked_access` rows are the same
// visitor two seconds apart under that reason — someone who gave up on a form.
// Switching enforcement on would have started banning real visitors for
// hesitating.
//
// Do not reintroduce a ban lookup here without first giving the log a real
// security feed. `src/lib/__tests__/proxyBanGuardRetired.test.js` fails if this
// file regains a `blocked_access` read or a `log_masked_access` write.
// `/api/contact` has its own unrelated `maskIp` and is untouched.

// ── Feature flags (A4) ──────────────────────────────────────────────────────
// 30s edge-cached read of feature_flags so Mission Control toggles propagate
// fast. FAILS SAFE: unreachable table = empty map = defaults below apply
// (site keeps working, kill switch off).
const FLAG_CACHE_TTL_MS = 30 * 1000;
let flagCache = { flags: {}, fetchedAt: 0 };

async function getFlags() {
  const now = Date.now();
  if (now - flagCache.fetchedAt < FLAG_CACHE_TTL_MS) return flagCache.flags;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return flagCache.flags;
  try {
    const res = await fetch(`${url}/rest/v1/feature_flags?select=id,is_enabled`, {
      headers: supabaseHeaders(),
    });
    if (res.ok) {
      const rows = await res.json();
      flagCache = {
        flags: Object.fromEntries(rows.map((r) => [r.id, !!r.is_enabled])),
        fetchedAt: now,
      };
    }
  } catch {
    // keep stale cache
  }
  return flagCache.flags;
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function proxy(request, event) {
  // Local dev / E2E runs fire hundreds of same-IP requests and were tripping
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;
  const sensitive = isSensitivePath(path);
  const questItPath = isQuestItPath(path);

  // ── Feature-flag enforcement (A4) — fails safe/open (enforced in all envs) ──
  try {
    const flags = await getFlags();

    // KILL SWITCH: freeze every write on the site instantly. Auth stays up
    // so people can still sign in/out during the freeze.
    const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    if (flags.global_read_only === true && isWrite && !path.startsWith('/api/auth/')) {
      return NextResponse.json(
        { error: 'ScoutIt is briefly in read-only mode for maintenance. Nothing is lost — please try again shortly.' },
        { status: 503 }
      );
    }

    // QuestIT is parked behind an independent fail-closed gate. Pre-launch
    // free mode never overrides this: missing/false blocks, explicit true opens.
    if (shouldBlockQuestIt(path, flags)) {
      // A-099: this gate fronts the whole parked QuestIT surface — AI search
      // AND the bounty board provider dashboards read — so the message names
      // both instead of reporting a bounty outage as an AI-search outage.
      return NextResponse.json({ error: 'QuestIT (AI search and bounties) is not enabled right now.' }, { status: 503 });
    }

    // Feature gates — honored only once pre-launch free mode ends, so the
    // currently-unlocked experience is unchanged until launch flips it.
    const freeMode = flags.pre_launch_free_mode !== false; // default true
    if (!freeMode) {
      if (flags.deep_intel === false && path.startsWith('/api/intel/')) {
        return NextResponse.json({ error: 'Deep Intel is not enabled right now.' }, { status: 503 });
      }
    }
  } catch (err) {
    if (questItPath) {
      return NextResponse.json({ error: 'QuestIT (AI search and bounties) is not enabled right now.' }, { status: 503 });
    }
    console.error('[FeatureFlags] Error (failing open):', err?.message);
  }

  // Local dev / E2E runs fire hundreds of same-IP requests and were tripping
  // the limiter (429s mid-test-suite). Rate limiting & IP blocking are production-only.
  const isLocalE2E =
    process.env.SCOUTIT_E2E === '1' &&
    ['localhost', '127.0.0.1'].includes(request.nextUrl.hostname);

  if (process.env.NODE_ENV !== 'production' || isLocalE2E) {
    return NextResponse.next();
  }

  // ── Rate limiting ──
  initLimiters();

  if (!standardLimiter) {
    // Limiter not configured: sensitive routes fail closed, rest fail open.
    if (sensitive) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }

  const tier = rateLimitTier(path);
  let limiterToUse = standardLimiter;
  if (tier === 'strict') {
    limiterToUse = strictLimiter || standardLimiter;
  } else if (tier === 'ai') {
    limiterToUse = aiLimiter || standardLimiter;
  }

  try {
    const { success, limit, reset, remaining } = await limiterToUse.limit(`ratelimit_${ip}`);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      );
    }

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', limit.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
    res.headers.set('X-RateLimit-Reset', reset.toString());
    return res;
  } catch (err) {
    console.error('[RateLimiter] Error:', err);
    // Redis died mid-request: sensitive routes fail closed, rest fail open.
    if (sensitive) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: '/api/:path*',
};
