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

describe("Space Directory · Mobile Category Dropdown Architecture", () => {
  it("renders the luxury category dropdown selector with outside click ref", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("category-dropdown-wrapper");
    expect(DIRECTORY_CLIENT_SRC).toContain("category-dropdown-trigger");
    expect(DIRECTORY_CLIENT_SRC).toContain("categoryDropdownRef");
    expect(DIRECTORY_CLIENT_SRC).toContain("isCategoryDropdownOpen");
  });

  it("provides full ARIA listbox semantics and keyboard dismiss", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain('aria-haspopup="listbox"');
    expect(DIRECTORY_CLIENT_SRC).toContain('aria-controls="mobile-category-listbox"');
    expect(DIRECTORY_CLIENT_SRC).toContain('role="listbox"');
    expect(DIRECTORY_CLIENT_SRC).toContain('role="option"');
    expect(DIRECTORY_CLIENT_SRC).toContain('event.key === "Escape"');
  });

  it("synchronizes currentCategoryLabel directly from selectedSectors (single source of truth)", () => {
    expect(DIRECTORY_CLIENT_SRC).toContain("currentCategoryLabel");
    expect(DIRECTORY_CLIENT_SRC).toContain("FAST_CATEGORIES.find");
    expect(DIRECTORY_CLIENT_SRC).toContain('"All Spaces"');
  });
});

describe("Space Directory · Mobile Reflow & Ergonomics (Antislop)", () => {
  it("hides the 3-row wrapping pills on mobile and shows the centered dropdown selector", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.category-filter-rail\s*\{[\s\S]*?display\s*:\s*none/);
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.category-dropdown-wrapper\s*\{[\s\S]*?display\s*:\s*block/);
  });

  it("centers category filters on desktop to prevent left-heavy alignment", () => {
    expect(PROPERTY_CSS_SRC).toContain("justify-content: center");
  });

  it("complies with Apple HIG and Antislop tap targets (>= 44px touch area)", () => {
    expect(PROPERTY_CSS_SRC).toContain("min-height: 46px");
    expect(PROPERTY_CSS_SRC).toContain("min-height: 44px");
  });

  it("guards hover states so mobile touches do not cause sticky hover effects", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.category-dropdown-trigger:hover/);
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(hover:\s*hover\)\s*and\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.category-dropdown-item:hover/);
  });

  it("includes reduced-motion accessibility overrides", () => {
    expect(PROPERTY_CSS_SRC).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.category-dropdown-trigger/);
  });
});
