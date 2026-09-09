import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// A-094 — the dashboard ran its radius search twice per mount (a mount effect
// fired searchByRadius AND set the centre that the [radarCenter] effect turns
// into a second identical search), each doing an unbounded full-table read.
// Render tests are impossible in this repo (JSX in .js), so this contract
// pins the structure by reading source: the centre-set owns the search, the
// mount effect only sets the centre, and the query is bounded.

const root = process.cwd();
const buyer = readFileSync(join(root, "src/components/dashboard/BuyerMode.js"), "utf8");
const broker = readFileSync(join(root, "src/components/dashboard/BrokerMode.js"), "utf8");
const ctx = readFileSync(join(root, "src/context/DashboardContext.js"), "utf8");

function mountBlock(src) {
  // The mount effect is the one with an empty dep array that sets the centre.
  const m = src.match(/useEffect\(\(\) => \{\s*setRadarCenter\(DEFAULT_MAP_CENTER\);([\s\S]*?)\},\s*\[\]\);/);
  expect(m, "mount effect setting the centre must exist").toBeTruthy();
  return m[1];
}

describe("dashboard radius search fires once per mount (A-094)", () => {
  it.each([
    ["BuyerMode", buyer],
    ["BrokerMode", broker],
  ])("%s mount effect sets the centre but does not search", (_name, src) => {
    expect(mountBlock(src)).not.toContain("searchByRadius");
  });

  it.each([
    ["BuyerMode", buyer],
    ["BrokerMode", broker],
  ])("%s [radarCenter] effect still owns the search", (_name, src) => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*if \(radarCenter\) \{\s*searchByRadius\(radius, radarCenter\[0\], radarCenter\[1\]\);/);
  });

  it("radius change handler still searches directly", () => {
    for (const src of [buyer, broker]) {
      expect(src).toContain("searchByRadius(val, radarCenter");
    }
  });

  it("Supabase properties read in searchByRadius is bounded", () => {
    expect(ctx).toMatch(/from\('properties'\)\.select\('\*'\)[^;]*\.limit\(\d+\)/);
  });
});
