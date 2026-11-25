import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { resolveFlowNode, getFlowNode } from "@/lib/flow/flowNodeResolver";

function collectAppRoutes(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectAppRoutes(full));
    } else if (entry.name === "page.js" || entry.name === "route.js") {
      results.push(full);
    }
  }
  return results;
}

function fileToSampleRoute(appDir, filePath) {
  const relDir = path.relative(appDir, path.dirname(filePath));
  if (!relDir || relDir === ".") return "/";
  const segments = relDir
    .split(path.sep)
    .filter((seg) => !(seg.startsWith("(") && seg.endsWith(")")))
    .map((seg) => {
      if (seg.startsWith("[...") && seg.endsWith("]")) return "sample/nested";
      if (seg.startsWith("[[...") && seg.endsWith("]]")) return "sample/nested";
      if (seg.startsWith("[") && seg.endsWith("]")) return "sample-id";
      return seg;
    });
  return `/${segments.join("/")}`;
}

describe("flowNodeResolver", () => {
  it("resolves exact static routes to their respective flow nodes", () => {
    const hero = resolveFlowNode("/");
    expect(hero).not.toBeNull();
    expect(hero.nodeId).toBe("hero");
    expect(hero.domain).toBe("core");
    expect(hero.roles).toContain("visitor");

    const discover = resolveFlowNode("/discover");
    expect(discover).not.toBeNull();
    expect(discover.nodeId).toBe("discover_directory");
    expect(discover.domain).toBe("discovery");
  });

  it("resolves parameterized dynamic routes (e.g. /property/[id])", () => {
    const detail = resolveFlowNode("/property/the-ridgeline-at-capitol-commons");
    expect(detail).not.toBeNull();
    expect(detail.nodeId).toBe("direct_slug");
    expect(detail.domain).toBe("property");
  });

  it("resolves parameterized dynamic routes with query parameters", () => {
    const detailWithQuery = resolveFlowNode("/property/the-ridgeline?view=gallery");
    expect(detailWithQuery).not.toBeNull();
    expect(detailWithQuery.nodeId).toBe("direct_slug");
  });

  it("prioritizes explicit nodeId when provided", () => {
    const node = resolveFlowNode("/random/unmapped/url", "deal_room");
    expect(node).not.toBeNull();
    expect(node.nodeId).toBe("deal_room");
    expect(node.domain).toBe("deal");
  });

  it("resolves newly added features and domain subroutes via fallback matchers", () => {
    // Exact parameterized canonical routes (A-194 promotion)
    const viaPage = resolveFlowNode("/property/the-ridgeline/via/broker-mike");
    expect(viaPage).not.toBeNull();
    expect(viaPage.nodeId).toBe("via_promoter_share");

    const viaApi = resolveFlowNode("/api/property/rec123/via");
    expect(viaApi).not.toBeNull();
    expect(viaApi.nodeId).toBe("api_via_routing");

    const reviewApi = resolveFlowNode("/api/deals/deal-abc-123/review");
    expect(reviewApi).not.toBeNull();
    expect(reviewApi.nodeId).toBe("api_deal_review");

    const passportApi = resolveFlowNode("/api/user/resident-passport");
    expect(passportApi).not.toBeNull();
    expect(passportApi.nodeId).toBe("sys_resident_passport");

    // Domain fallback matchers
    const adminFlow = resolveFlowNode("/admin/flow");
    expect(adminFlow).not.toBeNull();
    expect(adminFlow.nodeId).toBe("mission_control");

    const viaMetrics = resolveFlowNode("/api/broker/via-metrics");
    expect(viaMetrics).not.toBeNull();
    expect(viaMetrics.nodeId).toBe("brokers_roster");

    const metropolis = resolveFlowNode("/layer/metropolis");
    expect(metropolis).not.toBeNull();
    expect(metropolis.nodeId).toBe("metropolis");
  });

  it("returns null safely for unknown routes or invalid inputs", () => {
    expect(resolveFlowNode("")).toBeNull();
    expect(resolveFlowNode(null)).toBeNull();
    expect(resolveFlowNode(undefined)).toBeNull();
    expect(resolveFlowNode("/completely-nonexistent-route-xyz-123")).toBeNull();
  });

  it("provides direct node lookup via getFlowNode", () => {
    const node = getFlowNode("deal_room");
    expect(node).not.toBeNull();
    expect(node.name).toBe("Private Inquiry Workspace & Scheduling");
    expect(getFlowNode("invalid_nonexistent_id")).toBeNull();
    expect(getFlowNode(null)).toBeNull();
  });

  it("resolves all live product and API routes without returning null", () => {
    const expectedRoutes = [
      ["/enterprise", "mission_control"],
      ["/contact", "inquiry_modal"],
      ["/api/contact", "inquiry_modal"],
      ["/reset-password", "auth_onboarding_flow"],
      ["/auth/callback", "auth_onboarding_flow"],
      ["/dashboard/inbox", "booking_modal"],
      ["/dashboard/crm", "offer_modal"],
      ["/dashboard/calendar", "booking_modal"],
      ["/api/calendar", "booking_modal"],
      ["/api/property/the-ridgeline/open-gate", "direct_slug"],
      ["/api/property/the-ridgeline/units", "direct_slug"],
      ["/api/dashboard/units", "dashboard_inventory_unit"],
      ["/api/dashboard/units/unit-123", "dashboard_inventory_unit"],
      ["/api/dashboard/metrics", "dashboard_owner"],
      ["/brokers", "brokers_roster"],
      ["/professionals", "brokers_roster"],
      ["/directory", "discover_directory"],
    ];

    for (const [route, expectedNodeId] of expectedRoutes) {
      const resolved = resolveFlowNode(route);
      expect(resolved, `Expected ${route} to resolve`).not.toBeNull();
      expect(resolved.nodeId).toBe(expectedNodeId);
    }
  });

  it("resolves 100% of all page.js and route.js files under src/app/", () => {
    const appDir = path.resolve(process.cwd(), "src", "app");
    const routeFiles = collectAppRoutes(appDir);
    expect(routeFiles.length).toBeGreaterThanOrEqual(217);

    const unmapped = [];
    for (const filePath of routeFiles) {
      const samplePath = fileToSampleRoute(appDir, filePath);
      const resolved = resolveFlowNode(samplePath);
      if (!resolved || !resolved.nodeId) {
        unmapped.push({
          file: path.relative(process.cwd(), filePath),
          samplePath,
        });
      }
    }

    expect(unmapped, `Unmapped routes: ${JSON.stringify(unmapped, null, 2)}`).toEqual([]);
  });
});
