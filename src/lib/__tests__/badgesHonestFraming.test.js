import fs from "node:fs";
import { describe, expect, it } from "vitest";

// A-104 — the badges page must not promise undelivered benefits or a purchase
// path that does not exist. Counts are real and the pioneer claim flow is
// wired; the defect is copy + link only (no badge-schema or pricing changes).
//
// Source assertion is the right shape here: the property is the absence of a
// specific promise string and a specific purchase link. Behavioural render
// tests are unavailable in this repo (JSX in .js files, see ACTIVE "Not in
// this queue"), so the guard reads code, not prose — comments stripped first
// per the proxyBanGuardRetired precedent.

const source = fs.readFileSync("src/app/badges/page.js", "utf8");
const code = source
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(/\r?\n/)
  .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
  .join("\n");

describe("A-104 · badges page makes no undelivered-benefit promise", () => {
  it("guards the guard — reads the real page", () => {
    expect(code).toContain("BadgeRegistryPage");
    expect(code.length).toBeGreaterThan(2000);
  });

  it("does not promise lifetime privileges / massive discounts / elevated status", () => {
    for (const promise of [
      "lifetime privileges",
      "massive discounts",
      "elevated status",
    ]) {
      expect(code.toLowerCase()).not.toContain(promise);
    }
  });

  it("offers no purchase path for badges", () => {
    expect(code).not.toMatch(/href="\/pricing"/);
    expect(code).not.toContain("Unlock Now");
  });

  it("names the real path — staff-granted and pioneer-claimed, never sold", () => {
    expect(code).toMatch(/staff-granted/i);
  });
});
