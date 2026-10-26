/**
 * Policy rules for behavioral review disputes (A-266).
 * Pure JavaScript module — no I/O, no server-only imports, 100% testable.
 */

export const REVIEW_DISPUTE_OUTCOMES = Object.freeze({
  UPHOLD_REVIEW: "uphold_review", // Dismiss dispute: review is verified valid, restore to standing
  REMOVE_REVIEW: "remove_review", // Uphold dispute: review was abusive/fake/retaliatory, quarantine
});

export const STALLED_DISPUTE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Calculate the number of days a dispute has been pending.
 * @param {string|Date} disputedAt
 * @param {Date} [now]
 * @returns {number}
 */
export function daysPending(disputedAt, now = new Date()) {
  if (!disputedAt) return 0;
  const start = new Date(disputedAt).getTime();
  const current = new Date(now).getTime();
  if (Number.isNaN(start) || Number.isNaN(current) || current < start) return 0;
  return Math.floor((current - start) / DAY_MS);
}

/**
 * Determine if a dispute is stalled (open past the SLA threshold).
 * @param {string|Date} disputedAt
 * @param {number} [thresholdDays=7]
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isStalledDispute(disputedAt, thresholdDays = STALLED_DISPUTE_DAYS, now = new Date()) {
  return daysPending(disputedAt, now) >= thresholdDays;
}

/**
 * Count stalled disputes in a list of disputes.
 * @param {Array<{disputed_at?: string}>} disputes
 * @param {number} [thresholdDays=7]
 * @param {Date} [now]
 * @returns {number}
 */
export function countStalledDisputes(disputes, thresholdDays = STALLED_DISPUTE_DAYS, now = new Date()) {
  return (disputes || []).filter((r) => r.disputed_at && isStalledDispute(r.disputed_at, thresholdDays, now)).length;
}

/**
 * Validate dispute resolution input.
 * @param {object} params
 * @param {string} params.outcome
 * @param {string} params.reason
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDisputeResolution({ outcome, reason }) {
  if (!outcome || !Object.values(REVIEW_DISPUTE_OUTCOMES).includes(outcome)) {
    return {
      valid: false,
      error: `Invalid outcome. Must be one of: ${Object.values(REVIEW_DISPUTE_OUTCOMES).join(", ")}`,
    };
  }

  const trimmedReason = typeof reason === "string" ? reason.trim() : "";
  if (!trimmedReason || trimmedReason.length < 10) {
    return {
      valid: false,
      error: "A substantive resolution reason of at least 10 characters is required for staff audit.",
    };
  }

  return { valid: true };
}

/**
 * Formats party notification messages based on dispute resolution outcome.
 * @param {object} params
 * @param {string} params.outcome
 * @param {string} params.reason
 * @param {boolean} params.isReviewer
 * @returns {{ title: string, desc: string }}
 */
export function formatDisputeNotification({ outcome, reason, isReviewer }) {
  const shortReason = reason.length > 120 ? `${reason.slice(0, 117)}...` : reason;

  if (outcome === REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW) {
    if (isReviewer) {
      return {
        title: "Review Dispute Resolved: Review Upheld",
        desc: `Staff arbitration concluded that your review meets community integrity standards. Reason: ${shortReason}`,
      };
    }
    return {
      title: "Review Dispute Concluded",
      desc: `Staff reviewed your dispute regarding a behavioral review. The review has been upheld and restored to standing. Reason: ${shortReason}`,
    };
  }

  if (outcome === REVIEW_DISPUTE_OUTCOMES.REMOVE_REVIEW) {
    if (isReviewer) {
      return {
        title: "Review Dispute Concluded: Review Removed",
        desc: `Following arbitration, your review was removed from the user's behavioral record. Reason: ${shortReason}`,
      };
    }
    return {
      title: "Review Dispute Resolved: Review Removed",
      desc: `Your dispute was upheld by Trust & Safety. The flagged review has been permanently quarantined from your standing. Reason: ${shortReason}`,
    };
  }

  return {
    title: "Review Dispute Update",
    desc: `Your review dispute status was updated by staff. Reason: ${shortReason}`,
  };
}
