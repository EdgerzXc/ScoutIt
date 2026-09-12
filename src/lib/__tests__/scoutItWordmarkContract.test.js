import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

const SHARED_CONSUMERS = [
  "src/app/HomeClient.js",
  "src/app/enterprise/page.js",
  "src/app/transit/page.js",
  "src/app/property/[id]/brokers/BrokersClient.js",
  "src/components/descent/LayerNav.js",
  "src/components/layout/Header.js",
  "src/components/layout/Footer.js",
  "src/components/board/ShowcaseStage.js",
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

  it("uses the shared lockup on the owner-approved Showcase reconciliation (F-006)", () => {
    // Owner approved the exact accessibility-only reconciliation 2026-09-09:
    // shared wordmark, stage de-nested to a non-landmark container, tray
    // names at the non-skipping level. Per Rule 14 this test is part of that
    // change — re-aimed, not deleted. Host styles stay: the shared segments
    // keep the brand-* classes the :global selectors target.
    const showcase = read("src/components/board/ShowcaseStage.js");
    expect(showcase).toContain("ScoutItWordmark");
    expect(showcase).toContain('className="sc-brand-logo"');
    expect(showcase).not.toContain('aria-label="ScoutIT');
    expect(showcase).not.toContain('<span className="brand-s">S</span>');
    // One main per page: the nested stage landmark is a div now (the page's
    // own <main> in showcase/page.js is the single landmark).
    expect(showcase).not.toMatch(/<main[\s>]/);
    expect(showcase).toContain('<div className="sc-command-stage">');
    // Tray names no longer skip from h1 to h4; the class (and its explicit
    // 12px/600 styling) is unchanged, so no pixels move.
    expect(showcase).not.toContain('<h4 className="sc-tray-name">');
    expect(showcase).toContain('<h2 className="sc-tray-name">');
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
