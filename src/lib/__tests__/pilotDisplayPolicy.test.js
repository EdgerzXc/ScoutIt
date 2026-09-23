import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("controlled-pilot display policy", () => {
  // WHITE LENS 2026-09-23 (owner-approved, WHITE_LENS_SPEC): the withhold is
  // lifted. Light is offered as an OPT-IN preview ("Light / White Lens"),
  // dark stays the default, and a stored preference is kept as-is instead
  // of being normalized back to dark. Rule 14: this re-aims the test to the
  // new policy rather than deleting the guard.
  it("offers Light Mode as opt-in preview and keeps a stored Light preference", () => {
    const toolbox = read("src/components/ui/FloatingToolbox.js");
    expect(toolbox).toContain('{ key: "light"');
    expect(toolbox).not.toContain('requestedMode === "light" ? "dark"');
    expect(toolbox).toContain("const savedMode = requestedMode;");
    expect(toolbox).toContain('|| "dark"');
  });

  it("advertises only the accepted display controls in the universal header", () => {    const header = read("src/components/layout/Header.js");
    // A-083 added Simple Mode to this panel, so the accessible name names it
    // too — the label is a promise about what the panel contains.
    expect(header).toContain("Help & Display (Guide / Dark / High Contrast / Lite Mode / Simple Mode)");
    expect(header).not.toContain("Display Settings (Dark / High Contrast / Lite Mode)");
    expect(header).not.toContain("Display Settings (Light / Lite / Dark Mode)");
  });

  // WHITE LENS 2026-09-23 (owner-approved, WHITE_LENS_SPEC): mobile offers
  // the same opt-in Light preview and keeps the stored preference, matching
  // FloatingToolbox — no more platform split. Rule 14: re-aimed, not deleted.
  it("offers Light Mode on mobile too and keeps a stored Light preference", () => {
    const nav = read("src/components/layout/BottomNav.js");
    expect(nav).toContain('{ key: "light"');
    expect(nav).not.toContain('requestedMode === "light" ? "dark"');
    expect(nav).toContain("setCurrentMode(requestedMode);");
  });

  it("carries the Simple toggle in the mobile sheet, as the panel name promises", () => {
    const nav = read("src/components/layout/BottomNav.js");
    expect(nav).toContain("toggleSimple");
    expect(nav).toContain("Simple Mode");
  });

  it("starts each homepage visit with the simple black hole", () => {
    const layout = read("src/app/layout.js");
    const homepage = read("src/app/HomeClient.js");
    const mode = read("src/lib/liteMode.js");
    expect(layout).not.toContain("scoutit_interactive_mode");
    expect(homepage).toContain("setInteractiveMode(false);");
    expect(homepage).toContain("<BlackHoleCanvas />");
    expect(mode).not.toContain("localStorage.setItem(INTERACTIVE_MODE_KEY");
    expect(mode).toContain("localStorage.removeItem(LEGACY_INTERACTIVE_MODE_KEY)");
  });
});
