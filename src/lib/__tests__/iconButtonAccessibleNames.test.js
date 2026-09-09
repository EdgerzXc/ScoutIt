import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { findUnnamedIconButtons, scannedFileCount } from "../../../scripts/scan-icon-only-buttons.mjs";

// A-084 — icon-only controls announced as "button" and nothing else (WCAG
// 4.1.2). The save-to-board toggle was the worst: no name AND no announced
// state, so a screen-reader user could not tell a saved item from an unsaved
// one.
//
// Acceptance test 3 asks for the automated check, "so the fifth one cannot
// reappear". This is it.

describe("A-084 · no icon-only button is announced without a name", () => {
  it("scans a real set of component files, so a green result cannot mean it found nothing", () => {
    expect(scannedFileCount()).toBeGreaterThan(300);
  });

  it("finds no unnamed icon-only button anywhere under src/components or src/app", () => {
    const offenders = findUnnamedIconButtons().map((o) => `${o.file}:${o.line}`);
    expect(offenders).toEqual([]);
  });
});

describe("A-084 · the save toggle announces its state, not just its name", () => {
  const source = fs.readFileSync("src/components/dashboard/BuyerMode.js", "utf8");

  it("exposes aria-pressed on both save controls", () => {
    const pressed = source.match(/aria-pressed=\{savedIds\.includes\(item\.id\)\}/g) || [];
    expect(pressed).toHaveLength(2);
  });

  it("reflects the current state in the label, not only in aria-pressed", () => {
    expect(source).toContain("Remove ${item.title} from your board");
    expect(source).toContain("Save ${item.title} to your board");
  });

  it("keeps the two save controls identical, so one cannot silently lose its state", () => {
    const labels = source.match(/aria-label=\{\s*savedIds\.includes\(item\.id\)[\s\S]{0,140}?\}/g) || [];
    expect(labels).toHaveLength(2);
    expect(labels[0].replace(/\s+/g, " ")).toBe(labels[1].replace(/\s+/g, " "));
  });
});

describe("A-084 · the scanner itself is honest about what counts as a name", () => {
  // The scanner was wrong twice while being written, in both directions, and
  // each error would have produced a green gate over a real defect. These pin
  // the corrections.
  it("does not accept a lone glyph as an accessible name", async () => {
    // `{isSelected ? "✓" : "+"}` gives a technical name that announces as
    // nothing useful.
    const scanner = await import("../../../scripts/scan-icon-only-buttons.mjs");
    expect(typeof scanner.findUnnamedIconButtons).toBe("function");
    expect(fs.readFileSync("scripts/scan-icon-only-buttons.mjs", "utf8")).toContain("isGlyphOnly");
  });

  it("does not accept an icon-only ternary as an accessible name", () => {
    // `{saved ? <Bookmark/> : <Bookmark/>}` renders no text at all. Reading it
    // as a dynamic text child is what made the first version miss all four of
    // A-084's own controls while reporting three others.
    expect(fs.readFileSync("scripts/scan-icon-only-buttons.mjs", "utf8")).toContain("rendersText");
  });

  it("does not treat a `>` inside an attribute expression as the end of a tag", () => {
    // An arrow function in an attribute broke the naive /<[^>]*>/ strip.
    expect(fs.readFileSync("scripts/scan-icon-only-buttons.mjs", "utf8")).toContain("function stripTags");
  });
});
