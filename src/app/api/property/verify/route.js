// ═══════════════════════════════════════════════════════════════
// PROPERTY RE-VERIFICATION & FRESHNESS API (ACQ-01 & FRESH-01)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getFreshness } from "@/lib/freshness";
import { sanitizeError } from "@/lib/sanitizeError";

/**
 * POST /api/property/verify
 * Attests and updates a property's verification timestamp (Last_Verified_Date).
 */
export async function POST(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to verify listing" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { propertyId, verificationType } = body;

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid propertyId" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    // 1. Fetch property to verify ownership/lister authority
    const { data: prop, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, slug, owner_id, status")
      .or(`id.eq.${propertyId},slug.eq.${propertyId}`)
      .maybeSingle();

    if (propErr || !prop) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    // Check authority: user must be property owner or staff
    if (prop.owner_id && prop.owner_id !== userId) {
      // Check if user is admin
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("active_roles")
        .eq("id", userId)
        .maybeSingle();

      const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
      if (!roles.includes("admin") && !roles.includes("staff")) {
        return NextResponse.json(
          { error: "Forbidden: You do not have permission to verify this listing" },
          { status: 403 }
        );
      }
    }

    const nowIso = new Date().toISOString();

    // 2. Update properties table last_verified_date
    const { error: updateErr } = await supabaseAdmin
      .from("properties")
      .update({
        last_verified_date: nowIso,
        updated_at: nowIso,
      })
      .eq("id", prop.id);

    if (updateErr) {
      return NextResponse.json(
        { error: sanitizeError(updateErr, "Could not update verification timestamp.") },
        { status: 500 }
      );
    }

    // 3. Compute new freshness status
    const freshness = getFreshness(nowIso);

    // Log verification audit event
    await supabaseAdmin.from("supabase_audit_logs").insert({
      action: "PROPERTY_VERIFIED",
      actor_id: userId,
      details: {
        property_id: prop.id,
        verification_type: verificationType || "owner_attestation",
        verified_at: nowIso,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      propertyId: prop.id,
      slug: prop.slug,
      lastVerifiedDate: nowIso,
      freshness,
      message: "Property freshness re-verified successfully.",
    });
  } catch (err) {
    console.error("[PROPERTY VERIFY API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not verify property.") },
      { status: 500 }
    );
  }
}
