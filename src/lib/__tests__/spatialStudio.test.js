import { describe, expect, it } from "vitest";
import {
  SPATIAL_STATUSES,
  isValidSpatialTransition,
  SPATIAL_STYLE_PRESETS,
  MATERIAL_SWAP_OPTIONS,
  DEFAULT_MATERIAL_CONFIG,
  SPATIAL_TIER_ALLOWANCES,
  SPATIAL_OVERFLOW_CONNECT_COST,
  resolveSpatialEntitlement,
  SPATIAL_SLA_HOURS,
  calculateTargetSlaDate,
} from "../spatialStudio";

describe("A-196 · Spatial Studio Domain Logic", () => {
  describe("State Machine Transitions", () => {
    it("defines the 6 canonical statuses", () => {
      expect(SPATIAL_STATUSES).toEqual([
        "NONE",
        "REQUESTED",
        "QUEUED",
        "IN_PRODUCTION",
        "REVISION_REQUESTED",
        "LIVE",
      ]);
    });

    it("allows valid forward transitions", () => {
      expect(isValidSpatialTransition("NONE", "REQUESTED")).toBe(true);
      expect(isValidSpatialTransition("REQUESTED", "QUEUED")).toBe(true);
      expect(isValidSpatialTransition("QUEUED", "IN_PRODUCTION")).toBe(true);
      expect(isValidSpatialTransition("IN_PRODUCTION", "LIVE")).toBe(true);
    });

    it("allows revision loop transitions", () => {
      expect(isValidSpatialTransition("LIVE", "REVISION_REQUESTED")).toBe(true);
      expect(isValidSpatialTransition("REVISION_REQUESTED", "QUEUED")).toBe(true);
      expect(isValidSpatialTransition("REVISION_REQUESTED", "LIVE")).toBe(true);
    });

    it("allows identity transition", () => {
      expect(isValidSpatialTransition("LIVE", "LIVE")).toBe(true);
      expect(isValidSpatialTransition("QUEUED", "QUEUED")).toBe(true);
    });

    it("rejects illegal transitions", () => {
      expect(isValidSpatialTransition("NONE", "LIVE")).toBe(false);
      expect(isValidSpatialTransition("NONE", "IN_PRODUCTION")).toBe(false);
      expect(isValidSpatialTransition("REQUESTED", "LIVE")).toBe(false);
      expect(isValidSpatialTransition(null, "REQUESTED")).toBe(false);
      expect(isValidSpatialTransition("NONE", null)).toBe(false);
    });
  });

  describe("Pillar 1: Pre-Flight Style & Palette Presets", () => {
    it("exports the 3 luxury aesthetic presets", () => {
      expect(Object.keys(SPATIAL_STYLE_PRESETS)).toEqual([
        "minimalist_organic",
        "modern_executive",
        "tropical_luxury",
      ]);
    });

    it("preserves Minimalist Organic materials and lighting", () => {
      const preset = SPATIAL_STYLE_PRESETS.minimalist_organic;
      expect(preset.name).toBe("Minimalist Organic");
      expect(preset.materials).toContain("Italian Travertine");
      expect(preset.materials).toContain("Light European Oak");
      expect(preset.lighting).toContain("5000K");
    });

    it("preserves Modern Executive materials and lighting", () => {
      const preset = SPATIAL_STYLE_PRESETS.modern_executive;
      expect(preset.name).toBe("Modern Executive");
      expect(preset.materials).toContain("Slatted Walnut");
      expect(preset.materials).toContain("Matte Obsidian Trim");
      expect(preset.lighting).toContain("3500K");
    });

    it("preserves Tropical Luxury materials and lighting", () => {
      const preset = SPATIAL_STYLE_PRESETS.tropical_luxury;
      expect(preset.name).toBe("Tropical Luxury");
      expect(preset.materials).toContain("Philippine Narra");
      expect(preset.materials).toContain("Capiz & Brushed Brass");
      expect(preset.lighting).toContain("2700K");
    });
  });

  describe("Pillar 2: Material Swapper Options", () => {
    it("supports 3 flooring types, 3 partition types, and 2 lighting moods", () => {
      expect(MATERIAL_SWAP_OPTIONS.flooring.length).toBe(3);
      expect(MATERIAL_SWAP_OPTIONS.partitions.length).toBe(3);
      expect(MATERIAL_SWAP_OPTIONS.lighting.length).toBe(2);
    });

    it("matches default material configuration", () => {
      expect(DEFAULT_MATERIAL_CONFIG).toEqual({
        flooring: "travertine",
        partitions: "fluted_glass",
        lighting: "daylight",
      });
    });
  });

  describe("Pillar 3 & Entitlements: Subscription and Connect Fallback", () => {
    it("defines allowances for Solar (2), Cluster (8), and Universe (25)", () => {
      expect(SPATIAL_TIER_ALLOWANCES.starry).toBe(0);
      expect(SPATIAL_TIER_ALLOWANCES.solar).toBe(2);
      expect(SPATIAL_TIER_ALLOWANCES.cluster).toBe(8);
      expect(SPATIAL_TIER_ALLOWANCES.universe).toBe(25);
      expect(SPATIAL_OVERFLOW_CONNECT_COST).toBe(3);
    });

    it("grants tier coverage when user has unused monthly allowance", () => {
      const res = resolveSpatialEntitlement({
        tier: "cluster",
        monthlyGenerationsUsed: 3,
        currentConnects: 0,
      });
      expect(res.coveredByTier).toBe(true);
      expect(res.remainingAllowance).toBe(5);
      expect(res.connectCostRequired).toBe(0);
      expect(res.canProceed).toBe(true);
    });

    it("requires 3 Connects when user exceeds tier allowance and has sufficient wallet", () => {
      const res = resolveSpatialEntitlement({
        tier: "solar",
        monthlyGenerationsUsed: 2,
        currentConnects: 5,
      });
      expect(res.coveredByTier).toBe(false);
      expect(res.remainingAllowance).toBe(0);
      expect(res.connectCostRequired).toBe(3);
      expect(res.canProceed).toBe(true);
    });

    it("blocks request when tier allowance is exhausted and wallet lacks 3 Connects", () => {
      const res = resolveSpatialEntitlement({
        tier: "solar",
        monthlyGenerationsUsed: 2,
        currentConnects: 1,
      });
      expect(res.coveredByTier).toBe(false);
      expect(res.canProceed).toBe(false);
      expect(res.connectCostRequired).toBe(3);
    });

    it("handles Starry tier (0 allowance) cleanly with connects", () => {
      const res = resolveSpatialEntitlement({
        tier: "starry",
        monthlyGenerationsUsed: 0,
        currentConnects: 3,
      });
      expect(res.coveredByTier).toBe(false);
      expect(res.canProceed).toBe(true);
      expect(res.connectCostRequired).toBe(3);
    });
  });

  describe("SLA Timelines", () => {
    it("calculates standard 48h SLA for new twin generation", () => {
      const base = new Date("2026-10-11T10:00:00Z");
      const sla = calculateTargetSlaDate({ isExpress: false, fromDate: base });
      expect(sla.hours).toBe(SPATIAL_SLA_HOURS.standard);
      expect(sla.hours).toBe(48);
      expect(sla.targetDate.toISOString()).toBe("2026-10-13T10:00:00.000Z");
    });

    it("calculates express 12h SLA for scene revisions", () => {
      const base = new Date("2026-10-11T10:00:00Z");
      const sla = calculateTargetSlaDate({ isExpress: true, fromDate: base });
      expect(sla.hours).toBe(SPATIAL_SLA_HOURS.express);
      expect(sla.hours).toBe(12);
      expect(sla.targetDate.toISOString()).toBe("2026-10-11T22:00:00.000Z");
      expect(sla.slaLabel).toContain("Express Priority");
    });
  });
});
