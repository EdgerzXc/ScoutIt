import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authorizeCronRequest } from "@/lib/cronAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { withCronEventLog } from "@/lib/cronEventLog";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { notifyUser } from "@/lib/notifications";

// ═══════════════════════════════════════════════════════════════════════════
// DAILY PRC CREDENTIAL EXPIRY SWEEP (RA 9646 Compliance · GAP-45)
//
// Sweeps `user_profiles` where `prc_verified = true` and `prc_expiry < today`,
// marks expired credentials `prc_verified = false`, notifies affected brokers,
// and purges the cached public CMS bundle (`invalidateCmsBundle`) so the public
// broker directory never serves an expired PRC Verified badge.
// ═══════════════════════════════════════════════════════════════════════════

const BATCH_LIMIT = 500;

async function handleCron(request) {
  const authFailure = authorizeCronRequest(request);
  if (authFailure) return authFailure;

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "PRC verification sweep is unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  try {
    const todayIso = new Date().toISOString().slice(0, 10);

    const { data: expiredProfiles, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, prc_license, prc_expiry")
      .eq("prc_verified", true)
      .not("prc_expiry", "is", null)
      .lt("prc_expiry", todayIso)
      .limit(BATCH_LIMIT);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to query PRC expiry roster" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const expiredList = expiredProfiles || [];
    if (expiredList.length === 0) {
      return NextResponse.json(
        { ok: true, expiredCount: 0, cacheInvalidated: false },
        { status: 200, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const expiredIds = expiredList.map((row) => row.id);
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        prc_verified: false,
        updated_at: new Date().toISOString(),
      })
      .in("id", expiredIds);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update expired PRC credentials" },
        { status: 500, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    // GAP-45: Immediately purge the cached public CMS bundle so expired PRC badges
    // disappear from the public directory without waiting for the 24h cache TTL.
    await invalidateCmsBundle("cron.verify_prc_status");

    for (const broker of expiredList) {
      await notifyUser(supabaseAdmin, {
        userId: broker.id,
        title: "PRC License Renewal Required",
        desc: `Your PRC license (${broker.prc_license || "on file"}) expired on ${broker.prc_expiry}. Upload your renewed PRC ID in Settings to restore your verified badge.`,
        notificationType: "prc_credential_expired",
        forceEmail: true,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        expiredCount: expiredIds.length,
        expiredBrokerIds: expiredIds,
        cacheInvalidated: true,
      },
      { status: 200, headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    console.error("[verify-prc-status] sweep failed:", sanitizeError(error));
    return NextResponse.json(
      { error: "PRC verification sweep failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

export const GET = withCronEventLog("verify-prc-status", handleCron);
