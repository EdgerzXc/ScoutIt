import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/user/privacy-settings/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// Updated 2026-08-06 for W13 · C19 · §46.8.
//
// The route now spans TWO tables: `user_profiles` for the profile flags and
// `privacy_settings` for the anonymity shield. The old single-table mock could
// not express that, so it was replaced rather than patched.
//
// ⚠️ The shield is FREE ON EVERY TIER (Standing Rule 10). Nothing in this route
// may ever consult a tier, and there is no test here that grants access —
// because there is no access decision to make.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

function mockDb({
  profile = {
    is_profile_public: true,
    telemetry_opt_out: false,
    marketing_opt_out: true,
    adult_eligibility_status: 'declared_adult',
  },
  shield = { anonymous_browsing: false, anonymous_byline: false },
  profileError = null,
  upsertError = null,
} = {}) {
  const writes = { profile: [], shield: [] };
  supabaseAdmin.from = vi.fn().mockImplementation((table) => {
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: profileError }),
          }),
        }),
        update: vi.fn().mockImplementation((row) => {
          writes.profile.push(row);
          return { eq: vi.fn().mockResolvedValue({ error: null }) };
        }),
      };
    }
    if (table === 'privacy_settings') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: shield, error: null }),
          }),
        }),
        upsert: vi.fn().mockImplementation((row) => {
          writes.shield.push(row);
          return Promise.resolve({ error: upsertError });
        }),
      };
    }
    return {};
  });
  return writes;
}

function post(body) {
  return new Request('https://www.scoutit.space/api/user/privacy-settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const getReq = () => new Request('https://www.scoutit.space/api/user/privacy-settings');

describe('/api/user/privacy-settings API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
  });

  it('rejects unauthenticated GET requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await GET(getReq())).status).toBe(401);
  });

  it('rejects unauthenticated POST requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await POST(post({ isProfilePublic: false }))).status).toBe(401);
  });

  it('returns privacy settings for an authenticated user', async () => {
    mockDb();
    const json = await (await GET(getReq())).json();

    expect(json.success).toBe(true);
    expect(json.settings.isProfilePublic).toBe(true);
    expect(json.settings.marketingOptOut).toBe(true);
  });

  it('returns the anonymity shield state alongside the profile flags', async () => {
    mockDb({ shield: { anonymous_browsing: true, anonymous_byline: false } });
    const json = await (await GET(getReq())).json();

    expect(json.settings.anonymousBrowsing).toBe(true);
    expect(json.settings.anonymousByline).toBe(false);
  });

  // A profile created before the shield existed has NO privacy_settings row.
  // Reporting the shield as ON in that case would tell someone they are
  // protected when they are not — the failure direction matters more than the
  // tidiness of the default.
  it('reports the shield as OFF when no privacy_settings row exists', async () => {
    mockDb({ shield: null });
    const json = await (await GET(getReq())).json();

    expect(json.settings.anonymousBrowsing).toBe(false);
    expect(json.settings.anonymousByline).toBe(false);
  });

  // §47: "unknown" is the honest default. Reporting an attestation nobody made
  // is how a legal-capacity claim gets fabricated by a fallback value.
  it('never reports an adult declaration that was not made', async () => {
    mockDb({ profile: { is_profile_public: true } });
    const json = await (await GET(getReq())).json();
    expect(json.settings.adultEligibilityStatus).toBe('unknown');
  });

  it('updates profile flags via POST', async () => {
    const writes = mockDb({
      profile: { is_profile_public: false, telemetry_opt_out: true, marketing_opt_out: true },
    });
    const res = await POST(post({ isProfilePublic: false, telemetryOptOut: true }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.settings.isProfilePublic).toBe(false);
    expect(json.settings.telemetryOptOut).toBe(true);
    expect(writes.profile[0]).toMatchObject({ is_profile_public: false, telemetry_opt_out: true });
  });

  // UPSERT, not UPDATE. An update against a missing row succeeds and changes
  // nothing — the user would see the toggle flip while the setting never saved.
  it('UPSERTS the shield so a missing row still saves', async () => {
    const writes = mockDb({
      shield: { anonymous_browsing: true, anonymous_byline: false },
    });
    const res = await POST(post({ anonymousBrowsing: true }));
    expect(res.status).toBe(200);

    expect(writes.shield).toHaveLength(1);
    expect(writes.shield[0]).toMatchObject({ user_id: 'user-123', anonymous_browsing: true });
    const json = await res.json();
    expect(json.settings.anonymousBrowsing).toBe(true);
  });

  it('accepts a profile flag and a shield flag in one request', async () => {
    const writes = mockDb({
      profile: { is_profile_public: false, telemetry_opt_out: false, marketing_opt_out: false },
      shield: { anonymous_browsing: true, anonymous_byline: true },
    });
    const res = await POST(post({ isProfilePublic: false, anonymousByline: true }));
    expect(res.status).toBe(200);
    expect(writes.profile).toHaveLength(1);
    expect(writes.shield).toHaveLength(1);
  });

  it('rejects a request with nothing valid in it', async () => {
    mockDb();
    expect((await POST(post({ nonsense: true }))).status).toBe(400);
  });

  // Only booleans. A string "false" is truthy, and a privacy flag set from a
  // truthy string is a control that silently does the opposite.
  it('ignores non-boolean values rather than coercing them', async () => {
    mockDb();
    expect((await POST(post({ isProfilePublic: 'false', anonymousBrowsing: 1 }))).status).toBe(400);
  });

  it('surfaces a failed shield write as a 500, not a false success', async () => {
    mockDb({ upsertError: new Error('write failed') });
    expect((await POST(post({ anonymousBrowsing: true }))).status).toBe(500);
  });
});
