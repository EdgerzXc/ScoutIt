/**
 * Contact exchange at the viewing (A-149, owner spec S4).
 *
 * The two-sided handshake stays the ONLY thing that reveals contact details —
 * this module decides what an appointment surface may OFFER, never the reveal
 * itself. It reads a deal_handshakes row (or its absence) plus the deal and
 * viewing states, and answers one of four states:
 *
 *   exchanged   — both sides signed. Historical fact; shown even on closed
 *                 deals and past viewings. Never carries numbers — those live
 *                 in the thread.
 *   offered     — exactly one signature. `offeredByMe` tells whose move it is:
 *                 mine → "awaiting them", theirs → I may accept.
 *   offerable   — no handshake row and the deal is still open. I may offer.
 *   unavailable — nothing to offer: no deal, a terminal deal state, or a
 *                 cancelled viewing. The thread widget (when one exists) is
 *                 unaffected — this only gates the appointment affordance.
 *
 * Pure by design: the appointments API resolves the row server-side and the
 * schedule renders this answer, so a second derivation cannot drift from it.
 */

// Deal states past which no NEW exchange can start. A completed exchange is
// decided before this list is consulted, so history is never rewritten.
const TERMINAL_DEAL_STATUSES = Object.freeze([
  "closed",
  "declined",
  "withdrawn",
  "expired",
  "reported",
]);

function signedAt(row, userId) {
  if (!row || !userId) return { mine: false, theirs: false };
  const mine =
    (row.party_a_id === userId && Boolean(row.party_a_signed_at)) ||
    (row.party_b_id === userId && Boolean(row.party_b_signed_at));
  const theirs =
    (row.party_a_id !== userId && Boolean(row.party_a_signed_at)) ||
    (row.party_b_id !== userId && Boolean(row.party_b_signed_at));
  return { mine, theirs };
}

export function isHandshakeComplete(handshake) {
  if (!handshake) return false;
  if (handshake.status === "completed") return true;
  return Boolean(handshake.party_a_signed_at && handshake.party_b_signed_at);
}

/**
 * @param {object} input
 * @param {string|null} input.dealStatus      deals.status for the viewing's deal
 * @param {string|null} input.viewingStatus   viewing_appointments.status
 * @param {object|null} input.handshake       deal_handshakes row (transaction type) or null
 * @param {string|null} input.userId          viewer, to attribute the pending offer
 * @returns {{ state: "exchanged"|"offered"|"offerable"|"unavailable", offeredByMe: boolean }}
 */
export function resolveContactExchange({ dealStatus = null, viewingStatus = null, handshake = null, userId = null } = {}) {
  if (isHandshakeComplete(handshake)) return { state: "exchanged", offeredByMe: false };
  if (!dealStatus || TERMINAL_DEAL_STATUSES.includes(String(dealStatus).toLowerCase())) {
    return { state: "unavailable", offeredByMe: false };
  }
  if (String(viewingStatus || "").toLowerCase() === "cancelled") {
    return { state: "unavailable", offeredByMe: false };
  }
  if (handshake) {
    const { mine, theirs } = signedAt(handshake, userId);
    // Exactly one side signed (both would have completed above). Mine signed
    // means I offered and wait; otherwise the offer sits with me to accept —
    // including the degenerate no-signature row, where signing IS the offer.
    if (mine && !theirs) return { state: "offered", offeredByMe: true };
    return { state: "offered", offeredByMe: false };
  }
  return { state: "offerable", offeredByMe: false };
}
