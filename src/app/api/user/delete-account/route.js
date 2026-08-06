// ═══════════════════════════════════════════════════════════════
// RIGHT-TO-ERASURE / ACCOUNT DELETION (RA 10173 & PRIV-01)
//
// WHY THIS EXISTS
// RA 10173 (Philippine Data Privacy Act of 2012) guarantees data subjects
// the right to erasure and blocking. This endpoint enables signed-in users
// to permanently delete their account profile, saved items, and telemetry
// data while preserving legally mandated transaction audit logs.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required to delete account" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (body.confirm !== "DELETE MY ACCOUNT") {
      return NextResponse.json(
        { error: "Confirmation text 'DELETE MY ACCOUNT' is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // 1. Delete private user data
    await Promise.all([
      supabaseAdmin.from("saved_properties").delete().eq("user_id", userId),
      supabaseAdmin.from("saved_intel").delete().eq("user_id", userId),
      supabaseAdmin.from("search_intent_logs").delete().eq("user_id", userId),
    ]);

    // 2. Anonymize user_profiles row to retain necessary non-PII transaction audit keys
    await supabaseAdmin
      .from("user_profiles")
      .update({
        display_name: "[DELETED USER]",
        full_name: null,
        phone: null,
        email: `deleted_${userId.slice(0, 8)}@deleted.scoutit.space`,
        is_profile_public: false,
        bio: null,
        deleted_at: new Date().toISOString(),
      })
      .eq("id", userId);

    // 3. Revoke auth user and sessions
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
      true // shouldSoftDelete = true to preserve FK references for audit logs
    );

    if (deleteUserError) {
      console.error("[ACCOUNT DELETION] Auth deletion warning:", deleteUserError.message);
    }

    // 4. Record audit log entry
    await supabaseAdmin.from("supabase_audit_logs").insert({
      action: "ACCOUNT_DELETED_RIGHT_TO_ERASURE",
      actor_id: userId,
      details: { timestamp: new Date().toISOString(), law: "RA 10173 Sec. 16(e)" },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Your account and private data have been deleted.",
    });
  } catch (err) {
    console.error("[ACCOUNT DELETION] Failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not complete account deletion.") },
      { status: 500 }
    );
  }
}
