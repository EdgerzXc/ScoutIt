import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Mobile Header Weather App & Ambient Rail Invariant", () => {
  const headerPath = path.resolve(process.cwd(), "src/components/layout/Header.js");
  const headerSource = fs.readFileSync(headerPath, "utf-8");

  it("exports a valid DEFAULT_AMBIENT_CONTEXT so weather runs site-wide", () => {
    expect(headerSource).toContain("export const DEFAULT_AMBIENT_CONTEXT = Object.freeze({");
    expect(headerSource).toContain('key: "global:bgc-taguig"');
    expect(headerSource).toContain('source: "property"');
    expect(headerSource).toContain('shortName: "BGC"');
    expect(headerSource).toContain("latitude: 14.5492");
    expect(headerSource).toContain("longitude: 121.0494");
  });

  it("ensures .header-center is NOT hidden with display:none in mobile media queries", () => {
    // Look for scoped styled-jsx blocks in Header.js
    const media640Match = headerSource.match(/@media\s*\(max-width:\s*640px\)[\s\S]*?\.header-center\s*\{([^}]*)\}/);
    expect(media640Match, "640px media query for .header-center should exist").not.toBeNull();
    expect(media640Match[1]).not.toContain("display: none");
    expect(media640Match[1]).toContain("display: flex");

    const media560Match = headerSource.match(/@media\s*\(max-width:\s*560px\)[\s\S]*?\.header-center\s*\{([^}]*)\}/);
    if (media560Match) {
      expect(media560Match[1]).not.toContain("display: none");
    }
  });

  it("passes activeAmbient context to AmbientRail in Header.js", () => {
    expect(headerSource).toContain("activeAmbient = ambientContext || DEFAULT_AMBIENT_CONTEXT");
    expect(headerSource).toContain("<AmbientRail user={user} context={activeAmbient} />");
  });

  it("ensures AmbientRail supports touch viewport click and swipe navigation", () => {
    const ambientRailPath = path.resolve(process.cwd(), "src/components/layout/ambient/AmbientRail.js");
    const ambientRailSource = fs.readFileSync(ambientRailPath, "utf-8");

    expect(ambientRailSource).toContain("onTouchStart");
    expect(ambientRailSource).toContain("onTouchEnd");
    expect(ambientRailSource).toContain("onClick={() => next(true)}");
  });
});
