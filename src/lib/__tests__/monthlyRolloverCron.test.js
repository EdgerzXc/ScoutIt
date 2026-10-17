import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleMonthlyRollover } from "@/app/api/cron/monthly-rollover/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: vi.fn(), rpc: vi.fn() },
}));

const CRON_SECRET = "test_cron_secret_123";

describe("Monthly rollover cron handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = CRON_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects unauthorized cron requests with 401", async () => {
    const req = new Request("https://www.scoutit.space/api/cron/monthly-rollover", {
      headers: { authorization: "Bearer wrong_secret" },
    });
    const res = await handleMonthlyRollover(req);
    expect(res.status).toBe(401);
  });

  it("executes wallet token sweep and pre-generates monthly wraps cleanly", async () => {
    supabaseAdmin.rpc = vi.fn().mockImplementation((fnName) => {
      if (fnName === "sweep_monthly_token_rollover") {
        return Promise.resolve({
          data: [{ rolled_over_count: 5, target_month: "2026-10" }],
          error: null,
        });
      }
      if (fnName === "generate_monthly_scout_wrap") {
        return Promise.resolve({ data: { success: true }, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === "properties") {
        return {
          select: () => ({
            not: () => ({
              limit: () => Promise.resolve({ data: [{ owner_id: "owner_1" }, { owner_id: "owner_2" }] }),
            }),
          }),
        };
      }
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              limit: () => Promise.resolve({ data: [{ id: "broker_1" }] }),
            }),
          }),
        };
      }
      return {};
    });

    const req = new Request("https://www.scoutit.space/api/cron/monthly-rollover", {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });

    const res = await handleMonthlyRollover(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.rolledOverWallets).toBe(5);
    expect(json.wrapsGenerated).toBe(3); // 2 owners + 1 broker
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
      "sweep_monthly_token_rollover",
      expect.objectContaining({ p_month: expect.any(String) })
    );
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("generate_monthly_scout_wrap", {
      p_entity_type: "owner_portfolio",
      p_entity_id: "owner_1",
      p_period_month: expect.any(String),
    });
    expect(supabaseAdmin.rpc).toHaveBeenCalledWith("generate_monthly_scout_wrap", {
      p_entity_type: "broker",
      p_entity_id: "broker_1",
      p_period_month: expect.any(String),
    });
  });
});
