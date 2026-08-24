import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ACCOUNT_ENTRIES,
  PRIMARY_NAV_ENTRIES,
  NAVIGATION_GROUPS,
  menuGroups,
  accountEntry,
  menuEntries,
} from "@/lib/navigationManifest";

const routeExists = (href) => {
  const segment = href === "/" ? "" : href.replace(/^\//, "");
  return ["page.js", "page.jsx", "page.tsx"].some((file) =>
    existsSync(resolve(process.cwd(), "src/app", segment, file)),
  );
};

describe("universal navigation manifest", () => {
  const all = [...PRIMARY_NAV_ENTRIES, ACCOUNT_ENTRIES.signedIn, ACCOUNT_ENTRIES.signedOut];

  it("points every entry at a route that exists in this build", () => {
    expect(all.length).toBeGreaterThan(0);
    const broken = all.filter((entry) => !routeExists(entry.href));
    expect(broken).toEqual([]);
  });

  it("gives every entry a unique id, a label, and an absolute internal href", () => {
    const ids = all.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const entry of all) {
      expect(entry.label.trim()).not.toBe("");

      expect(entry.href.startsWith("/")).toBe(true);
    }
  });

  it("assigns every entry to one declared navigation group", () => {
    const groupIds = new Set(NAVIGATION_GROUPS.map((group) => group.id));
    for (const entry of all) expect(groupIds.has(entry.group)).toBe(true);

    for (const signedIn of [false, true]) {
      const grouped = menuGroups(signedIn).flatMap((group) => group.entries);
      expect(grouped).toEqual(menuEntries(signedIn));
    }
  });

  it("swaps only the account row between signed-out and signed-in", () => {
    const out = menuEntries(false);
    const inn = menuEntries(true);

    expect(out[0]).toEqual(ACCOUNT_ENTRIES.signedOut);
    expect(inn[0]).toEqual(ACCOUNT_ENTRIES.signedIn);
    expect(out.slice(1)).toEqual(inn.slice(1));
    expect(accountEntry(false).href).toBe("/onboarding");
    expect(accountEntry(true).href).toBe("/profile");
  });

  it("is the only source the header menu renders from", () => {
    const header = readFileSync(resolve(process.cwd(), "src/components/layout/Header.js"), "utf8");
    const panel = header.slice(header.indexOf('id="header-menu-panel"'), header.indexOf("</nav>"));
    expect(panel).toContain("menuGroups(Boolean(user))");
    // A hand-written destination inside the panel would drift away from the
    // manifest silently, and nothing would route-check it.
    expect(panel).not.toMatch(/href="\//);
  });
});
