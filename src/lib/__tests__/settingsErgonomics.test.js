import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SETTINGS_SECTIONS } from "@/lib/settingsNavigation";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("Settings Web & Mobile Ergonomics and Simple Language", () => {
  const page = strip(read("src/app/settings/page.js"));
  const css = read("src/app/settings/page.module.css");

  it("exposes all 7 core settings section anchors in strict order", () => {
    const expected = [
      "account",
      "public-profile",
      "privacy",
      "notifications",
      "plan",
      "security",
      "delete-account",
    ];
    expect(SETTINGS_SECTIONS.map((s) => s.id)).toEqual(expected);

    let lastIndex = -1;
    for (const id of expected) {
      const idx = page.indexOf(`id="${id}"`);
      expect(idx).toBeGreaterThan(lastIndex);
      lastIndex = idx;
    }
  });

  it("implements active section scrollspy tracking for smooth mobile and web browsing", () => {
    expect(page).toContain("activeSection");
    expect(page).toContain("setActiveSection");
    expect(page).toContain("IntersectionObserver");
    expect(page).toContain("styles.navLinkActive");
    expect(page).toContain("scrollIntoView");
    expect(css).toContain(".navLinkActive");
  });

  it("uses common, simple, friendly words across headings and helpers", () => {
    // Plain English titles & labels
    expect(page).toContain("Your Details & Roles");
    expect(page).toContain("Your Roles");
    expect(page).toContain("Looking to Buy / Rent");
    expect(page).toContain("Property Owner / Landlord");
    expect(page).toContain("Public Profile Card");
    expect(page).toContain("Password & Two-Step Verification");
    expect(page).toContain("Close Account & Delete Data");
    expect(page).toContain("Save Profile Changes");

    // Preserves necessary gate contracts
    expect(page).toContain("Need another lens?");
    expect(page).toContain("canAddRole(role, evidence)");
  });

  it("guarantees Apple HIG >= 44px tap targets for mobile touch controls", () => {
    expect(css).toMatch(/\.settingsNav a\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.backBtn\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.buttonPrimary\s*\{[\s\S]*?min-height:\s*48px/);
    expect(css).toMatch(/\.signOutButton\s*\{[\s\S]*?min-height:\s*48px/);
  });

  it("provides inline save feedback without abruptly evicting user from settings", () => {
    expect(page).toContain("saveSuccess");
    expect(page).toContain("saveSuccessBanner");
    expect(page).toContain("setInitialTags(tags)");
  });

  it("integrates InfoTip tooltips across key settings fields for user ease of use", () => {
    expect(page).toContain('import InfoTip from "@/components/ui/InfoTip"');
    for (const tipId of [
      "settingsDisplayName",
      "settingsWorkspaces",
      "settingsPrcLicense",
      "settingsServicesOffered",
      "settingsPublicCard",
      "settingsTwoFactor",
    ]) {
      expect(page).toContain(`tipId="${tipId}"`);
    }
  });
});
