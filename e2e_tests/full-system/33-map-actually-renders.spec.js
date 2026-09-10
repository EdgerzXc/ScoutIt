import { test, expect } from "@playwright/test";

/**
 * DOES THE MAP ACTUALLY DRAW ANYTHING?
 *
 * Nothing in the suite answered this before. Every map test asserted that a
 * container existed, that a class name was applied, or that no console error
 * fired — all of which stay true when MapLibre mounts, initialises, and paints
 * a uniform grey rectangle. A blank map is not an error state; it is a working
 * library rendering nothing, and it looks identical to success from the DOM.
 *
 * WHY THIS EXISTS (A-121, then the maplibre-gl advisory on 2026-09-10)
 * The one open critical advisory is fixed only by maplibre-gl 6.9.0, a major.
 * On 2026-09-10 that upgrade was shown to BUILD once the imports move from
 * default to namespace — but A-121 had previously found that 6.x blanks every
 * map surface, measured by counting distinct canvas colours: 459 on 5.24.0
 * against 1 on 6.x. That measurement was run ad hoc and never committed, so
 * the finding could not be re-checked against a newer 6.x and the upgrade
 * stayed blocked on folklore rather than evidence.
 *
 * This is that measurement, committed. It is the gate the upgrade has to pass.
 *
 * THE CONTROL IS THE POINT. Counting colours proves nothing on its own — a
 * number is only meaningful against a known-good one. The test therefore
 * asserts a FLOOR derived from a real 5.24.0 reading, and separately asserts
 * the specific failure signature (a canvas of one or two flat colours), so a
 * regression is reported as "the map went blank" rather than "a number moved".
 */

// A real published property. The same route 18-accessibility-shared-roots uses,
// so if it ever 404s both specs fail together and the cause is obvious.
const MAP_ROUTE = "/property/one-ecom-center";

// From a 5.24.0 reading of 191–459 distinct colours depending on surface and
// zoom. 25 is deliberately far below the observed floor: this test exists to
// catch BLANK (1–2 colours), not to police rendering detail. A tight bound
// here would fail on a basemap tweak and get deleted, which is how a guard
// stops guarding.
const MIN_DISTINCT_COLOURS = 25;

test.setTimeout(240_000);

/** Count distinct RGBA values actually painted on the map canvas. */
async function readCanvas(page) {
  return page.evaluate(() => {
    // Selected by MapLibre's OWN class rather than by size. The first version
    // of this looked for the biggest canvas over 200x200 and found nothing:
    // the property map is 1332x272 — wide and short — so a square-ish size
    // heuristic missed it entirely and the test hung instead of failing.
    // Asking for the element the library actually creates removes the guess,
    // and also stops a chart or avatar canvas being measured in its place.
    const canvas = document.querySelector("canvas.maplibregl-canvas");
    if (!canvas) return { found: false };

    // `preserveDrawingBuffer` is not set on the map, so reading the WebGL
    // buffer directly returns empty. Drawing into a 2D canvas first is what
    // makes the pixels readable — this is the step the ad-hoc run needed too.
    const scratch = document.createElement("canvas");
    scratch.width = canvas.width;
    scratch.height = canvas.height;
    const ctx = scratch.getContext("2d");
    ctx.drawImage(canvas, 0, 0);

    let data;
    try {
      data = ctx.getImageData(0, 0, scratch.width, scratch.height).data;
    } catch {
      return { found: true, readable: false };
    }

    const seen = new Set();
    // Every 40th pixel: enough to characterise a basemap, cheap enough to run
    // in a test. A blank canvas returns 1 either way.
    for (let i = 0; i < data.length; i += 4 * 40) {
      seen.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
    }
    return {
      found: true,
      readable: true,
      distinctColours: seen.size,
      width: canvas.width,
      height: canvas.height,
      sample: [...seen].slice(0, 4),
    };
  });
}

test.describe("the map draws something", () => {
  test("the property map paints a real basemap, not a blank rectangle", async ({ page }) => {
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });

    await page.goto(MAP_ROUTE, { waitUntil: "domcontentloaded" });

    // Wait for a map-sized canvas to exist at all. Its absence is a different
    // failure from a blank one and must not be reported as "went blank".
    await page
      .waitForSelector("canvas.maplibregl-canvas", { timeout: 45_000 })
      .catch(() => {});

    const mounted = await readCanvas(page);
    expect(
      mounted.found,
      `No map-sized canvas on ${MAP_ROUTE}. The map did not mount at all — that is a different bug from a blank map.`,
    ).toBe(true);

    // Tiles are network-bound. Poll rather than sleep a fixed amount, so this
    // is not flaky on a slow run and not slow on a fast one.
    let reading = mounted;
    for (let i = 0; i < 20 && (reading.distinctColours || 0) < MIN_DISTINCT_COLOURS; i += 1) {
      await page.waitForTimeout(1000);
      reading = await readCanvas(page);
    }

    expect(reading.readable, "The map canvas could not be read back.").toBe(true);

    // THE ASSERTION THIS FILE EXISTS FOR.
    expect(
      reading.distinctColours,
      [
        `The map rendered ${reading.distinctColours} distinct colour(s) on a ${reading.width}x${reading.height} canvas.`,
        `A working basemap reads in the hundreds; 1-2 means it painted a flat rectangle and nothing else.`,
        `Sample: ${JSON.stringify(reading.sample)}`,
        ``,
        `If this broke after a maplibre-gl upgrade, that is the A-121 failure repeating:`,
        `the library mounts, throws no error, and draws nothing. Roll the version back.`,
        consoleErrors.length ? `Console errors: ${consoleErrors.slice(0, 3).join(" | ")}` : `No console errors — which is exactly why this test counts pixels instead.`,
      ].join("\n"),
    ).toBeGreaterThanOrEqual(MIN_DISTINCT_COLOURS);
  });

  test("a blank canvas would be caught — the detector is not vacuous", async ({ page }) => {
    // Rule 19 in a spec: prove the measurement can FAIL before trusting it to
    // pass. A pixel counter that returns a high number for a blank canvas
    // would make the test above permanently green and permanently useless.
    await page.goto(MAP_ROUTE, { waitUntil: "domcontentloaded" });

    const blankReading = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 400;
      c.height = 400;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(0, 0, 400, 400);
      const data = ctx.getImageData(0, 0, 400, 400).data;
      const seen = new Set();
      for (let i = 0; i < data.length; i += 4 * 40) {
        seen.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
      }
      return seen.size;
    });

    expect(
      blankReading,
      "A deliberately flat canvas must read as 1 colour. If it does not, the counter is broken and the test above proves nothing.",
    ).toBe(1);
    expect(blankReading).toBeLessThan(MIN_DISTINCT_COLOURS);
  });
});
