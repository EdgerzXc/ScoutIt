import { NextResponse } from "next/server";
import { getCmsBundle } from "@/lib/cmsCache";
import { resolveServerTier } from "@/lib/serverAuth";
import { stripPremiumFields } from "@/lib/premiumFields";

export const dynamic = 'force-dynamic';

// ── Main handler ─────────────────────────────────────────────────
// Data assembly (Airtable fetch + Mapbox geocoding) lives in the shared
// cached bundle (src/lib/cmsCache.js) so repeated page loads don't
// re-hammer Airtable. Only the per-request radius filter happens here.
// `scope=public` asks for the anonymous catalogue explicitly: premium fields
// are stripped for EVERY caller, including a subscriber, so the response no
// longer depends on who is asking. That is the whole point — a response that
// varies by user cannot be held in a shared cache, which is why the default
// branch below is `no-store`. Surfaces that never read a premium field (the
// homepage, Discover, Intel, the directory and the flash ticker) ask for this
// scope and get a CDN- and browser-cacheable answer instead of a fresh
// Airtable round trip on every page view.
const PUBLIC_SCOPE_TIER = "starry";
const PUBLIC_SCOPE_MAX_AGE_S = 60;
const PUBLIC_SCOPE_STALE_S = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const publicScope = searchParams.get("scope") === "public";
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

  // ── Tier gate (NEW_IDEAS.md §25.1 / §45) ──────────────────────
  // This route is PUBLIC and returns the whole catalog. Stripping premium
  // fields only on the ISR property page would have been theatre: anyone could
  // read the same deep intel, vault URLs and enhanced photos straight out of
  // /api/cms with curl and no session at all.
  //
  // The tier is resolved SERVER-SIDE from the request. Anonymous callers —
  // which is most traffic, since this feeds the public directory and map —
  // resolve to 'starry' and get the stripped payload.
  // A public-scope request is never tier-resolved. Skipping the lookup is not
  // an optimisation, it is the guarantee: there is no session-derived value in
  // this branch that a cached copy could carry to the next visitor.
  const tier = publicScope ? PUBLIC_SCOPE_TIER : (await resolveServerTier(request)).tier;
  const gated = (properties || []).map((p) => stripPremiumFields(p, tier));

  // ── Return Payload ─────────────────────────────────────────────
  return NextResponse.json(
    {
      properties: gated,
      intel: bundle.intel,
      brokers: bundle.brokers,
      homepage: bundle.homepage,
      source,
    },
    {
      headers: publicScope
        ? {
            // Identical for every caller, so it is safe to share. 60s of
            // freshness with a 5 minute stale window: a visitor gets the
            // cached copy immediately and a new one is fetched behind them,
            // so a published listing appears within a minute without anyone
            // ever waiting on Airtable.
            "Cache-Control": `public, s-maxage=${PUBLIC_SCOPE_MAX_AGE_S}, stale-while-revalidate=${PUBLIC_SCOPE_STALE_S}`,
          }
        : {
            // The tier-resolved payload VARIES BY USER, so it must never be
            // held in a shared cache. Without this, a CDN could serve a
            // Cluster subscriber's unlocked catalog to the next anonymous
            // visitor — reintroducing the leak one layer up. `force-dynamic`
            // covers Next's own cache; this covers everything in front of it.
            "Cache-Control": "no-store, private",
            Vary: "Authorization, Cookie",
          },
    },
  );
}
