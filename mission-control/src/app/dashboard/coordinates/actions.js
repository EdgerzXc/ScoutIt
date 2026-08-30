"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { assertTier, getCurrentStaff, logAction, TIERS } from "@/lib/rbac";
import { syncCoordinatesToAirtable } from "@/lib/airtable";
import { purgePublicCatalogueCache } from "@/lib/publicCatalogueCache";

// Staff correction of a listing's position.
//
// Coordinates are never typed by owners — they are geocoded from a line of
// location text, and that inference is often only good to the level of a
// district. This is the escape hatch: when the automatic answer is too coarse,
// a human puts the pin where the building actually is.

function parsePoint(value) {
  if (typeof value !== "string") return null;
  const m = value.match(/POINT\(([-\d.]+)\s+([-\d.]+)\)/);
  if (!m) return null;
  return { lng: Number(m[1]), lat: Number(m[2]) };
}

export async function setVerifiedCoordinates(formData) {
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
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!id) return { ok: false, message: "Missing listing" };
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
    .select("id, slug, title, details, pipeline_status")
    .eq("id", id)
    .single();

  if (readErr || !row) return { ok: false, message: "Listing not found" };

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
  const isPublished = row.pipeline_status === "approved" && Boolean(row.slug);
  let publicSync = null;

  if (isPublished) {
    try {
      const { recordId } = await syncCoordinatesToAirtable({ slug: row.slug, lat, lng });
      const cache = await purgePublicCatalogueCache();
      publicSync = {
        state: "synced",
        recordId,
        cachePurged: cache.purged,
        detail: cache.detail,
        at: new Date().toISOString(),
      };
    } catch (err) {
      // Do NOT write the Supabase correction on top of a failed public sync and
      // call it verified. The queue decides what staff look at next, so a row
      // that leaves it while the public map is still wrong is a wrong pin
      // nobody will be shown again.
      await logAction({
        staff,
        action: "coordinates.verify.failed",
        targetTable: "properties",
        targetId: id,
        reason: err.message,
        metadata: { lat, lng, slug: row.slug, stage: "airtable" },
      });
      return {
        ok: false,
        message:
          `Saved nothing. The public map could not be updated: ${err.message} ` +
          `The listing is still showing its old position — try again.`,
      };
    }
  } else {
    publicSync = {
      state: "not_published",
      detail: "Not published yet; the pin will travel with it when it is.",
      at: new Date().toISOString(),
    };
  }

  // Recorded on the row so the provenance of a live pin is readable later:
  // who moved it, when, and whether the public site actually took it.
  details.geo.publicSync = publicSync;

  const { error: writeErr } = await supabase
    .from("properties")
    .update({ coordinates: `POINT(${lng} ${lat})`, details })
    .eq("id", id);

  if (writeErr) return { ok: false, message: writeErr.message };

  await logAction({
    staff,
    action: "coordinates.verify",
    targetTable: "properties",
    targetId: id,
    metadata: {
      lat,
      lng,
      slug: row.slug,
      published: isPublished,
      public_sync: publicSync.state,
      cache_purged: publicSync.cachePurged ?? null,
    },
  });

  revalidatePath("/dashboard/coordinates");

  if (!isPublished) {
    return { ok: true, message: "Position verified. Not published yet, so nothing to update publicly." };
  }
  return {
    ok: true,
    message: publicSync.cachePurged
      ? "Position verified and the public map updated."
      : `Position verified and sent to the public listing. ${publicSync.detail}`,
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
    .select("id, slug, title, location, coordinates, details, pipeline_status, created_at")
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) return { rows: [], error: error.message };

  const rows = (data || [])
    .map((p) => {
      const geo = p.details?.geo || null;
      const point = parsePoint(p.coordinates);
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
