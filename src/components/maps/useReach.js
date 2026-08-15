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

  return {
    ...state,
    reload: () => fetchReach(true),
  };
}

export default useReach;
