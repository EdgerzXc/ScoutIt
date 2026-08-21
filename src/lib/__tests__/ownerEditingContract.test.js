import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CATEGORIES, CATEGORY_FIELDS } from "../propertyEditorSchema";

const source = (relativeUrl) => readFileSync(new URL(relativeUrl, import.meta.url), "utf8");

describe("owner property editor contract", () => {
  it("uses one six-category schema with unique canonical field keys", () => {
    expect(CATEGORIES.map((category) => category.id)).toEqual([
      "residential",
      "commercial",
      "str",
      "hospitality",
      "restaurants",
      "venues",
    ]);

    for (const category of CATEGORIES) {
      const keys = CATEGORY_FIELDS[category.id].map((field) => field.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("keeps the restaurant editor on the canonical property keys", () => {
    const keys = CATEGORY_FIELDS.restaurants.map((field) => field.key);
    expect(keys).toEqual(expect.arrayContaining([
      "RST_Kitchen_Condition",
      "RST_Foot_Traffic",
      "RST_Frontage",
      "RST_Indoor_Outdoor",
      "RST_Previous_Use",
      "RST_Rent",
    ]));
    expect(keys).not.toEqual(expect.arrayContaining([
      "RST_Frontage_M",
      "RST_Outdoor_Seating",
      "RST_Rent_Per_Month",
    ]));
  });

  it("prevents the basic and advanced editors from forking the schema again", () => {
    for (const file of [
      "../../components/dashboard/LiveEditorWorkspace.js",
      "../../components/dashboard/DeepIntelligenceStudio.js",
    ]) {
      const editor = source(file);
      expect(editor).toContain('import { CATEGORIES, CATEGORY_FIELDS } from "../../lib/propertyEditorSchema";');
      expect(editor).not.toContain("const CATEGORY_FIELDS =");
    }
  });
});

describe("owner unit editor contract", () => {
  it("exposes every authored field consumed by the public Unit Master Page", () => {
    const drawer = source("../../components/dashboard/UnitDetailsDrawer.js");
    for (const key of [
      "unit_type",
      "capacity_seats",
      "differentiator",
      "fit_out_status",
      "operating_hours",
      "min_term",
      "deposit",
      "lease_inclusions",
      "house_rules",
      "floor_plan_2d_url",
      "floor_plan_3d_data",
      "matterport_url",
    ]) {
      expect(drawer).toContain(key);
    }
  });

  it("persists availability as a validated property_units column", () => {
    const api = source("../../app/api/dashboard/units/route.js");
    expect(api).toContain('availabilityStatus: z.enum(["available", "occupied", "coming_soon"])');
    expect(api).toContain('availability_status: u.availabilityStatus || "available"');
  });

  it("accepts API and live-preview aliases on the Unit Master Page", () => {
    const page = source("../../components/property/UnitMasterPage.js");
    expect(page).toContain("unit?.subdivision_scenarios ?? unit?.subdivisionScenarios");
    expect(page).toContain('unit.availability_status || unit.availabilityStatus || "available"');
    expect(page).toContain("unit.operator_display_name || unit.operatorDisplayName");
  });
});