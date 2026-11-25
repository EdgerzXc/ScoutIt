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
import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
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

const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(val) {
  return Boolean(val) && typeof val === "object" && !Array.isArray(val);
}

// ── GET /api/property?id=… ──────────────────────────────────────
// Returns the FULL row (including `details`), fetched only when a staff member
// actually expands a row. The CMS list query deliberately omits `details` so a
// 200-listing queue stays one cheap request instead of hauling every blob.
export async function GET(request) {
  let staff;
  try {
    staff = await getCurrentStaff();
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id || id.length > 128) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("properties").select("*").eq("id", id).single();

    if (error || !data) {
      return NextResponse.json({ error: "Property not found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
    }
    return NextResponse.json({ property: data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[MC PROPERTY] GET failed:", err);
    return NextResponse.json({ error: "Property operation failed" }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}

export async function PATCH(request) {
  let staff;
  try {
    staff = await getCurrentStaff();
    assertTier(staff, TIERS.OPS_MANAGER);
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!isPlainObject(body)) {
      return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
    }
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id || id.length > 128) return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });

    if (body.details !== undefined && !isPlainObject(body.details)) {
      return NextResponse.json({ error: "details must be a plain object" }, { status: 400 });
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

    if (titleChangeWouldDriftCanonicalUrl(current, body.title)) {
      const canonicalSlug = canonicalSlugFor(current);
      await logActionStrict({
        staff,
        action: "property.title_change_blocked",
        targetTable: "properties",
        targetId: id,
        reason: "Blocked an ordinary edit that would change a locked public URL",
        metadata: {
          canonical_slug: canonicalSlug,
          current_title: current.title,
          attempted_title: String(body.title).slice(0, 300),
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
    const rejected = [];
    const safeDetails = {};
    for (const [key, value] of Object.entries(incoming)) {
      if (FORBIDDEN_KEYS.has(key) || isInternal(key)) {
        rejected.push(key);
        continue;
      }
      const boundedVal = typeof value === "string" ? value.slice(0, 10000) : value;
      Object.defineProperty(safeDetails, key, {
        value: boundedVal,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
    if (rejected.length) {
      console.warn(`[MC PROPERTY] Ignored internal/disallowed keys from client: ${rejected.join(", ")}`);
    }

    // MERGE, never replace. Saving "Commercial" must not wipe "Residential" —
    // the editor deliberately posts one section at a time.
    const patch = { details: { ...(current.details || {}), ...safeDetails } };
    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
      }
      patch.title = body.title.trim().slice(0, 300);
    }
    if (body.location !== undefined) {
      if (typeof body.location !== "string") {
        return NextResponse.json({ error: "location must be a string" }, { status: 400 });
      }
      patch.location = body.location.trim().slice(0, 500);
    }

    // seo_title / seo_description are Airtable-only fields (not Supabase columns);
    // strip from the Supabase update patch and forward only to Airtable publish.
    const airtableSeoOverrides = {};
    if (typeof body.seo_title === "string") {
      airtableSeoOverrides.seo_title = body.seo_title.trim().slice(0, 200);
    }
    if (typeof body.seo_description === "string") {
      airtableSeoOverrides.seo_description = body.seo_description.trim().slice(0, 500);
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
    // An Airtable failure must NOT discard the Supabase write — return success
    // with a warning so the staff member knows the public site lagged behind.
    let warning = null;
    if (current.pipeline_status === "approved") {
      try {
        const result = await publishPropertyToAirtable({ ...saved, ...airtableSeoOverrides });
        if (!result.cache?.purged) {
          warning = "Saved to Airtable, but the public catalogue cache could not be cleared.";
        }
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
        warning = "Saved, but the public site sync failed — it will retry on the next save.";
      }
    }

    await logActionStrict({
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
    return NextResponse.json({ error: "Property operation failed" }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  }
}
