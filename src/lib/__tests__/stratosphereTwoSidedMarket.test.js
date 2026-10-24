import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  COMMUNITY_SIGNALS,
  MARKET_ROLES,
  MARKET_ROLE_LABELS,
  MARKET_ROLE_DESCRIPTIONS,
  getSignalMarketRole,
  filterSignals,
  getDistrictsSummary,
} from "@/lib/communitySignalsAdapter";

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("Layer 02 Stratosphere — Two-Sided Market Interception Contracts (A-212)", () => {
  it("exports complete two-sided market taxonomy tokens and descriptions", () => {
    expect(MARKET_ROLES.ALL).toBe("all");
    expect(MARKET_ROLES.DEMAND).toBe("demand");
    expect(MARKET_ROLES.SUPPLY).toBe("supply");
    expect(MARKET_ROLES.INTEL).toBe("intel");

    expect(MARKET_ROLE_LABELS[MARKET_ROLES.DEMAND]).toBe("SEEKERS & DEMAND");
    expect(MARKET_ROLE_LABELS[MARKET_ROLES.SUPPLY]).toBe("SPACES AVAILABLE");
    expect(MARKET_ROLE_LABELS[MARKET_ROLES.INTEL]).toBe("MARKET INTEL");

    expect(MARKET_ROLE_DESCRIPTIONS[MARKET_ROLES.DEMAND]).toContain("mandates");
    expect(MARKET_ROLE_DESCRIPTIONS[MARKET_ROLES.SUPPLY]).toContain("upcoming");
    expect(MARKET_ROLE_DESCRIPTIONS[MARKET_ROLES.INTEL]).toContain("absorption");
  });

  it("correctly maps commercial signal types to Demand (Seekers/Lookers)", () => {
    expect(getSignalMarketRole({ signalType: "LOOKING_FOR" })).toBe(MARKET_ROLES.DEMAND);
    expect(getSignalMarketRole({ signalType: "REPRESENTING_CLIENT" })).toBe(MARKET_ROLES.DEMAND);
    expect(getSignalMarketRole({ signalType: "BUSINESS_EXPANSION" })).toBe(MARKET_ROLES.DEMAND);
  });

  it("correctly maps commercial signal types to Supply (Finders/Spaces Available)", () => {
    expect(getSignalMarketRole({ signalType: "UPCOMING_SUPPLY" })).toBe(MARKET_ROLES.SUPPLY);
    expect(getSignalMarketRole({ signalType: "OPPORTUNITY" })).toBe(MARKET_ROLES.SUPPLY);
    expect(getSignalMarketRole({ signalType: "COMMERCIAL_PROMOTION" })).toBe(MARKET_ROLES.SUPPLY);
  });

  it("correctly maps macro observations and pipeline articles to Intel", () => {
    expect(getSignalMarketRole({ signalType: "MARKET_OBSERVATION" })).toBe(MARKET_ROLES.INTEL);
    expect(getSignalMarketRole({ signalType: "SCOUTIT_INTELLIGENCE" })).toBe(MARKET_ROLES.INTEL);
    expect(getSignalMarketRole({ id: "pipeline-fort-legend", signalType: "UPCOMING_SUPPLY" })).toBe(MARKET_ROLES.INTEL);
    expect(getSignalMarketRole(null)).toBe(MARKET_ROLES.INTEL);
  });

  it("filters canonical signals by marketRole accurately", () => {
    const demandSignals = filterSignals(COMMUNITY_SIGNALS, { marketRole: MARKET_ROLES.DEMAND });
    expect(demandSignals.length).toBeGreaterThan(0);
    demandSignals.forEach((s) => {
      expect([MARKET_ROLES.DEMAND]).toContain(getSignalMarketRole(s));
    });

    const supplySignals = filterSignals(COMMUNITY_SIGNALS, { marketRole: MARKET_ROLES.SUPPLY });
    expect(supplySignals.length).toBeGreaterThan(0);
    supplySignals.forEach((s) => {
      expect([MARKET_ROLES.SUPPLY]).toContain(getSignalMarketRole(s));
    });

    const intelSignals = filterSignals(COMMUNITY_SIGNALS, { marketRole: MARKET_ROLES.INTEL });
    expect(intelSignals.length).toBeGreaterThan(0);
    intelSignals.forEach((s) => {
      expect([MARKET_ROLES.INTEL]).toContain(getSignalMarketRole(s));
    });

    // All signals
    const allSignals = filterSignals(COMMUNITY_SIGNALS, { marketRole: MARKET_ROLES.ALL });
    expect(allSignals.length).toBe(COMMUNITY_SIGNALS.length);
  });

  it("combines marketRole with district filtering without data loss", () => {
    const bgcDemand = filterSignals(COMMUNITY_SIGNALS, {
      district: "BGC",
      marketRole: MARKET_ROLES.DEMAND,
    });
    expect(bgcDemand.length).toBeGreaterThan(0);
    bgcDemand.forEach((s) => {
      expect(s.district.toLowerCase()).toContain("bgc");
      expect(getSignalMarketRole(s)).toBe(MARKET_ROLES.DEMAND);
    });
  });
});

describe("Layer 02 Stratosphere — UI Component & Noise Reduction Invariants", () => {
  it("DistrictIntelligenceStrip does NOT duplicate trendLabel and count ('4 updates 4')", () => {
    const src = read("src/components/stratosphere/DistrictIntelligenceStrip.js");
    // Verify d.trendLabel is not rendered alongside d.count in a redundant span
    expect(src).not.toContain("{d.trendLabel}</span>");
    expect(src).toContain("dis-name");
    expect(src).toContain("dis-badge");
  });

  it("SpatialSignalRadar consolidates corner HUD boxes into single telemetry pill bar", () => {
    const src = read("src/components/stratosphere/SpatialSignalRadar.js");
    expect(src).toContain("ssr-hud-pill-bar");
    expect(src).toContain("METRO MANILA RADAR");
    expect(src).toContain("BEACONS");
    expect(src).not.toContain("ssr-hud-top-left");
    expect(src).not.toContain("ssr-hud-bottom-right");
  });

  it("SignalDossierCard implements two-sided market badges and Intercept Demand CTA", () => {
    const src = read("src/components/stratosphere/SignalDossierCard.js");
    expect(src).toContain("sdc-role-badge");
    expect(src).toContain("SEEKER · DEMAND");
    expect(src).toContain("OFF-MARKET SUPPLY");
    expect(src).toContain("SPATIAL INTEL");
    expect(src).toContain("INTERCEPT DEMAND");
    expect(src).toContain("sdc-ceiling-chip");
    expect(src).toContain("cardRef");
    expect(src).toContain("scrollIntoView");
  });

  it("StratosphereTerminal mounts Two-Sided Market Intent switcher with live counts", () => {
    const src = read("src/components/stratosphere/StratosphereTerminal.js");
    expect(src).toContain("st-market-tabs");
    expect(src).toContain("SEEKERS · DEMAND");
    expect(src).toContain("SPACES AVAILABLE");
    expect(src).toContain("MARKET INTEL");
    expect(src).toContain("roleCounts");
    expect(src).toContain("handleSelectMarketRole");
  });

  it("handles snake_case and case variations in getSignalMarketRole (A-227)", () => {
    expect(getSignalMarketRole({ signal_type: "looking_for" })).toBe(MARKET_ROLES.DEMAND);
    expect(getSignalMarketRole({ signalType: "looking_for" })).toBe(MARKET_ROLES.DEMAND);
    expect(getSignalMarketRole({ signal_type: "upcoming_supply" })).toBe(MARKET_ROLES.SUPPLY);
    expect(getSignalMarketRole({ signalType: "commercial_promotion" })).toBe(MARKET_ROLES.SUPPLY);
    expect(getSignalMarketRole({ signal_type: "market_observation" })).toBe(MARKET_ROLES.INTEL);
  });

  it("dynamically registers non-standard districts in getDistrictsSummary (A-227)", () => {
    const customSignals = [
      { id: "s1", district: "Siargao", relevantCount: 10 },
      { id: "s2", district: "Palawan", relevantCount: 5 },
      { id: "s3", district: "BGC", relevantCount: 20 },
    ];
    const summary = getDistrictsSummary(customSignals);
    const districts = summary.map((d) => d.district);
    expect(districts).toContain("Siargao");
    expect(districts).toContain("Palawan");
    expect(districts).toContain("BGC");
    const totalCount = summary.reduce((acc, d) => acc + d.count, 0);
    expect(totalCount).toBe(3);
  });

  it("enforces full-frame bento grid and viewport decoupling in stratosphere-terminal.css (A-227)", () => {
    const css = read("src/components/stratosphere/stratosphere-terminal.css");
    expect(css).toContain(".st-terminal--feed");
    expect(css).toContain("grid-template-columns: repeat(auto-fill, minmax(460px, 1fr))");
    expect(css).toContain("max-width: 1720px");
    expect(css).not.toContain("max-width: 860px");
  });

  it("enforces middle dot punctuation harmony across Stratosphere dossier components (A-227)", () => {
    const term = read("src/components/stratosphere/StratosphereTerminal.js");
    expect(term).not.toContain("SEEKERS // DEMAND");
    expect(term).toContain("SEEKERS · DEMAND");
    expect(term).not.toContain("DISTRICT //");
    expect(term).toContain("DISTRICT ·");

    const card = read("src/components/stratosphere/SignalDossierCard.js");
    expect(card).not.toContain("SEEKER // DEMAND");
    expect(card).toContain("SEEKER · DEMAND");
  });

  describe("A-228 — 3D Spatial Radar Color Signal Map Legend Contracts", () => {
    it("exports canonical RADAR_COLOR_LEGEND with all 5 beacon frequencies and domain meanings", async () => {
      const { RADAR_COLOR_LEGEND, getSignalLegendItem, getRadarColorLegendSummary } = await import("@/lib/communitySignalsAdapter");
      expect(RADAR_COLOR_LEGEND).toHaveLength(5);

      const keys = RADAR_COLOR_LEGEND.map((l) => l.key);
      expect(keys).toEqual(["gold", "green", "purple", "red", "cyan"]);

      const gold = RADAR_COLOR_LEGEND.find((l) => l.key === "gold");
      expect(gold.colorToken).toBe("var(--accent)");
      expect(gold.label).toBe("SEEKERS & DEMAND");
      expect(gold.meaning).toContain("mandates");

      const green = RADAR_COLOR_LEGEND.find((l) => l.key === "green");
      expect(green.colorToken).toBe("var(--green)");
      expect(green.label).toBe("SPACES AVAILABLE");
      expect(green.meaning).toContain("supply");

      const purple = RADAR_COLOR_LEGEND.find((l) => l.key === "purple");
      expect(purple.colorToken).toBe("var(--amethyst)");
      expect(purple.label).toBe("BUSINESS EXPANSION");
      expect(purple.meaning).toContain("expansion");

      const red = RADAR_COLOR_LEGEND.find((l) => l.key === "red");
      expect(red.colorToken).toBe("var(--yellow)");
      expect(red.label).toBe("MARKET DYNAMICS");
      expect(red.meaning).toContain("Macro");

      const cyan = RADAR_COLOR_LEGEND.find((l) => l.key === "cyan");
      expect(cyan.colorToken).toBe("var(--intel-cyan)");
      expect(cyan.label).toBe("SPATIAL OPPORTUNITY");
      expect(cyan.meaning).toContain("conversions");
    });

    it("correctly resolves signal legend items and counts", async () => {
      const { getSignalLegendItem, getRadarColorLegendSummary, COMMUNITY_SIGNALS } = await import("@/lib/communitySignalsAdapter");
      expect(getSignalLegendItem({ signalType: "LOOKING_FOR" }).key).toBe("gold");
      expect(getSignalLegendItem({ signalType: "UPCOMING_SUPPLY" }).key).toBe("green");
      expect(getSignalLegendItem({ signalType: "BUSINESS_EXPANSION" }).key).toBe("purple");
      expect(getSignalLegendItem({ signalType: "MARKET_OBSERVATION" }).key).toBe("red");
      expect(getSignalLegendItem({ signalType: "OPPORTUNITY" }).key).toBe("cyan");

      const summary = getRadarColorLegendSummary(COMMUNITY_SIGNALS);
      const totalCount = summary.reduce((acc, item) => acc + item.count, 0);
      expect(totalCount).toBe(COMMUNITY_SIGNALS.length);
      summary.forEach((item) => {
        expect(typeof item.count).toBe("number");
        expect(item.count).toBeGreaterThanOrEqual(0);
      });
    });

    it("filters signals by colorKey in filterSignals", async () => {
      const { filterSignals, COMMUNITY_SIGNALS } = await import("@/lib/communitySignalsAdapter");
      const greenOnly = filterSignals(COMMUNITY_SIGNALS, { colorKey: "green" });
      expect(greenOnly.length).toBeGreaterThan(0);
      greenOnly.forEach((s) => {
        expect(s.signalType).toBe("UPCOMING_SUPPLY");
      });

      const goldOnly = filterSignals(COMMUNITY_SIGNALS, { colorKey: "gold" });
      expect(goldOnly.length).toBeGreaterThan(0);
      goldOnly.forEach((s) => {
        expect(["LOOKING_FOR", "REPRESENTING_CLIENT", "SCOUTIT_INTELLIGENCE"]).toContain(s.signalType);
      });
    });

    it("enforces luxury dark mode styling and responsive overlay in spatial-signal-radar.css", () => {
      const css = read("src/components/stratosphere/spatial-signal-radar.css");
      expect(css).toContain(".ssr-legend-overlay");
      expect(css).toContain(".ssr-legend-card");
      expect(css).toContain(".ssr-legend-row");
      expect(css).toContain(".ssr-legend-pillar-swatch");
      expect(css).toContain(".ssr-legend-pill-trigger");
      expect(css).toContain("backdrop-filter: blur");
      expect(css).toContain("min-height: 44px");
      expect(css).toContain("@media (max-width: 680px)");
    });

    it("wires activeColorKey and onSelectColorKey into SpatialSignalRadar and StratosphereTerminal", () => {
      const radarJs = read("src/components/stratosphere/SpatialSignalRadar.js");
      expect(radarJs).toContain("activeColorKey");
      expect(radarJs).toContain("onSelectColorKey");
      expect(radarJs).toContain("getRadarColorLegendSummary");
      expect(radarJs).toContain("ssr-legend-card");
      expect(radarJs).toContain("ssr-legend-pill-trigger");

      const termJs = read("src/components/stratosphere/StratosphereTerminal.js");
      expect(termJs).toContain("activeColorKey={colorKey}");
      expect(termJs).toContain("onSelectColorKey={handleSelectColorKey}");
      expect(termJs).toContain("st-color-filter-badge");
    });
  });
});
