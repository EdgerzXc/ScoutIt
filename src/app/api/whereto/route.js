import { NextResponse } from "next/server";

import { getOverpassIntel } from "@/lib/overpassIntel";
import { getIsochrones } from "@/lib/isochrone";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// WHERE TO? — lifestyle intel for a coordinate  (NEW_IDEAS.md §3)
//
//   GET /api/whereto?lat=14.5494&lon=121.048[&radius=1200][&isochrone=0]
//
// Public and unauthenticated: this is data about a place, not about a user.
// Both upstreams (Overpass, Mapbox) are cached hard in their own modules,
// and both degrade to an honest blank rather than throwing — a dead
// Overpass mirror must never take down a property page.
// ─────────────────────────────────────────────────────────────────────────

export const revalidate = 86400; // 24h — POIs and street networks move slowly

const MIN_RADIUS = 300;
const MAX_RADIUS = 3000;

export async function GET(req) {
  // Request properties are intentionally read outside the catch block. Next
  // uses this access to classify the handler as dynamic during prerendering;
  // catching that framework signal makes a healthy production build log a
  // false API failure.
  const params = new URL(req.url).searchParams;

  try {
    const lat = Number(params.get("lat"));
    const lon = Number(params.get("lon"));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return NextResponse.json({ success: false, message: "Valid lat and lon are required" }, { status: 400 });
    }
    // Reject coordinates that can't be real before spending an upstream call.
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json({ success: false, message: "Coordinates out of range" }, { status: 400 });
    }

    // BUG (found in live verification 2026-07-29): this read
    //   Number(params.get("radius"))
    // and `Number(null)` is 0, which IS finite — so an omitted radius fell
    // into the clamp and became MIN_RADIUS (300 m) instead of leaving it
    // undefined for the 1200 m default. Every caller that didn't pass an
    // explicit radius silently searched a quarter of the intended area. In a
    // dense district that just under-reports; in a quiet one it renders
    // "no verified nodes" for a perfectly walkable address.
    const rawRadius = params.get("radius");
    let radius;
    if (rawRadius !== null && rawRadius.trim() !== "") {
      const requested = Number(rawRadius);
      if (Number.isFinite(requested)) {
        radius = Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, requested));
      }
    }

    const wantIsochrone = params.get("isochrone") !== "0";

    const [poi, iso] = await Promise.all([
      getOverpassIntel(lat, lon, radius),
      wantIsochrone ? getIsochrones(lat, lon) : Promise.resolve({ ok: false, geojson: null, contours: [] }),
    ]);

    const totalPois = poi.layers.reduce((sum, l) => sum + l.count, 0);

    return NextResponse.json(
      {
        success: true,
        // `ok: false` means the lookup failed; zero results with ok:true means
        // the area genuinely has nothing. The UI wording differs, so the
        // distinction has to survive the response.
        poiOk: poi.ok,
        layers: poi.layers,
        totalPois,
        radiusM: poi.radiusM,
        isochrone: iso.ok ? iso.geojson : null,
        contours: iso.contours,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch (error) {
    console.error("[api/whereto] failed:", error);
    return NextResponse.json(
      { success: false, message: sanitizeError(error, "Couldn't load lifestyle data.") },
      { status: 500 },
    );
  }
}
