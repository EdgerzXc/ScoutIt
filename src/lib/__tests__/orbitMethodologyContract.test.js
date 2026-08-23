import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { rankBoard, tierForRank, BOARD_CATEGORIES } from "@/data/mock/mockShowcase";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("F-003 Orbit luxury restraint and truthful methodology contract", () => {
  const podiumSource = read("src/components/board/BoardPodium.js");
  const pageSource = read("src/app/layer/orbit/page.js");
  const layoutSource = read("src/app/layer/orbit/layout.js");
  const pageCss = read("src/app/layer/orbit/page.module.css");
  const combined = `${podiumSource}\n${pageSource}\n${pageCss}\n${layoutSource}`;

  it("removes unverified live-demand claims and national volume assertions from Orbit files", () => {
    // Semantic assertions against live telemetry / actual national volume claims
    const bannedPatterns = [
      /100%\s*verified/i,
      /100%\s*earned\s*demand/i,
      /real\s*verified\s*inquiry/i,
      /last\s*30\s*days/i,
      /100\+\s*ranked/i,
      /live\s*telemetry/i,
      /inquiry\s*velocity/i,
      /most-saved\s*and\s*inquired\s*spaces\s*across\s*the\s*philippines/i,
      /most\s*demanded\s*properties\s*in\s*the\s*philippines/i,
      /real\s*demand\s*signals/i,
      /real\s*platform\s*signals/i,
      /98\.4%\s*Score/i,
    ];

    for (const pattern of bannedPatterns) {
      expect(combined).not.toMatch(pattern);
    }
  });

  it("clearly discloses sample and illustrative model status throughout Orbit", () => {
    expect(podiumSource).toContain("Sample Model Data");
    expect(podiumSource).toContain("(sample model)");
    expect(podiumSource).toContain("demand index preview");
    expect(podiumSource).toContain("Sample demand framework · Independent &amp; unpaid");
    expect(layoutSource).toContain("modeled by illustrative demand signals");
  });

  it("enforces ScoutIt CSS variable tokens and dark luxury conventions", () => {
    expect(podiumSource).toContain("var(--accent)");
    expect(podiumSource).toContain("var(--font-mono)");
    expect(podiumSource).toContain("var(--font-display)");
    expect(podiumSource).toContain("var(--text-primary)");
    expect(podiumSource).toContain("var(--text-secondary)");
    expect(podiumSource).toContain("var(--text-muted)");
    expect(pageSource).toContain('import styles from "./page.module.css"');
    expect(pageCss).toContain("background: var(--bg)");
    expect(pageCss).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(podiumSource).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("includes honest loading plus reduced-motion and transparency support", () => {
    expect(podiumSource).toContain("Reading the current sample index…");
    expect(podiumSource).toContain("aria-busy={loading}");
    expect(podiumSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(podiumSource).toContain("@media (prefers-reduced-transparency: reduce)");
  });

  it("ranks board entries accurately across categories with tier assignment", () => {
    const sampleEntries = [
      { property_slug: "alpha", name: "Alpha Space", category: "Commercial", inquiry_count: 50, saves: 30 },
      { property_slug: "beta", name: "Beta Space", category: "Residential", inquiry_count: 40, saves: 25 },
      { property_slug: "gamma", name: "Gamma Space", category: "Commercial", inquiry_count: 20, saves: 10 },
      { property_slug: "delta", name: "Delta Space", category: "STR", inquiry_count: 10, saves: 5 },
    ];

    const allRanked = rankBoard(sampleEntries, { award: "Most Inquired", category: "All" });
    expect(allRanked).toHaveLength(4);
    expect(allRanked[0].name).toBe("Alpha Space");
    expect(allRanked[0].rank).toBe(1);
    expect(allRanked[0].tier).toBe("universe");
    expect(allRanked[1].tier).toBe("cluster");
    expect(allRanked[2].tier).toBe("solar");
    expect(allRanked[3].tier).toBe("starry");

    const commercialOnly = rankBoard(sampleEntries, { award: "Most Inquired", category: "Commercial" });
    expect(commercialOnly).toHaveLength(2);
    expect(commercialOnly[0].property_slug).toBe("alpha");
    expect(commercialOnly[1].property_slug).toBe("gamma");
    expect(commercialOnly[0].rank).toBe(1);
    expect(commercialOnly[1].rank).toBe(2);

    expect(tierForRank(1)).toBe("universe");
    expect(tierForRank(2)).toBe("cluster");
    expect(tierForRank(3)).toBe("solar");
    expect(tierForRank(4)).toBe("starry");
    expect(BOARD_CATEGORIES).toContain("Commercial");
    expect(BOARD_CATEGORIES).toContain("Residential");
  });
});
