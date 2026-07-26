import { describe, it, expect } from "vitest";
import {
  getNearestTransitStation,
  checkPezaZone,
  getFaultLineProximity,
  checkInfraProximity,
  computeContinuityScore,
  computeSpatialIntel,
} from "../spatialIntel";

describe("spatialIntel", () => {
  // BGC coordinates — near MRT, near PEZA, near VFS, near Metro Manila Subway & Skyway 4
  const BGC_LAT = 14.5494;
  const BGC_LON = 121.0509;

  it("finds nearest transit station for BGC", () => {
    const result = getNearestTransitStation(BGC_LAT, BGC_LON);
    expect(result).not.toBeNull();
    expect(result.station_name).toBeDefined();
    expect(result.walk_minutes).toBeGreaterThan(0);
    expect(result.distance_meters).toBeGreaterThan(0);
  });

  it("checks PEZA zone for BGC (inside Manila ecozone)", () => {
    const result = checkPezaZone(BGC_LAT, BGC_LON);
    expect(result).toBeDefined();
    expect(result.is_accredited).toBe(true);
    expect(result.zone_name).toBeDefined();
  });

  it("computes fault proximity for BGC using point-to-segment math", () => {
    const result = getFaultLineProximity(BGC_LAT, BGC_LON);
    expect(result).not.toBeNull();
    expect(result.distance_km).toBeGreaterThan(0);
    expect(result.fault_line).toBeDefined();
    expect(result.fault_code).toBeDefined();
    expect(result.distance_meters).toBeGreaterThan(0);
  });

  it("detects Central Cebu Fault for Cebu IT Park coordinates", () => {
    const CEBU_LAT = 10.3277;
    const CEBU_LON = 123.9056;
    const result = getFaultLineProximity(CEBU_LAT, CEBU_LON);
    expect(result).not.toBeNull();
    expect(result.fault_code).toBe("CEBU-CENTRAL");
    expect(result.fault_line).toContain("Cebu");
  });

  it("detects nearby major infrastructure megaproject for BGC", () => {
    const result = checkInfraProximity(BGC_LAT, BGC_LON);
    expect(result).not.toBeNull();
    expect(result.name).toBeDefined();
    expect(result.distance_km).toBeLessThanOrEqual(5);
  });

  it("point-to-segment distance is ≤ point-to-vertex distance", () => {
    const MID_LAT = 14.5600;
    const MID_LON = 121.0625;
    const result = getFaultLineProximity(MID_LAT, MID_LON);
    expect(result).not.toBeNull();
    expect(result.distance_km).toBeLessThan(2);
  });

  it("computes continuity score within valid range including infra bonus", () => {
    const intel = {
      peza: { is_accredited: true },
      transit: { walk_minutes: 5 },
      seismic: { distance_km: 3 },
      infra: { name: "Metro Manila Subway", distance_km: 1.2 },
    };
    const result = computeContinuityScore(intel);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.grade).toBeDefined();
    expect(result.badge_color).toBeDefined();
  });

  it("computeSpatialIntel returns complete structure with infra", () => {
    const result = computeSpatialIntel(BGC_LAT, BGC_LON);
    expect(result).not.toBeNull();
    expect(result.transit).toBeDefined();
    expect(result.peza).toBeDefined();
    expect(result.seismic).toBeDefined();
    expect(result.solar).toBeDefined();
    expect(result.infra).toBeDefined();
    expect(result.continuity).toBeDefined();
    expect(result.computed_at).toBeDefined();
  });

  it("returns null for missing coordinates", () => {
    expect(computeSpatialIntel(null, null)).toBeNull();
    expect(getNearestTransitStation(null, null)).toBeNull();
    expect(getFaultLineProximity(null, null)).toBeNull();
    expect(checkInfraProximity(null, null)).toBeNull();
  });
});
