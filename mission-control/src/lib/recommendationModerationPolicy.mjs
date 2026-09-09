// ═══════════════════════════════════════════════════════════════
// A-038 — what a moderator is allowed to do to a client's words.
//
// Pure, so it can be tested without a database and so the console and any
// later automation cannot hold two opinions about the same row.
//
// The rule that carries real weight: **consent gates approval, always.**
// A recommendation is a named person's public statement about a licensed
// professional. If they never granted consent, or withdrew it, no staff tier
// and no note may publish it. That is a refusal, not a warning — the database
// index already excludes such rows from the public projection, and the console
// must never suggest an approval that the site would then ignore.
//
// Rejection is not deletion. The row is retained so the consent record and the
// audit trail survive the decision, which is the whole point of keeping them.
// ═══════════════════════════════════════════════════════════════

export const MODERATION_STATES = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

export const MODERATION_DECISIONS = Object.freeze({
  APPROVE: "approve",
  REJECT: "reject",
});

/** The audit event each decision records. Names match the table's CHECK. */
export const DECISION_EVENTS = Object.freeze({
  approve: "recommendation_approved",
  reject: "recommendation_rejected",
});

const has = (value) => Boolean(value);

/**
 * Why a row cannot be published, or null when nothing stands in the way.
 *
 * Ordered by severity so the console shows the reason a person would act on
 * first: consent before withdrawal before dispute.
 */
export function publicationBlocker(row) {
  if (!row) return "This recommendation could not be read.";
  if (row.consent_granted !== true) {
    return "The client never granted consent to publish this.";
  }
  if (has(row.withdrawn_at)) {
    return "The client withdrew this recommendation.";
  }
  if (has(row.redacted_at)) {
    return "This recommendation has been redacted.";
  }
  if (has(row.disputed_at)) {
    return "This recommendation is disputed and cannot be published while that stands.";
  }
  return null;
}

/**
 * Can this decision be applied to this row?
 *
 * Rejecting is allowed even when publication is blocked — a withdrawn or
 * disputed row still needs a recorded staff decision, and refusing to let
 * anyone close it would leave the queue permanently dirty.
 */
export function evaluateDecision(row, decision) {
  if (!row) return { allowed: false, reason: "This recommendation could not be read." };

  if (decision !== MODERATION_DECISIONS.APPROVE && decision !== MODERATION_DECISIONS.REJECT) {
    return { allowed: false, reason: "Unknown moderation decision." };
  }

  if (row.moderation_state === MODERATION_STATES.APPROVED && decision === MODERATION_DECISIONS.APPROVE) {
    return { allowed: false, reason: "This recommendation is already approved." };
  }
  if (row.moderation_state === MODERATION_STATES.REJECTED && decision === MODERATION_DECISIONS.REJECT) {
    return { allowed: false, reason: "This recommendation is already rejected." };
  }

  if (decision === MODERATION_DECISIONS.APPROVE) {
    const blocker = publicationBlocker(row);
    if (blocker) return { allowed: false, reason: blocker };
  }

  return { allowed: true, reason: null };
}

/**
 * The exact column patch for a decision. The caller supplies identity and
 * time so nothing here reaches for a clock or a session.
 */
export function moderationPatch({ decision, staffId, note = "", now }) {
  return {
    moderation_state:
      decision === MODERATION_DECISIONS.APPROVE
        ? MODERATION_STATES.APPROVED
        : MODERATION_STATES.REJECTED,
    moderated_by: staffId,
    moderated_at: now,
    moderation_note: String(note || "").trim().slice(0, 1000),
    updated_at: now,
  };
}

/**
 * Whether a row is currently visible on the public dossier.
 *
 * Mirrors `broker_recommendations_public_idx` exactly. The console must
 * describe what the site actually shows, not what its own status column
 * suggests in isolation — those two disagree the moment consent is revoked
 * after approval, and a staff member reading "approved" would be misled.
 */
export function isPubliclyVisible(row) {
  if (!row) return false;
  return (
    row.moderation_state === MODERATION_STATES.APPROVED &&
    row.consent_granted === true &&
    !has(row.withdrawn_at) &&
    !has(row.disputed_at)
  );
}

/** One short, honest label for the row's real public state. */
export function publicStateLabel(row) {
  if (!row) return "Unknown";
  if (isPubliclyVisible(row)) return "Live on the dossier";
  if (row.moderation_state === MODERATION_STATES.APPROVED) return "Approved, not public";
  if (row.moderation_state === MODERATION_STATES.REJECTED) return "Rejected";
  return "Awaiting review";
}

/**
 * "Verified ScoutIt connection" versus "Client-submitted · unverified".
 *
 * A-038 forbids an unlabelled entry, and the label is decided by the presence
 * of a qualifying handshake — never by a moderator's confidence.
 */
export function verificationLabel(row) {
  return has(row?.qualifying_handshake_id)
    ? "Verified ScoutIt connection"
    : "Client-submitted · unverified";
}
