/**
 * ═══════════════════════════════════════════════════════════════════════
 * A-182: SAFEGUARD 1 — DOUBLE-BLIND SIMULTANEOUS REVIEW ENGINE
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Implements the Double-Blind Simultaneous Review Model to eliminate review
 * hostage situations (e.g. over security deposits or repair disputes) and
 * retaliatory grading.
 *
 * Rules:
 * 1. 14-Day Anti-Retaliation Window: Neither party can see the other's review
 *    until BOTH have submitted, or until 14 days elapse from transaction closing.
 * 2. Immutable Submission: Once submitted, a review cannot be edited or retracted.
 * 3. Expired Window Cutoff: If 14 days elapse and only Party A submitted, Party A's
 *    review unlocks and publishes, while Party B is barred from submitting a late,
 *    retaliatory counter-review.
 * 4. Dispute Shield: Either party can flag an unfair review for Trust & Safety
 *    arbitration, placing an immediate hold on the review so it does not affect
 *    reputation metrics during investigation.
 */

export const REVIEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export const REVIEW_STATES = Object.freeze({
  PENDING_BOTH: "PENDING_BOTH",
  SINGLE_SUBMITTED: "SINGLE_SUBMITTED",
  SIMULTANEOUSLY_UNLOCKED: "SIMULTANEOUSLY_UNLOCKED",
  EXPIRED_UNLOCKED: "EXPIRED_UNLOCKED",
  EXPIRED_CLOSED: "EXPIRED_CLOSED",
  DISPUTED_HOLD: "DISPUTED_HOLD",
});

/**
 * Calculates whether the 14-day submission window is still open.
 * @param {string|number|Date} transactionClosedAt
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export function isSubmissionWindowOpen(transactionClosedAt, now = Date.now()) {
  if (!transactionClosedAt) return false;
  const closedTime = new Date(transactionClosedAt).getTime();
  if (isNaN(closedTime)) return false;
  return now < closedTime + REVIEW_WINDOW_MS;
}

/**
 * Computes the remaining days/hours in the 14-day anti-retaliation window.
 * @param {string|number|Date} transactionClosedAt
 * @param {number} [now=Date.now()]
 * @returns {{ isOpen: boolean, remainingMs: number, remainingDays: number }}
 */
export function getWindowRemaining(transactionClosedAt, now = Date.now()) {
  const closedTime = new Date(transactionClosedAt).getTime();
  if (isNaN(closedTime)) return { isOpen: false, remainingMs: 0, remainingDays: 0 };

  const deadline = closedTime + REVIEW_WINDOW_MS;
  const remainingMs = Math.max(0, deadline - now);
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return {
    isOpen: remainingMs > 0,
    remainingMs,
    remainingDays,
  };
}

/**
 * Determines the double-blind review state between two transaction counterparties.
 *
 * @param {object} params
 * @param {object|null} params.reviewA - Review from Party A
 * @param {object|null} params.reviewB - Review from Party B
 * @param {string|number|Date} params.transactionClosedAt
 * @param {number} [params.now=Date.now()]
 * @returns {string} One of REVIEW_STATES
 */
export function determineDoubleBlindState({
  reviewA = null,
  reviewB = null,
  transactionClosedAt,
  now = Date.now(),
}) {
  // If any review is actively disputed, the state reflects the dispute hold
  if ((reviewA && reviewA.disputed_at) || (reviewB && reviewB.disputed_at)) {
    return REVIEW_STATES.DISPUTED_HOLD;
  }

  const windowOpen = isSubmissionWindowOpen(transactionClosedAt, now);

  const hasA = Boolean(reviewA && reviewA.submitted_at);
  const hasB = Boolean(reviewB && reviewB.submitted_at);

  if (hasA && hasB) {
    return REVIEW_STATES.SIMULTANEOUSLY_UNLOCKED;
  }

  if (windowOpen) {
    if (hasA || hasB) {
      return REVIEW_STATES.SINGLE_SUBMITTED;
    }
    return REVIEW_STATES.PENDING_BOTH;
  }

  // Window is closed / expired (> 14 days)
  if (hasA || hasB) {
    return REVIEW_STATES.EXPIRED_UNLOCKED;
  }

  return REVIEW_STATES.EXPIRED_CLOSED;
}

/**
 * Resolves the visibility and masking of a review for a specific viewing user.
 * Prevents premature disclosure of ratings before mutual submission or window expiration.
 *
 * @param {object} params
 * @param {object} params.targetReview - The review being inspected
 * @param {object|null} params.counterpartyReview - The other party's review (if any)
 * @param {string|number|Date} params.transactionClosedAt
 * @param {string} params.viewerUserId - The ID of the authenticated user requesting the view
 * @param {number} [params.now=Date.now()]
 * @returns {object} Unmasked review OR privacy-masked placeholder
 */
export function resolveReviewVisibility({
  targetReview,
  counterpartyReview = null,
  transactionClosedAt,
  viewerUserId,
  now = Date.now(),
}) {
  if (!targetReview) return null;

  // The author of the review can always see their own submission
  if (viewerUserId && viewerUserId === targetReview.reviewer_id) {
    return {
      ...targetReview,
      isDoubleBlindLocked: false,
      isAuthorViewing: true,
    };
  }

  // Check if review is under dispute hold
  if (targetReview.disputed_at) {
    return {
      id: targetReview.id,
      reviewer_id: null,
      target_user_id: targetReview.target_user_id,
      status: "DISPUTED_HOLD",
      isDoubleBlindLocked: true,
      holdReason: "UNDER_TRUST_AND_SAFETY_ARBITRATION",
      disputeReason: targetReview.dispute_reason || "Review factual accuracy under review",
      vectors: null,
      feedback: null,
    };
  }

  const state = determineDoubleBlindState({
    reviewA: targetReview,
    reviewB: counterpartyReview,
    transactionClosedAt,
    now,
  });

  const isUnlocked =
    state === REVIEW_STATES.SIMULTANEOUSLY_UNLOCKED ||
    state === REVIEW_STATES.EXPIRED_UNLOCKED;

  if (isUnlocked) {
    return {
      ...targetReview,
      isDoubleBlindLocked: false,
      unlockState: state,
    };
  }

  // Masked state: hide vectors, score, and comments from counterparty
  const { remainingDays } = getWindowRemaining(transactionClosedAt, now);

  return {
    id: targetReview.id,
    reviewer_id: null,
    target_user_id: targetReview.target_user_id,
    status: "LOCKED_DOUBLE_BLIND",
    isDoubleBlindLocked: true,
    lockReason: "PENDING_MUTUAL_SUBMISSION_OR_WINDOW_EXPIRY",
    remainingDays,
    vectors: null,
    feedback: null,
    notice: `Review submitted by counterparty. Contents unlock when you submit your review or in ${remainingDays} day(s).`,
  };
}

/**
 * Checks whether an authenticated party is eligible to submit a review right now.
 *
 * @param {object} params
 * @param {object|null} params.existingReview - User's existing review for this transaction
 * @param {object|null} params.counterpartyReview - Counterparty's review (if any)
 * @param {string|number|Date} params.transactionClosedAt
 * @param {number} [params.now=Date.now()]
 * @returns {{ canSubmit: boolean, reason?: string }}
 */
export function checkSubmissionEligibility({
  existingReview = null,
  counterpartyReview = null,
  transactionClosedAt,
  now = Date.now(),
}) {
  if (existingReview && existingReview.submitted_at) {
    return {
      canSubmit: false,
      reason: "ALREADY_SUBMITTED: Reviews cannot be edited once submitted.",
    };
  }

  const windowOpen = isSubmissionWindowOpen(transactionClosedAt, now);

  if (!windowOpen) {
    // Window has closed
    if (counterpartyReview && counterpartyReview.submitted_at) {
      return {
        canSubmit: false,
        reason: "WINDOW_EXPIRED: The 14-day review window closed. Retaliatory counter-reviews are prohibited.",
      };
    }
    return {
      canSubmit: false,
      reason: "TRANSACTION_ARCHIVED: The 14-day review period for this transaction has expired.",
    };
  }

  return { canSubmit: true };
}
