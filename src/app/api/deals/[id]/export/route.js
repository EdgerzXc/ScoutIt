import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { writeAuditLog } from "@/lib/auditTrail";
import { createRateLimiter } from "@/lib/rateLimit";
import { buildTranscript, transcriptFilename } from "@/lib/conversationExport";

export const dynamic = "force-dynamic";

// ═══════════════════════════════════════════════════════════════
// DOWNLOAD YOUR OWN CONVERSATION (A-043)
// ═══════════════════════════════════════════════════════════════
//
// ScoutIt keeps message bodies for seven days after a deal closes and then
// overwrites them, on the stated understanding that each party keeps their
// own copy. Verified 2026-08-27: nothing in the application could produce
// one. So the promise as implemented destroyed the record for everybody,
// the two people who wrote it included.
//
// ── THE GUARD THAT MATTERS ───────────────────────────────────────
// ChatBox decides whether to unmask contact details from `deal.handshakeState`
// — React state, set by the client. That is fine on screen, because the
// screen is not a boundary. It would NOT be fine here: a route that accepted
// the same input would let either party unmask their counterparty's phone
// number and email before the two-sided handshake, simply by asking for a
// download. `contactRevealed` is therefore read from `deal_handshakes` and
// from nowhere else (Rule 5 — a gate the client evaluates is a suggestion).
//
// ── SCOPE ────────────────────────────────────────────────────────
// One thread, by id, for a party to it. There is deliberately no route that
// exports several conversations: bulk export is a different risk with a
// different answer, and this is not it.

// A person exports their own thread occasionally — before a deadline, or when
// something has gone wrong. Ten an hour is generous for that and still caps
// how much a compromised session can pull down per warm instance.
const checkExportRate = createRateLimiter({ limit: 10, windowMs: 60 * 60 * 1000 });

/**
 * The handshake is complete when the database says so: either the status the
 * `complete_transaction_handshake` function writes, or both signature
 * timestamps present. Both are checked because the status is the derived
 * value and the timestamps are the fact.
 */
function handshakeIsComplete(handshake) {
  if (!handshake) return false;
  if (handshake.status === "completed") return true;
  return Boolean(handshake.party_a_signed_at && handshake.party_b_signed_at);
}

export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!checkExportRate(userId).allowed) {
      return NextResponse.json(
        { error: "Too many downloads. Try again in a little while." },
        { status: 429 },
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Downloads are unavailable" }, { status: 503 });
    }

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, status, created_at, closed_at, buyer_id, broker_id, properties(title, owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // The same party test the close and dispute routes apply. A second
    // definition of "party to this deal" is a second thing that can drift.
    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);
    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [{ data: handshake }, messagesResult] = await Promise.all([
      supabaseAdmin
        .from("deal_handshakes")
        .select("status, party_a_signed_at, party_b_signed_at")
        .eq("deal_id", dealId)
        .eq("handshake_type", "transaction_handshake")
        .maybeSingle(),
      supabaseAdmin
        .from("deal_messages")
        .select("sender_id, sender_role, body, created_at")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: true }),
    ]);

    if (messagesResult.error) {
      return NextResponse.json({ error: "Could not read this conversation" }, { status: 503 });
    }

    const contactRevealed = handshakeIsComplete(handshake);

    // Display names for whoever is actually on this thread. These id columns
    // are plain text, not foreign keys, so this is a manual lookup.
    const partyIds = [
      deal.buyer_id && { id: deal.buyer_id, role: "buyer" },
      deal.broker_id && { id: deal.broker_id, role: "broker" },
      deal.properties?.owner_id && { id: deal.properties.owner_id, role: "owner" },
    ].filter(Boolean);

    let namesById = {};
    if (partyIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name")
        .in("id", partyIds.map((p) => p.id));
      namesById = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
    }

    const participants = partyIds.map((p) => ({
      id: p.id,
      role: p.role,
      name: namesById[p.id] || null,
    }));

    const exportedAt = new Date().toISOString();
    const transcript = buildTranscript({
      deal: {
        id: deal.id,
        propertyTitle: deal.properties?.title || null,
        status: deal.status,
        createdAt: deal.created_at,
        closedAt: deal.closed_at,
      },
      messages: messagesResult.data || [],
      participants,
      exporterId: userId,
      contactRevealed,
      exportedAt,
    });

    // Non-blocking, but never silent — see lib/auditTrail.js.
    await writeAuditLog(supabaseAdmin, {
      action: "deal_conversation_exported",
      tableName: "deals",
      recordId: dealId,
      userId,
      resourceType: "deal",
      metadata: {
        exported_at: exportedAt,
        message_count: (messagesResult.data || []).length,
        contact_revealed: contactRevealed,
      },
    });

    return new NextResponse(transcript, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${transcriptFilename(deal, exportedAt)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
