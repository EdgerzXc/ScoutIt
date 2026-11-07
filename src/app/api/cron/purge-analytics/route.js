import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import {
  ANALYTICS_RETENTION_DAYS,
  analyticsRetentionCutoffIso,
  securityLogsRetentionCutoffIso,
} from "@/lib/activityRetention";

// ═══════════════════════════════════════════════════════════════
// ANALYTICS & TELEMETRY PURGE — A-318 / Fourth Sweep F-02 / F-03
// ═══════════════════════════════════════════════════════════════
//
// Raw telemetry and analytics events are retained for 90 days.
// Monthly aggregate reports (monthly_scout_wraps) persist rollup metrics, so raw
// clickstream events (`analytics_events`) and security logs (`security_access_logs`)
// past 90 days are purged to enforce privacy bounds and prevent unbounded table growth.

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
    const analyticsCutoff = analyticsRetentionCutoffIso();

    const { data: candidates, error: selectError } = await supabaseAdmin
      .from("analytics_events")
      .select("id")
      .lte("created_at", analyticsCutoff)
      .limit(BATCH_LIMIT);

    if (selectError) throw selectError;

    const batchIds = (candidates || []).map((row) => row.id).filter(Boolean);
    let purgedAnalytics = 0;
    if (batchIds.length > 0) {
      const { data: purged, error: deleteError } = await supabaseAdmin
        .from("analytics_events")
        .delete()
        .in("id", batchIds)
        .select("id");

      if (deleteError) throw deleteError;
      purgedAnalytics = purged?.length || 0;
    }

    let purgedSecurityLogs = 0;
    try {
      const secCutoff = securityLogsRetentionCutoffIso();
      const { data: secCandidates, error: secSelectError } = await supabaseAdmin
        .from("security_access_logs")
        .select("id")
        .lte("last_request_at", secCutoff)
        .limit(BATCH_LIMIT);

      if (!secSelectError && secCandidates?.length) {
        const secBatchIds = secCandidates.map((row) => row.id).filter(Boolean);
        const { data: secPurged, error: secDeleteError } = await supabaseAdmin
          .from("security_access_logs")
          .delete()
          .in("id", secBatchIds)
          .select("id");

        if (!secDeleteError) {
          purgedSecurityLogs = secPurged?.length || 0;
        }
      }
    } catch (secErr) {
      console.warn("[ANALYTICS PURGE CRON] Security logs purge skipped:", secErr?.message);
    }

    return NextResponse.json({
      purgedAnalytics,
      purgedSecurityLogs,
      retentionDays: ANALYTICS_RETENTION_DAYS,
      batchCapped: batchIds.length === BATCH_LIMIT,
    });
  } catch (err) {
    console.error("[ANALYTICS PURGE CRON] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export const GET = withCronEventLog("purge-analytics", handleCron);
