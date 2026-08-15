import { describe, it, expect } from "vitest";
import { commandLens } from "@/components/maps/lenses/command";
import { locationLens } from "@/components/maps/lenses/location";
import { floodLens } from "@/components/maps/lenses/flood";
import { transitLens } from "@/components/maps/lenses/transit";

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
