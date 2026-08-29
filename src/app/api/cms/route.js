import { NextResponse } from "next/server";
import { getCmsBundle } from "@/lib/cmsCache";
import { resolveServerTier } from "@/lib/serverAuth";
import { findPremiumLeak, stripPremiumFields } from "@/lib/premiumFields";

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

// Metro Manila to the far end of the archipelago is under 2,000km; anything
// larger is not a search, it is a way to mint cache keys.
const MAX_RADIUS_KM = 2000;
const DEFAULT_CENTER_LNG = 121.0215;
const DEFAULT_CENTER_LAT = 14.5547;
// What `source` is allowed to say out loud.
//
// Internally it carries the backing store and health: "airtable",
// "upstash_redis", "supabase_osint", "empty_fallback_on_error", "..._stale".
// That is useful in a log and nobody else's business on a public endpoint —
// it names our vendors, sketches the cache topology, and announces when a
// backend is degraded. The only thing any caller actually needs is whether a
// radius filter was applied, which is what DirectoryClient reads it for.
const PUBLIC_SOURCE_RADIUS = "radius";
const PUBLIC_SOURCE_CATALOG = "catalog";

const PUBLIC_SCOPE_MAX_AGE_S = 60;
const PUBLIC_SCOPE_STALE_S = 300;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const publicScope = searchParams.get("scope") === "public";
  const radius = searchParams.get("radius");
  const lngParam = searchParams.get("lng");
  const latParam = searchParams.get("lat");

  // Radius, longitude and latitude land in the URL, and the URL is the CDN
  // cache key. Unvalidated they let anyone mint unlimited distinct keys, each
  // one a fresh origin request that runs the Haversine filter over the whole
  // catalogue. Rejecting values that are not real coordinates bounds both the
  // key space and the work, and a NaN can no longer silently filter every
  // property out of the response.
  const radiusKmRaw = radius && radius !== "any" ? Number.parseFloat(radius) : null;
  const validRadius = Number.isFinite(radiusKmRaw) && radiusKmRaw > 0 && radiusKmRaw <= MAX_RADIUS_KM;

  // An unreadable centre falls back to the default rather than cancelling the
  // filter. Skipping it would answer a radius search with the whole catalogue
  // and no indication the radius was ignored, which is a worse answer than a
  // slightly wrong one — the caller asked to see less, not more.
  const inRange = (value, limit) => Number.isFinite(value) && value >= -limit && value <= limit;
  const parsedLng = lngParam !== null ? Number.parseFloat(lngParam) : Number.NaN;
  const parsedLat = latParam !== null ? Number.parseFloat(latParam) : Number.NaN;
  const centerLng = inRange(parsedLng, 180) ? parsedLng : DEFAULT_CENTER_LNG;
  const centerLat = inRange(parsedLat, 90) ? parsedLat : DEFAULT_CENTER_LAT;

  const bundle = await getCmsBundle();
  let { properties } = bundle;
  let radiusApplied = false;

  // ── Apply Radius Filter (Haversine) ───────────────────────────
  if (validRadius) {
    const radiusKm = radiusKmRaw;

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

    // Tells the frontend this is a radius search, so it drops the un-filtered
    // local merge fallback.
    radiusApplied = true;
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

  // Belt and braces before anything is marked publicly cacheable. The stripping
  // above is the control; this is the check that it worked. A leak here would
  // otherwise be copied into the CDN and served to every visitor for the whole
  // cache window, so on any doubt the response falls back to uncacheable.
  const leak = publicScope ? findPremiumLeak(gated) : null;
  if (leak) {
    console.error(
      `[CMS] Refusing to cache: gated field "${leak.field}" still carries data on "${leak.slug}". ` +
      `Serving uncacheable instead.`,
    );
  }
  const cacheable = publicScope && !leak;

  // ── Return Payload ─────────────────────────────────────────────
  return NextResponse.json(
    {
      properties: gated,
      intel: bundle.intel,
      brokers: bundle.brokers,
      homepage: bundle.homepage,
      source: radiusApplied ? PUBLIC_SOURCE_RADIUS : PUBLIC_SOURCE_CATALOG,
    },
    {
      headers: cacheable
        ? {
            // Identical for every caller, so it is safe to share. 60s of
            // freshness with a 5 minute stale window: a visitor gets the
            // cached copy immediately and a new one is fetched behind them,
            // so a published listing appears within a minute without anyone
            // ever waiting on Airtable.
            //
            // BOTH max-age and s-maxage, deliberately. Vercel consumes
            // s-maxage at the edge and forwards only `public` downstream, so
            // s-maxage alone caches for the CDN and not for the visitor —
            // every navigation still paid a round trip to Singapore.
            // Verified in production on 2026-08-29: with s-maxage alone the
            // response reached the browser as a bare `Cache-Control: public`
            // with no lifetime at all. max-age is what lets a browser reuse
            // the copy it already has while moving between pages.
            "Cache-Control": `public, max-age=${PUBLIC_SCOPE_MAX_AGE_S}, s-maxage=${PUBLIC_SCOPE_MAX_AGE_S}, stale-while-revalidate=${PUBLIC_SCOPE_STALE_S}`,
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
