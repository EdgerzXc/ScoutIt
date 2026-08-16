import { describe, it, expect } from "vitest";
import { assessGeocode, GEO_PRECISION, describeGeoFlag } from "@/lib/geocodeConfidence";

// The point of this module is to stop a district centroid being published as if
// it were a building. These cases are shaped from real Mapbox responses.
const feature = (place_type, relevance, center = [121.05, 14.55]) => ({
  center,
  place_type: [place_type],
  relevance,
  place_name: "somewhere, Philippines",
});

describe("assessGeocode", () => {
  it("trusts a building-level match", () => {
    const g = assessGeocode(feature("address", 1), "123 Real Street, Makati");
    expect(g.precision).toBe(GEO_PRECISION.EXACT);
    expect(g.uncertain).toBe(false);
    expect(g.lat).toBe(14.55);
    expect(g.lng).toBe(121.05);
  });

  it("flags a city match even at perfect relevance", () => {
    // The trap this exists for: "Makati" matches the city of Makati with
    // relevance 1.0 — a flawless match to a coordinate that is not the property.
    const g = assessGeocode(feature("place", 1), "Makati");
    expect(g.precision).toBe(GEO_PRECISION.COARSE);
    expect(g.uncertain).toBe(true);
    expect(g.reason).toMatch(/centre of an area/i);
  });

  it("flags a region match", () => {
    expect(assessGeocode(feature("region", 1), "NCR").uncertain).toBe(true);
  });

  it("flags a weak match even at address level", () => {
    const g = assessGeocode(feature("address", 0.5), "somewhere vague");
    expect(g.uncertain).toBe(true);
    expect(g.reason).toMatch(/weak match/i);
  });

  it("flags a neighbourhood as approximate rather than exact", () => {
    const g = assessGeocode(feature("neighborhood", 1), "BGC, Taguig");
    expect(g.precision).toBe(GEO_PRECISION.APPROXIMATE);
    expect(g.uncertain).toBe(true);
  });

  it("returns no position when the geocoder found nothing", () => {
    const g = assessGeocode(null, "asdfghjkl");
    expect(g.lat).toBeNull();
    expect(g.lng).toBeNull();
    expect(g.precision).toBe(GEO_PRECISION.NONE);
    expect(g.uncertain).toBe(true);
  });

  it("rejects a feature whose centre is not numeric", () => {
    const g = assessGeocode({ center: ["x", "y"], place_type: ["address"], relevance: 1 });
    expect(g.lat).toBeNull();
    expect(g.uncertain).toBe(true);
  });

  it("records the query and a timestamp so a human can audit the decision", () => {
    const g = assessGeocode(feature("address", 1), "123 Real Street");
    expect(g.query).toBe("123 Real Street");
    expect(Number.isNaN(Date.parse(g.at))).toBe(false);
  });
});

describe("describeGeoFlag", () => {
  it("reads plainly for staff", () => {
    expect(describeGeoFlag(null)).toMatch(/never geocoded/i);
    expect(describeGeoFlag(assessGeocode(feature("address", 1)))).toMatch(/verified/i);
    expect(describeGeoFlag(assessGeocode(feature("place", 1)))).toMatch(/centre of an area/i);
  });
});
