import {
  inferProviderType,
  normalizeDashboardMode,
  normalizeDashboardModes,
  pickPrimaryRole,
  PRIMARY_ROLE_ORDER,
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

  // A-146: event-planner held a wallet row and a directory but no workspace.
  it("maps event-planner to the generic provider lens", () => {
    expect(normalizeDashboardMode("event-planner")).toBe("provider");
    expect(pickPrimaryRole(["event-planner"], "buyer")).toBe("provider");
  });

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

  // A-146: primary fallback was tags[0] — insertion order. It is now the
  // canonical precedence, independent of which lens was added first.
  it("picks the deterministic primary, not the first-held tag", () => {
    expect(PRIMARY_ROLE_ORDER).toEqual(["buyer", "owner", "broker", "provider"]);
    expect(pickPrimaryRole(["owner", "buyer"], "owner")).toBe("owner");
    expect(pickPrimaryRole(["owner", "buyer"], "provider")).toBe("buyer");
    expect(pickPrimaryRole(["provider", "broker"], "buyer")).toBe("broker");
    expect(pickPrimaryRole(["mc_enterprise"], "buyer")).toBe("mc_enterprise");
    expect(pickPrimaryRole([], "buyer")).toBe("");
  });
});
