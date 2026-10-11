import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const BUILDING_SPECS_SRC = codeWithoutComments("src/components/intel/widgets/BuildingSpecsCard.js");
const UNIT_MIX_SRC = codeWithoutComments("src/components/intel/widgets/UnitMixExplorer.js");
const TRANSIT_SRC = codeWithoutComments("src/components/intel/widgets/SpatialTransitHighlight.js");
const COMPARISON_SRC = codeWithoutComments("src/components/intel/widgets/SpatialComparisonMatrix.js");
const ARTICLE_BLOCKS_SRC = codeWithoutComments("src/components/intel/ArticleBlocks.js");

describe("Interactive Article Widgets Source Contract (A-195)", () => {
  it("ArticleBlocks imports and renders all 4 interactive building widgets", () => {
    expect(ARTICLE_BLOCKS_SRC).toContain("BuildingSpecsCard");
    expect(ARTICLE_BLOCKS_SRC).toContain("UnitMixExplorer");
    expect(ARTICLE_BLOCKS_SRC).toContain("SpatialTransitHighlight");
    expect(ARTICLE_BLOCKS_SRC).toContain("SpatialComparisonMatrix");

    expect(ARTICLE_BLOCKS_SRC).toContain('case "building_specs":');
    expect(ARTICLE_BLOCKS_SRC).toContain('case "unit_mix":');
    expect(ARTICLE_BLOCKS_SRC).toContain('case "transit_corridor":');
    expect(ARTICLE_BLOCKS_SRC).toContain('case "comparison_matrix":');
  });

  describe("BuildingSpecsCard component contract", () => {
    it("is a client component with interactive state tabs", () => {
      expect(BUILDING_SPECS_SRC).toContain('"use client"');
      expect(BUILDING_SPECS_SRC).toContain("useState");
      expect(BUILDING_SPECS_SRC).toContain("activeTab");
    });

    it("has accessible landmarks and ARIA roles", () => {
      expect(BUILDING_SPECS_SRC).toContain('role="region"');
      expect(BUILDING_SPECS_SRC).toContain('role="tablist"');
      expect(BUILDING_SPECS_SRC).toContain('role="tab"');
      expect(BUILDING_SPECS_SRC).toContain('role="tabpanel"');
    });

    it("uses tokenized CSS classes and avoids transition-all", () => {
      expect(BUILDING_SPECS_SRC).not.toContain("transition-all");
      expect(BUILDING_SPECS_SRC).not.toContain("#e8ae3c");
      expect(BUILDING_SPECS_SRC).toContain("gold-accent");
    });
  });

  describe("UnitMixExplorer component contract", () => {
    it("is a client component with interactive state for unit layouts", () => {
      expect(UNIT_MIX_SRC).toContain('"use client"');
      expect(UNIT_MIX_SRC).toContain("useState");
      expect(UNIT_MIX_SRC).toContain("selectedIndex");
    });

    it("has accessible tablist and tabpanel semantics", () => {
      expect(UNIT_MIX_SRC).toContain('role="region"');
      expect(UNIT_MIX_SRC).toContain('role="tablist"');
      expect(UNIT_MIX_SRC).toContain('role="tab"');
      expect(UNIT_MIX_SRC).toContain('role="tabpanel"');
    });

    it("converts square meters to square feet dynamically", () => {
      expect(UNIT_MIX_SRC).toContain("10.7639");
    });
  });

  describe("SpatialTransitHighlight component contract", () => {
    it("is a client component that highlights transit stations", () => {
      expect(TRANSIT_SRC).toContain('"use client"');
      expect(TRANSIT_SRC).toContain("setSelectedHub");
    });

    it("has accessible keyboard interaction support", () => {
      expect(TRANSIT_SRC).toContain("onKeyDown");
      expect(TRANSIT_SRC).toContain('e.key === "Enter"');
    });

    it("displays distance and walk times with tokenized styling", () => {
      expect(TRANSIT_SRC).toContain("distanceMeters");
      expect(TRANSIT_SRC).toContain("walkMinutes");
      expect(TRANSIT_SRC).not.toContain("transition-all");
    });
  });

  describe("SpatialComparisonMatrix component contract", () => {
    it("renders comparison benchmarks with role list and listitem", () => {
      expect(COMPARISON_SRC).toContain('role="region"');
      expect(COMPARISON_SRC).toContain('role="list"');
      expect(COMPARISON_SRC).toContain('role="listitem"');
    });

    it("highlights the subject property distinctly", () => {
      expect(COMPARISON_SRC).toContain("isSubject");
      expect(COMPARISON_SRC).toContain("SUBJECT PROPERTY");
    });
  });
});
