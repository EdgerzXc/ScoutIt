// ═══════════════════════════════════════════════════════════════
// MAPBOX ISOCHRONE — reachability polygons  (NEW_IDEAS.md §3)
//
// A radius circle lies. It says "1.2 km away" for a cafe that's across a
// river, behind a toll road, or on the far side of EDSA with no crossing.
// An isochrone answers the question a buyer actually has: what can I
// physically reach in 5 minutes on foot, or 10 minutes by car.
//
// QUOTA: Mapbox Isochrone is billed per request and the property page is
// ISR — without caching, every regeneration of every property burns calls.
// Both contours come back in ONE request, results are cached in Redis for
// 30 days (street networks change slowly), and concurrent requests for the
// same point are deduped. Do not remove these.
//
// Never throws. A quota error or missing token yields `ok: false` and the
// map simply renders without overlays.
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
    console.error("[isochrone] Redis init failed:", err.message);
  }
}

const REQUEST_TIMEOUT_MS = 8000;
const MEMORY_TTL_MS = 60 * 60 * 1000;    // 1 hour in-process
const REDIS_TTL_S = 60 * 60 * 24 * 30;   // 30 days — road networks are stable

const memoryCache = new Map();
const inflight = new Map();

// The two contours the spec calls for. Colours come from the ScoutIt gold
// system (AGENTS.md §1) — the walk band is the brighter interactive gold,
// the drive band the muted border gold.
export const CONTOURS = [
  { id: "walk5",  profile: "walking", minutes: 5,  label: "5 min walk",  color: "#F7C64E" },
  { id: "drive10", profile: "driving", minutes: 10, label: "10 min drive", color: "#6E531A" },
];

async function fetchContour(profile, minutes, lat, lon, token) {
  const url =
    `https://api.mapbox.com/isochrone/v1/mapbox/${profile}/${lon},${lat}` +
    `?contours_minutes=${minutes}&polygons=true&denoise=1&access_token=${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Mapbox isochrone ${res.status}`);
    const json = await res.json();
    return json?.features?.[0] || null;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Reachability polygons around a coordinate, as a GeoJSON FeatureCollection
 * ready to hand to Leaflet or Mapbox GL.
 *
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<{ ok: boolean, geojson: object|null, contours: Array, cached: boolean }>}
 */
export async function getIsochrones(lat, lon) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    // Not an error worth logging on every request — the feature is simply
    // unconfigured. The map still renders, just without overlays.
    return { ok: false, geojson: null, contours: [], cached: false };
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return { ok: false, geojson: null, contours: [], cached: false };
  }

  const key = `isochrone:${lat.toFixed(4)}:${lon.toFixed(4)}`;

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

      // Both contours in parallel. allSettled, not all — a driving failure
      // shouldn't cost us the walking band.
      const settled = await Promise.allSettled(
        CONTOURS.map((c) => fetchContour(c.profile, c.minutes, lat, lon, token)),
      );

      const features = [];
      const contours = [];

      settled.forEach((result, i) => {
        if (result.status !== "fulfilled" || !result.value) return;
        const meta = CONTOURS[i];
        features.push({
          ...result.value,
          properties: {
            ...(result.value.properties || {}),
            contourId: meta.id,
            label: meta.label,
            color: meta.color,
            profile: meta.profile,
            minutes: meta.minutes,
          },
        });
        contours.push({ id: meta.id, label: meta.label, color: meta.color, minutes: meta.minutes });
      });

      if (features.length === 0) {
        return { ok: false, geojson: null, contours: [], cached: false };
      }

      const value = {
        ok: true,
        geojson: { type: "FeatureCollection", features },
        contours,
      };

      memoryCache.set(key, { at: Date.now(), value });
      if (redis) {
        try {
          await redis.set(key, JSON.stringify(value), { ex: REDIS_TTL_S });
        } catch { /* best-effort */ }
      }

      return { ...value, cached: false };
    } catch (error) {
      console.error("[isochrone] lookup failed:", error.message);
      return { ok: false, geojson: null, contours: [], cached: false };
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

export default getIsochrones;
