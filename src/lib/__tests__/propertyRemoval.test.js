import { collectPropertyRemovalBlockers, removalPreflightIsSafe, OPEN_DEAL_STATUSES } from "../propertyRemoval";

describe("retained property removal preflight", () => {
  it("blocks open deals, active appointments, delegations, and unresolved disputes", () => {
    expect(collectPropertyRemovalBlockers({
      deals: [{ status: "connected" }],
      appointments: [{ status: "confirmed" }],
      units: [{ operator_id: "operator-1" }],
      disputes: [{ status: "investigating" }],
    })).toEqual(["open_deal", "active_appointment", "active_delegation", "unresolved_dispute"]);
  });

  it("blocks removal across all non-terminal deal statuses (GAP-99)", () => {
    const statuses = [
      "pending",
      "pitching",
      "connected",
      "active",
      "accepted",
      "inbound",
      "invited",
      "reviewing",
      "viewing_scheduled",
      "touring",
      "awaiting_response",
    ];
    for (const status of statuses) {
      expect(OPEN_DEAL_STATUSES.has(status)).toBe(true);
      expect(collectPropertyRemovalBlockers({ deals: [{ status }] })).toEqual(["open_deal"]);
    }
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
