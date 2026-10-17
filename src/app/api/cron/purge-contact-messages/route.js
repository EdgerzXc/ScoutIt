import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import {
  CONTACT_RETENTION_DAYS,
  CLEARABLE_CONTACT_STATUSES,
  CONTACT_CLEARED_PATCH,
  CLEARED_EMAIL,
  contactRetentionCutoffIso,
} from "@/lib/contactRetention";

// ═══════════════════════════════════════════════════════════════
// VISITOR CONTACT CLEARING — the named consumer for A-002's promise
// ═══════════════════════════════════════════════════════════════
//
// Owner decision 2026-09-09: a resolved visitor support message is kept for
// seven days, then its personal fields are cleared. This job is what makes
// that sentence true. Standing Rule 13 is the reason it exists at all — the
// promise without this route would be a plan, and Standing Rule 21 is the
// reason it is registered in `vercel.json` in the same change: a job nothing
// schedules has no producer.
//
// The clock runs from `handled_at` — when the message was RESOLVED — not from
// `created_at`. A message that waited three weeks for an answer must still be
// readable for seven days after that answer.
//
// It is NOT a delete. The row survives so the queue still shows that somebody
// asked and somebody answered; only the sender stops being identifiable from
// it. What is deliberately left alone, and why, is recorded in
// `src/lib/contactRetention.js`.

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
    const cutoff = contactRetentionCutoffIso();

    // GAP-80: Select bounded batch IDs first so LIMIT is applied reliably on a
    // standard SELECT before executing the PII-clearing UPDATE.
    const { data: candidates, error: selectError } = await supabaseAdmin
      .from("contact_messages")
      .select("id")
      .in("status", CLEARABLE_CONTACT_STATUSES)
      .lte("handled_at", cutoff)
      .neq("email", CLEARED_EMAIL)
      .limit(BATCH_LIMIT);

    if (selectError) throw selectError;

    const batchIds = (candidates || []).map((row) => row.id).filter(Boolean);
    if (batchIds.length === 0) {
      return NextResponse.json({
        cleared: 0,
        retentionDays: CONTACT_RETENTION_DAYS,
        batchCapped: false,
      });
    }

    const { data: cleared, error } = await supabaseAdmin
      .from("contact_messages")
      .update(CONTACT_CLEARED_PATCH)
      .in("id", batchIds)
      .neq("email", CLEARED_EMAIL)
      .select("id");

    if (error) throw error;

    return NextResponse.json({
      cleared: cleared?.length || 0,
      retentionDays: CONTACT_RETENTION_DAYS,
      batchCapped: batchIds.length === BATCH_LIMIT,
    });
  } catch (err) {
    console.error("[CONTACT RETENTION CRON] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// A-063: every run is recorded in `system_events`, so a job that stops firing
// shows up as a gap rather than as silence.
export const GET = withCronEventLog("purge-contact-messages", handleCron);
