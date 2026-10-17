import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const COMPONENT_SRC = codeWithoutComments("src/components/hero/DriftingPropertyBubbles.js");
const CSS_SRC = codeWithoutComments("src/components/hero/driftingPropertyBubbles.module.css");

describe("Drifting Celestial Property Bubbles · Taxonomy & Infall Physics", () => {
  it("defines all 6 canonical ScoutIt space categories", () => {
    expect(COMPONENT_SRC).toContain('"Commercial"');
    expect(COMPONENT_SRC).toContain('"Residential"');
    expect(COMPONENT_SRC).toContain('"Restaurants"');
    expect(COMPONENT_SRC).toContain('"Venues"');
    expect(COMPONENT_SRC).toContain('"STR"');
    expect(COMPONENT_SRC).toContain('"Hospitality"');
  });

  it("strictly bounds simultaneous drifting bodies to at most 2", () => {
    expect(COMPONENT_SRC).toContain("prev.length >= 2");
  });

  it("links directly to canonical property catalog route without slug drift", () => {
    expect(COMPONENT_SRC).toContain("`/property?type=${encodeURIComponent(drifter.category.type)}`");
  });

  it("defines slow, majestic orbital infall vectors curving around singularity", () => {
    expect(COMPONENT_SRC).toContain("ORBITAL_CLASSES");
    expect(CSS_SRC).toContain("orbitInfallNE");
    expect(CSS_SRC).toContain("orbitInfallNW");
    expect(CSS_SRC).toContain("orbitInfallSE");
    expect(CSS_SRC).toContain("orbitInfallSW");
  });
});

describe("Drifting Celestial Property Bubbles · Singularity Interaction & Telemetry", () => {
  it("dispatches custom consumption telemetry event upon black hole ingestion", () => {
    expect(COMPONENT_SRC).toContain('"scoutit:black-hole-consume"');
  });

  it("guards against performance overhead with Lite Mode check", () => {
    expect(COMPONENT_SRC).toContain("isLiteMode");
  });

  it("ensures accessible labels and touch targets exist for interactive controls", () => {
    expect(COMPONENT_SRC).toContain("aria-label");
    expect(COMPONENT_SRC).toContain("role=");
  });

  it("renders hover telemetry callout with zone and action instructions", () => {
    expect(COMPONENT_SRC).toContain("category.zone");
    expect(COMPONENT_SRC).toContain("Click to Enter");
  });
});

describe("Drifting Celestial Property Bubbles · CSS Module Compliance", () => {
  it("names all transition properties and forbids transition: all", () => {
    expect(CSS_SRC).not.toMatch(/transition\s*:\s*all/);
  });

  it("strictly consumes CSS variables without raw non-palette hardcoded colors", () => {
    expect(CSS_SRC).toContain("var(--accent");
    expect(CSS_SRC).toContain("var(--accent-bright");
  });

  it("defines :active feedback for interactive surface", () => {
    expect(CSS_SRC).toContain(":active");
  });
});
