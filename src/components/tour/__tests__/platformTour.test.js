import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";

function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join(" ");
}

const PLAYER_SOURCE = codeWithoutComments("src/components/tour/PlatformTheaterPlayer.js");
const TOUR_PAGE_SOURCE = codeWithoutComments("src/app/layer/mantle/tour/page.js");
const FOOTER_SOURCE = codeWithoutComments("src/components/layout/Footer.js");
const MANTLE_ARCHIVE_SOURCE = codeWithoutComments("src/components/descent/MantleArchive.js");

describe("A-201 Platform Tour & Guidebook 101 Architecture", () => {
  it("verifies the 5 modular tour clips exist in PlatformTheaterPlayer", () => {
    expect(PLAYER_SOURCE).toContain('"radar"');
    expect(PLAYER_SOURCE).toContain('"dual-cms"');
    expect(PLAYER_SOURCE).toContain('"via-attribution"');
    expect(PLAYER_SOURCE).toContain('"open-gate"');
    expect(PLAYER_SOURCE).toContain('"crm-mobility"');
  });

  it("ensures PlatformTheaterPlayer renders HUD telemetry and obsidian stage", () => {
    expect(PLAYER_SOURCE).toContain("[LAYER 05 // MANTLE]");
    expect(PLAYER_SOURCE).toContain("aspect-video");
    expect(PLAYER_SOURCE).toContain("border-accent");
    expect(PLAYER_SOURCE).toContain("allowFullScreen");
    expect(PLAYER_SOURCE).toContain("MODULAR TECHNICAL CLIPS");
  });

  it("verifies the 4 progressive acts in /layer/mantle/tour/page.js", () => {
    // Act 0: Theater
    expect(TOUR_PAGE_SOURCE).toContain("<PlatformTheaterPlayer");
    // Act 1: 5 Sovereign Capabilities
    expect(TOUR_PAGE_SOURCE).toContain("ACT 01 // CORE SYSTEM CAPABILITIES");
    expect(TOUR_PAGE_SOURCE).toContain("Multi-Overlay Spatial Radar & Elevation GIS");
    expect(TOUR_PAGE_SOURCE).toContain("Dual-CMS Publishing & Slug Sovereignty");
    expect(TOUR_PAGE_SOURCE).toContain("VIA Priority Attribution & Broker Portal");
    expect(TOUR_PAGE_SOURCE).toContain("Open Gate Inbound Landlord Flow");
    expect(TOUR_PAGE_SOURCE).toContain("People & Dealings CRM & Mobility Engine");
    // Act 2: Role-Specific Operating Lenses
    expect(TOUR_PAGE_SOURCE).toContain("ACT 02 // ROLE-SPECIFIC OPERATING LENSES");
    expect(TOUR_PAGE_SOURCE).toContain("Space Seeker");
    expect(TOUR_PAGE_SOURCE).toContain("Licensed Broker");
    expect(TOUR_PAGE_SOURCE).toContain("Property Owner");
    expect(TOUR_PAGE_SOURCE).toContain("Unit Operator");
    // Act 3: Technical Version Ledger
    expect(TOUR_PAGE_SOURCE).toContain("ACT 03 // TECHNICAL VERSION LEDGER");
    expect(TOUR_PAGE_SOURCE).toContain("v1.3");
    expect(TOUR_PAGE_SOURCE).toContain("v1.2");
    expect(TOUR_PAGE_SOURCE).toContain("v1.1");
    expect(TOUR_PAGE_SOURCE).toContain("v1.0");
  });

  it("ensures vanity route /platform-tour exists and is accessible", () => {
    expect(existsSync("src/app/platform-tour/page.js")).toBe(true);
    const vanitySource = readFileSync("src/app/platform-tour/page.js", "utf8");
    expect(vanitySource).toContain("@/app/layer/mantle/tour/page");
  });

  it("verifies Global Footer links to Platform Tour & Guide under Company column", () => {
    expect(FOOTER_SOURCE).toContain('href="/platform-tour"');
    expect(FOOTER_SOURCE).toContain("Platform Tour & Guide");
  });

  it("verifies Layer 05 MantleArchive links to Chapter 05 Platform Tour", () => {
    expect(MANTLE_ARCHIVE_SOURCE).toContain('"tour"');
    expect(MANTLE_ARCHIVE_SOURCE).toContain("Platform Tour");
    expect(MANTLE_ARCHIVE_SOURCE).toContain("/platform-tour");
  });
});
