import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { DELETE_AFTER_DAYS } from "@/lib/pendingRequestLifecycle";

// ═══════════════════════════════════════════════════════════════
// UNARCHIVE A PENDING REQUEST — and reset both clocks
// NEW_IDEAS.md §40.15
// ═══════════════════════════════════════════════════════════════
//
// This is the "extend" the owner asked for. Pulling a request back out of the
// archive sets pending_clock_reset_at = now(), which restarts BOTH deadlines
// from zero: 7 days to re-archive, 30 days to deletion.
//
// One timestamp drives both, so they cannot drift apart. Resetting a single
// clock of two would be exactly the bug this operation is most likely to
// expose.
//
// Either party may do it. The recipient unarchives because they finally have
// time to deal with it; the sender unarchives to keep a lead alive with
// someone they know is slow. Both are legitimate, and neither can be abused:
// unarchiving buys attention, not money — no Connects move, and the request
// still has to be accepted to become a conversation.

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 503 });
    }

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("status, archived_at, property_id, buyer_id, broker_id, properties(owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      (await isRoutedDealRecipient(supabaseAdmin, dealId, userId));

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Only a still-pending request has clocks to reset. A deleted one is gone
    // and must NOT be resurrectable from the UI — that would turn deletion
    // into a soft state users could undo, which is not what was promised.
    if (deal.status !== "pending") {
      return NextResponse.json(
        { error: "This request is no longer open." },
        { status: 409 },
      );
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("deals")
      .update({ archived_at: null, pending_clock_reset_at: now })
      .eq("id", dealId)
      .eq("status", "pending");

    if (updateError) {
      console.error("[UNARCHIVE] Failed:", updateError);
      return NextResponse.json({ error: "Couldn't reopen this request." }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: deal.property_id,
      activityType: "status_change",
      actorId: userId,
      metadata: { from: "pending_archived", to: "pending", reason: "unarchived_clock_reset" },
    });

    return NextResponse.json({
      success: true,
      archived_at: null,
      pending_clock_reset_at: now,
      daysUntilDeletion: DELETE_AFTER_DAYS,
    });
  } catch (err) {
    console.error("[UNARCHIVE] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
