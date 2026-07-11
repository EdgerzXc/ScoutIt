import { NextResponse } from "next/server";
import { getCmsBundle } from "@/lib/cmsCache";

export const dynamic = 'force-dynamic';

// ── Main handler ─────────────────────────────────────────────────
// Data assembly (Airtable fetch + Mapbox geocoding) lives in the shared
// cached bundle (src/lib/cmsCache.js) so repeated page loads don't
// re-hammer Airtable. Only the per-request radius filter happens here.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const radius = searchParams.get("radius");
  const lngParam = searchParams.get("lng");
  const latParam = searchParams.get("lat");

  const bundle = await getCmsBundle();
  let { properties } = bundle;
  let source = bundle.source;

  // ── Apply Radius Filter (Haversine) ───────────────────────────
  if (radius && radius !== "any") {
    console.log(`[CMS] Applying Javascript Radius Search: ${radius}km`);

    const centerLng = lngParam ? parseFloat(lngParam) : 121.0215;
    const centerLat = latParam ? parseFloat(latParam) : 14.5547;
    const radiusKm = parseFloat(radius);

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
      var R = 6371;
      var dLat = (lat2 - lat1) * Math.PI / 180;
      var dLon = (lon2 - lon1) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    properties = properties.filter(p => {
      if (!p.lat || !p.lng) return false;
      const dist = getDistanceFromLatLonInKm(centerLat, centerLng, p.lat, p.lng);
      return dist <= radiusKm;
    });

    // Make sure frontend knows this is a radius search so it drops the un-filtered local merge fallback
    source = "supabase_radius";
  }

  // ── Return Payload ─────────────────────────────────────────────
  return NextResponse.json({
    properties,
    intel: bundle.intel,
    brokers: bundle.brokers,
    homepage: bundle.homepage,
    source,
  });
}
