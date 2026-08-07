import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/property/verify/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ REWRITTEN 2026-08-06 (§56). The previous version mocked `.or()` and fed
// the route a `status: 'LIVE'` field. Both were fictions:
//   • `properties.status` does not exist — the column is `lifecycle_state`
//   • `.or('id.eq.<slug>')` made Postgres fail to cast a slug to uuid, so
//     every slug-based call errored and was reported as "Property not found"
//
// The old test passed anyway, because the mock answered `.or()` happily and
// never had to cast anything. A mock that models the query you *meant* to
// write cannot catch the query you actually wrote.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const REAL_ROW = {
  id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  slug: 'bgc-condo',
  canonical_slug: 'bgc-condo',
  title: 'BGC Condo',
  owner_id: 'user-owner',
  lifecycle_state: 'live',
  pipeline_status: 'approved',
};

/**
 * `.select().eq().maybeSingle()` — the chain findProperty uses. `.or()` is
 * deliberately absent so a regression to it throws instead of passing.
 */
// Columns that actually exist on public.properties (live DB, 2026-08-06).
// The route wrote `updated_at` until §58/C28; `properties` has no such column,
// so PostgREST rejected the whole UPDATE and the route 500'd on every call —
// including from W12's staff panel, which shipped against it.
export const REAL_PROPERTY_COLUMNS = new Set([
  'id', 'created_at', 'owner_id', 'title', 'type', 'location', 'price',
  'description', 'media_link', 'verified', 'completeness_score', 'coordinates',
  'space_category', 'details', 'pipeline_status', 'slug', 'moderation_status',
  'rejection_reason', 'archived_at', 'last_verified_date', 'lifecycle_state',
  'canonical_slug', 'canonical_slug_locked_at', 'published_at', 'withdrawn_at',
  'quietly_open_to_offers', 'permanently_removed_at', 'permanently_removed_by',
  'permanently_removed_reason', 'creation_source', 'pdf_verified',
  'pdf_source_url', 'lister_relationship', 'owner_claim_agreed',
]);

function mockDb({ row = REAL_ROW, error = null, roles = [], updateError = null } = {}) {
  const eqCalls = [];
  const updates = [];
  const audits = [];
  supabaseAdmin.from = vi.fn().mockImplementation((table) => {
    if (table === 'properties') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((column, value) => {
            eqCalls.push({ column, value });
            return { maybeSingle: vi.fn().mockResolvedValue({ data: row, error }) };
          }),
        }),
        // The payload is captured now. Discarding it is what let the
        // `updated_at` bug sit under a green test: a mock that accepts any
        // column cannot detect a column that does not exist.
        update: vi.fn().mockImplementation((payload) => {
          updates.push(payload);
          return { eq: vi.fn().mockResolvedValue({ error: updateError }) };
        }),
      };
    }
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { active_roles: roles }, error: null }),
          }),
        }),
      };
    }
    // `audit_logs`, not `supabase_audit_logs` — the latter has never existed.
    if (table === 'audit_logs') {
      return {
        insert: vi.fn().mockImplementation((payload) => {
          audits.push(payload);
          return Promise.resolve({ error: null });
        }),
      };
    }
    return {};
  });
  eqCalls.updates = updates;
  eqCalls.audits = audits;
  return eqCalls;
}

function req(body) {
  return new Request('https://www.scoutit.space/api/property/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/property/verify API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-owner');
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await POST(req({ propertyId: 'prop-1' }))).status).toBe(401);
  });

  it('rejects a missing propertyId with 400', async () => {
    expect((await POST(req({}))).status).toBe(400);
  });

  it('returns 404 when the property does not exist', async () => {
    mockDb({ row: null });
    expect((await POST(req({ propertyId: 'non-existent-prop' }))).status).toBe(404);
  });

  // A broken query used to be indistinguishable from a missing row.
  it('returns 500 — not 404 — when the query itself fails', async () => {
    mockDb({ row: null, error: new Error('invalid input syntax for type uuid') });
    expect((await POST(req({ propertyId: 'bgc-condo' }))).status).toBe(500);
  });

  // THE ORIGINAL BUG, asserted directly: a slug must never reach the uuid
  // column, or Postgres raises and the caller sees a false 404.
  it('looks a slug up by `slug`, never by `id`', async () => {
    const eqCalls = mockDb();
    await POST(req({ propertyId: 'bgc-condo' }));
    expect(eqCalls.map((c) => c.column)).not.toContain('id');
    expect(eqCalls[0].column).toBe('slug');
  });

  it('looks a uuid up by `id`', async () => {
    const eqCalls = mockDb();
    await POST(req({ propertyId: REAL_ROW.id }));
    expect(eqCalls[0].column).toBe('id');
  });

  it('updates lastVerifiedDate and returns fresh status for the owner', async () => {
    mockDb();
    const res = await POST(req({ propertyId: 'bgc-condo', verificationType: 'owner_attestation' }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.freshness.id).toBe('fresh');
    expect(json.freshness.rankModifier).toBe(0);
    expect(json.propertyId).toBe(REAL_ROW.id);
  });

  it('rejects a stranger with 403', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('someone-else');
    mockDb({ roles: [] });
    expect((await POST(req({ propertyId: 'bgc-condo' }))).status).toBe(403);
  });

  // W12's staff surface depends on this path: staff verify listings they do
  // not own.
  it('allows staff to verify a listing they do not own', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('staff-1');
    mockDb({ roles: ['staff'] });
    expect((await POST(req({ propertyId: 'bgc-condo' }))).status).toBe(200);
  });

  it('surfaces a failed update as a 500 rather than a false success', async () => {
    mockDb({ updateError: new Error('write failed') });
    expect((await POST(req({ propertyId: 'bgc-condo' }))).status).toBe(500);
  });

  // ── §58/C28 regression guards ──────────────────────────────────────────
  // The route 500'd on every single call because its UPDATE named a column
  // that does not exist. Nothing above could see that, because the old mock
  // threw the payload away.

  it('writes only columns that exist on properties', async () => {
    const calls = mockDb();
    await POST(req({ propertyId: 'bgc-condo' }));

    expect(calls.updates).toHaveLength(1);
    for (const key of Object.keys(calls.updates[0])) {
      expect(REAL_PROPERTY_COLUMNS, `"${key}" is not a real properties column`).toContain(key);
    }
  });

  it('does not try to set updated_at, which properties does not have', async () => {
    const calls = mockDb();
    await POST(req({ propertyId: 'bgc-condo' }));
    expect(calls.updates[0]).not.toHaveProperty('updated_at');
    expect(calls.updates[0].last_verified_date).toBeTruthy();
  });

  it('records the verification in audit_logs with its NOT NULL columns', async () => {
    const calls = mockDb();
    await POST(req({ propertyId: 'bgc-condo', verificationType: 'owner_attestation' }));

    expect(calls.audits).toHaveLength(1);
    const audit = calls.audits[0];
    expect(audit.action).toBe('PROPERTY_VERIFIED');
    // table_name / record_id are NOT NULL with no default; omitting them is
    // what made every audit write in the app fail silently.
    expect(audit.table_name).toBe('properties');
    expect(audit.record_id).toBe(REAL_ROW.id);
  });
});
