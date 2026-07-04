import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Lists every deal the current user is a party to (as buyer, broker, or
// property owner) for the Inbox. The existing DashboardContext.js deals
// fetch pulls ALL deals client-side with no filter and relies on RLS alone
// -- this route does the party-membership check server-side instead (same
// auth pattern as /api/deals/[id]/messages), so it's additive/parallel, not
// a replacement for that existing (separately flagged) mechanism.

async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  if (mockOwnerId === "master-dev") return "master-dev";
  return null;
}

// No updated_at column on deals (yet) -- sort order is derived from
// created_at + latest message timestamp instead, computed below.
const DEAL_FIELDS = "id, status, pitch_message, private_notes, buyer_id, broker_id, unit_id, created_at, closed_at, expires_at, properties(id, title, slug, owner_id)";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const mockOwnerId = searchParams.get("mockOwnerId");
    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Three angles a user can be a party to a deal from -- merged and
    // deduped below. No FK from buyer_id/broker_id/owner_id to a users
    // table (they're plain text columns), so this can't be one query with
    // an embedded join filter on the owner side; run it separately instead.
    const [asBuyer, asBroker, asOwner] = await Promise.all([
      supabaseAdmin.from("deals").select(DEAL_FIELDS).eq("buyer_id", userId),
      supabaseAdmin.from("deals").select(DEAL_FIELDS).eq("broker_id", userId),
      supabaseAdmin.from("deals").select(DEAL_FIELDS).eq("properties.owner_id", userId).not("properties", "is", null),
    ]);

    const failed = [asBuyer, asBroker, asOwner].find((r) => r.error);
    if (failed) {
      console.error("[DEALS API] GET error:", failed.error);
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

    const byId = new Map();
    for (const row of [...(asBuyer.data || []), ...(asBroker.data || []), ...(asOwner.data || [])]) {
      // The owner-side query embeds properties via an inner-filtered join;
      // rows where the filter didn't match come back with properties: null
      // from Supabase's left-join default -- skip those defensively.
      if (row.properties?.owner_id === userId || row.buyer_id === userId || row.broker_id === userId) {
        byId.set(row.id, row);
      }
    }

    const deals = [...byId.values()];

    // Best-effort display names for the "other party" -- these id columns
    // aren't real FKs so this is a manual lookup, not an embedded join.
    const otherPartyIds = new Set();
    for (const d of deals) {
      if (d.buyer_id && d.buyer_id !== userId) otherPartyIds.add(d.buyer_id);
      if (d.broker_id && d.broker_id !== userId) otherPartyIds.add(d.broker_id);
      if (d.properties?.owner_id && d.properties.owner_id !== userId) otherPartyIds.add(d.properties.owner_id);
    }

    let namesById = {};
    if (otherPartyIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name")
        .in("id", [...otherPartyIds]);
      namesById = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
    }

    // Last message + unread count + last-activity time per deal, one query
    // for all deals at once. Deals has no updated_at column, so "most recent
    // conversation first" is derived here from message timestamps instead.
    const dealIds = deals.map((d) => d.id);
    let lastMessageByDeal = {};
    let lastActivityByDeal = {};
    let unreadByDeal = {};
    if (dealIds.length > 0) {
      const { data: messages } = await supabaseAdmin
        .from("deal_messages")
        .select("deal_id, sender_id, body, created_at, read_at")
        .in("deal_id", dealIds)
        .order("created_at", { ascending: true });
      for (const m of messages || []) {
        lastMessageByDeal[m.deal_id] = m.body;
        lastActivityByDeal[m.deal_id] = m.created_at;
        if (m.sender_id !== userId && !m.read_at) {
          unreadByDeal[m.deal_id] = (unreadByDeal[m.deal_id] || 0) + 1;
        }
      }
    }

    const result = deals
      .map((d) => {
        const myRole = d.buyer_id === userId ? "buyer" : d.broker_id === userId ? "broker" : "owner";
        const otherId = myRole === "buyer" ? (d.broker_id || d.properties?.owner_id) : myRole === "broker" ? d.properties?.owner_id : (d.broker_id || d.buyer_id);
        const otherRoleLabel = myRole === "buyer" ? (d.broker_id ? "Broker" : "Owner") : myRole === "broker" ? "Owner" : (d.broker_id ? "Broker" : "Buyer");
        return {
          id: d.id,
          status: d.status,
          propertyId: d.properties?.id || null,
          propertyTitle: d.properties?.title || "Untitled Property",
          propertySlug: d.properties?.slug || null,
          myRole,
          otherParty: otherId ? (namesById[otherId] || otherRoleLabel) : otherRoleLabel,
          lastMessage: lastMessageByDeal[d.id] || d.pitch_message || "",
          unreadCount: unreadByDeal[d.id] || 0,
          createdAt: d.created_at,
          lastActivityAt: lastActivityByDeal[d.id] || d.created_at,
          closedAt: d.closed_at,
          expiresAt: d.expires_at,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error("[DEALS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
