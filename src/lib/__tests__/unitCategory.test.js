import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  UNIT_CATEGORIES,
  LISTING_PURPOSES,
  isUnitCategory,
  isStrCategory,
  unitCategoryLabel,
  usesNightlyPricing,
} from "@/lib/unitCategory.js";

// A-154 foundation — the child-space vocabulary contract plus the one wire
// Pillar 3 builds on. Zero visible change by design: the schema columns land
// via O-004 item 8 and the five pillars build in ACTIVE/A-154 order.
//
// (Rule 19: written first and watched failing — no unitCategory module and
// no p_unit_id passthrough assertion existed.)

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("A-154 — unit-category vocabulary", () => {
  it("holds exactly the four owner-decided identities", () => {
    expect([...UNIT_CATEGORIES]).toEqual([
      "residential_lease",
      "residential_sale",
      "str",
      "commercial_flex",
    ]);
  });

  it("accepts only the vocabulary, never a near-miss", () => {
    expect(isUnitCategory("str")).toBe(true);
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
    expect(isStrCategory(null)).toBe(false);
    expect(usesNightlyPricing("str")).toBe(true);
    for (const other of ["residential_lease", "residential_sale", "commercial_flex"]) {
      expect(usesNightlyPricing(other)).toBe(false);
    }
  });

  it("the migration mirrors the module vocabulary, null-able with no default", () => {
    const sql = read(
      "supabase/migrations/20260918000002_unit_category_listing_purpose.sql",
    );
    for (const category of UNIT_CATEGORIES) {
      expect(sql).toContain(`'${category}'`);
    }
    for (const purpose of LISTING_PURPOSES) {
      expect(sql).toContain(`'${purpose}'`);
    }
    expect(sql).not.toMatch(/default\s+'(str|residential_lease)/i);
    expect(sql).toContain("PREPARED, NOT APPLIED");
  });
});

describe("A-154 — p_unit_id passthrough is pinned before Pillar 3", () => {
  it("initiate hands the unit to the routing RPC instead of dropping it", () => {
    const src = read("src/app/api/deals/initiate/route.js");
    expect(src).toContain("p_unit_id: unitId || null");
  });
});
