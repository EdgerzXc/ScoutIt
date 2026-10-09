import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server dependencies before imports
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(),
}));

vi.mock("@/lib/clientIp", () => ({
  clientIp: vi.fn(() => "127.0.0.1"),
}));

import { POST as telemetryPost } from "@/app/api/property/[id]/via/telemetry/route";
import { GET as metricsGet } from "@/app/api/broker/via-metrics/route";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

describe("ScoutIt VIA Telemetry & Broker Metrics API Endpoints", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/property/[id]/via/telemetry", () => {
    it("evaluates and qualifies genuine visitor engagement", async () => {
      // Mock Supabase property lookup
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "prop-uuid-123" },
        error: null,
      });
      const mockOr = vi.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      // Mock via_attributions update
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") return { select: mockSelect };
        if (table === "via_attributions") return { update: mockUpdate };
        return {};
      });

      const request = new Request("http://localhost:3000/api/property/one-ecom/via/telemetry", {
        method: "POST",
        headers: {
          "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          visitorId: "vis_real_customer",
          promoterSlug: "mariana-juan",
          dwellTimeSeconds: 32,
          scrollDepthPercent: 75,
          interactedWithUnits: true,
        }),
      });

      const response = await telemetryPost(request, { params: Promise.resolve({ id: "one-ecom" }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.isQualified).toBe(true);
      expect(json.qualificationScore).toBeGreaterThan(40);
      expect(json.reasons).toContain("INTERACTED_WITH_UNITS");
      expect(json.reasons).toContain("ENGAGED_DWELL_AND_SCROLL");

      // Verify DB update was triggered
      expect(supabaseAdmin.from).toHaveBeenCalledWith("via_attributions");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_qualified: true })
      );
    });

    it("disqualifies bot crawlers without saving to DB", async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: "prop-uuid-123" },
        error: null,
      });
      const mockOr = vi.fn().mockReturnValue({ maybeSingle: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "properties") return { select: mockSelect };
        return {};
      });

      const request = new Request("http://localhost:3000/api/property/one-ecom/via/telemetry", {
        method: "POST",
        headers: {
          "user-agent": "Googlebot/2.1 (+http://www.google.com/bot.html)",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          visitorId: "googlebot_crawler",
          dwellTimeSeconds: 60,
          scrollDepthPercent: 100,
        }),
      });

      const response = await telemetryPost(request, { params: Promise.resolve({ id: "one-ecom" }) });
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.isQualified).toBe(false);
      expect(json.disqualificationFlags).toContain("BOT_CRAWLER_DISQUALIFIED");
    });
  });

  describe("GET /api/broker/via-metrics", () => {
    it("returns 401 for unauthenticated callers", async () => {
      resolveUserId.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/broker/via-metrics");
      const response = await metricsGet(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.ok).toBe(false);
    });

    it("computes full funnel and property breakdown for authenticated broker", async () => {
      resolveUserId.mockResolvedValue("broker-uuid-999");

      const mockShareLinks = [
        {
          id: "link-1",
          property_id: "prop-uuid-1",
          slug: "mariana-onee",
          status: "active",
          clicks_count: 12,
        },
      ];

      const mockAttributions = [
        { id: "a1", property_id: "prop-uuid-1", visitor_id: "v1", is_qualified: true },
        { id: "a2", property_id: "prop-uuid-1", visitor_id: "v2", is_qualified: true },
        { id: "a3", property_id: "prop-uuid-1", visitor_id: "v3", is_qualified: false },
      ];

      const mockDecisions = [
        { id: "d1", property_id: "prop-uuid-1", routing_reason: "VIA_ATTRIBUTION" },
      ];

      const mockDeals = [
        { id: "deal-1", property_id: "prop-uuid-1", status: "completed", stage: "closed" },
      ];

      supabaseAdmin.from.mockImplementation((table) => {
        if (table === "via_share_links") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockShareLinks, error: null }),
            }),
          };
        }
        if (table === "via_attributions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockAttributions, error: null }),
            }),
          };
        }
        if (table === "via_routing_decisions") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockDecisions, error: null }),
            }),
          };
        }
        if (table === "deals") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: mockDeals, error: null }),
            }),
          };
        }
        return {};
      });

      const request = new Request("http://localhost:3000/api/broker/via-metrics");
      const response = await metricsGet(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.ok).toBe(true);
      expect(json.summary.uniqueVisitors).toBe(3);
      expect(json.summary.qualifiedVisits).toBe(2);
      expect(json.summary.inquiriesInitiated).toBe(1);
      expect(json.summary.dealsClosed).toBe(1);

      expect(json.propertyBreakdown.length).toBe(1);
      expect(json.propertyBreakdown[0].propertyId).toBe("prop-uuid-1");
      expect(json.propertyBreakdown[0].qualifiedVisits).toBe(2);
      expect(json.propertyBreakdown[0].inquiries).toBe(1);
      expect(json.propertyBreakdown[0].deals).toBe(1);

      // Verify standing delta calculation
      expect(json.behavioralFeedback.status).toBe("POSITIVE");
      expect(json.behavioralFeedback.behavioralScoreDelta).toBeGreaterThan(0);
    });
  });
});
