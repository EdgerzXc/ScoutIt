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

// A-148: per-request anonymity flag (migration-gated, O-004). Until the
// column exists any select naming it fails 42703, so read with it first and
// fall back to the base list — rows then carry sender_anonymous undefined,
// which the render rule treats as false. A missing column never breaks the
// inbox (same warn-once fallback shape as connectGates.js).
const DEAL_FIELDS_ANON = `${DEAL_FIELDS}, sender_anonymous`;
const DEAL_FIELDS_GATE = `${DEAL_FIELDS_ANON}, open_gate_inbound, routing_snapshot`;

let anonColumnWarned = false;

function isMissingColumn(error) {
  return error?.code === "42703" || /does not exist|undefined_column/i.test(error?.message || "");
}

async function selectDeals(client, buildQuery) {
  const withGate = await buildQuery(DEAL_FIELDS_GATE);
  if (!withGate.error) return withGate;
  if (!isMissingColumn(withGate.error)) return withGate;
  const withAnon = await buildQuery(DEAL_FIELDS_ANON);
  if (!withAnon.error) return withAnon;
  if (!isMissingColumn(withAnon.error)) return withAnon;
  if (!anonColumnWarned) {
    console.warn("[userDeals] anonymity column unavailable, falling back:", withAnon.error.code || withAnon.error.message);
    anonColumnWarned = true;
  }
  return buildQuery(DEAL_FIELDS);
}

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
    selectDeals(client, (fields) => client.from("deals").select(fields).eq("buyer_id", userId)),
    selectDeals(client, (fields) => client.from("deals").select(fields).eq("broker_id", userId)),
    selectDeals(client, (fields) => client.from("deals").select(fields).eq("properties.owner_id", userId).not("properties", "is", null)),
    routedDealIds.length
      ? selectDeals(client, (fields) => client.from("deals").select(fields).in("id", routedDealIds))
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

  let allRoutedRecipients = routedRecipients || [];
  if (byId.size > 0) {
    const snapshotResult = await client.from("deal_routing_recipients")
      .select("deal_id, recipient_id, recipient_type")
      .in("deal_id", [...byId.keys()]);
    if (snapshotResult.error) return { rows: null, error: "routing_unavailable" };
    allRoutedRecipients = snapshotResult.data || [];
  }
  return { rows: [...byId.values()], error: null, routedRecipients: allRoutedRecipients };
}

export function extractServiceTargetRole(row) {
  const snapRole = String(
    row?.routing_snapshot?.target_role ||
    row?.routing_snapshot?.professional_category ||
    row?.routing_snapshot?.recipient_role ||
    ""
  ).trim().toLowerCase();
  if (["photographer", "designer", "event_planner", "researcher", "operator", "broker", "owner"].includes(snapRole)) {
    return snapRole === "event_planner" ? "designer" : snapRole;
  }
  const pitch = String(row?.pitch_message || "");
  const tagMatch = /^\[LAYER\s*4\s*·\s*(PHOTOGRAPHER|DESIGNER|EVENT_PLANNER|RESEARCHER|BROKER)\]/i.exec(pitch);
  if (tagMatch) {
    const matched = tagMatch[1].toLowerCase();
    return matched === "event_planner" ? "designer" : matched;
  }
  return null;
}

/**
 * Which side of the table the user is sitting on.
 *
 * Checks Layer 4 service target_role first for recipients, then property owner,
 * then broker.
 */
export function deriveMyRole(row, userId) {
  if (row?.buyer_id === userId) return "buyer";
  const serviceRole = extractServiceTargetRole(row);
  if (serviceRole) return serviceRole;
  if (row?.properties?.owner_id === userId) return "owner";
  if (row?.broker_id === userId) return "broker";
  return "broker";
}

/**
 * Explicit human-readable attribution for why this connection was opened and
 * which role/lens it belongs to (Property Owner vs Layer 4 Photographer /
 * Designer / Researcher / Broker / Operator).
 */
export function describeDealIntent(row, myRole) {
  const role = String(myRole || "buyer").trim().toLowerCase();
  const serviceRole = extractServiceTargetRole(row);
  const propTitle =
    row?.properties?.title ||
    row?.propertyTitle ||
    row?.property_title ||
    row?.routing_snapshot?.signal_title ||
    "";
  const hasRealProperty =
    Boolean(row?.properties?.id || row?.propertyId || row?.propertySlug) ||
    (propTitle &&
      propTitle !== "Untitled Property" &&
      !/^Layer 4\b/i.test(propTitle) &&
      !/Brief$/i.test(propTitle));

  if (role === "owner") {
    return {
      targetRole: "owner",
      sourceLayer: row?.open_gate_inbound ? "open_gate" : "property_listing",
      intentBadge: "FOR OWNER · PROPERTY INQUIRY",
      intentSummary: propTitle
        ? `Wants Property: ${propTitle} (For Owner)`
        : "Wants Property · For Owner Lens",
    };
  }

  if (role === "photographer") {
    return {
      targetRole: "photographer",
      sourceLayer: "layer_4_professionals",
      intentBadge: "NEEDS PHOTOGRAPHER · LAYER 4",
      intentSummary: hasRealProperty
        ? `Needs Spatial Photographer for ${propTitle}`
        : "Needs Spatial Photographer · Layer 4 Professional Booking",
    };
  }

  if (role === "designer") {
    return {
      targetRole: "designer",
      sourceLayer: "layer_4_professionals",
      intentBadge: "NEEDS DESIGNER · LAYER 4",
      intentSummary: hasRealProperty
        ? `Needs Event & Concept Designer for ${propTitle}`
        : "Needs Event & Concept Designer · Layer 4 Professional Booking",
    };
  }

  if (role === "researcher") {
    return {
      targetRole: "researcher",
      sourceLayer: "layer_4_professionals",
      intentBadge: "NEEDS RESEARCHER · LAYER 4",
      intentSummary: hasRealProperty
        ? `Needs Zoning & Land Researcher for ${propTitle}`
        : "Needs Zoning & Land Researcher · Layer 4 Professional Audit",
    };
  }

  if (role === "provider") {
    return {
      targetRole: "provider",
      sourceLayer: "layer_4_professionals",
      intentBadge: "NEEDS CREATOR · LAYER 4",
      intentSummary: hasRealProperty
        ? `Needs Layer 4 Professional for ${propTitle}`
        : "Needs Layer 4 Professional Service",
    };
  }

  if (role === "operator") {
    return {
      targetRole: "operator",
      sourceLayer: row?.open_gate_inbound ? "open_gate" : "property_unit",
      intentBadge: "FOR OPERATOR · UNIT INQUIRY",
      intentSummary: propTitle
        ? `Wants Delegated Unit: ${propTitle} (For Operator)`
        : "Delegated Unit Inquiry · For Operator Lens",
    };
  }

  if (role === "broker" || role === "salesperson") {
    if (row?.routing_snapshot?.recipient_type === "community_signal") {
      return {
        targetRole: "broker",
        sourceLayer: "community_signal",
        intentBadge: "FOR BROKER · SIGNAL RESPONSE",
        intentSummary: propTitle
          ? `Community Signal: ${propTitle}`
          : "Community Signal Connection",
      };
    }
    return {
      targetRole: "broker",
      sourceLayer: row?.open_gate_inbound ? "open_gate" : "broker_representation",
      intentBadge: "FOR BROKER · PROPERTY / MANDATE",
      intentSummary: propTitle
        ? `Wants Property via Broker: ${propTitle}`
        : "Accredited Broker Representation Inquiry",
    };
  }

  if (serviceRole === "photographer") {
    return {
      targetRole: "photographer",
      sourceLayer: "layer_4_professionals",
      intentBadge: "SEEKER → PHOTOGRAPHER",
      intentSummary: `You requested Spatial Photographer${hasRealProperty ? ` for ${propTitle}` : ""}`,
    };
  }
  if (serviceRole === "designer") {
    return {
      targetRole: "designer",
      sourceLayer: "layer_4_professionals",
      intentBadge: "SEEKER → DESIGNER",
      intentSummary: `You requested Event & Concept Designer${hasRealProperty ? ` for ${propTitle}` : ""}`,
    };
  }
  if (serviceRole === "researcher") {
    return {
      targetRole: "researcher",
      sourceLayer: "layer_4_professionals",
      intentBadge: "SEEKER → RESEARCHER",
      intentSummary: `You requested Zoning & Land Researcher${hasRealProperty ? ` for ${propTitle}` : ""}`,
    };
  }

  return {
    targetRole: serviceRole || "owner",
    sourceLayer: "property_listing",
    intentBadge: "YOUR PROPERTY INQUIRY",
    intentSummary: propTitle
      ? `You inquired about Property: ${propTitle}`
      : "Your Outgoing Property Inquiry",
  };
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
