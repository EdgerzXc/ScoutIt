import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { shouldRender, simpleCollapsed } from "@/lib/simpleMode";
import { sidebarGroupCollapsed, sidebarGroupVisible } from "@/lib/simpleModeSurfaces";

// A-085 phase 1 — density. Plan: ACTION/A-085_PLAIN_LANGUAGE.md §5.
//
// The owner turned Simple on, compared it with Pro, and said the difference is
// real but too small. Phase 1 is the half of that answer which needs no copy
// decision: widen what counts as `detail` so whole technical field groups fold
// behind the expander that already exists, instead of sitting inline.
//
// ── THE RULE THIS FILE PINS ──────────────────────────────────────────
// Zoning classification, acoustic profile and street type are `detail`
// wherever they appear in a property sidebar. They are municipal and
// environmental jargon — §3.1 of the plan names all three — and none of them
// is the last inline field in its branch, so no sidebar is reduced to a bare
// button.
//
// Grades (Kitchen Grade, Setup Grade, Building Grade) are deliberately NOT
// folded here even though phase 1 names them. Each one carries its branch's
// accent line and is the only remaining field in at least one branch, so
// folding it empties a sidebar — a layout regression, not a simplification.
// The plan already routes them to phase 2, where "a grade with no published
// scale" is fixed by naming it better rather than by hiding it.
//
// ── WHY POSITIONAL, NOT A GREP ───────────────────────────────────────
// This ledger keeps recording tests that asserted a file *mentioned* a symbol
// and stayed green while the behaviour was broken. Containing the string
// "Acoustics" proves nothing: it was already there before this phase. So every
// structural assertion below is positional — the field's index must fall
// inside a `<SidebarDetails>` span — which goes red the moment a wrap is
// removed, and that is mutation-verified.

const read = (p) => fs.readFileSync(p, "utf8");
const FLOWS = [
  "src/components/property/CommercialFlow.js",
  "src/components/property/ResidentialFlow.js",
];

/**
 * Every `<SidebarDetails>…</SidebarDetails>` span in a source file, as
 * [start, end] index pairs. Also proves the groups do not nest: an opener
 * seen before the previous closer would make containment meaningless.
 */
function detailSpans(source) {
  const opens = [...source.matchAll(/<SidebarDetails>/g)].map((m) => m.index);
  const closes = [...source.matchAll(/<\/SidebarDetails>/g)].map((m) => m.index);
  expect(opens.length).toBe(closes.length);
  return opens.map((open, i) => {
    const close = closes[i];
    expect(close).toBeGreaterThan(open);
    if (i + 1 < opens.length) expect(opens[i + 1]).toBeGreaterThan(close);
    return [open, close];
  });
}

const inside = (spans, at) => spans.some(([open, close]) => at > open && at < close);
const labelAt = (source, label) =>
  [...source.matchAll(new RegExp(`sidebar-label">${label}<`, "g"))].map((m) => m.index);

// ── TEST 0, RE-RUN FOR THIS PHASE ─────────────────────────────────────────
// The plan: "Each phase re-runs test 0 before it ships. If test 0 fails, the
// phase does not ship, whatever else passes."

describe("A-085 phase 1 · test 0 — Pro is unchanged", () => {
  it("collapses nothing at all in Pro", () => {
    expect(simpleCollapsed({ role: "detail", simple: false })).toBe(false);
    expect(sidebarGroupCollapsed(false, false)).toBe(false);
    expect(sidebarGroupCollapsed(false, true)).toBe(false);
  });

  it("keeps every newly folded field in the tree — grouping moved, nothing removed", () => {
    const commercial = read(FLOWS[0]);
    const residential = read(FLOWS[1]);
    expect(labelAt(commercial, "Acoustics").length).toBe(1);
    expect(labelAt(commercial, "Street type").length).toBe(1);
    expect(labelAt(commercial, "Zoning").length).toBe(3);
    expect(labelAt(residential, "Street type").length).toBe(1);
    expect(labelAt(residential, "Zoning").length).toBe(2);
    // And the fields that must stay inline are still rendered.
    for (const [flow, label] of [
      [commercial, "Kitchen Grade"], [commercial, "Setup Grade"],
      [commercial, "Cover Count"], [commercial, "Developer"],
      [residential, "Short-Let Status"], [residential, "Developer"],
    ]) {
      expect(labelAt(flow, label).length).toBeGreaterThan(0);
    }
  });
});

// ── THE DENSITY RULE ──────────────────────────────────────────────────────

describe("A-085 phase 1 · the technical sidebar fields fold in Simple", () => {
  it("puts every zoning classification inside an expander", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      const spans = detailSpans(source);
      const zoning = labelAt(source, "Zoning");
      expect(zoning.length).toBeGreaterThan(0);
      for (const at of zoning) expect(inside(spans, at)).toBe(true);
    }
  });

  it("puts the acoustic profile and street type inside an expander", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      const spans = detailSpans(source);
      const fields = [...labelAt(source, "Acoustics"), ...labelAt(source, "Street type")];
      expect(fields.length).toBeGreaterThan(0);
      for (const at of fields) expect(inside(spans, at)).toBe(true);
    }
  });

  it("leaves the grade fields inline, so no sidebar becomes a bare button", () => {
    const commercial = read(FLOWS[0]);
    const spans = detailSpans(commercial);
    for (const label of ["Kitchen Grade", "Setup Grade", "Cover Count"]) {
      for (const at of labelAt(commercial, label)) expect(inside(spans, at)).toBe(false);
    }
    // Residential's hospitality branch keeps its regulatory lead field inline.
    const residential = read(FLOWS[1]);
    const residentialSpans = detailSpans(residential);
    for (const at of labelAt(residential, "Short-Let Status")) {
      expect(inside(residentialSpans, at)).toBe(false);
    }
  });

  it("folds more than the one group A-083 phase 1 left behind", () => {
    // A-083 shipped exactly one expander per flow. The whole complaint that
    // opened A-085 is that this was too little, so the count is the item.
    for (const flow of FLOWS) {
      expect(detailSpans(read(flow)).length).toBeGreaterThan(1);
    }
  });
});

// ── THE GUARANTEE, UNCHANGED ──────────────────────────────────────────────

describe("A-085 phase 1 · the safety properties survive the widening", () => {
  it("keeps provenance and verification outside every expander", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      const spans = detailSpans(source);
      const provenance = [
        ...[...source.matchAll(/intelSourceLabel\(d\.last_verified_date\)/g)].map((m) => m.index),
        ...labelAt(source, "Intel source"),
        ...labelAt(source, "Verification"),
      ];
      expect(provenance.length).toBeGreaterThan(0);
      for (const at of provenance) expect(inside(spans, at)).toBe(false);
    }
  });

  it("never marks a protected role removable", () => {
    for (const role of ["provenance", "verification", "consent", "legal", "entitlement"]) {
      expect(shouldRender({ role, simple: true })).toBe(true);
    }
  });

  it("renders no expander for a group whose fields are all absent", () => {
    // Widening the classification put groups around individually optional
    // fields. On a listing with no zoning, no acoustics and no street type,
    // an expander would open onto nothing — worse than the screen it
    // replaced. Behavioural, so a mutation of the guard goes red here.
    expect(sidebarGroupVisible(0)).toBe(false);
    expect(sidebarGroupVisible(1)).toBe(true);
    expect(sidebarGroupVisible(3)).toBe(true);
    const component = read("src/components/property/SidebarDetails.js");
    expect(component).toContain("Children.toArray(children).length");
  });

  it("collapses, and never removes — the group is still one visible control", () => {
    const component = read("src/components/property/SidebarDetails.js");
    expect(component).toContain("aria-expanded");
    expect(component).toContain("{children}");
    expect(sidebarGroupCollapsed(true, false)).toBe(true);
    expect(sidebarGroupCollapsed(true, true)).toBe(false);
  });

  it("authored no Simple copy to do it", () => {
    // Rule B. Widening a classification writes no words; if this phase ever
    // starts branching on mode to render different strings, that is phase 2's
    // decision and it has not been taken.
    for (const flow of FLOWS) {
      const source = read(flow);
      expect(source).not.toMatch(/isSimpleMode\(\)\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
      expect(source).not.toMatch(/simple\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
    }
  });
});
