"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { computeSpatialIntel, computeContinuityScore } from "@/lib/spatialIntel";
import { useReach } from "@/components/maps/useReach";
import "@/components/maps/spatial-canvas.css";
import { commandLens } from "@/components/maps/lenses/command";
import { locationLens } from "@/components/maps/lenses/location";
import { floodLens } from "@/components/maps/lenses/flood";
import { transitLens } from "@/components/maps/lenses/transit";

// Registry of available lenses
const LENS_LABELS = {
  command: "Command",
  location: "Tactical",
  flood: "Flood",
  transit: "Transit",
};

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
  // Mirrored into a ref so the reach effect can read the current group without
  // taking activeSubLayer as a dependency, which would re-run it on every
  // toggle and re-filter layers that have not changed.
  const activeSubLayerRef = useRef("all");
  const [visualMode, setVisualMode] = useState("DEFAULT"); // DEFAULT | FLIR | CRT
  const [spatialIntel, setSpatialIntel] = useState(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [dossierData, setDossierData] = useState(null);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [recentQuakes, setRecentQuakes] = useState([]);
  const [fireCount, setFireCount] = useState(0);

  // Shared Reach isochrone data (spine)
  // `reach` is the isochrone when Mapbox supplies one and a true-distance
  // circle when it does not. Everything downstream — the ring rendering and the
  // POI clipping — uses `reach`, never the raw isochrone, so the spine is never
  // absent. `reachIsFallback` is what the UI must use to avoid claiming minutes
  // it cannot measure.
  const {
    reach: isochrone,
    reachIsFallback,
    contours,
    loading: reachLoading,
  } = useReach(targetLat, targetLng);

  // Says what the ring is. A travel-time shape and a distance circle look
  // similar and mean different things, and claiming minutes we did not measure
  // is the exact failure the pixel rings were removed for.
  const reachShapeLabel = useMemo(() => {
    if (reachLoading) return null;
    if (!isochrone?.features?.length) return null;
    if (reachIsFallback) return isochrone.features[0]?.properties?.label || "Distance radius";
    // Name every band rather than only the widest. There are two rings on the
    // map and they are different kinds of thing — a walk and a drive — so a
    // single "10 min reach" would describe the outer ring while the places on
    // the map follow the inner one.
    const labels = (contours || []).map((c) => c.label).filter(Boolean);
    return labels.length ? labels.join(" · ") : "Travel-time reach";
  }, [reachLoading, isochrone, reachIsFallback, contours]);

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
        // On a phone every one of these rides the SAME two-finger gesture, so a
        // pinch was simultaneously zooming, rotating and tilting: the slightest
        // twist spun the city, and with no compass shown there was no way back
        // to north. Two fingers now pan and zoom, and nothing else.
        dragRotate: !isMobile,
        pitchWithRotate: !isMobile,
        touchPitch: !isMobile,
        touchZoomRotate: true,
        // One finger scrolls the page, two move the map. Without this the map
        // swallows the page scroll and the reader is trapped in it.
        cooperativeGestures: true,
      });
    } catch (err) {
      console.warn("MapLibre GL initialization error:", err);
      return;
    }

    mapInstanceRef.current = map;

    // Rotation stays off on touch even within the pinch handler. `pinch to
    // zoom` and `twist to rotate` are the same two fingers, and on a small
    // screen the twist is almost always accidental.
    try {
      if (isMobile) map.touchZoomRotate.disableRotation();
    } catch (err) {}

    try {
      // The compass appears wherever rotation is possible, so there is always a
      // way back to north. On touch, where rotation is off, it would be a dead
      // button.
      map.addControl(new maplibregl.NavigationControl({ showCompass: !isMobile }), "top-right");
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

      // The expanded HUD covers most of the map it is annotating whenever the
      // frame is small — short on a laptop, or narrow on a phone, where the
      // panel is 340px wide against a 384px map. Start collapsed there and let
      // the reader open it, rather than making them close it before they can
      // see anything.
      const frameHeight = mapContainerRef.current?.clientHeight || 0;
      const narrow = typeof window !== "undefined" && window.innerWidth < 700;
      if (narrow || (frameHeight && frameHeight < 420)) setHudExpanded(false);
      const tokens = getDesignTokens();

      // The basemap's own labels — street and place names — were drawn for a
      // flat map. Once buildings are extruded in gold, a street name crossing a
      // tower has to survive on --accent, where even pure white measures 1.99:1.
      // Widening their halo gives each one its own dark backing, the same fix
      // applied to the POI labels. Only the halo is touched; CARTO's type,
      // colour and placement are left alone.
      // Restricted to the label families that are light-on-dark and actually
      // cross the massing. Applying it to every symbol layer also hit ones
      // CARTO draws in dark type — house numbers and the like — where a dark
      // halo erases them instead of rescuing them.
      const HALO_SOURCE_LAYERS = new Set(["transportation_name", "place", "water_name"]);
      try {
        for (const layer of map.getStyle().layers) {
          if (layer.type !== "symbol" || !layer.layout?.["text-field"]) continue;
          if (!HALO_SOURCE_LAYERS.has(layer["source-layer"])) continue;
          map.setPaintProperty(layer.id, "text-halo-color", "#0e0e0e");
          map.setPaintProperty(layer.id, "text-halo-width", 1.8);
          map.setPaintProperty(layer.id, "text-halo-blur", 0.5);
        }
      } catch (err) {}

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
          // Built as DOM nodes rather than an HTML string: setHTML assigns to
          // innerHTML, and propertyTitle is CMS-authored content. textContent
          // cannot be parsed as markup.
          new maplibregl.Popup({ offset: 25, className: "scoutit-popup" }).setDOMContent(
            (() => {
              const wrap = document.createElement("div");
              const strong = document.createElement("strong");
              strong.textContent = propertyTitle || "This space";
              strong.style.color = tokens.GOLD;
              const label = document.createElement("span");
              label.textContent = "Target Space";
              label.style.cssText = "color:var(--text-secondary,#c8c8c8);font-size:11px;";
              wrap.append(strong, document.createElement("br"), label);
              return wrap;
            })()
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

  useEffect(() => {
    activeSubLayerRef.current = activeSubLayer;
  }, [activeSubLayer]);

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

    // The reach usually arrives after the lens has mounted. Lenses that clip
    // their contents to it need telling, or they keep the empty filter they
    // were built with and render nothing forever.
    const lens = LENS_REGISTRY[activeLensRef.current];
    if (lens?.setReach) {
      try {
        lens.setReach(map, isochrone, activeSubLayerRef.current);
      } catch (err) {}
    }
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
          className="scm-hud scc-panel"
          style={{
            position: "absolute",
            top: "16px",
            left: "16px",
            zIndex: "var(--scc-z-hud)",
            padding: "12px",
            maxWidth: "340px",
            width: "calc(100% - 32px)",
            // The HUD must never grow taller than the map it sits on.
            maxHeight: "calc(100% - 88px)",
            overflowY: "auto",
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
              <span className="scc-panel__title">{LENS_LABELS[activeLensId] || "Spatial"} lens</span>
            </div>
            <button
              type="button"
              className="scc-chip"
              aria-expanded={hudExpanded}
              onClick={() => setHudExpanded(!hudExpanded)}
              style={{ border: "1px solid transparent", background: "transparent" }}
            >
              {hudExpanded ? "▲" : "▼"}
            </button>
          </div>

          {/* Sublayer Buttons */}
          {subLayerButtons.length > 0 && (
            <div className="scc-chiprow">
              {subLayerButtons.map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  className={`scc-chip ${activeSubLayer === btn.id ? "is-active" : ""}`}
                  aria-pressed={activeSubLayer === btn.id}
                  onClick={() => handleToggleSubLayer(btn.id)}
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

      {/* What the reach actually measures. Without this the ring is an
          unlabelled circle and the reader is left to assume it means minutes —
          which, on the fallback, it does not. */}
      {reachShapeLabel && (
        <div className="scc-legend scc-panel">
          <span className="scc-legend__swatch" aria-hidden="true" />
          <span className="scc-legend__text">{reachShapeLabel}</span>
        </div>
      )}

      {/* Lens bar. The map does not move when this changes — only the meaning
          does — so it reads as one instrument being re-read rather than four
          maps. */}
      {availableLenses.length > 1 && (
        <div
          className="scc-panel"
          role="tablist"
          aria-label="Map lens"
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: "var(--scc-z-hud)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "4px",
            padding: "5px",
            maxWidth: "calc(100% - 24px)",
          }}
        >
          {availableLenses.map((lensKey) => (
            <button
              key={lensKey}
              type="button"
              role="tab"
              aria-selected={activeLensId === lensKey}
              className={`scc-chip scc-chip--lens ${activeLensId === lensKey ? "is-active" : ""}`}
              onClick={() => handleSwitchLens(lensKey)}
            >
              {LENS_LABELS[lensKey] || lensKey}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
