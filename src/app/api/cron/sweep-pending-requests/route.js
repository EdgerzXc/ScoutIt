import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { ARCHIVE_AFTER_DAYS, DELETE_AFTER_DAYS } from "@/lib/pendingRequestLifecycle";
import { authorizeCronRequest } from "@/lib/cronAuth";

// ═══════════════════════════════════════════════════════════════
// PENDING REQUEST SWEEP — 7-day archive, 30-day delete
// NEW_IDEAS.md §40.15
// ═══════════════════════════════════════════════════════════════
//
//   sent → 7 days unanswered → ARCHIVED (still fully acceptable)
//        → 30 days unanswered → DELETED
//   Unarchiving before day 30 resets both clocks (see /api/deals/[id]/unarchive).
//
// ⚠️ THIS IS NOT THE 72-HOUR EXPIRY RETURNING. §40.14 removed that on the
// grounds that a timer measures how busy an owner was, not their interest.
// Archiving respects that: it hides a request, it does not cancel one. An
// owner who opens their archive on day 20 can still accept, and the
// conversation proceeds as though nothing happened. Only a full month of
// genuine silence ends it.
//
// ⚠️ NO REFUNDS on either step. Still locked (§38.3). Deletion after a month
// of silence is not ScoutIt failing to deliver — the request was delivered,
// sat visible for 30 days, and was archived with a warning in between.
//
// Runs daily (vercel.json). Daily is genuinely sufficient here, unlike the
// old 72h job: a boundary measured in days does not need hourly precision,
// and a request archived a few hours late costs nobody anything.

const BATCH_LIMIT = 200;

const daysAgoIso = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export async function GET(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server error: missing service role configuration" },
      { status: 500 },
    );
  }

  try {
    // ── STEP 1: DELETE FIRST, ARCHIVE SECOND ────────────────────────────
    // Order matters. Archiving first would stamp archived_at on a row that
    // is about to be deleted in the same run, producing a pointless "your
    // request was archived" notification moments before it disappears.
    const deleted = await sweepDeletions();
    const archived = await sweepArchives();

    return NextResponse.json({
      archived: archived.count,
      deleted: deleted.count,
      archiveAfterDays: ARCHIVE_AFTER_DAYS,
      deleteAfterDays: DELETE_AFTER_DAYS,
      batchCapped: archived.capped || deleted.capped,
    });
  } catch (err) {
    console.error("[SWEEP CRON] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

async function sweepDeletions() {
  const { data: stale, error } = await supabaseAdmin
    .from("deals")
    .select("id, buyer_id, property_id, properties(title)")
    .eq("status", "pending")
    .lt("pending_clock_reset_at", daysAgoIso(DELETE_AFTER_DAYS))
    .limit(BATCH_LIMIT);

  if (error) throw error;
  if (!stale?.length) return { count: 0, capped: false };

  // Soft delete. The row survives because deals.id is referenced by
  // connect_transactions (the money ledger), deal_routing_recipients and the
  // CRM activity log — hard-deleting would orphan a real financial record to
  // tidy an inbox. pitch_message is blanked so the content is genuinely gone
  // from both users' views, which is what "deleted" has to mean to a person.
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("deals")
    .update({ status: "deleted", pitch_message: null, closed_at: new Date().toISOString() })
    .in("id", stale.map((d) => d.id))
    .eq("status", "pending") // re-guard: someone may have accepted mid-sweep
    .select("id");

  if (updErr) throw updErr;
  const done = new Set((updated || []).map((d) => d.id));

  for (const deal of stale) {
    if (!done.has(deal.id)) continue;
    const title = deal.properties?.title || "a property";
    if (deal.buyer_id) {
      await notifyUser(supabaseAdmin, {
        userId: deal.buyer_id,
        title: "Request closed after 30 days",
        desc: `Your request about "${title}" went unanswered for ${DELETE_AFTER_DAYS} days and has been removed. Connects are spent on sending and aren't returned.`,
        icon: "🗑️",
        propertyId: deal.property_id,
        notificationType: "request_deleted",
      });
    }
    await logActivity(supabaseAdmin, {
      dealId: deal.id,
      propertyId: deal.property_id,
      activityType: "status_change",
      actorId: null, // system
      metadata: { from: "pending", to: "deleted", reason: `unanswered_${DELETE_AFTER_DAYS}d`, refunded: false },
    });
  }

  return { count: done.size, capped: stale.length === BATCH_LIMIT };
}

async function sweepArchives() {
  const { data: stale, error } = await supabaseAdmin
    .from("deals")
    .select("id, buyer_id, broker_id, property_id, properties(title, owner_id)")
    .eq("status", "pending")
    .is("archived_at", null)
    .lt("pending_clock_reset_at", daysAgoIso(ARCHIVE_AFTER_DAYS))
    .limit(BATCH_LIMIT);

  if (error) throw error;
  if (!stale?.length) return { count: 0, capped: false };

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabaseAdmin
    .from("deals")
    .update({ archived_at: now })
    .in("id", stale.map((d) => d.id))
    .eq("status", "pending")
    .is("archived_at", null)
    .select("id");

  if (updErr) throw updErr;
  const done = new Set((updated || []).map((d) => d.id));

  const daysLeft = DELETE_AFTER_DAYS - ARCHIVE_AFTER_DAYS;

  for (const deal of stale) {
    if (!done.has(deal.id)) continue;
    const title = deal.properties?.title || "a property";

    // BOTH sides are told, and this is the point of archiving rather than
    // expiring: the recipient gets a last, explicit chance to act while the
    // request is still perfectly acceptable.
    const recipientId = deal.broker_id || deal.properties?.owner_id;
    if (recipientId) {
      await notifyUser(supabaseAdmin, {
        userId: recipientId,
        title: "A request is waiting in your archive",
        desc: `A Connect request about "${title}" has been unanswered for ${ARCHIVE_AFTER_DAYS} days and moved to your archive. You can still accept it — it stays there for another ${daysLeft} days.`,
        icon: "📥",
        propertyId: deal.property_id,
        notificationType: "request_archived",
      });
    }
    if (deal.buyer_id) {
      await notifyUser(supabaseAdmin, {
        userId: deal.buyer_id,
        title: "Request moved to archive",
        desc: `Your request about "${title}" hasn't been answered in ${ARCHIVE_AFTER_DAYS} days. It's still open and they can still accept — it stays for another ${daysLeft} days.`,
        icon: "📥",
        propertyId: deal.property_id,
        notificationType: "request_archived",
      });
    }

    await logActivity(supabaseAdmin, {
      dealId: deal.id,
      propertyId: deal.property_id,
      activityType: "status_change",
      actorId: null,
      metadata: { from: "pending", to: "pending_archived", reason: `unanswered_${ARCHIVE_AFTER_DAYS}d` },
    });
  }

  return { count: done.size, capped: stale.length === BATCH_LIMIT };
}
