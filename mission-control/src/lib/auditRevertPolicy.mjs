const DECISION_STATUS = {
  "verification.approve": "approved",
  "verification.reject": "rejected",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function verificationDecisionForRevert(event) {
  if (!event || event.target_table !== "verification_requests" ||
      !Object.hasOwn(DECISION_STATUS, event.action) ||
      !UUID.test(event.target_id || "") || !UUID.test(event.actor_id || "")) return null;
  const decidedAt = event.metadata?.decision_at;
  if (typeof decidedAt !== "string" || !Number.isFinite(Date.parse(decidedAt))) return null;
  return {
    id: event.target_id,
    reviewerId: event.actor_id,
    status: DECISION_STATUS[event.action],
    decidedAt,
  };
}
