import {
  inferProviderType,
  normalizeDashboardMode,
  normalizeDashboardModes,
  pickPrimaryRole,
  PRIMARY_ROLE_ORDER,
} from "../dashboardModes";
import { deriveMyRole, describeDealIntent } from "../deals/userDeals";

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
  // A-223: maps event-planner and event_planner to designer HUD.
  it("maps event-planner to the generic provider lens and designer HUD", () => {
    expect(normalizeDashboardMode("event-planner")).toBe("provider");
    expect(pickPrimaryRole(["event-planner"], "buyer")).toBe("provider");
    expect(inferProviderType("event-planner")).toBe("designer");
    expect(inferProviderType("event_planner")).toBe("designer");
    expect(inferProviderType("designer")).toBe("designer");
    expect(inferProviderType("designer", "photographer")).toBe("designer");
    expect(inferProviderType("photographer", "designer")).toBe("photographer");
    expect(inferProviderType("provider", "photographer")).toBe("photographer");
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

  it("distinguishes Property Owner inquiries from Layer 4 Photographer inquiries for the same multi-role user", () => {
    const propertyRow = {
      id: "deal-prop-1",
      property_id: "prop-1",
      seeker_id: "seeker-a",
      broker_id: "user-multi",
      properties: { id: "prop-1", title: "Ayala Triangle Penthouse", owner_id: "user-multi" },
      pitch_message: "We would like to lease this penthouse.",
    };
    const myOwnerRole = deriveMyRole(propertyRow, "user-multi");
    expect(myOwnerRole).toBe("owner");
    const ownerIntent = describeDealIntent(propertyRow, myOwnerRole);
    expect(ownerIntent.intentBadge).toBe("FOR OWNER · PROPERTY INQUIRY");
    expect(ownerIntent.intentSummary).toContain("Wants Property: Ayala Triangle Penthouse (For Owner)");

    const photographerRow = {
      id: "deal-photo-2",
      property_id: "prop-1",
      seeker_id: "client-b",
      broker_id: "user-multi",
      properties: { id: "prop-1", title: "Ayala Triangle Penthouse", owner_id: "user-multi" },
      routing_snapshot: {
        target_role: "photographer",
        source_layer: "layer_4_professionals",
        service_title: "Ayala Triangle Penthouse",
      },
      pitch_message: "[LAYER 4 · PHOTOGRAPHER] Need twilight drone shoot.",
    };
    const myPhotographerRole = deriveMyRole(photographerRow, "user-multi");
    expect(myPhotographerRole).toBe("photographer");
    const photoIntent = describeDealIntent(photographerRow, myPhotographerRole);
    expect(photoIntent.intentBadge).toBe("NEEDS PHOTOGRAPHER · LAYER 4");
    expect(photoIntent.intentSummary).toContain("Needs Spatial Photographer");
  });
});
