import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

const cmsRoute = read("src/app/api/cms/route.js");
const premiumFields = read("src/lib/premiumFields.js");
const publicCatalog = read("src/lib/cms/publicCatalog.js");

// Surfaces that were switched to the cacheable public scope. Each one was
// checked against every gated field name before the switch; if any of them
// starts reading premium data, the cached copy would be missing it.
const PUBLIC_SCOPE_CALLERS = [
  "src/app/page.js",
  "src/app/discover/DiscoverClient.js",
  "src/app/intel/page.js",
  "src/app/property/DirectoryClient.js",
  "src/components/discover/DiscoverSearch.js",
  "src/components/intel/OSINTFlashTicker.js",
];

// The tier-resolved path. These read premium fields and must keep the
// uncacheable, session-resolved response.
const TIER_RESOLVED_CALLERS = [
  "src/components/property/CommercialFlow.js",
  "src/components/property/ResidentialFlow.js",
  "src/components/property/UnitMasterPage.js",
];

const GATED_FIELDS = [
  "deepIntel",
  "enhanced_photos",
  "virtual_tour_url",
  "matterportTourUrl",
  "luma3dMapUrl",
  "droneHeatmapUrl",
  "floorPlans",
];

describe("A-053 cacheable public catalogue scope", () => {
  it("never lets a tier-resolved payload into a shared cache", () => {
    // The whole safety argument: only the branch that ignores the session may
    // be cached publicly. If these two ever swap, a subscriber's unlocked
    // catalogue becomes servable to the next anonymous visitor.
    expect(cmsRoute).toContain('"Cache-Control": "no-store, private"');
    expect(cmsRoute).toContain('Vary: "Authorization, Cookie"');
    expect(cmsRoute).toMatch(/publicScope\s*\n?\s*\?/);

    const publicHeaderAt = cmsRoute.indexOf("public, max-age=");
    const privateHeaderAt = cmsRoute.indexOf('"no-store, private"');
    expect(publicHeaderAt).toBeGreaterThan(-1);
    expect(privateHeaderAt).toBeGreaterThan(publicHeaderAt);
  });

  it("strips premium fields for every caller in public scope, session or not", () => {
    expect(cmsRoute).toContain('const PUBLIC_SCOPE_TIER = "starry"');
    // The tier must be the constant in public scope — never resolved from the
    // request — so nothing session-derived can reach a cached copy.
    expect(cmsRoute).toContain("publicScope ? PUBLIC_SCOPE_TIER : (await resolveServerTier(request)).tier");
    expect(cmsRoute).toContain("stripPremiumFields(p, tier)");
  });

  it("keeps the agreed 60 second freshness window", () => {
    expect(cmsRoute).toContain("const PUBLIC_SCOPE_MAX_AGE_S = 60");
    expect(cmsRoute).toContain("stale-while-revalidate=${PUBLIC_SCOPE_STALE_S}");
  });

  it("caches in the browser as well as the CDN", () => {
    // Vercel consumes s-maxage at the edge and forwards only `public`, so
    // s-maxage alone leaves the visitor paying a round trip on every
    // navigation. max-age is what makes the second page load free.
    expect(cmsRoute).toContain("public, max-age=${PUBLIC_SCOPE_MAX_AGE_S}, s-maxage=${PUBLIC_SCOPE_MAX_AGE_S}");
  });

  it("only routes surfaces that read no premium field to the cached scope", () => {
    // They reach the route only through the shared loader, which is the one
    // place scope=public is spelled — so no caller can quietly drop it and
    // start pulling a tier-resolved, uncacheable payload instead.
    expect(publicCatalog).toContain('new URLSearchParams({ scope: "public" })');
    for (const file of PUBLIC_SCOPE_CALLERS) {
      const source = read(file);
      expect(source, `${file} should load through the shared public catalogue`)
        .toContain("loadPublicCatalog");
      expect(source, `${file} should not build its own /api/cms URL`)
        .not.toMatch(/fetch\(\s*[`"']\/api\/cms/);
      for (const field of GATED_FIELDS) {
        expect(source, `${file} reads gated field ${field} but uses the stripped public scope`)
          .not.toContain(field);
      }
    }
  });

  it("leaves the premium property path on the uncacheable response", () => {
    for (const file of TIER_RESOLVED_CALLERS) {
      const source = read(file);
      expect(source, `${file} must keep the tier-resolved /api/cms`).toContain('fetch("/api/cms")');
      expect(source).not.toContain("/api/cms?scope=public");
    }
  });

  it("still gates every field the premium map declares", () => {
    for (const field of GATED_FIELDS) {
      expect(premiumFields).toContain(field);
    }
  });
});
