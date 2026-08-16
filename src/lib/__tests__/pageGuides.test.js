import { describe, it, expect } from "vitest";
import { guideForPath, GUIDES, DEFAULT_GUIDE } from "@/lib/pageGuides";

// These lock in the behaviour that made the guide worth replacing: it must
// depend on the surface, it must fall back rather than break, and a role must
// never be able to produce an empty guide.

describe("guideForPath — surface resolution", () => {
  it("returns the property guide for a property page", () => {
    expect(guideForPath("/property/one-ecom-center").id).toBe("property");
  });

  it("returns the property guide for a unit page beneath a property", () => {
    // A reader deep in a unit page has more questions about this surface, not
    // fewer, so the deeper path must not fall through to the default.
    expect(guideForPath("/property/one-ecom-center/unit/12").id).toBe("property");
  });

  it("resolves discover, dashboard and wishlist to their own guides", () => {
    expect(guideForPath("/discover").id).toBe("discover");
    expect(guideForPath("/dashboard").id).toBe("dashboard");
    expect(guideForPath("/wishlist").id).toBe("wishlist");
  });

  it("falls back to the default guide on an unknown surface", () => {
    expect(guideForPath("/some/page/that/does/not/exist").id).toBe(DEFAULT_GUIDE.id);
  });

  it("falls back to the default guide for the root path", () => {
    expect(guideForPath("/").id).toBe(DEFAULT_GUIDE.id);
  });

  it("survives a missing or malformed pathname rather than throwing", () => {
    // The guide is chrome. It must never be the reason a page breaks.
    expect(() => guideForPath(undefined)).not.toThrow();
    expect(() => guideForPath(null)).not.toThrow();
    expect(guideForPath("").id).toBe(DEFAULT_GUIDE.id);
  });

  it("ignores a query string", () => {
    expect(guideForPath("/property/x?ref=email").id).toBe("property");
  });
});

describe("guideForPath — role variants", () => {
  it("returns role-neutral copy when no role is supplied", () => {
    // The signed-out case, which is most readers of a property page.
    const neutral = guideForPath("/property/x");
    expect(neutral.steps).toEqual(GUIDES.property.steps);
  });

  it("returns the owner variant for an owner", () => {
    const owner = guideForPath("/property/x", "owner");
    expect(owner.steps).toEqual(GUIDES.property.byRole.owner);
    expect(owner.steps).not.toEqual(GUIDES.property.steps);
  });

  it("returns the broker variant for a broker", () => {
    const broker = guideForPath("/property/x", "broker");
    expect(broker.steps).toEqual(GUIDES.property.byRole.broker);
  });

  it("falls back to neutral copy for a role with no variant", () => {
    // A new role must never blank the guide — Standing Rule 23 in spirit: a
    // fallback that returns nothing is worse than the generic answer.
    expect(guideForPath("/property/x", "photographer").steps).toEqual(GUIDES.property.steps);
  });

  it("ignores a role on a surface that has no variants", () => {
    expect(guideForPath("/discover", "owner").steps).toEqual(GUIDES.discover.steps);
  });
});

describe("every guide is renderable", () => {
  const allStepSets = Object.values(GUIDES)
    .flatMap((g) => [g.steps, ...Object.values(g.byRole || {})])
    .concat([DEFAULT_GUIDE.steps]);

  it("has at least one step in every set", () => {
    for (const steps of allStepSets) expect(steps.length).toBeGreaterThan(0);
  });

  it("has a non-empty glyph, title and body on every step", () => {
    // The wizard renders all three unconditionally; a missing field would
    // render as blank chrome rather than fail loudly.
    for (const steps of allStepSets) {
      for (const step of steps) {
        expect(step.glyph?.length).toBeGreaterThan(0);
        expect(step.title?.length).toBeGreaterThan(0);
        expect(step.body?.length).toBeGreaterThan(0);
      }
    }
  });
});
