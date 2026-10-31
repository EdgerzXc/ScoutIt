// ═══════════════════════════════════════════════════════════════
// TWO-SIDED TRANSACTION HANDSHAKE & RATINGS API (ACQ-03 & Wave 3)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { logActivity } from "@/lib/crmActivity";
import { SIGNAL_STATUSES } from "@/lib/communityPosting";
import { isRoutedDealRecipient } from "@/lib/dealParty";

/**
 * POST /api/deals/handshake
 * Executes or updates a two-sided transaction handshake on a deal.
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to complete deal handshake" },
        { status: 401 }
      );
    }

    // ── 18+ legal capacity (§34.2, §48) ──
    // A handshake exchanges real contact details between two parties. Of
    // everything ScoutIt does, this is the one that most needs a capacitated
    // adult on both ends.
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { error: "You must confirm you are 18 or older before exchanging contact details." },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { dealId, action = "sign" } = body;

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid dealId" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // ── Ownership & Party verification before any action (§1.0B) ──
    // This route runs under the service role, which bypasses RLS. Without
    // an explicit party check, `dealId` alone was enough for any signed-in
    // user to sign or decline handshakes on the platform. Read the deal first
    // and confirm the caller is actually an authorized party to it.
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, buyer_id, broker_id, property_id, status")
      .eq("id", dealId)
      .maybeSingle();

    if (dealError) {
      return NextResponse.json(
        { error: sanitizeError(dealError, "Could not verify deal.") },
        { status: 500 }
      );
    }

    let isParty = Boolean(
      deal && (deal.buyer_id === userId || deal.broker_id === userId)
    );

    let propertyOwnerId = null;
    if (deal && !isParty && deal.property_id) {
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("owner_id")
        .eq("id", deal.property_id)
        .maybeSingle();
      if (prop && prop.owner_id === userId) {
        isParty = true;
      }
      propertyOwnerId = prop?.owner_id || null;
    } else if (deal?.property_id) {
      // Retain owner_id for self-dealing checks
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("owner_id")
        .eq("id", deal.property_id)
        .maybeSingle();
      propertyOwnerId = prop?.owner_id || null;
    }

    if (deal && !isParty) {
      const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);
      if (isRoutedRecipient) {
        isParty = true;
      }
    }

    // Same response for "no such deal" and "not your deal" so the endpoint
    // cannot be used to enumerate deal IDs.
    if (!deal || !isParty) {
      return NextResponse.json(
        { error: "You are not a party to this deal." },
        { status: 403 }
      );
    }

    // Invariant: Self-dealing guard. A party cannot conduct a two-sided handshake with themselves.
    const sellerPartyId = deal.broker_id || propertyOwnerId;
    if (deal.buyer_id && sellerPartyId && deal.buyer_id === sellerPartyId) {
      return NextResponse.json(
        { error: "Invalid deal: Senders cannot conduct a bilateral handshake with themselves." },
        { status: 409 }
      );
    }

    if (deal.status && ["declined", "withdrawn", "closed", "reported"].includes(deal.status)) {
      return NextResponse.json(
        { error: `Cannot execute handshake on a ${deal.status} deal.` },
        { status: 409 }
      );
    }

    if (action === "sign") {
      // If caller is party B (recipient side), heal or align party_b_id on pending handshakes
      // so routed brokers or operators can complete the signature seamlessly.
      if (userId !== deal.buyer_id) {
        try {
          const { data: existingHandshake } = await supabaseAdmin
            .from("deal_handshakes")
            .select("id, party_b_id, party_b_signed_at, status")
            .eq("deal_id", dealId)
            .eq("handshake_type", "transaction_handshake")
            .maybeSingle();

          if (existingHandshake && existingHandshake.status === "pending" && !existingHandshake.party_b_signed_at) {
            if (existingHandshake.party_b_id !== userId) {
              await supabaseAdmin
                .from("deal_handshakes")
                .update({ party_b_id: userId, updated_at: new Date().toISOString() })
                .eq("id", existingHandshake.id);
            }
          }
        } catch {
          // Non-fatal if table unmigrated
        }
      }

      const { data, error } = await supabaseAdmin.rpc(
        "complete_transaction_handshake",
        {
          p_deal_id: dealId,
          p_user_id: userId,
        }
      );

      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not complete handshake.") },
          { status: 500 }
        );
      }

      const result = Array.isArray(data) ? data[0] : data;
      // A-240: If the mutually attested handshake completed, fulfill the originating demand signal if any
      if (result?.rating_updated || result?.handshake_status === "completed") {
        try {
          const { data: dealRow } = await supabaseAdmin
            .from("deals")
            .select("routing_snapshot")
            .eq("id", dealId)
            .maybeSingle();
          const signalId = dealRow?.routing_snapshot?.signal_id;
          if (signalId) {
            const nowIso = new Date().toISOString();
            await supabaseAdmin
              .from("stratosphere_signals")
              .update({
                status: SIGNAL_STATUSES.FULFILLED,
                fulfilled_at: nowIso,
                updated_at: nowIso,
              })
              .eq("id", signalId);
          }
        } catch {
          // Non-fatal if table/columns unmigrated
        }
      }
      // A-144 §14 audit: the handshake is the contact-reveal act (acceptance
      // revealed the name; this reveals contact). Store only what is
      // operationally necessary — who, which deal, when — never the contact
      // payload itself.
      try {
        await logActivity(supabaseAdmin, {
          dealId,
          activityType: "status_change",
          actorId: userId,
          metadata: { analytics_event: "identity_revealed", reveal_type: "handshake_contact", at: new Date().toISOString() },
        });
      } catch { /* audit-best-effort: never fail the handshake on logging */ }
      return NextResponse.json({
        success: result?.success ?? true,
        status: result?.handshake_status || "pending",
        ratingUpdated: result?.rating_updated ?? false,
        analytics_event: "identity_revealed",
        message: result?.rating_updated
          ? "Handshake completed! Scout Rating incremented."
          : "Handshake signature recorded. Awaiting second party.",
      });
    }

    if (action === "decline") {
      const { error } = await supabaseAdmin
        .from("deal_handshakes")
        .update({ status: "declined", updated_at: new Date().toISOString() })
        .eq("deal_id", dealId)
        .eq("status", "pending");

      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not decline handshake.") },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        status: "declined",
        message: "Deal handshake declined.",
      });
    }

    return NextResponse.json(
      { error: "Invalid handshake action" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[DEAL HANDSHAKE API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not process handshake request.") },
      { status: 500 }
    );
  }
}
