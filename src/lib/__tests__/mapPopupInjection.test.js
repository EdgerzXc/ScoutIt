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

// ── U-028 — map popups must never be built from an HTML string ──────────────
//
// `SpatialCommandMap` interpolated `property.title` into `Popup#setHTML`, which
// assigns to innerHTML. That title is typed by the OWNER in the listing wizard
// and is not sanitized on write — `sanitizeObject` is imported in OwnerMode.js
// and never called — so an owner could put markup in their own listing title
// and have it run for every visitor to that public unit page. Stored XSS.
//
// MapLibre's `DOM.sanitize()` is not the defence: CVE-2026-85061 (CVSS 10.0) is
// a bypass in exactly that function, and the repository is on a version below
// the 6.4.1 fix. Upgrading is worth doing on its own merits, but it is not what
// makes this safe. Not building HTML out of user text is.
//
// Every other popup here already builds DOM nodes; `lenses/location.js` carries
// the comment explaining why, for OpenStreetMap place names. This asserts the
// pattern holds everywhere so the one exception cannot come back.
describe("U-028 map popups are built as DOM nodes, never HTML strings", () => {
  it("no source file calls Popup#setHTML", () => {
    const offenders = [];
    for (const file of sourceFiles) {
      const source = stripComments(readFileSync(file, "utf8"));
      if (/\.setHTML\s*\(/.test(source)) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(sourceFiles.length, "the sweep scanned real files").toBeGreaterThan(100);
    expect(offenders, `setHTML is an innerHTML sink:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("the property marker popup renders its title as text, not markup", () => {
    const source = stripComments(
      readFileSync(resolve(ROOT, "src/components/property/SpatialCommandMap.js"), "utf8")
    );
    expect(source).toContain("setDOMContent(popupNode)");
    expect(source).toContain("titleEl.textContent = propertyTitle");
    // The title must never reach a template literal that becomes markup.
    expect(source).not.toMatch(/`[^`]*\$\{propertyTitle\}[^`]*<\//);
  });

  // A third assertion was drafted here — "every popup construction uses
  // setDOMContent" — and removed. Its condition was an OR chain over a
  // 400-character window, which made it almost unfalsifiable, and the first
  // test above already forbids the actual sink precisely. A guard that cannot
  // fail is worse than no guard: it reads as coverage and provides none.
});
