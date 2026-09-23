import { describe, it, expect } from "vitest";
import {
  COMMUNITY_SIGNALS,
  SIGNAL_TYPES,
  computeNormalizedSignalStrength,
  getDistrictsSummary,
  filterSignals,
  generateBeaconGeoJSON,
} from "../communitySignalsAdapter";

describe("communitySignalsAdapter", () => {
  it("exports a non-empty canonical signal catalog with valid coordinates and properties", () => {
    expect(COMMUNITY_SIGNALS.length).toBeGreaterThan(0);
    for (const sig of COMMUNITY_SIGNALS) {
      expect(sig.id).toBeTruthy();
      expect(sig.title).toBeTruthy();
      expect(sig.coords.lat).toBeGreaterThan(0);
      expect(sig.coords.lng).toBeGreaterThan(0);
      expect(sig.district).toBeTruthy();
      expect(sig.signalType).toBeTruthy();
    }
  });

  it("computes normalized signal strength between 0.15 and 1.0", () => {
    for (const sig of COMMUNITY_SIGNALS) {
      const strength = computeNormalizedSignalStrength(sig);
      expect(strength).toBeGreaterThanOrEqual(0.15);
      expect(strength).toBeLessThanOrEqual(1.0);
    }
    // High relevant count yields higher strength
    const low = computeNormalizedSignalStrength({ relevantCount: 2, specs: [] });
    const high = computeNormalizedSignalStrength({ relevantCount: 75, specs: ["a", "b", "c", "d"], budget: "₱2k", author: { verified: true } });
    expect(high).toBeGreaterThan(low);
  });

  it("aggregates active districts correctly", () => {
    const districts = getDistrictsSummary(COMMUNITY_SIGNALS);
    expect(districts.length).toBeGreaterThan(0);
    const bgc = districts.find((d) => d.district === "BGC");
    expect(bgc).toBeDefined();
    expect(bgc.count).toBeGreaterThan(0);
    expect(bgc.trendLabel).toBeTruthy();
  });

  it("filters signals by search query and discrete attributes", () => {
    // 1. Text search
    const warehouseResults = filterSignals(COMMUNITY_SIGNALS, { query: "warehouse" });
    expect(warehouseResults.length).toBeGreaterThan(0);
    warehouseResults.forEach((s) => {
      const text = `${s.title} ${s.summary} ${s.spaceType} ${s.category}`.toLowerCase();
      expect(text).toContain("warehouse");
    });

    // 2. District filter
    const bgcResults = filterSignals(COMMUNITY_SIGNALS, { district: "BGC" });
    expect(bgcResults.length).toBeGreaterThan(0);
    bgcResults.forEach((s) => expect(s.district).toBe("BGC"));

    // 3. Space type filter
    const officeResults = filterSignals(COMMUNITY_SIGNALS, { spaceType: "Office" });
    expect(officeResults.length).toBeGreaterThan(0);
    officeResults.forEach((s) => expect(s.spaceType).toBe("Office"));

    // 4. Combined query
    const combined = filterSignals(COMMUNITY_SIGNALS, { query: "Makati LEED", district: "Makati CBD" });
    expect(combined.length).toBeGreaterThan(0);
    expect(combined[0].district).toBe("Makati CBD");
  });

  it("generates valid GeoJSON layers with search dimming", () => {
    const allIds = new Set(COMMUNITY_SIGNALS.map((s) => s.id));
    const fullGeo = generateBeaconGeoJSON(COMMUNITY_SIGNALS, allIds);
    expect(fullGeo.beacons.features.length).toBe(COMMUNITY_SIGNALS.length);
    expect(fullGeo.groundRings.features.length).toBe(COMMUNITY_SIGNALS.length);
    expect(fullGeo.beaconPoints.features.length).toBe(COMMUNITY_SIGNALS.length);

    // Filtered set: matched has opacity 0.88, non-matched has dimmed opacity 0.18
    const firstId = COMMUNITY_SIGNALS[0].id;
    const partialIds = new Set([firstId]);
    const dimmedGeo = generateBeaconGeoJSON(COMMUNITY_SIGNALS, partialIds);

    const matchPillar = dimmedGeo.beacons.features.find((f) => f.properties.id === firstId);
    const nonMatchPillar = dimmedGeo.beacons.features.find((f) => f.properties.id !== firstId);

    expect(matchPillar.properties.opacity).toBe(0.88);
    expect(matchPillar.properties.isMatch).toBe(true);
    expect(nonMatchPillar.properties.opacity).toBe(0.18);
    expect(nonMatchPillar.properties.isMatch).toBe(false);
  });

  it("handles malformed, empty, or edge-case signal inputs defensively", () => {
    // 1. Empty signals array
    expect(filterSignals([], { query: "bgc" })).toEqual([]);
    const emptyGeo = generateBeaconGeoJSON([]);
    expect(emptyGeo.beacons.features).toEqual([]);
    expect(emptyGeo.groundRings.features).toEqual([]);
    expect(emptyGeo.beaconPoints.features).toEqual([]);

    // 2. Missing coords or malformed signal in GeoJSON generator
    const malformed = [
      { id: "sig-none", title: "No coords" },
      { id: "sig-partial", title: "Partial coords", coords: { lat: 14.5 } }, // missing lng
      { id: "sig-good", title: "Valid", coords: { lat: 14.5, lng: 121.0 }, signalType: "LOOKING_FOR" },
    ];
    const geo = generateBeaconGeoJSON(malformed);
    expect(geo.beacons.features.length).toBe(1);
    expect(geo.beacons.features[0].properties.id).toBe("sig-good");

    // 3. Compute strength with completely empty object
    const emptyScore = computeNormalizedSignalStrength({});
    expect(emptyScore).toBeGreaterThanOrEqual(0.15);
    expect(emptyScore).toBeLessThanOrEqual(1.0);

    // 4. Query with special characters and whitespace
    const specialQuery = filterSignals(COMMUNITY_SIGNALS, { query: "   BGC   " });
    expect(specialQuery.length).toBeGreaterThan(0);
    const impossibleQuery = filterSignals(COMMUNITY_SIGNALS, { query: "xyz123_nonexistent_token" });
    expect(impossibleQuery.length).toBe(0);
  });
});

