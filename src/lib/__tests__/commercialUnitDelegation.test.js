import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { UNIT_CATEGORIES, unitCategoryLabel, matchesPropertyCategory } from "../unitCategory";

const read = (p) => readFileSync(join(process.cwd(), p), "utf8");

describe("Commercial Unit Operators & Tenant Ecosystem Contract", () => {
  it("expands UNIT_CATEGORIES with food & commercial business sectors", () => {
    expect(UNIT_CATEGORIES).toContain("fastfood");
    expect(UNIT_CATEGORIES).toContain("restaurant");
    expect(UNIT_CATEGORIES).toContain("cafe");
    expect(UNIT_CATEGORIES).toContain("retail");
    expect(UNIT_CATEGORIES).toContain("kiosk");
    expect(UNIT_CATEGORIES).toContain("services");
    expect(UNIT_CATEGORIES).toContain("entertainment");

    expect(unitCategoryLabel("fastfood")).toBe("Fast Food / Quick Service");
    expect(unitCategoryLabel("restaurant")).toBe("Restaurant / Dining");
    expect(unitCategoryLabel("retail")).toBe("Retail Store");
  });

  it("matches commercial units against Commercial property types", () => {
    const propWithUnit = {
      spaceCategory: "Mixed Use",
      units_inventory: [{ unit_category: "fastfood" }],
    };
    expect(matchesPropertyCategory(propWithUnit, ["Commercial"])).toBe(true);
    expect(matchesPropertyCategory({ spaceCategory: "Commercial" }, ["Commercial"])).toBe(true);
  });

  it("OperatorRequestModal supports unit-targeted applications", () => {
    const src = read("src/components/property/OperatorRequestModal.js");
    expect(src).toContain("unitId = null");
    expect(src).toContain("unitName = null");
    expect(src).toContain("unitId: unitId || undefined");
    expect(src).toContain("Operate ${unitName}");
    expect(src).toContain("Apply to the owner or management");
  });

  it("UnitMasterPage wires operator hotline and operator application actions", () => {
    const src = read("src/components/property/UnitMasterPage.js");
    expect(src).toContain("Call Operator Hotline");
    expect(src).toContain("Apply to Operate This Space");
    expect(src).toContain("<DirectCallModal");
    expect(src).toContain("<OperatorRequestModal");
    expect(src).toContain("setIsCallModalOpen");
    expect(src).toContain("setIsOperatorRequestOpen");
  });

  it("DirectCallModal implements in-browser audio connect with unanswered fallback", () => {
    const src = read("src/components/property/DirectCallModal.js");
    expect(src).toContain("useModalDialog");
    expect(src).toContain("AudioContext");
    expect(src).toContain("unanswered");
    expect(src).toContain("Leave Priority Message");
    expect(src).toContain("onLeaveMessage");
  });

  it("delegate route GET and POST handle unit-specific operator requests", () => {
    const src = read("src/app/api/dashboard/units/delegate/route.js");
    // GET checks for both unassigned units and operator_request CRM activities
    expect(src).toContain("operator_request");
    expect(src).toContain("requestedUnitId");
    expect(src).toContain("requestedUnitName");

    // POST checks resolution via status and supports default unitId from request
    expect(src).toContain("deal.status !== \"pending\" && deal.status !== \"connected\"");
    expect(src).toContain("effectiveUnitIds");
  });

  it("OperatorMode connects to Operations Inbox and informs commercial operators", () => {
    const src = read("src/components/dashboard/OperatorMode.js");
    expect(src).toContain("/dashboard/inbox");
    expect(src).toContain("Branch Operations Center");
    expect(src).toContain("Apply to Operate This Space");
  });
});
