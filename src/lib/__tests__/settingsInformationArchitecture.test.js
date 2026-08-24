import fs from "node:fs";
import path from "node:path";
import {
  NAVIGATION_GROUPS,
  menuGroups,
} from "@/lib/navigationManifest";
import { SETTINGS_SECTIONS } from "@/lib/settingsNavigation";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("menu and Settings information architecture", () => {
  it("groups every universal-menu entry once under a deliberate user-facing label", () => {
    expect(NAVIGATION_GROUPS.map((group) => group.id)).toEqual([
      "account",
      "explore",
      "workspace",
      "help",
    ]);

    for (const signedIn of [false, true]) {
      const groups = menuGroups(signedIn);
      const entries = groups.flatMap((group) => group.entries);
      expect(groups.map((group) => group.label)).toEqual([
        "Account",
        "Explore",
        "Workspace",
        "Help",
      ]);
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
      expect(entries.find((entry) => entry.id === "settings")?.href).toBe("/settings");
      expect(entries.find((entry) => entry.id === "contact")?.href).toBe("/contact");
    }
  });

  it("defines stable, directly reachable Settings sections", () => {
    expect(SETTINGS_SECTIONS.map((section) => section.id)).toEqual([
      "account",
      "public-profile",
      "privacy",
      "security",
      "display-guide",
    ]);
    for (const section of SETTINGS_SECTIONS) {
      expect(section.href).toBe(`#${section.id}`);
      expect(section.label.trim()).not.toBe("");
    }
  });

  it("renders navigation from the manifests and exposes each Settings target", () => {
    const header = read("src/components/layout/Header.js");
    const settings = read("src/app/settings/page.js");

    expect(header).toContain("menuGroups(Boolean(user))");
    expect(header).toContain("group.entries.map");
    expect(header).toContain("Help & Display");
    expect(settings).toContain("SETTINGS_SECTIONS.map");
    for (const section of SETTINGS_SECTIONS) {
      expect(settings).toContain(`id=\"${section.id}\"`);
    }
    expect(settings).toContain('new CustomEvent("scoutit:open-display-settings")');
  });

  it("preserves keyboard, route-change, and reduced-motion menu contracts", () => {
    const header = read("src/components/layout/Header.js");
    expect(header).toContain('event.key === "Escape"');
    expect(header).toContain('event.key !== "Tab"');
    expect(header).toContain("lastPathRef.current === pathname");
    expect(header).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
