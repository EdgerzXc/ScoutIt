import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve, extname } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// Comments explaining a defect must not satisfy the guard that forbids it. This
// is the third time in one session that trap has bitten (A-080's shape), so it
// is handled once, here, for every sweep below.
const stripComments = (source) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const SOURCE_EXTENSIONS = new Set([".js", ".jsx", ".mjs", ".css", ".json"]);
const sourceFiles = [
  ...walk(resolve(ROOT, "src")),
  ...walk(resolve(ROOT, "mission-control/src")),
].filter((f) => SOURCE_EXTENSIONS.has(extname(f)));

// ── A-118 — a shipped surface must not reference a file that does not exist ──
//
// The Open Graph fallback for every property page AND every unit page named a
// jpg that has never existed in `public/`. For units that was the COMMON path,
// because the fallback survives whenever a unit has no photo of its own — so
// those share cards pointed at a 404. Separately, JSON-LD told Google the
// organisation's logo lived at a path in `public/assets/` that is not there.
// Both failed silently: a 404 image degrades without an error anywhere.
describe("A-118 referenced public assets exist", () => {
  // The first version of this was a repo-wide sweep for literal `/foo.png`
  // strings whose file is missing. Its own non-vacuity guard failed it: after
  // comment-stripping there are ZERO such references in the codebase — assets
  // reach pages through Next conventions (`favicon.ico`), the dynamic OG route,
  // or remote Airtable URLs, never a hardcoded public path. A sweep that scans
  // nothing is not a guard, so it was removed rather than kept as decoration
  // (Rule 1: a tick must name the behaviour it guarantees). What is asserted
  // instead is specific and can actually fail: the two phantom paths that
  // shipped must never come back.
  const PHANTOM_PATHS = ["og-default.jpg", "scoutit_logo.png"];

  it("the paths that shipped pointing at nothing never return", () => {
    const offenders = [];
    for (const file of sourceFiles) {
      // This file names the phantom paths in PHANTOM_PATHS itself — as code,
      // not a comment, so stripping cannot help. The guard skips its own
      // definition rather than obfuscating the strings, which would make the
      // list unreadable to the next person maintaining it.
      if (file.endsWith("assetAndEncodingIntegrity.test.js")) continue;
      const source = stripComments(readFileSync(file, "utf8"));
      for (const phantom of PHANTOM_PATHS) {
        if (source.includes(phantom)) {
          offenders.push(`${file.replace(ROOT, "").replace(/\\/g, "/")} -> ${phantom}`);
        }
      }
    }
    expect(sourceFiles.length, "the sweep scanned real files").toBeGreaterThan(100);
    expect(offenders, `phantom asset paths are back:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("the OG fallback points at the branded card this repo actually builds", () => {
    for (const page of [
      "src/app/property/[id]/page.js",
      "src/app/property/[id]/unit/[unitId]/page.js",
    ]) {
      const source = stripComments(readFileSync(resolve(ROOT, page), "utf8"));
      expect(source, `${page} no longer names the phantom file`).not.toContain("og-default");
      expect(source, `${page} falls back to the branded card`).toContain('siteUrl("/api/og")');
    }
  });

  it("structured data asserts no logo while there is no file to point at", () => {
    // Standing Rule 3 applied to a URL: a logo resolving to nothing is worse
    // than no logo. The field returns when A-109's mark ships.
    const jsonLd = stripComments(readFileSync(resolve(ROOT, "src/components/seo/JsonLd.js"), "utf8"));
    expect(jsonLd).not.toMatch(/^\s*logo:/m);
  });
});

// ── A-119 — source must not carry double-encoded UTF-8 ──────────────────────
//
// A UTF-8 file read as cp1252 and re-saved turns one character into three. It
// COMPOUNDS: one file had been through the cycle twice and its em dash had
// grown to twenty bytes. One occurrence was user-visible — the fallback SEO
// title of every property page whose CMS lookup missed.
describe("A-119 source encoding integrity", () => {
  // Built from escapes on purpose: writing these sequences literally would put
  // mojibake into the very file that forbids it, and the guard would fail on
  // itself. This way the sweep genuinely covers every file, this one included.
  const MOJIBAKE = [
    "\u00e2\u20ac", // an em/en dash or curly quote that went through cp1252
    "\u00e2\u201d", // box drawing, light
    "\u00e2\u2022", // box drawing, double
    "\u00c3\u0192", // a second round-trip on top of the first
    "\ufffd",       // a character already lost to an unrepresentable byte
  ];

  it("no source file contains double-encoded UTF-8 or a replacement character", () => {
    const damaged = [];
    for (const file of sourceFiles) {
      const source = readFileSync(file, "utf8");
      if (MOJIBAKE.some((seq) => source.includes(seq))) {
        damaged.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(sourceFiles.length, "the sweep scanned real files").toBeGreaterThan(100);
    expect(damaged, `files carrying mojibake:\n${damaged.join("\n")}`).toEqual([]);
  });
});
