import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const DIRECTORY_CLIENT_SRC = codeWithoutComments("src/app/property/DirectoryClient.js");
const PROPERTY_CSS_SRC = codeWithoutComments("src/app/property/property.css");

describe("Space Directory · Mobile Filter Trigger & Unified Search Bar", () => {
  it("integrates mobile-filters-trigger directly in search-action-controls alongside radar", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("search-action-controls");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-filters-trigger");
    expect(DIRECTORY_CLIENT_SRC).toContain("SlidersHorizontal");
    expect(DIRECTORY_CLIENT_SRC).toContain('aria-haspopup="dialog"');
  });

  it("calculates comprehensive activeFilterCount across all dimensions", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("activeFilterCount");
    expect(DIRECTORY_CLIENT_SRC).toContain("selectedSectors.length");
    expect(DIRECTORY_CLIENT_SRC).toContain("selectedLocations.length");
    expect(DIRECTORY_CLIENT_SRC).toContain("selectedPriceBands.length");
    expect(DIRECTORY_CLIENT_SRC).toContain("selectedBuildingGrades.length");
    expect(DIRECTORY_CLIENT_SRC).toContain("selectedBeds.length");
    expect(DIRECTORY_CLIENT_SRC).toContain('radius && radius !== "any"');
  });

  it("renders active-filters-rail with 1-tap chip dismiss and clear-all actions", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("active-filters-rail");
    expect(DIRECTORY_CLIENT_SRC).toContain("active-filter-chip");
    expect(DIRECTORY_CLIENT_SRC).toContain("active-filters-reset-btn");
    expect(DIRECTORY_CLIENT_SRC).toContain("CLEAR ALL");
  });
});

describe("Space Directory · Dedicated Luxury Bottom Sheet Drawer (Antislop & Karpathy)", () => {
  it("renders mobile-filter-drawer modal dialog when showMobileFilters is true", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-filter-drawer");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-filter-drawer-scrim");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-filter-drawer-sheet");
    expect(DIRECTORY_CLIENT_SRC).toContain('role="dialog"');
    expect(DIRECTORY_CLIENT_SRC).toContain('aria-modal="true"');
  });

  it("provides header reset action, close button, and live sticky apply button", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-drawer-header");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-drawer-reset-btn");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-drawer-close-btn");
    expect(DIRECTORY_CLIENT_SRC).toContain("mobile-drawer-apply-btn");
    expect(DIRECTORY_CLIENT_SRC).toMatch(/SHOW\s*\{filteredProperties\.length\}/);
  });

  it("locks body scroll on mobile while the drawer is open to prevent page drift", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain('document.body.style.overflow = "hidden"');
  });

  it("mounts drawer through createPortal onto document.body to avoid stacking context trapping", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("createPortal");
    expect(DIRECTORY_CLIENT_SRC).toContain("document.body");
  });
});

describe("Space Directory · CSS Reflow, Apple HIG & Motion Gates", () => {
  it("prevents flex compression inside drawer body with flex-shrink: 0 and establishes smooth scroll", () => {
    expect(PROPERTY_CSS_SRC).toContain(".mobile-drawer-body > *");
    expect(PROPERTY_CSS_SRC).toContain("flex-shrink: 0");
    expect(PROPERTY_CSS_SRC).toContain("touch-action: pan-y");
    expect(PROPERTY_CSS_SRC).toContain("overscroll-behavior: contain");
  });
  it("hides desktop sidebar completely on mobile/tablet viewports (<= 900px)", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*900px\s*\)\s*\{[\s\S]*?\.filters-sidebar\s*\{[\s\S]*?display\s*:\s*none\s*!important/);
  });

  it("activates mobile-filters-trigger in search-action-controls on mobile", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*900px\s*\)\s*\{[\s\S]*?\.search-action-controls[\s\S]*?\.mobile-filters-trigger/);
  });

  it("enforces Apple HIG touch targets (min-height >= 44px) across drawer and triggers", () => {
    expect(PROPERTY_CSS_SRC).toContain("min-height: 48px");
    expect(PROPERTY_CSS_SRC).toContain("min-height: 44px");
  });

  it("guards hover states with capability guards and active states", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.mobile-filters-trigger:hover/);
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.mobile-drawer-apply-btn:hover/);
    expect(PROPERTY_CSS_SRC).toContain(".mobile-filters-trigger:active");
    expect(PROPERTY_CSS_SRC).toContain(".mobile-drawer-apply-btn:active");
  });

  it("includes reduced-motion accessibility overrides for drawer animations", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.mobile-filter-drawer-sheet/);
  });
});
