import { describe, it, expect } from "vitest";
import { classifySavedItem, liveSlugSet } from "@/lib/wishlistLiveness";

// A-102 — a saved board must never link to a dead slug, and liveness must
// never be asserted from a failed fetch. Broker saves live in a different
// liveness domain (roster, not catalogue) and legacy UUID-shaped ids predate
// slug saves: both resolve 'unknown', never 'removed'.

describe("wishlistLiveness", () => {
  const live = new Set(["one-ecom-center", "two-ecom-center"]);

  it("ok for a live slug", () => {
    expect(classifySavedItem({ property_id: "one-ecom-center" }, live)).toBe("ok");
  });

  it("removed for a slug absent from a loaded set", () => {
    expect(classifySavedItem({ property_id: "gone-tower" }, live)).toBe("removed");
  });

  it.each([[null], [undefined], ["not-a-set"], [[]]])(
    "unknown when the live set is not loaded (%s)",
    (set) => {
      expect(classifySavedItem({ property_id: "gone-tower" }, set)).toBe("unknown");
    },
  );

  it("unknown for broker saves regardless of the set", () => {
    expect(classifySavedItem({ property_id: "gone-tower", is_broker: true }, live)).toBe("unknown");
    expect(classifySavedItem({ property_id: "one-ecom-center", is_broker: true }, live)).toBe("unknown");
  });

  it("unknown for missing ids and legacy UUID-shaped ids", () => {
    expect(classifySavedItem({}, live)).toBe("unknown");
    expect(classifySavedItem({ property_id: "" }, live)).toBe("unknown");
    expect(classifySavedItem({ property_id: "57a67739-a919-4141-a706-d943c82ac75c" }, live)).toBe("unknown");
  });

  it("liveSlugSet collects slugs only", () => {
    expect(liveSlugSet([{ slug: "a" }, { slug: "" }, {}, { id: "recX" }])).toEqual(new Set(["a"]));
    expect(liveSlugSet(null)).toBeNull();
  });
});

import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");

describe("A-102 wiring contract (source assertions — components are untestable here)", () => {
  it("no fallback slug attributes saves or links to an unrelated property", () => {
    // Save attribution (ReactionButtons) plus every roster/back navigation
    // link: without a real slug there is nothing truthful to point at.
    // (mockShowcase.js keeps a sample-data key by design — excluded.)
    for (const file of [
      "src/components/property/ResidentialFlow.js",
      "src/components/property/CommercialFlow.js",
      "src/app/property/[id]/brokers/BrokersClient.js",
    ]) {
      expect(read(file)).not.toContain("batasan-hills");
    }
    for (const file of [
      "src/components/property/ResidentialFlow.js",
      "src/components/property/CommercialFlow.js",
    ]) {
      const src = read(file);
      expect(src).toMatch(/\{slug \? \(\s*<ReactionButtons propertyId=\{slug\}/);
      expect(src).toContain("${slug}/brokers");
    }
  });

  it("wishlist board resolves liveness and marks removed saves", () => {
    const src = read("src/app/wishlist/page.js");
    expect(src).toContain("classifySavedItem");
    expect(src).toContain("liveSlugSet");
    expect(src).toContain("Listing removed");
    expect(src).toContain("removed-marker");
  });

  it("shared board keys enrichment by slug and marks removed saves", () => {
    const src = read("src/app/wishlist/shared/[token]/page.js");
    expect(src).toContain("p.slug || p.id");
    expect(src).toContain("Listing removed");
    expect(src).toContain("classifySavedItem");
    const css = read("src/app/wishlist/shared/[token]/shared-board.css");
    expect(css).toContain(".removed-marker");
  });
});

it("does not remove saved links when CMS answers HTTP 200 with its empty fallback", () => {
  const payload = { properties: [], intel: [], brokers: [], source: "catalog" };
  expect(classifySavedItem({ property_id: "one-ecom-center" }, liveSlugSet(payload.properties))).toBe("unknown");
  expect(liveSlugSet([{}, { slug: "" }])).toBeNull();
});