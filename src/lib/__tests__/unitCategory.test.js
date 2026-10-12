import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  UNIT_CATEGORIES,
  LISTING_PURPOSES,
  UNIT_SECTORS,
  isUnitCategory,
  isStrCategory,
  unitCategoryLabel,
  usesNightlyPricing,
  getAdaptivePriceBands,
  matchesPropertyCategory,
} from "@/lib/unitCategory.js";

// A-154 foundation — the child-space vocabulary contract plus the one wire
// Pillar 3 builds on. Zero visible change by design: the schema columns land
// via O-004 item 8 and the five pillars build in ACTIVE/A-154 order.
//
// (Rule 19: written first and watched failing — no unitCategory module and
// no p_unit_id passthrough assertion existed.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-154 — unit-category vocabulary", () => {
  it("holds the expanded commercial and residential identities", () => {
    expect([...UNIT_CATEGORIES]).toEqual([
      "residential_lease",
      "residential_sale",
      "str",
      "commercial_flex",
      "fastfood",
      "restaurant",
      "cafe",
      "retail",
      "kiosk",
      "services",
      "entertainment",
    ]);
  });

  it("organizes identities into intuitive sectors", () => {
    expect(UNIT_SECTORS.food_and_dining.categories).toContain("fastfood");
    expect(UNIT_SECTORS.food_and_dining.categories).toContain("restaurant");
    expect(UNIT_SECTORS.retail_and_shopping.categories).toContain("retail");
    expect(UNIT_SECTORS.services_and_wellness.categories).toContain("services");
  });

  it("accepts only the vocabulary, never a near-miss", () => {
    expect(isUnitCategory("str")).toBe(true);
    expect(isUnitCategory("fastfood")).toBe(true);
    expect(isUnitCategory("STR")).toBe(false);
    expect(isUnitCategory("hotel")).toBe(false);
    expect(isUnitCategory(null)).toBe(false);
    expect(isUnitCategory(undefined)).toBe(false);
  });

  it("labels every identity and nothing else", () => {
    for (const category of UNIT_CATEGORIES) {
      expect(typeof unitCategoryLabel(category)).toBe("string");
    }
    expect(unitCategoryLabel("hotel")).toBeNull();
  });

  it("routes only STR to nightly pricing", () => {
    expect(isStrCategory("str")).toBe(true);
    // An always-true identity check would silently file every unit as STR.
    expect(isStrCategory("residential_lease")).toBe(false);
    expect(isStrCategory("fastfood")).toBe(false);
    expect(isStrCategory(null)).toBe(false);
    expect(usesNightlyPricing("str")).toBe(true);
    for (const other of ["residential_lease", "residential_sale", "commercial_flex", "fastfood", "restaurant", "cafe", "retail", "kiosk", "services", "entertainment"]) {
      expect(usesNightlyPricing(other)).toBe(false);
    }
  });

  it("the migration mirrors the module vocabulary, null-able with no default", () => {
    const baseSql = read(
      "supabase/migrations/20260918000002_unit_category_listing_purpose.sql",
    );
    const wideningSql = read(
      "supabase/migrations/20261012000001_expand_unit_categories.sql",
    );
    const combinedSql = `${baseSql}\n${wideningSql}`;
    for (const category of UNIT_CATEGORIES) {
      expect(combinedSql).toContain(`'${category}'`);
    }
    for (const purpose of LISTING_PURPOSES) {
      expect(baseSql).toContain(`'${purpose}'`);
    }
    expect(baseSql).not.toMatch(/default\s+'(str|residential_lease)/i);
  });
});

describe("A-154 — p_unit_id passthrough is pinned before Pillar 3", () => {
  it("initiate hands the unit to the routing RPC instead of dropping it", () => {
    const src = read("src/app/api/deals/initiate/route.js");
    expect(src).toContain("p_unit_id: unitId || null");
  });
});

describe("A-154 Pillar 5 — Adaptive price bands & multi-category discovery", () => {
  it("switches price bands based on sector selection", () => {
    const defaultBands = getAdaptivePriceBands([]);
    expect(defaultBands.map((b) => b.label)).toEqual(["Entry", "Mid", "Premium", "Trophy"]);

    const strBands = getAdaptivePriceBands(["STR"]);
    expect(strBands.map((b) => b.label)).toContain("Under ₱3,000 / night");
    expect(strBands[0].max).toBe(3000);

    const leaseBands = getAdaptivePriceBands(["Residential"]);
    expect(leaseBands.map((b) => b.label)).toContain("Under ₱50k / mo");
    expect(leaseBands[0].max).toBe(50000);
  });

  it("multi-category matcher resolves parent category, active offerings, or child unit category", () => {
    // 1. Direct parent SpaceCategory match
    const condo = { spaceCategory: "Residential", units_inventory: [] };
    expect(matchesPropertyCategory(condo, ["Residential"])).toBe(true);
    expect(matchesPropertyCategory(condo, ["Commercial"])).toBe(false);

    // 2. Child unit inventory match (Residential high-rise holding STR child unit)
    const hybridCondo = {
      spaceCategory: "Residential",
      units_inventory: [
        { id: "u-1", name: "Suite 101", unit_category: "residential_lease" },
        { id: "u-2", name: "Penthouse STR", unit_category: "str" },
      ],
    };
    expect(matchesPropertyCategory(hybridCondo, ["STR"])).toBe(true);
    expect(matchesPropertyCategory(hybridCondo, ["Residential"])).toBe(true);
    expect(matchesPropertyCategory(hybridCondo, ["Commercial"])).toBe(false);

    // 3. Active_Offerings multi-select match
    const multiOffering = {
      spaceCategory: "Commercial",
      active_offerings: ["Commercial", "Venues"],
      units_inventory: [],
    };
    expect(matchesPropertyCategory(multiOffering, ["Venues/Events"])).toBe(true);
    expect(matchesPropertyCategory(multiOffering, ["STR"])).toBe(false);

    // 4. Commercial mall holding Fast Food / Dining child unit
    const mallWithDining = {
      spaceCategory: "Commercial",
      units_inventory: [
        { id: "u-3", name: "Jollibee SM Marilao", unit_category: "fastfood" },
      ],
    };
    expect(matchesPropertyCategory(mallWithDining, ["Food & Dining"])).toBe(true);
    expect(matchesPropertyCategory(mallWithDining, ["Commercial"])).toBe(true);
    expect(matchesPropertyCategory(mallWithDining, ["STR"])).toBe(false);
  });
});

