import { describe, expect, it, vi } from "vitest";
import {
  submitSpatialGenerationRequest,
  submitSpatialRevisionRequest,
  getSpatialPropertyStatus,
} from "../serverSpatialStudio";

describe("A-196 · Spatial Studio Server API Logic", () => {
  const mockUser = { id: "user-123" };
  const mockPropertyId = "prop-456";

  function createMockSupabase({ count = 2, requestId = "req-1", ownerId = mockUser.id, propertyExists = true } = {}) {
    return {
      from: vi.fn((table) => {
        if (table === "properties") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: propertyExists ? { id: mockPropertyId, owner_id: ownerId } : null,
              error: null,
            }),
            single: vi.fn().mockResolvedValue({
              data: propertyExists ? { id: mockPropertyId, owner_id: ownerId } : null,
              error: null,
            }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockResolvedValue({ count, error: null }),
          insert: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: { id: requestId }, error: null }),
          update: vi.fn().mockReturnThis(),
        };
      }),
    };
  }

  describe("submitSpatialGenerationRequest", () => {
    it("rejects unauthenticated requests", async () => {
      const res = await submitSpatialGenerationRequest({
        user: null,
        propertyId: mockPropertyId,
        stylePreset: "minimalist_organic",
      });
      expect(res.success).toBe(false);
      expect(res.code).toBe("unauthenticated");
    });

    it("rejects missing propertyId", async () => {
      const res = await submitSpatialGenerationRequest({
        user: mockUser,
        propertyId: null,
        stylePreset: "minimalist_organic",
      });
      expect(res.success).toBe(false);
      expect(res.code).toBe("missing_property");
    });

    it("rejects invalid style presets", async () => {
      const res = await submitSpatialGenerationRequest({
        user: mockUser,
        propertyId: mockPropertyId,
        stylePreset: "cyberpunk_neon",
      });
      expect(res.success).toBe(false);
      expect(res.code).toBe("invalid_style_preset");
    });

    it("approves request covered under Cluster tier allowance", async () => {
      const mockSupabase = createMockSupabase({ count: 2, requestId: "req-1" });

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        stylePreset: "minimalist_organic",
        currentTier: "cluster",
        currentConnects: 0,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("REQUESTED");
      expect(res.stylePreset).toBe("minimalist_organic");
      expect(res.coveredByTier).toBe(true);
      expect(res.connectsSpent).toBe(0);
      expect(res.targetSlaHours).toBe(48);
    });

    it("deducts 3 Connects when user exceeds monthly tier allowance", async () => {
      const mockSupabase = createMockSupabase({ count: 2, requestId: "req-2" });

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        stylePreset: "modern_executive",
        currentTier: "solar",
        currentConnects: 5,
      });

      expect(res.success).toBe(true);
      expect(res.coveredByTier).toBe(false);
      expect(res.connectsSpent).toBe(3);
    });

    it("rejects request when allowance exhausted and insufficient wallet connects", async () => {
      const mockSupabase = createMockSupabase({ count: 2 });

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        stylePreset: "tropical_luxury",
        currentTier: "solar",
        currentConnects: 1,
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("insufficient_entitlement");
      expect(res.requiresConnects).toBe(3);
    });

    it("rejects request when caller is not property owner with forbidden (IDOR protection)", async () => {
      const mockSupabase = createMockSupabase({ ownerId: "other-user-999" });

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        stylePreset: "minimalist_organic",
        currentTier: "cluster",
        currentConnects: 0,
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("forbidden");
      expect(res.error).toContain("Only the property owner");
    });

    it("rejects request when property does not exist with not_found", async () => {
      const mockSupabase = createMockSupabase({ propertyExists: false });

      const res = await submitSpatialGenerationRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: "non-existent-property",
        stylePreset: "minimalist_organic",
        currentTier: "cluster",
        currentConnects: 0,
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("not_found");
    });
  });

  describe("submitSpatialRevisionRequest", () => {
    it("rejects short or empty revision notes", async () => {
      const res = await submitSpatialRevisionRequest({
        user: mockUser,
        propertyId: mockPropertyId,
        revisionNotes: "fix",
      });
      expect(res.success).toBe(false);
      expect(res.code).toBe("invalid_revision_notes");
    });

    it("schedules express revision with 4-12h SLA", async () => {
      const mockSupabase = createMockSupabase({ requestId: "rev-101" });

      const res = await submitSpatialRevisionRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        revisionNotes: "Replace kitchen counter travertine with dark polished granite",
        targetElements: ["kitchen_counter"],
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe("REVISION_REQUESTED");
      expect(res.isExpress).toBe(true);
      expect(res.targetSlaHours).toBe(12);
      expect(res.slaLabel).toContain("4–12 Hours");
    });

    it("rejects revision when caller is not property owner with forbidden (IDOR protection)", async () => {
      const mockSupabase = createMockSupabase({ ownerId: "other-user-999" });

      const res = await submitSpatialRevisionRequest({
        supabaseClient: mockSupabase,
        user: mockUser,
        propertyId: mockPropertyId,
        revisionNotes: "Replace kitchen counter travertine with dark polished granite",
        targetElements: ["kitchen_counter"],
      });

      expect(res.success).toBe(false);
      expect(res.code).toBe("forbidden");
      expect(res.error).toContain("Only the property owner");
    });
  });

  describe("getSpatialPropertyStatus", () => {
    it("returns NONE when property has no requests", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      };

      const status = await getSpatialPropertyStatus({
        supabaseClient: mockSupabase,
        propertyId: "prop-empty",
      });

      expect(status.status).toBe("NONE");
      expect(status.stylePreset).toBe(null);
    });

    it("returns active status and materialConfig from latest request", async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              status: "LIVE",
              style_preset: "minimalist_organic",
              material_config: { flooring: "oak", partitions: "slatted_timber", lighting: "twilight" },
              is_express: false,
              target_sla_hours: 48,
              created_at: "2026-10-11T12:00:00Z",
            },
            error: null,
          }),
        }),
      };

      const status = await getSpatialPropertyStatus({
        supabaseClient: mockSupabase,
        propertyId: "prop-live",
      });

      expect(status.status).toBe("LIVE");
      expect(status.stylePreset).toBe("minimalist_organic");
      expect(status.materialConfig.flooring).toBe("oak");
    });
  });
});
