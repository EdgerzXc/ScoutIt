import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("Mobile Footer Ergonomics & Architecture Contract", () => {
  const footerSource = read("src/components/layout/Footer.js");

  it("contains direct navigation for Space Catalog, Categories, and Community Signals", () => {
    // Catalog & Categories
    expect(footerSource).toContain("Catalog & Spaces");
    expect(footerSource).toContain('href: "/property"');
    expect(footerSource).toContain('href: "/property?type=Commercial"');
    expect(footerSource).toContain('href: "/property?type=Residential"');
    expect(footerSource).toContain('href: "/property?type=Restaurants"');
    expect(footerSource).toContain('href: "/property?type=Venues"');
    expect(footerSource).toContain('href: "/property?type=STR"');
    expect(footerSource).toContain('href: "/property?type=Hospitality"');

    // Community & Signals
    expect(footerSource).toContain("Community & Signals");
    expect(footerSource).toContain('href: "/stratosphere"');
    expect(footerSource).toContain('href: "/stratosphere?view=radar"');
    expect(footerSource).toContain('href: "/stratosphere?action=post"');
    expect(footerSource).toContain('href: "/intel"');
    expect(footerSource).toContain('href: "/wishlist"');
  });

  it("provides Fast Lanes quick bar for 1-tap mobile navigation", () => {
    expect(footerSource).toContain("FAST LANES:");
    expect(footerSource).toContain('"CATALOG"');
    expect(footerSource).toContain('"SIGNALS"');
    expect(footerSource).toContain('"INTEL"');
    expect(footerSource).toContain('"ROSTER"');
    expect(footerSource).toContain('"BOARD"');
    expect(footerSource).toContain('"DASH"');
  });

  it("enforces 2-column balanced grid on mobile to eliminate endless single-column scrolling", () => {
    // 2-column grid in @media (max-width: 768px) and (max-width: 480px)
    expect(footerSource).toMatch(/@media\s*\(max-width:\s*768px\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(footerSource).toMatch(/@media\s*\(max-width:\s*480px\)[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  it("provides bottom clearance so fixed BottomNav never obscures legal copy", () => {
    expect(footerSource).toContain("calc(100px + env(safe-area-inset-bottom, 0px))");
  });
});
