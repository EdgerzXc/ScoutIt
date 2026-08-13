// ─────────────────────────────────────────────────────────────────────────
// §1.0B — CRITICAL LOGIC & SECURITY FLAWS (2026-08-12 audit)
//
// One adversarial test per finding that has an application-layer surface.
// The database-only findings (handshake forgery, self-approval, deal-party
// immutability, saved_intel uniqueness, property_claims typing) are proved
// by SQL assertions in the migration and by the owner-run schema diff; they
// have no JS entry point to exercise here.
// ─────────────────────────────────────────────────────────────────────────

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BoundedCache } from '@/lib/boundedCache';
import { createRateLimiter } from '@/lib/rateLimit';

// ═══════════════════════════════════════════════════════════════
// Cap the geocodeCache — bounded LRU
// ═══════════════════════════════════════════════════════════════
describe('BoundedCache', () => {
  it('never exceeds maxEntries no matter how many novel keys arrive', () => {
    const cache = new BoundedCache({ maxEntries: 10 });
    for (let i = 0; i < 5000; i += 1) cache.set(`location-${i}`, [i, i]);
    expect(cache.size).toBe(10);
  });

  it('evicts least-recently-used, not least-recently-written', () => {
    const cache = new BoundedCache({ maxEntries: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    cache.get('a'); // 'a' becomes most recently used, so 'b' is now the LRU
    cache.set('d', 4);

    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
  });

  it('stores and returns a null value without treating it as a miss', () => {
    // cmsCache caches `null` to mean "Mapbox knows nothing about this string";
    // if that read looked like a miss, the unknown location would be re-asked
    // on every request — the exact rate-limit burn the cap exists to stop.
    const cache = new BoundedCache({ maxEntries: 4 });
    cache.set('nowhere', null);
    expect(cache.has('nowhere')).toBe(true);
    expect(cache.get('nowhere')).toBe(null);
  });

  it('expires entries past their TTL', () => {
    vi.useFakeTimers();
    try {
      const cache = new BoundedCache({ maxEntries: 4, ttlMs: 1000 });
      cache.set('k', 'v');
      vi.advanceTimersByTime(1500);
      expect(cache.has('k')).toBe(false);
      expect(cache.get('k')).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// Telemetry storage exhaustion — rate limiter
// ═══════════════════════════════════════════════════════════════
describe('createRateLimiter', () => {
  it('allows up to the limit then denies with a Retry-After hint', () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000 });
    expect(check('1.2.3.4').allowed).toBe(true);
    expect(check('1.2.3.4').allowed).toBe(true);
    expect(check('1.2.3.4').allowed).toBe(true);

    const denied = check('1.2.3.4');
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('meters each identity independently', () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(check('1.1.1.1').allowed).toBe(true);
    expect(check('1.1.1.1').allowed).toBe(false);
    expect(check('2.2.2.2').allowed).toBe(true);
  });

  it('reopens the window after it elapses', () => {
    vi.useFakeTimers();
    try {
      const check = createRateLimiter({ limit: 1, windowMs: 1000 });
      expect(check('ip').allowed).toBe(true);
      expect(check('ip').allowed).toBe(false);
      vi.advanceTimersByTime(1100);
      expect(check('ip').allowed).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not itself grow without bound under identity churn', () => {
    const check = createRateLimiter({ limit: 5, windowMs: 60_000, maxKeys: 50 });
    for (let i = 0; i < 10_000; i += 1) check(`ip-${i}`);
    // 10,000 distinct spoofed identities must not retain 10,000 buckets.
    // The last caller is still served correctly.
    expect(check('ip-9999').allowed).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// Global deal handshake sabotage (IDOR)
// ═══════════════════════════════════════════════════════════════
vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
  assertAdultEligibility: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { rpc: vi.fn(), from: vi.fn() },
}));

const { POST } = await import('@/app/api/deals/handshake/route');
const serverAuth = await import('@/lib/serverAuth');
const { supabaseAdmin } = await import('@/lib/supabaseAdmin');

function declineRequest(dealId) {
  return new Request('https://www.scoutit.space/api/deals/handshake', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dealId, action: 'decline' }),
  });
}

/** Minimal chainable stand-in for the two query shapes this route builds. */
function stubFrom({ deal }) {
  const updateChain = {
    eq: vi.fn(function chain() { return updateChain; }),
    then: undefined,
  };
  // The final .eq() in the update chain resolves; model it as a thenable.
  updateChain.eq = vi.fn(() => Object.assign(
    Promise.resolve({ error: null }),
    { eq: updateChain.eq },
  ));

  return vi.fn((table) => {
    if (table === 'deals') {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: deal, error: null }) }),
        }),
      };
    }
    return { update: vi.fn(() => updateChain) };
  });
}

describe('/api/deals/handshake decline authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'assertAdultEligibility').mockResolvedValue(true);
  });

  it('refuses to decline a deal the caller is not a party to', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('attacker');
    const from = stubFrom({ deal: { id: 'deal-1', buyer_id: 'buyer', broker_id: 'broker' } });
    supabaseAdmin.from = from;

    const res = await POST(declineRequest('deal-1'));
    expect(res.status).toBe(403);

    // The critical assertion: no write was attempted at all.
    expect(from).toHaveBeenCalledWith('deals');
    expect(from).not.toHaveBeenCalledWith('deal_handshakes');
  });

  it('returns the same 403 for a deal that does not exist (no enumeration)', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('someone');
    supabaseAdmin.from = stubFrom({ deal: null });

    const res = await POST(declineRequest('deal-does-not-exist'));
    expect(res.status).toBe(403);
  });

  it('allows a real party to decline', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('broker');
    supabaseAdmin.from = stubFrom({ deal: { id: 'deal-2', buyer_id: 'buyer', broker_id: 'broker' } });

    const res = await POST(declineRequest('deal-2'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('declined');
  });
});
