import { describe, it, expect } from "vitest";
import {
  SIGNAL_TYPES,
  resolvePipelineDistrict,
  pipelineArticleToSignal,
  pipelineArticlesToSignals,
  generateBeaconGeoJSON,
} from "../communitySignalsAdapter";
import { getSignals } from "../../data/mock/mockArticles";

const noon = (y, m, d) => new Date(y, m - 1, d, 12, 0, 0);
const iso = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const BASE = {
  slug: "test-tower",
  title: "Test Tower",
  category: "Commercial",
  city: "Ortigas Center",
  lat: 14.5865,
  lng: 121.0637,
  lifecycle: "construction",
  date: "September 2026",
  excerpt: "Thin shell.",
  sourceName: "Registry",
  sourceUrl: "https://example.test/registry",
  isSample: true,
};

describe("pipeline bridge — district resolution", () => {
  it("matches exact keys, prefixes, and longest substrings", () => {
    expect(resolvePipelineDistrict({ city: "Ortigas Center" })).toBe("Ortigas Center");
    expect(resolvePipelineDistrict({ city: "BGC, Taguig" })).toBe("BGC");
    expect(resolvePipelineDistrict({ city: "Bridgetowne, Quezon City" })).toBe("Quezon City");
  });

  it("returns null instead of guessing", () => {
    expect(resolvePipelineDistrict({ city: "Nowhere, Atlantis" })).toBe(null);
    expect(resolvePipelineDistrict({})).toBe(null);
    expect(resolvePipelineDistrict(null)).toBe(null);
  });
});

describe("pipeline bridge — signal mapping", () => {
  it("projects a pipeline article into community-signal shape", () => {
    const s = pipelineArticleToSignal(BASE, noon(2026, 9, 22));
    expect(s.id).toBe("pipeline-test-tower");
    expect(s.signalType).toBe(SIGNAL_TYPES.UPCOMING_SUPPLY);
    expect(s.district).toBe("Ortigas Center");
    expect(s.coords).toEqual({ lat: 14.5865, lng: 121.0637 });
    expect(s.timing).toBe("Timeline TBC");
    expect(s.actionType).toBe("EXPLORE_DATA");
    expect(s.glyphType).toBe("pulse");
    expect(s.isSample).toBe(true);
    expect(s.pipelineLifecycle).toBe("UNDER CONSTRUCTION");
    // dossier-card hard requirements (unconditional reads)
    expect(typeof s.district).toBe("string");
    expect(typeof s.freshness).toBe("string");
    expect(typeof s.author.scoutId).toBe("string");
  });

  it("carries the opening-today timing through", () => {
    const s = pipelineArticleToSignal(
      { ...BASE, openingDate: iso(2026, 9, 22) },
      noon(2026, 9, 22)
    );
    expect(s.timing).toBe("Opens today");
    expect(s.freshness).toBe("fresh");
  });

  it("marks undated shells aging, never fresh", () => {
    const s = pipelineArticleToSignal(
      { ...BASE, date: undefined },
      noon(2026, 9, 22)
    );
    expect(s.freshness).toBe("aging");
  });

  it("skips non-pipeline articles without inventing anything", () => {
    expect(pipelineArticleToSignal({ slug: "x", title: "X" }, noon(2026, 9, 22))).toBe(null);
    expect(pipelineArticleToSignal(null, noon(2026, 9, 22))).toBe(null);
  });

  it("keeps unpinned updates in the dossier without inventing a map pin", () => {
    const unknown = pipelineArticleToSignal({ ...BASE, city: "Atlantis" }, noon(2026, 9, 22));
    const unlocated = pipelineArticleToSignal({ ...BASE, lat: "far" }, noon(2026, 9, 22));
    expect(unknown.district).toBe("Atlantis");
    expect(unknown.coords).toBe(null);
    expect(unlocated.coords).toBe(null);
    expect(generateBeaconGeoJSON([unknown, unlocated], new Set([unknown.id, unlocated.id])).beacons.features).toHaveLength(0);
    expect(pipelineArticleToSignal({ ...BASE, slug: "" }, noon(2026, 9, 22))).toBe(null);
  });

  it("never invents money, specs, budgets, or authors", () => {
    const s = pipelineArticleToSignal(BASE, noon(2026, 9, 22));
    expect(s.budget).toBeUndefined();
    expect(s.specs).toBeUndefined();
    expect(s.author.name).toBeUndefined();
    expect(JSON.stringify(s)).not.toMatch(/[₱$€£¥]|\bPHP\b|\bUSD\b/);
  });
});

describe("pipeline bridge — beacon generation", () => {
  it("bridged pipeline articles become emerald map beacons", () => {
    const bridged = pipelineArticlesToSignals(getSignals(), noon(2026, 9, 22));
    expect(bridged.length).toBeGreaterThanOrEqual(3);
    const ids = bridged.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const geo = generateBeaconGeoJSON(bridged, new Set(ids));
    expect(geo.beacons.features.length).toBe(bridged.filter((signal) => signal.coords).length);
    expect(bridged.some((signal) => !signal.coords)).toBe(true);
    for (const f of geo.beacons.features) {
      expect(f.properties.color).toBe("#10b981");
      expect(f.properties.signalTypeLabel).toBe("Upcoming Supply");
    }
  });

  it("pipeline ids cannot collide with community ids", () => {
    const bridged = pipelineArticlesToSignals(getSignals(), noon(2026, 9, 22));
    for (const s of bridged) {
      expect(s.id.startsWith("pipeline-")).toBe(true);
    }
  });
});
