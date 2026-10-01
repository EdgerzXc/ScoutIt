import { describe, expect, it } from "vitest";
import { isCartoVectorTile } from "../../../e2e_tests/full-system/mapTileResponse";

describe("A-132 basemap response classification", () => {
  it.each([
    ["https://tiles.basemaps.cartocdn.com/vectortiles/carto.streets/v1/14/13700/7522.mvt", true],
    ["https://basemaps.cartocdn.com/tiles/12/3424/1880.pbf?cache=1", true],
    ["https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json", false],
    ["https://tiles.basemaps.cartocdn.com/carto/tiles.json", false],
    ["https://basemaps.cartocdn.com/gl/sprite.png", false],
    ["https://tiles.basemaps.cartocdn.com/fonts/Open%20Sans/0-255.pbf", false],
    ["https://tiles.basemaps.cartocdn.com/12/3424/1880.png", false],
    ["https://basemaps.cartocdn.com.evil.test/12/3424/1880.mvt", false],
    ["https://evil.test/tiles.basemaps.cartocdn.com/12/3424/1880.mvt", false],
  ])("%s counts as a vector tile: %s", (url, expected) => {
    expect(isCartoVectorTile(url)).toBe(expected);
  });
});
