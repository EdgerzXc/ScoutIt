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
import { stampAirtableFreshness } from "@/lib/airtableFreshness";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { requireAdmin } from "@/lib/adminGuard";
import {
  getPublicationBinding, isMarketVisible, isPermanentlyRemoved, isStaffSuspended, matchPublicationSnapshot,
} from "@/lib/propertyLifecycle";

async function saveVerificationDate(property, expectedDate, nextDate) {
  let query = supabaseAdmin.from("properties").update({ last_verified_date: nextDate }).eq("id", property.id);
  query = property.owner_id == null ? query.is("owner_id", null) : query.eq("owner_id", property.owner_id);
  query = expectedDate == null ? query.is("last_verified_date", null) : query.eq("last_verified_date", expectedDate);
  return matchPublicationSnapshot(query, property).select("id").maybeSingle();
}

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

    const body = (await request.json().catch(() => null)) || {};
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

    const { property: prop, error: propErr } = await findProperty(supabaseAdmin, propertyId, "*");

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

    const staffAttestation = prop.owner_id !== userId || verificationType === "staff_attestation";
    if (staffAttestation) {
      const auth = await requireAdmin(request, { label: "PROPERTY VERIFY" });
      if (auth.error || auth.userId !== userId) {
        return NextResponse.json(
          { error: auth.error || "You do not have permission to verify this listing", ...(auth.code ? { code: auth.code } : {}) },
          { status: auth.status || 403 },
        );
      }
    }
    if (isPermanentlyRemoved(prop) || isStaffSuspended(prop)) {
      return NextResponse.json({ error: "This listing is unavailable for verification" }, { status: 409 });
    }

    const isPublished = isMarketVisible(prop) || prop.pipeline_status === "published";
    const binding = isPublished ? getPublicationBinding(prop) : null;
    if (isPublished && !binding) {
      return NextResponse.json({ error: "This listing requires publication identity reconciliation" }, { status: 409 });
    }
    const nowIso = new Date().toISOString();
    const { data: updated, error: updateErr } = await saveVerificationDate(prop, prop.last_verified_date, nowIso);

    if (updateErr) {
      return NextResponse.json(
        { error: sanitizeError(updateErr, "Could not update verification timestamp.") },
        { status: 500 }
      );
    }
    if (!updated) {
      return NextResponse.json({ error: "Listing changed before verification could be recorded" }, { status: 409 });
    }

    let publicCachePending = false;
    if (binding) {
      const cmsSync = await stampAirtableFreshness({ ...binding, isoDate: nowIso });
      if (!cmsSync.ok) {
        const { data: reverted, error: rollbackError } = await saveVerificationDate(prop, nowIso, prop.last_verified_date ?? null);
        if (rollbackError || !reverted) {
          console.error("[PROPERTY VERIFY API] Freshness rollback failed:", rollbackError);
        }

        const missingConfig = cmsSync.reason === "missing_configuration";
        return NextResponse.json(
          {
            error: reverted
              ? "The public verification could not be confirmed. The private timestamp was restored."
              : "The public verification could not be confirmed. The private timestamp needs reconciliation.",
            cmsSyncFailed: true,
            rollbackFailed: !reverted,
          },
          { status: missingConfig ? 503 : 502 },
        );
      }
      try {
        const purge = await invalidateCmsBundle();
        publicCachePending = purge.sharedCachePurged === false;
      } catch (cacheError) {
        console.error("[PROPERTY VERIFY] Catalogue cache purge failed after verification:", cacheError?.message);
        publicCachePending = true;
      }
    }

    // 3. Compute new freshness status
    const freshness = getFreshness(nowIso);

    // Log verification audit event. Best-effort like the claim path: the
    // verification stands, but a missing row must be findable in the logs.
    // `supabase_audit_logs` does not exist (the table is `audit_logs`), and the
    // payload used `actor_id`/`details`, neither of which is a column. The
    // `.catch(() => null)` meant nobody ever saw it. See lib/auditTrail.js.
    const audit = await writeAuditLog(supabaseAdmin, {
      action: "PROPERTY_VERIFIED",
      tableName: "properties",
      recordId: prop.id,
      userId,
      metadata: {
        verification_type: staffAttestation ? "staff_attestation" : "owner_attestation",
        verified_at: nowIso,
      },
    });
    if (!audit.ok) {
      console.error("[PROPERTY VERIFY] Audit event not recorded for property", prop.id, audit.error);
    }

    return NextResponse.json({
      success: true,
      propertyId: prop.id,
      slug: prop.slug,
      lastVerifiedDate: nowIso,
      freshness,
      message: "Property freshness re-verified successfully.",
      publicCmsUpdated: isPublished,
      publicCachePending,
    });
  } catch (err) {
    console.error("[PROPERTY VERIFY API] POST failed:", err);
    return NextResponse.json(
      { error: sanitizeError(err, "Could not verify property.") },
      { status: 500 }
    );
  }
}
