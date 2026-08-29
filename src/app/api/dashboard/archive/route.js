import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { updateProperty } from "@/lib/airtable";
import { buildWithdrawUpdate, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { sanitizeError } from "@/lib/sanitizeError";
import { z } from "zod";
import { invalidateCmsBundle } from "@/lib/cmsCache";

const schema = z.object({
  propertyIds: z.array(z.string()).min(1).max(100).optional(),
  submissionId: z.string().optional(),
}).refine((value) => value.propertyIds?.length || value.submissionId, { message: "At least one property is required" });

export async function POST(request) {
  try {
    const parsed = schema.safeParse(await request.json());
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

    const permanentlyRemoved = owned.filter((property) => normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED);
    if (permanentlyRemoved.length) {
      return NextResponse.json({ error: "Permanently removed listings cannot be withdrawn or reactivated", propertyIds: permanentlyRemoved.map((p) => p.id) }, { status: 409 });
    }

    // Complete the public-side unpublish first. If it fails, do not report a
    // successful lifecycle transition: the request is safe to retry and the
    // approved CMS record remains the only known public state.
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    if (apiKey && baseId) {
      for (const property of owned) {
        const state = normalizeLifecycleState(property);
        if (state !== PROPERTY_LIFECYCLE_STATES.LIVE) continue;
        const slug = property.canonical_slug || property.slug;
        if (!slug) return NextResponse.json({ error: "Live property is missing its canonical slug" }, { status: 409 });
        try {
          await updateProperty(apiKey, baseId, slug, { approved_for_scoutit: false });
        } catch (error) {
          console.error("[WITHDRAW API] Airtable unpublish failed:", error);
          return NextResponse.json({ error: "Airtable unpublish failed; retry the withdrawal", retryable: true }, { status: 502 });
        }
      }
    } else if (owned.some((property) => normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.LIVE)) {
      return NextResponse.json({ error: "Withdrawal is unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }

    const now = new Date().toISOString();
    const updatePayload = buildWithdrawUpdate({ now });
    const alreadyOffMarket = owned.every((property) => normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET);
    if (alreadyOffMarket) {
      delete updatePayload.quietly_open_to_offers;
      delete updatePayload.withdrawn_at;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("properties")
      .update(updatePayload)
      .in("id", owned.map((property) => property.id))
      .eq("owner_id", userId)
      .select("id, canonical_slug, slug, lifecycle_state, pipeline_status, quietly_open_to_offers");
    if (updateError) {
      console.error("[WITHDRAW API] Supabase lifecycle update failed:", updateError);
      return NextResponse.json({ error: "Public listing was unpublished, but lifecycle state needs reconciliation", retryable: true }, { status: 500 });
    }

    const events = owned.map((property) => ({
      property_id: property.id,
      operation_key: `withdraw:${property.id}:${normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET ? (property.withdrawn_at || property.canonical_slug_locked_at || property.published_at || property.created_at || "legacy") : now}`,
      from_state: normalizeLifecycleState(property),
      to_state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET,
      actor_id: userId,
      reason: "Owner withdrew listing from ordinary market discovery",
      metadata: { idempotent: normalizeLifecycleState(property) === PROPERTY_LIFECYCLE_STATES.OFF_MARKET },
    }));
    const { error: auditError } = await supabaseAdmin.from("property_lifecycle_events").upsert(events, { onConflict: "operation_key", ignoreDuplicates: true });
    if (auditError) console.error("[WITHDRAW API] Audit insert failed:", auditError);
    if (auditError) {
      return NextResponse.json(
        { error: "Listing is off-market, but lifecycle audit evidence needs reconciliation", retryable: true },
        { status: 500 }
      );
    }

    // A withdrawn or removed listing must stop being served publicly now, not
    // when a TTL expires. /api/cms is backed by a Redis bundle held for ten
    // minutes and a per-instance memory copy held for sixty seconds; without
    // this the property stays in the public catalogue for up to ten minutes
    // after the owner takes it down. Failure is logged, never propagated: the
    // takedown itself has already succeeded and must not be reported as failed
    // because a cache purge could not complete.
    await invalidateCmsBundle().catch((cacheError) => {
      console.error("[ARCHIVE] Catalogue cache purge failed after withdrawal:", cacheError?.message);
    });

    return NextResponse.json({ success: true, state: PROPERTY_LIFECYCLE_STATES.OFF_MARKET, withdrawnCount: updated?.length || owned.length, withdrawnIds: owned.map((property) => property.id), auditWarning: auditError ? "Lifecycle changed; audit event retry is required" : undefined });
  } catch (error) {
    console.error("[WITHDRAW API] Error:", error);
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}