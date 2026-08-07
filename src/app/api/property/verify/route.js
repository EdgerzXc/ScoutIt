// ═══════════════════════════════════════════════════════════════
// PROPERTY RE-VERIFICATION & FRESHNESS API (ACQ-01 & FRESH-01)
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getFreshness } from "@/lib/freshness";
import { findProperty } from "@/lib/propertyLookup";
import { writeAuditLog } from "@/lib/auditTrail";
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
    //
    // ⚠️ FIXED 2026-08-06 (§55). This previously read:
    //   .select("id, slug, owner_id, status")
    //   .or(`id.eq.${propertyId},slug.eq.${propertyId}`)
    // Two bugs in two lines. `properties.status` does not exist (the column is
    // `lifecycle_state`), and `id` is a uuid — so passing a SLUG made Postgres
    // fail to cast it, the query errored, and `propErr || !prop` reported
    // "Property not found" for a property that exists. Every slug-based call
    // has 404'd since the route shipped. Nobody noticed: it has no caller.
    // See lib/propertyLookup.js for the full write-up.
    const { property: prop, error: propErr } = await findProperty(
      supabaseAdmin,
      propertyId,
      ["id", "slug", "canonical_slug", "owner_id", "lifecycle_state", "pipeline_status", "title"]
    );

    if (propErr) {
      console.error("[PROPERTY VERIFY API] Lookup failed:", propErr);
      return NextResponse.json(
        { error: sanitizeError(propErr, "Could not look up that property.") },
        { status: 500 }
      );
    }
    if (!prop) {
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
    // ⚠️ `updated_at` was here until 2026-08-06 (§58/C28). `public.properties`
    // has NO `updated_at` column — verified against the live database, not a
    // document. PostgREST rejects the whole statement, `updateErr` is set, and
    // this route returned 500 "Could not update verification timestamp." for
    // EVERY call. W12's staff re-verification panel shipped against it, so the
    // feature was broken from its first click. Do not re-add it without adding
    // the column first.
    const { error: updateErr } = await supabaseAdmin
      .from("properties")
      .update({
        last_verified_date: nowIso,
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
    // `supabase_audit_logs` does not exist (the table is `audit_logs`), and the
    // payload used `actor_id`/`details`, neither of which is a column. The
    // `.catch(() => null)` meant nobody ever saw it. See lib/auditTrail.js.
    await writeAuditLog(supabaseAdmin, {
      action: "PROPERTY_VERIFIED",
      tableName: "properties",
      recordId: prop.id,
      userId,
      metadata: {
        verification_type: verificationType || "owner_attestation",
        verified_at: nowIso,
      },
    });

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
