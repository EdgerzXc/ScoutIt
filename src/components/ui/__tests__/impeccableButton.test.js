import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

// A-016 — this is the submit control behind "Spend 1 Connect" in InquiryModal,
// UnitInquiryModal and OperatorRequestModal. It is the only thing standing
// between a double-click and a double charge, so its states are load-bearing.
//
// WHY THESE ARE SOURCE ASSERTIONS AND NOT RENDER ASSERTIONS:
// This repository writes JSX inside .js files, and the Vite/Rolldown pipeline
// vitest runs on only treats .jsx/.tsx as JSX. Importing any component from a
// test fails to parse, which is why the repo has no component render tests at
// all. Adding an esbuild loader does not help -- Rolldown ignores that option.
// The honest options were a source guard or a build-config change nobody asked
// for; this is the source guard. Recorded as a known limitation.

// Comments in this file deliberately quote the OLD broken code
// ("transition-all", "animate-spin", "disabled={...}") so the next reader knows
// what was wrong. Matching prose would fail every assertion below, so the
// comments are stripped before anything is asserted -- same technique as
// thirdPartyCallTimeouts.test.js.
function codeWithoutComments(path) {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("//"))
    .join(" ");
}

const SOURCE = codeWithoutComments("src/components/ui/ImpeccableButton.js");

describe("ImpeccableButton loading state", () => {
  it("does not swap the label out for the spinner", () => {
    // The spinner used to REPLACE the children:
    //     {isLoading ? <spinner /> : children}
    // A ~200px button became a ~16px one the instant you pressed it, and the
    // accessible name vanished with the text.
    expect(SOURCE).not.toMatch(/:\s*\(?\s*children\s*\)?\s*\}/);
  });

  it("renders children unconditionally so the button keeps its width", () => {
    expect(SOURCE).toContain("{children}");
  });

  it("announces the loading state to assistive technology", () => {
    expect(SOURCE).toContain("aria-busy");
  });

  it("puts the props spread BEFORE disabled so a caller cannot defeat the guard", () => {
    // JSX resolves duplicate props left-to-right, last one wins. With
    //     disabled={isLoading || props.disabled}  {...props}
    // any caller passing `disabled` overrode the in-flight guard on a paid
    // action. Order is the whole fix, so the order is what gets asserted.
    const spreadAt = SOURCE.indexOf("{...props}");
    const disabledAt = SOURCE.indexOf("disabled={");

    expect(spreadAt).toBeGreaterThan(-1);
    expect(disabledAt).toBeGreaterThan(-1);
    expect(spreadAt).toBeLessThan(disabledAt);
  });

  it("keeps the disabled computation dependent on isLoading", () => {
    expect(SOURCE).toMatch(/disabled=\{[^}]*isLoading/);
  });
});

describe("ImpeccableButton motion", () => {
  it("names the properties it transitions", () => {
    // `transition-all` animates every animatable property, including colour,
    // shadow, and layout-affecting ones.
    expect(SOURCE).not.toContain("transition-all");
  });

  it("does not spin for users who asked for reduced motion", () => {
    expect(SOURCE).toContain("motion-safe:animate-spin");
    // The unguarded class must not survive anywhere in the file.
    expect(SOURCE).not.toMatch(/(?<!motion-safe:)\banimate-spin\b/);
  });
});
