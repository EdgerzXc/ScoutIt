import { describe, it, expect, vi } from "vitest";
import {
  isBotUserAgent,
  isSelfClick,
  evaluateAntiAbuse,
  evaluateVisitQualification,
  calculateBehavioralFeedbackDelta,
  aggregateBrokerViaMetrics,
  recordQualifiedVisitTelemetry,
  QUALIFICATION_REASONS,
  DISQUALIFICATION_FLAGS,
} from "@/lib/viaTelemetry";

describe("ScoutIt VIA Telemetry & Anti-Abuse (A-186 Phase 3)", () => {
  describe("isBotUserAgent", () => {
    it("identifies search crawlers, bots, and headless browsers", () => {
      expect(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)")).toBe(true);
      expect(isBotUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/118.0.0.0 Safari/537.36")).toBe(true);
      expect(isBotUserAgent("puppeteer-extra-stealth/3.0.0")).toBe(true);
      expect(isBotUserAgent("Baiduspider+(+http://www.baidu.com/search/spider.htm)")).toBe(true);
    });

    it("allows standard human browsers", () => {
      expect(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")).toBe(false);
      expect(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1")).toBe(false);
      expect(isBotUserAgent("")).toBe(false);
      expect(isBotUserAgent(null)).toBe(false);
    });
  });

  describe("isSelfClick", () => {
    it("flags self-click when visitor user ID matches promoter user ID", () => {
      expect(
        isSelfClick({
          visitorUserId: "user-123-abc",
          promoterUserId: "user-123-abc",
        })
      ).toBe(true);
    });

    it("flags self-click case-insensitively", () => {
      expect(
        isSelfClick({
          visitorUserId: "USER-123-ABC",
          promoterUserId: "user-123-abc",
        })
      ).toBe(true);
    });

    it("flags self-click when visitor profile matches promoter ID or slug", () => {
      expect(
        isSelfClick({
          visitorId: "mariana-juan",
          promoterSlug: "mariana-juan",
        })
      ).toBe(true);
    });

    it("returns false for legitimate third-party visitors", () => {
      expect(
        isSelfClick({
          visitorId: "anon_987xyz",
          visitorUserId: "user_buyer_001",
          promoterId: "broker_mariana",
          promoterUserId: "user_broker_777",
          promoterSlug: "mariana-juan",
        })
      ).toBe(false);
    });
  });

  describe("evaluateAntiAbuse", () => {
    it("flags bots and marks isAllowed false", () => {
      const result = evaluateAntiAbuse({
        userAgent: "Googlebot/2.1",
        visitorId: "anon_1",
      });
      expect(result.isBot).toBe(true);
      expect(result.isAllowed).toBe(false);
      expect(result.flags).toContain(DISQUALIFICATION_FLAGS.BOT_CRAWLER_DISQUALIFIED);
    });

    it("flags self-clicks and marks isAllowed false", () => {
      const result = evaluateAntiAbuse({
        userAgent: "Mozilla/5.0 Chrome/120",
        visitorUserId: "broker_1",
        promoterUserId: "broker_1",
      });
      expect(result.isSelfClick).toBe(true);
      expect(result.isAllowed).toBe(false);
      expect(result.flags).toContain(DISQUALIFICATION_FLAGS.SELF_CLICK_FILTERED);
    });

    it("flags velocity spam on rapid repeat clicks", () => {
      const now = Date.now();
      const recentClicks = [now - 1000, now - 2000, now - 3000, now - 4000, now - 5000];
      const result = evaluateAntiAbuse({
        userAgent: "Mozilla/5.0 Chrome/120",
        visitorId: "anon_spammer",
        recentClickTimestamps: recentClicks,
        now,
      });
      expect(result.isVelocitySpam).toBe(true);
      expect(result.isAllowed).toBe(false);
      expect(result.flags).toContain(DISQUALIFICATION_FLAGS.VELOCITY_SPAM_FILTERED);
    });

    it("passes genuine visitor traffic", () => {
      const result = evaluateAntiAbuse({
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        visitorId: "anon_legit_client",
        promoterId: "broker_partner",
      });
      expect(result.isAllowed).toBe(true);
      expect(result.flags.length).toBe(0);
    });
  });

  describe("evaluateVisitQualification (Section 31 & 32)", () => {
    it("disqualifies immediate bounce visits under 3 seconds", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 2,
        scrollDepthPercent: 5,
      });
      expect(result.isQualified).toBe(false);
      expect(result.disqualificationFlags).toContain(DISQUALIFICATION_FLAGS.IMMEDIATE_BOUNCE);
    });

    it("disqualifies visits blocked by anti-abuse", () => {
      const antiAbuse = {
        isAllowed: false,
        flags: [DISQUALIFICATION_FLAGS.BOT_CRAWLER_DISQUALIFIED],
      };
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 45,
        scrollDepthPercent: 80,
        antiAbuseResult: antiAbuse,
      });
      expect(result.isQualified).toBe(false);
      expect(result.disqualificationFlags).toContain(DISQUALIFICATION_FLAGS.BOT_CRAWLER_DISQUALIFIED);
    });

    it("rejects shallow browsing under 15 seconds without interactions", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 10,
        scrollDepthPercent: 15,
      });
      expect(result.isQualified).toBe(false);
      expect(result.disqualificationFlags).toContain(DISQUALIFICATION_FLAGS.INSUFFICIENT_ENGAGEMENT);
    });

    it("qualifies substantive dwell (>=15s) and scroll (>=30%)", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 25,
        scrollDepthPercent: 60,
      });
      expect(result.isQualified).toBe(true);
      expect(result.reasons).toContain(QUALIFICATION_REASONS.ENGAGED_DWELL_AND_SCROLL);
      expect(result.qualificationScore).toBeGreaterThan(25);
    });

    it("qualifies substantive dwell when units or tools are inspected", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 18,
        scrollDepthPercent: 10,
        interactedWithUnits: true,
        usedTools: true,
      });
      expect(result.isQualified).toBe(true);
      expect(result.reasons).toContain(QUALIFICATION_REASONS.INTERACTED_WITH_UNITS);
      expect(result.reasons).toContain(QUALIFICATION_REASONS.USED_VALUATION_TOOLS);
    });

    it("immediately qualifies explicit inquiry intent", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 5,
        openedInquiry: true,
      });
      expect(result.isQualified).toBe(true);
      expect(result.reasons).toContain(QUALIFICATION_REASONS.INQUIRY_INITIATED);
    });

    it("qualifies returned visitors with >=10s dwell", () => {
      const result = evaluateVisitQualification({
        dwellTimeSeconds: 12,
        returnedVisit: true,
      });
      expect(result.isQualified).toBe(true);
      expect(result.reasons).toContain(QUALIFICATION_REASONS.QUALIFIED_RETURNED_VISITOR);
    });
  });

  describe("calculateBehavioralFeedbackDelta (Section 33 & 34)", () => {
    it("never rewards raw traffic alone without authentic outcomes", () => {
      const result = calculateBehavioralFeedbackDelta({
        qualifiedVisits: 500,
        inquiriesInitiated: 0,
        inquiriesAccepted: 0,
        dealsClosed: 0,
      });
      expect(result.behavioralScoreDelta).toBe(0);
      expect(result.status).toBe("NEUTRAL");
    });

    it("rewards responsive brokers with high inquiry response rates", () => {
      const result = calculateBehavioralFeedbackDelta({
        qualifiedVisits: 100,
        inquiriesInitiated: 10,
        inquiriesAccepted: 9,
        dealsClosed: 0,
      });
      expect(result.behavioralScoreDelta).toBe(2.5);
      expect(result.status).toBe("POSITIVE");
    });

    it("penalizes brokers who ignore or ghost inbound VIA inquiries", () => {
      const result = calculateBehavioralFeedbackDelta({
        qualifiedVisits: 100,
        inquiriesInitiated: 10,
        inquiriesAccepted: 2, // 20% response rate
        dealsClosed: 0,
      });
      expect(result.behavioralScoreDelta).toBe(-3.0);
      expect(result.status).toBe("ATTENTION_REQUIRED");
    });

    it("awards positive standing for completed VIA transactions", () => {
      const result = calculateBehavioralFeedbackDelta({
        qualifiedVisits: 50,
        inquiriesInitiated: 5,
        inquiriesAccepted: 5,
        dealsClosed: 2,
      });
      // 2.5 for response rate + 4.0 for 2 deals
      expect(result.behavioralScoreDelta).toBe(6.5);
      expect(result.status).toBe("POSITIVE");
    });

    it("throttles standing gains when traffic contains elevated bot ratio", () => {
      const result = calculateBehavioralFeedbackDelta({
        qualifiedVisits: 50,
        inquiriesInitiated: 5,
        inquiriesAccepted: 5,
        dealsClosed: 2,
        botDisqualifiedRatio: 0.65, // > 50% bots
      });
      expect(result.behavioralScoreDelta).toBeLessThanOrEqual(0);
      expect(result.feedbackNotes.some((n) => n.includes("Elevated crawler/bot ratio"))).toBe(true);
    });
  });

  describe("aggregateBrokerViaMetrics", () => {
    it("accurately computes the multi-stage conversion funnel", () => {
      const attributions = [
        { visitor_id: "v1", is_qualified: true },
        { visitor_id: "v2", is_qualified: true },
        { visitor_id: "v3", is_qualified: false },
        { visitor_id: "v4", is_qualified: true },
        { visitor_id: "v1", is_qualified: true }, // duplicate visitor
      ];

      const routingDecisions = [
        { routing_reason: "VIA_ATTRIBUTION" },
        { routing_reason: "VIA_ATTRIBUTION" },
        { routing_reason: "SCOUTIT_RANKING" },
      ];

      const deals = [
        { status: "in_progress", stage: "viewing" },
        { status: "completed", stage: "closed" },
      ];

      const clicks = [
        { user_agent: "Mozilla/5.0", is_bot: false },
        { user_agent: "Mozilla/5.0", is_bot: false },
        { user_agent: "Mozilla/5.0", is_bot: false },
        { user_agent: "Mozilla/5.0", is_bot: false },
        { user_agent: "Googlebot/2.1", is_bot: true },
        { user_agent: "Mozilla/5.0", is_self_click: true },
      ];

      const metrics = aggregateBrokerViaMetrics({
        attributions,
        routingDecisions,
        deals,
        clicks,
      });

      expect(metrics.funnel.rawClicks).toBe(6);
      expect(metrics.funnel.filteredClicks).toBe(4);
      expect(metrics.funnel.uniqueVisitors).toBe(4);
      expect(metrics.funnel.qualifiedVisits).toBe(4);
      expect(metrics.funnel.inquiriesInitiated).toBe(2);
      expect(metrics.funnel.inquiriesAccepted).toBe(2);
      expect(metrics.funnel.viewingsScheduled).toBe(2);
      expect(metrics.funnel.dealsClosed).toBe(1);

      expect(metrics.antiAbuse.botClicksFiltered).toBe(1);
      expect(metrics.antiAbuse.selfClicksFiltered).toBe(1);

      expect(metrics.conversionRates.qualificationRate).toBe(1); // 4 / 4
      expect(metrics.conversionRates.inquiryRate).toBe(0.5); // 2 / 4
      expect(metrics.conversionRates.closeRate).toBe(0.5); // 1 / 2
    });
  });

  describe("recordQualifiedVisitTelemetry", () => {
    it("returns safely if visitor is not qualified", async () => {
      const mockSupabase = { from: vi.fn() };
      const res = await recordQualifiedVisitTelemetry(mockSupabase, {
        propertyId: "prop-1",
        visitorId: "vis-1",
        qualificationResult: { isQualified: false },
      });
      expect(res.ok).toBe(true);
      expect(res.updated).toBe(false);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it("updates via_attributions when visit is qualified", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
      const mockSupabase = { from: mockFrom };

      const res = await recordQualifiedVisitTelemetry(mockSupabase, {
        propertyId: "prop-1",
        visitorId: "vis-1",
        qualificationResult: { isQualified: true },
      });

      expect(res.ok).toBe(true);
      expect(res.updated).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("via_attributions");
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ is_qualified: true })
      );
    });

    it("handles unmigrated tables or database errors gracefully without throwing", async () => {
      const mockEq2 = vi.fn().mockResolvedValue({ error: { message: "relation does not exist" } });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
      const mockSupabase = { from: mockFrom };

      const res = await recordQualifiedVisitTelemetry(mockSupabase, {
        propertyId: "prop-1",
        visitorId: "vis-1",
        qualificationResult: { isQualified: true },
      });

      expect(res.ok).toBe(true);
      expect(res.updated).toBe(false);
      expect(res.fallback).toBe(true);
    });
  });
});
