/**
 * Deal oversight — what staff may see of a live negotiation, and what they may not.
 *
 * Staff could not see that a deal existed at all. `deals`, `deal_messages`,
 * `deal_handshakes`, `deal_routing_recipients` and `viewing_appointments` had no
 * staff surface in either app, so a buyer saying "the broker has gone quiet" or
 * "we agreed something different" met a console that could not confirm the
 * conversation had ever happened.
 *
 * ── THE LINE, AND WHY IT IS HERE AND NOT IN THE PAGE ────────────────────────
 *
 * The published promise is that a deal conversation is private between its
 * parties and is purged seven days after the deal closes. Building an oversight
 * surface that reads message bodies would quietly revoke that promise for
 * everyone, permanently, to serve the rare case where somebody is in dispute.
 *
 * So oversight is split:
 *
 *   - **Always visible:** that a deal exists, who its parties are, its status,
 *     how many messages there are, when the last one was, the handshakes, the
 *     viewings. Enough to answer "is this real, is it moving, who is in it" —
 *     which is every question staff actually get asked.
 *   - **Never visible by default:** what anybody said.
 *   - **Visible only under an open dispute:** the message bodies, because a
 *     dispute is precisely the case where somebody has asked ScoutIt to weigh
 *     what was said, and filing one already places a retention hold on exactly
 *     that conversation (A-061).
 *
 * The rule lives in this module rather than inside the page so that it is one
 * decision with one test, and so a second surface cannot reimplement it more
 * loosely.
 */

/** `deal_disputes` statuses that mean a dispute is live. Mirrors A-061's hold set. */
export const DISPUTE_OPEN_STATUSES = Object.freeze(["open_hold", "under_review"]);

/** Deal statuses that mean the negotiation is still going. */
export const ACTIVE_DEAL_STATUSES = Object.freeze(["pitching", "pending", "accepted", "active"]);

/**
 * May staff read the words in this deal's conversation?
 *
 * @param {{disputeStatuses?: string[]}} deal
 * @returns {{allowed: boolean, reason: string}}
 */
export function mayReadMessageBodies({ disputeStatuses = [] } = {}) {
  const open = disputeStatuses.filter((s) => DISPUTE_OPEN_STATUSES.includes(s));
  if (open.length > 0) {
    return {
      allowed: true,
      reason:
        "A party has filed a dispute about this deal and asked ScoutIt to weigh what was said. " +
        "Filing also placed a hold that stops the conversation being purged.",
    };
  }
  return {
    allowed: false,
    reason:
      "Private between the parties. ScoutIt promises this conversation is theirs, and no dispute " +
      "has been filed about it. Message counts and timing are shown; the words are not.",
  };
}

/**
 * The shape of a deal as staff see it.
 *
 * Deliberately constructed here rather than by spreading the database row into
 * the page. A spread carries whatever the table gains next — including a column
 * somebody adds later that holds message content — straight onto the screen.
 * This lists what may be shown, so a new column is invisible until somebody
 * decides it should not be.
 */
export function toOversightRow({
  deal,
  messageCount = 0,
  lastMessageAt = null,
  disputeStatuses = [],
  handshakes = [],
  viewings = [],
  messages = null,
}) {
  const access = mayReadMessageBodies({ disputeStatuses });

  return {
    id: deal.id,
    status: deal.status,
    isActive: ACTIVE_DEAL_STATUSES.includes(deal.status),
    buyerId: deal.buyer_id ?? null,
    brokerId: deal.broker_id ?? null,
    propertyId: deal.property_id ?? null,
    unitId: deal.unit_id ?? null,
    connectsSpent: deal.connects_spent ?? null,
    createdAt: deal.created_at ?? null,
    closedAt: deal.closed_at ?? null,
    expiresAt: deal.expires_at ?? null,
    archivedAt: deal.archived_at ?? null,

    messageCount,
    lastMessageAt,

    disputeStatuses,
    hasOpenDispute: disputeStatuses.some((s) => DISPUTE_OPEN_STATUSES.includes(s)),

    handshakes: handshakes.map((h) => ({
      id: h.id,
      type: h.handshake_type,
      status: h.status,
      partyASignedAt: h.party_a_signed_at ?? null,
      partyBSignedAt: h.party_b_signed_at ?? null,
      // A handshake signed by one side and not the other is the single most
      // useful state here: it is somebody waiting on somebody else.
      awaitingCountersignature:
        Boolean(h.party_a_signed_at) !== Boolean(h.party_b_signed_at),
    })),

    viewings: viewings.map((v) => ({
      id: v.id,
      scheduledAt: v.scheduled_at ?? null,
      status: v.status ?? null,
      durationMinutes: v.duration_minutes ?? null,
    })),

    messagesVisible: access.allowed,
    messagesReason: access.reason,
    // Bodies are attached ONLY when the rule says so, whatever the caller passed.
    messages: access.allowed && Array.isArray(messages) ? messages : null,
  };
}

/**
 * A one-line reading of what is happening, so a queue of deals can be scanned.
 * Ordered by what a staff member would act on first.
 */
export function summarise(row) {
  if (row.hasOpenDispute) return "In dispute — a party has asked for this to be reviewed.";
  if (row.handshakes.some((h) => h.awaitingCountersignature)) {
    return "A handshake is signed by one side and waiting on the other.";
  }
  if (row.messageCount === 0 && row.isActive) {
    return "Open, but nobody has said anything yet.";
  }
  if (row.closedAt) return "Closed.";
  if (row.archivedAt) return "Archived.";
  if (row.isActive) return `Active — ${row.messageCount} message${row.messageCount === 1 ? "" : "s"}.`;
  return `${row.status}.`;
}
