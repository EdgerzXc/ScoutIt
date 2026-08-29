import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { writeAuditLog } from "@/lib/auditTrail";
import {
  DISPUTE_HOLD_STATUSES,
  DISPUTE_REASONS,
  INITIAL_DISPUTE_STATUS,
  MAX_DISPUTE_DETAILS,
} from "@/lib/chatRetention";

// ═══════════════════════════════════════════════════════════════
// FILE A DISPUTE — the missing producer for `deal_disputes` (A-041)
// ═══════════════════════════════════════════════════════════════
//
// `deal_disputes` and the purge job's hold exemption both existed and were
// correct. Nothing in the application wrote a dispute row, so no hold was ever
// placed, so every closed thread's message bodies were replaced seven days
// after close regardless of what had happened in them. A party with evidence of
// fraud or harassment could not stop the only record of it being overwritten.
//
// The load-bearing property here is not that a dispute can be filed. It is that
// FILING PLACES THE HOLD IN THE SAME WRITE. A hold applied by a later call, or
// by a staff action once someone reads the queue, can lose a race with the
// nightly purge — and what it loses is precisely the evidence it existed to
// protect. There is therefore no code path that creates a dispute row without
// its hold.
//
// The status is INITIAL_DISPUTE_STATUS from the shared retention module, not a
// literal, so this route and the purge job cannot drift into disagreeing about
// what a hold is. A dispute written as "open" while the purge exempts
// "open_hold" would read correctly in both files and destroy the thread anyway.

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) =>
  NextResponse.json(body, { status, headers: PRIVATE_HEADERS });

/**
 * Is this caller a party to this deal? The same test the close, export and
 * filing paths apply — a second definition of "party" is a second thing that
 * can drift out of step with the first.
 */
async function loadDealForParty(dealId, userId) {
  const { data: deal, error } = await supabaseAdmin
    .from("deals")
    .select("id, status, closed_at, buyer_id, broker_id, properties(owner_id)")
    .eq("id", dealId)
    .single();

  if (error || !deal) return { deal: null, isParty: false };

  const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);
  const isParty =
    deal.buyer_id === userId ||
    deal.broker_id === userId ||
    deal.properties?.owner_id === userId ||
    isRoutedRecipient;

  return { deal, isParty };
}

// ═══════════════════════════════════════════════════════════════
// SEE THE STATE OF A DISPUTE ON THIS DEAL (A-045)
// ═══════════════════════════════════════════════════════════════
//
// A-045 requires confirmation that a dispute was filed and a way to see its
// state. The POST response cannot do that: it is gone on the next page load,
// and the moment a person most wants to check is days later.
//
// ── WHO IS TOLD WHAT, AND WHY IT IS NOT THE SAME ─────────────────
// A hold changes BOTH parties' conversation — it stops the thread being
// purged. So both are entitled to know it is under review, or the counterparty
// watches a closed conversation quietly refuse to disappear and is told
// nothing about why.
//
// The ground and the free-text detail are a different thing entirely: they are
// the reporter's account OF THE OTHER PERSON. Handing "I was abused or
// threatened" plus two thousand characters of explanation to the person it
// accuses is how a complaint becomes a retaliation risk. Those are returned to
// the reporter only, and the filtering happens HERE rather than in the
// component — a client that decides what to hide has already been sent it.
export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;

    const userId = await resolveUserId(request);
    if (!userId) return json({ error: "Unauthorized" }, 401);
    if (!supabaseAdmin) return json({ error: "Disputes are unavailable" }, 503);

    const { deal, isParty } = await loadDealForParty(dealId, userId);
    if (!deal) return json({ error: "Deal not found" }, 404);
    if (!isParty) return json({ error: "Forbidden" }, 403);

    const { data: rows, error: disputeError } = await supabaseAdmin
      .from("deal_disputes")
      .select("id, status, reason, details, reporter_id, hold_placed_at, resolved_at, created_at")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (disputeError) throw disputeError;

    const dispute = rows?.[0];
    if (!dispute) return json({ dispute: null });

    const onHold = DISPUTE_HOLD_STATUSES.includes(dispute.status);
    const isMine = dispute.reporter_id === userId;

    // Built by addition, never by deleting keys from the row. A payload
    // assembled by omission leaks the day someone adds a column.
    const shared = {
      status: dispute.status,
      onHold,
      isMine,
      filedAt: dispute.created_at,
      holdPlacedAt: dispute.hold_placed_at,
      resolvedAt: dispute.resolved_at,
    };

    return json({
      dispute: isMine
        ? { ...shared, id: dispute.id, reason: dispute.reason, details: dispute.details }
        : shared,
    });
  } catch (error) {
    return json({ error: sanitizeError(error) }, 500);
  }
}

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body = {};
    try {
      body = (await request.json()) || {};
    } catch {
      // An unparseable body is a missing reason, which is rejected below.
    }

    const reason = typeof body.reason === "string" ? body.reason.trim() : "";
    if (!DISPUTE_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: "A recognised dispute reason is required." },
        { status: 400 },
      );
    }

    const details = typeof body.details === "string" ? body.details.trim() : "";
    if (details.length > MAX_DISPUTE_DETAILS) {
      return NextResponse.json(
        { error: `Details must be ${MAX_DISPUTE_DETAILS} characters or fewer.` },
        { status: 400 },
      );
    }

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("id, buyer_id, broker_id, properties(owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    // The same party test the close route applies, routed recipient included.
    // A second definition of "party to this deal" is a second thing that can
    // drift out of step with the first.
    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);
    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // One open hold per deal is enough to protect the thread. A second would
    // extend nothing and gives a party a way to keep re-holding a conversation
    // indefinitely by filing repeatedly.
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("deal_disputes")
      .select("id, status")
      .eq("deal_id", dealId)
      .in("status", DISPUTE_HOLD_STATUSES)
      .limit(1);

    if (existingError) throw existingError;

    if (existing?.length) {
      return NextResponse.json({
        success: true,
        alreadyHeld: true,
        disputeId: existing[0].id,
        message: "This conversation is already under review and is protected from deletion.",
      });
    }

    const heldAt = new Date().toISOString();

    const { data: filed, error: insertError } = await supabaseAdmin
      .from("deal_disputes")
      .insert({
        deal_id: dealId,
        reporter_id: userId,
        reason,
        details: details || null,
        // Neither of the next two is ever read from the caller. A client that
        // could set `status` could file a dispute that is already resolved —
        // placing no hold while appearing to have filed one.
        status: INITIAL_DISPUTE_STATUS,
        hold_placed_at: heldAt,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    await writeAuditLog(supabaseAdmin, {
      action: "deal_dispute_filed",
      tableName: "deal_disputes",
      recordId: filed.id,
      userId,
      resourceType: "deal",
      metadata: { deal_id: dealId, reason, hold_placed_at: heldAt },
    });

    return NextResponse.json({
      success: true,
      disputeId: filed.id,
      message:
        "Dispute filed. This conversation is now protected from deletion while it is reviewed.",
    });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
