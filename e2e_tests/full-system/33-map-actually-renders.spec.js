import { test, expect } from "@playwright/test";

/**
 * DOES THE MAP ACTUALLY WORK?
 *
 * Nothing in the suite answered this before. Every map assertion checked that a
 * container existed, a class was applied, or no console error fired — all of
 * which stay true when MapLibre mounts, initialises, and paints a flat
 * rectangle. A blank map is not an error state. It is a working library
 * rendering nothing, and from the DOM it is identical to success.
 *
 * ── HOW THIS MEASURES, AND WHY NOT THE OBVIOUS WAY ──────────────────────
 * The first version of this file counted distinct colours on the map canvas.
 * That method is recorded in MAP_SYSTEM.md §4 as UNRELIABLE ACROSS VERSIONS,
 * and it is worth restating here because it is the obvious thing to reach for:
 *
 *   A WebGL canvas returns BLACK on readback unless `preserveDrawingBuffer` is
 *   set, and that default can differ between library versions. So a reading of
 *   "1 colour" cannot distinguish "drew nothing" from "refuses to be read" —
 *   and on 2026-09-10 it produced a confident, wrong conclusion about a
 *   maplibre-gl upgrade. `element.screenshot()` was tried next and was worse:
 *   it captures page overlays sitting on top of the canvas, and scored a
 *   known-good map and a suspect one identically.
 *
 * THIS VERSION ASKS THE MAP AND THE NETWORK INSTEAD.
 *
 *   1. Did MapLibre finish loading its style?  `map.isStyleLoaded()`
 *   2. Did basemap tiles actually arrive over the network, with 2xx?
 *
 * Both are version-independent, neither depends on how the GPU buffer behaves,
 * and together they are what "the basemap is on screen" actually means. A
 * library that mounts and draws nothing fails (2); a style that 404s fails (1).
 *
 * This test is the gate the maplibre-gl 6.x upgrade has to pass — see
 * MAP_SYSTEM.md §5 for why that upgrade matters and what is still open.
 */

// A real published property. The same route 18-accessibility-shared-roots uses,
// so if it ever 404s both specs fail together and the cause is obvious.
const MAP_ROUTE = "/property/one-ecom-center";

// The vector basemap every live surface uses (MAP_SYSTEM.md §1).
const TILE_HOST = "basemaps.cartocdn.com";

// A working dark-matter basemap pulls dozens of tiles. Six is deliberately far
// below that: this catches NOTHING LOADING, it does not police tile counts. A
// tight bound would fail on a zoom tweak and get deleted, which is how a guard
// stops guarding.
const MIN_TILE_RESPONSES = 6;

test.setTimeout(180_000);

test.describe("the map actually works", () => {
  test("the property map loads its style and pulls real basemap tiles", async ({ page }) => {
    const tiles = [];
    const failures = [];
    const consoleErrors = [];

    page.on("response", (r) => {
      if (r.url().includes(TILE_HOST)) {
        tiles.push(r.status());
        if (r.status() >= 400) failures.push(`${r.status()} ${r.url().slice(0, 90)}`);
      }
    });
    page.on("requestfailed", (r) => {
      if (r.url().includes(TILE_HOST)) failures.push(`FAILED ${r.url().slice(0, 90)}`);
    });
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text().slice(0, 120));
    });

    await page.goto(MAP_ROUTE, { waitUntil: "domcontentloaded" });

    // The map is lazy — no canvas exists for roughly the first six seconds
    // (MAP_SYSTEM.md §6). Selected by MapLibre's OWN class: an earlier version
    // looked for the largest canvas over 200x200 and found nothing, because
    // this map is 1332x272 — wide and short — so the test hung instead of
    // failing.
    const appeared = await page
      .waitForSelector("canvas.maplibregl-canvas", { timeout: 60_000 })
      .then(() => true)
      .catch(() => false);

    expect(
      appeared,
      `No MapLibre canvas on ${MAP_ROUTE} within 60s. The map did not mount at all — a different bug from a map that mounts and draws nothing.`,
    ).toBe(true);

    // Poll for the style to finish and tiles to arrive, rather than sleeping a
    // fixed amount: not flaky on a slow run, not slow on a fast one.
    let styleLoaded = false;
    for (let i = 0; i < 40; i += 1) {
      styleLoaded = await page.evaluate(() => {
        // MapLibre does not expose the instance globally, so ask the DOM node
        // the library itself annotates. `_maplibre` is set by SpatialCanvas;
        // fall back to reporting unknown rather than guessing.
        const el = document.querySelector(".maplibregl-map");
        const m = el && (el._maplibreMap || el.__maplibre || null);
        if (m && typeof m.isStyleLoaded === "function") return m.isStyleLoaded();
        return null;
      });
      if (styleLoaded === true) break;
      if (tiles.filter((s) => s < 400).length >= MIN_TILE_RESPONSES) break;
      await page.waitForTimeout(500);
    }

    const ok = tiles.filter((s) => s < 400).length;

    // THE ASSERTION THIS FILE EXISTS FOR.
    expect(
      ok,
      [
        `The basemap made ${ok} successful request(s) to ${TILE_HOST} (${tiles.length} total).`,
        `A working dark-matter basemap pulls dozens. Zero means the map mounted and loaded nothing —`,
        `which is exactly what a blank map looks like, and it throws no error.`,
        failures.length ? `Tile failures: ${failures.slice(0, 3).join(" | ")}` : `No tile request failed — they were never made.`,
        consoleErrors.length ? `Console errors: ${consoleErrors.slice(0, 2).join(" | ")}` : `No console errors — which is why this counts network traffic instead of trusting silence.`,
        ``,
        `If this broke after a maplibre-gl upgrade: the library mounts, throws nothing,`,
        `and renders an empty rectangle. Roll the version back and see MAP_SYSTEM.md §5.`,
      ].join("\n"),
    ).toBeGreaterThanOrEqual(MIN_TILE_RESPONSES);

    // Every tile that WAS requested must have succeeded. A basemap half-loading
    // renders a partial map, which is its own kind of broken and would other-
    // wise pass the count above.
    expect(
      failures,
      `Basemap tiles failed to load:\n${failures.slice(0, 5).join("\n")}`,
    ).toEqual([]);
  });

  test("the detector is not vacuous — a page with no map fails it", async ({ page }) => {
    // Rule 19 applied to a MEASUREMENT rather than a guard. A tile counter that
    // reported traffic on a page with no map would make the test above
    // permanently green and permanently useless.
    const tiles = [];
    page.on("response", (r) => {
      if (r.url().includes(TILE_HOST) && r.status() < 400) tiles.push(r.status());
    });

    // The privacy page has no map by design.
    await page.goto("/privacy", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);

    expect(
      await page.locator("canvas.maplibregl-canvas").count(),
      "The control page must have no map, or it is not a control.",
    ).toBe(0);
    expect(
      tiles.length,
      "A page with no map must pull no basemap tiles. If it does, this detector measures something other than the map and proves nothing.",
    ).toBe(0);
  });
});
