import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/wrap/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ REWRITTEN 2026-08-06 (§58 · W9 pre-flight, Standing Rule 15).
//
// The previous version asserted the security hole as correct behaviour: it
// signed in as `user-123`, requested the wrap for `prop-1` — a property that
// user has no relationship to — and asserted `200` + `success: true`. The
// route authenticated but never authorised, so that assertion passed and
// encoded "any signed-in user may read any entity's report" as the spec.
//
// It also could not have caught the reason the endpoint didn't work at all:
// the `generate_monthly_scout_wrap` RPC threw `42883 text = uuid` on
// `viewing_appointments.property_id`, so every uncached property request
// 500'd. A mocked `rpc()` returns whatever you tell it to (Rule 16).
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/serverAuth', () => ({ resolveUserId: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

const OWNER = 'owner-uuid-1';
const STRANGER = 'stranger-uuid-2';
const PROPERTY_ID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/**
 * @param roles       active_roles for the calling user
 * @param propOwner   owner_id on the looked-up property
 * @param cached      a cached wrap row, or null to force RPC generation
 */
function mockDb({ roles = [], propOwner = OWNER, cached = null } = {}) {
  supabaseAdmin.from = vi.fn().mockImplementation((table) => {
    if (table === 'user_profiles') {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: { active_roles: roles }, error: null }) }),
        }),
      };
    }
    if (table === 'properties') {
      // findProperty: .select().eq().maybeSingle()
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({
              data: propOwner === null ? null : { id: PROPERTY_ID, owner_id: propOwner },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === 'monthly_scout_wraps') {
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: cached, error: null }) }) }) }),
        }),
      };
    }
    return {};
  });

  supabaseAdmin.rpc = vi.fn().mockResolvedValue({
    data: { period_month: '2026-07', unique_monthly_eyes: 7 },
    error: null,
  });
}

const url = (qs) => new Request(`https://www.scoutit.space/api/wrap?${qs}`);

describe('/api/wrap API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(OWNER);
  });
  afterEach(() => vi.useRealTimers());

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await GET(url('entityType=property&entityId=x'))).status).toBe(401);
  });

  it('rejects invalid entityType with 400', async () => {
    mockDb();
    expect((await GET(url('entityType=invalid_type&entityId=x'))).status).toBe(400);
  });

  it('requires entityId', async () => {
    mockDb();
    expect((await GET(url('entityType=property'))).status).toBe(400);
  });

  // ── AUTHORISATION ──────────────────────────────────────────────────────

  it('lets a property owner read their own listing wrap', async () => {
    mockDb({ propOwner: OWNER, cached: { report_data: { unique_monthly_eyes: 42 }, generated_at: '2026-08-01T00:00:00Z' } });

    const res = await GET(url(`entityType=property&entityId=${PROPERTY_ID}&periodMonth=2026-07`));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.source).toBe('cache');
    expect(json.data.unique_monthly_eyes).toBe(42);
  });

  it('BLOCKS a stranger from reading a listing wrap they do not own', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(STRANGER);
    mockDb({ propOwner: OWNER, cached: { report_data: { unique_monthly_eyes: 42 }, generated_at: 'x' } });

    const res = await GET(url(`entityType=property&entityId=${PROPERTY_ID}&periodMonth=2026-07`));
    expect(res.status).toBe(403);
    // The competitor's numbers must not be in the body at all.
    expect(JSON.stringify(await res.json())).not.toMatch(/42/);
  });

  it('BLOCKS reading another broker\'s routed-lead volume', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(STRANGER);
    mockDb();
    expect((await GET(url('entityType=broker&entityId=some-other-broker'))).status).toBe(403);
  });

  it('BLOCKS reading another owner\'s portfolio wrap', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(STRANGER);
    mockDb();
    expect((await GET(url(`entityType=owner_portfolio&entityId=${OWNER}`))).status).toBe(403);
  });

  it('lets a broker read their own wrap', async () => {
    mockDb();
    expect((await GET(url(`entityType=broker&entityId=${OWNER}`))).status).toBe(200);
  });

  it('lets staff read any entity wrap', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('staff-1');
    mockDb({ roles: ['staff'], propOwner: OWNER });
    expect((await GET(url(`entityType=property&entityId=${PROPERTY_ID}`))).status).toBe(200);
  });

  it('denies when the property lookup finds nothing, rather than allowing', async () => {
    mockDb({ propOwner: null });
    expect((await GET(url(`entityType=property&entityId=${PROPERTY_ID}`))).status).toBe(403);
  });

  // ── GENERATION ─────────────────────────────────────────────────────────

  it('generates via RPC when no cached row exists', async () => {
    mockDb({ cached: null });

    const res = await GET(url(`entityType=broker&entityId=${OWNER}&periodMonth=2026-07`));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.source).toBe('generated');
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('generate_monthly_scout_wrap', {
      p_entity_type: 'broker',
      p_entity_id: OWNER,
      p_period_month: '2026-07',
    });
  });

  it('surfaces an RPC failure as 500 rather than an empty success', async () => {
    mockDb({ cached: null });
    supabaseAdmin.rpc = vi.fn().mockResolvedValue({ data: null, error: new Error('42883 text = uuid') });

    expect((await GET(url(`entityType=broker&entityId=${OWNER}`))).status).toBe(500);
  });

  // ── DEFAULT PERIOD ─────────────────────────────────────────────────────
  // Rule 11: time logic is tested against a fixed instant.

  it.each([
    ['2026-03-31T10:00:00Z', '2026-02'], // the day-overflow case: Feb has no 31st
    ['2026-05-31T10:00:00Z', '2026-04'], // April has no 31st
    ['2026-08-06T10:00:00Z', '2026-07'],
    ['2026-01-15T10:00:00Z', '2025-12'], // year boundary
  ])('defaults to the previous whole month: on %s → %s', async (now, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(now));
    mockDb({ cached: null });

    await GET(url(`entityType=broker&entityId=${OWNER}`));

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
      'generate_monthly_scout_wrap',
      expect.objectContaining({ p_period_month: expected })
    );
  });
});
