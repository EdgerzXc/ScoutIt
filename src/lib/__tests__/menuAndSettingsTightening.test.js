import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { menuEntries } from "@/lib/navigationManifest";
import { SETTINGS_SECTIONS } from "@/lib/settingsNavigation";

// A-136 — the menu and Settings carry only what people use. Each decision in
// the A-136 decision log is pinned here so it cannot quietly grow back.

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
// Comments stripped, so an assertion is never satisfied by a comment.
const strip = (src) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

describe("A-136 · the menu carries only what people use", () => {
  it("the signed-in menu is exactly these eight entries, in this order", () => {
    expect(menuEntries(true).map((entry) => entry.id)).toEqual([
      "profile",
      "settings",
      "discover",
      "brokers",
      "wishlist",
      "dashboard",
      "about",
      "contact",
    ]);
  });

  it("has no Home entry (the logo is home) and no coming-soon directories", () => {
    const ids = menuEntries(true).map((entry) => entry.id);
    for (const gone of ["home", "photographers", "researchers", "event-planners"]) {
      expect(ids).not.toContain(gone);
    }
    expect(strip(read("src/components/layout/Header.js"))).toContain('<ScoutItWordmark href="/"');
  });

  it("offers Help & Display once per screen size", () => {
    const header = strip(read("src/components/layout/Header.js"));
    expect(header).toMatch(/@media \(max-width: 640px\) \{[\s\S]*?\.header-eye-btn \{\s*display: none;/);
    expect(header).toMatch(/@media \(min-width: 641px\) \{\s*\.dropdown-display-btn \{ display: none; \}/);
  });
});

describe("A-136 · Settings says nothing untrue and nothing twice", () => {
  const page = strip(read("src/app/settings/page.js"));

  it("shows no hard-coded badge", () => {
    expect(page).not.toMatch(/FOUNDING_SEEKER|BADGE_DEFINITIONS|Honors & Badges/);
  });

  it("has no section that only repeats the menu", () => {
    expect(SETTINGS_SECTIONS.map((section) => section.id)).not.toContain("display-guide");
    expect(page).not.toContain('id="display-guide"');
    expect(page).not.toContain("openHelpAndDisplay");
  });

  it("puts the one Save button right after the fields it saves, before Privacy", () => {
    expect(page.split("onClick={handleSave}").length - 1).toBe(1);
    const profile = page.indexOf('id="public-profile"');
    const save = page.indexOf("onClick={handleSave}");
    const privacy = page.indexOf('id="privacy"');
    expect(profile).toBeGreaterThan(-1);
    expect(save).toBeGreaterThan(profile);
    expect(save).toBeLessThan(privacy);
  });

  it("keeps delete account and sign out reachable", () => {
    expect(page).toContain('id="delete-account"');
    expect(page).toContain("onClick={handleSignOut}");
  });
});
