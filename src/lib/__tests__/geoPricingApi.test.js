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
vi.mock("@/lib/cmsCache", () => ({
  getCmsBundle: vi.fn(async () => ({
    source: "airtable",
    properties: [
      { spaceCategory: "Commercial", latitude: 14.55, longitude: 121.05, cat: { commercial: { rentFrom: 850 } } },
      { spaceCategory: "Commercial", latitude: 14.55, longitude: 121.05, cat: { commercial: { rentFrom: 1 } }, is_sample: true },
      { spaceCategory: "Residential", latitude: 14.55, longitude: 121.05, cat: { residential: { price: 100 } } },
    ],
  })),
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
    fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      if (String(url).includes("mapbox.com")) {
        return new Response(
          JSON.stringify({ features: [{ center: [121.05, 14.55] }] }),
          { status: 200 }
        );
      }
      throw new Error(`Unexpected network request: ${url}`);
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

  it("rejects an injected category before any network request", async () => {
    const injection = "commercial') , OR(1=1, LOWER('x";

    const res = await POST(request(validBody({ category: injection })));

    expect(res.status).toBe(400);
    expect(urlsHit()).toHaveLength(0);
  });

  it("does not spend a Mapbox geocode on a request it will reject", async () => {
    await POST(request(validBody({ category: "'; DROP" })));

    expect(urlsHit().some((u) => u.includes("mapbox.com"))).toBe(false);
  });

  it("serves a legitimate category from the approved CMS bundle", async () => {
    const res = await POST(request(validBody({ category: "commercial" })));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.compsFound).toBe(1);
    expect(urlsHit().some((u) => u.includes("airtable.com"))).toBe(false);
  });

  it("uses only exact property coordinates, not a geocoded city centroid", async () => {
    const res = await POST(request(validBody({ category: "residential" })));
    expect((await res.json()).compsFound).toBe(1);
  });

  it("validates the price is a real number before doing any paid work", async () => {
    const res = await POST(request(validBody({ price: "not-a-price" })));

    expect(res.status).toBe(400);
    expect(urlsHit()).toHaveLength(0);
  });
});
