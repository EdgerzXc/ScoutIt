import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";

const state = vi.hoisted(() => ({
  unitRollbacks: [],
  dealUpdates: [],
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "owner-1" } }, error: null }),
    },
  }),
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => "owner-1",
}));

vi.mock("@/lib/unitsSync", () => ({
  syncPropertyUnitsToAirtable: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/notifications", () => ({
  notifyAttachedBrokers: vi.fn(async () => true),
  notifyUser: vi.fn(async () => true),
}));

vi.mock("@/lib/crmActivity", () => ({
  logActivity: vi.fn(async () => true),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (table) => {
      if (table === "user_profiles") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  role: "owner",
                  active_roles: ["owner"],
                  provider_type: null,
                  subscription_tier: "starry",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "user_connect_wallets") {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: "w-owner", user_id: "owner-1", role: "owner", granted_balance: 1, granted_month: currentMonth },
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
              maybeSingle: async () => ({
                data: { purchased_balance: 2, reward_balance: 0 },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "connect_balances") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { user_id: "owner-1" }, error: null }),
            }),
          }),
        };
      }
      if (table === "deals") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "deal-1", property_id: "prop-1", buyer_id: "op-1", unit_id: null, status: "pending", pitch_message: "Operate" },
                error: null,
              }),
            }),
          }),
          update: (payload) => ({
            eq: async () => {
              state.dealUpdates.push(payload);
              return { error: { message: "simulated deal write failure" } };
            },
          }),
        };
      }
      if (table === "properties") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "prop-1", owner_id: "owner-1", slug: "tower-1", canonical_slug: "tower-1", title: "Tower 1", pipeline_status: "approved" },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "property_units") {
        return {
          select: () => ({
            in: async () => ({
              data: [{ id: "unit-1", property_id: "prop-1", operator_id: null }],
              error: null,
            }),
          }),
          update: (payload) => ({
            in: async () => ({ error: null }),
            eq: async (col, val) => {
              state.unitRollbacks.push({ col, val, operator_id: payload.operator_id });
              return { error: null };
            },
          }),
        };
      }
      return {
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      };
    },
  },
}));

const { GET: getWallet } = await import("@/app/api/wallet/route");
const { POST: delegateUnits } = await import("@/app/api/dashboard/units/delegate/route");

beforeEach(() => {
  state.unitRollbacks = [];
  state.dealUpdates = [];
});

describe("Connects, Claims & Property Handoff logic fixes", () => {
  it("resolves GET /api/wallet?role=operator to the owner wallet matching /api/deals/initiate", async () => {
    const res = await getWallet(new Request("https://www.scoutit.space/api/wallet?role=operator"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.role).toBe("owner");
    expect(body.balance).toBe(3);
  });

  it("does not emit broken /dashboard/inventory?claim= route in /claim/[token]", () => {
    const claimPage = fs.readFileSync(path.resolve("src/app/claim/[token]/page.js"), "utf8");
    expect(claimPage).not.toContain("/dashboard/inventory?");
    expect(claimPage).toContain("/property/${encodeURIComponent(publicSlug)}?claim=1");
  });

  it("migrates all 4 remaining Connects spend callers to spend_connects_atomic", () => {
    for (const rel of [
      "src/app/api/dashboard/invite/route.js",
      "src/app/api/community/signals/[id]/connect/route.js",
      "src/app/api/v1/questit/raise/route.js",
      "src/lib/serverSpatialStudio.js",
    ]) {
      const src = fs.readFileSync(path.resolve(rel), "utf8");
      expect(src, `${rel} must call spend_connects_atomic`).toContain("spend_connects_atomic");
      expect(src, `${rel} must not call legacy spend_connects`).not.toMatch(/\.rpc\(\s*['"]spend_connects['"]/);
    }
  });

  it("rolls back property_units.operator_id when updating the deal fails in POST /api/dashboard/units/delegate", async () => {
    const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const origKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test-key";
    try {
      const res = await delegateUnits(
        new Request("https://www.scoutit.space/api/dashboard/units/delegate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-token",
          },
          body: JSON.stringify({ dealId: "deal-1", unitIds: ["unit-1"], action: "accept" }),
        })
      );
      expect(res.status).toBe(500);
      expect(state.unitRollbacks).toEqual([{ col: "id", val: "unit-1", operator_id: null }]);
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = origKey;
    }
  });
});
