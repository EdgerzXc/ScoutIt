"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { circlePolygon, footprintPolygon } from "@/lib/geo";
import "./spatial-intel-map.css";

/*
 * SPATIAL INTEL MAP
 *
 * One map, two modes:
 *   mode="radar"   Intel. Quick spatial browse — drop a centre, drag a
 *                  radius, see the articles inside it. No text search.
 *   mode="search"  Discover. Same instrument, driven by the surrounding
 *                  search UI (filters, query, results list).
 *
 * Everything the map draws is DERIVED FROM `articles`. A previous version
 * hardcoded zone polygons and 3D building footprints keyed to six specific
 * article slugs, which meant a seventh article silently got no zone, no
 * footprint and no label. Adding an article must never require editing this
 * file again.
 */

const GOLD = "#F7C64E";
const GOLD_BASE = "#E8AE3C";
const DEFAULT_CENTER = { lat: 14.5547, lng: 121.0244 };

/** Stable pseudo-random in [0,1) from a string, so heights never jitter. */
function hashUnit(str = "") {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export default function SpatialIntelMap({
  articles = [],
  mode = "radar",
  selectedCity = null,
  onSelectCity = () => {},
  radiusKm = null,
  center = null,
  onRadarChange = null,
  height = null,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedCityRef = useRef(selectedCity);
  const onSelectCityRef = useRef(onSelectCity);
  const onRadarChangeRef = useRef(onRadarChange);
  const [ready, setReady] = useState(false);
  const [hoverCity, setHoverCity] = useState(null);

  const isRadar = mode === "radar";
  const radarActive = Boolean(onRadarChange) && radiusKm != null;
  const radarLat = center ? center.lat : DEFAULT_CENTER.lat;
  const radarLng = center ? center.lng : DEFAULT_CENTER.lng;

  useEffect(() => {
    selectedCityRef.current = selectedCity;
    onSelectCityRef.current = onSelectCity;
    onRadarChangeRef.current = onRadarChange;
  }, [selectedCity, onSelectCity, onRadarChange]);

  /* Group articles by city. Derived, so a new article joins automatically. */
  const locations = useMemo(() => {
    const groups = new Map();
    for (const art of articles) {
      if (!art.city || art.lat == null || art.lng == null) continue;
      if (!groups.has(art.city)) {
        groups.set(art.city, {
          city: art.city,
          region: art.region || "Philippines",
          lat: art.lat,
          lng: art.lng,
          articles: [],
        });
      }
      groups.get(art.city).articles.push(art);
    }
    return [...groups.values()];
  }, [articles]);

  /* All map geometry, generated from those locations. */
  const sources = useMemo(() => {
    const zones = { type: "FeatureCollection", features: [] };
    const points = { type: "FeatureCollection", features: [] };
    const buildings = { type: "FeatureCollection", features: [] };

    for (const loc of locations) {
      const props = {
        city: loc.city,
        region: loc.region,
        count: loc.articles.length,
        label: loc.city.toUpperCase() + " · " + loc.articles.length,
      };
      // Zone size grows a little with how much is happening there.
      const zoneKm = 1.1 + Math.min(loc.articles.length, 6) * 0.28;
      zones.features.push({
        type: "Feature",
        properties: props,
        geometry: circlePolygon(loc.lng, loc.lat, zoneKm),
      });
      points.features.push({
        type: "Feature",
        properties: props,
        geometry: { type: "Point", coordinates: [loc.lng, loc.lat] },
      });
      for (const art of loc.articles) {
        buildings.features.push({
          type: "Feature",
          properties: {
            slug: art.slug,
            city: loc.city,
            height: 28 + Math.round(hashUnit(art.slug) * 145),
          },
          geometry: footprintPolygon(art.lng, art.lat),
        });
      }
    }
    return { zones, points, buildings };
  }, [locations]);

  const radiusRing = useMemo(() => {
    if (!radarActive) return { type: "FeatureCollection", features: [] };
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: circlePolygon(radarLng, radarLat, radiusKm),
        },
      ],
    };
  }, [radarActive, radarLng, radarLat, radiusKm]);

  /* ── Init once. Data flows in through the update effects below. ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return undefined;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat],
      zoom: isRadar ? 10 : 10.5,
      pitch: isRadar ? 40 : 30,
      bearing: -15,
      maxPitch: 70,
      cooperativeGestures: true,
    });

    mapInstanceRef.current = map;
    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right"
    );

    map.on("load", () => {
      map.addSource("zone-areas-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "zone-areas-fill",
        type: "fill",
        source: "zone-areas-src",
        paint: { "fill-color": GOLD, "fill-opacity": 0.1 },
      });
      map.addLayer({
        id: "zone-areas-outline",
        type: "line",
        source: "zone-areas-src",
        paint: { "line-color": GOLD, "line-width": 1, "line-opacity": 0.75 },
      });

      map.addSource("intel-buildings-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "intel-3d-buildings",
        type: "fill-extrusion",
        source: "intel-buildings-src",
        paint: {
          "fill-extrusion-color": GOLD,
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.72,
        },
      });

      map.addSource("radius-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "radius-fill",
        type: "fill",
        source: "radius-src",
        paint: { "fill-color": GOLD, "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: "radius-outline",
        type: "line",
        source: "radius-src",
        paint: {
          "line-color": GOLD,
          "line-width": 1.6,
          "line-dasharray": [2, 2],
          "line-opacity": 0.9,
        },
      });

      map.addSource("zone-points-src", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "zone-points-glow",
        type: "circle",
        source: "zone-points-src",
        paint: {
          "circle-radius": 9,
          "circle-color": GOLD,
          "circle-opacity": 0.28,
          "circle-stroke-width": 2,
          "circle-stroke-color": GOLD,
        },
      });
      map.addLayer({
        id: "zone-points-core",
        type: "circle",
        source: "zone-points-src",
        paint: { "circle-radius": 5, "circle-color": GOLD, "circle-opacity": 1 },
      });
      map.addLayer({
        id: "zone-points-labels",
        type: "symbol",
        source: "zone-points-src",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Metropolis Bold", "Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 10,
          "text-offset": [0, 1.5],
          "text-anchor": "top",
        },
        paint: {
          "text-color": GOLD_BASE,
          "text-halo-color": "#0d0d0d",
          "text-halo-width": 2,
        },
      });

      const pick = (e) => {
        const city = e.features && e.features[0] && e.features[0].properties.city;
        if (city) {
          onSelectCityRef.current(
            selectedCityRef.current === city ? null : city
          );
        }
      };
      map.on("click", "zone-areas-fill", pick);
      map.on("click", "zone-points-glow", pick);

      // In radar mode, clicking bare map moves the radar centre there.
      map.on("click", (e) => {
        if (!onRadarChangeRef.current) return;
        const hits = map.queryRenderedFeatures(e.point, {
          layers: ["zone-areas-fill", "zone-points-glow"],
        });
        if (hits.length) return;
        onRadarChangeRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });

      map.on("mouseenter", "zone-areas-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const city = e.features && e.features[0] && e.features[0].properties.city;
        if (city) setHoverCity(city);
      });
      map.on("mouseleave", "zone-areas-fill", () => {
        map.getCanvas().style.cursor = "";
        setHoverCity(null);
      });

      setReady(true);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Push article data into the live map ────────────────────────
     This is what lets the map survive a growing archive: sources are
     re-set whenever `articles` changes rather than baked in at load. */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !ready) return;
    const zones = map.getSource("zone-areas-src");
    const points = map.getSource("zone-points-src");
    const builds = map.getSource("intel-buildings-src");
    if (zones) zones.setData(sources.zones);
    if (points) points.setData(sources.points);
    if (builds) builds.setData(sources.buildings);
  }, [sources, ready]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !ready) return;
    const src = map.getSource("radius-src");
    if (src) src.setData(radiusRing);
  }, [radiusRing, ready]);

  /* Repaint the selection highlight without rebuilding any source. */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !ready) return;
    const sel = selectedCity || "";
    map.setPaintProperty("zone-areas-fill", "fill-opacity", [
      "case", ["==", ["get", "city"], sel], 0.34, 0.1,
    ]);
    map.setPaintProperty("zone-areas-outline", "line-width", [
      "case", ["==", ["get", "city"], sel], 2.4, 1,
    ]);
    map.setPaintProperty("zone-points-glow", "circle-radius", [
      "case", ["==", ["get", "city"], sel], 15, 9,
    ]);
  }, [selectedCity, ready]);

  /* Fly to the selected city. */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !ready || !selectedCity) return;
    const target = locations.find((l) => l.city === selectedCity);
    if (target) {
      map.flyTo({
        center: [target.lng, target.lat],
        zoom: 13,
        duration: 1600,
        essential: true,
      });
    }
  }, [selectedCity, locations, ready]);

  /* Follow the radar centre when it moves. */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !ready || !radarActive) return;
    map.easeTo({ center: [radarLng, radarLat], duration: 700 });
  }, [radarActive, radarLat, radarLng, ready]);

  const activeLabel = hoverCity || selectedCity;
  const minH = height || (isRadar ? 420 : 460);

  return (
    <div className="spatial-intel-map-card">
      <div className="sim-header">
        <span className="sim-live" aria-hidden="true" />
        <span className="sim-title">{isRadar ? "Spatial radar" : "Search map"}</span>
        <span className="sim-count">
          {locations.length} {locations.length === 1 ? "area" : "areas"}
          <span className="sim-sep" aria-hidden="true">
            /
          </span>
          {articles.length} {articles.length === 1 ? "signal" : "signals"}
        </span>
      </div>

      <div className="sim-canvas" style={{ minHeight: minH }}>
        <div ref={mapContainerRef} className="sim-gl" style={{ minHeight: minH }} />

        {activeLabel ? (
          <div className="sim-overlay">
            <div className="sim-overlay-text">
              <span className="sim-overlay-kicker">
                {selectedCity ? "Area locked" : "Hovering"}
              </span>
              <span className="sim-overlay-name">{activeLabel}</span>
            </div>
            {selectedCity ? (
              <button type="button" onClick={() => onSelectCity(null)} className="sim-reset">
                Clear area
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="sim-hint">
        {radarActive
          ? "Click the map to move the radar. Drag the radius to widen it."
          : "Click a gold zone to filter to that area."}
      </p>
    </div>
  );
}
