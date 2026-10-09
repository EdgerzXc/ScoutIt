import { describe, it, expect, vi } from "vitest";
import { resolveServerViaAttribution, recordRoutingDecision } from "@/lib/serverViaRouting";
import { VIA_STATUS, ROUTING_REASONS } from "@/lib/viaRouting";

describe("Server-Side VIA Contact Attribution & Decision Logger (A-186)", () => {
  it("rejects resolution if essential parameters are missing", async () => {
    const res1 = await resolveServerViaAttribution(null, {});
    expect(res1.ok).toBe(false);
    expect(res1.reason).toBe("missing_parameters");

    const mockAdmin = {};
    const res2 = await resolveServerViaAttribution(mockAdmin, { propertyId: "p-1" });
    expect(res2.ok).toBe(false);
    expect(res2.reason).toBe("missing_parameters");
  });

  it("creates new attribution when share link is active and no prior attribution exists", async () => {
    const mockShareLink = {
      id: "link-123",
      property_id: "prop-1",
      promoter_id: "mariana-1",
      promoter_type: "broker",
      slug: "mariana-juan",
      status: "active",
    };

    const mockAdmin = {
      from: vi.fn((table) => {
        if (table === "via_share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockShareLink, error: null }),
          };
        }
        if (table === "via_attributions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            // Existing attribution is null
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            upsert: vi.fn().mockReturnThis(),
          };
        }
        return {};
      }),
    };

    const result = await resolveServerViaAttribution(mockAdmin, {
      propertyId: "prop-1",
      promoterSlug: "mariana-juan",
      visitorId: "vis-abc",
    });

    expect(result.ok).toBe(true);
    expect(result.viaStatus).toBe(VIA_STATUS.VALID);
    expect(result.shareLink.promoter_id).toBe("mariana-1");
  });

  it("preserves first valid attribution and does not overwrite on subsequent touch (Section 15)", async () => {
    const mockShareLink = {
      id: "link-456",
      property_id: "prop-1",
      promoter_id: "broker-b",
      slug: "broker-b",
      status: "active",
    };

    // Existing active attribution from Mariana
    const existingMariana = {
      id: "attr-mariana",
      property_id: "prop-1",
      promoter_id: "mariana-1",
      promoter_type: "broker",
      share_link_id: "link-123",
      visitor_id: "vis-abc",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      status: "active",
    };

    const mockAdmin = {
      from: vi.fn((table) => {
        if (table === "via_share_links") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: mockShareLink, error: null }),
          };
        }
        if (table === "via_attributions") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: existingMariana, error: null }),
          };
        }
        return {};
      }),
    };

    const result = await resolveServerViaAttribution(mockAdmin, {
      propertyId: "prop-1",
      promoterSlug: "broker-b",
      visitorId: "vis-abc",
    });

    expect(result.ok).toBe(true);
    expect(result.reason).toBe("existing_attribution_retained");
    // Originating promoter Mariana is strictly retained!
    expect(result.viaAttribution.promoter_id).toBe("mariana-1");
  });

  it("marks status as INVALID when share link is revoked or not found", async () => {
    const mockAdmin = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };

    const result = await resolveServerViaAttribution(mockAdmin, {
      propertyId: "prop-1",
      promoterSlug: "revoked-slug",
      visitorId: "vis-abc",
    });

    expect(result.ok).toBe(false);
    expect(result.viaStatus).toBe(VIA_STATUS.INVALID);
    expect(result.reason).toBe("share_link_not_found");
  });

  it("records immutable routing decisions to Supabase", async () => {
    const mockAdmin = {
      from: vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: "dec-uuid-1" }, error: null }),
      })),
    };

    const result = await recordRoutingDecision(mockAdmin, {
      propertyId: "prop-1",
      visitorId: "vis-1",
      selectedRecipientId: "mariana-1",
      selectedRecipientType: "broker",
      routingReason: ROUTING_REASONS.VIA_ATTRIBUTION,
      rankingSnapshot: [{ id: "mariana-1", score: 82 }, { id: "owner-1", score: 94 }],
    });

    expect(result.ok).toBe(true);
    expect(result.decisionId).toBe("dec-uuid-1");
  });
});
