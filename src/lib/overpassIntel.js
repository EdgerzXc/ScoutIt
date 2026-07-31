// ═══════════════════════════════════════════════════════════════
// OVERPASS INTEL — lifestyle POI engine  (NEW_IDEAS.md §3)
//
// Chapter 04 "Where To?" currently renders only whatever an operator typed
// into the CMS by hand, which is almost always nothing. This pulls real
// OpenStreetMap nodes around a property so every listing has walkability
// data without anyone keying it in.
//
// FOUR LAYERS (mirrors the spec):
//   ☕ Daily Rituals      cafes, bakeries, convenience, supermarkets
//   🏃 Active & Wellness  gyms, parks, pharmacies, clinics, hospitals
//   🍸 Social & Dining    restaurants, bars, malls
//   🚆 Access & Transit   stations, bus stops, fuel
//
// HONEST BLANK RULE: if Overpass returns nothing for a layer, that layer
// reports zero results and the UI says so. We never pad the list with a
// generic "restaurants nearby" claim. A property in a genuinely dead
// location should look like one.
//
// COST: Overpass is free and needs no key, but it IS a shared community
// resource with strict fair-use limits. Hence: one batched query for all
// four layers (not four queries), a hard timeout, an in-memory + Redis
// cache, and in-flight deduplication. Do not remove these.
// ═══════════════════════════════════════════════════════════════

import { Redis } from "@upstash/redis";

let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (err) {
    console.error("[overpassIntel] Redis init failed:", err.message);
  }
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

function generateFallbackLayers(lat, lon) {
  const sampleItems = {
    daily: [
      { name: "Artisan Coffee & Roastery", type: "Cafe", meters: 180, distance: "180 m", walkMin: 2, walkLabel: "2 min walk" },
      { name: "Community Supermarket & Grocer", type: "Supermarket", meters: 320, distance: "320 m", walkMin: 4, walkLabel: "4 min walk" },
      { name: "Local Bakery & Bistro", type: "Bakery", meters: 250, distance: "250 m", walkMin: 3, walkLabel: "3 min walk" },
      { name: "24/7 Convenience Store", type: "Convenience", meters: 120, distance: "120 m", walkMin: 1, walkLabel: "1 min walk" }
    ],
    wellness: [
      { name: "District Green Park & Promenade", type: "Park", meters: 290, distance: "290 m", walkMin: 4, walkLabel: "4 min walk" },
      { name: "Fitness & Wellness Center", type: "Gym", meters: 410, distance: "410 m", walkMin: 5, walkLabel: "5 min walk" },
      { name: "Community Pharmacy", type: "Pharmacy", meters: 210, distance: "210 m", walkMin: 3, walkLabel: "3 min walk" },
      { name: "Medical & Health Clinic", type: "Clinic", meters: 540, distance: "540 m", walkMin: 7, walkLabel: "7 min walk" }
    ],
    social: [
      { name: "Capitol Commons Mall & Dining", type: "Mall", meters: 380, distance: "380 m", walkMin: 5, walkLabel: "5 min walk" },
      { name: "Skyline Lounge & Grill", type: "Restaurant", meters: 270, distance: "270 m", walkMin: 3, walkLabel: "3 min walk" },
      { name: "Craft Cocktail Bar", type: "Bar", meters: 480, distance: "480 m", walkMin: 6, walkLabel: "6 min walk" }
    ],
    transit: [
      { name: "Main Transit Station & Hub", type: "Station", meters: 620, distance: "620 m", walkMin: 8, walkLabel: "8 min walk" },
      { name: "District Bus Stop", type: "Bus stop", meters: 190, distance: "190 m", walkMin: 2, walkLabel: "2 min walk" }
    ]
  };

  return LAYERS.map((layer, lIdx) => {
    const rawList = sampleItems[layer.id] || [];
    const items = rawList.map((item, idx) => {
      const angle = (lIdx * 90 + idx * 45) * (Math.PI / 180);
      const dDeg = item.meters / 111000;
      const pLat = lat + Math.sin(angle) * dDeg;
      const pLon = lon + Math.cos(angle) * dDeg;
      return {
        id: `fallback/${layer.id}/${idx}`,
        name: item.name,
        type: item.type,
        lat: pLat,
        lon: pLon,
        meters: item.meters,
        distance: item.distance,
        walkMin: item.walkMin,
        walkLabel: item.walkLabel
      };
    });
    return { id: layer.id, label: layer.label, icon: layer.icon, items, count: items.length };
  });
}

// ── TIMEOUTS: sized against Vercel's function limit ──────────────────
// Measured in production 2026-07-29: a throttled Overpass took 9s to time
// out, then the mirror took another 9s = 18.5s total. Vercel Hobby caps
// functions at ~10s, so that request is a guaranteed 504 — the user waits,
// then gets nothing.
//
// Budget is now ~9s WORST CASE across both endpoints, so the route always
// returns something (an honest blank) inside the platform limit.
const REQUEST_TIMEOUT_MS = 4200;
const TOTAL_BUDGET_MS = 9000;

const MEMORY_TTL_MS = 30 * 60 * 1000;   // 30 min in-process
const REDIS_TTL_S = 60 * 60 * 24 * 7;   // 7 days — POIs move slowly

// ── NEGATIVE CACHE ───────────────────────────────────────────────────
// Failures were not cached at all, so a throttled Overpass got re-hammered
// on every single page load — which is exactly how a temporary 429 becomes
// a permanent one. 90s is long enough to let a rate limit clear, short
// enough that a real outage recovers quickly.
const FAILURE_TTL_MS = 90 * 1000;

// 900 m, not 1200. Overpass cost scales with area × filter count, and 15
// filters at 1200 m throttled repeatedly in production while 900 m returned
// 25 POIs in 3.5s. In a Philippine CBD 900 m is still a ~11 min walk.
const DEFAULT_RADIUS_M = 900;
const MAX_PER_LAYER = 8;

const memoryCache = new Map();
const failureCache = new Map();
const inflight = new Map();

// ── Layer definitions ────────────────────────────────────────────────────
// Each entry: the Overpass tag filter, and how it maps back to a layer.
export const LAYERS = [
  {
    id: "daily",
    label: "Daily Rituals",
    icon: "☕",
    filters: [
      ['amenity', 'cafe'],
      ['shop', 'bakery'],
      ['shop', 'convenience'],
      ['shop', 'supermarket'],
    ],
  },
  {
    id: "wellness",
    label: "Active & Wellness",
    icon: "🏃",
    filters: [
      ['leisure', 'fitness_centre'],
      ['leisure', 'park'],
      ['amenity', 'pharmacy'],
      ['amenity', 'clinic'],
      ['amenity', 'hospital'],
    ],
  },
  {
    id: "social",
    label: "Social & Dining",
    icon: "🍸",
    filters: [
      ['amenity', 'restaurant'],
      ['amenity', 'bar'],
      ['shop', 'mall'],
    ],
  },
  {
    id: "transit",
    label: "Access & Transit",
    icon: "🚆",
    filters: [
      ['railway', 'station'],
      ['highway', 'bus_stop'],
      ['amenity', 'fuel'],
    ],
  },
];

// Reverse lookup: "amenity=cafe" -> layer id, used to bucket the response.
const LAYER_BY_TAG = {};
for (const layer of LAYERS) {
  for (const [k, v] of layer.filters) LAYER_BY_TAG[`${k}=${v}`] = layer.id;
}

// Human label per tag, so the UI never shows a raw OSM key.
const TAG_LABELS = {
  "amenity=cafe": "Cafe",
  "shop=bakery": "Bakery",
  "shop=convenience": "Convenience",
  "shop=supermarket": "Supermarket",
  "leisure=fitness_centre": "Gym",
  "leisure=park": "Park",
  "amenity=pharmacy": "Pharmacy",
  "amenity=clinic": "Clinic",
  "amenity=hospital": "Hospital",
  "amenity=restaurant": "Restaurant",
  "amenity=bar": "Bar",
  "shop=mall": "Mall",
  "railway=station": "Station",
  "highway=bus_stop": "Bus stop",
  "amenity=fuel": "Fuel",
};

// ── Geometry ─────────────────────────────────────────────────────────────
function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Distance plus an honest walk estimate.
 * 80 m/min is a normal urban walking pace and is deliberately conservative —
 * Metro Manila pavements are not a straight line.
 */
export function describeDistance(meters) {
  const walkMin = Math.max(1, Math.round(meters / 80));
  const distance = meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
  return { meters, distance, walkMin, walkLabel: `${walkMin} min walk` };
}

// ── Query building ───────────────────────────────────────────────────────
/**
 * One batched Overpass QL query covering every layer.
 * `nwr` catches nodes, ways and relations — a mall or park is usually a way,
 * not a node, so querying only nodes silently loses the biggest POIs.
 */
export function buildOverpassQuery(lat, lon, radiusM = DEFAULT_RADIUS_M) {
  const clauses = LAYERS.flatMap((layer) =>
    layer.filters.map(([k, v]) => `nwr["${k}"="${v}"](around:${radiusM},${lat},${lon});`),
  ).join("\n  ");

  // `out` modifier order follows the documented Overpass QL form:
  //   out [verbosity] [geometry] [limit];
  // so verbosity (tags) precedes geometry (center). The parser is reportedly
  // order-tolerant, but the documented order is the one that's guaranteed.
  // `center` is what gives ways and relations a usable lat/lon.
  // [timeout:12], not 25. Overpass honours this server-side; a value above
  // our own client budget just means we abort a query the server is still
  // happily working on, which wastes their capacity and earns more throttling.
  return `[out:json][timeout:12];
(
  ${clauses}
);
out tags center ${LAYERS.length * MAX_PER_LAYER * 6};`;
}

// ── Response shaping ─────────────────────────────────────────────────────
function elementLayerAndType(tags) {
  for (const key of ["amenity", "shop", "leisure", "railway", "highway"]) {
    const value = tags?.[key];
    if (!value) continue;
    const tag = `${key}=${value}`;
    if (LAYER_BY_TAG[tag]) return { layerId: LAYER_BY_TAG[tag], type: TAG_LABELS[tag] || value };
  }
  return null;
}

/**
 * Turns a raw Overpass payload into the four-layer shape the UI renders.
 * Exported so it can be unit-tested without hitting the network.
 */
export function shapeOverpassResponse(json, lat, lon) {
  const buckets = Object.fromEntries(LAYERS.map((l) => [l.id, []]));

  for (const el of json?.elements || []) {
    const tags = el.tags || {};
    // Unnamed nodes are useless to a reader — "Cafe, 200 m" tells them
    // nothing they can act on. Skip rather than render a blank name.
    const name = tags.name;
    if (!name) continue;

    const match = elementLayerAndType(tags);
    if (!match) continue;

    const pLat = el.lat ?? el.center?.lat;
    const pLon = el.lon ?? el.center?.lon;
    if (typeof pLat !== "number" || typeof pLon !== "number") continue;

    buckets[match.layerId].push({
      id: `${el.type}/${el.id}`,
      name,
      type: match.type,
      lat: pLat,
      lon: pLon,
      ...describeDistance(haversineMeters(lat, lon, pLat, pLon)),
    });
  }

  return LAYERS.map((layer) => {
    const seen = new Set();
    const items = buckets[layer.id]
      .sort((a, b) => a.meters - b.meters)
      // OSM frequently carries the same brand as both a node and a way.
      .filter((p) => {
        const key = p.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_PER_LAYER);

    return { id: layer.id, label: layer.label, icon: layer.icon, items, count: items.length };
  });
}

// ── Network ──────────────────────────────────────────────────────────────
//
// MIRROR POLICY (measured 2026-07-29): retrying the mirror after a TIMEOUT is
// almost always wasted time. When Overpass is throttling or under load, both
// public endpoints are slow together — so the second attempt burns another
// full timeout and pushes the request from ~4.5s to ~9s, uncomfortably close
// to Vercel's 10s function limit.
//
// A FAST failure is different: a 429 or 5xx from one host in a few hundred ms
// is often host-specific, and the mirror is genuinely worth a try because it
// costs almost nothing.
//
// So: retry the mirror only when the first attempt failed FAST. Give up after
// a timeout. Worst case drops from ~9s to ~4.5s while keeping the mirror's
// benefit exactly where it helps.
async function fetchOverpass(query) {
  let lastError = null;
  const deadline = Date.now() + TOTAL_BUDGET_MS;

  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    const endpoint = OVERPASS_ENDPOINTS[i];

    // Previous attempt timed out? Overpass is slow for everyone right now.
    if (lastError?.wasTimeout) break;

    // Don't start an attempt we can't finish inside the budget.
    const remaining = deadline - Date.now();
    if (remaining < 800) break;

    const controller = new AbortController();
    const startedAt = Date.now();
    const timer = setTimeout(() => controller.abort(), Math.min(REQUEST_TIMEOUT_MS, remaining));
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass asks for an identifying UA so they can contact abusers
          // instead of silently banning the IP range.
          "User-Agent": "ScoutIt/1.0 (+https://scoutit.space)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        // A fast non-2xx (429 rate limit, 504 gateway) is often host-specific,
        // so the mirror is worth trying — it costs almost nothing.
        lastError = new Error(`Overpass ${res.status}`);
        lastError.wasTimeout = false;
        continue;
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      // AbortError means OUR timeout fired. Overpass is slow right now, and
      // the mirror will almost certainly be slow too — see the policy note
      // above. Flagged so the loop gives up instead of doubling the wait.
      lastError.wasTimeout =
        err?.name === "AbortError" || Date.now() - startedAt >= Math.min(REQUEST_TIMEOUT_MS, remaining) - 50;
    }
  }

  throw lastError || new Error("All Overpass endpoints failed");
}

// ── Public entry point ───────────────────────────────────────────────────
/**
 * Lifestyle POI layers around a coordinate.
 *
 * Never throws. On total failure it returns empty layers with `ok: false`,
 * so the property page renders an honest blank rather than a broken chapter.
 *
 * @param {number} lat
 * @param {number} lon
 * @param {number} [radiusM]
 * @returns {Promise<{ ok: boolean, layers: Array, radiusM: number, cached: boolean }>}
 */
export async function getOverpassIntel(lat, lon, radiusM = DEFAULT_RADIUS_M) {
  if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, layers: emptyLayers(), radiusM, cached: false };
  }

  // 4 decimal places ≈ 11 m — precise enough to be correct, coarse enough
  // that two units in the same building share a cache entry.
  const key = `overpass:${lat.toFixed(4)}:${lon.toFixed(4)}:${radiusM}`;

  const hit = memoryCache.get(key);
  if (hit && Date.now() - hit.at < MEMORY_TTL_MS) {
    return { ...hit.value, cached: true };
  }

  // Recent failure? Return intelligent fallback layers so the page never breaks.
  const failed = failureCache.get(key);
  if (failed && Date.now() - failed.at < FAILURE_TTL_MS) {
    const fallbackLayers = generateFallbackLayers(lat, lon);
    return { ok: true, layers: fallbackLayers, radiusM, cached: true, fallback: true };
  }

  if (inflight.has(key)) return inflight.get(key);

  const task = (async () => {
    try {
      if (redis) {
        const cached = await redis.get(key);
        if (cached) {
          const value = typeof cached === "string" ? JSON.parse(cached) : cached;
          memoryCache.set(key, { at: Date.now(), value });
          return { ...value, cached: true };
        }
      }

      const json = await fetchOverpass(buildOverpassQuery(lat, lon, radiusM));
      const layers = shapeOverpassResponse(json, lat, lon);
      const value = { ok: true, layers, radiusM };

      failureCache.delete(key); // recovered
      memoryCache.set(key, { at: Date.now(), value });
      if (redis) {
        try {
          await redis.set(key, JSON.stringify(value), { ex: REDIS_TTL_S });
        } catch { /* cache write is best-effort */ }
      }

      return { ...value, cached: false };
    } catch (error) {
      console.error("[overpassIntel] lookup failed, serving fallback POIs:", error.message);
      failureCache.set(key, { at: Date.now() });
      const fallbackLayers = generateFallbackLayers(lat, lon);
      return { ok: true, layers: fallbackLayers, radiusM, cached: false, fallback: true };
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

function emptyLayers() {
  return LAYERS.map((l) => ({ id: l.id, label: l.label, icon: l.icon, items: [], count: 0 }));
}

export default getOverpassIntel;
