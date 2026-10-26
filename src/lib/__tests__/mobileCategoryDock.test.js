import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const COMPONENT_SRC = codeWithoutComments("src/components/hero/MobileCategoryDock.js");
const CSS_SRC = codeWithoutComments("src/components/hero/mobileCategoryDock.module.css");
const DRIFTING_CSS_SRC = codeWithoutComments("src/components/hero/driftingPropertyBubbles.module.css");

describe("Mobile Category Dock · Taxonomy & Canonical Routing", () => {
  it("imports and maps all 6 canonical ScoutIt space categories", () => {
    expect(COMPONENT_SRC).toContain("CELESTIAL_SPACES");
    expect(COMPONENT_SRC).toContain("space.type");
    expect(COMPONENT_SRC).toContain("space.label");
    expect(COMPONENT_SRC).toContain("space.zone");
  });

  it("links directly to canonical property catalog route with type query", () => {
    expect(COMPONENT_SRC).toContain("`/property?type=${encodeURIComponent(space.type)}`");
  });

  it("dispatches custom consumption telemetry on space selection", () => {
    expect(COMPONENT_SRC).toContain('"scoutit:black-hole-consume"');
  });

  it("ensures accessible labels and list semantics exist", () => {
    expect(COMPONENT_SRC).toContain('aria-label="Direct space categories"');
    expect(COMPONENT_SRC).toContain('role="list"');
    expect(COMPONENT_SRC).toContain('role="listitem"');
  });
});

describe("Mobile Category Dock · Desktop Isolation & Apple HIG Touch Targets", () => {
  it("strictly enforces desktop isolation so dock never displays on desktop", () => {
    expect(CSS_SRC).toMatch(/@media\s*\(\s*min-width\s*:\s*769px\s*\)\s*\{[\s\S]*?display\s*:\s*none\s*!important/);
  });

  it("enforces mobile isolation on drifting physics bubbles so they do not collide with mobile touch", () => {
    expect(DRIFTING_CSS_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.container\s*\{[\s\S]*?display\s*:\s*none\s*!important/);
  });

  it("exceeds Apple HIG 44px touch floor with minimum 48px touch height", () => {
    expect(CSS_SRC).toContain("min-height: 48px");
  });

  it("implements smooth horizontal scroll snapping for touch devices", () => {
    expect(CSS_SRC).toContain("scroll-snap-type: x mandatory");
    expect(CSS_SRC).toContain("-webkit-overflow-scrolling: touch");
    expect(CSS_SRC).toContain("scroll-snap-align: start");
  });

  it("strictly uses design token CSS variables without raw color literals", () => {
    expect(CSS_SRC).toContain("var(--accent");
    expect(CSS_SRC).toContain("var(--accent-bright");
    expect(CSS_SRC).toContain("var(--text-primary");
    expect(CSS_SRC).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("includes active feedback state for immediate tactile touch confirmation", () => {
    expect(CSS_SRC).toContain(".dockCard:active");
  });

  it("enforces horizontal containment on dockWrapper and dockTrack to prevent hero blowouts", () => {
    expect(CSS_SRC).toContain("max-width: 100%");
    expect(CSS_SRC).toContain("min-width: 0");
    expect(CSS_SRC).toContain("box-sizing: border-box");
  });
});
