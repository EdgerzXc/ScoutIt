import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import {
  CHAT_RETENTION_DAYS,
  DISPUTE_HOLD_STATUSES,
  PURGED_BODY,
  retentionCutoffIso,
} from "@/lib/chatRetention";

// ═══════════════════════════════════════════════════════════════
// CHAT BODY PURGE — the named consumer for the 7-day retention promise
// ═══════════════════════════════════════════════════════════════
//
// A closed thread stays readable for seven days, then its message bodies are
// replaced. The rows remain: participants, timestamps and deal metadata are
// the audit trail, and deleting them would orphan the Connect ledger.
//
// A thread under an active dispute hold is exempt until the case resolves —
// purging evidence mid-review would destroy the only record of what happened.

const BATCH_LIMIT = 500;

async function handleCron(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server error: missing service role configuration" },
      { status: 500 },
    );
  }

  try {
    const cutoff = retentionCutoffIso();

    const { data: closed, error: closedErr } = await supabaseAdmin
      .from("deals")
      .select("id")
      .eq("status", "closed")
      .lte("closed_at", cutoff)
      .limit(BATCH_LIMIT);

    if (closedErr) throw closedErr;
    if (!closed?.length) {
      return NextResponse.json({ purged: 0, eligibleDeals: 0, retentionDays: CHAT_RETENTION_DAYS });
    }

    const closedIds = closed.map((d) => d.id);

    // Read the holds rather than trusting the deal row: a dispute is filed
    // against a deal that is already closed, so closure alone says nothing
    // about whether the thread is still under review.
    const { data: holds, error: holdErr } = await supabaseAdmin
      .from("deal_disputes")
      .select("deal_id")
      .in("deal_id", closedIds)
      .in("status", DISPUTE_HOLD_STATUSES);

    if (holdErr) throw holdErr;

    const held = new Set((holds || []).map((h) => h.deal_id));
    const eligible = closedIds.filter((id) => !held.has(id));

    if (eligible.length === 0) {
      return NextResponse.json({
        purged: 0,
        eligibleDeals: 0,
        heldByDispute: held.size,
        retentionDays: CHAT_RETENTION_DAYS,
      });
    }

    const { data: purged, error: purgeErr } = await supabaseAdmin
      .from("deal_messages")
      .update({ body: PURGED_BODY })
      .in("deal_id", eligible)
      .neq("body", PURGED_BODY)
      .select("id");

    if (purgeErr) throw purgeErr;

    return NextResponse.json({
      purged: purged?.length || 0,
      eligibleDeals: eligible.length,
      heldByDispute: held.size,
      retentionDays: CHAT_RETENTION_DAYS,
      batchCapped: closed.length === BATCH_LIMIT,
    });
  } catch (err) {
    console.error("[CHAT PURGE CRON] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// A-063. Every run of this job is recorded in `system_events`; an
// unauthorized probe is not, so a job that stops firing is visible as a
// gap rather than buried among rejected calls.
export const GET = withCronEventLog("purge-chat-messages", handleCron);
