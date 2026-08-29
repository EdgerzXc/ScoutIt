import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { deriveMyRole, loadDealMessageActivity, loadUserDealRows } from "@/lib/deals/userDeals";

export const dynamic = "force-dynamic";

// Lists every deal the current user is a party to (as buyer, broker, or
// property owner) for the Inbox. The existing DashboardContext.js deals
// fetch pulls ALL deals client-side with no filter and relies on RLS alone
// -- this route does the party-membership check server-side instead (same
// auth pattern as /api/deals/[id]/messages), so it's additive/parallel, not
// a replacement for that existing (separately flagged) mechanism.


export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Party membership is an authorization decision and lives in
    // lib/deals/userDeals.js so the dashboard attention rail asks the same
    // question of the same code rather than re-deriving the answer.
    const { rows: deals, error: dealsError } = await loadUserDealRows(supabaseAdmin, userId);
    if (dealsError === "routing_unavailable") {
      return NextResponse.json({ error: "Failed to load routed conversations" }, { status: 503 });
    }
    if (dealsError) {
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

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

    // Deals has no updated_at column, so "most recent conversation first" is
    // derived from message timestamps instead.
    const { lastMessageByDeal, lastActivityByDeal, unreadByDeal } =
      await loadDealMessageActivity(supabaseAdmin, deals.map((d) => d.id), userId);

    const result = deals
      .map((d) => {
        const myRole = deriveMyRole(d, userId);
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
          // NULL for every row created before 2026-08-05 (§40.14). Passed
          // through as-is so the UI can tell "cost nothing" apart from "we
          // never wrote it down" — it renders the badge only for real numbers.
          connects_spent: d.connects_spent ?? null,
          // §40.15 lifecycle. archived_at NULL = not archived; the reset
          // timestamp is the single origin both the 7-day and 30-day
          // deadlines are measured from, so the client never computes one.
          archivedAt: d.archived_at ?? null,
          pendingClockResetAt: d.pending_clock_reset_at ?? null,
          private_notes: d.private_notes,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error("[DEALS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
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
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
