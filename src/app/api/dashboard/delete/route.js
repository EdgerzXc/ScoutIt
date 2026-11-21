import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { unpublishBoundProperty } from "@/lib/airtable";
import {
  buildPermanentRemovalUpdate, exactTitleMatches, getPublicationBinding, hasPublicationHistory,
  isPermanentlyRemoved, isStaffSuspended, matchPublicationSnapshot, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES,
} from "@/lib/propertyLifecycle";
import { collectPropertyRemovalBlockers } from "@/lib/propertyRemoval";
import { getBearerToken, hasRecentPasswordAuthentication } from "@/lib/propertyReauthentication";
import { sanitizeError } from "@/lib/sanitizeError";
import { invalidateCmsBundle } from "@/lib/cmsCache";

async function readRows(table, configure) {
  try {
    let query = supabaseAdmin.from(table).select("*");
    query = configure(query);
    const result = await query;
    // A missing optional table must not turn a retained-removal request into a
    // destructive guess. Treat it as an unknown dependency and block.
    if (result.error) return { rows: [], error: result.error };
    return { rows: result.data || [], error: null };
  } catch (error) {
    return { rows: [], error };
  }
}

async function recordRemovalAudit({ property, actorId, fromState, reason, timestamp, metadata = {} }) {
  return supabaseAdmin.from("property_lifecycle_events").upsert({
    operation_key: `remove:${property.id}:${timestamp || property.permanently_removed_at || "legacy"}`,
    property_id: property.id,
    from_state: fromState,
    to_state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED,
    actor_id: actorId,
    reason: reason || "Owner requested retained market removal",
    metadata: {
      dependencies_checked: true,
      row_retained: true,
      airtable_record_retained: true,
      references_retained: true,
      spatial_assets_retained: true,
      ...metadata,
    },
  }, { onConflict: "operation_key", ignoreDuplicates: true });
}

// Removal is already committed by the time this runs. Return an unconfirmed
// public refresh to the owner without inviting a retry of a destructive write.
async function purgePublicCatalogue(withdrawn) {
  if (!withdrawn.length) return false;
  try {
    const purge = await invalidateCmsBundle({ withdrawn });
    return purge.sharedCachePurged === false;
  } catch (cacheError) {
    console.error("[REMOVE API] Catalogue cache purge failed after removal:", cacheError?.message);
    return true;
  }
}

async function verifyTakedown(property) {
  if (!hasPublicationHistory(property)) return { withdrawn: [] };
  const binding = getPublicationBinding(property);
  if (!binding) {
    return { response: NextResponse.json({ error: "This listing requires publication identity reconciliation" }, { status: 409 }) };
  }
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    return { response: NextResponse.json({ error: "Removal is unavailable while the Airtable CMS is unavailable", retryable: true }, { status: 503 }) };
  }
  try {
    await unpublishBoundProperty(apiKey, baseId, binding);
    return { withdrawn: [binding] };
  } catch (error) {
    console.error("[REMOVE API] Airtable could not confirm takedown:", error);
    return { response: NextResponse.json({ error: "Airtable could not confirm public removal", retryable: true }, { status: 502 }) };
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const { submissionId, confirmationTitle, confirmPermanentRemoval, reason } = body || {};
    if (typeof submissionId !== "string" || !submissionId || (reason != null && (typeof reason !== "string" || reason.length > 500))) {
      return NextResponse.json({ error: "Invalid removal request" }, { status: 400 });
    }
    if (String(submissionId).startsWith("rec")) {
      return NextResponse.json({ error: "Direct Airtable deletion is staff-only and not available through the owner action" }, { status: 403 });
    }
    if (confirmPermanentRemoval !== true) {
      return NextResponse.json({ error: "Explicit retained-removal confirmation is required" }, { status: 400 });
    }

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    const token = getBearerToken(request);
    if (!hasRecentPasswordAuthentication(token)) {
      return NextResponse.json(
        { error: "Enter your account password again before permanently removing this listing", reauthenticationRequired: true },
        { status: 428, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const { data: property, error: fetchError } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", submissionId)
      .single();
    if (fetchError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });

    if (property.owner_id !== userId) return NextResponse.json({ error: "Unauthorized: You do not own this property" }, { status: 403 });
    if (!exactTitleMatches(confirmationTitle, property.title)) return NextResponse.json({ error: "Type the exact property title to continue" }, { status: 400 });
    const state = normalizeLifecycleState(property);
    if (isPermanentlyRemoved(property)) {
      const { withdrawn, response } = await verifyTakedown(property);
      if (response) return response;
      const publicCachePending = await purgePublicCatalogue(withdrawn);
      const { error: auditError } = await recordRemovalAudit({ property, actorId: userId, fromState: state, reason, metadata: { idempotent_repair: true } });
      if (auditError) {
        return NextResponse.json({ error: "Retained removal audit evidence needs reconciliation", retryable: true, publicCachePending }, { status: 500 });
      }

      return NextResponse.json({ success: true, state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED, retained: true, reservedSlug: property.canonical_slug, idempotent: true, publicCachePending });
    }
    if (isStaffSuspended(property)) {
      return NextResponse.json({ error: "Staff-suspended listings require staff review", retryable: false }, { status: 409 });
    }

    const [deals, appointments, units, disputes] = await Promise.all([
      readRows("deals", (query) => query.eq("property_id", submissionId)),
      readRows("viewing_appointments", (query) => query.eq("property_id", submissionId)),
      readRows("property_units", (query) => query.eq("property_id", submissionId)),
      readRows("disputes", (query) => query.eq("property_id", submissionId)),
    ]);
    const missingDependency = [deals, appointments, units, disputes].find((result) => result.error);
    if (missingDependency) return NextResponse.json({ error: "Removal preflight could not verify dependent records", retryable: true }, { status: 503 });

    const blockers = collectPropertyRemovalBlockers({
      deals: deals.rows,
      appointments: appointments.rows,
      units: units.rows,
      disputes: disputes.rows,
    });
    if (blockers.length) {
      return NextResponse.json({ error: "Listing cannot be permanently removed while active obligations remain", blockers }, { status: 409 });
    }

    const { withdrawn, response } = await verifyTakedown(property);
    if (response) return response;

    const removalUpdate = buildPermanentRemovalUpdate({ actorId: userId, reason });
    const query = supabaseAdmin
      .from("properties")
      .update(removalUpdate)
      .eq("id", submissionId)
      .eq("owner_id", userId);
    const { data: updated, error: updateError } = await matchPublicationSnapshot(query, property).select("id");
    if (updateError || !updated?.length) {
      const publicCachePending = await purgePublicCatalogue(withdrawn);
      return NextResponse.json({ error: "Retained removal needs lifecycle reconciliation", retryable: true, publicCachePending }, { status: updateError ? 500 : 409 });
    }

    // Clear the public snapshot before the audit write; an audit failure must
    // not leave a listing visible after Airtable approval was withdrawn.
    const publicCachePending = await purgePublicCatalogue(withdrawn);

    const { error: auditError } = await supabaseAdmin.from("property_lifecycle_events").insert({
      property_id: submissionId,
      operation_key: `remove:${submissionId}:${removalUpdate.permanently_removed_at}`,
      from_state: state,
      to_state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED,
      actor_id: userId,
      reason: reason || "Owner requested retained market removal",
      metadata: { dependencies_checked: true, row_retained: true, airtable_record_retained: true },
    });
    if (auditError) console.error("[REMOVE API] Audit insert failed:", auditError);
    if (auditError) {
      return NextResponse.json({ error: "Listing was retained and removed from market access, but audit evidence needs reconciliation", retryable: true, publicCachePending }, { status: 500 });
    }

    return NextResponse.json({ success: true, state: PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED, retained: true, reservedSlug: property.canonical_slug, publicCachePending });
  } catch (error) {
    console.error("[REMOVE API] Error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
