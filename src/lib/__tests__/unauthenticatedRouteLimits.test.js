import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A-012 — src/lib/rateLimit.js was written, tested, and wired into exactly two
// of 95 API routes. These are the routes that are reachable without an account
// AND cost real money per call: Gemini tokens, Mapbox geocodes, Airtable reads,
// database rows. A meter on them is a spend ceiling, not a latency tweak.

vi.mock("@/lib/mapboxToken", () => ({ getServerMapboxToken: () => "pk.test" }));
vi.mock("@/lib/featureFlags", () => ({ isPreLaunchFreeMode: async () => true }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => null }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: null }));
vi.mock("@/lib/monthlyScoutWrap", () => ({ trackAnalyticsEvent: async () => ({}) }));
vi.mock("@/lib/propertyLookup", () => ({ findProperty: async () => null }));

const promote = await import("@/app/api/ai/promote/route");
const geoPricing = await import("@/app/api/geo-pricing/route");
const analytics = await import("@/app/api/analytics/route");

const post = (path, body, ip, extraHeaders = {}) =>
  new Request(`https://www.scoutit.space${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });

/** Fire `n` requests from one identity and return the status codes. */
async function flood(handler, makeRequest, n) {
  const statuses = [];
  for (let i = 0; i < n; i += 1) {
    statuses.push((await handler(makeRequest())).status);
  }
  return statuses;
}

describe("unauthenticated, paid routes are metered", () => {
  beforeEach(() => {
    process.env.AIRTABLE_BASE_ID = "appTest";
    process.env.AIRTABLE_API_KEY = "keyTest";
    delete process.env.GEMINI_API_KEY; // exercise the deterministic path
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("mapbox.com")) {
        return new Response(JSON.stringify({ features: [{ center: [121, 14.5] }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("meters /api/ai/promote, the most expensive anonymous path in the app", async () => {
    const ip = "203.0.113.11";
    const statuses = await flood(
      promote.POST,
      () => post("/api/ai/promote", { property: { title: "Tower" }, link: "https://x" }, ip, { "x-skip-ai": "1" }),
      60
    );

    expect(statuses).toContain(429);
  });

  it("meters /api/geo-pricing so a loop cannot bill Mapbox and Airtable", async () => {
    const ip = "203.0.113.12";
    const statuses = await flood(
      geoPricing.POST,
      () => post("/api/geo-pricing", { location: "BGC", category: "commercial", price: 1000 }, ip),
      60
    );

    expect(statuses).toContain(429);
  });

  it("meters /api/analytics so an anonymous write loop is bounded", async () => {
    const ip = "203.0.113.13";
    const statuses = await flood(
      analytics.POST,
      () => post("/api/analytics", { eventType: "property_view", propertySlug: "x" }, ip),
      200
    );

    expect(statuses).toContain(429);
  });

  it("a 429 tells the caller when to retry", async () => {
    const ip = "203.0.113.14";
    let limited = null;
    for (let i = 0; i < 60 && !limited; i += 1) {
      const res = await geoPricing.POST(
        post("/api/geo-pricing", { location: "BGC", category: "commercial", price: 1000 }, ip)
      );
      if (res.status === 429) limited = res;
    }

    expect(limited).not.toBeNull();
    // Without this header the client can only guess, and guessing clients retry
    // immediately, which is how a meter turns into a busy-loop.
    expect(Number(limited.headers.get("Retry-After"))).toBeGreaterThan(0);
  });

  it("does not meter one caller into another caller's budget", async () => {
    // Fixed-window limiters keyed on a shared value (a header everyone sends,
    // a constant) silently become a global kill switch. Distinct IPs must not
    // share a bucket.
    const first = await flood(
      geoPricing.POST,
      () => post("/api/geo-pricing", { location: "BGC", category: "commercial", price: 1000 }, "203.0.113.21"),
      40
    );
    expect(first).toContain(429);

    const fresh = await geoPricing.POST(
      post("/api/geo-pricing", { location: "BGC", category: "commercial", price: 1000 }, "203.0.113.22")
    );
    expect(fresh.status).not.toBe(429);
  });
});
