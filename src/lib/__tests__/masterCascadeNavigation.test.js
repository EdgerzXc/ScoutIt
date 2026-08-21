import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

const APP_ROOT = resolve(process.cwd(), "src/app");

function checkPageExists(routePath) {
  if (routePath === "/") return existsSync(join(APP_ROOT, "page.js"));
  const clean = routePath.replace(/^\//, "").split("?")[0];
  const pagePath = join(APP_ROOT, clean, "page.js");
  return existsSync(pagePath);
}

describe("Master Cascade Navigation & Altitude Hierarchy Contracts", () => {
  const ALTITUDE_ROUTES = [
    { layer: "01", name: "Orbit", path: "/layer/orbit" },
    { layer: "02", name: "Stratosphere", path: "/layer/stratosphere" },
    { layer: "03", name: "Metropolis", path: "/layer/metropolis" },
    { layer: "04", name: "Crust", path: "/layer/crust" },
    { layer: "05", name: "Mantle", path: "/layer/mantle" },
    { layer: "06", name: "Core", path: "/layer/core" }
  ];

  const PORTAL_ROUTES = [
    { portal: "Showcase", path: "/showcase" },
    { portal: "Space Directory", path: "/property" },
    { portal: "Wishlist Board", path: "/wishlist" },
    { portal: "Off-Market Vault", path: "/off-market" }
  ];

  const ECOSYSTEM_ROUTES = [
    { name: "Brokers", path: "/brokers" },
    { name: "Photographers", path: "/photographers" },
    { name: "Event Planners", path: "/event-planners" },
    { name: "Researchers", path: "/researchers" }
  ];

  it("ensures every 6-layer altitude level exists as a real App Router page", () => {
    ALTITUDE_ROUTES.forEach(({ layer, name, path }) => {
      const exists = checkPageExists(path);
      expect(exists, `Layer ${layer} (${name}) at ${path} must have a valid page.js`).toBe(true);
    });
  });

  it("ensures all curated portals exist as real App Router pages", () => {
    PORTAL_ROUTES.forEach(({ portal, path }) => {
      const exists = checkPageExists(path);
      expect(exists, `Portal ${portal} at ${path} must have a valid page.js`).toBe(true);
    });
  });

  it("ensures all ecosystem specialist rosters exist as real App Router pages", () => {
    ECOSYSTEM_ROUTES.forEach(({ name, path }) => {
      const exists = checkPageExists(path);
      expect(exists, `Ecosystem roster ${name} at ${path} must have a valid page.js`).toBe(true);
    });
  });

  it("validates dashboard workspace modes map to /dashboard", () => {
    const dashboardExists = checkPageExists("/dashboard");
    expect(dashboardExists, "Base /dashboard must exist").toBe(true);
  });

  it("keeps the internal master workflow unavailable as a public route", () => {
    const flowExists = checkPageExists("/flow");
    expect(flowExists, "Internal master workflow must not be exposed at /flow").toBe(false);
  });
});
