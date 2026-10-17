import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/wallet/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const USER_ID = "usr_test_123";

describe("GET /api/wallet endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(USER_ID);
  });

  it("returns 401 when unauthenticated", async () => {
    vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue(null);
    const req = new Request("https://www.scoutit.space/api/wallet");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid role", async () => {
    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "user_profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { role: "seeker" } }) }) }),
        };
      }
      return {};
    });

    const req = new Request("https://www.scoutit.space/api/wallet?role=unsupported_role");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns authoritative wallet balance for user with active wallet", async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "user_profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { role: "broker", subscription_tier: "cluster" } }) }) }),
        };
      }
      if (table === "user_connect_wallets") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: "w_1", granted_balance: 18, granted_month: currentMonth },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "user_connect_accounts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { purchased_balance: 10, reward_balance: 5 },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("https://www.scoutit.space/api/wallet?role=broker");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.granted).toBe(18);
    expect(json.purchased).toBe(10);
    expect(json.reward).toBe(5);
    expect(json.balance).toBe(33); // 18 + 10 + 5
    expect(json.role).toBe("broker");
    expect(json.tier).toBe("cluster");
  });

  it("resets granted_balance when granted_month is stale (calendar rollover)", async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const updateSpy = vi.fn().mockReturnValue({
      eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: { id: "w_1", granted_balance: 20, granted_month: currentMonth } }) }) }),
    });

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "user_profiles") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { role: "broker", subscription_tier: "cluster" } }) }) }),
        };
      }
      if (table === "user_connect_wallets") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({
                  data: { id: "w_1", granted_balance: 0, granted_month: "2026-01" }, // stale!
                  error: null,
                }),
              }),
            }),
          }),
          update: updateSpy,
        };
      }
      if (table === "user_connect_accounts") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => Promise.resolve({
                data: { purchased_balance: 0, reward_balance: 0 },
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("https://www.scoutit.space/api/wallet?role=broker");
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        granted_balance: 20, // cluster broker allowance
        granted_month: currentMonth,
      })
    );
  });
});
