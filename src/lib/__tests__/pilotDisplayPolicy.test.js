import fs from "node:fs";
import path from "node:path";

const read = (relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("controlled-pilot display policy", () => {
  it("keeps Light Mode out of the selector and normalizes a stored Light preference", () => {
    const toolbox = read("src/components/ui/FloatingToolbox.js");
    expect(toolbox).not.toContain('{ key: "light"');
    expect(toolbox).toContain('requestedMode === "light" ? "dark"');
    expect(toolbox).toContain('localStorage.setItem("scoutit_display_mode", "dark")');
  });

  it("advertises only the accepted display controls in the universal header", () => {
    const header = read("src/components/layout/Header.js");
    expect(header).toContain("Display Settings (Dark / High Contrast / Lite Mode)");
    expect(header).not.toContain("Display Settings (Light / Lite / Dark Mode)");
  });
});
