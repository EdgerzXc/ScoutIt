import { collectPropertyRemovalBlockers, removalPreflightIsSafe } from "../propertyRemoval";

describe("retained property removal preflight", () => {
  it("blocks open deals, active appointments, delegations, and unresolved disputes", () => {
    expect(collectPropertyRemovalBlockers({
      deals: [{ status: "connected" }],
      appointments: [{ status: "confirmed" }],
      units: [{ operator_id: "operator-1" }],
      disputes: [{ status: "investigating" }],
    })).toEqual(["open_deal", "active_appointment", "active_delegation", "unresolved_dispute"]);
  });

  it("allows retained removal when only historical/closed records remain", () => {
    expect(removalPreflightIsSafe({
      deals: [{ status: "closed" }],
      appointments: [{ status: "cancelled" }],
      units: [{ operator_id: null }],
      disputes: [{ status: "resolved" }],
    })).toBe(true);
  });
});
