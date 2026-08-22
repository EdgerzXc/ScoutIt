import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  profileUpsert: vi.fn(),
  profileUpdate: vi.fn(),
  profileEq: vi.fn(),
  legacyWalletUpsert: vi.fn(),
  canonicalRoleWalletUpsert: vi.fn(),
  canonicalAccountUpsert: vi.fn(),
  termsInsert: vi.fn(),
  termsSelectSingle: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "user_connect_wallets") return { upsert: mocks.canonicalRoleWalletUpsert };
      if (table === "terms_acceptances") {
        return {
          insert: mocks.termsInsert,
          select: () => ({ eq: () => ({ eq: () => ({ single: mocks.termsSelectSingle }) }) }),
        };
      }

      if (table === "user_connect_accounts") return { upsert: mocks.canonicalAccountUpsert };
      if (table === "connect_balances") return { upsert: mocks.legacyWalletUpsert };
      if (table === "user_profiles") {
        return {
          upsert: mocks.profileUpsert,
          update: mocks.profileUpdate,
          select: () => ({ eq: () => ({ maybeSingle: mocks.profileMaybeSingle }) }),
        };
      }
      throw new Error(`Unexpected table ${table}`);
    },
  },
}));
import { CURRENT_TERMS_VERSION } from "@/lib/legalVersions";

import { POST } from "@/app/api/auth/complete-onboarding/route";

function request(body) {
  return {
    headers: { get: (name) => name.toLowerCase() === "authorization" ? "Bearer valid-token" : "vitest" },
    json: async () => ({ termsVersion: CURRENT_TERMS_VERSION, ...body }),
  };
}

describe("complete onboarding API", () => {
  const origEnv = process.env.CONNECTS_CANONICAL_ACTIVE;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.profileMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.profileUpsert.mockResolvedValue({ error: null });
    mocks.canonicalRoleWalletUpsert.mockResolvedValue({ error: null });
    mocks.canonicalAccountUpsert.mockResolvedValue({ error: null });
    mocks.legacyWalletUpsert.mockResolvedValue({ error: null });
    mocks.profileEq.mockResolvedValue({ error: null });
    mocks.termsInsert.mockResolvedValue({ error: null });
    mocks.termsSelectSingle.mockResolvedValue({ data: { accepted_at: "2026-08-21T00:00:00.000Z" }, error: null });
    mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
  });

  afterEach(() => {
    if (origEnv !== undefined) {
      process.env.CONNECTS_CANONICAL_ACTIVE = origEnv;
    } else {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;
    }
  });

  describe("Pre-migration default (legacy mode)", () => {
    it("provisions legacy connect_balances authoritatively without touching canonical tables", async () => {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;

      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
        locationFocus: "BGC, Makati",
      }));

      expect(response.status).toBe(200);
      expect(mocks.legacyWalletUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          granted_balance: 1,
          purchased_balance: 0,
          earned_balance: 0,
        }),
        expect.anything(),
      );
      expect(mocks.termsInsert).toHaveBeenCalledOnce();
      expect(mocks.profileUpsert).toHaveBeenCalledWith(expect.objectContaining({ terms_version: CURRENT_TERMS_VERSION }), expect.anything());
      expect(mocks.canonicalRoleWalletUpsert).not.toHaveBeenCalled();
      expect(mocks.canonicalAccountUpsert).not.toHaveBeenCalled();
      expect(mocks.profileUpdate).toHaveBeenCalledWith({
        onboarding_completed_at: expect.any(String),
      });
    });

    it("fails onboarding when legacy wallet provisioning fails", async () => {
      delete process.env.CONNECTS_CANONICAL_ACTIVE;
      mocks.legacyWalletUpsert.mockResolvedValue({ error: new Error("legacy write failed") });

      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(500);
      expect(mocks.profileUpdate).not.toHaveBeenCalled();
    });
  });

  describe("Versioned legal acceptance", () => {
    it("rejects a missing or stale version before writing account state", async () => {
      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
        termsVersion: "stale-version",
      }));

      expect(response.status).toBe(409);
      expect(mocks.termsInsert).not.toHaveBeenCalled();
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });

    it("does not complete onboarding when acceptance evidence cannot be persisted", async () => {
      mocks.termsInsert.mockResolvedValue({ error: { code: "42501", message: "write denied" } });
      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(500);
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
      expect(mocks.profileUpdate).not.toHaveBeenCalled();
    });

    it("does not duplicate evidence when the same version was already accepted", async () => {
      mocks.termsInsert.mockResolvedValue({ error: { code: "23505", message: "duplicate key" } });
      mocks.termsSelectSingle.mockResolvedValue({
        data: { accepted_at: "2026-08-21T09:30:00.000Z" },
        error: null,
      });

      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(200);
      // The original acceptance time is preserved, not restamped to "now".
      expect(mocks.profileUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          terms_version: CURRENT_TERMS_VERSION,
          terms_accepted_at: "2026-08-21T09:30:00.000Z",
        }),
        expect.anything(),
      );
    });

    it("re-consent preserves a multi-role, paid account instead of re-provisioning it", async () => {
      // The shape of the live founder account: several server-approved roles,
      // an admin role the signup form cannot express, and a paid tier.
      mocks.profileMaybeSingle.mockResolvedValue({
        data: {
          adult_eligibility_status: "confirmed",
          onboarding_completed_at: "2026-07-01T00:00:00.000Z",
          active_roles: ["broker", "owner", "buyer", "provider"],
          primary_mode: "buyer",
          role: "admin",
          subscription_tier: "universe",
        },
        error: null,
      });

      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload.reconsent).toBe(true);
      expect(payload.activeRoles).toEqual(["broker", "owner", "buyer", "provider"]);

      // The acceptance is still recorded.
      expect(mocks.termsInsert).toHaveBeenCalledOnce();
      // Nothing else is. A full upsert here would write active_roles:["buyer"],
      // role:"seeker" and subscription_tier:"starry" over the real account.
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
      expect(mocks.legacyWalletUpsert).not.toHaveBeenCalled();
      expect(mocks.canonicalRoleWalletUpsert).not.toHaveBeenCalled();
      expect(mocks.profileUpdate).toHaveBeenCalledTimes(1);
      expect(mocks.profileUpdate).toHaveBeenCalledWith({
        terms_accepted_at: expect.any(String),
        terms_version: CURRENT_TERMS_VERSION,
      });
    });

    it("reports a failed re-consent write instead of claiming acceptance", async () => {
      mocks.profileMaybeSingle.mockResolvedValue({
        data: { adult_eligibility_status: "confirmed", onboarding_completed_at: "2026-07-01T00:00:00.000Z" },
        error: null,
      });
      mocks.profileEq.mockResolvedValue({ error: { message: "write denied" } });

      const response = await POST(request({
        name: "Jane Scout",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(500);
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });

    it("records nothing for an unauthenticated caller", async () => {
      const response = await POST({
        headers: { get: () => null },
        json: async () => ({ termsVersion: CURRENT_TERMS_VERSION }),
      });

      expect(response.status).toBe(401);
      expect(mocks.termsInsert).not.toHaveBeenCalled();
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });
  });

  describe("Post-migration canonical mode (CONNECTS_CANONICAL_ACTIVE = 'true')", () => {
    beforeEach(() => {
      process.env.CONNECTS_CANONICAL_ACTIVE = "true";
    });

    it("persists one buyer/seeker role and marks complete only after canonical wallet provisioning", async () => {
      const response = await POST(request({
        name: "  Jane Scout  ",
        role: "buyer",
        dateOfBirth: "1990-01-02",
        locationFocus: "  BGC,   Makati ",
      }));

      expect(response.status).toBe(200);
      expect(mocks.profileUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          display_name: "Jane Scout",
          role: "seeker",
          active_roles: ["buyer"],
          primary_mode: "buyer",
          location_focus: "BGC, Makati",
          onboarding_completed_at: null,
        }),
        expect.anything(),
      );

      // Verifies canonical role wallet was provisioned with normalized role
      expect(mocks.canonicalRoleWalletUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          role: "seeker",
          granted_balance: 1,
        }),
        expect.anything(),
      );

      // Verifies canonical account permanent pool was provisioned
      expect(mocks.canonicalAccountUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          purchased_balance: 0,
          reward_balance: 0,
        }),
        expect.anything(),
      );

      // Verifies legacy mirror was provisioned
      expect(mocks.legacyWalletUpsert).toHaveBeenCalledOnce();

      expect(mocks.profileUpdate).toHaveBeenCalledWith({
        onboarding_completed_at: expect.any(String),
      });
    });

    it("rejects roles that are not available at initial signup", async () => {
      const response = await POST(request({
        name: "Provider",
        role: "provider",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(400);
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });

    it("requires a plausible PRC number for the broker role", async () => {
      const response = await POST(request({
        name: "Broker",
        role: "broker",
        dateOfBirth: "1990-01-02",
        prcLicense: "1234",
      }));

      expect(response.status).toBe(400);
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });

    it("does not let an explicitly underage account replace its answer", async () => {
      mocks.profileMaybeSingle.mockResolvedValue({
        data: { adult_eligibility_status: "underage" },
        error: null,
      });
      const response = await POST(request({
        name: "Retry",
        role: "buyer",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(403);
      expect(mocks.profileUpsert).not.toHaveBeenCalled();
    });

    it("does not mark onboarding complete when canonical role wallet provisioning fails", async () => {
      mocks.canonicalRoleWalletUpsert.mockResolvedValue({ error: new Error("canonical wallet unavailable") });
      const response = await POST(request({
        name: "Owner",
        role: "owner",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(500);
      expect(mocks.profileUpdate).not.toHaveBeenCalled();
    });

    it("does not mark onboarding complete when canonical account balance provisioning fails", async () => {
      mocks.canonicalAccountUpsert.mockResolvedValue({ error: new Error("canonical account unavailable") });
      const response = await POST(request({
        name: "Owner",
        role: "owner",
        dateOfBirth: "1990-01-02",
      }));

      expect(response.status).toBe(500);
      expect(mocks.profileUpdate).not.toHaveBeenCalled();
    });
  });
});
