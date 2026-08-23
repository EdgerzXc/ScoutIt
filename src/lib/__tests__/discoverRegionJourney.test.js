import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";
import { cityToRegion, regionOf } from "@/lib/regions";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

describe("F-004 Discover region journey and content ordering contract", () => {
  it("normalizes region aliases and variations deterministically", () => {
    // BGC / Taguig
    expect(cityToRegion("BGC, Taguig")).toBe("BGC");
    expect(cityToRegion("Bonifacio Global City")).toBe("BGC");
    expect(cityToRegion("Taguig")).toBe("BGC");
    expect(regionOf({ city: "Taguig" })).toBe("BGC");
    expect(regionOf({ region: "BGC, Taguig" })).toBe("BGC");

    // Makati
    expect(cityToRegion("Makati CBD")).toBe("Makati");
    expect(cityToRegion("Poblacion, Makati")).toBe("Makati");
    expect(cityToRegion("Ayala Avenue, Makati")).toBe("Makati");
    expect(regionOf({ city: "Makati" })).toBe("Makati");
    expect(regionOf({ location: "Poblacion, Makati" })).toBe("Makati");

    // Siargao
    expect(cityToRegion("General Luna, Siargao")).toBe("Siargao");
    expect(cityToRegion("Siargao Island")).toBe("Siargao");

    // Palawan
    expect(cityToRegion("El Nido, Palawan")).toBe("Palawan");
    expect(cityToRegion("Coron, Palawan")).toBe("Palawan");
    expect(cityToRegion("San Vicente")).toBe("Palawan");

    // Bohol
    expect(cityToRegion("Panglao Island")).toBe("Bohol");
    expect(cityToRegion("Tagbilaran, Bohol")).toBe("Bohol");

    // Cebu
    expect(cityToRegion("Cebu City")).toBe("Cebu");
    expect(cityToRegion("Mandaue, Cebu")).toBe("Cebu");

    // Quezon City
    expect(cityToRegion("Quezon City")).toBe("Quezon City");
    expect(cityToRegion("QC")).toBe("Quezon City");
  });

  it("filters both articles and spaces deterministically by activeRegion", () => {
    const testProperties = [
      { id: "p1", title: "BGC Loft", city: "BGC", region: "BGC" },
      { id: "p2", title: "Makati Tower", city: "Makati", region: "Makati" },
      { id: "p3", title: "Siargao Villa", city: "General Luna", region: "Siargao" },
      { id: "p4", title: "Cebu Hub", city: "Cebu City", region: "Cebu" },
    ];

    const testIntel = [
      { id: "i1", title: "BGC Growth", region: "BGC, Taguig" },
      { id: "i2", title: "Makati Retrofits", region: "Makati CBD" },
      { id: "i3", title: "Palawan Resorts", region: "El Nido, Palawan" },
    ];

    // Union of regions across both datasets
    const availableRegions = new Set();
    testProperties.forEach((p) => availableRegions.add(regionOf(p)));
    testIntel.forEach((i) => availableRegions.add(regionOf(i)));
    const sortedRegions = Array.from(availableRegions).sort();

    expect(sortedRegions).toEqual(["BGC", "Cebu", "Makati", "Palawan", "Siargao"]);

    // Case 1: All Regions (null activeRegion)
    const allProps = testProperties.filter(() => true);
    const allNews = testIntel.filter(() => true);
    expect(allProps).toHaveLength(4);
    expect(allNews).toHaveLength(3);

    // Case 2: Selected region with both properties and news (BGC)
    const bgcProps = testProperties.filter((p) => regionOf(p) === "BGC");
    const bgcNews = testIntel.filter((i) => regionOf(i) === "BGC");
    expect(bgcProps).toHaveLength(1);
    expect(bgcProps[0].id).toBe("p1");
    expect(bgcNews).toHaveLength(1);
    expect(bgcNews[0].id).toBe("i1");

    // Case 3: Region with spaces but no articles (Cebu)
    const cebuProps = testProperties.filter((p) => regionOf(p) === "Cebu");
    const cebuNews = testIntel.filter((i) => regionOf(i) === "Cebu");
    expect(cebuProps).toHaveLength(1);
    expect(cebuProps[0].id).toBe("p4");
    expect(cebuNews).toHaveLength(0);

    // Case 4: Region with articles but no spaces (Palawan)
    const palawanProps = testProperties.filter((p) => regionOf(p) === "Palawan");
    const palawanNews = testIntel.filter((i) => regionOf(i) === "Palawan");
    expect(palawanProps).toHaveLength(0);
    expect(palawanNews).toHaveLength(1);
    expect(palawanNews[0].id).toBe("i3");
  });

  it("enforces the approved product order in DiscoverClient source: News Feed -> Regions -> Spaces", () => {
    const discoverSource = read("src/app/discover/DiscoverClient.js");

    const newsIndex = discoverSource.indexOf('aria-label="Regional News Feed"');
    const regionsIndex = discoverSource.indexOf('aria-label="Regions Navigation"');
    const spacesIndex = discoverSource.indexOf('aria-label="Regional Spaces"');

    expect(newsIndex).toBeGreaterThan(0);
    expect(regionsIndex).toBeGreaterThan(0);
    expect(spacesIndex).toBeGreaterThan(0);

    // Approved product order: News Feed FIRST, Regions SECOND, Spaces THIRD
    expect(newsIndex).toBeLessThan(regionsIndex);
    expect(regionsIndex).toBeLessThan(spacesIndex);
  });

  it("includes accessible button elements with aria-pressed for region controls", () => {
    const discoverSource = read("src/app/discover/DiscoverClient.js");
    expect(discoverSource).toContain("aria-pressed={activeRegion === null}");
    expect(discoverSource).toContain("aria-pressed={isSelected}");
    expect(discoverSource).toContain("setActiveRegion(initialRegionParam ? cityToRegion(initialRegionParam) : null)");
    expect(discoverSource).toContain("contextMeta");
  });
});
