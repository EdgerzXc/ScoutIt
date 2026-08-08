import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/delete-account/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ REWRITTEN 2026-08-06 (§58/C28) — Standing Rule 16.
//
// The previous version of this file is the cleanest example of Rule 16 in the
// repo. It mocked `supabaseAdmin.from` with:
//
//     if (table === 'user_profiles')        return { update: mockUpdate };
//     if (table === 'supabase_audit_logs')  return { insert: mockInsert };
//     return { delete: mockDelete };
//
// The catch-all `return { delete: ... }` answered for `saved_properties` and
// `search_intent_logs` — tables that DO NOT EXIST — and `supabase_audit_logs`
// does not exist either. The mock cheerfully succeeded for all three, so the
// test was green while the endpoint erased nothing, anonymised nothing, and
// recorded nothing. It asserted only `status === 200` and `success === true`,
// which is exactly what a completely broken right-to-erasure endpoint returns.
//
// These tests now assert against the REAL schema, verified against the live
// database, and the phantom-table guard below exists so this specific
// regression cannot come back quietly.
// ─────────────────────────────────────────────────────────────────────────

// Columns that actually exist on public.user_profiles (live DB, 2026-08-06).
const REAL_USER_PROFILE_COLUMNS = new Set([
  'id', 'display_name', 'avatar_url', 'location', 'headline', 'bio', 'firm',
  'service', 'prc_license', 'provider_type', 'provider_availability',
  'member_since', 'subscription_tier', 'connects_balance', 'active_roles',
  'is_profile_public', 'created_at', 'updated_at', 'is_shadowbanned',
  'archived_at', 'moderation_note', 'role', 'is_example_account',
  'dhsud_number', 'prc_expiry', 'prc_verified', 'prc_verified_at',
  'telemetry_opt_out', 'marketing_opt_out', 'adult_eligibility_status',
  'date_of_birth',
]);

// Tables that do not exist and must never be written to again.
const PHANTOM_TABLES = ['saved_properties', 'search_intent_logs', 'supabase_audit_logs'];

vi.mock('@/lib/serverAuth', () => ({ resolveUserId: vi.fn() }));
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn(), auth: { admin: { deleteUser: vi.fn() } } },
}));

const USER = '11111111-2222-3333-4444-555555555555';

/**
 * Records every table touched, every delete filter, and every write payload.
 * 'failOn' makes one table's delete return an error so the partial-erasure
 * path can be exercised.
 */
function installClient({ failOn = null, auditError = null } = {}) {
  const calls = { deleted: [], updates: [], inserts: [], tables: [] };

  supabaseAdmin.from = vi.fn((table) => {
    calls.tables.push(table);
    return {
      delete: () => ({
        eq: (column, value) => {
          calls.deleted.push({ table, column, value });
          return Promise.resolve({
            error: failOn === table ? { message: `simulated failure on ${table}` } : null,
          });
        },
      }),
      update: (payload) => ({
        eq: (column, value) => {
          calls.updates.push({ table, payload, column, value });
          return Promise.resolve({ error: null });
        },
      }),
      insert: (payload) => {
        calls.inserts.push({ table, payload });
        return Promise.resolve({ error: table === 'audit_logs' ? auditError : null });
      },
    };
  });

  supabaseAdmin.auth.admin.deleteUser = vi.fn().mockResolvedValue({ error: null });
  return calls;
}

const request = (confirm) =>
  new Request('https://www.scoutit.space/api/user/delete-account', {
    method: 'POST',
    body: JSON.stringify({ confirm }),
  });

describe('/api/user/delete-account endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(USER);
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await POST(request('DELETE MY ACCOUNT'))).status).toBe(401);
  });

  it('requires exact confirmation text', async () => {
    installClient();
    expect((await POST(request('wrong text'))).status).toBe(400);
  });

  it('erases the real private-data tables, not the phantom ones', async () => {
    const calls = installClient();

    const res = await POST(request('DELETE MY ACCOUNT'));
    expect(res.status).toBe(200);

    const tables = calls.deleted.map((d) => d.table);
    // The saved-items table is saved_intel; telemetry is analytics_events.
    expect(tables).toContain('saved_intel');
    expect(tables).toContain('analytics_events');
    expect(tables).toContain('privacy_settings');
    // Holds encrypted OAuth tokens — leaving these behind is a real exposure.
    expect(tables).toContain('calendar_connections');

    // Every delete must be scoped to this user, never unfiltered.
    for (const d of calls.deleted) expect(d.value).toBe(USER);
  });

  it('never touches a table that does not exist', async () => {
    const calls = installClient();
    await POST(request('DELETE MY ACCOUNT'));
    for (const phantom of PHANTOM_TABLES) {
      expect(calls.tables).not.toContain(phantom);
    }
  });

  it('anonymises the profile using only columns that exist', async () => {
    const calls = installClient();
    await POST(request('DELETE MY ACCOUNT'));

    const update = calls.updates.find((u) => u.table === 'user_profiles');
    expect(update).toBeDefined();

    // This is the assertion the old test lacked: a payload key that is not a
    // real column makes PostgREST reject the WHOLE statement, so the profile
    // silently stays intact. full_name/phone/email/deleted_at all did this.
    for (const key of Object.keys(update.payload)) {
      expect(REAL_USER_PROFILE_COLUMNS, `"${key}" is not a real user_profiles column`).toContain(key);
    }

    expect(update.payload.display_name).toBe('[DELETED USER]');
    expect(update.payload.is_profile_public).toBe(false);
    // §48 age-gate attestation is plain PII and must be cleared.
    expect(update.payload.date_of_birth).toBeNull();
    expect(update.value).toBe(USER);
  });

  it('writes the erasure audit record to audit_logs with its NOT NULL columns', async () => {
    const calls = installClient();
    const res = await POST(request('DELETE MY ACCOUNT'));

    const audit = calls.inserts.find((i) => i.table === 'audit_logs');
    expect(audit).toBeDefined();
    expect(audit.payload.action).toBe('ACCOUNT_DELETED_RIGHT_TO_ERASURE');
    // table_name, record_id and action are NOT NULL with no default. Omitting
    // any of them is what made every audit write in the app fail silently.
    expect(audit.payload.table_name).toBeTruthy();
    expect(audit.payload.record_id).toBeTruthy();

    expect((await res.json()).auditRecorded).toBe(true);
  });

  it('does NOT claim success when an erasure step fails', async () => {
    installClient({ failOn: 'privacy_settings' });

    const res = await POST(request('DELETE MY ACCOUNT'));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.success).toBeUndefined();
    expect(json.failedAt).toBe('privacy_settings');
    // The user must be told what did happen, not just that it broke.
    expect(json.erased).toContain('saved_intel');
  });

  it('stops erasing at the first failure rather than continuing blindly', async () => {
    const calls = installClient({ failOn: 'saved_intel' });
    await POST(request('DELETE MY ACCOUNT'));
    expect(calls.deleted.map((d) => d.table)).toEqual(['saved_intel']);
  });

  it('reports an audit-write failure instead of hiding it', async () => {
    installClient({ auditError: { message: 'audit table unavailable' } });

    const res = await POST(request('DELETE MY ACCOUNT'));
    // The deletion itself succeeded, so this is still a 200 — but it must not
    // imply a complete paper trail.
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.auditRecorded).toBe(false);
    expect(json.warning).toMatch(/audit/i);
  });
});
