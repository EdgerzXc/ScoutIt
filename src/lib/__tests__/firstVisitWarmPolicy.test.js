import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  FIRST_VISIT_MARKER_TTL_MS,
  MAX_PUBLIC_DATA_BYTES,
  MAX_PUBLIC_DATA_REQUESTS,
  MAX_ROUTE_PREFETCHES,
  canWarmFirstVisit,
  isFreshWarmMarker,
  selectWarmRoutes,
} from "@/lib/firstVisitWarmPolicy";

const ROOT = process.cwd();

describe("A-022 consent-safe first-visit warm policy", () => {
  const capable = {
    online: true,
    saveData: false,
    effectiveType: "4g",
    deviceMemory: 8,
    hardwareConcurrency: 8,
    liteMode: false,
    reducedMotion: false,
  };

  it("warms only capable, online, consent-safe sessions", () => {
    expect(canWarmFirstVisit(capable)).toBe(true);
    for (const override of [
      { online: false },
      { saveData: true },
      { effectiveType: "slow-2g" },
      { effectiveType: "2g" },
      { deviceMemory: 2 },
      { hardwareConcurrency: 2 },
      { liteMode: true },
      { reducedMotion: true },
    ]) expect(canWarmFirstVisit({ ...capable, ...override })).toBe(false);
  });

  it("uses hard request, route, byte, and six-hour expiry limits", () => {
    expect(MAX_ROUTE_PREFETCHES).toBe(2);
    expect(MAX_PUBLIC_DATA_REQUESTS).toBe(1);
    expect(MAX_PUBLIC_DATA_BYTES).toBe(32 * 1024);
    expect(FIRST_VISIT_MARKER_TTL_MS).toBe(6 * 60 * 60 * 1000);
    expect(isFreshWarmMarker({ version: 1, expiresAt: 1_500 }, 1_000)).toBe(true);
    expect(isFreshWarmMarker({ version: 1, expiresAt: 1_000 }, 1_000)).toBe(false);
    expect(isFreshWarmMarker({ version: 2, expiresAt: 2_000 }, 1_000)).toBe(false);
  });

  it("selects at most two exact public routes and rejects private/API targets", () => {
    const routes = selectWarmRoutes("/descent", [
      "/dashboard",
      "/api/cms",
      "/api/profile/me/role",
      "/api/deals",
      "/auth/callback",
      "/api/ai/rewrite-description",
      "/discover",
      "/property",
      "/brokers?sort=rating",
    ]);
    expect(selectWarmRoutes("/descent")).toEqual(["/about", "/layer/crust"]);
    expect(routes).toEqual(["/about", "/layer/crust"]);
    expect(routes).toHaveLength(MAX_ROUTE_PREFETCHES);
  });

  it("ships an anonymous, projected public snapshot rather than the private CMS proxy", () => {
    const route = readFileSync(path.join(ROOT, "src/app/api/preload/public/route.js"), "utf8");
    expect(route).toContain("getCmsBundle");
    expect(route).toContain("MAX_PUBLIC_DATA_BYTES");
    expect(route).toContain('"Cache-Control"');
    expect(route).toContain("public, max-age=300");
    expect(route).not.toMatch(/resolveUserId|cookies\(|subscription|entitlement|coordinates|description/);
  });

  it("starts after usability, omits credentials, and cancels without creating consent state", () => {
    const component = readFileSync(path.join(ROOT, "src/components/layout/FirstVisitWarmer.js"), "utf8");
    expect(component).toContain('credentials: "omit"');
    expect(component).toContain("AbortController");
    const overlays = readFileSync(path.join(ROOT, "src/components/layout/DynamicOverlays.js"), "utf8");
    expect(overlays).toContain('import("@/components/layout/FirstVisitWarmer")');
    expect(overlays).toContain("<FirstVisitWarmer />");
    expect(component).toContain("requestIdleCallback");
    expect(component).toContain("cancelIdleCallback");
    expect(component).toContain("sessionStorage");
    expect(component).not.toMatch(/document\.cookie|geolocation|localStorage\.setItem|gtag\(|analytics/);
  });
});
