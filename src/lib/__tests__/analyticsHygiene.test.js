import { describe, it, expect, vi } from "vitest";

// A-146 (H batch): server analytics hygiene — caller-supplied metadata is
// scrubbed before it reaches the stored JSONB column, and event types no
// report counts are rejected instead of stored as write-only rows.

const trackAnalyticsEvent = vi.fn(async () => true);
vi.mock("@/lib/monthlyScoutWrap", () => ({
  trackAnalyticsEvent: (...a) => trackAnalyticsEvent(...a),
}));

const { POST } = await import("@/app/api/analytics/route");

const post = (body) =>
  new Request("https://www.scoutit.space/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("A-146 — analytics intake stores no PII-shaped metadata", () => {
  it("strips contact details and URLs, keeps plain facts", async () => {
    trackAnalyticsEvent.mockClear();
    const res = await POST(
      post({
        eventType: "property_view",
        metadata: {
          note: "second visit",
          dwell_bucket: "long",
          count: 3,
          deep: true,
          email: "owner@example.com",
          phone: "0917 123 4567",
          link: "https://evil.example/x",
          nested: { a: 1 },
          "bad key!": "x",
        },
      }),
    );
    expect(res.status).toBe(200);
    expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect(trackAnalyticsEvent.mock.calls[0][0].metadata).toEqual({
      note: "second visit",
      dwell_bucket: "long",
      count: 3,
      deep: true,
    });
  });

  it("rejects event types no report counts instead of storing them", async () => {
    trackAnalyticsEvent.mockClear();
    for (const eventType of ["chapter_view", "contact_intent"]) {
      const res = await POST(post({ eventType }));
      expect(res.status).toBe(400);
    }
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  });
});
