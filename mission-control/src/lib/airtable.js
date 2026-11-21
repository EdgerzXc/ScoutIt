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
import { escapeAirtableFormulaString } from "./airtableFormula.mjs";
import { purgePublicCatalogueCache } from "./publicCatalogueCache";
import { parsePointToLatLng } from "./geoPoint.mjs";
import { stripPropertyTags } from "./propertyText.mjs";

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

// A-060. The public map reads Airtable Latitude/Longitude; /api/cms only
// geocodes from the location text when they are MISSING. So a record published
// from here without them keeps whatever coarse guess the geocoder made, and a
// staff pin correction has nowhere to land. The main app has always sent these
// two fields at publish; this client did not, which is the same omission class
// as finding W3 above.
function coordinateFields(property) {
  const point = parsePointToLatLng(property?.coordinates);
  if (!point) return {};
  return { Latitude: point.lat, Longitude: point.lng };
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
    ...reverseMapCategoryFields(property.details, category),

    Title: property.title,
    Location: property.location || "",
    SpaceTypography: property.type ? cap(property.type) : "Unknown",
    SpaceCategory: category ? cap(category) : "Unknown",
    ...(property.last_verified_date ? { Last_Verified_Date: property.last_verified_date } : {}),
    ...coordinateFields(property),
    ...photoFields(property),
  };
}

function draftSeoFields(details) {
  const title = typeof details?.seo_title === "string" ? stripPropertyTags(details.seo_title).slice(0, 60) : "";
  const description = typeof details?.seo_description === "string" ? stripPropertyTags(details.seo_description).slice(0, 160) : "";
  return {
    ...(title ? { SEO_Title: title } : {}),
    ...(description ? { SEO_Description: description } : {}),
  };
}

async function findRecordIdBySlug(apiKey, baseId, slug) {
  const safe = escapeAirtableFormulaString(slug);
  const params = `filterByFormula=${encodeURIComponent(`{Slug}='${safe}'`)}&maxRecords=2`;
  const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}?${params}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    redirect: "error",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Airtable lookup failed: ${res.status}`);
  const json = await res.json();
  if (json.records?.length > 1) throw new PublicationBindingError("Airtable returned more than one record for this address.");
  return json.records?.[0]?.id ?? null;
}

class PublicationBindingError extends Error {
  code = "AIRTABLE_PUBLICATION_BINDING";
}

async function mutatePropertyRecord(method, recordId, payload) {
  const { apiKey, baseId } = getCreds();
  if (recordId != null && !/^rec[A-Za-z0-9]+$/.test(recordId)) throw new Error("Invalid Airtable record reference.");
  const url = `${BASE_URL}/${baseId}/${TABLE}${recordId ? `/${recordId}` : ""}`;
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(5000),
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (!response.ok) throw new Error(`Airtable did not confirm the property change (${response.status}).`);
  return response.json();
}

async function patchBoundProperty(binding, fields, approved) {
  const { apiKey, baseId } = getCreds();
  if (!binding?.slug || !/^rec[A-Za-z0-9]+$/.test(binding.recordId || "")) {
    throw new PublicationBindingError("The verified public record is missing.");
  }
  const found = await findRecordIdBySlug(apiKey, baseId, binding.slug);
  if (found !== binding.recordId) throw new PublicationBindingError("The canonical address belongs to a different record.");
  const record = await mutatePropertyRecord("PATCH", binding.recordId, { fields, typecast: true });
  const flag = record?.fields?.Approved_For_ScoutIt;
  if (record?.id !== binding.recordId || record.fields?.Slug !== binding.slug ||
      (approved === false ? flag !== false && flag !== undefined : flag !== true)) {
    throw new Error("Airtable did not confirm the expected public record and its state.");
  }
  return record;
}

export const publicationProvider = {
  async stage(property) {
    if (!property.title?.trim()) throw new Error("A property title is required.");
    const fields = {
      ...listingFields(property),
      ...draftSeoFields(property.details),
      Approved_For_ScoutIt: false,
      ...(Array.isArray(property.details?.units_inventory)
        ? { Units_JSON: JSON.stringify(property.details.units_inventory) }
        : {}),
    };
    const response = await mutatePropertyRecord("POST", null, { records: [{ fields }], typecast: true });
    const record = response?.records?.[0];
    const flag = record?.fields?.Approved_For_ScoutIt;
    const slug = record?.fields?.Slug;
    if (!/^rec[A-Za-z0-9]+$/.test(record?.id || "") || typeof slug !== "string" || !slug.trim() ||
        (flag !== false && flag !== undefined)) {
      throw new Error("Airtable did not confirm the staged draft and its computed address.");
    }
    return { slug, recordId: record.id };
  },
  async activate(binding, property) {
    const fields = { ...listingFields(property), ...draftSeoFields(property.details) };
    delete fields.Title;
    await patchBoundProperty(binding, { ...fields, Approved_For_ScoutIt: true }, true);
  },
  async withdraw(recordId) {
    const record = await mutatePropertyRecord("PATCH", recordId, { fields: { Approved_For_ScoutIt: false } });
    const flag = record?.fields?.Approved_For_ScoutIt;
    if (record?.id !== recordId || !record.fields || (flag !== false && flag !== undefined)) {
      throw new Error("Airtable did not confirm removal.");
    }
  },
  async removeDraft(recordId) {
    const result = await mutatePropertyRecord("DELETE", recordId);
    if (result?.id !== recordId || result.deleted !== true) throw new Error("Airtable did not confirm draft cleanup.");
  },
  refresh: (withdrawn = []) => purgePublicCatalogueCache({ withdrawn }),
};

export async function editBoundProperty(binding, { property, seoTitle, seoDescription }) {
  const fields = property ? listingFields(property) : {};
  delete fields.Title;
  delete fields.Last_Verified_Date;
  if (seoTitle !== undefined) fields.SEO_Title = seoTitle;
  if (seoDescription !== undefined) fields.SEO_Description = seoDescription;
  await patchBoundProperty(binding, fields, true);
  return publicationProvider.refresh();
}

export async function unpublishBoundProperty(binding) {
  await patchBoundProperty(binding, { Approved_For_ScoutIt: false }, false);
  const cache = await publicationProvider.refresh([binding]);
  return { recordId: binding.recordId, cache };
}

/**
 * A-060 — push a corrected pin to an ALREADY-PUBLISHED Airtable record.
 *
 * The Position Queue exists because staff notice a wrong pin *by seeing it on
 * the live map*, which means the listing is published by definition. Publishing
 * again to move two numbers would rewrite ninety fields and re-assert the live
 * gate, so this is deliberately a narrow PATCH: Latitude and Longitude, nothing
 * else. It cannot publish an unpublished record, and it cannot unpublish one.
 *
 * Throws on any failure. A pin that silently did not reach the public map is
 * exactly the defect this closes, so the caller must be told.
 *
 * @param {{slug: string, lat: number, lng: number}} input
 * @returns {Promise<{recordId: string}>}
 */
export async function syncCoordinatesToAirtable({ binding, lat, lng }) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Latitude and longitude must both be numbers.");
  }

  const result = await patchBoundProperty(binding, { Latitude: lat, Longitude: lng }, true);
  if (result.fields.Latitude !== lat || result.fields.Longitude !== lng) {
    throw new Error("Airtable did not confirm the new map coordinates.");
  }
  return { recordId: binding.recordId };
}

export async function updateBoundPropertyImage(binding, mediaLink) {
  const result = await patchBoundProperty(binding, { Image: mediaLink }, true);
  if ((result.fields.Image || null) !== mediaLink) throw new Error("Airtable did not confirm the new listing image.");
  return publicationProvider.refresh();
}

/**
 * Unpublish a property from Airtable (sets Approved_For_ScoutIt = false).
 * Invalidates the public catalogue Redis cache.
 * @param {string} slug
 * @returns {Promise<{recordId: string|null, cache: any}>}
 */
export async function unpublishPropertyFromAirtable(slug) {
  const { apiKey, baseId } = getCreds();
  if (!slug) return { recordId: null, cache: null };

  const recordId = await findRecordIdBySlug(apiKey, baseId, slug);
  if (!recordId) {
    const cache = await purgePublicCatalogueCache({ withdrawn: [{ slug }] });
    return { recordId: null, cache };
  }

  const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: { Approved_For_ScoutIt: false } }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable unpublish failed: ${res.status} ${errText}`);
  }

  const record = await res.json();
  const approved = record.fields?.Approved_For_ScoutIt;
  if (record.id !== recordId || !record.fields || (approved !== false && approved !== undefined)) {
    throw new Error("Airtable did not confirm that the listing is unpublished.");
  }

  const cache = await purgePublicCatalogueCache({ withdrawn: [{ slug, recordId }] });
  return { recordId, cache };
}

/**
 * Updates arbitrary fields in an already published Airtable property record.
 * Invalidates the public catalogue Redis cache.
 * @param {string} slug
 * @param {object} fields
 * @returns {Promise<{recordId: string|null, cache: any}>}
 */
export async function updatePropertyInAirtable(slug, fields) {
  const { apiKey, baseId } = getCreds();
  if (!slug) return { recordId: null, cache: null };
  if (fields && typeof fields === "object") {
    if ("Slug" in fields) {
      throw new Error("Never write Slug in an Airtable payload; Slug is a computed formula field (Dual-CMS Rule #3).");
    }
    if ("Title" in fields) {
      throw new Error(
        "Cannot mutate Title on a published Airtable record because Airtable's Slug formula would recompute and break the locked canonical URL (GAP-33)."
      );
    }
  }

  const recordId = await findRecordIdBySlug(apiKey, baseId, slug);
  if (!recordId) {
    return { recordId: null, cache: null };
  }

  const res = await fetch(`${BASE_URL}/${baseId}/${TABLE}/${recordId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields, typecast: true }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Airtable property update failed: ${res.status} ${errText}`);
  }

  const cache = await purgePublicCatalogueCache();
  return { recordId, cache };
}
