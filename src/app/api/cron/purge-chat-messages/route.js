import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { withCronEventLog } from "@/lib/cronEventLog";
import {
  CHAT_RETENTION_DAYS,
  DISPUTE_HOLD_STATUSES,
  DISPUTE_RESOLUTION_GRACE_MS,
  PURGE_ELIGIBLE_STATUSES,
  PURGED_BODY,
  retentionCutoffIso,
} from "@/lib/chatRetention";

export const maxDuration = 60;
const MAX_BATCHES = 4;

async function handleCron(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
  }

  const now = Date.now();
  const result = { purged: 0, eligibleDeals: 0, retentionDays: CHAT_RETENTION_DAYS, batchCapped: false };
  try {
    for (let batch = 0; batch < MAX_BATCHES; batch += 1) {
      const { data, error } = await supabaseAdmin.rpc("purge_retained_chat_batch", {
        p_terminal_statuses: PURGE_ELIGIBLE_STATUSES,
        p_hold_statuses: DISPUTE_HOLD_STATUSES,
        p_cutoff: retentionCutoffIso(now),
        p_grace_cutoff: new Date(now - DISPUTE_RESOLUTION_GRACE_MS).toISOString(),
        p_purged_body: PURGED_BODY,
      });
      if (error) throw error;
      if (!Number.isSafeInteger(data?.purged) || !Number.isSafeInteger(data?.eligibleDeals) ||
          typeof data?.batchCapped !== "boolean") throw new Error("Invalid chat purge result");

      result.purged += data.purged;
      result.eligibleDeals += data.eligibleDeals;
      result.batchCapped = data.batchCapped;
      if (!data.batchCapped) break;
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("[CHAT PURGE CRON]", error?.code || error?.name);
    return NextResponse.json({ ...result, error: "Chat retention cleanup could not finish." }, { status: 500 });
  }
}

export const GET = withCronEventLog("purge-chat-messages", handleCron);
