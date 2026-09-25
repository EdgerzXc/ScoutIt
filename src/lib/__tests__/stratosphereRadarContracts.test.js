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

  it("standalone /stratosphere route mounts the workspace (articles + radar) with Header", () => {
    expect(existsSync(join(process.cwd(), "src/app/stratosphere/page.js"))).toBe(true);
    const src = read("src/app/stratosphere/page.js");
    expect(src).toContain("StratosphereWorkspace");
    expect(src).toContain("Header");
    expect(src).toContain("canonical: \"/stratosphere\"");
  });

  it("/community hands off to the single Stratosphere radar instead of a duplicate terminal", () => {
    expect(existsSync(join(process.cwd(), "src/app/community/page.js"))).toBe(true);
    const src = read("src/app/community/page.js");
    expect(src).toContain('permanentRedirect("/stratosphere?view=radar")');
    expect(src).not.toContain("StratosphereTerminal");
  });

  it("SignalComposer posts through the community API with staged identity", () => {
    expect(existsSync(join(process.cwd(), "src/components/stratosphere/SignalComposer.js"))).toBe(true);
    const src = read("src/components/stratosphere/SignalComposer.js");
    expect(src).toContain('fetch("/api/community/signals"');
    expect(src).toContain("/api/community/me");
    expect(src).toContain("POST A SIGNAL");
    expect(src).toContain("PrivacyNotice");
  });

  it("live community Connect resolves the author server-side with an inbox handoff", () => {
    const modal = read("src/components/stratosphere/CommunityConnectModal.js");
    expect(modal).toContain("/connect");
    expect(modal).toContain("VIEW IN INBOX");
    const route = read("src/app/api/community/signals/[id]/connect/route.js");
    expect(route).toContain("author_account_id");
    expect(route).toContain("spend_connects");
    expect(route).not.toContain("recipient_id: signal");
  });

  it("workspace merges live posts above pipeline and samples with a post entry", () => {
    const src = read("src/components/stratosphere/StratosphereWorkspace.js");
    expect(src).toContain("/api/community/signals");
    expect(src).toContain("POST A SIGNAL");
    expect(src).toContain("SignalComposer");
    expect(src).toContain("liveSignals");
  });

  it("P1 migration holds five service-role-only tables with no browser grants", () => {
    const sql = read("supabase/migrations/20260924000001_community_signals_p1.sql");
    for (const table of [
      "stratosphere_signals",
      "signal_locations",
      "signal_requirements",
      "signal_relevance",
      "signal_saves",
    ]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${table}`);
      expect(sql).toContain(`REVOKE ALL ON TABLE public.${table} FROM PUBLIC, anon, authenticated;`);
    }
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    // Rule 8: no privileged function may hide in the migration at all.
    expect(sql).not.toContain("CREATE FUNCTION");
  });

  it("/layer/stratosphere is the cinematic entrance (no workspace controls on the layer)", () => {
    const src = read("src/app/layer/stratosphere/page.js");
    expect(src).toContain("LayerNav");
    expect(src).not.toContain("StratosphereTerminal");
    expect(src).toContain("LayerTransition");
    expect(src).toContain("DescentBackdrop");
    expect(src).toContain('href="/stratosphere"');
  });
});
