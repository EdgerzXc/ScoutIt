import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BASELINE_EMOJI_FILES,
  BASELINE_HEX_FILES,
  filesWithEmoji,
  filesWithImgMissingAlt,
  filesWithRawAccentHex,
} from "../../../scripts/guard-design-debt.mjs";
import { filesWithTransitionAll } from "../../../scripts/name-transition-properties.mjs";

// A-098 — design-debt guardrails, no sweeps on locked surfaces. The audit
// measured wide drift; the fix policy is convert-on-touch only, and what
// this file enforces is that the drift STOPS GROWING plus the four bounded
// repairs (duplicate key, alt adjudication, hero context-loss, eyebrow
// judgement recorded as an eye-check boundary).
//
// Baselines are frozen in scripts/guard-design-debt.mjs — an exemption is a
// baseline edit in the same diff, which is the review signal. Locked
// surfaces (ShowcaseStage, Metropolis) stay untouched throughout.

const readSrc = (p) => fs.readFileSync(p, "utf8");

describe("A-098 · no new raw accent hex", () => {
  it("scans a real set of files", () => {
    expect(filesWithRawAccentHex().length).toBeGreaterThan(40);
  });

  it("no file outside the frozen baseline introduces one", () => {
    const fresh = filesWithRawAccentHex().filter(
      (f) => !BASELINE_HEX_FILES.includes(f),
    );
    expect(fresh).toEqual([]);
  });
});

describe("A-098 · no new emoji iconography", () => {
  it("scans a real set of files", () => {
    expect(filesWithEmoji().length).toBeGreaterThan(40);
  });

  it("no file outside the frozen baseline introduces one", () => {
    const fresh = filesWithEmoji().filter(
      (f) => !BASELINE_EMOJI_FILES.includes(f),
    );
    expect(fresh).toEqual([]);
  });
});

describe("A-098 · every raw <img> carries an alt", () => {
  it("adjudicated 2026-09-09: all 14 present uses are correct (meaningful alt, or empty alt beside a named heading) — this pins the state", () => {
    expect(filesWithImgMissingAlt()).toEqual([]);
  });
});

describe("A-098 · /descent duplicate key is fixed", () => {
  it("no two sibling cards share one key", () => {
    const page = readSrc("src/app/descent/page.js");
    // The bug: three news cards all linked to /intel with key={a.href}.
    expect(page).not.toContain("key={a.href}");
    expect(page).toContain("key={a.t}");
  });
});

describe("A-098 · transition:all stays named except the locked surface", () => {
  it("leaves `transition: all` only in the locked Showcase surface", async () => {
    const { default: surfaces } = await import(
      "../../../scripts/approved-surfaces.json",
      { with: { type: "json" } }
    );
    const locked = new Set(surfaces.surfaces.map((s) => s.path.replaceAll("\\", "/")));
    for (const file of filesWithTransitionAll()) {
      expect(locked.has(file)).toBe(true);
    }
  });
});

describe("A-098 · homepage heroes survive context loss", () => {
  it("both canvas heroes handle webglcontextlost with an honest fallback", () => {
    for (const hero of [
      "src/components/descent/GoldenHorizonCanvas.js",
      "src/components/descent/BlackHoleCanvas.js",
    ]) {
      const src = readSrc(hero);
      expect(src).toContain("webglcontextlost");
      expect(src).toContain("webglcontextrestored");
      expect(src).toContain("preventDefault");
    }
  });

  it("the engine contract still holds — no GL in the consumer, no force-loss anywhere", () => {
    const consumer = readSrc("src/components/descent/GoldenHorizonCanvas.js");
    expect(consumer).not.toContain("getContext(");
    expect(consumer).not.toContain("loseContext");
    const engine = readSrc("src/components/descent/blackHoleEngine.js");
    expect(engine).not.toContain("loseContext");
    const balance = readSrc("src/components/descent/BlackHoleCanvas.js");
    expect(balance).not.toContain("loseContext");
  });
});
