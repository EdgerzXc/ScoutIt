// Minimal Airtable client for Mission Control's publish loop (server-only).
//
// Mirrors the main app's proven pattern (src/lib/airtable.js insertProperty /
// updateProperty + /api/dashboard/publish): the LIVE public site only shows
// PROPERTIES_CMS records where Approved_For_ScoutIt is true, and Airtable's
// `Slug` is a FORMULA field (computed from Title) — never write it; read the
// computed value back and persist it to Supabase so Airtable stays the single
// source of slug truth.
//
// ⚠️ CORRECTED 2026-07-30. This header used to say the client was "kept
// deliberately lean… rich category/unit detail continues to flow through the
// owner's publish path in the main app." That was WRONG as a design, and it was
// costing real data: a staff publish here wrote only 6 fields, so every category
// spec (rent, GLA, building grade, seating capacity, room count…) went STALE in
// Airtable while Supabase moved on — silently, because a PATCH erases nothing
// and the listing still looked published. The owner path is not a substitute:
// staff publish listings owners never touch again.
//
// It now writes the SAME ~90 fields as the main app, via the vendored
// `propertyFieldMapping.js`. See finding W3 in
// _SCOUTIT_BRAIN/04_DATA_AND_SCHEMA/AIRTABLE_COMPRESSION_PLAN.md.

import { reverseMapCategoryFields } from "./propertyFieldMapping";

const BASE_URL = "https://api.airtable.com/v0";
const TABLE = "PROPERTIES_CMS";

function getCreds() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error(
      "Airtable credentials missing (AIRTABLE_API_KEY / AIRTABLE_BASE_ID). Cannot publish to the live site."
    );
  }
  return { apiKey, baseId };
}

// Same photo mapping as the main app's photoFields().
function photoFields(property) {
  const fromDetails = Array.isArray(property?.details?.photos)
    ? property.details.photos.filter(Boolean)
    : [];
  const list = fromDetails.length
    ? fromDetails
    : property?.media_link
      ? [property.media_link]
      : [];
  if (!list.length) return {};
  return { Photos: list.join(","), Image: list[0] };
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function listingFields(property) {
  const category = property.space_category || property.type;
  return {
    // ── Category spec fields (~90) ─────────────────────────────
    // FIXED 2026-07-30 (finding W3). This function used to write only the six
    // fields below, while the main app wrote ~90. A staff publish therefore
    // left rent, GLA, building grade, seating capacity, room count and every
    // other spec STALE in Airtable — silently, because this is a PATCH so
    // nothing was erased and the listing still looked published.
    //
    // Spread FIRST so the explicit fields below always win on any key overlap.
    ...reverseMapCategoryFields(property.details),

    Title: property.title,
    Location: property.location || "",
    SpaceTypography: property.type ? cap(property.type) : "Unknown",
    SpaceCategory: category ? cap(category) : "Unknown",
    // THE live-site gate. Set explicitly on BOTH insert and update so staff
    // publishing always flips a previously-unpublished record live (the main
    // lib's update path leaves it untouched; that's owner-flow behavior).
    Approved_For_ScoutIt: true,
    ...(property.details?.units_inventory
      ? { Units_JSON: JSON.stringify(property.details.units_inventory) }
      : {}),
    ...photoFields(property),
  };
}

async function findRecordIdBySlug(apiKey, baseId, slug) {
  // Escape single quotes for filterByFormula string literal.
  const safe = String(slug).replace(/'/g, "\\'");
  const params = `filterByFormula=${encodeURIComponent(`{Slug}='${safe}'`)}&maxRecords=1`;
  const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`Airtable lookup failed: ${res.status}`);
  const json = await res.json();
  return json.records?.[0]?.id ?? null;
}

/**
 * Publish (or re-publish) a Supabase property row to the live Airtable CMS.
 * Update-first by slug, insert if it doesn't exist. Throws on any failure —
 * callers must NOT mark the property approved unless this returns.
 *
 * @param {object} property - full Supabase `properties` row
 * @returns {Promise<{slug: string, recordId: string, mode: "updated"|"created"}>}
 *          slug = Airtable's COMPUTED slug (canonical)
 */
export async function publishPropertyToAirtable(property) {
  const { apiKey, baseId } = getCreds();
  if (!property?.title) {
    throw new Error("Property has no title — cannot publish to Airtable.");
  }

  const fields = listingFields(property);

  // 1. Update path — only if we have a slug to find the record by.
  if (property.slug) {
    const recordId = await findRecordIdBySlug(apiKey, baseId, property.slug);
    if (recordId) {
      const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}/${recordId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        // typecast lets singleSelect choices auto-create instead of 422ing.
        body: JSON.stringify({ fields, typecast: true }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Airtable update failed: ${res.status} ${errText}`);
      }
      const updated = await res.json();
      return {
        slug: updated?.fields?.Slug || property.slug,
        recordId,
        mode: "updated",
      };
    }
  }

  // 2. Insert path.
  const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable insert failed: ${res.status} ${errText}`);
  }
  const json = await res.json();
  const record = json.records?.[0];
  if (!record?.fields?.Slug) {
    // Record created but no computed slug back — surface loudly rather than
    // silently persisting a broken public URL.
    throw new Error("Airtable created the record but returned no computed Slug.");
  }
  return { slug: record.fields.Slug, recordId: record.id, mode: "created" };
}
