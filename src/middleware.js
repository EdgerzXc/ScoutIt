import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

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

// Routes where an unmetered window is worse than a brief outage.
function isSensitivePath(path) {
  return (
    path.startsWith('/api/auth/') ||
    path.startsWith('/api/ai/') ||
    path.startsWith('/api/storage/')
  );
}

// ── Masked-IP anomaly guard (A7 Phase 2) ────────────────────────────────────
// Privacy-preserving: the raw IP is hashed with a server-side salt in-memory
// and immediately discarded — only `ip_anon_<sha256>` ever leaves this file.
// Counting happens in a service-role-locked RPC (log_masked_access); bans are
// read from blocked_access with a 60s in-isolate cache. The guard FAILS OPEN:
// any error here must never take down the site.

const BAN_CACHE_TTL_MS = 60 * 1000;
let banCache = { set: new Set(), fetchedAt: 0 };

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

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function maskIp(ip) {
  const salt = process.env.IP_SALT;
  if (!salt) return null; // guard disabled until IP_SALT is configured
  return 'ip_anon_' + (await sha256Hex(ip + salt));
}

function supabaseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function getBanSet() {
  const now = Date.now();
  if (now - banCache.fetchedAt < BAN_CACHE_TTL_MS) return banCache.set;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return banCache.set;

  try {
    const res = await fetch(
      `${url}/rest/v1/blocked_access?type=eq.ip&select=value&limit=1000`,
      { headers: supabaseHeaders() }
    );
    if (res.ok) {
      const rows = await res.json();
      banCache = { set: new Set(rows.map((r) => r.value)), fetchedAt: now };
    }
  } catch {
    // fail open — keep the stale cache
  }
  return banCache.set;
}

function recordAccess(maskedIp, path, event) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  // Fire-and-forget via waitUntil so logging never adds request latency.
  const p = fetch(`${url}/rest/v1/rpc/log_masked_access`, {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify({ p_masked_ip: maskedIp, p_route: path }),
  }).catch(() => {});
  if (event?.waitUntil) event.waitUntil(p);
}

export async function middleware(request, event) {
  // Local dev / E2E runs fire hundreds of same-IP requests and were tripping
  // the limiter (429s mid-test-suite). These shields are production-only.
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const path = request.nextUrl.pathname;
  const sensitive = isSensitivePath(path);

  // ── Masked-IP guard: ban check + anomaly logging (fails open) ──
  try {
    const maskedIp = await maskIp(ip);
    if (maskedIp) {
      const bans = await getBanSet();
      if (bans.has(maskedIp)) {
        return NextResponse.json({ error: 'Access blocked.' }, { status: 403 });
      }
      recordAccess(maskedIp, path, event);
    }
  } catch (err) {
    console.error('[IPGuard] Error (failing open):', err?.message);
  }

  // ── Feature-flag enforcement (A4) — fails safe/open ──
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

    // Feature gates — honored only once pre-launch free mode ends, so the
    // currently-unlocked experience is unchanged until launch flips it.
    const freeMode = flags.pre_launch_free_mode !== false; // default true
    if (!freeMode) {
      if (flags.ai_search === false && (path.startsWith('/api/questit') || path.startsWith('/api/v1/questit'))) {
        return NextResponse.json({ error: 'AI search is not enabled right now.' }, { status: 503 });
      }
      if (flags.deep_intel === false && path.startsWith('/api/intel/')) {
        return NextResponse.json({ error: 'Deep Intel is not enabled right now.' }, { status: 503 });
      }
    }
  } catch (err) {
    console.error('[FeatureFlags] Error (failing open):', err?.message);
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

  let limiterToUse = standardLimiter;
  if (path.startsWith('/api/auth/')) {
    limiterToUse = strictLimiter;
  } else if (path.startsWith('/api/ai/')) {
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
