"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// Client-side in-memory cache and in-flight promise registry to ensure
// multiple components on the same property page share exactly one fetch.
const reachMemoryCache = new Map();
const reachInflightMap = new Map();

/**
 * useReach — Centralized hook for fetching and caching reachability isochrones
 * and OpenStreetMap lifestyle intelligence for a coordinate.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude (accepts lon or lng)
 * @param {number} [radiusM=900] - Search radius in metres
 * @returns {object} { data, isochrone, contours, walkability, layers, totalPois, poiOk, loading, error, reload }
 */
/**
 * A true-distance circle, in metres, as GeoJSON.
 *
 * Used only when Mapbox cannot supply a travel-time isochrone. Measured
 * 2026-08-15: the Isochrone API returns 403 Forbidden for the token in
 * .env.local, so on this account the real reach never arrives.
 *
 * This is NOT a re-run of the fake rings that were removed. Those had a radius
 * in screen pixels, so they stayed the same size on screen and measured
 * nothing at any zoom. This is a real distance on the ground: it stays locked
 * to the same patch of city, and every point inside it genuinely is within
 * `radiusM` metres of the listing. It is a weaker claim than travel time — it
 * cannot know about the river or the expressway — so it must be labelled as a
 * distance, never as minutes. `isFallback` carries that so the UI can say so.
 */
export function distanceCircle(lat, lon, radiusM, steps = 96) {
  const latRad = (lat * Math.PI) / 180;
  const dLat = radiusM / 110540;
  const dLon = radiusM / (111320 * Math.cos(latRad));
  const ring = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * 2 * Math.PI;
    ring.push([lon + dLon * Math.cos(theta), lat + dLat * Math.sin(theta)]);
  }
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "radius", label: `${radiusM} m radius`, isFallback: true },
        geometry: { type: "Polygon", coordinates: [ring] },
      },
    ],
  };
}

export function useReach(lat, lon, radiusM = 900) {
  const targetLat = typeof lat === "number" && Number.isFinite(lat) ? lat : null;
  const targetLon = typeof lon === "number" && Number.isFinite(lon) ? lon : null;

  const [state, setState] = useState(() => {
    if (targetLat === null || targetLon === null) {
      return {
        data: null,
        isochrone: null,
        contours: [],
        walkability: null,
        layers: [],
        totalPois: 0,
        poiOk: false,
        loading: false,
        error: null,
      };
    }
    const key = `${targetLat.toFixed(4)}:${targetLon.toFixed(4)}:${radiusM}`;
    const cached = reachMemoryCache.get(key);
    if (cached) {
      return {
        data: cached,
        isochrone: cached.isochrone || null,
        contours: cached.contours || [],
        walkability: cached.walkability || null,
        layers: cached.layers || [],
        totalPois: cached.totalPois ?? 0,
        poiOk: cached.poiOk ?? false,
        loading: false,
        error: null,
      };
    }
    return {
      data: null,
      isochrone: null,
      contours: [],
      walkability: null,
      layers: [],
      totalPois: 0,
      poiOk: false,
      loading: true,
      error: null,
    };
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchReach = useCallback(async (force = false) => {
    if (targetLat === null || targetLon === null) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    const key = `${targetLat.toFixed(4)}:${targetLon.toFixed(4)}:${radiusM}`;

    if (!force) {
      const cached = reachMemoryCache.get(key);
      if (cached) {
        if (mountedRef.current) {
          setState({
            data: cached,
            isochrone: cached.isochrone || null,
            contours: cached.contours || [],
            walkability: cached.walkability || null,
            layers: cached.layers || [],
            totalPois: cached.totalPois ?? 0,
            poiOk: cached.poiOk ?? false,
            loading: false,
            error: null,
          });
        }
        return;
      }
    }

    if (mountedRef.current) {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    let promise = reachInflightMap.get(key);
    if (!promise || force) {
      promise = (async () => {
        try {
          const res = await fetch(`/api/whereto?lat=${targetLat}&lon=${targetLon}&radius=${radiusM}`);
          const json = await res.json();
          if (!res.ok || !json.success) {
            throw new Error(json.message || `WhereTo request failed with status ${res.status}`);
          }
          reachMemoryCache.set(key, json);
          return json;
        } finally {
          reachInflightMap.delete(key);
        }
      })();
      reachInflightMap.set(key, promise);
    }

    try {
      const json = await promise;
      if (mountedRef.current) {
        setState({
          data: json,
          isochrone: json.isochrone || null,
          contours: json.contours || [],
          walkability: json.walkability || null,
          layers: json.layers || [],
          totalPois: json.totalPois ?? 0,
          poiOk: json.poiOk ?? false,
          loading: false,
          error: null,
        });
      }
    } catch (err) {
      if (mountedRef.current) {
        setState({
          data: null,
          isochrone: null,
          contours: [],
          walkability: null,
          layers: [],
          totalPois: 0,
          poiOk: false,
          loading: false,
          error: err.message || "Failed to load reachability data",
        });
      }
    }
  }, [targetLat, targetLon, radiusM]);

  useEffect(() => {
    fetchReach();
  }, [fetchReach]);

  // A shape is only useful if it exists. When Mapbox declines the isochrone we
  // fall back to a true-distance circle rather than rendering nothing, because
  // the reach is the spine every lens clips its contents to — without it the
  // nearby-places layer has no boundary and shows nothing at all.
  const hasIsochrone = Boolean(state.isochrone?.features?.length);
  const reach =
    hasIsochrone || targetLat === null || targetLon === null
      ? state.isochrone
      : distanceCircle(targetLat, targetLon, radiusM);

  return {
    ...state,
    reach,
    reachIsFallback: !hasIsochrone && targetLat !== null && targetLon !== null,
    reload: () => fetchReach(true),
  };
}

export default useReach;
