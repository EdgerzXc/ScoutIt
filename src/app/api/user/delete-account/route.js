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

    // 3. Revoke auth user and sessions.
    //
    // A-075: `shouldSoftDelete = true` used to be justified as preserving "FK
    // references for audit logs". That reason was factually wrong — `audit_logs`
    // has NO foreign key to `auth.users` (verified via `pg_constraint`; 13 such
    // FKs exist in `public` and this is not one of them), so nobody had actually
    // decided this. Soft-delete is kept because a hard delete cannot be undone
    // if an erasure is later disputed, and because the 13 real FKs elsewhere in
    // `public` do reference `auth.users`. It retains the `auth.users` row,
    // including the email, which is the open retention question recorded as this
    // task's remaining boundary — not something this change settles.
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      userId,
      true
    );

    if (deleteUserError) {
      console.error("[ACCOUNT DELETION] Auth deletion failed:", deleteUserError.message);
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

    // A-075: if the auth deletion failed, this request did NOT do what the
    // person asked. Their private data is erased, but their sign-in still
    // works — so saying "Your account and private data have been deleted" is
    // false, and it is false about the one thing they would notice.
    //
    // The route already reported an *audit-write* failure honestly, with a
    // `warning` and a comment about not implying a complete paper trail. The
    // auth failure — more consequential — was only `console.error`ed and
    // recorded as `auth_user_removed: false` in audit metadata the person never
    // sees. That contrast is what made it a slip rather than a policy, and it
    // is the half of A-075 fixed here.
    if (deleteUserError) {
      return NextResponse.json(
        {
          success: false,
          accountAccessRevoked: false,
          error:
            "Your private data was erased, but your sign-in could not be closed — you may still be able to sign in. " +
            "The request has been recorded and needs to be completed manually. Please contact support so this is finished.",
          erased,
          retryable: true,
          auditRecorded: audit.ok,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      accountAccessRevoked: true,
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
