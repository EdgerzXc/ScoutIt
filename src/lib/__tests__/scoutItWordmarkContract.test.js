import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const SHARED_CONSUMERS = [
  "src/app/page.js",
  "src/app/enterprise/page.js",
  "src/app/transit/page.js",
  "src/app/property/[id]/brokers/BrokersClient.js",
  "src/components/descent/LayerNav.js",
  "src/components/layout/Header.js",
  "src/components/layout/Footer.js",
];

describe("F-006 ScoutIt wordmark contract", () => {
  it("owns the exact gold-white-gold split and accessible name in one component", () => {
    const component = read("src/components/brand/ScoutItWordmark.js");
    const styles = read("src/components/brand/ScoutItWordmark.module.css");

    expect(component).toContain('aria-label="ScoutIt"');
    expect(component).toContain('>S</span>');
    expect(component).toContain('>cout</span>');
    expect(component).toContain('>IT</span>');
    expect(styles).toContain("color: var(--accent)");
    expect(styles).toContain("color: var(--text-primary)");
    expect(styles).not.toMatch(/#[0-9a-f]{3,8}/i);
  });

  it("is reused by unlocked global, discovery, layer, and specialist lockups", () => {
    for (const file of SHARED_CONSUMERS) {
      expect(read(file), file).toContain("ScoutItWordmark");
    }
    expect(read("src/app/discover/DiscoverClient.js")).not.toContain("brandLogo");
    expect(read("src/app/property/[id]/brokers/BrokersClient.js")).not.toContain('className="nav-brand-logo">SCOUTIT');
  });

  it("preserves the correct split on the owner-locked Showcase without editing it", () => {
    const showcase = read("src/components/board/ShowcaseStage.js");
    expect(showcase).toContain('<span className="brand-s">S</span>');
    expect(showcase).toContain('<span className="brand-scout">cout</span>');
    expect(showcase).toContain('<span className="brand-it">IT</span>');
  });

  it("uses an ImageResponse-safe split across generated social cards", () => {
    const renderer = read("src/components/brand/ScoutItImageWordmark.js");
    expect(renderer).toContain('color: "var(--accent)"');
    expect(renderer).toContain('color: "var(--text-primary)"');
    expect(renderer).toContain('>S</span>');
    expect(renderer).toContain('>cout</span>');
    expect(renderer).toContain('>IT</span>');

    for (const file of ["src/app/opengraph-image.js", "src/app/twitter-image.js", "src/app/api/og/route.js"]) {
      const source = read(file);
      expect(source, file).toContain("ScoutItImageWordmark");
      expect(source, file).not.toMatch(/>\s*SCOUTIT\s*</);
      expect(source, file).not.toMatch(/Scout<span/);
    }
  });
});
