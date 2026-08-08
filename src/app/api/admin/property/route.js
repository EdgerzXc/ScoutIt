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
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { updateProperty } from "@/lib/airtable";
import { sanitizeError } from "@/lib/sanitizeError";
import { sanitizeObject } from "@/lib/sanitize";
import { isInternal, fieldMeta } from "@/lib/propertyFieldRegistry";
import { canChangeDisplayTitle, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";

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
// Body: { id, details?, title?, location?, seo_title?, seo_description? }
// Saves one section at a time. `details` is MERGED, not replaced, so saving the
// Commercial section cannot wipe the Residential one.
export async function PATCH(request) {
  try {
    const auth = await requireAdmin(request, { label: "ADMIN PROPERTY" });
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { data: current, error: loadError } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !current) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const lifecycleState = normalizeLifecycleState(current);
    const isLive = lifecycleState === PROPERTY_LIFECYCLE_STATES.LIVE;
    if (body.title !== undefined && body.title !== current.title && !canChangeDisplayTitle(current)) {
      return NextResponse.json(
        { error: "Live listing titles are locked to protect the canonical public URL" },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }
    const apiKey = process.env.AIRTABLE_API_KEY;
    const baseId = process.env.AIRTABLE_BASE_ID;
    const canonicalSlug = current.canonical_slug || current.slug;
    if (isLive && (!apiKey || !baseId)) {
      return NextResponse.json({ error: "Live property updates are unavailable while the Airtable CMS is unavailable" }, { status: 503 });
    }
    if (isLive && !canonicalSlug) return NextResponse.json({ error: "Live property is missing its canonical slug" }, { status: 409 });

    // Strip internal fields from whatever the client sent. Staff edit notes
    // through their own dedicated controls, not by injecting field names into
    // a section payload.
    const incoming = body.details ? sanitizeObject(body.details) : {};
    const rejected = Object.keys(incoming).filter(isInternal);
    const safeDetails = Object.fromEntries(
      Object.entries(incoming).filter(([key]) => !isInternal(key)),
    );
    if (rejected.length) {
      console.warn(`[ADMIN PROPERTY] Ignored internal keys from client: ${rejected.join(", ")}`);
    }

    // MERGE, don't replace — a section save must not clear other sections.
    const patch = { details: { ...(current.details || {}), ...safeDetails } };
    for (const key of ["title", "location", "seo_title", "seo_description"]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const { data: saved, error: saveError } = await supabaseAdmin
      .from("properties")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (saveError) {
      return NextResponse.json({ error: sanitizeError(saveError, "Could not save the property.") }, { status: 500 });
    }

    // Mirror to Airtable only for live listings. Same shape as
    // /api/dashboard/update: an Airtable failure must NOT lose the Supabase
    // write, so we return success with a warning instead of throwing.
    let warning = null;
    if (isLive) {
      const apiKey = process.env.AIRTABLE_API_KEY;
      const baseId = process.env.AIRTABLE_BASE_ID;
      if (apiKey && baseId && canonicalSlug) {
        try {
          const atResult = await updateProperty(apiKey, baseId, canonicalSlug, saved);
          
          const updatedSlug = atResult?.fields?.Slug;
          if (updatedSlug && updatedSlug !== canonicalSlug) {
            return NextResponse.json(
              { error: "The public CMS returned a different slug; staff reconciliation is required", retryable: false },
              { status: 409 }
            );
          }
        } catch (airtableErr) {
          console.error("[ADMIN PROPERTY] Airtable sync failed:", airtableErr);
          const failureResponse = NextResponse.json(
            { success: false, retryable: true, error: "Supabase updated, but the public CMS sync is pending" },
            { status: 502 }
          );
          warning = "Saved, but the public site sync failed — it will retry on the next save.";
          return failureResponse;
        }
      } else if (!current.slug) {
        warning = "Saved. No public listing is linked yet, so nothing was published.";
      }
    }

    return NextResponse.json({
      success: true,
      property: saved,
      ...(warning ? { warning } : {}),
      ...(rejected.length ? { ignoredFields: rejected } : {}),
    });
  } catch (err) {
    console.error("[ADMIN PROPERTY] PATCH failed:", err);
    return NextResponse.json({ error: sanitizeError(err, "Could not save the property.") }, { status: 500 });
  }
}
