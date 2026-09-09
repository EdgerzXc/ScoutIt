import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "src/components/layout/Header.js"), "utf8");
const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

describe("universal header menu operating layer", () => {
  it("dismisses on Escape and hands focus back to the trigger", () => {
    expect(header).toContain('event.key === "Escape"');
    expect(header).toContain("menuButtonRef.current?.focus()");
  });

  it("keeps Tab inside the open panel in both directions", () => {
    expect(header).toContain('event.key !== "Tab"');
    expect(header).toContain("event.shiftKey");
  });

  it("dismisses on an outside pointer gesture rather than a mouse-only one", () => {
    expect(header).toContain('document.addEventListener("pointerdown"');
    expect(header).not.toContain('addEventListener("mousedown"');
  });

  it("closes on route change, not only on item click", () => {
    expect(header).toContain("usePathname");
    expect(header).toMatch(/setMenuOpen\(false\);\s*\}, \[pathname\]\)/);
  });

  it("announces the panel it controls as a disclosure, not an ARIA menu", () => {
    expect(header).toContain('aria-controls="header-menu-panel"');
    expect(header).toContain("aria-expanded={menuOpen}");
    // Site navigation is a disclosure of links, not an application menu.
    // role="menu"/"menuitem" would promise arrow-key navigation that does not
    // exist, and it strips the native link and button roles that assistive
    // technology and test locators rely on.
    expect(header).not.toMatch(/role="menu(item)?"/);
  });

  it("uses dvh for the mobile sheet, because vh lies under the iOS toolbar", () => {
    const sheet = header.slice(header.indexOf(".header-dropdown {"));
    expect(sheet).not.toMatch(/max-height:\s*\d+vh/);
    // A-119: these anchors used to include the section rule's box-drawing
    // characters, which were double-encoded in globals.css — so the test only
    // matched because BOTH sides were corrupted identically. Repairing the
    // source invalidated the test, and per Rule 14 the test is part of that
    // change: re-aimed, not deleted. It now anchors on the words alone, so no
    // future encoding change can break it again.
    const startIndex = globals.indexOf("DROPDOWN POSITIONING FIX");
    const endIndex = globals.indexOf("SEARCH INPUT OPTIMIZATION");
    expect(startIndex, "the dropdown positioning section still exists").toBeGreaterThan(-1);
    expect(endIndex, "the search input section still exists").toBeGreaterThan(startIndex);
    const globalMobileSheet = globals.slice(startIndex, endIndex);
    expect(globalMobileSheet).not.toMatch(/max-height:\s*\d+vh/);
    expect(globalMobileSheet).toContain("env(safe-area-inset-top");
    expect(globalMobileSheet).toContain("env(safe-area-inset-bottom");
    expect(globalMobileSheet).toContain("overscroll-behavior: contain");
  });

  // styled-jsx does not attach its scoping class to elements rendered from a
  // map callback. Scoped `.header-dropdown a` rules silently stopped matching
  // when the items moved to the manifest, and every item lost its padding,
  // colour and 44px mobile height with no error anywhere.
  it("scopes the item rules globally so manifest-rendered links keep their styling", () => {
    expect(header).not.toMatch(/\.header-dropdown a[\s:{]/);
    expect(header).toContain(".header-dropdown :global(a)");
  });
});
