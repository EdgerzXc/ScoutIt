import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isUrlOnHost } from "../../../scripts/test-url-hosts.mjs";

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

const { POST, parseGeoPrice, getComparablePrice } = await import("@/app/api/geo-pricing/route");

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
      if (isUrlOnHost(url, "api.mapbox.com")) {
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

    expect(urlsHit().some((u) => isUrlOnHost(u, "api.mapbox.com"))).toBe(false);
  });

  it("serves a legitimate category from the approved CMS bundle", async () => {
    const res = await POST(request(validBody({ category: "commercial" })));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.compsFound).toBe(1);
    expect(urlsHit().some((u) => isUrlOnHost(u, "api.airtable.com"))).toBe(false);
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

  describe("A-300: price parsing, unit separation, and adaptive radius", () => {
    it("parseGeoPrice parses the five required inputs and rejects shorthand suffixes", () => {
      expect(parseGeoPrice("₱185,000")).toBe(185000);
      expect(parseGeoPrice("Php 185,000")).toBe(185000);
      expect(parseGeoPrice("180,000")).toBe(180000);
      expect(parseGeoPrice(180000)).toBe(180000);
      expect(parseGeoPrice("Php 12.5M")).toBeNull();
      expect(parseGeoPrice("45k")).toBeNull();
      expect(parseGeoPrice("not-a-price")).toBeNull();
    });

    it("separates commercial rentPerSqm from total rent in getComparablePrice", () => {
      const mixedProperty = {
        cat: {
          commercial: {
            rentFrom: 180000,
            rentPerSqm: 850,
          },
        },
      };

      // Total rent query gets rentFrom
      expect(getComparablePrice("commercial", mixedProperty, "total")).toBe(180000);
      // Sqm rent query gets rentPerSqm
      expect(getComparablePrice("commercial", mixedProperty, "sqm")).toBe(850);
    });

    it("computes accurate percentageDiff for ₱185,000 target vs ₱180,000 comparable comp", async () => {
      const { getCmsBundle } = await import("@/lib/cmsCache");
      getCmsBundle.mockResolvedValueOnce({
        source: "airtable",
        properties: [
          {
            spaceCategory: "Commercial",
            latitude: 14.55,
            longitude: 121.05,
            cat: { commercial: { rentFrom: 180000 } },
          },
        ],
      });

      const res = await POST(request(validBody({ category: "commercial", price: "₱185,000" })));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.compsFound).toBe(1);
      expect(data.averagePrice).toBe(180000);
      // ((185000 - 180000) / 180000) * 100 = 2.777...%
      expect(data.percentageDiff).toBeCloseTo(2.778, 2);
      expect(data.radiusScope).toBe("address");
      expect(data.priceUnit).toBe("total");
    });

    it("adaptive radius falls back to district radius when comps are outside 1.5km", async () => {
      const { getCmsBundle } = await import("@/lib/cmsCache");
      // Property located ~3.3km away (lat: 14.58 vs center 14.55)
      getCmsBundle.mockResolvedValueOnce({
        source: "airtable",
        properties: [
          {
            spaceCategory: "Commercial",
            latitude: 14.58,
            longitude: 121.05,
            cat: { commercial: { rentFrom: 200000 } },
          },
        ],
      });

      const res = await POST(request(validBody({ category: "commercial", price: 200000 })));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.compsFound).toBe(1);
      expect(data.radiusKm).toBe(5);
      expect(data.radiusScope).toBe("district");
    });
  });
});
