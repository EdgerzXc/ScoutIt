import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// A-078 — `/api/mapbox` exists specifically so no Mapbox credential reaches the
// browser. Its own header states the guarantee: "no Mapbox credential is
// shipped to the browser at all — so nobody can lift it from the bundle and
// spend the quota."
//
// Four call sites were migrated. THREE were not, and the correction of
// 2026-09-03 found the third: CommercialFlow.js, ResidentialFlow.js and
// DashboardContext.js all still read NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN directly.
//
// The migration was left half done once. This guard is what stops that
// recurring — it is the reason acceptance test 4 exists.

const CLIENT_ROOTS = ["src/app", "src/components", "src/context", "src/hooks"];
/** The one file allowed to name the variable: the token resolver itself, which
 *  runs server-side and documents why the public token is not load-bearing. */
const ALLOWED = new Set([path.normalize("src/lib/mapboxToken.js")]);

// `src/app/api/` is server-only — a route handler never reaches the browser,
// and those files legitimately hold the unrestricted server token via
// getServerMapboxToken(). The guard is about what ships to a client bundle.
const SERVER_ONLY = path.normalize("src/app/api");

function walk(dir, out = []) {
  if (path.normalize(dir).startsWith(SERVER_ONLY)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name) && !full.includes("__tests__")) out.push(full);
  }
  return out;
}

const clientFiles = CLIENT_ROOTS.filter(fs.existsSync).flatMap((root) => walk(root));

describe("A-078 · no Mapbox credential reaches the browser", () => {
  it("scans a real set of client files, so the sweep cannot pass by finding nothing", () => {
    expect(clientFiles.length).toBeGreaterThan(100);
  });

  it("no client component, context or hook reads NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN", () => {
    const offenders = clientFiles
      .filter((file) => !ALLOWED.has(path.normalize(file)))
      .filter((file) => fs.readFileSync(file, "utf8").includes("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"))
      .map((file) => file.replaceAll("\\", "/"));

    expect(offenders).toEqual([]);
  });

  it("no client file builds a Mapbox URL with an access_token in the query string", () => {
    const offenders = clientFiles
      .filter((file) => !ALLOWED.has(path.normalize(file)))
      .filter((file) => /api\.mapbox\.com[^\n]*access_token/.test(fs.readFileSync(file, "utf8")))
      .map((file) => file.replaceAll("\\", "/"));

    expect(offenders).toEqual([]);
  });

  it("InteractiveMap takes no mapboxToken prop and routes through the proxy", () => {
    const source = fs.readFileSync("src/components/property/InteractiveMap.js", "utf8");
    expect(source).not.toMatch(/mapboxToken/);
    expect(source).toContain("/api/mapbox?op=geocode");
    expect(source).toContain("/api/mapbox?op=directions");
  });

  it("neither property flow declares or passes a Mapbox token", () => {
    for (const flow of [
      "src/components/property/CommercialFlow.js",
      "src/components/property/ResidentialFlow.js",
    ]) {
      expect(fs.readFileSync(flow, "utf8")).not.toMatch(/mapboxToken/);
    }
  });

  it("the dashboard context no longer publishes a token nobody used", () => {
    const source = fs.readFileSync("src/context/DashboardContext.js", "utf8");
    expect(source).not.toMatch(/MAPBOX_TOKEN/);
    for (const consumer of [
      "src/components/dashboard/BrokerMode.js",
      "src/components/dashboard/BuyerMode.js",
    ]) {
      expect(fs.readFileSync(consumer, "utf8")).not.toMatch(/MAPBOX_TOKEN/);
    }
  });
});

describe("A-078 · the proxy can serve what the migrated callers need", () => {
  it("geocode accepts a proximity bias, which InteractiveMap depends on", () => {
    const route = fs.readFileSync("src/app/api/mapbox/route.js", "utf8");
    expect(route).toContain("proximity");
  });
});
