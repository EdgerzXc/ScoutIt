import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname, sep } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const stripComments = (source) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const rel = (file) => file.replace(ROOT, "").replace(/\\/g, "/").replace(/^\//, "");

// Production source only. A guard that sweeps the test directory finds its own
// vocabulary and fails on itself, which is noise rather than a finding.
const sourceFiles = walk(resolve(ROOT, "src")).filter(
  (f) =>
    [".js", ".jsx"].includes(extname(f)) &&
    !f.includes(`${sep}__tests__${sep}`) &&
    !/\.test\.[jt]sx?$/.test(f)
);

// ── A-143 — the built-in AttributionControl is the last DOM.sanitize sink ────
//
// CVE-2026-85061 (CVSS 10.0) is a bypass in MapLibre's `DOM.sanitize()`.
// U-028 closed the popup sink by building DOM nodes instead of HTML strings,
// and `mapPopupInjection.test.js` keeps it closed. That left ONE caller of the
// vulnerable function inside maplibre-gl 5.24.0:
//
//   this._innerContainer.innerHTML = DOM.sanitize(attribHTML);   // AttributionControl
//
// `attribHTML` is NOT ours. It is fetched at runtime from CARTO's TileJSON
// (`tiles.basemaps.cartocdn.com/.../tiles.json`) and arrives as live markup:
// `&copy; <a href="...">CARTO</a>, &copy; <a href="...">OpenStreetMap</a>
// contributors`. So remote third-party HTML was being pushed through a
// known-broken sanitizer into innerHTML on every map that showed the control.
//
// THERE IS NO VERSION TO UPGRADE TO. 5.24.0 is the end of the 5.x line — no
// 5.24.1, no 5.25 — and the fix exists only in 6.4.1+, whose major rewrite
// blanked every map surface here. So the sink is removed instead of patched:
// MapLibre's control is switched off and `MapCreditControl` draws the same
// credit from DOM nodes, which never touches innerHTML. That makes the
// vulnerable function uncallable in this app rather than merely unreached.
//
// This guard is what lets the Dependabot alert be dismissed honestly. If it
// fails, the dismissal is no longer true.
describe("A-143 MapLibre's attribution sink stays unreachable", () => {
  // Every map that renders a basemap must switch the built-in control off AND
  // attach our own credit, so turning the sink off never silently drops the
  // OpenStreetMap credit its licence requires.
  const CREDITED_MAPS = [
    "src/components/dashboard/BrokerMode.js",
    "src/components/dashboard/BuyerMode.js",
    "src/components/intel/SpatialIntelMap.js",
    "src/components/maps/SpatialCanvas.js",
    "src/components/property/FloodHeatmapMap.js",
    "src/components/property/InteractiveRadiusMap.js",
    "src/components/property/SpatialCommandMap.js",
    "src/components/stratosphere/SpatialSignalRadar.js",
    "src/components/transit/ManilaTransitMap.js",
  ];

  // These two already shipped with `attributionControl: false` and no credit of
  // any kind, so they were never exposed to the sink. Their MISSING credit is a
  // separate licence question raised with the owner, deliberately not resolved
  // here by adding visible text to surfaces nobody approved changing.
  const UNCREDITED_MAPS = [
    "src/components/descent/CityApproach.js",
    "src/components/property/InteractiveMap.js",
  ];

  const mapFiles = sourceFiles.filter((f) =>
    /new maplibregl\.Map\s*\(/.test(stripComments(readFileSync(f, "utf8")))
  );

  it("every map in the app is classified, so a new one cannot appear unguarded", () => {
    expect(mapFiles.length, "the sweep found real maps").toBeGreaterThan(5);
    const classified = new Set([...CREDITED_MAPS, ...UNCREDITED_MAPS]);
    const unclassified = mapFiles.map(rel).filter((f) => !classified.has(f));
    expect(
      unclassified,
      `a new map must be added to CREDITED_MAPS (and attach MapCreditControl):\n${unclassified.join("\n")}`
    ).toEqual([]);
  });

  it("no map leaves the built-in AttributionControl enabled", () => {
    const offenders = [];
    for (const file of mapFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      // Absent means MapLibre's default of `true`, which is the sink.
      if (!/attributionControl\s*:\s*false/.test(source)) offenders.push(rel(file));
    }
    expect(
      offenders,
      `these maps feed remote HTML through the broken sanitizer:\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  it("every basemap map attaches our own credit instead", () => {
    // Must match the addControl CALL, not the mere presence of the name. A
    // bare /MapCreditControl/ was satisfied by the leftover import line, so
    // deleting the call went undetected — mutation testing caught that.
    const mounts = /addControl\s*\(\s*new MapCreditControl\s*\(/;
    const missing = CREDITED_MAPS.filter(
      (f) => !mounts.test(stripComments(readFileSync(resolve(ROOT, f), "utf8")))
    );
    expect(
      missing,
      `switching the control off must not drop the OSM credit:\n${missing.join("\n")}`
    ).toEqual([]);
  });

  it("nothing reintroduces the sink through customAttribution or a source attribution", () => {
    // Both are joined into the same `attribHTML` string the sanitizer receives,
    // so either one re-opens the hole even with the default control disabled.
    const offenders = [];
    for (const file of sourceFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (/customAttribution/.test(source)) offenders.push(`${rel(file)} (customAttribution)`);
      if (/^\s*attribution\s*:/m.test(source)) offenders.push(`${rel(file)} (source attribution)`);
    }
    expect(offenders, `these feed the sanitizer again:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("the credit control builds nodes and never assigns markup", () => {
    const control = resolve(ROOT, "src/components/maps/MapCreditControl.js");
    const source = stripComments(readFileSync(control, "utf8"));
    expect(source).toMatch(/createElement/);
    expect(source).toMatch(/textContent/);
    for (const sink of ["innerHTML", "outerHTML", "insertAdjacentHTML", "setHTML"]) {
      expect(source, `${sink} defeats the whole point of this file`).not.toContain(sink);
    }
  });

  it("the credit names OpenStreetMap and CARTO, which the licence requires", () => {
    // Comments MUST be stripped. This docblock explains the OpenStreetMap
    // licence at length, so an unstripped `toContain("OpenStreetMap")` passed
    // even with the visible credit renamed to "A Map" — a guard that proved
    // the prose, not the product.
    const source = stripComments(
      readFileSync(resolve(ROOT, "src/components/maps/MapCreditControl.js"), "utf8")
    );
    // The rendered labels, as the visitor reads them.
    expect(source).toMatch(/creditLink\(\s*OSM_HREF\s*,\s*"OpenStreetMap"\s*\)/);
    expect(source).toMatch(/creditLink\(\s*CARTO_HREF\s*,\s*"CARTO"\s*\)/);
    expect(source).toMatch(/createTextNode\("\s*contributors"\)/);
    // And the hrefs those labels point at.
    expect(source).toContain("openstreetmap.org");
    expect(source).toContain("carto.com");
  });
});
