"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, logActionStrict, TIERS } from "@/lib/rbac";
import { syncCoordinatesToAirtable } from "@/lib/airtable";
import { purgePublicCatalogueCache } from "@/lib/publicCatalogueCache";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";
import { getPropertyBinding, isLiveProperty, isProtectedProperty, matchPropertySnapshot } from "@/lib/propertyPublication.mjs";
import { parsePointToLatLng } from "@/lib/geoPoint.mjs";

// Staff correction of a listing's position.
//
// Coordinates are never typed by owners — they are geocoded from a line of
// location text, and that inference is often only good to the level of a
// district. This is the escape hatch: when the automatic answer is too coarse,
// a human puts the pin where the building actually is.

const PROPERTY_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setVerifiedCoordinates(_previous, formData) {
  const staff = await getCurrentStaff();
  if (!staff) {
    return { ok: false, message: "Not authorised" };
  }
  try {
    assertTier(staff, TIERS.AGENT);
  } catch {
    return { ok: false, message: "Not authorised" };
  }

  const id = String(formData.get("id") || "");
  const latText = formData.get("lat");
  const lngText = formData.get("lng");
  const lat = typeof latText === "string" && latText.trim() ? Number(latText) : NaN;
  const lng = typeof lngText === "string" && lngText.trim() ? Number(lngText) : NaN;

  if (!PROPERTY_ID.test(id)) return { ok: false, message: "Select a valid listing." };
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, message: "Latitude and longitude must both be numbers" };
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { ok: false, message: "Those coordinates are not on Earth" };
  }
  // The Philippines, generously bounded. A transposed lat/lng — the single most
  // common way to enter a coordinate wrongly — lands outside this and is caught
  // here rather than by a visitor seeing a map of the Pacific.
  if (lat < 4 || lat > 21 || lng < 116 || lng > 127) {
    return { ok: false, message: "Outside the Philippines — check the values are not swapped" };
  }

  const supabase = createAdminClient();

  const { data: row, error: readErr } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (readErr || !row) return { ok: false, message: "Listing not found" };
  if (isProtectedProperty(row)) return { ok: false, message: "Use the protected review workflow for this listing." };
  const isPublished = isLiveProperty(row);
  const binding = isPublished ? getPropertyBinding(row) : null;
  if (isPublished && !binding) {
    return { ok: false, message: "Verify this listing’s Airtable record before moving its public pin." };
  }

  let intentId;
  try {
    intentId = await logActionStrict({
      staff, action: "coordinates.verify.intent", targetTable: "properties", targetId: id,
      metadata: { lat, lng, recordId: binding?.recordId || null },
    });
  } catch {
    return { ok: false, message: "Could not record the pin change in the staff audit." };
  }

  const details = { ...(row.details || {}) };
  details.geo = {
    ...(details.geo || {}),
    lat,
    lng,
    precision: "exact",
    uncertain: false,
    reason: null,
    // Kept so the record shows this was a human decision, not the geocoder's.
    verifiedBy: staff.id,
    verifiedAt: new Date().toISOString(),
    source: "staff",
  };

  // A-060. A pin fixed BEFORE publication already flowed to Airtable through
  // the publish route. A pin fixed AFTER publication stopped here, in Supabase,
  // which is the wrong way round: staff notice a wrong pin precisely because it
  // is live on the public map. Anything already published therefore has to be
  // corrected in Airtable too, and the cache in front of it dropped.
  let publicSync = null;

  if (binding) {
    try {
      const { recordId } = await syncCoordinatesToAirtable({ binding, lat, lng });
      const cache = await purgePublicCatalogueCache();
      publicSync = {
        state: "synced",
        recordId,
        cachePurged: cache.purged,
        detail: cache.detail,
        at: new Date().toISOString(),
      };

      // A-063. The audit entry below records that a person decided this.
      // These record what the machinery did about it — which is what you
      // read when a pin is wrong on the public map and nobody remembers
      // touching it.
      await recordSystemEvent({
        event: EVENTS.AIRTABLE_SYNC_OK,
        subjectTable: "properties",
        subjectId: id,
        summary: `Pin for ${binding.slug} pushed to the public CMS`,
        detail: { lat, lng, slug: binding.slug, recordId },
      });
      await recordSystemEvent({
        event: cache.purged ? EVENTS.CACHE_PURGED : EVENTS.CACHE_PURGE_FAILED,
        severity: cache.purged ? "info" : "warning",
        subjectTable: "properties",
        subjectId: id,
        summary: cache.detail,
        detail: { slug: binding.slug },
      });
    } catch (err) {
      // Do NOT write the Supabase correction on top of a failed public sync and
      // call it verified. The queue decides what staff look at next, so a row
      // that leaves it while the public map is still wrong is a wrong pin
      // nobody will be shown again.
      await recordSystemEvent({
        event: EVENTS.AIRTABLE_SYNC_FAILED,
        severity: "error",
        subjectTable: "properties",
        subjectId: id,
        summary: `Pin for ${binding.slug} could not be confirmed`,
        detail: { lat, lng, slug: binding.slug, recordId: binding.recordId, errorCode: err?.code || err?.name },
      });
      await logAction({
        staff,
        action: "coordinates.verify.failed",
        targetTable: "properties",
        targetId: id,
        reason: "Airtable did not confirm the pin",
        metadata: { lat, lng, slug: binding.slug, recordId: binding.recordId, intent_id: intentId, stage: "airtable" },
      });
      return {
        ok: false,
        message:
          "Could not confirm the public pin. The private position is unchanged. Check the public listing before retrying.",
      };
    }
  } else {
    publicSync = {
      state: "not_published",
      detail: "Not published yet; the pin will travel with it when it is.",
      at: new Date().toISOString(),
    };
    await recordSystemEvent({
      event: EVENTS.COORDINATES_VERIFIED,
      subjectTable: "properties",
      subjectId: id,
      summary: `Pin set for an unpublished listing (${row.title || id})`,
      detail: { lat, lng, published: false },
    });
  }

  // Recorded on the row so the provenance of a live pin is readable later:
  // who moved it, when, and whether the public site actually took it.
  details.geo.publicSync = publicSync;

  const query = supabase
    .from("properties")
    .update({ coordinates: `POINT(${lng} ${lat})`, details })
    .eq("id", id);

  const { data: saved, error: writeErr } = await matchPropertySnapshot(query, row, ["coordinates"]).select("id").maybeSingle();
  if (writeErr || !saved) {
    await logAction({
      staff, action: "coordinates.verify.failed", targetTable: "properties", targetId: id,
      reason: "The private pin write could not be confirmed",
      metadata: { lat, lng, recordId: binding?.recordId || null, intent_id: intentId, stage: "supabase" },
    });
    return {
      ok: false,
      message: binding
        ? "Airtable confirmed the pin. Reload the listing and reconcile its private position before closing the review."
        : "The listing changed before the pin could be saved. Reload it and retry.",
    };
  }

  await logAction({
    staff,
    action: "coordinates.verify",
    targetTable: "properties",
    targetId: id,
    metadata: {
      lat,
      lng,
      slug: binding?.slug || null,
      intent_id: intentId,
      published: isPublished,
      public_sync: publicSync.state,
      cache_purged: publicSync.cachePurged ?? null,
    },
  });

  if (!isPublished) {
    return { ok: true, message: "Position verified. Not published yet, so nothing to update publicly." };
  }
  return {
    ok: true,
    message: publicSync.cachePurged
      ? "Position verified and the public map updated."
      : "Position verified. Check the public map before sharing the new pin.",
  };
}

/**
 * Everything whose position is either missing or only approximate.
 * Sorted worst first: no coordinates at all, then coarse matches.
 */
export async function loadFlaggedCoordinates() {
  const staff = await getCurrentStaff();
  if (!staff) {
    return { rows: [], error: "Not authorised" };
  }
  try {
    assertTier(staff, TIERS.AGENT);
  } catch {
    return { rows: [], error: "Not authorised" };
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("properties")
    .select("id, slug, canonical_slug, title, location, coordinates, details, pipeline_status, lifecycle_state, moderation_status, permanently_removed_at, created_at")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return { rows: [], error: error.message };

  const rows = (data || [])
    .filter((row) => !isProtectedProperty(row))
    .map((p) => {
      const geo = p.details?.geo || null;
      const point = parsePointToLatLng(p.coordinates);
      const hasPosition = Boolean(point);
      // Three ways a position needs a human: there is none, the geocoder said
      // it was approximate, or it predates confidence scoring entirely and has
      // therefore never been assessed by anyone. The last group is the existing
      // backlog — silently trusting it is how the wrong-city maps happened.
      const uncertain = !hasPosition || Boolean(geo?.uncertain) || !geo;
      return { ...p, geo, point, hasPosition, uncertain };
    })
    .filter((p) => p.uncertain)
    .sort((a, b) => Number(a.hasPosition) - Number(b.hasPosition));

  return { rows, error: null };
}
