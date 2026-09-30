import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/app/global-error.js", "utf8");
const scriptLiteral = /__html:\s*("[^"\n]+")/.exec(source)?.[1];
if (!scriptLiteral) throw new Error("Global recovery is missing its first-paint mode script");
const firstPaintScript = JSON.parse(scriptLiteral);

function classesAfterFirstPaint(stored, storageThrows = false) {
  const classes = new Set();
  vm.runInNewContext(firstPaintScript, {
    document: { body: { classList: { add: (name) => classes.add(name) } } },
    localStorage: { getItem: (key) => {
      if (storageThrows) throw new Error("storage unavailable");
      return stored[key] ?? null;
    } },
  });
  return [...classes];
}

describe("root recovery document", () => {
  it("starts dark when no appearance has been saved", () => {
    expect(classesAfterFirstPaint({})).toEqual([]);
    expect(classesAfterFirstPaint({}, true)).toEqual([]);
  });

  it("restores the saved White Lens before content paints", () => {
    expect(classesAfterFirstPaint({ scoutit_display_mode: "light" })).toEqual(["light-mode"]);
  });

  it("restores high contrast without turning on White Lens", () => {
    expect(classesAfterFirstPaint({ scoutit_accessibility_mode: "high-contrast" })).toEqual(["high-contrast"]);
  });
});
