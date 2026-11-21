// ═══════════════════════════════════════════════════════════════
// STAFF PROPERTY EDITOR — section-by-section editing for Mission Control
//
// WHY THIS EXISTS
// Before 2026-07-30 Mission Control could not edit properties at all. It called
// exactly two endpoints and both were reads. All editing lived in Owner Mode,
// so staff had no way to correct a listing they didn't own.
//
// This is the staff counterpart to /api/dashboard/update. It reuses that
// route's write path deliberately — Supabase first, then Airtable on approved
// listings — so there is ONE sync implementation rather than two that drift.
//
// SECURITY
// • Admin role is verified against user_profiles, same pattern as
//   /api/admin/approve. A valid session is not enough.
// • INTERNAL fields are stripped from client input. The registry marks staff
//   notes, pipeline state and internal pricing as internal; a client must not
//   be able to set them just by naming them in a payload.
// • GET returns internal fields (staff legitimately need to read notes) but
//   never leaves them in a response for a non-admin, because the role check
//   runs before any data is read.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { updateProperty } from "@/lib/airtable";
import { invalidateCmsBundle } from "@/lib/cmsCache";
import { sanitizeError } from "@/lib/sanitizeError";
import { sanitizeObject, stripAllTags } from "@/lib/sanitize";
import { isInternal, fieldMeta } from "@/lib/propertyFieldRegistry";
import {
  canChangeDisplayTitle, getPublicationBinding, isMarketVisible, isPermanentlyRemoved,
  isStaffSuspended, matchPublicationSnapshot,
} from "@/lib/propertyLifecycle";

const editSchema = z.object({
  id: z.uuid(),
  title: z.string().max(255).transform(stripAllTags).pipe(z.string().min(1)).optional(),
  location: z.string().max(255).transform(stripAllTags).pipe(z.string().min(1)).optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  seo_title: z.string().max(255).transform(stripAllTags).optional(),
  seo_description: z.string().max(500).transform(stripAllTags).optional(),
  seo_json_ld: z.string().max(65000).refine((value) => {
    try {
      const parsed = JSON.parse(value);
      return Boolean(parsed && typeof parsed === "object");
    } catch {
      return false;
    }
  }).optional(),
});

// ── GET /api/admin/property?id=… ────────────────────────────────
// Returns the property plus the registry metadata the editor renders from,
// so the client never has to hardcode a field list that can drift from Airtable.
export async function GET(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PROPERTY" });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data: property, error } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Describe the detail keys actually present so the editor can group and
    // label them without a second round trip.
    const details = property.details || {};
    const schema = Object.keys(details).map((key) => fieldMeta(key));

    return NextResponse.json({ property, schema });
  } catch (err) {
    console.error("[ADMIN PROPERTY] GET failed:", err);
    return NextResponse.json({ error: sanitizeError(err, "Could not load the property.") }, { status: 500 });
  }
}

// ── PATCH /api/admin/property ───────────────────────────────────
// Body: { id, details?, title?, location?, seo_title?, seo_description?, seo_json_ld? }
// Saves one section at a time. `details` is MERGED, not replaced, so saving the
// Commercial section cannot wipe the Residential one.
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PROPERTY" });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const parsed = editSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid property edit" }, { status: 400 });
    const { id, details, title, location, ...seo } = parsed.data;

    const { data: current, error: loadError } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !current) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (isPermanentlyRemoved(current)) {
      return NextResponse.json({ error: "Permanently removed listings are retained without further edits" }, { status: 410 });
    }
    const isLive = isMarketVisible(current) && !isStaffSuspended(current);
    if (title !== undefined && title !== current.title && !canChangeDisplayTitle(current)) {
      return NextResponse.json(
        { error: "Live listing titles are locked to protect the canonical public URL" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const binding = isLive ? getPublicationBinding(current) : null;
    if (isLive && !binding) {
      return NextResponse.json({ error: "This listing requires publication identity reconciliation" }, { status: 409 });
    }
    if (isLive && (!apiKey || !baseId)) {
      return NextResponse.json({ error: "Live property updates are unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }
    if (!isLive && Object.keys(seo).length) {
      return NextResponse.json({ error: "Public SEO can be edited once the listing is live" }, { status: 409 });
    }

    // Strip internal fields from whatever the client sent. Staff edit notes
    // through their own dedicated controls, not by injecting field names into
    // a section payload.
    const incoming = details ? sanitizeObject(details) : {};
    const rejected = Object.keys(incoming).filter(isInternal);
    const safeDetails = Object.fromEntries(
      Object.entries(incoming).filter(([key]) => !isInternal(key)),
    );
    // MERGE, don't replace — a section save must not clear other sections.
    // A-146: properties has NO seo_* columns (verified: no migration carries
    // them), so seo keys must never reach the Supabase write — they 500 it.
    // SEO is public display metadata, so it travels Airtable-only, alongside
    // the saved row, in the mirror below.
    const patch = { details: { ...(current.details || {}), ...safeDetails } };
    if (title !== undefined) patch.title = title;
    if (location !== undefined) patch.location = location;

    const query = supabaseAdmin.from("properties").update(patch).eq("id", id);
    const { data: saved, error: saveError } = await matchPublicationSnapshot(query, current).select().maybeSingle();
    if (saveError) {
      return NextResponse.json({ error: sanitizeError(saveError, "Could not save the property.") }, { status: 500 });
    }
    if (!saved) {
      return NextResponse.json({ error: "Listing changed while saving. Reload it and retry.", retryable: true }, { status: 409 });
    }

    let publicCachePending = false;
    if (binding) {
      try {
        const result = await updateProperty(apiKey, baseId, binding.slug, {
          ...seo,
          location: saved.location,
          space_category: saved.space_category,
          details: saved.details,
          expectedRecordId: binding.recordId,
        });
        if (result?.fields?.Slug !== binding.slug) throw new Error("Airtable did not confirm the canonical address");
      } catch (airtableErr) {
        console.error("[ADMIN PROPERTY] Airtable sync failed:", airtableErr?.code || airtableErr?.name);
        return NextResponse.json(
          { success: false, retryable: true, error: "Private changes saved. The public listing update needs a retry." },
          { status: 502 },
        );
      }
      try {
        const purge = await invalidateCmsBundle();
        publicCachePending = purge.sharedCachePurged === false;
      } catch (cacheError) {
        console.error("[ADMIN PROPERTY] Catalogue cache purge failed after update:", cacheError?.message);
        publicCachePending = true;
      }
    }

    return NextResponse.json({
      success: true,
      property: saved,
      publicCachePending,
      ...(publicCachePending ? { warning: "Saved; public refresh unconfirmed. Check the listing page." } : {}),
      ...(rejected.length ? { ignoredFields: rejected } : {}),
    });
  } catch (err) {
    console.error("[ADMIN PROPERTY] PATCH failed:", err);
    return NextResponse.json({ error: sanitizeError(err, "Could not save the property.") }, { status: 500 });
  }
}
