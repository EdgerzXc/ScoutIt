// @vitest-environment node
import { describe, expect, it } from "vitest";
import { escapeRegExpLiteral, isUrlOnHost } from "../../../scripts/test-url-hosts.mjs";

describe("network test host classification", () => {
  it.each([
    ["https://api.mapbox.com/geocoding/v5/place.json", true],
    ["https://API.MAPBOX.COM:443/geocoding", true],
    ["https://evil.example/api.mapbox.com", false],
    ["https://evil.example/?host=api.mapbox.com", false],
    ["https://api.mapbox.com.evil.example/geocoding", false],
    ["https://evil-api.mapbox.com/geocoding", false],
    ["https://api.mapbox.com@evil.example/geocoding", false],
    ["/api.mapbox.com", false],
    ["not a URL", false],
  ])("classifies %s by its parsed host", (url, expected) => {
    expect(isUrlOnHost(url, "api.mapbox.com")).toBe(expected);
  });

  it.each([
    ["https://basemaps.cartocdn.com/gl/style.json", true],
    ["https://a.basemaps.cartocdn.com/tiles/1.pbf", true],
    ["https://tiles.basemaps.cartocdn.com/tiles/1.pbf", true],
    ["https://nested.a.basemaps.cartocdn.com/tiles/1.pbf", true],
    ["https://evilbasemaps.cartocdn.com/tiles/1.pbf", false],
    ["https://basemaps.cartocdn.com.evil.example/tiles/1.pbf", false],
    ["https://evil.example/basemaps.cartocdn.com/tiles/1.pbf", false],
    ["https://evil.example/?tile=basemaps.cartocdn.com", false],
    ["https://basemaps.cartocdn.com@evil.example/tiles/1.pbf", false],
  ])("counts only the basemap domain and its subdomains: %s", (url, expected) => {
    expect(isUrlOnHost(url, "basemaps.cartocdn.com", { subdomains: true })).toBe(expected);
  });
});

describe("literal host escaping for source scanners", () => {
  it("does not treat dots or alternatives as regex operators", () => {
    const host = "api.example.com|other.example";
    const pattern = new RegExp(`^${escapeRegExpLiteral(host)}$`);
    expect(pattern.test(host)).toBe(true);
    expect(pattern.test("apiXexampleYcom")).toBe(false);
    expect(pattern.test("other.example")).toBe(false);
  });

  it("escapes every regex metacharacter that can change a literal match", () => {
    const literal = "a.*+?^${}()|[]\\z";
    const pattern = new RegExp(`^${escapeRegExpLiteral(literal)}$`);
    expect(pattern.test(literal)).toBe(true);
    expect(pattern.test("az")).toBe(false);
  });
});
