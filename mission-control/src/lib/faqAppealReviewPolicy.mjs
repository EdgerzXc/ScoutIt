// A-133 — FAQ block-appeal review policy (pure, no I/O).
//
// Mirrors the transition table inside the review_faq_block_appeal RPC
// (supabase/migrations/20260814000003_faq_block_appeals.sql), so the screen
// can refuse impossible transitions before they reach the database and can
// label buttons with what they really do.
//
// What approve really does: the RPC sets status to 'approved' and stamps
// reviewed_at. It does NOT insert the blocked text into property_faqs, clear
// the evidence row, or republish anything. An approval is a verdict about the
// block ("the filter was wrong here"), not a publish of the answer. Button
// copy must say verdict language, never "Publish answer".

export const APPEAL_STATES = Object.freeze({
  PENDING: "pending",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const APPEAL_ACTIONS = Object.freeze({
  START_REVIEW: "start_review",
  APPROVE: "approve",
  REJECT: "reject",
});

// The status the row must still hold for the action to apply. Sent as
// p_expected_status; a row that moved since render raises APPEAL_CONFLICT.
export function expectedStatusFor(action) {
  if (action === APPEAL_ACTIONS.START_REVIEW) return APPEAL_STATES.PENDING;
  if (action === APPEAL_ACTIONS.APPROVE) return APPEAL_STATES.UNDER_REVIEW;
  // Reject is allowed from either open state; the caller passes the status it
  // rendered, and the RPC enforces the match.
  return null;
}

export function nextStatusFor(status, action) {
  if (action === APPEAL_ACTIONS.START_REVIEW && status === APPEAL_STATES.PENDING) {
    return APPEAL_STATES.UNDER_REVIEW;
  }
  if (action === APPEAL_ACTIONS.APPROVE && status === APPEAL_STATES.UNDER_REVIEW) {
    return APPEAL_STATES.APPROVED;
  }
  if (
    action === APPEAL_ACTIONS.REJECT &&
    (status === APPEAL_STATES.PENDING || status === APPEAL_STATES.UNDER_REVIEW)
  ) {
    return APPEAL_STATES.REJECTED;
  }
  return null;
}

// Returns a human reason the action is blocked, or null when allowed. A
// refusal carries reviewer notes or it does not happen.
export function reviewBlockedReason(row, action, notes = "") {
  const next = nextStatusFor(row?.status, action);
  if (!next) {
    return "This appeal already moved — reload before reviewing.";
  }
  if (action === APPEAL_ACTIONS.REJECT && !String(notes || "").trim()) {
    return "A rejection requires a reason.";
  }
  return null;
}

export const ACTION_LABELS = Object.freeze({
  [APPEAL_ACTIONS.START_REVIEW]: "Start review",
  [APPEAL_ACTIONS.APPROVE]: "Record approval",
  [APPEAL_ACTIONS.REJECT]: "Record rejection",
});
