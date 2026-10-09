import { describe, it, expect } from "vitest";
import {
  distanceKm,
  distanceMeters,
  kmToLngDeg,
  kmToLatDeg,
  circlePolygon,
  footprintPolygon,
  articlesNear,
  formatDistance,
} from "../geo";

describe("geo utility unit tests", () => {
  // Makati CBD reference coordinates
  const MAKATI = { lat: 14.5547, lng: 121.0244 };
  // BGC reference coordinates (~3.1 km away)
  const BGC = { lat: 14.5494, lng: 121.0509 };

  describe("distanceKm and distanceMeters", () => {
    it("returns zero distance between identical points", () => {
      expect(distanceKm(MAKATI.lat, MAKATI.lng, MAKATI.lat, MAKATI.lng)).toBeCloseTo(0, 5);
      expect(distanceMeters(MAKATI.lat, MAKATI.lng, MAKATI.lat, MAKATI.lng)).toBe(0);
    });

    it("calculates realistic distance between Makati CBD and BGC", () => {
      const km = distanceKm(MAKATI.lat, MAKATI.lng, BGC.lat, BGC.lng);
      const meters = distanceMeters(MAKATI.lat, MAKATI.lng, BGC.lat, BGC.lng);

      // Distance is ~3.0 - 3.2 km
      expect(km).toBeGreaterThan(2.5);
      expect(km).toBeLessThan(3.5);
      expect(meters).toBe(Math.round(km * 1000));
    });

    it("is symmetric regardless of point order", () => {
      const forward = distanceKm(MAKATI.lat, MAKATI.lng, BGC.lat, BGC.lng);
      const reverse = distanceKm(BGC.lat, BGC.lng, MAKATI.lat, MAKATI.lng);
      expect(forward).toBeCloseTo(reverse, 8);

      const forwardM = distanceMeters(MAKATI.lat, MAKATI.lng, BGC.lat, BGC.lng);
      const reverseM = distanceMeters(BGC.lat, BGC.lng, MAKATI.lat, MAKATI.lng);
      expect(forwardM).toBe(reverseM);
    });
  });

  describe("degree conversions", () => {
    it("converts km to latitude and longitude degrees consistently", () => {
      const latDeg = kmToLatDeg(1);
      const lngDeg = kmToLngDeg(1, MAKATI.lat);

      expect(latDeg).toBeGreaterThan(0);
      expect(lngDeg).toBeGreaterThan(0);
      expect(Number.isFinite(latDeg)).toBe(true);
      expect(Number.isFinite(lngDeg)).toBe(true);
    });
  });

  describe("polygons", () => {
    it("generates a closed GeoJSON polygon for circlePolygon", () => {
      const circle = circlePolygon(MAKATI.lng, MAKATI.lat, 2, 36);
      expect(circle.type).toBe("Polygon");
      expect(Array.isArray(circle.coordinates)).toBe(true);
      const ring = circle.coordinates[0];
      expect(ring.length).toBe(37); // steps + 1 (37 points)
      // First and last points should match for a closed GeoJSON ring
      expect(ring[0][0]).toBeCloseTo(ring[ring.length - 1][0], 6);
      expect(ring[0][1]).toBeCloseTo(ring[ring.length - 1][1], 6);
    });

    it("generates a 5-point closed square polygon for footprintPolygon", () => {
      const footprint = footprintPolygon(MAKATI.lng, MAKATI.lat, 0.05);
      expect(footprint.type).toBe("Polygon");
      const ring = footprint.coordinates[0];
      expect(ring.length).toBe(5);
      expect(ring[0]).toEqual(ring[4]);
    });
  });

  describe("articlesNear and formatDistance", () => {
    const articles = [
      { slug: "bgc-tower", lat: BGC.lat, lng: BGC.lng },
      { slug: "makati-space", lat: MAKATI.lat, lng: MAKATI.lng },
      { slug: "no-coords", lat: null, lng: null },
    ];

    it("sorts articles by proximity and filters out articles without coordinates", () => {
      const nearMakati = articlesNear(articles, MAKATI.lat, MAKATI.lng, 10);
      expect(nearMakati.length).toBe(2);
      expect(nearMakati[0].slug).toBe("makati-space");
      expect(nearMakati[1].slug).toBe("bgc-tower");
    });

    it("formats distances correctly for humans", () => {
      expect(formatDistance(null)).toBe("");
      expect(formatDistance(Number.NaN)).toBe("");
      expect(formatDistance(0.45)).toBe("450 m");
      expect(formatDistance(3.1415)).toBe("3.1 km");
    });
  });
});
