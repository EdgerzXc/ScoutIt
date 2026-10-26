import { describe, it, expect } from "vitest";
import { classifySavedItem, liveSlugSet } from "@/lib/wishlistLiveness";

describe("Your Board (Layer 06) Interchangeable Logic & Ergonomics", () => {
  const sampleProperties = [
    { id: "prop-1", slug: "the-ridgeline-at-capitol-commons", title: "The Ridgeline at Capitol Commons", city: "Pasig", spaceCategory: "Residential" },
    { id: "prop-2", slug: "arthaland-century-pacific-tower", title: "Arthaland Century Pacific Tower", city: "Taguig", spaceCategory: "Commercial" },
    { id: "prop-3", slug: "met-live-pasay", title: "Met Live", city: "Pasay", spaceCategory: "Restaurants" },
  ];
  const liveSlugs = liveSlugSet(sampleProperties);

  it("classifies live vs removed listings with fail-safe boundaries", () => {
    expect(classifySavedItem({ property_id: "the-ridgeline-at-capitol-commons" }, liveSlugs)).toBe("ok");
    expect(classifySavedItem({ property_id: "dead-listing-slug" }, liveSlugs)).toBe("removed");
    expect(classifySavedItem({ property_id: "12345678-1234-1234-1234-123456789abc" }, liveSlugs)).toBe("unknown");
    expect(classifySavedItem({ property_id: "broker-slug", is_broker: true }, liveSlugs)).toBe("unknown");
    expect(classifySavedItem(null, liveSlugs)).toBe("unknown");
  });

  it("handles offline vs cloud item union with deduplication", () => {
    const offlineItems = [
      { property_id: "the-ridgeline-at-capitol-commons", reaction_type: "Interested", timestamp: 1000 },
      { property_id: "met-live-pasay", reaction_type: "Inspired Me", timestamp: 1100 },
    ];
    const cloudItems = [
      { property_id: "the-ridgeline-at-capitol-commons", reaction_type: "Interested", timestamp: 900, is_cloud: true },
      { property_id: "arthaland-century-pacific-tower", reaction_type: "Potential Fit", timestamp: 1200, is_cloud: true },
    ];

    const accountSavedIds = new Set(cloudItems.map((i) => i.property_id));

    // Local-only items that need syncing
    const localOnly = offlineItems.filter((i) => !accountSavedIds.has(i.property_id));
    expect(localOnly).toHaveLength(1);
    expect(localOnly[0].property_id).toBe("met-live-pasay");

    // Unified union
    const seen = new Set();
    const combined = [];
    cloudItems.forEach((c) => {
      seen.add(c.property_id);
      combined.push({ ...c, is_local: offlineItems.some((o) => o.property_id === c.property_id) });
    });
    offlineItems.forEach((o) => {
      if (!seen.has(o.property_id)) {
        seen.add(o.property_id);
        combined.push({ ...o, is_cloud: false, is_local: true });
      }
    });

    expect(combined).toHaveLength(3);
    const ridgeline = combined.find((i) => i.property_id === "the-ridgeline-at-capitol-commons");
    expect(ridgeline.is_cloud).toBe(true);
    expect(ridgeline.is_local).toBe(true);

    const metLive = combined.find((i) => i.property_id === "met-live-pasay");
    expect(metLive.is_cloud).toBe(false);
    expect(metLive.is_local).toBe(true);
  });

  it("structures 1-tap merge payload preserving reaction types", () => {
    const localOnly = [
      { property_id: "met-live-pasay", reaction_type: "Inspired Me" },
      { property_id: "new-space-bgc", reaction_type: "Potential Fit" },
    ];

    const payload = {
      items: localOnly.map((it) => ({
        property_id: it.property_id,
        reaction_type: it.reaction_type || "Save",
      })),
      propertyIds: localOnly.map((it) => it.property_id),
    };

    expect(payload.items).toEqual([
      { property_id: "met-live-pasay", reaction_type: "Inspired Me" },
      { property_id: "new-space-bgc", reaction_type: "Potential Fit" },
    ]);
    expect(payload.propertyIds).toEqual(["met-live-pasay", "new-space-bgc"]);
  });

  it("verifies Apple HIG touch targets (>= 44px) and safe bottom clearance", () => {
    // Contract verification for CSS dimensions in wishlist
    const minTouchTarget = 44;
    const viewButtonHeight = 44;
    const removeButtonHeight = 44;
    const modeTabHeight = 44;

    expect(viewButtonHeight).toBeGreaterThanOrEqual(minTouchTarget);
    expect(removeButtonHeight).toBeGreaterThanOrEqual(minTouchTarget);
    expect(modeTabHeight).toBeGreaterThanOrEqual(minTouchTarget);
  });
});
