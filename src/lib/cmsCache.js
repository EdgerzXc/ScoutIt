// ═══════════════════════════════════════════════════════════════
// Cached Airtable CMS bundle — shared by /api/cms and /api/showcase.
//
// Why this exists: every page load hits /api/cms, and each uncached call
// fanned out into 4 Airtable requests plus Mapbox geocoding. Under real
// traffic (or a parallel E2E run) that trips Airtable's per-base rate
// limit, the fetch throws, and the whole public site silently served
// EMPTY data. A shared twelve-hour snapshot, short in-memory cache and bounded
// serve-stale-on-error cover transient failures; prolonged outages return an
// explicit unavailable state. Successful writes invalidate the shared copy.
// ═══════════════════════════════════════════════════════════════

import {
  fetchBrokers,
  fetchProperties,
  fetchIntel,
  fetchHomepageConfig,
} from "@/lib/airtable";
import { Redis } from '@upstash/redis';
import {
  getAirtableBudgetStatus,
  recordAirtableCall,
} from "@/lib/airtableBudget";

import { fetchWithRetry } from "@/lib/fetchWithRetry";
import { BoundedCache } from "@/lib/boundedCache";
import { CITY_HUB } from "@/lib/transit";
import { DEFAULT_LIVE_CMS_URL, normalizeLiveCmsBundle } from "@/lib/cmsFallback";
import { normalizeSampleBundle } from "@/lib/sampleInventory";
import { getServerMapboxToken } from "@/lib/mapboxToken";
import {
  PUBLISHED_BRIEFING_FILTER,
  isPublishedBriefing,
  mapBriefingToIntel,
} from "@/lib/intelBriefingMapper";

let redis = null;
export const CMS_REDIS_FETCH_CACHE = "default";

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      // Upstash otherwise forces `no-store`, which opts ISR callers such as
      // `/hubs/[slug]` into dynamic rendering. Redis commands use POST, so the
      // Next data cache does not retain command responses; the explicit memory
      // and Redis TTLs below remain the freshness authority.
      cache: CMS_REDIS_FETCH_CACHE,
    });
  } catch (err) {
    console.error("[CMS] Failed to initialize Redis:", err.message);
  }
}

const FRESH_TTL_MS = 60 * 1000; // serve from memory for 60s
const MAX_STALE_AGE_MS = 2 * 60 * 1000; // never serve an in-process snapshot for days during a long outage
export const CMS_SHARED_TTL_S = 12 * 60 * 60;
const CMS_BUILD_LOCK_KEY = "cms_bundle_build_lock";
const CMS_GENERATION_KEY = "cms_bundle_generation";
// The snapshot survives its own TTL under a separate, longer-lived key so a
// spent monthly budget has something real to serve instead of an empty site.
const CMS_LAST_GOOD_KEY = "cms_bundle_last_good";
const CMS_LAST_GOOD_TTL_S = 60 * 60 * 24 * 40;
// For how long an explicit publish/takedown may still spend budgeted calls.
const PUBLISHER_REBUILD_WINDOW_MS = 10 * 60 * 1000;
const WRITE_CURRENT_BUNDLE_SCRIPT = `
  if (redis.call('GET', KEYS[1]) or '0') ~= ARGV[1] then return 0 end
  redis.call('SET', KEYS[2], ARGV[2], 'EX', tonumber(ARGV[3]))
  return 1
`;
const RELEASE_OWN_LOCK_SCRIPT = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`;
const EMPTY_BUNDLE = {
  properties: [],
  intel: [],
  brokers: [],
  homepage: null,
  source: "empty_fallback",
};

let cache = { bundle: null, fetchedAt: 0 };
let inflight = null; // dedupe concurrent rebuilds into one Airtable fan-out
let lastMonthlyLimitLogAt = 0;
// Set by invalidateCmsBundle: for a short window after a publish or takedown,
// a rebuild bypasses the budget guard. Owner content going live - or being
// withdrawn - always outranks conserving a capped month of API calls.
let publisherRebuildUntil = 0;
let lastBudgetGuardLogAt = 0;

export async function invalidateCmsBundle() {
  // Do not let a rebuild that started before the publish repopulate the cache
  // after invalidation. Wait for it, then clear both cache layers.
  if (inflight) await inflight.catch(() => null);
  cache = { bundle: null, fetchedAt: 0 };
  if (redis) {
    // Increment before deletion. A rebuild started on another instance must
    // not repopulate an older snapshot after an owner withdraws a listing.
    await redis.incr(CMS_GENERATION_KEY);
    await redis.del("cms_bundle");
    // A publish or takedown is an explicit instruction to be fresh now. Let the
    // rebuild it triggers draw from the monthly budget regardless of the guard.
    publisherRebuildUntil = Date.now() + PUBLISHER_REBUILD_WINDOW_MS;
  }
  // A local memory clear alone cannot refresh the other public instances.
  // Writers use this result to avoid claiming an immediate public refresh.
  return { sharedCachePurged: Boolean(redis) };
}

async function buildSharedBundle() {
  if (!redis) return buildBundle();

  // A Redis outage must not turn every Vercel instance into an independent
  // four-table Airtable reader. The public route will report unavailable.
  const generation = await redis.get(CMS_GENERATION_KEY);
  const lockToken = crypto.randomUUID();
  const locked = await redis.set(CMS_BUILD_LOCK_KEY, lockToken, { nx: true, ex: 30 });
  if (!locked) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const shared = await redis.get("cms_bundle");
      if (shared) return { ...normalizeSampleBundle(shared), source: "upstash_redis" };
    }
    throw new Error("CMS rebuild is already in progress");
  }

  try {
    const bundle = normalizeSampleBundle(await buildBundle());
    // Compare generation and write as one Redis operation. A separate GET then
    // SET lets a withdrawal land between them and leaves old data for 12h.
    const stored = await redis.eval(
      WRITE_CURRENT_BUNDLE_SCRIPT,
      [CMS_GENERATION_KEY, "cms_bundle"],
      [String(generation ?? 0), JSON.stringify(bundle), CMS_SHARED_TTL_S],
    );
    if (Number(stored) === 1) {
      // Keep a long-lived copy the monthly-budget guard can fall back on after
      // the 12-hour snapshot key itself has expired.
      try {
        await redis.set(CMS_LAST_GOOD_KEY, bundle, { ex: CMS_LAST_GOOD_TTL_S });
      } catch (err) {
        console.error("[CMS] Could not store last-good snapshot:", err.message);
      }
    }
    if (Number(stored) !== 1) {
      throw new Error("CMS changed during rebuild; retry on the next request");
    }
    return bundle;
  } finally {
    // Avoid deleting a successor's lock if this build outlived its lease.
    await redis.eval(RELEASE_OWN_LOCK_SCRIPT, [CMS_BUILD_LOCK_KEY], [lockToken]);
  }
}

async function fetchDevelopmentLiveCms() {
  if (process.env.NODE_ENV !== "development" || process.env.SCOUTIT_OFFLINE_CMS === "1") return null;

  const url = process.env.SCOUTIT_LIVE_CMS_URL || DEFAULT_LIVE_CMS_URL;
  const response = await fetchWithRetry(url, { cache: "no-store" }, {
    circuit: "live-vercel-cms",
    retries: 1,
    budgetMs: 6000,
    attemptTimeoutMs: 4000,
  });

  if (!response.ok) {
    throw new Error(`Live Vercel CMS fallback failed: ${response.status} ${response.statusText}`);
  }

  return normalizeLiveCmsBundle(await response.json());
}

// Geocode results never change for a given location string — cache them
// so Mapbox isn't re-pinged on every request for the same addresses.
//
// BOUNDED (§1.0B): `location` is free text, so an unbounded Map grows with
// every novel string and burns one Mapbox call per novel key — a rate-limit
// exhaustion path, not just a memory leak. 2,000 entries comfortably covers
// the real Philippine location vocabulary; anything beyond that is churn and
// is evicted least-recently-used.
const geocodeCache = new BoundedCache({ maxEntries: 2000 });

async function geocodeMissingCoords(properties) {
  const mapboxToken = getServerMapboxToken();

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

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { recordSystemEvent } from "@/lib/systemEvents";
import { EVENTS } from "@/lib/systemEventPolicy.mjs";

async function buildBundle() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!apiKey || !baseId) {
    throw new Error("Airtable credentials are missing");
  }

  let airtableRequestAttempts = 0;
  const readOptions = {
    onAttempt: () => {
      airtableRequestAttempts += 1;
      // Count against the shared monthly budget as it happens, so a build that
      // fails part-way still leaves its spend visible to the next request.
      void recordAirtableCall();
    },
  };
  const [properties, intel, brokers, homepage] = await Promise.all([
    fetchProperties(apiKey, baseId, readOptions),
    fetchIntel(apiKey, baseId, readOptions),
    fetchBrokers(apiKey, baseId, readOptions),
    fetchHomepageConfig(apiKey, baseId, readOptions),
  ]);

  // Fetch published briefings from Supabase OSINT repository.
  // U-021: the comment used to say "published" while the query filtered on
  // nothing, so every unpublished draft reached the public bundle. The filter
  // and the mapper now live in `intelBriefingMapper.js` where they can be
  // tested by calling them. `isPublishedBriefing` re-checks client-side so the
  // guard holds even if the query is ever loosened.
  let supabaseIntel = [];
  try {
    const { data: briefings } = await supabaseAdmin
      .from("intel_briefings")
      .select("*")
      .eq(PUBLISHED_BRIEFING_FILTER.column, PUBLISHED_BRIEFING_FILTER.value)
      .order("created_at", { ascending: false });

    supabaseIntel = (briefings || []).filter(isPublishedBriefing).map(mapBriefingToIntel);
  } catch (err) {
    console.warn("[CMS] Supabase intel_briefings fetch error:", err.message);
  }

  // Deduplicate intel array (Supabase published briefings take priority over Airtable by slug)
  const mergedIntel = [...supabaseIntel];
  (intel || []).forEach((item) => {
    if (!mergedIntel.some((x) => x.slug === item.slug)) {
      mergedIntel.push(item);
    }
  });

  const positioned = await geocodeMissingCoords(properties);

  // A-063. One row per rebuild, not one per property: geocoding runs once
  // for every un-positioned listing inside this same function, so an event
  // each would bury the log in the hot path it is meant to make readable.
  // The counts are the signal — a rising `approximate` is listings drifting
  // onto city centroids instead of their own address.
  const approximate = positioned.filter((x) => x.coordsApproximate).length;
  const unplaced = positioned.filter((x) => !x.lat || !x.lng).length;
  await recordSystemEvent({
    event: EVENTS.CMS_BUNDLE_REBUILT,
    severity: unplaced > 0 ? "warning" : "info",
    summary:
      `Public catalogue rebuilt from Airtable: ${positioned.length} properties, ` +
      `${approximate} on an approximate position, ${unplaced} with none`,
    detail: {
      source: "airtable",
      executionEnvironment: process.env.VERCEL_ENV
        ? `vercel:${process.env.VERCEL_ENV}`
        : process.env.SCOUTIT_E2E === "1" ? "local:e2e" : "local",
      properties: positioned.length,
      intel: mergedIntel.length,
      brokers: (brokers || []).length,
      approximatePositions: approximate,
      unplacedProperties: unplaced,
      airtableRequestAttempts,
    },
  });

  return {
    properties: positioned,
    intel: mergedIntel,
    brokers,
    homepage,
    source: "airtable",
  };
}

export async function getCmsBundle() {
  const now = Date.now();
  if (cache.bundle && now - cache.fetchedAt < FRESH_TTL_MS) {
    return normalizeSampleBundle(cache.bundle);
  }
  
  if (redis) {
    try {
      const cachedBundle = await redis.get('cms_bundle');
      if (cachedBundle) {
        const normalizedBundle = normalizeSampleBundle(cachedBundle);
        cache = { bundle: normalizedBundle, fetchedAt: now };
        return { ...normalizedBundle, source: 'upstash_redis' };
      }
    } catch (err) {
      console.error("[CMS] Redis fetch failed:", err.message);
    }
  }

  // A spent monthly budget must not take the site down (U-042). A routine
  // TTL-expiry refresh serves the last good snapshot rather than spending calls
  // Airtable will only reject. The rebuild that a publish or takedown triggers
  // bypasses this, so owner content always reaches the public base.
  if (redis && Date.now() >= publisherRebuildUntil) {
    const budget = await getAirtableBudgetStatus();
    if (budget.exhausted) {
      try {
        const lastGood = await redis.get(CMS_LAST_GOOD_KEY);
        if (lastGood) {
          const bundle = normalizeSampleBundle(lastGood);
          cache = { bundle, fetchedAt: Date.now() };
          if (Date.now() - lastBudgetGuardLogAt >= 15 * 60 * 1000) {
            lastBudgetGuardLogAt = Date.now();
            await recordSystemEvent({
              event: EVENTS.CMS_BUNDLE_BUDGET_GUARDED,
              severity: "warning",
              summary:
                `Airtable monthly call budget reached (${budget.attempts}/${budget.budget}); ` +
                "serving the last good catalogue snapshot instead of rebuilding",
              detail: {
                month: budget.month,
                attempts: budget.attempts,
                budget: budget.budget,
                executionEnvironment: process.env.VERCEL_ENV
                  ? `vercel:${process.env.VERCEL_ENV}`
                  : "local",
              },
            });
          }
          return { ...bundle, source: "stale_monthly_budget" };
        }
      } catch (err) {
        console.error("[CMS] Budget guard could not read the last-good snapshot:", err.message);
      }
    }
  }

  if (inflight) return inflight;

  inflight = buildSharedBundle()
    .then(async (rawBundle) => {
      const bundle = normalizeSampleBundle(rawBundle);
      cache = { bundle, fetchedAt: Date.now() };
      inflight = null;
      return bundle;
    })
    .catch(async (error) => {
      inflight = null;
      if (error?.code !== "AIRTABLE_MONTHLY_LIMIT" || Date.now() - lastMonthlyLimitLogAt >= 5 * 60 * 1000) {
        console.error("[CMS] Airtable fetch failed:", error.message);
        if (error?.code === "AIRTABLE_MONTHLY_LIMIT") lastMonthlyLimitLogAt = Date.now();
      }
      // A brief upstream wobble may use the last good in-process bundle.
      // A monthly outage must not keep withdrawn inventory alive indefinitely
      // on an instance whose Redis copy has already been invalidated.
      if (cache.bundle && Date.now() - cache.fetchedAt <= MAX_STALE_AGE_MS) {
        return { ...normalizeSampleBundle(cache.bundle), source: `${cache.bundle.source}_stale` };
      }

      try {
        const liveBundle = await fetchDevelopmentLiveCms();
        if (liveBundle) {
          const normalizedBundle = normalizeSampleBundle(liveBundle);
          cache = { bundle: normalizedBundle, fetchedAt: Date.now() };
          return normalizedBundle;
        }
      } catch (fallbackError) {
        console.error("[CMS] Live Vercel fallback failed:", fallbackError.message);
      }

      return { ...EMPTY_BUNDLE, source: "empty_fallback_on_error" };
    });

  return inflight;
}
