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
    expect(src).toContain("SEEKER // DEMAND");
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
    expect(src).toContain("SEEKERS // DEMAND");
    expect(src).toContain("SPACES AVAILABLE");
    expect(src).toContain("MARKET INTEL");
    expect(src).toContain("roleCounts");
    expect(src).toContain("handleSelectMarketRole");
  });
});
