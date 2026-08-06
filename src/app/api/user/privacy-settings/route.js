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

    return NextResponse.json({
      success: true,
      settings: {
        isProfilePublic: profile?.is_profile_public ?? true,
        telemetryOptOut: profile?.telemetry_opt_out ?? false,
        marketingOptOut: profile?.marketing_opt_out ?? false,
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

    if (Object.keys(updates).length === 0) {
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

    updates.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabaseAdmin
      .from("user_profiles")
      .update(updates)
      .eq("id", userId)
      .select("is_profile_public, telemetry_opt_out, marketing_opt_out")
      .single();

    if (error) {
      return NextResponse.json(
        { error: sanitizeError(error, "Could not update privacy settings.") },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        isProfilePublic: updated.is_profile_public,
        telemetryOptOut: updated.telemetry_opt_out,
        marketingOptOut: updated.marketing_opt_out,
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
