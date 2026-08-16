"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";

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
  if (!staff || staff.tier < TIERS.AGENT) {
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
    .select("id, details")
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

  const { error: writeErr } = await supabase
    .from("properties")
    .update({ coordinates: `POINT(${lng} ${lat})`, details })
    .eq("id", id);

  if (writeErr) return { ok: false, message: writeErr.message };

  revalidatePath("/dashboard/coordinates");
  return { ok: true, message: "Position verified" };
}

/**
 * Everything whose position is either missing or only approximate.
 * Sorted worst first: no coordinates at all, then coarse matches.
 */
export async function loadFlaggedCoordinates() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id, slug, title, location, coordinates, details, status, created_at")
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
