// Deal membership and conversation activity, in one place.
//
// Deciding which deals a user is a party to is an authorization decision:
// buyer, broker, property owner, or an explicitly routed recipient. It was
// written inline in the Inbox route, so anything else that needed the same
// answer — the dashboard attention rail, for one — had to re-implement it, and
// a second implementation of an access check is a second place for it to be
// wrong. These helpers take the service-role client from the caller and stay
// free of request handling so both routes and tests can use them.

const DEAL_FIELDS =
  "id, status, pitch_message, private_notes, buyer_id, broker_id, unit_id, created_at, " +
  "closed_at, expires_at, connects_spent, archived_at, pending_clock_reset_at, " +
  "properties(id, title, slug, owner_id, price)";

/**
 * Every deal row the user is a party to, deduped.
 *
 * @returns {Promise<{rows: object[]|null, error: string|null}>} `error` is a
 *   short reason code, never a database message — the caller maps it to a
 *   response, so nothing internal leaks to the client.
 */
export async function loadUserDealRows(client, userId) {
  if (!client || !userId) return { rows: null, error: "unauthorized" };

  // No FK from buyer_id/broker_id/owner_id to a users table (they are plain
  // text columns), so the owner side cannot be one query with an embedded join
  // filter. Run the angles separately and merge.
  const { data: routedRecipients, error: routedRecipientsError } = await client
    .from("deal_routing_recipients")
    .select("deal_id")
    .eq("recipient_id", userId);
  if (routedRecipientsError) {
    console.error("[userDeals] Routed recipient lookup error:", routedRecipientsError);
    return { rows: null, error: "routing_unavailable" };
  }
  const routedDealIds = [...new Set((routedRecipients || []).map((row) => row.deal_id).filter(Boolean))];

  const [asBuyer, asBroker, asOwner, asRouted] = await Promise.all([
    client.from("deals").select(DEAL_FIELDS).eq("buyer_id", userId),
    client.from("deals").select(DEAL_FIELDS).eq("broker_id", userId),
    client.from("deals").select(DEAL_FIELDS).eq("properties.owner_id", userId).not("properties", "is", null),
    routedDealIds.length
      ? client.from("deals").select(DEAL_FIELDS).in("id", routedDealIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const failed = [asBuyer, asBroker, asOwner, asRouted].find((r) => r.error);
  if (failed) {
    console.error("[userDeals] Deal lookup error:", failed.error);
    return { rows: null, error: "deals_unavailable" };
  }

  const byId = new Map();
  for (const row of [...(asBuyer.data || []), ...(asBroker.data || []), ...(asOwner.data || []), ...(asRouted.data || [])]) {
    // The owner-side query embeds properties via a filtered join; rows where
    // the filter did not match come back with properties: null from Supabase's
    // left-join default. Re-check membership rather than trusting the shape.
    if (
      routedDealIds.includes(row.id)
      || row.properties?.owner_id === userId
      || row.buyer_id === userId
      || row.broker_id === userId
    ) {
      byId.set(row.id, row);
    }
  }

  return { rows: [...byId.values()], error: null };
}

/**
 * Which side of the table the user is sitting on.
 *
 * A routed recipient matches none of the three id columns, and falls through
 * to "broker" — the role the Inbox has always shown them.
 */
export function deriveMyRole(row, userId) {
  if (row?.buyer_id === userId) return "buyer";
  if (row?.broker_id === userId) return "broker";
  if (row?.properties?.owner_id === userId) return "owner";
  return "broker";
}

/**
 * Last message, last activity, unread count and oldest unread time per deal —
 * one query for all deals at once.
 *
 * `oldestUnreadAt` exists because "you have unread messages" and "someone has
 * been waiting two days for an answer" are different facts, and only the
 * second one is worth interrupting anybody over.
 */
export async function loadDealMessageActivity(client, dealIds, userId) {
  const empty = {
    lastMessageByDeal: {},
    lastActivityByDeal: {},
    unreadByDeal: {},
    oldestUnreadByDeal: {},
  };
  if (!client || !Array.isArray(dealIds) || dealIds.length === 0) return empty;

  const { data: messages, error } = await client
    .from("deal_messages")
    .select("deal_id, sender_id, body, created_at, read_at")
    .in("deal_id", dealIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[userDeals] Message activity lookup error:", error);
    return empty;
  }

  const activity = { ...empty };
  for (const message of messages || []) {
    activity.lastMessageByDeal[message.deal_id] = message.body;
    activity.lastActivityByDeal[message.deal_id] = message.created_at;
    if (message.sender_id !== userId && !message.read_at) {
      activity.unreadByDeal[message.deal_id] = (activity.unreadByDeal[message.deal_id] || 0) + 1;
      // Ascending order means the first unread seen for a deal is the oldest.
      if (!activity.oldestUnreadByDeal[message.deal_id]) {
        activity.oldestUnreadByDeal[message.deal_id] = message.created_at;
      }
    }
  }

  return activity;
}
