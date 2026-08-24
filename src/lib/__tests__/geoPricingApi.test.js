import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// U-009 — `category` was interpolated straight into an Airtable filterByFormula:
//
//   filterByFormula=AND(Approved_For_ScoutIt=TRUE(), LOWER(SpaceCategory)=LOWER('${category}'))
//
// A single quote closes the literal and lets the caller rewrite the filter,
// including deleting the Approved_For_ScoutIt condition that is the only thing
// separating public listings from withheld ones. The route is unauthenticated.

vi.mock("@/lib/mapboxToken", () => ({
  getServerMapboxToken: () => "pk.test-token",
}));

const { POST } = await import("@/app/api/geo-pricing/route");

const request = (body) =>
  new Request("https://www.scoutit.space/api/geo-pricing", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: JSON.stringify(body),
  });

const validBody = (overrides = {}) => ({
  location: "BGC, Taguig",
  category: "commercial",
  price: 100000,
  ...overrides,
});

describe("/api/geo-pricing category handling", () => {
  let fetchSpy;

  beforeEach(() => {
    process.env.AIRTABLE_BASE_ID = "appTest";
    process.env.AIRTABLE_API_KEY = "keyTest";

    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("mapbox.com")) {
        return new Response(
          JSON.stringify({ features: [{ center: [121.05, 14.55] }] }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ records: [] }), { status: 200 });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const urlsHit = () => fetchSpy.mock.calls.map((c) => String(c[0]));

  it("rejects a category outside the known allowlist", async () => {
    const res = await POST(request(validBody({ category: "not-a-category" })));

    expect(res.status).toBe(400);
  });

  it("never lets a quote in category reach the Airtable formula", async () => {
    const injection = "commercial') , OR(1=1, LOWER('x";

    const res = await POST(request(validBody({ category: injection })));

    expect(res.status).toBe(400);
    expect(urlsHit().some((u) => u.includes("airtable.com"))).toBe(false);
  });

  it("does not spend a Mapbox geocode on a request it will reject", async () => {
    await POST(request(validBody({ category: "'; DROP" })));

    expect(urlsHit().some((u) => u.includes("mapbox.com"))).toBe(false);
  });

  it("still serves a legitimate category and keeps the approval filter intact", async () => {
    const res = await POST(request(validBody({ category: "commercial" })));

    expect(res.status).toBe(200);
    const airtableUrl = urlsHit().find((u) => u.includes("airtable.com"));
    expect(airtableUrl).toBeDefined();
    expect(decodeURIComponent(airtableUrl)).toContain("Approved_For_ScoutIt=TRUE()");
  });

  it("URL-encodes the formula so no unescaped separator reaches the query string", () => {
    // encodeURIComponent deliberately leaves "(" and ")" alone -- they are legal
    // in a query value. What it DOES encode is exactly what matters here: the
    // space, the "&", and the "=" that could otherwise start a new parameter.
    return POST(request(validBody({ category: "commercial" }))).then(() => {
      const airtableUrl = urlsHit().find((u) => u.includes("airtable.com"));
      const query = airtableUrl.split("?")[1];

      expect(query).not.toContain(" ");
      expect(query).toContain("%20");
      // One "&"-free query value: the formula must not be able to add params.
      expect(query.split("&")).toHaveLength(1);
    });
  });

  it("validates the price is a real number before doing any paid work", async () => {
    const res = await POST(request(validBody({ price: "not-a-price" })));

    expect(res.status).toBe(400);
    expect(urlsHit()).toHaveLength(0);
  });
});
