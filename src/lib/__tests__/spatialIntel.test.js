import { describe, it, expect } from "vitest";
import { computeSpatialIntel, getNearestTransitStation, checkPezaZone, getFaultLineProximity, computeContinuityScore } from "../spatialIntel";

describe("spatialIntel", () => {
  const bgcCoords = { lat: 14.5494, lon: 121.0509 };

  it("computes transit station proximity for BGC", () => {
    const transit = getNearestTransitStation(bgcCoords.lat, bgcCoords.lon);
    expect(transit).not.toBeNull();
    expect(transit.station_name).toBe("Buendia");
    expect(transit.line).toBe("MRT-3");
    expect(transit.walk_minutes).toBeGreaterThan(0);
  });

  it("identifies PEZA accreditation for BGC", () => {
    const peza = checkPezaZone(bgcCoords.lat, bgcCoords.lon);
    expect(peza.is_accredited).toBe(true);
    expect(peza.zone_name).toContain("Bonifacio Global City");
  });

  it("calculates safe fault line proximity", () => {
    const seismic = getFaultLineProximity(bgcCoords.lat, bgcCoords.lon);
    expect(seismic).not.toBeNull();
    expect(seismic.distance_km).toBeGreaterThan(0);
  });

  it("returns complete spatial intel object and continuity index", () => {
    const intel = computeSpatialIntel(bgcCoords.lat, bgcCoords.lon);
    expect(intel).toHaveProperty("transit");
    expect(intel).toHaveProperty("peza");
    expect(intel).toHaveProperty("seismic");
    expect(intel).toHaveProperty("continuity");
    expect(intel.continuity.score).toBeGreaterThanOrEqual(70);
    expect(intel.continuity).toHaveProperty("grade");
  });

  it("computes business continuity score accurately", () => {
    const continuity = computeContinuityScore({
      peza: { is_accredited: true },
      transit: { walk_minutes: 4 },
      seismic: { distance_km: 6 },
    });
    expect(continuity.score).toBe(100);
    expect(continuity.grade).toBe("Tier 1 Enterprise Grade");
  });
});
