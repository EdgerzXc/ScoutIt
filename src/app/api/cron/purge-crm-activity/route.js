import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import {
  CRM_ACTIVITY_RETENTION_DAYS,
  crmActivityRetentionCutoffIso,
} from "@/lib/activityRetention";

// ═══════════════════════════════════════════════════════════════
// CRM ACTIVITY LOG PURGE — A-318 / Fourth Sweep F-02 / F-03
// ═══════════════════════════════════════════════════════════════
//
// Timeline activity events in `crm_activity_log` are retained for 90 days.
// Rows older than 90 days are purged in bounded batches so high-volume activity
// does not accumulate indefinitely while maintaining an auditable quarterly record.

const BATCH_LIMIT = 1000;

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
    const cutoff = crmActivityRetentionCutoffIso();

    const { data: candidates, error: selectError } = await supabaseAdmin
      .from("crm_activity_log")
      .select("id")
      .lte("created_at", cutoff)
      .limit(BATCH_LIMIT);

    if (selectError) throw selectError;

    const batchIds = (candidates || []).map((row) => row.id).filter(Boolean);
    if (batchIds.length === 0) {
      return NextResponse.json({
        purged: 0,
        retentionDays: CRM_ACTIVITY_RETENTION_DAYS,
        batchCapped: false,
      });
    }

    const { data: purged, error: deleteError } = await supabaseAdmin
      .from("crm_activity_log")
      .delete()
      .in("id", batchIds)
      .select("id");

    if (deleteError) throw deleteError;

    return NextResponse.json({
      purged: purged?.length || 0,
      retentionDays: CRM_ACTIVITY_RETENTION_DAYS,
      batchCapped: batchIds.length === BATCH_LIMIT,
    });
  } catch (err) {
    console.error("[CRM ACTIVITY PURGE CRON] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export const GET = withCronEventLog("purge-crm-activity", handleCron);
