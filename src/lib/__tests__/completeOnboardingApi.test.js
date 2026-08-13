import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  profileUpsert: vi.fn(),
  profileUpdate: vi.fn(),
  profileEq: vi.fn(),
  walletUpsert: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: mocks.getUser } }),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "connect_balances") return { upsert: mocks.walletUpsert };
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
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    mocks.profileMaybeSingle.mockResolvedValue({ data: null, error: null });
    mocks.profileUpsert.mockResolvedValue({ error: null });
    mocks.walletUpsert.mockResolvedValue({ error: null });
    mocks.profileEq.mockResolvedValue({ error: null });
    mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
  });

  it("persists one buyer/seeker role and marks complete only after wallet provisioning", async () => {
    const response = await POST(request({
      name: "  Jane Scout  ",
      role: "buyer",
      dateOfBirth: "1990-01-02",
      locationFocus: "  BGC,   Makati ",
    }));

    expect(response.status).toBe(200);
    expect(mocks.profileUpsert).toHaveBeenCalledWith(expect.objectContaining({
      display_name: "Jane Scout",
      role: "seeker",
      active_roles: ["buyer"],
      primary_mode: "buyer",
      location_focus: "BGC, Makati",
      onboarding_completed_at: null,
    }));
    expect(mocks.walletUpsert).toHaveBeenCalledOnce();
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
  it("does not mark onboarding complete when wallet provisioning fails", async () => {
    mocks.walletUpsert.mockResolvedValue({ error: new Error("wallet unavailable") });
    const response = await POST(request({
      name: "Owner",
      role: "owner",
      dateOfBirth: "1990-01-02",
    }));

    expect(response.status).toBe(500);
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
  });
});
