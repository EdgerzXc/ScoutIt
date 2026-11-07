import { describe, it, expect, vi, beforeEach } from "vitest";
import { canRaiseQuest, DEFAULT_POLICY, VALID_QUEST_SCOPES } from "@/lib/questitPolicyEngine";

// Mock serverAuth
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

// Mock clientIp
vi.mock("@/lib/clientIp", () => ({
  clientIp: vi.fn().mockReturnValue("127.0.0.1"),
}));

// Mock supabaseAdmin
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("A-312: QuestIT Validation, Scope Allowlist, Party Checks, Tier Enforcement & Bounty Bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  describe("canRaiseQuest Policy Engine", () => {
    it("allows valid quest within policy limits", () => {
      const res = canRaiseQuest(
        DEFAULT_POLICY,
        { bounty_connects: 100, target_field: "pricing", provider_tier: "solar" },
        { dailyBountiesRaised: 1 }
      );
      expect(res.allowed).toBe(true);
    });

    it("rejects bounty < 1 Connect", () => {
      const resZero = canRaiseQuest(null, { bounty_connects: 0 });
      expect(resZero.allowed).toBe(false);
      expect(resZero.reason).toMatch(/at least 1 Connect/i);

      const resNeg = canRaiseQuest(null, { bounty_connects: -10 });
      expect(resNeg.allowed).toBe(false);

      const resNaN = canRaiseQuest(null, { bounty_connects: "one hundred" });
      expect(resNaN.allowed).toBe(false);
    });

    it("rejects bounty exceeding default max cap (500 Connects)", () => {
      const res = canRaiseQuest(null, { bounty_connects: 501 });
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/exceeds maximum allowed cap/i);
    });

    it("respects custom max_bounty_connects policy override", () => {
      const customPolicy = { max_bounty_connects: 150 };
      const resPass = canRaiseQuest(customPolicy, { bounty_connects: 150 });
      expect(resPass.allowed).toBe(true);

      const resFail = canRaiseQuest(customPolicy, { bounty_connects: 151 });
      expect(resFail.allowed).toBe(false);
      expect(resFail.reason).toMatch(/exceeds maximum allowed cap \(150 Connects\)/i);
    });

    it("enforces allowed_provider_tiers when specified", () => {
      for (const tier of ["starry", "solar", "cluster", "universe"]) {
        const res = canRaiseQuest(null, { bounty_connects: 50, provider_tier: tier });
        expect(res.allowed).toBe(true);
      }

      const resDisallowed = canRaiseQuest(null, { bounty_connects: 50, provider_tier: "unranked" });
      expect(resDisallowed.allowed).toBe(false);
      expect(resDisallowed.reason).toMatch(/not eligible/i);
    });

    it("enforces VALID_QUEST_SCOPES allowlist on target_field / quest_scope", () => {
      for (const scope of VALID_QUEST_SCOPES) {
        const res = canRaiseQuest(null, { bounty_connects: 50, target_field: scope });
        expect(res.allowed).toBe(true);
      }

      const resJunk = canRaiseQuest(null, { bounty_connects: 50, target_field: "arbitrary_backdoor_field" });
      expect(resJunk.allowed).toBe(false);
      expect(resJunk.reason).toMatch(/not an authorized quest scope/i);
    });

    it("enforces daily bounties limit", () => {
      const res = canRaiseQuest(
        { max_daily_bounties: 3 },
        { bounty_connects: 50 },
        { dailyBountiesRaised: 3 }
      );
      expect(res.allowed).toBe(false);
      expect(res.reason).toMatch(/Exceeded maximum daily bounties/i);
    });
  });

  describe("API: /api/questit/bounty (POST)", () => {
    it("rejects unauthorized caller with 401", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce(null);

      const { POST } = await import("@/app/api/questit/bounty/route");
      const req = new Request("http://localhost/api/questit/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: "prop-1", questScope: "pricing" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("rejects invalid questScope not in VALID_QUEST_SCOPES with 400", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      resolveUserId.mockResolvedValueOnce("usr-1");

      const { POST } = await import("@/app/api/questit/bounty/route");
      const req = new Request("http://localhost/api/questit/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: "prop-1", questScope: "credit_card_records" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid questScope/i);
    });

    it("rejects non-existent property with 404", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      resolveUserId.mockResolvedValueOnce("usr-1");

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/questit/bounty/route");
      const req = new Request("http://localhost/api/questit/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: "prop-missing", questScope: "floorplan" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toMatch(/Property not found/i);
    });

    it("rejects foreign party with 403", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      resolveUserId.mockResolvedValueOnce("usr-intruder");

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prop-1", owner_id: "usr-owner" }, error: null }),
              }),
            }),
          };
        }
        if (table === "broker_representations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "member", active_roles: [] }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/questit/bounty/route");
      const req = new Request("http://localhost/api/questit/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: "prop-1", questScope: "amenities" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/must be an authorized party/i);
    });

    it("allows authorized owner to create bounty claim with payout_connects: 0", async () => {
      const { resolveUserId } = await import("@/lib/serverAuth");
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      resolveUserId.mockResolvedValueOnce("usr-owner");

      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: { id: "claim-101", target_field: "photos", property_id: "prop-1", initiator_id: "usr-owner", status: "open" },
        error: null,
      });
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prop-1", owner_id: "usr-owner" }, error: null }),
              }),
            }),
          };
        }
        if (table === "bounty_claims") {
          return { insert: mockInsert };
        }
        return {};
      });

      const { POST } = await import("@/app/api/questit/bounty/route");
      const req = new Request("http://localhost/api/questit/bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: "prop-1", questScope: "photos" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith({
        target_field: "photos",
        property_id: "prop-1",
        initiator_id: "usr-owner",
        status: "open",
        payout_connects: 0,
      });
    });
  });

  describe("API: /api/v1/questit/raise (POST)", () => {
    it("rejects unauthorized API key with 401", async () => {
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "questit_api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: { message: "Not found" } }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/v1/questit/raise/route");
      const req = new Request("http://localhost/api/v1/questit/raise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-hash",
        },
        body: JSON.stringify({ propertyId: "prop-1", targetField: "pricing", bountyConnects: 50 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("rejects unauthorized targetField with 400 before deducting Connects", async () => {
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const spendRpc = vi.fn();
      supabaseAdmin.rpc = spendRpc;

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "questit_api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { user_id: "company-1", is_active: true }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/v1/questit/raise/route");
      const req = new Request("http://localhost/api/v1/questit/raise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-hash",
        },
        body: JSON.stringify({
          propertyId: "prop-1",
          targetField: "disallowed_field_xyz",
          bountyConnects: 50,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toMatch(/Invalid targetField/i);
      expect(spendRpc).not.toHaveBeenCalled();
    });

    it("rejects non-party caller with 403 before deducting Connects", async () => {
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const spendRpc = vi.fn();
      supabaseAdmin.rpc = spendRpc;

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "questit_api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { user_id: "company-1", is_active: true }, error: null }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prop-1", owner_id: "different-owner" }, error: null }),
              }),
            }),
          };
        }
        if (table === "broker_representations") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "user_profiles") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { role: "company", active_roles: [] }, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/v1/questit/raise/route");
      const req = new Request("http://localhost/api/v1/questit/raise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-hash",
        },
        body: JSON.stringify({
          propertyId: "prop-1",
          targetField: "floorplan",
          bountyConnects: 50,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/authorized party/i);
      expect(spendRpc).not.toHaveBeenCalled();
    });

    it("rejects bounty > 500 Connects with 403 before deducting Connects", async () => {
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const spendRpc = vi.fn();
      supabaseAdmin.rpc = spendRpc;

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "questit_api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { user_id: "company-1", is_active: true }, error: null }),
              }),
            }),
          };
        }
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prop-1", owner_id: "company-1" }, error: null }),
              }),
            }),
          };
        }
        if (table === "questit_policies") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === "company_quests") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/v1/questit/raise/route");
      const req = new Request("http://localhost/api/v1/questit/raise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-hash",
        },
        body: JSON.stringify({
          propertyId: "prop-1",
          targetField: "pricing",
          bountyConnects: 501, // exceeds 500 cap
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toMatch(/exceeds maximum allowed cap/i);
      expect(spendRpc).not.toHaveBeenCalled();
    });

    it("accepts valid raise, deduces Connects atomically, inserts quest, and records balance", async () => {
      const { supabaseAdmin } = await import("@/lib/supabaseAdmin");
      const spendRpc = vi.fn().mockResolvedValue({
        data: [{ total_balance: 450 }],
        error: null,
      });
      supabaseAdmin.rpc = spendRpc;

      const mockQuestInsertSingle = vi.fn().mockResolvedValue({
        data: { id: "quest-abc", status: "open", bounty_connects: 50 },
        error: null,
      });
      const mockQuestInsertSelect = vi.fn().mockReturnValue({ single: mockQuestInsertSingle });
      const mockQuestInsert = vi.fn().mockReturnValue({ select: mockQuestInsertSelect });

      const mockProfileUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      const mockKeyUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "questit_api_keys") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { user_id: "company-1", is_active: true }, error: null }),
              }),
            }),
            update: mockKeyUpdate,
          };
        }
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: "prop-1", owner_id: "company-1" }, error: null }),
              }),
            }),
          };
        }
        if (table === "questit_policies") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        if (table === "company_quests") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                gte: vi.fn().mockResolvedValue({ count: 0, error: null }),
              }),
            }),
            insert: mockQuestInsert,
          };
        }
        if (table === "user_profiles") {
          return {
            update: mockProfileUpdate,
          };
        }
        return {};
      });

      const { POST } = await import("@/app/api/v1/questit/raise/route");
      const req = new Request("http://localhost/api/v1/questit/raise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-hash",
        },
        body: JSON.stringify({
          propertyId: "prop-1",
          targetField: "zoning",
          bountyConnects: 50,
          providerTier: "cluster",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.remaining_connects).toBe(450);
      expect(spendRpc).toHaveBeenCalledWith(
        "spend_connects",
        {
          p_user_id: "company-1",
          p_amount: 50,
          p_reason: "API Quest Raised for zoning",
          p_ref_type: "bounty",
          p_ref_id: "prop-1",
        }
      );
      expect(mockQuestInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          company_id: "company-1",
          property_id: "prop-1",
          target_field: "zoning",
          bounty_connects: 50,
          status: "open",
        }),
      ]);
    });
  });
});
