// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STAFF PROPERTY SECTION SAVE
//
// The staff-console counterpart to the main app's /api/admin/property.
// PropertySectionEditor is vendored here byte-identical (the drift test in the
// MAIN repo asserts that), so this route must match the shape that component
// already speaks: PATCH { id, details } -> { success, property, warning? }.
//
// Why a route handler and not a Server Action: the vendored component calls
// `fetch(endpoint, { method: "PATCH" })`. Changing it to use an action would
// fork the copy and defeat the drift guard â€” the exact failure (W3) this whole
// change set exists to fix.
//
// AUTH: cookie session -> getCurrentStaff() -> assertTier. Unlike the main app
// there is no bearer token; every staff request here is already cookie-scoped.
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import {
  canonicalSlugFor,
  titleChangeWouldDriftCanonicalUrl,
} from "@/lib/canonicalSlugPolicy.mjs";
import { publishPropertyToAirtable } from "@/lib/airtable";
// Internal/staff-only keys must never arrive from a client payload. Import the
// registry's own predicate rather than re-deriving one here: it is the single
// definition of what "internal" means, and a second guess would drift from it
// the moment a field's visibility changes.
import { isInternal } from "@/lib/propertyFieldRegistry";

// â”€â”€ GET /api/property?id=â€¦ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Returns the FULL row (including `details`), fetched only when a staff member
// actually expands a row. The CMS list query deliberately omits `details` so a
// 200-listing queue stays one cheap request instead of hauling every blob.
export async function GET(request) {
  let staff;
  try {
    staff = await getCurrentStaff();
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch (err) {
    return NextResponse.json({ error: err.message || "Not authorised" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("properties").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Property not found" }, { status: 404 });
  }
  return NextResponse.json({ property: data });
}

export async function PATCH(request) {
  let staff;
  try {
    staff = await getCurrentStaff();
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch (err) {
    // assertTier throws a message written for humans; getCurrentStaff throws on
    // no session. Both are "you may not do this", not a server fault.
    return NextResponse.json({ error: err.message || "Not authorised" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const admin = createAdminClient();
    const { data: current, error: loadError } = await admin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !current) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (titleChangeWouldDriftCanonicalUrl(current, body.title)) {
      const canonicalSlug = canonicalSlugFor(current);
      await logAction({
        staff,
        action: "property.title_change_blocked",
        targetTable: "properties",
        targetId: id,
        reason: "Blocked an ordinary edit that would change a locked public URL",
        metadata: {
          canonical_slug: canonicalSlug,
          current_title: current.title,
          attempted_title: String(body.title),
        },
      });
      return NextResponse.json(
        {
          error:
            "This published title is locked because Airtable derives the public URL from it. Use the separately approved, audited URL-migration workflow.",
          code: "CANONICAL_SLUG_LOCKED",
          canonicalSlug,
        },
        { status: 409, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const incoming = body.details || {};
    const rejected = Object.keys(incoming).filter(isInternal);
    const safeDetails = Object.fromEntries(
      Object.entries(incoming).filter(([key]) => !isInternal(key)),
    );
    if (rejected.length) {
      console.warn(`[MC PROPERTY] Ignored internal keys from client: ${rejected.join(", ")}`);
    }

    // MERGE, never replace. Saving "Commercial" must not wipe "Residential" â€”
    // the editor deliberately posts one section at a time.
    const patch = { details: { ...(current.details || {}), ...safeDetails } };
    for (const key of ["title", "location", "seo_title", "seo_description"]) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const { data: saved, error: saveError } = await admin
      .from("properties")
      .update(patch)
      .eq("id", id)
      .select()
      .single();

    if (saveError) {
      console.error("[MC PROPERTY] Supabase update failed:", saveError);
      return NextResponse.json({ error: "Could not save the property." }, { status: 500 });
    }

    // Mirror to the public CMS only for listings that are actually live.
    // An Airtable failure must NOT discard the Supabase write â€” return success
    // with a warning so the staff member knows the public site lagged behind.
    let warning = null;
    if (current.pipeline_status === "approved") {
      try {
        const result = await publishPropertyToAirtable(saved);
        // Ordinary edits must never rewrite the first-publication URL.
        // If Airtable reports anything else, preserve Supabase's canonical value
        // and surface reconciliation instead of silently accepting formula drift.
        const canonicalSlug = canonicalSlugFor(current);
        if (result?.slug && canonicalSlug && result.slug !== canonicalSlug) {
          warning =
            "Saved, but Airtable returned a different slug. ScoutIt preserved the canonical URL; publication reconciliation is required.";
        }
      } catch (airtableErr) {
        console.error("[MC PROPERTY] Airtable sync failed:", airtableErr);
        warning = "Saved, but the public site sync failed â€” it will retry on the next save.";
      }
    }

    await logAction({
      staff,
      action: "property.section_edit",
      targetTable: "properties",
      targetId: id,
      reason: `Edited ${Object.keys(safeDetails).length} field(s) from the staff editor`,
      metadata: { fields: Object.keys(safeDetails), airtable_warning: warning },
    });

    return NextResponse.json({
      success: true,
      property: saved,
      ...(warning ? { warning } : {}),
      ...(rejected.length ? { ignoredFields: rejected } : {}),
    });
  } catch (err) {
    console.error("[MC PROPERTY] PATCH failed:", err);
    return NextResponse.json({ error: "Could not save the property." }, { status: 500 });
  }
}
