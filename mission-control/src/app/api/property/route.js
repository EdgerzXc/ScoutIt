// ═══════════════════════════════════════════════════════════════
// STAFF PROPERTY SECTION SAVE
//
// The staff-console counterpart to the main app's /api/admin/property.
// PropertySectionEditor is vendored here byte-identical (the drift test in the
// MAIN repo asserts that), so this route must match the shape that component
// already speaks: PATCH { id, details } -> { success, property, warning? }.
//
// Why a route handler and not a Server Action: the vendored component calls
// `fetch(endpoint, { method: "PATCH" })`. Changing it to use an action would
// fork the copy and defeat the drift guard — the exact failure (W3) this whole
// change set exists to fix.
//
// AUTH: cookie session -> getCurrentStaff() -> assertTier. Unlike the main app
// there is no bearer token; every staff request here is already cookie-scoped.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, assertTier, logAction, TIERS } from "@/lib/rbac";
import {
  canonicalSlugFor,
  titleChangeWouldDriftCanonicalUrl,
} from "@/lib/canonicalSlugPolicy.mjs";
import { editBoundProperty } from "@/lib/airtable";
import { getPropertyBinding, isLiveProperty, isProtectedProperty, matchPropertySnapshot } from "@/lib/propertyPublication.mjs";
import { sanitizePropertyDetails, stripPropertyTags } from "@/lib/propertyText.mjs";
// Internal/staff-only keys must never arrive from a client payload. Import the
// registry's own predicate rather than re-deriving one here: it is the single
// definition of what "internal" means, and a second guess would drift from it
// the moment a field's visibility changes.
import { isInternal } from "@/lib/propertyFieldRegistry";

const PROPERTY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TEXT_LIMITS = { title: 255, location: 255, seo_title: 255, seo_description: 500 };

// ── GET /api/property?id=… ──────────────────────────────────────
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
  if (!PROPERTY_ID.test(id || "")) return NextResponse.json({ error: "A valid property ID is required." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("properties").select("*").eq("id", id).single();

  if (error || !data) {
    return NextResponse.json({ error: "Property not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  return NextResponse.json({ property: data }, { headers: { "Cache-Control": "private, no-store" } });
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
    const body = await request.json().catch(() => null);
    const id = body?.id;
    if (typeof id !== "string" || !PROPERTY_ID.test(id) ||
        (body.details !== undefined && (!body.details || typeof body.details !== "object" || Array.isArray(body.details)))) {
      return NextResponse.json({ error: "Invalid property edit." }, { status: 400 });
    }
    const text = {};
    for (const [key, max] of Object.entries(TEXT_LIMITS)) {
      if (body[key] === undefined) continue;
      if (typeof body[key] !== "string" || body[key].length > max) {
        return NextResponse.json({ error: "Invalid property edit." }, { status: 400 });
      }
      text[key] = stripPropertyTags(body[key]);
      if (!text[key]) return NextResponse.json({ error: "Enter a value for the edited field." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: current, error: loadError } = await admin
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (loadError || !current) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    if (isProtectedProperty(current)) {
      return NextResponse.json({ error: "This listing must use the protected review workflow." }, { status: 409 });
    }
    if (titleChangeWouldDriftCanonicalUrl(current, text.title)) {
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
          attempted_title: text.title,
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

    const live = isLiveProperty(current);
    const binding = live ? getPropertyBinding(current) : null;
    if (live && !binding) {
      return NextResponse.json({ error: "This listing requires publication identity reconciliation." }, { status: 409 });
    }
    if (!live && (text.seo_title || text.seo_description)) {
      return NextResponse.json({ error: "Public SEO can be edited once the listing is live." }, { status: 409 });
    }

    const incoming = sanitizePropertyDetails(body.details || {});
    const rejected = Object.keys(incoming).filter(isInternal);
    const safeDetails = Object.fromEntries(
      Object.entries(incoming).filter(([key]) => !isInternal(key)),
    );
    // MERGE, never replace. Saving "Commercial" must not wipe "Residential" —
    // the editor deliberately posts one section at a time.
    const patch = { details: { ...(current.details || {}), ...safeDetails } };
    for (const key of ["title", "location"]) {
      if (text[key] !== undefined) patch[key] = text[key];
    }

    const query = admin.from("properties").update(patch).eq("id", id);
    const { data: saved, error: saveError } = await matchPropertySnapshot(query, current).select().maybeSingle();

    if (saveError) {
      console.error("[MC PROPERTY] Supabase update failed:", saveError);
      return NextResponse.json({ error: "Could not save the property." }, { status: 500 });
    }
    if (!saved) return NextResponse.json({ error: "The property changed while saving. Reload it and retry." }, { status: 409 });

    // Mirror to the public CMS only for listings that are actually live.
    // An Airtable failure must NOT discard the Supabase write — return success
    // with a warning so the staff member knows the public site lagged behind.
    let warning = null;
    if (binding) {
      try {
        const cache = await editBoundProperty(binding, {
          property: saved, seoTitle: text.seo_title, seoDescription: text.seo_description,
        });
        if (!cache.purged) warning = "Saved to Airtable. Check the public page before relying on the change.";
      } catch (airtableErr) {
        console.error("[MC PROPERTY] Airtable sync failed:", airtableErr?.code || airtableErr?.name);
        warning = "Saved privately. The public listing update needs a retry.";
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

    return NextResponse.json(
      {
        success: true,
        property: saved,
        ...(warning ? { warning } : {}),
        ...(rejected.length ? { ignoredFields: rejected } : {}),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    console.error("[MC PROPERTY] PATCH failed:", err);
    return NextResponse.json({ error: "Could not save the property." }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
