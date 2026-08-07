// ═══════════════════════════════════════════════════════════════
// CONSOLIDATED USER PRIVACY SETTINGS API (SET-01)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * GET /api/user/privacy-settings
 * Returns the current user's consolidated privacy settings.
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const { data: profile, error } = await supabaseAdmin
      .from("user_profiles")
      .select("is_profile_public, telemetry_opt_out, marketing_opt_out, adult_eligibility_status")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: sanitizeError(error, "Could not load privacy settings.") },
        { status: 500 }
      );
    }

    // ── ANONYMITY SHIELD (W13 · C19 · §46.8) ────────────────────────
    // Lives in `privacy_settings`, a different table from the rest of these
    // flags. It was wired at row creation and had no read path and no write
    // path, so the toggle had nothing to talk to. This is that path.
    //
    // ⚠️ NOT TIER-GATED, and this route must never learn to check a tier.
    // Standing Rule 10: defaults may differ by tier, access never may.
    const { data: shield } = await supabaseAdmin
      .from("privacy_settings")
      .select("anonymous_browsing, anonymous_byline")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      settings: {
        isProfilePublic: profile?.is_profile_public ?? true,
        telemetryOptOut: profile?.telemetry_opt_out ?? false,
        marketingOptOut: profile?.marketing_opt_out ?? false,
        // `?? false` is the honest default here: a missing row means the shield
        // was never switched on, and reporting it as ON would tell someone they
        // are protected when they are not. The failure direction matters more
        // than the tidiness.
        anonymousBrowsing: shield?.anonymous_browsing ?? false,
        anonymousByline: shield?.anonymous_byline ?? false,
        // "unknown" is the honest default, not "declared_adult" (§47).
        // Reporting an attestation the user never made is how a legal-capacity
        // claim gets fabricated by a fallback value.
        adultEligibilityStatus: profile?.adult_eligibility_status || "unknown",
      },
    });
  } catch (err) {
    console.error("[PRIVACY SETTINGS API] GET failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not load privacy settings.") },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/privacy-settings
 * Updates the user's consolidated privacy settings.
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Active session required" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (typeof body.isProfilePublic === "boolean") {
      updates.is_profile_public = body.isProfilePublic;
    }

    if (typeof body.telemetryOptOut === "boolean") {
      updates.telemetry_opt_out = body.telemetryOptOut;
    }

    if (typeof body.marketingOptOut === "boolean") {
      updates.marketing_opt_out = body.marketingOptOut;
    }

    // Anonymity shield fields live in `privacy_settings`, not `user_profiles`.
    const shieldUpdates = {};
    if (typeof body.anonymousBrowsing === "boolean") {
      shieldUpdates.anonymous_browsing = body.anonymousBrowsing;
    }
    if (typeof body.anonymousByline === "boolean") {
      shieldUpdates.anonymous_byline = body.anonymousByline;
    }

    if (Object.keys(updates).length === 0 && Object.keys(shieldUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid privacy settings provided to update." },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from("user_profiles")
        .update(updates)
        .eq("id", userId);
      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not update privacy settings.") },
          { status: 500 }
        );
      }
    }

    if (Object.keys(shieldUpdates).length > 0) {
      // Upsert, not update: a profile created before the shield existed has no
      // `privacy_settings` row, and an update against a missing row succeeds
      // while changing nothing. The user would see the toggle flip and their
      // setting would not exist — a privacy control that silently does nothing
      // is worse than one that isn't offered.
      const { error } = await supabaseAdmin
        .from("privacy_settings")
        .upsert({ user_id: userId, ...shieldUpdates }, { onConflict: "user_id" });
      if (error) {
        return NextResponse.json(
          { error: sanitizeError(error, "Could not update your anonymity settings.") },
          { status: 500 }
        );
      }
    }

    // Read the whole set back rather than echoing the request. The client
    // renders what it is told, so it must be told what is actually stored.
    const { data: profileAfter } = await supabaseAdmin
      .from("user_profiles")
      .select("is_profile_public, telemetry_opt_out, marketing_opt_out")
      .eq("id", userId)
      .maybeSingle();
    const { data: shieldAfter } = await supabaseAdmin
      .from("privacy_settings")
      .select("anonymous_browsing, anonymous_byline")
      .eq("user_id", userId)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      settings: {
        isProfilePublic: profileAfter?.is_profile_public ?? true,
        telemetryOptOut: profileAfter?.telemetry_opt_out ?? false,
        marketingOptOut: profileAfter?.marketing_opt_out ?? false,
        anonymousBrowsing: shieldAfter?.anonymous_browsing ?? false,
        anonymousByline: shieldAfter?.anonymous_byline ?? false,
      },
      message: "Privacy settings updated successfully.",
    });
  } catch (err) {
    console.error("[PRIVACY SETTINGS API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not update privacy settings.") },
      { status: 500 }
    );
  }
}
