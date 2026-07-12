import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";

export const dynamic = "force-dynamic";

// Lists every deal the current user is a party to (as buyer, broker, or
// property owner) for the Inbox. The existing DashboardContext.js deals
// fetch pulls ALL deals client-side with no filter and relies on RLS alone
// -- this route does the party-membership check server-side instead (same
// auth pattern as /api/deals/[id]/messages), so it's additive/parallel, not
// a replacement for that existing (separately flagged) mechanism.



// No updated_at column on deals (yet) -- sort order is derived from
// created_at + latest message timestamp instead, computed below.
const DEAL_FIELDS = "id, status, pitch_message, private_notes, buyer_id, broker_id, unit_id, created_at, closed_at, expires_at, properties(id, title, slug, owner_id, price)";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
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
          propertyPrice: d.properties?.price ?? null,
          myRole,
          otherParty: otherId ? (namesById[otherId] || otherRoleLabel) : otherRoleLabel,
          otherPartyRole: otherRoleLabel, // "Broker" | "Buyer" | "Owner" — which template a UI card should use
          lastMessage: lastMessageByDeal[d.id] || d.pitch_message || "",
          pitch_message: d.pitch_message,
          unreadCount: unreadByDeal[d.id] || 0,
          createdAt: d.created_at,
          lastActivityAt: lastActivityByDeal[d.id] || d.created_at,
          closedAt: d.closed_at,
          expiresAt: d.expires_at,
          private_notes: d.private_notes,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error("[DEALS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

import { z } from "zod";
import { resolveUserId } from "@/lib/serverAuth";

const postSchema = z.object({
  propertyId: z.string(),
  otherPartyEmail: z.string(), // We use this as ID for simplicity
  status: z.string(),
  initialMessage: z.string().optional(),
  });

export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { propertyId, otherPartyEmail, status, initialMessage  } = parsed.data;
    const userId = await resolveUserId(request);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // The property decides the creator's role: if they own it, the other
    // party is the buyer; otherwise the creator is tracking this deal as the
    // broker and the other party is their buyer. (Previously this inserted
    // the creator as buyer_id of their own property — a self-deal that
    // pointed at nobody.)
    const { data: property, error: propError } = await supabaseAdmin
      .from("properties")
      .select("id, title, slug, owner_id")
      .eq("id", propertyId)
      .single();
    if (propError || !property) {
      return NextResponse.json({ error: "Property not found — use the Supabase property ID" }, { status: 404 });
    }

    const isOwner = property.owner_id === userId;
    const { data: inserted, error } = await supabaseAdmin
      .from("deals")
      .insert({
        status: status || "connected",
        pitch_message: initialMessage || "",
        buyer_id: otherPartyEmail,
        broker_id: isOwner ? null : userId,
        property_id: property.id,
      })
      .select("*, properties(id, title, slug, owner_id)")
      .single();

    if (error) {
      console.error("[DEALS API] POST error:", error);
      return NextResponse.json({ error: "Failed to create deal" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      dealId: inserted.id,
      propertyId: property.id,
      activityType: "deal_created",
      actorId: userId,
      metadata: { source: "manual", status: inserted.status },
    });

    // Format like the GET endpoint
    const deal = {
      id: inserted.id,
      status: inserted.status,
      propertyId: inserted.properties?.id || propertyId,
      propertyTitle: inserted.properties?.title || "Unknown Property",
      propertySlug: inserted.properties?.slug || null,
      myRole: isOwner ? "owner" : "broker",
      otherParty: otherPartyEmail || "Buyer",
      lastMessage: inserted.pitch_message || "",
      unreadCount: 0,
      createdAt: inserted.created_at,
      lastActivityAt: inserted.created_at,
      closedAt: inserted.closed_at,
      expiresAt: inserted.expires_at,
      private_notes: inserted.private_notes,
    };

    return NextResponse.json({ success: true, deal });
  } catch (err) {
    console.error("[DEALS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
