// ═══════════════════════════════════════════════════════════════
// A-145 P2a — Staff moderation policy for Stratosphere Community Signals.
//
// Pure, deterministic transitions:
// - live ↔ limited
// - live → under_review
// - under_review → live | needs_edit | removed
// - removed → live (restore)
//
// Crucial invariant: never writes 'closed' or 'expired'.
// - 'closed' is strictly author-owned (author chooses "Close My Signal").
// - 'expired' is lifecycle-owned (30-day freshness decay).
//
// Destructive / restrictive actions ('remove', 'limit', 'request_edit')
// strictly require an explicit non-empty staff reason.
// ═══════════════════════════════════════════════════════════════

export const SIGNAL_STATUSES = Object.freeze({
  LIVE: "live",
  NEEDS_EDIT: "needs_edit",
  LIMITED: "limited",
  UNDER_REVIEW: "under_review",
  REMOVED: "removed",
  CLOSED: "closed",
  EXPIRED: "expired",
});

export const MODERATION_ACTIONS = Object.freeze({
  RESTORE_LIVE: "restore_live",
  HOLD_FOR_REVIEW: "review",
  LIMIT: "limit",
  REQUEST_EDIT: "request_edit",
  REMOVE: "remove",
});

/** Maps a moderation action to the target stratosphere_signals.status. */
export function targetStatusForAction(action) {
  switch (action) {
    case MODERATION_ACTIONS.RESTORE_LIVE:
      return SIGNAL_STATUSES.LIVE;
    case MODERATION_ACTIONS.HOLD_FOR_REVIEW:
      return SIGNAL_STATUSES.UNDER_REVIEW;
    case MODERATION_ACTIONS.LIMIT:
      return SIGNAL_STATUSES.LIMITED;
    case MODERATION_ACTIONS.REQUEST_EDIT:
      return SIGNAL_STATUSES.NEEDS_EDIT;
    case MODERATION_ACTIONS.REMOVE:
      return SIGNAL_STATUSES.REMOVED;
    default:
      return null;
  }
}

/** Whether a non-empty explanation is required from the operator. */
export function isReasonRequired(action) {
  return (
    action === MODERATION_ACTIONS.REMOVE ||
    action === MODERATION_ACTIONS.LIMIT ||
    action === MODERATION_ACTIONS.REQUEST_EDIT
  );
}

/** Map of current status to set of allowed actions. */
const ALLOWED_TRANSITIONS = Object.freeze({
  [SIGNAL_STATUSES.LIVE]: Object.freeze([
    MODERATION_ACTIONS.HOLD_FOR_REVIEW,
    MODERATION_ACTIONS.LIMIT,
    MODERATION_ACTIONS.REMOVE,
  ]),
  [SIGNAL_STATUSES.LIMITED]: Object.freeze([
    MODERATION_ACTIONS.RESTORE_LIVE,
    MODERATION_ACTIONS.HOLD_FOR_REVIEW,
    MODERATION_ACTIONS.REMOVE,
  ]),
  [SIGNAL_STATUSES.UNDER_REVIEW]: Object.freeze([
    MODERATION_ACTIONS.RESTORE_LIVE,
    MODERATION_ACTIONS.REQUEST_EDIT,
    MODERATION_ACTIONS.REMOVE,
  ]),
  [SIGNAL_STATUSES.NEEDS_EDIT]: Object.freeze([
    MODERATION_ACTIONS.RESTORE_LIVE,
    MODERATION_ACTIONS.REMOVE,
  ]),
  [SIGNAL_STATUSES.REMOVED]: Object.freeze([
    MODERATION_ACTIONS.RESTORE_LIVE,
  ]),
  [SIGNAL_STATUSES.CLOSED]: Object.freeze([]),
  [SIGNAL_STATUSES.EXPIRED]: Object.freeze([]),
});

/** Return array of actions allowed from the given status. */
export function allowedActionsForStatus(status) {
  return ALLOWED_TRANSITIONS[status] || [];
}

/**
 * Pure evaluation of whether a moderation decision can be applied to a signal.
 *
 * @param {object} row - The stratosphere_signals database row.
 * @param {string} action - One of MODERATION_ACTIONS.
 * @param {object} [options]
 * @param {string} [options.reason] - Explanation for destructive/restrictive action.
 * @returns {{ allowed: boolean, reason: string | null, targetStatus?: string }}
 */
export function evaluateSignalDecision(row, action, { reason = "" } = {}) {
  if (!row) {
    return { allowed: false, reason: "This signal could not be read." };
  }

  const targetStatus = targetStatusForAction(action);
  if (!targetStatus) {
    return { allowed: false, reason: `Unknown moderation action: "${action}".` };
  }

  const currentStatus = row.status;

  if (currentStatus === SIGNAL_STATUSES.CLOSED) {
    return {
      allowed: false,
      reason: "Closed signals are author-owned and cannot be modified by staff moderation.",
    };
  }

  if (currentStatus === SIGNAL_STATUSES.EXPIRED) {
    return {
      allowed: false,
      reason: "Expired signals are lifecycle-owned and cannot be modified by staff moderation.",
    };
  }

  if (currentStatus === targetStatus) {
    return {
      allowed: false,
      reason: `This signal is already in "${currentStatus}" status.`,
    };
  }

  const allowedActions = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedActions.includes(action)) {
    return {
      allowed: false,
      reason: `Cannot transition signal from "${currentStatus}" via "${action}".`,
    };
  }

  if (isReasonRequired(action)) {
    const trimmed = String(reason || "").trim();
    if (!trimmed) {
      return {
        allowed: false,
        reason: `A non-empty reason is strictly required to execute "${action}".`,
      };
    }
  }

  return { allowed: true, reason: null, targetStatus };
}

/**
 * Generates the atomic DB patch for the stratosphere_signals table.
 */
export function signalModerationPatch({ action, now = new Date().toISOString() }) {
  const targetStatus = targetStatusForAction(action);
  if (!targetStatus) {
    throw new Error(`Invalid moderation action: "${action}"`);
  }

  return {
    status: targetStatus,
    updated_at: now,
  };
}

/**
 * Whether a signal is currently visible on the public Stratosphere feed / radar.
 * (Mirrors listLiveSignals in src/lib/communityStore.js which reads .in("status", ["live", "limited"])).
 */
export function isPubliclyVisibleSignal(rowOrStatus) {
  const status = typeof rowOrStatus === "string" ? rowOrStatus : rowOrStatus?.status;
  return status === SIGNAL_STATUSES.LIVE || status === SIGNAL_STATUSES.LIMITED;
}

/** Short human-readable badge label for status. */
export function signalStatusLabel(status) {
  switch (status) {
    case SIGNAL_STATUSES.LIVE:
      return "Live";
    case SIGNAL_STATUSES.UNDER_REVIEW:
      return "Under Review";
    case SIGNAL_STATUSES.LIMITED:
      return "Limited Reach";
    case SIGNAL_STATUSES.NEEDS_EDIT:
      return "Needs Edit";
    case SIGNAL_STATUSES.REMOVED:
      return "Removed";
    case SIGNAL_STATUSES.CLOSED:
      return "Closed by Author";
    case SIGNAL_STATUSES.EXPIRED:
      return "Expired";
    default:
      return status || "Unknown";
  }
}
