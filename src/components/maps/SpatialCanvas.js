"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { computeSpatialIntel, computeContinuityScore } from "@/lib/spatialIntel";
import { useReach } from "@/components/maps/useReach";
import { commandLens } from "@/components/maps/lenses/command";
import { locationLens } from "@/components/maps/lenses/location";
import { floodLens } from "@/components/maps/lenses/flood";
import { transitLens } from "@/components/maps/lenses/transit";

// Registry of available lenses
const LENS_REGISTRY = {
  command: commandLens,
  location: locationLens,
  flood: floodLens,
  transit: transitLens,
};

export default function SpatialCanvas({
  lat = 14.5547,
  lng = 121.0244,
  propertyTitle = "ScoutIt Property",
  initialLens = "command",
  availableLenses = ["command", "location", "flood", "transit"],
  onLensChange,
  showHud = true,
  height = "clamp(420px, 70vh, 750px)",
  className = "",
  style = {},
  vicinityData = [],
  lifestylePois = [],
  nearbyListings = [],
  routeDestination = "",
  routeDestCoords = null,
  routeLabel = "",
  mapboxToken = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const activeLensRef = useRef(initialLens);
  const firstLabelLayerIdRef = useRef(null);

  // Parse numerical coordinates safely
  const targetLat = typeof lat === "number" && Number.isFinite(lat) ? lat : 14.5547;
  const targetLng = typeof lng === "number" && Number.isFinite(lng) ? lng : 121.0244;

  const [activeLensId, setActiveLensId] = useState(initialLens);
  const [activeSubLayer, setActiveSubLayer] = useState("all");
  const [visualMode, setVisualMode] = useState("DEFAULT"); // DEFAULT | FLIR | CRT
  const [spatialIntel, setSpatialIntel] = useState(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [dossierData, setDossierData] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [recentQuakes, setRecentQuakes] = useState([]);
  const [fireCount, setFireCount] = useState(0);

  // Shared Reach isochrone data (spine)
  const { isochrone, contours, loading: reachLoading } = useReach(targetLat, targetLng);

  // Compute telemetry metrics on mount / coordinate update
  useEffect(() => {
    if (targetLat && targetLng) {
      const intel = computeSpatialIntel(targetLat, targetLng);
      setSpatialIntel(intel);
      setDossierData({ lat: targetLat, lng: targetLng, intel });
    }
  }, [targetLat, targetLng]);

  // Read design tokens from documentElement (never body) to guarantee dark mode
  const getDesignTokens = useCallback(() => {
    if (typeof window === "undefined") {
      return {
        INK_SURFACE: "#121212",
        GOLD_MUTED: "#6E531A",
        GOLD: "#E8AE3C",
        GOLD_BRIGHT: "#F7C64E",
        PAPER_WHITE: "#f0ede8",
        VOID_BLACK: "#0e0e0e",
      };
    }
    const rootStyle = getComputedStyle(document.documentElement);
    const token = (name, fallback) => (rootStyle.getPropertyValue(name) || "").trim() || fallback;
    return {
      INK_SURFACE: token("--surface", "#121212"),
      GOLD_MUTED: token("--accent-muted", "#6E531A"),
      GOLD: token("--accent", "#E8AE3C"),
      GOLD_BRIGHT: token("--accent-bright", "#F7C64E"),
      PAPER_WHITE: token("--text-primary", "#f0ede8"),
      VOID_BLACK: token("--bg-root", "#0e0e0e"),
    };
  }, []);

  // Update massing visibility depending on current lens requirement
  const updateMassingVisibility = useCallback((map, isMassingEnabled) => {
    if (!map || !mapLoadedRef.current) return;
    try {
      if (map.getLayer("buildings-3d")) {
        map.setLayoutProperty("buildings-3d", "visibility", isMassingEnabled ? "visible" : "none");
      }
      if (map.getLayer("star-building-core")) {
        map.setLayoutProperty("star-building-core", "visibility", isMassingEnabled ? "visible" : "none");
      }
      if (map.getLayer("star-building-bloom")) {
        map.setLayoutProperty("star-building-bloom", "visibility", isMassingEnabled ? "visible" : "none");
      }
    } catch (err) {}
  }, []);

  // Initialize MapLibre GL Map (single WebGL context for the spine)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [targetLng, targetLat],
        zoom: 13.6,
        pitch: isMobile ? 20 : 25,
        maxPitch: isMobile ? 50 : 60,
        minPitch: 0,
        dragRotate: true,
        pitchWithRotate: true,
        touchPitch: true,
        touchZoomRotate: true,
        cooperativeGestures: true, // Prevents scroll trapping on page scroll
      });
    } catch (err) {
      console.warn("MapLibre GL initialization error:", err);
      return;
    }

    mapInstanceRef.current = map;

    try {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    } catch (err) {}

    map.on("error", (e) => {
      if (e?.error?.message?.includes("tile") || e?.error?.status === 0) return;
    });

    map.on("contextmenu", (e) => {
      try {
        e.preventDefault();
        const clickedIntel = computeSpatialIntel(e.lngLat.lat, e.lngLat.lng);
        setDossierData({ lat: e.lngLat.lat, lng: e.lngLat.lng, intel: clickedIntel });
        setShowDossierModal(true);
      } catch (err) {}
    });

    map.on("load", () => {
      mapLoadedRef.current = true;
      const tokens = getDesignTokens();

      // Find first symbol layer so 3D massing and ground fills sit below text labels
      const firstLabel = map.getStyle().layers.find((l) => l.type === "symbol");
      const firstLabelId = firstLabel?.id;
      firstLabelLayerIdRef.current = firstLabelId;

      // ── Directional Lighting for 3D realism ──────────────────────────────────
      try {
        map.setLight({
          anchor: "viewport",
          position: [1.4, 210, 30],
          color: tokens.PAPER_WHITE,
          intensity: 0.4,
        });
      } catch (err) {}

      // ── 3D Building Massing (Spine) ──────────────────────────────────────────
      const reduceMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const massHeight = reduceMotion
        ? ["coalesce", ["get", "render_height"], 6]
        : ["interpolate", ["linear"], ["zoom"], 13, 0, 15.2, ["coalesce", ["get", "render_height"], 6]];

      map.addLayer(
        {
          id: "buildings-3d",
          type: "fill-extrusion",
          source: "carto",
          "source-layer": "building",
          minzoom: 13,
          filter: ["!=", ["get", "hide_3d"], true],
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "render_height"], 6],
              0,
              tokens.INK_SURFACE,
              55,
              tokens.GOLD_MUTED,
              110,
              tokens.GOLD,
            ],
            "fill-extrusion-height": massHeight,
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
            "fill-extrusion-opacity": 0.95,
            "fill-extrusion-vertical-gradient": true,
          },
        },
        firstLabelId
      );

      // ── The Star Property (Glow + Outline + Extruded Core) ───────────────────
      map.addSource("star-building", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addSource("star-glow", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer(
        {
          id: "star-glow",
          type: "circle",
          source: "star-glow",
          paint: {
            "circle-color": tokens.GOLD_BRIGHT,
            "circle-blur": 1,
            "circle-opacity": 0.38,
            "circle-pitch-alignment": "map",
            "circle-pitch-scale": "map",
            "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 13, 26, 15, 46, 17, 90, 19, 170],
          },
        },
        firstLabelId
      );

      map.addLayer(
        {
          id: "star-building-outline",
          type: "line",
          source: "star-building",
          paint: {
            "line-color": tokens.GOLD_BRIGHT,
            "line-width": ["interpolate", ["linear"], ["zoom"], 14, 1, 17, 2.5, 19, 4],
            "line-opacity": 0.9,
          },
        },
        firstLabelId
      );

      map.addLayer(
        {
          id: "star-building-bloom",
          type: "fill-extrusion",
          source: "star-building",
          paint: {
            "fill-extrusion-color": tokens.GOLD_BRIGHT,
            "fill-extrusion-height": ["*", 1.18, ["coalesce", ["get", "render_height"], 14]],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 0.22,
          },
        },
        firstLabelId
      );

      map.addLayer(
        {
          id: "star-building-core",
          type: "fill-extrusion",
          source: "star-building",
          paint: {
            "fill-extrusion-color": tokens.GOLD_BRIGHT,
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], 14],
            "fill-extrusion-base": 0,
            "fill-extrusion-opacity": 1,
            "fill-extrusion-vertical-gradient": false,
          },
        },
        firstLabelId
      );

      // Star footprint extraction logic (reaching inside MultiPolygons, 10m snap)
      const ringContains = ([x, y], ring) => {
        let inside = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [xi, yi] = ring[i];
          const [xj, yj] = ring[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside;
          }
        }
        return inside;
      };

      const polygonContains = (pt, rings) => {
        if (!rings?.length || !ringContains(pt, rings[0])) return false;
        for (let i = 1; i < rings.length; i++) {
          if (ringContains(pt, rings[i])) return false;
        }
        return true;
      };

      const polygonsOf = (feature) => {
        const g = feature?.geometry;
        if (!g) return [];
        return g.type === "MultiPolygon" ? g.coordinates : g.type === "Polygon" ? [g.coordinates] : [];
      };

      const M_PER_DEG_LAT = 110540;
      const M_PER_DEG_LNG = 111320 * Math.cos((targetLat * Math.PI) / 180);
      const toLocal = ([lngPt, latPt]) => [(lngPt - targetLng) * M_PER_DEG_LNG, (latPt - targetLat) * M_PER_DEG_LAT];

      const metresToRing = (ring) => {
        let best = Infinity;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
          const [x1, y1] = toLocal(ring[j]);
          const [x2, y2] = toLocal(ring[i]);
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len2 = dx * dx + dy * dy;
          let t = len2 ? -((x1 * dx + y1 * dy) / len2) : 0;
          t = Math.max(0, Math.min(1, t));
          best = Math.min(best, Math.hypot(x1 + t * dx, y1 + t * dy));
        }
        return best;
      };

      const STAR_SNAP_METRES = 10;
      let starLocked = false;

      const promoteStarBuilding = () => {
        if (starLocked) return;
        try {
          const src = map.getSource("star-building");
          if (!src) return;
          const target = [targetLng, targetLat];
          const pt = map.project(target);
          const hits = map.queryRenderedFeatures(
            [
              [pt.x - 48, pt.y - 48],
              [pt.x + 48, pt.y + 48],
            ],
            { layers: ["buildings-3d"] }
          );

          let best = null;
          for (const hit of hits) {
            for (const rings of polygonsOf(hit)) {
              if (polygonContains(target, rings)) {
                best = { distance: 0, properties: hit.properties, rings };
                break;
              }
              const distance = metresToRing(rings[0]);
              if (distance <= STAR_SNAP_METRES && (!best || distance < best.distance)) {
                best = { distance, properties: hit.properties, rings };
              }
            }
            if (best?.distance === 0) break;
          }

          if (best) {
            src.setData({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: best.properties,
                  geometry: { type: "Polygon", coordinates: best.rings },
                },
              ],
            });

            const outer = best.rings[0];
            let minLng = Infinity,
              maxLng = -Infinity,
              minLat = Infinity,
              maxLat = -Infinity;
            for (const [lngP, latP] of outer) {
              if (lngP < minLng) minLng = lngP;
              if (lngP > maxLng) maxLng = lngP;
              if (latP < minLat) minLat = latP;
              if (latP > maxLat) maxLat = latP;
            }
            map.getSource("star-glow")?.setData({
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Point",
                    coordinates: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
                  },
                },
              ],
            });
            starLocked = true;
            return;
          }

          if (map.areTilesLoaded()) starLocked = true;
        } catch (err) {}
      };

      map.on("idle", promoteStarBuilding);

      // ── Shared Reach Isochrones (Spine) ──────────────────────────────────────
      map.addSource("reach-isochrones", {
        type: "geojson",
        data: isochrone || { type: "FeatureCollection", features: [] },
      });

      map.addLayer(
        {
          id: "reach-isochrone-fill",
          type: "fill",
          source: "reach-isochrones",
          layout: { visibility: "visible" },
          paint: {
            "fill-color": ["coalesce", ["get", "color"], tokens.GOLD],
            "fill-opacity": 0.05,
          },
        },
        firstLabelId
      );

      map.addLayer(
        {
          id: "reach-isochrone-outline",
          type: "line",
          source: "reach-isochrones",
          layout: { visibility: "visible" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], tokens.GOLD],
            "line-width": 1.5,
            "line-opacity": 0.75,
            "line-dasharray": [3, 2],
          },
        },
        firstLabelId
      );

      // ── Target Property Marker Pin (Spine) ───────────────────────────────────
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 26px; height: 26px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.3);
          border: 2px solid ${tokens.GOLD};
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.95);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${tokens.GOLD_BRIGHT};"></div>
        </div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([targetLng, targetLat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "scoutit-popup" }).setHTML(
            `<strong style="color:${tokens.GOLD}">${propertyTitle}</strong><br/><span style="color:#ccc;font-size:11px;">Target Space</span>`
          )
        )
        .addTo(map);

      // Mount the initial active lens
      const lens = LENS_REGISTRY[activeLensRef.current];
      if (lens) {
        lens.mount(map, {
          firstLabelLayerId: firstLabelId,
          targetLat,
          targetLng,
          isochrone,
          vicinityData,
          lifestylePois,
          nearbyListings,
          routeDestination,
          routeDestCoords,
          routeLabel,
          mapboxToken,
          onQuakesLoaded: setRecentQuakes,
          onFiresLoaded: setFireCount,
        });
        updateMassingVisibility(map, lens.massing ?? true);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update real isochrone data dynamically when loaded
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapLoadedRef.current) return;
    try {
      const src = map.getSource("reach-isochrones");
      if (src) {
        src.setData(isochrone || { type: "FeatureCollection", features: [] });
      }
    } catch (err) {}
  }, [isochrone]);

  // Recenter marker when lat/lng change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetLat || !targetLng) return;
    map.flyTo({ center: [targetLng, targetLat], zoom: 14.5, essential: true });
    if (markerRef.current) markerRef.current.setLngLat([targetLng, targetLat]);
  }, [targetLat, targetLng]);

  const contextPropsRef = useRef({
    vicinityData,
    lifestylePois,
    nearbyListings,
    routeDestination,
    routeDestCoords,
    routeLabel,
    mapboxToken,
  });

  useEffect(() => {
    contextPropsRef.current = {
      vicinityData,
      lifestylePois,
      nearbyListings,
      routeDestination,
      routeDestCoords,
      routeLabel,
      mapboxToken,
    };
  }, [vicinityData, lifestylePois, nearbyListings, routeDestination, routeDestCoords, routeLabel, mapboxToken]);

  // Handle switching lenses smoothly without moving camera
  const handleSwitchLens = useCallback(
    (newLensId) => {
      if (newLensId === activeLensId) return;
      const map = mapInstanceRef.current;
      const oldLens = LENS_REGISTRY[activeLensId];
      const newLens = LENS_REGISTRY[newLensId];

      if (map && mapLoadedRef.current) {
        if (oldLens?.unmount) oldLens.unmount(map);
        if (newLens?.mount) {
          newLens.mount(map, {
            firstLabelLayerId: firstLabelLayerIdRef.current,
            targetLat,
            targetLng,
            isochrone,
            ...contextPropsRef.current,
            onQuakesLoaded: setRecentQuakes,
            onFiresLoaded: setFireCount,
          });
        }
        updateMassingVisibility(map, newLens?.massing ?? true);
      }

      activeLensRef.current = newLensId;
      setActiveLensId(newLensId);
      setActiveSubLayer("all");
      onLensChange?.(newLensId);
    },
    [activeLensId, isochrone, onLensChange, targetLat, targetLng, updateMassingVisibility]
  );

  // Handle sub-layer toggles within current lens
  const handleToggleSubLayer = useCallback(
    (layerId) => {
      setActiveSubLayer(layerId);
      const map = mapInstanceRef.current;
      const lens = LENS_REGISTRY[activeLensId];
      if (map && mapLoadedRef.current && lens?.applyVisibility) {
        lens.applyVisibility(map, layerId);
      }
    },
    [activeLensId]
  );

  // Sublayer buttons for the active lens
  const subLayerButtons = useMemo(() => {
    const lens = LENS_REGISTRY[activeLensId];
    if (!lens?.getLayerButtons) return [];
    return lens.getLayerButtons({ quakeCount: recentQuakes.length, fireCount });
  }, [activeLensId, recentQuakes.length, fireCount]);

  const continuity = spatialIntel ? computeContinuityScore(spatialIntel) : null;

  return (
    <div
      className={`spatial-canvas-root ${className}`}
      style={{
        position: "relative",
        width: "100%",
        height,
        borderRadius: "4px",
        overflow: "hidden",
        border: "0.5px solid var(--border-solid, #262626)",
        background: "var(--bg-root, #0e0e0e)",
        ...style,
      }}
    >
      {/* Visual Filter Shaders for FLIR / CRT mode */}
      {visualMode === "FLIR" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
            mixBlendMode: "color",
            background: "linear-gradient(135deg, rgba(255,0,128,0.25) 0%, rgba(0,255,255,0.25) 100%)",
            filter: "contrast(180%) invert(20%)",
          }}
        />
      )}
      {visualMode === "CRT" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 10,
            backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 255, 120, 0.15) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
            backgroundSize: "100% 3px, 6px 100%",
            boxShadow: "inset 0 0 100px rgba(0,255,100,0.2)",
          }}
        />
      )}

      {/* MapLibre WebGL container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

      {/* HUD Telemetry Overlay */}
      {showHud && (
        <div
          className="scm-hud"
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: 11,
            background: "rgba(14, 14, 14, 0.92)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid var(--accent-muted, #6E531A)",
            borderRadius: "6px",
            padding: "12px",
            color: "var(--text-primary, #f0ede8)",
            fontFamily: "var(--font-mono, monospace)",
            maxWidth: "340px",
            width: "calc(100% - 32px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "var(--accent-bright, #F7C64E)",
                  boxShadow: "0 0 8px var(--accent, #E8AE3C)",
                }}
              />
              <span style={{ fontSize: "11px", fontWeight: "bold", letterSpacing: "0.12em", color: "var(--accent, #E8AE3C)" }}>
                SPATIAL RADAR HUD
              </span>
            </div>
            <button
              onClick={() => setHudExpanded(!hudExpanded)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-secondary, #a0a0a0)",
                fontSize: "10px",
                cursor: "pointer",
              }}
            >
              {hudExpanded ? "▲ COLLAPSE" : "▼ EXPAND"}
            </button>
          </div>

          {/* Sublayer Buttons */}
          {subLayerButtons.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "8px" }}>
              {subLayerButtons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleToggleSubLayer(btn.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "3px",
                    border: activeSubLayer === btn.id ? "1px solid var(--accent, #E8AE3C)" : "1px solid #2e2e2e",
                    background: activeSubLayer === btn.id ? "rgba(232, 174, 60, 0.2)" : "#161616",
                    color: activeSubLayer === btn.id ? "var(--accent-bright, #F7C64E)" : "#999",
                    fontSize: "9.5px",
                    cursor: "pointer",
                    fontWeight: "600",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    transition: "all 0.15s ease",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}

          {/* Telemetry Metrics */}
          {hudExpanded && spatialIntel && (
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.12)", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "5px", fontSize: "10.5px" }}>
              {continuity && (
                <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(232, 174, 60, 0.08)", padding: "3px 6px", borderRadius: "3px", border: `1px solid ${continuity.badge_color}` }}>
                  <span style={{ color: "var(--accent, #E8AE3C)", fontWeight: "bold" }}>🛡️ Continuity Index:</span>
                  <span style={{ color: continuity.badge_color, fontWeight: "bold" }}>
                    {continuity.score}/100 ({continuity.grade})
                  </span>
                </div>
              )}

              {spatialIntel.infra && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#777" }}>Infra Megaproject:</span>
                  <span style={{ color: "#06B6D4" }}>
                    {spatialIntel.infra.name} ({spatialIntel.infra.distance_km}km)
                  </span>
                </div>
              )}

              {spatialIntel.transit && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#777" }}>Nearest Transit:</span>
                  <span style={{ color: "var(--accent-bright, #F7C64E)" }}>
                    {spatialIntel.transit.station_name} ({spatialIntel.transit.walk_minutes}m walk)
                  </span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#777" }}>PEZA Status:</span>
                <span style={{ color: spatialIntel.peza?.is_accredited ? "#10B981" : "#777" }}>
                  {spatialIntel.peza?.is_accredited ? `Certified (${spatialIntel.peza.zone_name})` : "Standard Zone"}
                </span>
              </div>

              {spatialIntel.seismic && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#777" }}>Fault Proximity:</span>
                  <span style={{ color: "#bbb" }}>{spatialIntel.seismic.status}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lens Mode Bar at bottom */}
      {availableLenses.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 11,
            display: "flex",
            gap: "6px",
            background: "rgba(14, 14, 14, 0.94)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            padding: "5px 8px",
            borderRadius: "6px",
            border: "1px solid var(--accent-muted, #6E531A)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.8)",
          }}
        >
          {availableLenses.map((lensKey) => (
            <button
              key={lensKey}
              onClick={() => handleSwitchLens(lensKey)}
              style={{
                background: activeLensId === lensKey ? "rgba(232, 174, 60, 0.2)" : "transparent",
                border: activeLensId === lensKey ? "1px solid var(--accent, #E8AE3C)" : "1px solid transparent",
                color: activeLensId === lensKey ? "var(--accent-bright, #F7C64E)" : "#888",
                padding: "5px 10px",
                borderRadius: "4px",
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "10px",
                fontWeight: "600",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {lensKey === "command"
                ? "Command"
                : lensKey === "location"
                ? "Tactical"
                : lensKey === "flood"
                ? "Flood"
                : "Transit"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
