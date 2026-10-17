import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitSpatialGenerationRequest, submitSpatialRevisionRequest } from "@/lib/serverSpatialStudio";
import { POST as deleteAccountPOST } from "@/app/api/user/delete-account/route";
import { POST as handshakePOST } from "@/app/api/deals/handshake/route";
import { GET as intelAgentGET, POST as intelAgentPOST } from "@/app/api/cron/intel-agent/route";
import * as serverAuth from "@/lib/serverAuth";
import * as adminGuard from "@/lib/adminGuard";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
  resolveServerTier: vi.fn().mockResolvedValue({ tier: "solar" }),
  assertAdultEligibility: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/adminGuard", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: { admin: { deleteUser: vi.fn().mockResolvedValue({ error: null }) } },
    rpc: vi.fn(),
  },
}));

describe("Phase 1: Critical Security & Functional Breakages Verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GAP-17: QuestIT search_catalog import and property resolution", () => {
    it("imports getCmsBundle from @/lib/cmsCache and defines valid search_catalog", async () => {
      const { getCmsBundle } = await import("@/lib/cmsCache");
      expect(typeof getCmsBundle).toBe("function");
      const questitSource = (await import("node:fs")).readFileSync("src/app/api/questit/route.js", "utf8");
      expect(questitSource).toContain("import { getCmsBundle } from '@/lib/cmsCache'");
      expect(questitSource).not.toContain("let allProps = getProperties();");
      expect(questitSource).toContain("const bundle = await getCmsBundle();");
    });
  });

  describe("GAP-24: Direct Owner-to-Buyer Handshakes (Decline party resolution)", () => {
    it("allows property owner to decline handshake when deal has no broker", async () => {
      vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("owner-user-999");

      const mockDealsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "deal-123",
            buyer_id: "buyer-user-111",
            broker_id: null,
            property_id: "prop-xyz",
          },
          error: null,
        }),
      };

      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            owner_id: "owner-user-999",
          },
          error: null,
        }),
      };

      const mockHandshakesUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // For eq chaining: .eq("deal_id", dealId).eq("status", "pending")
      mockHandshakesUpdate.eq.mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      const originalFrom = supabaseAdmin.from;
      supabaseAdmin.from = vi.fn((table) => {
        if (table === "deals") return mockDealsQuery;
        if (table === "properties") return mockPropertiesQuery;
        if (table === "deal_handshakes") return mockHandshakesUpdate;
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-123", action: "decline" }),
      });

      const res = await handshakePOST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.status).toBe("declined");

      supabaseAdmin.from = originalFrom;
    });

    it("rejects caller who is neither buyer, broker, nor property owner with 403", async () => {
      vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("stranger-user-000");

      const mockDealsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            id: "deal-123",
            buyer_id: "buyer-user-111",
            broker_id: null,
            property_id: "prop-xyz",
          },
          error: null,
        }),
      };

      const mockPropertiesQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: {
            owner_id: "owner-user-999",
          },
          error: null,
        }),
      };

      const originalFrom = supabaseAdmin.from;
      supabaseAdmin.from = vi.fn((table) => {
        if (table === "deals") return mockDealsQuery;
        if (table === "properties") return mockPropertiesQuery;
        return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
      });

      const req = new Request("https://www.scoutit.space/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: "deal-123", action: "decline" }),
      });

      const res = await handshakePOST(req);
      const json = await res.json();
      expect(res.status).toBe(403);
      expect(json.error).toContain("not a party");

      supabaseAdmin.from = originalFrom;
    });
  });

  describe("GAP-25: 3D Spatial Studio IDOR & Connects Deduction", () => {
    it("deducts Connects via spend_connects RPC when paid generation is requested", async () => {
      const rpcMock = vi.fn().mockResolvedValue({ data: [{ total_balance: 10 }], error: null });
      const mockSupabase = {
        from: vi.fn((table) => {
          if (table === "properties") {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: "user-123" } }),
              single: vi.fn().mockResolvedValue({ data: { owner_id: "user-123" } }),
              update: vi.fn().mockReturnThis(),
            };
          }
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
            insert: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: "req-paid-1" }, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }),
        rpc: rpcMock,
      };

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: { id: "user-123" },
        propertyId: "prop-owner-1",
        stylePreset: "modern_executive",
        currentTier: "solar",
        currentConnects: 5,
      });

      expect(res.success).toBe(true);
      expect(res.connectsSpent).toBe(3);
      expect(rpcMock).toHaveBeenCalledWith("spend_connects", expect.objectContaining({
        p_user_id: "user-123",
        p_amount: 3,
        p_ref_type: "spatial_generation",
        p_ref_id: "prop-owner-1",
      }));
    });

    it("rejects non-owner from requesting spatial revisions with forbidden", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { owner_id: "actual-owner-456" } }),
          single: vi.fn().mockResolvedValue({ data: { owner_id: "actual-owner-456" } }),
        }),
      };

      const res = await submitSpatialRevisionRequest({
        supabaseClient: mockSupabase,
        user: { id: "intruder-user-789" },
        propertyId: "prop-target-999",
        revisionNotes: "Unauthorized remodel of this commercial tower",
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("forbidden");
      expect(res.error).toContain("Only the property owner");
    });
  });

  describe("GAP-16: RA 10173 Account Deletion purging CRM & Blocks", () => {
    it("erases crm_contacts, crm_deal_notes, and user_blocks", async () => {
      vi.spyOn(serverAuth, "resolveUserId").mockResolvedValue("user-purge-1");
      const deletedTables = [];

      const originalFrom = supabaseAdmin.from;
      supabaseAdmin.from = vi.fn((table) => {
        deletedTables.push(table);
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      });

      const req = new Request("https://www.scoutit.space/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE MY ACCOUNT" }),
      });

      const res = await deleteAccountPOST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      expect(deletedTables).toContain("crm_contacts");
      expect(deletedTables).toContain("crm_deal_notes");
      expect(deletedTables).toContain("user_blocks");

      supabaseAdmin.from = originalFrom;
    });
  });

  describe("GAP-03: Intel-agent cron route enforcing staff/admin auth", () => {
    it("rejects non-staff user token when CRON_SECRET is absent", async () => {
      delete process.env.CRON_SECRET;
      vi.spyOn(adminGuard, "requireAdmin").mockResolvedValue({
        userId: null,
        error: "Forbidden",
        status: 403,
      });

      const req = new Request("https://www.scoutit.space/api/cron/intel-agent", {
        method: "GET",
        headers: { authorization: "Bearer regular-user-token" },
      });

      const res = await intelAgentGET(req);
      expect(res.status).toBe(503); // Fails closed due to missing CRON_SECRET and non-staff auth
    });
  });
});
