import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  COMMUNITY_SIGNALS,
  SIGNAL_TYPES,
  computeNormalizedSignalStrength,
  getDistrictsSummary,
  filterSignals,
  generateBeaconGeoJSON,
} from "@/lib/communitySignalsAdapter";

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("Stratosphere Spatial Radar — Data Adapter Contracts", () => {
  it("includes canonical signals covering core signal types", () => {
    expect(COMMUNITY_SIGNALS.length).toBeGreaterThanOrEqual(8);
    const types = new Set(COMMUNITY_SIGNALS.map((s) => s.signalType));
    expect(types.has("LOOKING_FOR")).toBe(true);
    expect(types.has("BUSINESS_EXPANSION")).toBe(true);
    expect(types.has("UPCOMING_SUPPLY")).toBe(true);
    expect(types.has("MARKET_OBSERVATION")).toBe(true);
    expect(types.has("SCOUTIT_INTELLIGENCE")).toBe(true);
  });

  it("normalizes signal strength within 0.15 to 1.0", () => {
    for (const signal of COMMUNITY_SIGNALS) {
      const strength = computeNormalizedSignalStrength(signal);
      expect(strength).toBeGreaterThanOrEqual(0.15);
      expect(strength).toBeLessThanOrEqual(1.0);
    }
  });

  it("aggregates signals into active districts summary", () => {
    const districts = getDistrictsSummary(COMMUNITY_SIGNALS);
    expect(districts.length).toBeGreaterThanOrEqual(5);
    const districtNames = districts.map((d) => d.district);
    expect(districtNames).toContain("BGC");
    expect(districtNames).toContain("Makati CBD");
    expect(districtNames).toContain("Ortigas Center");
  });

  it("generates valid GeoJSON layers with 3D extrusion heights and dimming", () => {
    const allIds = new Set(COMMUNITY_SIGNALS.map((s) => s.id));
    const geo = generateBeaconGeoJSON(COMMUNITY_SIGNALS, allIds);
    expect(geo.beacons.type).toBe("FeatureCollection");
    expect(geo.beacons.features.length).toBe(COMMUNITY_SIGNALS.length);
    for (const feature of geo.beacons.features) {
      expect(feature.geometry.type).toBe("Polygon");
      expect(feature.properties.height).toBeGreaterThan(50);
      expect(feature.properties.height).toBeLessThanOrEqual(400);
      expect(feature.properties.color).toMatch(/^#[0-9a-fA-F]{6}$|^rgba?\([0-9,\s.]+\)$/);
    }
  });
});

describe("Stratosphere Spatial Radar — 3D Map Security & Engine Invariants", () => {
  it("SpatialSignalRadar enforces attributionControl: false to mitigate CVE-2026-85061", () => {
    const src = read("src/components/stratosphere/SpatialSignalRadar.js");
    expect(src).toContain("attributionControl: false");
    expect(src).toContain("MapCreditControl");
  });

  it("SpatialSignalRadar defines building extrusions and vertical beacon layers", () => {
    const src = read("src/components/stratosphere/SpatialSignalRadar.js");
    expect(src).toContain("signal-beacons-3d");
    expect(src).toContain("carto-buildings-3d");
    expect(src).toContain("fill-extrusion");
  });

  it("SpatialSignalRadar contains WebGL fallback UI", () => {
    const src = read("src/components/stratosphere/SpatialSignalRadar.js");
    expect(src).toContain("webglSupported");
    expect(src).toContain("ssr-fallback");
  });
});

describe("Stratosphere Spatial Radar — Micro Glyphs & Dossier Contracts", () => {
  it("SignalGlyph exports pure SVG diagrams without canvas elements", () => {
    const src = read("src/components/stratosphere/glyphs/SignalGlyph.js");
    expect(src).toContain("<svg");
    expect(src).not.toContain("<canvas");
    expect(src).toContain("SpatialVolumeGlyph");
    expect(src).toContain("TrendGlyph");
    expect(src).toContain("LocationPulseGlyph");
    expect(src).toContain("SupplyDemandGlyph");
    expect(src).toContain("ExpansionGlyph");
  });

  it("SignalDossierCard includes Relevant to Me counter and Metropolis property links", () => {
    const src = read("src/components/stratosphere/SignalDossierCard.js");
    expect(src).toContain("Relevant to Me");
    expect(src).toContain("/property/");
    expect(src).toContain("onConnect");
  });
});

describe("Stratosphere Spatial Radar — Terminal & Routing Integration", () => {
  it("StratosphereTerminal manages dual view modes (SPATIAL and SIGNALS)", () => {
    const src = read("src/components/stratosphere/StratosphereTerminal.js");
    expect(src).toContain('viewMode === "SPATIAL"');
    expect(src).toContain('viewMode === "SIGNALS"');
    expect(src).toContain("DistrictIntelligenceStrip");
    expect(src).toContain("StratosphereFilterDrawer");
    expect(src).toContain("CommunityConnectModal");
  });

  it("standalone /stratosphere route exists and mounts Header and StratosphereTerminal", () => {
    expect(existsSync(join(process.cwd(), "src/app/stratosphere/page.js"))).toBe(true);
    const src = read("src/app/stratosphere/page.js");
    expect(src).toContain("StratosphereTerminal");
    expect(src).toContain("Header");
    expect(src).toContain("canonical: \"/stratosphere\"");
  });

  it("standalone /community route exists and mounts Header and StratosphereTerminal", () => {
    expect(existsSync(join(process.cwd(), "src/app/community/page.js"))).toBe(true);
    const src = read("src/app/community/page.js");
    expect(src).toContain("StratosphereTerminal");
    expect(src).toContain("Header");
    expect(src).toContain("canonical: \"/community\"");
  });

  it("/layer/stratosphere mounts StratosphereTerminal and preserves LayerNav and LayerTransition", () => {
    const src = read("src/app/layer/stratosphere/page.js");
    expect(src).toContain("LayerNav");
    expect(src).toContain("StratosphereTerminal");
    expect(src).toContain("LayerTransition");
    expect(src).toContain("DescentBackdrop");
  });
});
