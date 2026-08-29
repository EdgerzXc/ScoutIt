import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  ALL_PREMIUM_FIELDS,
  findPremiumLeak,
  stripPremiumFields,
} from "../premiumFields";

const cmsRoute = readFileSync("src/app/api/cms/route.js", "utf8");

const property = (overrides = {}) => ({
  id: "rec1",
  slug: "cyber-sigma-tower-3",
  title: "Cyber Sigma Tower 3",
  ...overrides,
});

describe("A-053 hardening — premium leak guard", () => {
  it("passes a correctly stripped catalogue", () => {
    const stripped = [
      property({ deepIntel: { capRate: 7.1 }, floorPlans: ["a.pdf"] }),
      property({ id: "rec2", slug: "two", matterportTourUrl: "https://x" }),
    ].map((p) => stripPremiumFields(p, "starry"));

    expect(findPremiumLeak(stripped)).toBeNull();
  });

  it("catches every gated field individually", () => {
    for (const field of ALL_PREMIUM_FIELDS) {
      const leaked = [property({ [field]: "https://leaked.example/asset" })];
      expect(findPremiumLeak(leaked), `${field} went undetected`)
        .toEqual({ slug: "cyber-sigma-tower-3", field });
    }
  });

  it("catches a leak on any property, not just the first", () => {
    const rows = [
      stripPremiumFields(property({ deepIntel: { a: 1 } }), "starry"),
      stripPremiumFields(property({ id: "rec2", slug: "two" }), "starry"),
      property({ id: "rec3", slug: "three", luma3dMapUrl: "https://leak" }),
    ];
    expect(findPremiumLeak(rows)).toEqual({ slug: "three", field: "luma3dMapUrl" });
  });

  it("treats empty shapes as safe, since that is what stripping leaves", () => {
    expect(findPremiumLeak([property({ deepIntel: {}, floorPlans: [], virtual_tour_url: "" })]))
      .toBeNull();
  });

  it("survives malformed rows instead of throwing on a live request", () => {
    expect(findPremiumLeak([null, undefined, "nonsense", 42])).toBeNull();
    expect(findPremiumLeak(null)).toBeNull();
    expect(findPremiumLeak(undefined)).toBeNull();
  });

  it("names an unidentifiable property rather than throwing", () => {
    expect(findPremiumLeak([{ deepIntel: { a: 1 } }]))
      .toEqual({ slug: "unknown", field: "deepIntel" });
  });
});

describe("A-053 hardening — the route wiring", () => {
  it("checks for a leak before deciding the response is cacheable", () => {
    expect(cmsRoute).toContain("const leak = publicScope ? findPremiumLeak(gated) : null;");
    expect(cmsRoute).toContain("const cacheable = publicScope && !leak;");
    expect(cmsRoute).toContain("headers: cacheable");
    // The check must come after stripping, or it proves nothing.
    expect(cmsRoute.indexOf("stripPremiumFields(p, tier)"))
      .toBeLessThan(cmsRoute.indexOf("findPremiumLeak(gated)"));
  });

  it("says so loudly rather than failing silently", () => {
    expect(cmsRoute).toContain("Refusing to cache");
    expect(cmsRoute).toContain("console.error");
  });

  it("does not disclose the backing store or its health to the public", () => {
    // Internally source carries "airtable", "upstash_redis", "supabase_osint"
    // and "empty_fallback_on_error". None of that belongs on a public endpoint.
    expect(cmsRoute).toContain('const PUBLIC_SOURCE_RADIUS = "radius"');
    expect(cmsRoute).toContain('const PUBLIC_SOURCE_CATALOG = "catalog"');
    expect(cmsRoute).toContain("source: radiusApplied ? PUBLIC_SOURCE_RADIUS : PUBLIC_SOURCE_CATALOG");
    expect(cmsRoute).not.toContain("bundle.source");
    expect(cmsRoute).not.toContain("supabase_radius");

    const directory = readFileSync("src/app/property/DirectoryClient.js", "utf8");
    expect(directory).toContain('data.source === "radius"');
    expect(directory).not.toContain("supabase_radius");
  });

  it("bounds the query values that become CDN cache keys", () => {
    expect(cmsRoute).toContain("const MAX_RADIUS_KM = 2000");
    expect(cmsRoute).toContain("radiusKmRaw > 0 && radiusKmRaw <= MAX_RADIUS_KM");
    expect(cmsRoute).toContain("inRange(parsedLng, 180)");
    expect(cmsRoute).toContain("inRange(parsedLat, 90)");
    // Number.parseFloat, not the global — and never an unchecked NaN reaching
    // the Haversine filter, which silently emptied the directory.
    expect(cmsRoute).not.toContain("parseFloat(lngParam) : 121.0215");
  });
});
