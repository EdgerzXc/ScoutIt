import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { unpublishBoundProperty } from "@/lib/airtable";
import {
  buildWithdrawUpdate, getPublicationBinding, hasPublicationHistory, isPermanentlyRemoved,
  isStaffSuspended, matchPublicationSnapshot, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES,
} from "@/lib/propertyLifecycle";
import { sanitizeError } from "@/lib/sanitizeError";
import { z } from "zod";
import { invalidateCmsBundle } from "@/lib/cmsCache";

const schema = z.object({
  propertyIds: z.array(z.string()).min(1).max(100).optional(),
  submissionId: z.string().optional(),
}).refine((value) => value.propertyIds?.length || value.submissionId, { message: "At least one property is required" });

async function purgePublicCatalogue(withdrawn) {
  if (!withdrawn.length) return false;
  try {
    const purge = await invalidateCmsBundle({ withdrawn });
    return purge.sharedCachePurged === false;
  } catch (cacheError) {
    console.error("[ARCHIVE] Catalogue cache purge failed after withdrawal:", cacheError?.message);
    return true;
  }
}

export async function POST(request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid property selection" }, { status: 400 });

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const propertyIds = [...new Set(parsed.data.propertyIds || [parsed.data.submissionId])];
    const { data: owned, error: ownedError } = await supabaseAdmin
      .from("properties")
      .select("*")
      .in("id", propertyIds)
      .eq("owner_id", userId);
    if (ownedError) return NextResponse.json({ error: "Failed to verify property ownership" }, { status: 500 });
    if (!owned?.length) return NextResponse.json({ error: "None of the selected properties belong to you" }, { status: 403 });
    if (owned.length !== propertyIds.length) {
      return NextResponse.json({ error: "Every selected property must exist and belong to you" }, { status: 403 });
    }

    const permanentlyRemoved = owned.filter(isPermanentlyRemoved);
    if (permanentlyRemoved.length) {
      return NextResponse.json({ error: "Permanently removed listings cannot be withdrawn or reactivated", propertyIds: permanentlyRemoved.map((p) => p.id) }, { status: 409 });
    }
    const suspended = owned.filter(isStaffSuspended);
    if (suspended.length) {
      return NextResponse.json({ error: "Staff-suspended listings require staff review", propertyIds: suspended.map((p) => p.id) }, { status: 409 });
    }

    const publicListings = owned.filter(hasPublicationHistory);
    const bindings = publicListings.map(getPublicationBinding);
    if (bindings.some((binding) => !binding)) {
      return NextResponse.json({ error: "A public listing requires publication identity reconciliation", propertyIds: publicListings.filter((property) => !getPublicationBinding(property)).map((property) => property.id) }, { status: 409 });
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (bindings.length && (!apiKey || !baseId)) {
      return NextResponse.json({ error: "Withdrawal is unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }
    const withdrawn = [];
    try {
      for (const binding of bindings) {
        await unpublishBoundProperty(apiKey, baseId, binding);
        withdrawn.push(binding);
      }
    } catch (error) {
      console.error("[WITHDRAW API] Airtable unpublish failed:", error);
      const publicCachePending = await purgePublicCatalogue(withdrawn);
      return NextResponse.json({ error: "Airtable unpublish failed; check the selected listings before retrying", retryable: true, publicCachePending }, { status: 502 });
    }

    const now = new Date().toISOString();
    const committed = [];
    let writeFailed = false;
    for (const property of owned) {
      const updatePayload = buildWithdrawUpdate({ now });
      if (normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET) {
        delete updatePayload.quietly_open_to_offers;
        delete updatePayload.withdrawn_at;
      }
      const query = supabaseAdmin.from("properties").update(updatePayload).eq("id", property.id).eq("owner_id", userId);
      const { data: updated, error: updateError } = await matchPublicationSnapshot(query, property).select("id");
      if (updateError || updated?.length !== 1) {
        writeFailed = Boolean(updateError);
        if (updateError) console.error("[WITHDRAW API] Supabase lifecycle update failed:", updateError);
        break;
      }
      committed.push(property);
    }

    const publicCachePending = await purgePublicCatalogue(withdrawn);
    const events = committed.map((property) => ({
      property_id: property.id,
      operation_key: `withdraw:${property.id}:${normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET ? (property.withdrawn_at || property.canonical_slug_locked_at || property.published_at || property.created_at || "legacy") : now}`,
      from_state: normalizeLifecycleState(property),
      to_state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
      actor_id: userId,
      reason: "Owner withdrew listing from ordinary market discovery",
      metadata: { idempotent: normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET },
    }));
    const { error: auditError } = events.length
      ? await supabaseAdmin.from("property_lifecycle_events").upsert(events, { onConflict: "operation_key", ignoreDuplicates: true })
      : { error: null };
    if (auditError) console.error("[WITHDRAW API] Audit insert failed:", auditError);
    if (auditError) {
      return NextResponse.json(
        { error: "Listing is off-market, but lifecycle audit evidence needs reconciliation", retryable: true, publicCachePending },
        { status: 500 }
      );
    }
    const withdrawnIds = committed.map((property) => property.id);
    if (committed.length !== owned.length) {
      return NextResponse.json({ error: "Withdrawal needs lifecycle reconciliation", retryable: true, withdrawnIds, publicCachePending }, { status: writeFailed ? 500 : 409 });
    }

    return NextResponse.json({ success: true, state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET, withdrawnCount: withdrawnIds.length, withdrawnIds, publicCachePending });
  } catch (error) {
    console.error("[WITHDRAW API] Error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
