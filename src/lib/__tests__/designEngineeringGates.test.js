import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { cssFiles, guardHoverRules, unguardedHoverFiles } from "../../../scripts/guard-hover-rules.mjs";
import { filesWithTransitionAll, NAMED_PROPERTIES } from "../../../scripts/name-transition-properties.mjs";

// A-074 — design engineering, reviewed against Emil Kowalski's checklist.
//
// Four of the five findings are guarded here. The fifth (`transition: all` in
// the locked ShowcaseStage) is deliberately NOT fixed — A-074 acceptance 5
// says to stop and raise a locked-surface change with the owner rather than
// make it.

const LOCKED = new Set(
  JSON.parse(fs.readFileSync("scripts/approved-surfaces.json", "utf8")).surfaces.map((s) =>
    s.path.replaceAll("\\", "/")
  )
);

describe("A-074 · a tap must not leave a stuck hover state", () => {
  it("scans a real set of stylesheets", () => {
    expect(cssFiles().length).toBeGreaterThan(20);
  });

  it("has no `:hover` rule outside a capability guard", () => {
    // On touch, a tap fires :hover and the state sticks after the finger
    // lifts, so a card reads as "selected". This is the one finding in A-074
    // that actively misleads a user about what is selected.
    //
    // This is a REGRESSION gate, not a proof of exhaustiveness — see the
    // limitation recorded on `unguardedHoverFiles`. It catches the shape that
    // causes the defect, and a mutation that unwraps a guard turns it red.
    expect(unguardedHoverFiles()).toEqual([]);
  });

  it("keeps non-hover selectors OUT of the guard, so keyboard focus still works on touch", () => {
    // `.link:hover .gold, .link:focus-visible .gold { … }` must be split, not
    // moved wholesale — wrapping it would delete the focus styles on every
    // touch device, which is a worse defect than the one being fixed.
    const wordmark = fs.readFileSync("src/components/brand/ScoutItWordmark.module.css", "utf8");
    const guardStart = wordmark.indexOf("@media (hover: hover)");
    expect(guardStart).toBeGreaterThan(-1);
    expect(wordmark.slice(0, guardStart)).toContain(".link:focus-visible .gold");
  });

  it("is idempotent — running the transform again changes nothing", () => {
    for (const file of cssFiles()) {
      const css = fs.readFileSync(file, "utf8");
      expect(guardHoverRules(css)).toBe(css);
    }
  });
});

describe("A-074 · transitions name their properties", () => {
  it("leaves `transition: all` only in the locked Showcase surface", () => {
    const remaining = filesWithTransitionAll();
    for (const file of remaining) expect(LOCKED.has(file)).toBe(true);
  });

  it("names only compositor-friendly properties — no layout-bound ones", () => {
    for (const property of ["width", "height", "padding", "margin", "font-size", "border-width"]) {
      expect(NAMED_PROPERTIES).not.toContain(property);
    }
    expect(NAMED_PROPERTIES).toContain("transform");
    expect(NAMED_PROPERTIES).toContain("opacity");
  });
});

describe("A-074 · motion answers prefers-reduced-motion", () => {
  it("every stylesheet with motion has a reduced-motion block", () => {
    const missing = cssFiles()
      .filter((file) => {
        const css = fs.readFileSync(file, "utf8");
        return /transition|animation/.test(css) && !css.includes("prefers-reduced-motion");
      })
      .map((file) => file.replaceAll("\\", "/"));

    expect(missing).toEqual([]);
  });

  it("includes the Orbit WebGL hero, the most motion-heavy surface on the site", () => {
    const orbit = fs.readFileSync("src/components/orbit/scout-earth.css", "utf8");
    expect(orbit).toContain("prefers-reduced-motion");
  });
});

describe("A-074 · every hovered control gives press feedback", () => {
  it("no stylesheet defines `:hover` without also defining `:active`", () => {
    const missing = cssFiles()
      .filter((file) => {
        const css = fs.readFileSync(file, "utf8");
        return css.includes(":hover") && !css.includes(":active");
      })
      .map((file) => file.replaceAll("\\", "/"));

    expect(missing).toEqual([]);
  });
});

describe("A-074 · the palette stays deep black plus gold", () => {
  it("the admin console no longer hardcodes an off-palette red", () => {
    const admin = fs.readFileSync("src/app/admin/page.js", "utf8");
    // The literal survives only inside the comment explaining why it went.
    const withoutComments = admin.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(withoutComments).not.toContain("#ff3333");
    expect(withoutComments).not.toContain("255, 51, 51");
    expect(admin).toContain("var(--red)");
  });
});
