import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

// A-106 — A-082 removed invented provenance from the shared Intel mapper,
// but three pages mapping CMS rows directly re-invented it locally: a missing
// date became "Just Now" and a missing category became "Residential" (a real
// vertical with real filter semantics). Absent renders absent; uncategorized
// rows keep fetchIntel's honest "General" label. Render tests are impossible
// in this repo, so this contract reads the three call sites.

const SITES = [
  "src/app/intel/[article-slug]/page.js",
  "src/app/intel/page.js",
  "src/app/discover/DiscoverClient.js",
];

describe("A-106 — Intel render paths invent no provenance", () => {
  it.each(SITES)("%s never defaults a missing date to a recency claim", (file) => {
    expect(readFileSync(file, "utf8")).not.toContain("Just Now");
  });

  it.each(SITES)("%s never defaults a missing category to a real vertical", (file) => {
    const src = readFileSync(file, "utf8");
    // Narrow: `= <something>category || "Residential"`. The Discover tab
    // default (`matchedCategory ... || "Residential"`) is a selected-tab
    // fallback, not a data label, and is out of scope by design.
    expect(src).not.toMatch(/category\s*\|\|\s*["']Residential["']/);
  });
});
