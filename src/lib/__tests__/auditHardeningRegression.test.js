import fs from "node:fs";
import { describe, expect, it } from "vitest";
import {
  directorySecondaryCollapsed,
  discoverSecondaryCollapsed,
  unitSecondaryCollapsed,
} from "@/lib/simpleModeSurfaces";

const read = (p) => fs.readFileSync(p, "utf8");

describe("Sprint 3-5 Audit Hardening & Simple Mode Regression Contracts", () => {
  it("keeps Pro Mode completely expanded and collapses Simple Mode secondary blocks until opened", () => {
    for (const helper of [
      directorySecondaryCollapsed,
      discoverSecondaryCollapsed,
      unitSecondaryCollapsed,
    ]) {
      expect(helper(false, false)).toBe(false);
      expect(helper(false, true)).toBe(false);
      expect(helper(true, false)).toBe(true);
      expect(helper(true, true)).toBe(false);
    }
  });

  it("returns resolved canonical slug metadata from /api/dashboard/publish", () => {
    const publishRoute = read("src/app/api/dashboard/publish/route.js");
    expect(publishRoute).toContain("slug:");
    expect(publishRoute).toContain("canonicalSlug:");
    expect(publishRoute).toContain("let finalSlug =");
  });

  it("sends authenticated Bearer headers from owner/seeker workspace modals and hubs", () => {
    const files = [
      "src/components/dashboard/PropertyUpdateHub.js",
      "src/components/dashboard/SpatialStudioRequestModal.js",
      "src/components/property/SpatialStudioRevisionModal.js",
      "src/components/dashboard/ResidentPassportCard.js",
      "src/components/property/PromoteModal.js",
    ];
    for (const file of files) {
      const source = read(file);
      expect(source).toContain("getSession");
      expect(source).toContain("Authorization");
    }
  });

  it("omits fabricated confidence score bars from /intel", () => {
    const intel = read("src/app/intel/page.js");
    expect(intel).not.toContain("92% SECURE");
    expect(intel).not.toContain("Briefing Integrity Deep Scan");
  });

  it("uses shared Haversine geo maths in the spatial transit lens without importing @turf/turf", () => {
    const transitLens = read("src/components/maps/lenses/transit.js");
    expect(transitLens).not.toContain("@turf/turf");
    expect(transitLens).toContain('from "@/lib/geo"');
    expect(transitLens).toContain("distanceKm(");
  });

  it("eliminates framer-motion runtime imports from AttentionRail and DeckPanel", () => {
    for (const file of [
      "src/components/dashboard/AttentionRail.js",
      "src/components/dashboard/DeckPanel.js",
    ]) {
      expect(read(file)).not.toMatch(/from\s+["']framer-motion["']/);
    }
  });
});
