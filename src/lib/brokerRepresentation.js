export const REPRESENTATION_STATES = Object.freeze({
  PENDING: "pending",
  ACTIVE: "active",
  LOCKED: "locked",
  SUSPENDED: "suspended",
  UNAVAILABLE: "unavailable",
  ENDED: "ended",
  DECLINED: "declined",
});

export const REPRESENTATION_STATE_VALUES = new Set(Object.values(REPRESENTATION_STATES));

export function isActiveRosterBroker(representation = {}) {
  return representation.status === REPRESENTATION_STATES.ACTIVE &&
    representation.visible_to_public === true &&
    representation.contactable === true &&
    representation.account_eligible === true &&
    representation.inventory_eligible === true &&
    !representation.locked_at &&
    !representation.suspended_at &&
    !representation.unavailable_at &&
    !representation.ended_at;
}

export function sortRoster(representations = []) {
  return [...representations].sort((a, b) => {
    const priority = Number(b.priority || 0) - Number(a.priority || 0);
    if (priority) return priority;
    const accepted = String(a.accepted_at || "").localeCompare(String(b.accepted_at || ""));
    if (accepted) return accepted;
    const created = String(a.created_at || "").localeCompare(String(b.created_at || ""));
    if (created) return created;
    return String(a.id || "").localeCompare(String(b.id || ""));
  });
}

export function getActiveRoster(representations = [], preferredBrokerId = null) {
  const active = sortRoster(representations.filter(isActiveRosterBroker));
  if (!preferredBrokerId) return active;
  return active.filter((representation) => representation.broker_id === preferredBrokerId);
}

export function buildLeadRouting({ propertyOwnerId, representations = [], preferredBrokerId = null } = {}) {
  const roster = getActiveRoster(representations, preferredBrokerId);
  if (preferredBrokerId && roster.length === 0) {
    return { ok: false, reason: "broker_not_contactable", recipients: [], roster: [] };
  }
  if (roster.length > 0) {
    return {
      ok: true,
      routedToRoster: true,
      roster,
      recipients: roster.map((representation) => ({
        recipientId: representation.broker_id,
        recipientType: "broker",
        representationId: representation.id,
      })),
    };
  }
  return {
    ok: Boolean(propertyOwnerId),
    routedToRoster: false,
    roster: [],
    recipients: propertyOwnerId ? [{ recipientId: propertyOwnerId, recipientType: "owner", representationId: null }] : [],
  };
}

export function recipientIds(routing = {}) {
  return (routing.recipients || []).map((recipient) => recipient.recipientId);
}

export function representationStatusUpdate({ status, now = new Date().toISOString() } = {}) {
  if (!REPRESENTATION_STATE_VALUES.has(status)) throw new Error("Invalid representation state");
  const update = { status, updated_at: now };
  if (status === REPRESENTATION_STATES.ACTIVE) {
    update.accepted_at = now;
    update.starts_at = now;
    update.ended_at = null;
    update.locked_at = null;
    update.suspended_at = null;
    update.unavailable_at = null;
  }
  if (status === REPRESENTATION_STATES.LOCKED) update.locked_at = now;
  if (status === REPRESENTATION_STATES.SUSPENDED) update.suspended_at = now;
  if (status === REPRESENTATION_STATES.UNAVAILABLE) update.unavailable_at = now;
  if (status === REPRESENTATION_STATES.ENDED || status === REPRESENTATION_STATES.DECLINED) update.ended_at = now;
  return update;
}

export function routingFailureStatus(reason) {
  return reason === "broker_not_contactable" ? 409 : 503;
}
