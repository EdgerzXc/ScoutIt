import { describe, it, expect } from "vitest";
import { featureFilter, validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import { commandLens } from "@/components/maps/lenses/command";
import { locationLens, buildPoiFilter, poiReachGeometry } from "@/components/maps/lenses/location";
import { floodLens } from "@/components/maps/lenses/flood";
import { transitLens } from "@/components/maps/lenses/transit";
import { distanceCircle } from "@/components/maps/useReach";

describe("SpatialCanvas Lenses", () => {
  describe("commandLens", () => {
    it("has correct metadata and enables 3D massing", () => {
      expect(commandLens.id).toBe("command");
      expect(commandLens.label).toBe("Command");
      expect(commandLens.massing).toBe(true);
      expect(typeof commandLens.mount).toBe("function");
      expect(typeof commandLens.applyVisibility).toBe("function");
      expect(typeof commandLens.unmount).toBe("function");
    });

    it("generates expected HUD layer buttons", () => {
      const buttons = commandLens.getLayerButtons({ quakeCount: 5, fireCount: 2 });
      const ids = buttons.map((b) => b.id);
      expect(ids).toContain("all");
      expect(ids).toContain("satellite");
      expect(ids).toContain("infra");
      expect(ids).toContain("quake");
      expect(ids).toContain("fire");
      expect(ids).toContain("peza");
      expect(ids).toContain("clusters");
      expect(ids).toContain("isochrones");
      expect(ids).toContain("seismic");
    });
  });

  describe("locationLens", () => {
    it("has correct metadata and enables 3D massing", () => {
      expect(locationLens.id).toBe("location");
      expect(locationLens.label).toBe("Tactical");
      expect(locationLens.massing).toBe(true);
      expect(typeof locationLens.mount).toBe("function");
      expect(typeof locationLens.applyVisibility).toBe("function");
      expect(typeof locationLens.unmount).toBe("function");
    });

    it("generates 4 canonical POI categories", () => {
      const buttons = locationLens.getLayerButtons();
      const ids = buttons.map((b) => b.id);
      expect(ids).toEqual(["all", "daily", "wellness", "social", "transit"]);
    });
  });

  // These cover the defect that shipped: the POI filter used ["!in", <expr>, ...],
  // which is legacy filter syntax requiring a plain string key. MapLibre fires an
  // `error` EVENT for an invalid filter and declines to add the layer — it does
  // not throw — so the whole nearby-places feature rendered nothing while the
  // source looked correct and every metadata test still passed.
  describe("buildPoiFilter", () => {
    const reach = {
      type: "Polygon",
      coordinates: [[[120.9, 14.5], [121.2, 14.5], [121.2, 14.7], [120.9, 14.7], [120.9, 14.5]]],
    };

    it("is accepted by the MapLibre style spec", () => {
      const errors = validateStyleMin({
        version: 8,
        sources: { s: { type: "vector", tiles: ["https://example.com/{z}/{x}/{y}.mvt"] } },
        layers: [
          {
            id: "pois",
            type: "circle",
            source: "s",
            "source-layer": "poi",
            filter: buildPoiFilter(null, reach),
          },
        ],
      });
      expect(errors).toEqual([]);
    });

    it("excludes infrastructure clutter", () => {
      const f = featureFilter(buildPoiFilter(null, reach));
      const at = (cls) => f.filter({ zoom: 16 }, {
        type: 1,
        properties: { class: cls, name: "X" },
        geometry: [[{ x: 0, y: 0 }]],
      });
      expect(at("gate")).toBe(false);
      expect(at("bollard")).toBe(false);
      expect(at("waste_basket")).toBe(false);
    });

    it("renders nothing when there is no measured reach", () => {
      // The circle is a promise about distance. Without one, showing POIs would
      // break that promise silently.
      const f = featureFilter(buildPoiFilter(null, null));
      const passes = f.filter({ zoom: 16 }, {
        type: 1,
        properties: { class: "restaurant", name: "X" },
        geometry: [[{ x: 0, y: 0 }]],
      });
      expect(passes).toBe(false);
    });

    it("narrows to a single group when one is selected", () => {
      const filter = JSON.stringify(buildPoiFilter("social", reach));
      expect(filter).toContain("restaurant");
      expect(filter).not.toContain("pharmacy");
    });
  });

  describe("poiReachGeometry", () => {
    const band = (size) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [[[0, 0], [size, 0], [size, size], [0, size], [0, 0]]],
      },
    });

    it("picks the tightest band, whatever order they arrive in", () => {
      // The pedestrian band. Measured over Ortigas the 5-min walk is 0.76km
      // across and the 10-min drive 4.46km; clipping shops to the driving band
      // answers a question nobody asked.
      const geom = poiReachGeometry({ type: "FeatureCollection", features: [band(3), band(1), band(2)] });
      expect(geom.coordinates[0][1][0]).toBe(1);
    });

    it("returns null rather than guessing when there is no usable shape", () => {
      expect(poiReachGeometry(null)).toBeNull();
      expect(poiReachGeometry({ type: "FeatureCollection", features: [] })).toBeNull();
    });
  });

  describe("distanceCircle", () => {
    it("measures real ground distance, not screen pixels", () => {
      const radiusM = 900;
      const lat = 14.5547;
      const lng = 121.0244;
      const ring = distanceCircle(lat, lng, radiusM).features[0].geometry.coordinates[0];

      // Every vertex must sit ~radiusM from the centre. The rings this replaced
      // had a radius in screen pixels and so measured nothing at any zoom.
      const mPerDegLat = 110540;
      const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
      for (const [vLng, vLat] of ring) {
        const dx = (vLng - lng) * mPerDegLng;
        const dy = (vLat - lat) * mPerDegLat;
        expect(Math.hypot(dx, dy)).toBeCloseTo(radiusM, -1);
      }
    });

    it("closes the ring", () => {
      const ring = distanceCircle(14.5, 121, 500).features[0].geometry.coordinates[0];
      expect(ring[0]).toEqual(ring[ring.length - 1]);
    });

    it("is labelled as a distance, never as minutes", () => {
      const props = distanceCircle(14.5, 121, 900).features[0].properties;
      expect(props.isFallback).toBe(true);
      expect(props.label).toBe("900 m radius");
      expect(props.label).not.toMatch(/min/i);
    });
  });

  describe("floodLens", () => {
    it("has correct metadata and disables 3D massing", () => {
      expect(floodLens.id).toBe("flood");
      expect(floodLens.label).toBe("Flood");
      expect(floodLens.massing).toBe(false);
      expect(typeof floodLens.mount).toBe("function");
      expect(typeof floodLens.applyVisibility).toBe("function");
      expect(typeof floodLens.unmount).toBe("function");
    });

    it("generates 3 NOAH return period buttons", () => {
      const buttons = floodLens.getLayerButtons();
      const ids = buttons.map((b) => b.id);
      expect(ids).toEqual(["5yr", "25yr", "100yr"]);
    });
  });

  describe("transitLens", () => {
    it("has correct metadata and disables 3D massing", () => {
      expect(transitLens.id).toBe("transit");
      expect(transitLens.label).toBe("Transit");
      expect(transitLens.massing).toBe(false);
      expect(typeof transitLens.mount).toBe("function");
      expect(typeof transitLens.applyVisibility).toBe("function");
      expect(typeof transitLens.unmount).toBe("function");
    });

    it("generates transit line selector buttons", () => {
      const buttons = transitLens.getLayerButtons();
      const ids = buttons.map((b) => b.id);
      expect(ids).toEqual(["all", "lrt1", "lrt2", "mrt3"]);
    });
  });
});
