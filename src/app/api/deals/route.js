import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { isIdentityPublic, counterpartyDisplayName } from "@/lib/identityDisclosure";
import { deriveMyRole, loadDealMessageActivity, loadUserDealRows } from "@/lib/deals/userDeals";
import { isManualCreatableStatus } from "@/lib/deals/dealStatus";
import { isBlocked } from "@/lib/connectBlocks";
import { checkReceiverGate } from "@/lib/connectGates";

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
    const { rows: deals, error: dealsError, routedRecipients = [] } = await loadUserDealRows(supabaseAdmin, userId);
    if (dealsError === "routing_unavailable") {
      return NextResponse.json({ error: "Failed to load routed conversations" }, { status: 503 });
    }
    if (dealsError) {
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

    // Best-effort display names for the "other party" -- these id columns
    // aren't real FKs so this is a manual lookup, not an embedded join.
    // The buyer deal stores no broker_id when a roster receives it. Use the
    // immutable routing snapshot to name a directed broker, never the owner.
    const routedBrokerByDeal = new Map();
    const routedOperatorByDeal = new Map();
    for (const recipient of routedRecipients) {
      if (recipient.recipient_type === "operator" && !routedOperatorByDeal.has(recipient.deal_id)) {
        routedOperatorByDeal.set(recipient.deal_id, recipient.recipient_id);
      }
      if (recipient.recipient_type === "broker" && !routedBrokerByDeal.has(recipient.deal_id)) {
        routedBrokerByDeal.set(recipient.deal_id, recipient.recipient_id);
      }
    }
    const otherPartyIds = new Set();
    for (const d of deals) {
      if (d.buyer_id && d.buyer_id !== userId) otherPartyIds.add(d.buyer_id);
      if (d.broker_id && d.broker_id !== userId) otherPartyIds.add(d.broker_id);
      if (routedOperatorByDeal.has(d.id) && routedOperatorByDeal.get(d.id) !== userId) otherPartyIds.add(routedOperatorByDeal.get(d.id));
      if (routedBrokerByDeal.has(d.id) && routedBrokerByDeal.get(d.id) !== userId) otherPartyIds.add(routedBrokerByDeal.get(d.id));
      if (d.properties?.owner_id && d.properties.owner_id !== userId) otherPartyIds.add(d.properties.owner_id);
    }

    let namesById = {};
    let publicById = {};
    if (otherPartyIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, is_profile_public")
        .in("id", [...otherPartyIds]);
      namesById = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
      // The privacy flag travels with the name so the disclosure rule below can
      // ask about it. Fetching the name without it is what made the leak
      // possible: the value was always available, nothing consulted it.
      publicById = Object.fromEntries((profiles || []).map((p) => [p.id, isIdentityPublic(p)]));
    }

    // Deals has no updated_at column, so "most recent conversation first" is
    // derived from message timestamps instead.
    const { lastMessageByDeal, lastActivityByDeal, unreadByDeal } =
      await loadDealMessageActivity(supabaseAdmin, deals.map((d) => d.id), userId);

    const result = deals
      .map((d) => {
        const myRole = routedOperatorByDeal.get(d.id) === userId ? "operator" : deriveMyRole(d, userId);
        const otherId = myRole === "buyer" ? (d.broker_id || routedOperatorByDeal.get(d.id) || routedBrokerByDeal.get(d.id) || d.properties?.owner_id) : myRole === "broker" ? (d.buyer_id || d.properties?.owner_id) : (d.broker_id || d.buyer_id);
        const otherRoleLabel = myRole === "buyer" ? (routedOperatorByDeal.has(d.id) ? "Operator" : (d.broker_id || routedBrokerByDeal.has(d.id)) ? "Broker" : "Owner") : myRole === "broker" ? (d.buyer_id ? "Buyer" : "Owner") : (d.broker_id ? "Broker" : "Buyer");
        return {
          id: d.id,
          status: d.status,
          propertyId: d.properties?.id || null,
          propertyTitle: d.properties?.title || "Untitled Property",
          propertySlug: d.properties?.slug || null,
          propertyPrice: d.properties?.price ?? null,
          myRole,
          // A pending Connect is anonymous: the recipient learns the intent and
          // the tier, not the identity (§38.3). Acceptance is the act that
          // reveals a name; the handshake later reveals contact details. This
          // used to hand out the real display name to whoever asked, with no
          // check on status and no check on the person's own privacy setting —
          // so the Inbox list showed the very name the panel beside it promised
          // to withhold.
          // A-148: a sender's explicit per-request anonymity ("Anonymous",
          // the owner's word) conceals the sender from the recipient while
          // unanswered — never the recipient from the sender. Only
          // buyer-initiated rows can carry the flag (the inquiry modals), so
          // it applies exactly when the viewer is not the buyer.
          otherParty: counterpartyDisplayName({
            dealStatus: d.status,
            counterpartyIsPublic: otherId ? publicById[otherId] === true : false,
            senderAnonymous: myRole !== "buyer" && d.sender_anonymous === true,
            name: otherId ? namesById[otherId] : "",
            roleLabel: otherRoleLabel,
          }),
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
          open_gate_inbound: d.open_gate_inbound === true,
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
    // A-144 §10.10: a manual send starts a request — it cannot manufacture an
    // accepted/connected/closed relationship from a client string. Rejected
    // BEFORE any spend so a forged outcome never costs a Connect.
    const requestedStatus = status || "pending";
    if (!isManualCreatableStatus(requestedStatus)) {
      return NextResponse.json(
        { error: "Manual deals start as pending or invited. No Connect was spent." },
        { status: 400 },
      );
    }
    // A-144 §10.10: resolve a real recipient before spending. The field
    // carries a user UUID (see NewDealModal); anything else fails here with
    // 0 spent instead of stranding a debit on a failed insert.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(otherPartyEmail)) {
      return NextResponse.json(
        { error: "Unknown recipient. Use the person's user UUID. No Connect was spent." },
        { status: 400 },
      );
    }
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("id", otherPartyEmail)
      .maybeSingle();
    if (recipientError || !recipientProfile) {
      return NextResponse.json(
        { error: "Recipient account not found. No Connect was spent." },
        { status: 404 },
      );
    }
    if (otherPartyEmail === userId) {
      return NextResponse.json(
        { error: "You cannot open a deal with yourself. No Connect was spent." },
        { status: 400 },
      );
    }
    // A-144 shared send gates: blocked / paused / capped recipients fail
    // before any spend.
    if (await isBlocked(supabaseAdmin, userId, otherPartyEmail)) {
      return NextResponse.json(
        { error: "This request can't be sent. No Connect was spent." },
        { status: 403 },
      );
    }
    const manualGate = await checkReceiverGate(supabaseAdmin, otherPartyEmail, property.id);
    if (!manualGate.ok) {
      return NextResponse.json(
        { error: manualGate.message || "This account isn't accepting new Connects right now. No Connect was spent." },
        { status: 403 },
      );
    }
    // A-144: manual deal creation is a paid Connect action, not a free write.
    // Spend FIRST so a failed payment never leaves a phantom conversation.
    // Legacy per-user wallet stays authoritative (owner decision, A-144).
    const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: 'Manual deal created from dashboard',
      p_ref_type: 'manual_deal',
      p_ref_id: property.id,
    });
    if (spendError) {
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("deals")
      .insert({
        status: requestedStatus,
        pitch_message: initialMessage || "",
        buyer_id: otherPartyEmail,
        broker_id: isOwner ? null : userId,
        property_id: property.id,
        connects_spent: 1,
      })
      .select("*, properties(id, title, slug, owner_id)")
      .single();

    if (error) {
      // A-144 §10.10: a failed insert must not strand the debit — refund it
      // as a platform error (same pattern as the A-148 anonymity rollback).
      console.error("[DEALS API] POST error:", error);
      await supabaseAdmin.rpc('refund_connects_system_error', {
        p_user_id: userId,
        p_amount: 1,
        p_reason: 'Manual deal insert failed after spend',
        p_staff_id: 'system',
        p_ref_id: property.id,
      });
      return NextResponse.json({ error: "Failed to create deal. No Connect was spent." }, { status: 500 });
    }
    const manualBalance = spendData?.[0]?.total_balance ?? null;
    if (manualBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: manualBalance }).eq('id', userId);
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
