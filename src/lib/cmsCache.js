// ═══════════════════════════════════════════════════════════════
// Cached Airtable CMS bundle — shared by /api/cms and /api/showcase.
//
// Why this exists: every page load hits /api/cms, and each uncached call
// fanned out into 4 Airtable requests plus Mapbox geocoding. Under real
// traffic (or a parallel E2E run) that trips Airtable's per-base rate
// limit, the fetch throws, and the whole public site silently served
// EMPTY data. A short in-memory cache + serve-stale-on-error makes the
// "site never goes blank" promise in STRUCTURE.md actually true.
// ═══════════════════════════════════════════════════════════════

import {
  fetchBrokers,
  fetchProperties,
  fetchIntel,
  fetchHomepageConfig,
} from "@/lib/airtable";
import { Redis } from '@upstash/redis';
import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { CITY_HUB } from "@/lib/transit";

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error("[CMS] Failed to initialize Redis:", err.message);
  }
}

const FRESH_TTL_MS = 60 * 1000; // serve from memory for 60s
const EMPTY_BUNDLE = {
  properties: [],
  intel: [],
  brokers: [],
  homepage: null,
  source: "mock_fallback",
};

let cache = { bundle: null, fetchedAt: 0 };
let inflight = null; // dedupe concurrent rebuilds into one Airtable fan-out

// Geocode results never change for a given location string — cache them
// for the lifetime of the server process so Mapbox isn't re-pinged on
// every request for the same addresses.
const geocodeCache = new Map();

async function geocodeMissingCoords(properties) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  return Promise.all(
    properties.map(async (p) => {
      let propLat = p.lat || p.latitude;
      let propLng = p.lng || p.longitude;

      if ((!propLat || !propLng) && p.location && mapboxToken) {
        if (geocodeCache.has(p.location)) {
          const hit = geocodeCache.get(p.location);
          if (hit) [propLng, propLat] = hit;
        } else {
          try {
            const geoUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(p.location)}.json?country=ph&limit=1&access_token=${mapboxToken}`;
            // Retried + circuit-broken (NEW_IDEAS.md §17.1/§17.2). Tight budget
            // because this runs once PER un-geocoded property inside the same
            // Vercel function as 4 parallel Airtable calls.
            const geoRes = await fetchWithRetry(geoUrl, {}, {
              circuit: "mapbox",
              budgetMs: 3500,
              attemptTimeoutMs: 2500,
              retries: 1,
            });
            const geoData = await geoRes.json();
            if (geoData.features && geoData.features.length > 0) {
              geocodeCache.set(p.location, geoData.features[0].center);
              [propLng, propLat] = geoData.features[0].center;
            } else {
              geocodeCache.set(p.location, null); // don't re-ask for unknowns
            }
          } catch (err) {
            // Circuit-open errors are expected and already explain themselves.
            if (!err?.circuitOpen) {
              console.error(`[CMS] Geocoding failed for ${p.location}`, err?.message);
            }
          }
        }
      }

      // ── Local geocoding fallback (§17.2) ────────────────────────────
      // Mapbox unavailable? Fall back to a known city hub so the property at
      // least appears in the right city instead of vanishing off the map.
      //
      // HONESTY: a city centroid is NOT this property's address. Presenting
      // it as exact would fabricate a location — the one thing the Honest
      // Data Doctrine forbids. So it's flagged `coordsApproximate` and the UI
      // is responsible for saying "approximate" wherever it renders a pin
      // from it. Never strip this flag to make a map look tidier.
      let coordsApproximate = false;
      if ((!propLat || !propLng) && (p.city || p.location)) {
        const key = String(p.city || p.location).toLowerCase().trim();
        const hub = CITY_HUB[key] || Object.entries(CITY_HUB).find(([k]) => key.includes(k))?.[1];
        if (hub) {
          [propLat, propLng] = hub;
          coordsApproximate = true;
        }
      }

      return { ...p, lat: propLat, lng: propLng, coordsApproximate };
    })
  );
}

async function buildBundle() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    console.warn("[CMS] Env vars missing — serving empty fallback.");
    return { ...EMPTY_BUNDLE };
  }

  const [properties, intel, brokers, homepage] = await Promise.all([
    fetchProperties(apiKey, baseId),
    fetchIntel(apiKey, baseId),
    fetchBrokers(apiKey, baseId),
    fetchHomepageConfig(apiKey, baseId),
  ]);

  return {
    properties: await geocodeMissingCoords(properties),
    intel,
    brokers,
    homepage,
    source: "airtable",
  };
}

export async function getCmsBundle() {
  const now = Date.now();
  if (cache.bundle && now - cache.fetchedAt < FRESH_TTL_MS) {
    return cache.bundle;
  }
  
  if (redis) {
    try {
      const cachedBundle = await redis.get('cms_bundle');
      if (cachedBundle) {
        cache = { bundle: cachedBundle, fetchedAt: now };
        return { ...cachedBundle, source: 'upstash_redis' };
      }
    } catch (err) {
      console.error("[CMS] Redis fetch failed:", err.message);
    }
  }

  if (inflight) return inflight;

  inflight = buildBundle()
    .then(async (bundle) => {
      cache = { bundle, fetchedAt: Date.now() };
      inflight = null;
      if (redis && bundle.source === 'airtable') {
        try {
          await redis.set('cms_bundle', bundle, { ex: 600 }); // Cache for 10 minutes
        } catch (err) {
          console.error("[CMS] Redis set failed:", err.message);
        }
      }
      return bundle;
    })
    .catch((error) => {
      inflight = null;
      console.error("[CMS] Airtable fetch failed:", error.message);
      // Stale data beats a blank site: keep serving the last good bundle.
      if (cache.bundle) {
        return { ...cache.bundle, source: `${cache.bundle.source}_stale` };
      }
      return { ...EMPTY_BUNDLE, source: "mock_fallback_on_error" };
    });

  return inflight;
}
