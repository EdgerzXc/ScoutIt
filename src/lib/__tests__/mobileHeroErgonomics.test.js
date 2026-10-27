import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");
}

const HOME_CLIENT_SRC = codeWithoutComments("src/app/HomeClient.js");

describe("Home Hero · Responsive Mobile Ergonomics & Karpathy Center Axis", () => {
  it("enforces flex-direction column and centered alignment on .section-hook", () => {
    expect(HOME_CLIENT_SRC).toContain(".section-hook");
    expect(HOME_CLIENT_SRC).toMatch(/\.section-hook\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(HOME_CLIENT_SRC).toMatch(/\.section-hook\s*\{[\s\S]*?align-items:\s*center/);
    expect(HOME_CLIENT_SRC).toMatch(/\.section-hook\s*\{[\s\S]*?justify-content:\s*center/);
  });

  it("bounds .hook-content with max-width and box-sizing to prevent horizontal overflow", () => {
    expect(HOME_CLIENT_SRC).toContain(".hook-content");
    expect(HOME_CLIENT_SRC).toMatch(/\.hook-content\s*\{[\s\S]*?width:\s*100%/);
    expect(HOME_CLIENT_SRC).toMatch(/\.hook-content\s*\{[\s\S]*?margin:\s*0\s*auto/);
    expect(HOME_CLIENT_SRC).toMatch(/\.hook-content\s*\{[\s\S]*?box-sizing:\s*border-box/);
  });

  it("clamps mobile wordmark size to fit small mobile viewports without wrapping", () => {
    expect(HOME_CLIENT_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.scoutit-wordmark[\s\S]*?font-size:\s*clamp\(36px/);
  });

  it("structures mobile hero-cta-row into clear primary and secondary vertical flow", () => {
    expect(HOME_CLIENT_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.hero-cta-row\s*\{[\s\S]*?flex-direction:\s*column/);
    expect(HOME_CLIENT_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.hero-cta-primary\s*\{[\s\S]*?min-height:\s*48px/);
    expect(HOME_CLIENT_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.hero-cta-secondary\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("hides desktop-only orbit showcase CTA on mobile to avoid overcrowding the fold", () => {
    expect(HOME_CLIENT_SRC).toMatch(/@media\s*\(\s*max-width\s*:\s*768px\s*\)\s*\{[\s\S]*?\.hero-cta-row\s*a\[href="\/showcase"\]\s*\{[\s\S]*?display:\s*none\s*!important/);
  });

  it("removes property bubbles dock on mobile hero to keep mobile viewports uncluttered", () => {
    expect(HOME_CLIENT_SRC).not.toContain("<MobileCategoryDock");
    expect(HOME_CLIENT_SRC).not.toContain("MobileCategoryDock =");
  });

  it("integrates MobileCategoryQuickAccess for immediate mobile category routing and action sheet", () => {
    expect(HOME_CLIENT_SRC).toContain("<MobileCategoryQuickAccess");
    expect(HOME_CLIENT_SRC).toContain("MobileCategoryQuickAccess =");
  });

  it("verifies MobileCategoryQuickAccess component maps all 6 categories and uses createPortal sheet", () => {
    const quickAccessSrc = codeWithoutComments("src/components/hero/MobileCategoryQuickAccess.js");
    expect(quickAccessSrc).toContain("CELESTIAL_SPACES");
    expect(quickAccessSrc).toContain("createPortal");
    expect(quickAccessSrc).toContain("`/property?type=${encodeURIComponent(space.type)}`");
    expect(quickAccessSrc).toContain('"scoutit:black-hole-consume"');
    expect(quickAccessSrc).toContain('role="dialog"');
  });

  it("ensures BottomNav includes 6 quick access items: Home, Spaces, Intel, Board, Dashboard, Roles", () => {
    const bottomNavSrc = codeWithoutComments("src/components/layout/BottomNav.js");
    expect(bottomNavSrc).toMatch(/default:\s*\[\s*ITEMS\.home,\s*ITEMS\.spaces,\s*ITEMS\.intel,\s*ITEMS\.board,\s*ITEMS\.dashboard,\s*ITEMS\.role\s*\]/);
  });
});
