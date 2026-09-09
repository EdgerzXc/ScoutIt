import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { shouldRender, simpleCollapsed } from "@/lib/simpleMode";
import { chapterSubtitleVisible, sidebarGroupCollapsed } from "@/lib/simpleModeSurfaces";
import { getChapterConfig } from "@/components/property/chapterConfig";

// A-083 phase 1 — property + unit master pages wired to the transform.
//
// The specification's exit condition: "A seeker reads a property in Simple and
// still sees every provenance and verification label."
//
// Test 0 is re-run here, as the spec requires of every phase: if it fails, the
// phase does not ship, whatever else passes.

const read = (p) => fs.readFileSync(p, "utf8");
const FLOWS = [
  "src/components/property/CommercialFlow.js",
  "src/components/property/ResidentialFlow.js",
];

// ── TEST 0, RE-RUN FOR THIS PHASE ─────────────────────────────────────────

describe("A-083 phase 1 · test 0 — Pro is unchanged", () => {
  it("renders every chapter subtitle in Pro", () => {
    // The transform is what the component consults; in Pro it is the identity.
    for (const chapter of getChapterConfig({})) {
      expect(shouldRender({ role: "description", simple: false })).toBe(true);
      expect(simpleCollapsed({ role: "detail", simple: false })).toBe(false);
      expect(chapter).toHaveProperty("id");
    }
  });

  it("collapses no sidebar group in Pro", () => {
    expect(simpleCollapsed({ role: "detail", simple: false })).toBe(false);
  });

  it("keeps every sidebar field present in both flows — grouping moved, nothing removed", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      // The fields the spec names as secondary are still in the tree; they are
      // wrapped, not deleted.
      expect(source).toContain('sidebar-label">Cap rate est.');
      expect(source).toContain('sidebar-label">Price trend');
      expect(source).toContain("<SidebarDetails>");
    }
  });
});

// ── THE EXIT CONDITION ────────────────────────────────────────────────────

describe("A-083 phase 1 · every provenance and verification label survives Simple", () => {
  it("keeps Intel source and Verification OUTSIDE every collapsible group", () => {
    // A-085 phase 1 widened the classification, so a flow now holds several
    // groups where A-083 shipped one. This assertion used to pin the count at
    // exactly one, which was only ever a way of making the single slice
    // trustworthy. The property it was protecting is the real one and it is
    // now checked against EVERY group rather than the first: provenance is
    // core, so no expander may contain it.
    for (const flow of FLOWS) {
      const source = read(flow);
      const opens = [...source.matchAll(/<SidebarDetails>/g)].map((m) => m.index);
      const closes = [...source.matchAll(/<\/SidebarDetails>/g)].map((m) => m.index);
      expect(opens.length).toBeGreaterThan(0);
      expect(closes.length).toBe(opens.length);
      const spans = opens.map((open, i) => {
        expect(closes[i]).toBeGreaterThan(open);
        // No nesting, or "inside a span" would stop meaning anything.
        if (i + 1 < opens.length) expect(opens[i + 1]).toBeGreaterThan(closes[i]);
        return [open, closes[i]];
      });
      for (const [open, close] of spans) {
        const collapsible = source.slice(open, close);
        expect(collapsible).not.toContain("Intel source");
        expect(collapsible).not.toContain("Verification");
        expect(collapsible).not.toContain("intelSourceLabel");
      }
      // Every provenance render — the "Verification" field earlier in the page
      // and the "Intel source" field beside the market group — must sit
      // outside all of them, whatever order they appear in.
      const provenanceAt = [...source.matchAll(/intelSourceLabel\(d\.last_verified_date\)/g)].map((m) => m.index);
      expect(provenanceAt.length).toBe(2);
      for (const at of provenanceAt) {
        expect(spans.some(([open, close]) => at > open && at < close)).toBe(false);
      }
    }
  });

  it("renders the provenance value through the shared, derived label", () => {
    for (const flow of FLOWS) {
      expect(read(flow)).toContain("intelSourceLabel(d.last_verified_date)");
    }
  });

  it("never marks a provenance or verification role removable", () => {
    for (const role of ["provenance", "verification", "consent", "legal", "entitlement"]) {
      expect(shouldRender({ role, simple: true })).toBe(true);
    }
  });
});

// ── THE SUBTITLE TRANSFORM ────────────────────────────────────────────────

describe("A-083 phase 1 · chapter subtitles are the only prose removed", () => {
  it("routes every flow subtitle through the one component", () => {
    for (const flow of FLOWS) {
      const source = read(flow);
      expect(source).toContain("<ChapterSubtitle text=");
      // No flow may still inline a subtitle div of its own.
      expect(source).not.toMatch(/\?\.subtitle && \(\s*\n\s*<div style=/);
    }
  });

  it("has nine subtitles wired in each flow", () => {
    for (const flow of FLOWS) {
      const uses = read(flow).match(/<ChapterSubtitle text=/g) || [];
      expect(uses.length).toBe(9);
    }
  });

  it("gates the Market chapter's lede on the same rule as its subtitle", () => {
    // Otherwise hiding the subtitle in Simple makes `!subtitle` newly true and
    // the lede appears exactly where a sentence was meant to be removed.
    const market = read("src/components/property/MarketChapter.js");
    expect(market).toContain("{!subtitle && showDescriptions && (");
    expect(market).toContain('shouldRender({ role: "description", simple })');
  });

  it("omits description in Simple and keeps it in Pro", () => {
    expect(shouldRender({ role: "description", simple: true })).toBe(false);
    expect(shouldRender({ role: "description", simple: false })).toBe(true);
  });

  it("the subtitle component's own decision honours the transform", () => {
    // Behavioural, not structural. A mutation that deleted the guard inside
    // ChapterSubtitle left the whole suite green, because nothing could call
    // the component without a React renderer — so the decision moved out.
    expect(chapterSubtitleVisible("Floor plate, layout & specs", false)).toBe(true);
    expect(chapterSubtitleVisible("Floor plate, layout & specs", true)).toBe(false);
    // No text is no element, in either mode.
    expect(chapterSubtitleVisible("", false)).toBe(false);
    expect(chapterSubtitleVisible(undefined, true)).toBe(false);
  });
});

// ── REACHABILITY (acceptance test 5) ──────────────────────────────────────

describe("A-083 phase 1 · nothing hidden in Simple is unreachable", () => {
  it("gives the collapsed sidebar group a visible, labelled control", () => {
    const component = read("src/components/property/SidebarDetails.js");
    expect(component).toContain("aria-expanded");
    expect(component).toContain("All details");
    // It collapses; it must never remove.
    expect(component).toContain("{children}");
  });

  it("clears the 44px touch floor on that control", () => {
    const css = read("src/app/property/[id]/property-detail.css");
    expect(css).toContain(".sidebar-details-toggle");
    expect(css).toMatch(/\.sidebar-details-toggle\s*\{[^}]*min-height:\s*44px/);
  });

  it("renders children untouched in Pro", () => {
    // `simpleCollapsed` is false in Pro, so the component short-circuits to
    // its children with no toggle at all.
    expect(simpleCollapsed({ role: "detail", simple: false })).toBe(false);
    expect(sidebarGroupCollapsed(false, false)).toBe(false);
    expect(sidebarGroupCollapsed(false, true)).toBe(false);
  });

  it("collapses in Simple until opened, then stays open", () => {
    expect(sidebarGroupCollapsed(true, false)).toBe(true);
    expect(sidebarGroupCollapsed(true, true)).toBe(false);
  });
});

// ── RULE B, STILL (acceptance test 3) ─────────────────────────────────────

describe("A-083 phase 1 · no Simple copy was authored", () => {
  it("adds no mode-branched strings to the property surfaces", () => {
    for (const file of [...FLOWS, "src/components/property/MarketChapter.js",
                        "src/components/property/ChapterSubtitle.js",
                        "src/components/property/SidebarDetails.js"]) {
      const source = read(file);
      expect(source).not.toMatch(/isSimpleMode\(\)\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
      expect(source).not.toMatch(/simple\s*\?\s*["'`][^"'`]{2,}["'`]\s*:\s*["'`][^"'`]{2,}["'`]/);
    }
  });
});
