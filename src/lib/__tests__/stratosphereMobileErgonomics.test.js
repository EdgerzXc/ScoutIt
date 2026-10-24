import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (relative) => readFileSync(resolve(process.cwd(), relative), "utf8");

describe("A-231 Stratosphere Layer 02 Mobile Ergonomics & Touch Optimization", () => {
  it("suppresses sticky native browser title on stage buttons while keeping aria-label and floating tooltip", () => {
    const jsx = read("src/components/stratosphere/StratosphereWorkspace.js");
    // Should NOT have title={item.hint} on the stage button
    expect(jsx).not.toMatch(/<button[^>]*title=\{item\.hint\}/);
    // Preserves aria-label and floating tooltip
    expect(jsx).toContain("aria-label={`${item.label} · ${item.hint}`}");
    expect(jsx).toContain("sw-stage-tooltip");
  });

  it("locks 'Explore by area.' and InfoTip inside an inline-flex container to prevent orphaned wrapping", () => {
    const jsx = read("src/components/stratosphere/StratosphereWorkspace.js");
    expect(jsx).toContain("sw-radar-note-lead");
    expect(jsx).toContain('tipId="exploreByArea"');

    const css = read("src/components/stratosphere/stratosphere-workspace.css");
    expect(css).toContain(".sw-radar-note-lead {");
    const leadBlock = css.slice(css.indexOf(".sw-radar-note-lead {"));
    const leadRules = leadBlock.slice(0, leadBlock.indexOf("}"));
    expect(leadRules).toContain("display: inline-flex");
    expect(leadRules).toContain("white-space: nowrap");
  });

  it("provides smooth scroll-snapping track navigation on mobile", () => {
    const css = read("src/components/stratosphere/stratosphere-workspace.css");
    expect(css).toContain("scroll-snap-type: x mandatory");
    expect(css).toContain("scroll-snap-align: start");
    expect(css).toContain("-webkit-overflow-scrolling: touch");
  });

  it("organizes stage subcategory chips into a balanced 2-column mobile grid with lead item spanning full width", () => {
    const css = read("src/components/stratosphere/stratosphere-workspace.css");
    expect(css).toContain(".sw-stage-options--lead .sw-stage-btn:first-child");
    expect(css).toContain("grid-column: 1 / -1");
    expect(css).toContain("grid-template-columns: repeat(2, minmax(0, 1fr))");
  });

  it("satisfies Apple HIG 44px min-height touch targets on mobile controls", () => {
    const css = read("src/components/stratosphere/stratosphere-workspace.css");
    const mobileMediaIdx = css.indexOf("@media (max-width: 768px)");
    expect(mobileMediaIdx).toBeGreaterThan(0);
    const mobileSlice = css.slice(mobileMediaIdx);

    // .sw-view-switch button, .sw-post-btn, .sw-track-tab, .sw-stage-btn all min-height: 44px
    expect(mobileSlice).toMatch(/\.sw-view-switch button\s*\{[^}]*min-height:\s*44px/);
    expect(mobileSlice).toMatch(/\.sw-post-btn\s*\{[^}]*min-height:\s*44px/);
    expect(mobileSlice).toMatch(/\.sw-track-tab\s*\{[^}]*min-height:\s*44px/);
    expect(mobileSlice).toMatch(/\.sw-stage-btn\s*\{[^}]*min-height:\s*44px/);
  });

  it("provides safe-area bottom navigation clearance for fixed BottomNav", () => {
    const css = read("src/components/stratosphere/stratosphere-workspace.css");
    expect(css).toContain("calc(84px + env(safe-area-inset-bottom, 0px))");
  });
});
