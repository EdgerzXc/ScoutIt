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
import { writeAuditLog } from "@/lib/auditTrail";
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

    // 1. Delete private user data.
    //
    // ⚠️ REWRITTEN 2026-08-06 (§58/C28). Every table and column named here is
    // verified against the live database. The previous version deleted from
    // `saved_properties` and `search_intent_logs` — NEITHER EXISTS — inside a
    // `Promise.all` whose results were never inspected, then updated
    // `user_profiles.full_name/phone/email/deleted_at`, none of which are
    // columns either. So the anonymisation UPDATE failed outright, the audit
    // insert failed, and the route still returned `success: true`.
    //
    // A right-to-erasure endpoint that reports success without erasing is the
    // worst possible failure mode for this feature: RA 10173 §16(e) compliance
    // was being asserted to the user and to us, and nothing had happened.
    //
    // `saved_properties` → the saved-items table is `saved_intel`.
    // `search_intent_logs` → viewing telemetry lives in `analytics_events`.
    const erasures = [
      ["saved_intel", "user_id"],            // saved listings ("Your Board")
      ["analytics_events", "user_id"],        // viewing / search telemetry
      ["privacy_settings", "user_id"],        // their own privacy choices
      ["user_notifications", "user_id"],
      ["private_notifications", "user_id"],
      ["user_availability", "user_id"],
      ["calendar_events", "owner_user_id"],
      ["calendar_connections", "owner_user_id"], // holds encrypted OAuth tokens
    ];

    // Sequential and checked. A partial erasure must not be reported as a
    // complete one, so the first failure stops and surfaces.
    const erased = [];
    for (const [table, column] of erasures) {
      const { error } = await supabaseAdmin.from(table).delete().eq(column, userId);
      if (error) {
        console.error(`[ACCOUNT DELETION] Failed to erase ${table}:`, error.message);
        return NextResponse.json(
          {
            error: "Account deletion is incomplete and has been stopped. No data was left in an unknown state; please contact support so this can be completed by hand.",
            failedAt: table,
            erased,
            retryable: true,
          },
          { status: 500 }
        );
      }
      erased.push(table);
    }

    // 2. Anonymise the profile row. It is retained (not deleted) so that
    // transaction/audit foreign keys stay intact, but every field that
    // identifies or describes the person is cleared. `date_of_birth` matters
    // especially: it is the §48 age-gate attestation and is plain PII.
    //
    // There is no email/phone/full_name column on `user_profiles` — that
    // identity data lives in `auth.users`, which step 3 removes.
    const { error: anonError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        display_name: "[DELETED USER]",
        avatar_url: null,
        location: null,
        headline: null,
        bio: null,
        firm: null,
        service: null,
        prc_license: null,
        prc_expiry: null,
        prc_verified: false,
        dhsud_number: null,
        date_of_birth: null,
        active_roles: [],
        is_profile_public: false,
        archived_at: new Date().toISOString(),
        moderation_note: "Account deleted at user request (RA 10173 Sec. 16(e)).",
      })
      .eq("id", userId);

    if (anonError) {
      console.error("[ACCOUNT DELETION] Profile anonymisation failed:", anonError.message);
      return NextResponse.json(
        {
          error: "Your private data was deleted, but the profile record could not be anonymised. Please contact support so this can be completed.",
          erased,
          retryable: true,
        },
        { status: 500 }
      );
    }

    // 3. Revoke auth user and sessions
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
      true // shouldSoftDelete = true to preserve FK references for audit logs
    );

    if (deleteUserError) {
      console.error("[ACCOUNT DELETION] Auth deletion warning:", deleteUserError.message);
    }

    // 4. Record the audit entry. This is the EVIDENCE that an erasure request
    // was honoured, so a failure here is reported rather than swallowed — the
    // old `.catch(() => null)` on a nonexistent table meant no erasure has
    // ever been recorded. See lib/auditTrail.js.
    const audit = await writeAuditLog(supabaseAdmin, {
      action: "ACCOUNT_DELETED_RIGHT_TO_ERASURE",
      tableName: "user_profiles",
      recordId: userId,
      userId,
      metadata: {
        timestamp: new Date().toISOString(),
        law: "RA 10173 Sec. 16(e)",
        erased,
        auth_user_removed: !deleteUserError,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your account and private data have been deleted.",
      erased,
      // Honest reporting: the deletion did happen, but if the audit record
      // failed we say so rather than implying a complete paper trail.
      auditRecorded: audit.ok,
      ...(audit.ok ? {} : { warning: "Deletion completed, but the audit record could not be written. Please report this." }),
    });
  } catch (err) {
    console.error("[ACCOUNT DELETION] Failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not complete account deletion.") },
      { status: 500 }
    );
  }
}
