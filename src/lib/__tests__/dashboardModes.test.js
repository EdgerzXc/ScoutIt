import {
  inferProviderType,
  normalizeDashboardMode,
  normalizeDashboardModes,
} from "../dashboardModes";

describe("dashboard mode normalization", () => {
  it("treats the database seeker value and buyer UI name as one role", () => {
    expect(normalizeDashboardMode("seeker")).toBe("buyer");
    expect(normalizeDashboardMode("buyer")).toBe("buyer");
    expect(normalizeDashboardModes(["seeker", "buyer"], "seeker")).toEqual(["buyer"]);
  });

  it.each(["photographer", "researcher", "designer"])(
    "maps provider subtype %s to provider mode and preserves its subtype",
    (role) => {
      expect(normalizeDashboardMode(role)).toBe("provider");
      expect(inferProviderType(role)).toBe(role);
    },
  );

  it("deduplicates mixed legacy and UI role names", () => {
    expect(normalizeDashboardModes(["seeker", "buyer", "owner"], "seeker"))
      .toEqual(["buyer", "owner"]);
  });
  it("preserves persisted console preview modes during profile hydration", () => {
    expect(normalizeDashboardMode("mc_staff")).toBe("mc_staff");
    expect(normalizeDashboardMode("mc_enterprise")).toBe("mc_enterprise");
    expect(normalizeDashboardModes(["owner", "mc_enterprise"], "owner"))
      .toEqual(["owner", "mc_enterprise"]);
  });


  it("rejects missing and unrecognized modes instead of rendering Unknown Mode", () => {
    expect(normalizeDashboardMode("superuser")).toBe("");
    expect(normalizeDashboardModes([], "superuser")).toEqual([]);
  });
});
