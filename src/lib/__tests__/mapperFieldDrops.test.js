import { describe, it, expect } from "vitest";
import { reverseMapCategoryFields } from "../propertyFieldMapping";

// A-146 (B3): three owner-typed restaurant facts never reached Airtable, and
// comma-formatted numbers silently became null.

describe("A-146 — restaurant editor keys reach the mapper", () => {
  it("aliases RST_Frontage / RST_Rent / RST_Indoor_Outdoor", () => {
    const map = reverseMapCategoryFields({
      RST_Frontage: "12 m",
      RST_Rent: "50,000",
      RST_Indoor_Outdoor: "Both",
    });
    expect(map.RST_Frontage).toBe("12 m");
    expect(map.RST_Rent).toBe(50000);
    expect(map.Indoor_Outdoor).toBe("Both");
  });

  it("existing camelCase writers keep precedence over aliases", () => {
    const map = reverseMapCategoryFields({ RST_Frontage: "12 m", frontage: "15 m" });
    expect(map.RST_Frontage).toBe("15 m");
  });
});

describe("A-146 — comma-safe numerics never silently null", () => {
  it("parses comma-formatted owner input", () => {
    const map = reverseMapCategoryFields({
      totalGLA: "25,000",
      price: "1,200,000",
      nightlyRate: "3,500",
    });
    expect(map.CM_Total_GLA).toBe(25000);
    expect(map.RS_Price).toBe(1200000);
    expect(map.STR_Nightly_Rate).toBe(3500);
  });

  it("keeps plain numbers and blanks behaving as before", () => {
    const map = reverseMapCategoryFields({ totalGLA: 25000, price: "", bedrooms: 0 });
    expect(map.CM_Total_GLA).toBe(25000);
    // "" and 0 were null before (Number("")||null, Number(0)||null) — unchanged.
    expect(map.RS_Price).toBeNull();
    expect(map.Beds).toBeNull();
  });

  it("passes Listed_Price through untouched (deliberate raw passthrough)", () => {
    const map = reverseMapCategoryFields({ listedPrice: "Upon Request" });
    expect(map.Listed_Price).toBe("Upon Request");
  });
});

describe("A-146 — ambiguous keys scope to a known category", () => {
  it("commercial capRate writes CM only, hospitality writes HOSP only", () => {
    const commercial = reverseMapCategoryFields({ capRate: "8.5" }, "commercial");
    expect(commercial.CM_Cap_Rate).toBe(8.5);
    expect(commercial.HOSP_Cap_Rate).toBeUndefined();

    const hospitality = reverseMapCategoryFields({ capRate: "8.5" }, "Hospitality");
    expect(hospitality.HOSP_Cap_Rate).toBe(8.5);
    expect(hospitality.CM_Cap_Rate).toBeUndefined();
  });

  it("power scopes to restaurants vs venues", () => {
    expect(reverseMapCategoryFields({ power: "3-phase" }, "restaurants").RST_Power_Capacity).toBe("3-phase");
    expect(reverseMapCategoryFields({ power: "3-phase" }, "restaurants").VEN_Power_Capacity).toBeUndefined();
    expect(reverseMapCategoryFields({ power: "3-phase" }, "Venues/Events").VEN_Power_Capacity).toBe("3-phase");
    expect(reverseMapCategoryFields({ power: "3-phase" }, "Venues/Events").RST_Power_Capacity).toBeUndefined();
  });

  it("unknown or absent category keeps the legacy both-write", () => {
    for (const category of [undefined, null, "starship"]) {
      const map = reverseMapCategoryFields({ capRate: "8.5", power: "3-phase" }, category);
      expect(map.CM_Cap_Rate).toBe(8.5);
      expect(map.HOSP_Cap_Rate).toBe(8.5);
      expect(map.RST_Power_Capacity).toBe("3-phase");
      expect(map.VEN_Power_Capacity).toBe("3-phase");
    }
  });
});
