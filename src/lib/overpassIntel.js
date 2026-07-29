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
];

const REQUEST_TIMEOUT_MS = 9000;
const MEMORY_TTL_MS = 30 * 60 * 1000;   // 30 min in-process
const REDIS_TTL_S = 60 * 60 * 24 * 7;   // 7 days — POIs move slowly
const DEFAULT_RADIUS_M = 1200;          // ~15 min walk
const MAX_PER_LAYER = 8;

const memoryCache = new Map();
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
  return `[out:json][timeout:25];
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
async function fetchOverpass(query) {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass asks for an identifying UA so they can contact abusers
          // instead of silently banning the IP range.
          "User-Agent": "ScoutIt/1.0 (+https://scoutit.ph)",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        lastError = new Error(`Overpass ${res.status}`);
        continue; // 429 or 504 — try the mirror
      }
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
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

      memoryCache.set(key, { at: Date.now(), value });
      if (redis) {
        try {
          await redis.set(key, JSON.stringify(value), { ex: REDIS_TTL_S });
        } catch { /* cache write is best-effort */ }
      }

      return { ...value, cached: false };
    } catch (error) {
      console.error("[overpassIntel] lookup failed:", error.message);
      // Honest blank, not a crash. The chapter renders "no verified nodes".
      return { ok: false, layers: emptyLayers(), radiusM, cached: false };
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
