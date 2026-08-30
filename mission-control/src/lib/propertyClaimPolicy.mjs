/**
 * Ownership claims — the rules a reviewer is held to.
 *
 * `property_claims` was built with `status`, `reviewer_id` and
 * `decision_reason_code`: a review workflow, fully designed. Nothing anywhere
 * in either app ever read those columns. A person asserting they own a property
 * somebody else listed could file, and no surface existed to answer them. They
 * were stuck with no remedy.
 *
 * What makes this different from the other queues: approving a claim **moves a
 * listing away from the person currently holding it**. The rules below exist so
 * that transfer cannot happen casually, by accident, or without a reason
 * somebody signed.
 *
 * Pure and dependency-free so the decision table is testable without a database.
 */

/** Every status the database will accept. Mirrors `property_claims_status_check`. */
export const CLAIM_STATUSES = Object.freeze([
  "draft",
  "submitted",
  "technical_review",
  "needs_information",
  "human_review",
  "approved",
  "rejected",
  "disputed",
  "withdrawn",
  "closed",
]);

/** Statuses that mean the claim is still live and belongs in the queue. */
export const OPEN_CLAIM_STATUSES = Object.freeze([
  "submitted",
  "technical_review",
  "needs_information",
  "human_review",
  "disputed",
]);

/**
 * `draft` is deliberately absent from the queue. A draft is the claimant's
 * unfinished sentence; putting it in front of a reviewer would show them
 * something the person has not said yet.
 */
export const NOT_YET_A_CLAIM = Object.freeze(["draft"]);

/** Relationships a claimant can assert. Mirrors the database check. */
export const CLAIMED_RELATIONSHIPS = Object.freeze([
  "owner",
  "property_manager",
  "authorized_broker",
]);

export const RELATIONSHIP_LABELS = Object.freeze({
  owner: "I own this property",
  property_manager: "I manage this property for the owner",
  authorized_broker: "I am the broker authorised to market it",
});

/**
 * Reason codes a decision must carry.
 *
 * A free-text-only decision is unauditable in aggregate: nobody can later ask
 * "how many claims did we reject for an unreadable title?" A code plus a
 * written note answers both questions.
 */
export const DECISION_REASON_CODES = Object.freeze({
  approved: [
    "documents_verified",
    "lister_conceded",
    "corroborated_by_record",
  ],
  rejected: [
    "insufficient_evidence",
    "documents_unreadable",
    "contradicted_by_record",
    "not_the_property_described",
    "duplicate_of_existing_claim",
  ],
  needs_information: [
    "documents_missing",
    "documents_unreadable",
    "identity_unconfirmed",
    "relationship_unclear",
  ],
});

/** The transitions a reviewer may make, and what each one means. */
export const REVIEW_TRANSITIONS = Object.freeze({
  take: {
    to: "human_review",
    label: "Take for review",
    requiresReason: false,
    transfersListing: false,
  },
  request_information: {
    to: "needs_information",
    label: "Ask the claimant for more",
    requiresReason: true,
    transfersListing: false,
  },
  reject: {
    to: "rejected",
    label: "Reject the claim",
    requiresReason: true,
    transfersListing: false,
  },
  approve: {
    to: "approved",
    label: "Approve and transfer the listing",
    requiresReason: true,
    transfersListing: true,
  },
});

/**
 * Can this transition be made from this status?
 *
 * Positive list only: an unknown status denies. "We do not recognise the state
 * this claim is in" is not a reason to let somebody move a listing.
 */
export function canTransition(fromStatus, transition) {
  const rule = REVIEW_TRANSITIONS[transition];
  if (!rule) return false;

  // A decided claim is finished. Reopening is a new claim, not an edit of the
  // old one — otherwise the record of what was decided, and on what basis,
  // gets overwritten by whoever looked at it last.
  if (!OPEN_CLAIM_STATUSES.includes(fromStatus)) return false;

  // Taking a claim that is already in human review changes nothing and would
  // silently reassign it away from whoever is holding it.
  if (transition === "take" && fromStatus === "human_review") return false;

  // A claim can only be approved or rejected once a human has actually taken
  // it. Deciding straight off the queue means deciding without opening it.
  if ((transition === "approve" || transition === "reject") && fromStatus !== "human_review") {
    return false;
  }

  return true;
}

/**
 * Validate a decision before anything is written.
 *
 * @returns {{ok: true, status: string, transfersListing: boolean} | {ok: false, message: string}}
 */
export function validateDecision({ transition, fromStatus, reasonCode, note }) {
  const rule = REVIEW_TRANSITIONS[transition];
  if (!rule) return { ok: false, message: `Unknown decision '${transition}'.` };

  if (!canTransition(fromStatus, transition)) {
    if (transition === "approve" || transition === "reject") {
      return {
        ok: false,
        message: "Take the claim for review before deciding it.",
      };
    }
    return {
      ok: false,
      message: `A claim that is '${fromStatus}' cannot be moved by '${transition}'.`,
    };
  }

  if (rule.requiresReason) {
    const allowed = DECISION_REASON_CODES[rule.to] || [];
    if (!allowed.includes(reasonCode)) {
      return { ok: false, message: "Choose a reason for this decision." };
    }
    if (!note || note.trim().length < 20) {
      // Twenty characters is not a quality bar; it is a bar against "ok" and
      // "n/a" on a record that decides who controls a property.
      return {
        ok: false,
        message: "Write at least a sentence explaining the decision. This is kept on the record.",
      };
    }
  }

  return { ok: true, status: rule.to, transfersListing: rule.transfersListing };
}

/**
 * Does the claim contradict what the lister declared?
 *
 * This is the comparison a RESA dispute turns on, and it is the single most
 * useful thing to put in front of a reviewer. Two people both saying "owner" is
 * a direct conflict; a broker's listing claimed by an owner is the ordinary,
 * expected case the Owner Sovereignty promise was written for.
 */
export function describeConflict({ listerRelationship, claimedRelationship }) {
  if (!listerRelationship) {
    return {
      level: "unknown",
      text: "The listing predates relationship declarations, so there is nothing to compare against. Judge on documents alone.",
    };
  }
  if (listerRelationship === claimedRelationship) {
    return {
      level: "direct",
      text: `Both the lister and the claimant say "${RELATIONSHIP_LABELS[claimedRelationship] || claimedRelationship}". One of them is wrong.`,
    };
  }
  if (claimedRelationship === "owner" && listerRelationship !== "owner") {
    return {
      level: "expected",
      text: "An owner is claiming a listing put up by somebody acting for them. This is the ordinary case.",
    };
  }
  return {
    level: "differs",
    text: `The lister declared "${listerRelationship}"; the claimant asserts "${claimedRelationship}".`,
  };
}
