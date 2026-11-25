import { describe, it, expect } from "vitest";
import { MARKET_ROLES } from "@/lib/communitySignalsAdapter";
import {
  defaultMarketRoleForLens,
  getAvailableStratosphereLenses,
  normalizeStratosphereLensId,
  resolveStratosphereDefaultLens,
} from "@/lib/stratosphereLenses";

describe("Stratosphere Role Lens Resolution", () => {
  it("normalizes aliases into canonical lens ids", () => {
    expect(normalizeStratosphereLensId("owner")).toBe("owner");
    expect(normalizeStratosphereLensId("tenant")).toBe("buyer");
    expect(normalizeStratosphereLensId("seeker")).toBe("buyer");
    expect(normalizeStratosphereLensId("salesperson")).toBe("broker");
    expect(normalizeStratosphereLensId("event-planner")).toBe("designer");
    expect(normalizeStratosphereLensId("photographer")).toBe("photographer");
    expect(normalizeStratosphereLensId("researcher")).toBe("researcher");
  });

  it("tightens default signal streams per role", () => {
    expect(defaultMarketRoleForLens("owner")).toBe(MARKET_ROLES.DEMAND);
    expect(defaultMarketRoleForLens("broker")).toBe(MARKET_ROLES.DEMAND);
    expect(defaultMarketRoleForLens("operator")).toBe(MARKET_ROLES.DEMAND);
    expect(defaultMarketRoleForLens("buyer")).toBe(MARKET_ROLES.SUPPLY);
    expect(defaultMarketRoleForLens("photographer")).toBe(MARKET_ROLES.INTEL);
    expect(defaultMarketRoleForLens("designer")).toBe(MARKET_ROLES.INTEL);
    expect(defaultMarketRoleForLens("researcher")).toBe(MARKET_ROLES.INTEL);
    expect(defaultMarketRoleForLens("all")).toBe(MARKET_ROLES.ALL);
  });

  it("defaults single-role accounts strictly to what that role needs", () => {
    expect(resolveStratosphereDefaultLens({ profile: { role: "owner" } })).toEqual({
      lensId: "owner",
      marketRole: MARKET_ROLES.DEMAND,
    });
    expect(resolveStratosphereDefaultLens({ profile: { role: "buyer" } })).toEqual({
      lensId: "buyer",
      marketRole: MARKET_ROLES.SUPPLY,
    });
    expect(resolveStratosphereDefaultLens({ profile: { role: "photographer" } })).toEqual({
      lensId: "photographer",
      marketRole: MARKET_ROLES.INTEL,
    });
    expect(resolveStratosphereDefaultLens({ profile: null })).toEqual({
      lensId: "all",
      marketRole: MARKET_ROLES.ALL,
    });
  });

  it("lists only held roles plus All for multi-role accounts and prioritizes URL -> persisted lens -> profile primary", () => {
    const multiProfile = {
      role: "buyer",
      primaryMode: "owner",
      activeRoles: ["buyer", "owner", "photographer"],
    };

    const lenses = getAvailableStratosphereLenses(multiProfile).map((l) => l.id);
    expect(lenses).toEqual(["owner", "buyer", "photographer", "all"]);

    expect(resolveStratosphereDefaultLens({ profile: multiProfile })).toEqual({
      lensId: "owner",
      marketRole: MARKET_ROLES.DEMAND,
    });

    expect(
      resolveStratosphereDefaultLens({ persistedRole: "photographer", profile: multiProfile })
    ).toEqual({
      lensId: "photographer",
      marketRole: MARKET_ROLES.INTEL,
    });

    expect(
      resolveStratosphereDefaultLens({ urlRole: "buyer", persistedRole: "photographer", profile: multiProfile })
    ).toEqual({
      lensId: "buyer",
      marketRole: MARKET_ROLES.SUPPLY,
    });

    // Unheld persisted role cannot override held primary role
    expect(
      resolveStratosphereDefaultLens({ persistedRole: "broker", profile: multiProfile })
    ).toEqual({
      lensId: "owner",
      marketRole: MARKET_ROLES.DEMAND,
    });

    // Switching to All Lens shows all signals
    expect(
      resolveStratosphereDefaultLens({ persistedRole: "all", profile: multiProfile })
    ).toEqual({
      lensId: "all",
      marketRole: MARKET_ROLES.ALL,
    });
  });
});
