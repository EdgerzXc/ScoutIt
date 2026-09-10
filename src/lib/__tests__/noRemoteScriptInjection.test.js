import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
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

const sourceFiles = walk(resolve(ROOT, "src")).filter((f) =>
  [".js", ".jsx"].includes(extname(f))
);

// ── A-121 — no third-party script is fetched into the page at runtime ───────
//
// `InteractiveMap` injected `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js`
// into the document head of a PUBLIC property page, with no `integrity` hash and
// no `crossOrigin`. Whoever controls that CDN path could execute arbitrary
// JavaScript on the site. `web/security.md` requires SRI for CDN scripts and
// prefers self-hosting; neither was happening, and `unpkg.com` sat in three CSP
// directives purely to permit it.
//
// Leaflet is the same library at the same version, now bundled from
// node_modules — a delivery change, not a visual one.
describe("A-121 no remote script or stylesheet is injected at runtime", () => {
  it("no source file builds a script element pointing at a remote origin", () => {
    const offenders = [];
    for (const file of sourceFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (!/createElement\(\s*["']script["']\s*\)/.test(source)) continue;
      // A script element is only a finding when it is given a remote src.
      if (/\.src\s*=\s*[`"']https?:\/\//.test(source)) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(sourceFiles.length, "the sweep scanned real files").toBeGreaterThan(100);
    expect(
      offenders,
      `remote scripts injected at runtime (no SRI is possible this way):\n${offenders.join("\n")}`
    ).toEqual([]);
  });

  it("no source file injects a remote stylesheet either", () => {
    const offenders = [];
    for (const file of sourceFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (!/createElement\(\s*["']link["']\s*\)/.test(source)) continue;
      if (/\.href\s*=\s*[`"']https?:\/\//.test(source)) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(offenders, `remote stylesheets injected at runtime:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("the property map is bundled MapLibre, and Leaflet is gone entirely", () => {
    // A-121, second half. This assertion used to pin the Leaflet dynamic
    // import; the surface has since been ported, so the guarantee it protects
    // changed rather than disappeared. The original defect it was written for
    // — a third-party script fetched from a CDN onto a public page with no SRI
    // — is still what it forbids.
    const map = stripComments(
      readFileSync(resolve(ROOT, "src/components/property/InteractiveMap.js"), "utf8")
    );
    expect(map).not.toContain("unpkg");
    expect(map).toContain('import maplibregl from "maplibre-gl"');
    expect(map).toContain('import "maplibre-gl/dist/maplibre-gl.css"');
    expect(map).not.toContain("leaflet");
  });

  it("one map engine, not two: nothing in the app imports Leaflet", () => {
    // The point of A-121 is that there is ONE renderer. A per-file assertion
    // cannot catch a NEW Leaflet surface, and a new map written from an old
    // example is exactly how the second engine would come back.
    const offenders = [];
    for (const file of sourceFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (/from\s+["']leaflet|import\(\s*["']leaflet/.test(source)) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(offenders, "files importing Leaflet: " + offenders.join(", ")).toEqual([]);
  });

  it("guards the unmount race the async route lookup introduces", () => {
    // React can unmount while the directions request is in flight; drawing
    // into a torn-down map leaks the instance past cleanup.
    const map = stripComments(
      readFileSync(resolve(ROOT, "src/components/property/InteractiveMap.js"), "utf8")
    );
    expect(map).toContain("if (cancelled || !mapInstance.current) return;");
    expect(map).toContain("cancelled = true;");
  });

  it("drops the CSP exception that only existed for the CDN", () => {
    const config = readFileSync(resolve(ROOT, "next.config.mjs"), "utf8");
    expect(config).not.toContain("unpkg.com");
  });
});
