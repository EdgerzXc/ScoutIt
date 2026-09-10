import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A MAP THAT FAILS MUST SAY SO.
 *
 * `SpatialCanvas` registered this and nothing else:
 *
 *   map.on("error", (e) => {
 *     if (e?.error?.message?.includes("tile") || e?.error?.status === 0) return;
 *   });
 *
 * The early return WAS the whole body. Every other error — a style that will
 * not load, a bad source, a failed sprite — reached the end of the function and
 * vanished. And because registering any `error` handler REPLACES MapLibre's own
 * default (which logs to the console), attaching this made the map quieter than
 * having no handler at all.
 *
 * The cost was measured: a maplibre-gl 6.x evaluation on 2026-09-10 spent an
 * afternoon on "the map fails and there is no error in the console". There was
 * an error the whole time. Nothing printed it.
 *
 * The tile filter is deliberately KEPT — panning past the edge of coverage
 * emits a stream of harmless per-tile 404s and aborted requests, and logging
 * those buries anything real. This file pins the distinction: filter the noise,
 * never the signal.
 */

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
// A comment describing the rule must not satisfy a check about the code
// (the A-080 trap).
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Isolate the body of `map.on("error", ...)` by brace matching. */
function errorHandlerBody(source) {
  const at = source.indexOf('map.on("error"');
  if (at === -1) return null;
  const open = source.indexOf("{", source.indexOf("=>", at));
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(open, i + 1);
    }
  }
  return null;
}

const SURFACES = ["src/components/maps/SpatialCanvas.js"];

describe("map errors reach a human", () => {
  it.each(SURFACES)("%s reports errors instead of discarding them", (file) => {
    const body = errorHandlerBody(stripComments(read(file)));
    expect(body, `${file} has no map.on("error") handler to check`).not.toBeNull();

    // The defect, stated as a property: a handler whose only statement is a
    // guard clause swallows everything that guard does not match.
    expect(
      /console\.(error|warn)/.test(body),
      [
        `The MapLibre error handler in ${file} does not report anything.`,
        `A handler that only filters is worse than no handler: registering one`,
        `replaces MapLibre's own console logging, so the map goes SILENT.`,
        `Handler body was:\n${body}`,
      ].join("\n"),
    ).toBe(true);
  });

  it.each(SURFACES)("%s still filters per-tile noise", (file) => {
    // The filter is not the bug and must survive. A map panned past coverage
    // emits harmless 404s per tile; logging them buries real failures.
    const body = errorHandlerBody(stripComments(read(file)));
    expect(body).toMatch(/tile/);
    expect(body).toMatch(/status === 0/);
  });

  it.each(SURFACES)("%s does not filter by returning before ever logging", (file) => {
    // Guards against the exact regression: reintroducing an early `return`
    // that covers every path.
    const body = errorHandlerBody(stripComments(read(file)));
    const logAt = body.search(/console\.(error|warn)/);
    const lastReturn = body.lastIndexOf("return");
    expect(
      logAt,
      "no reporting call found — see the first test in this file",
    ).toBeGreaterThan(-1);
    expect(
      lastReturn < logAt,
      `The last \`return\` in the handler comes AFTER the reporting call, so some errors still exit silently.\nBody:\n${body}`,
    ).toBe(true);
  });
});
