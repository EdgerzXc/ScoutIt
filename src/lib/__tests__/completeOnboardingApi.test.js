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
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "user_connect_wallets") return { upsert: mocks.canonicalRoleWalletUpsert };
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

import { POST } from "@/app/api/auth/complete-onboarding/route";

function request(body) {
  return {
    headers: { get: () => "Bearer valid-token" },
    json: async () => body,
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
