// GAP-99: All non-terminal deal statuses that represent active obligations
export const OPEN_DEAL_STATUSES = new Set([
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
]);
export const OPEN_APPOINTMENT_STATUSES = new Set(["pending", "confirmed"]);

export function collectPropertyRemovalBlockers({ deals = [], appointments = [], units = [], disputes = [] } = {}) {
  const blockers = [];
  if (deals.some((deal) => OPEN_DEAL_STATUSES.has(String(deal.status || "").toLowerCase()))) {
    blockers.push("open_deal");
  }
  if (appointments.some((appointment) => OPEN_APPOINTMENT_STATUSES.has(String(appointment.status || "").toLowerCase()))) {
    blockers.push("active_appointment");
  }
  if (units.some((unit) => unit.operator_id)) {
    blockers.push("active_delegation");
  }
  if (disputes.some((dispute) => !["resolved", "closed", "dismissed"].includes(String(dispute.status || "").toLowerCase()))) {
    blockers.push("unresolved_dispute");
  }
  return blockers;
}

export function removalPreflightIsSafe(input) {
  return collectPropertyRemovalBlockers(input).length === 0;
}
