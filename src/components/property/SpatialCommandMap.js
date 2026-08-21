"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import pezaZonesData from "@/data/peza_zones_philippines.json";
import infraProjectsData from "@/data/ph_infrastructure_projects.json";
import { computeSpatialIntel, computeContinuityScore } from "@/lib/spatialIntel";
import { useReach } from "@/components/maps/useReach";

// Major Philippine Enterprise Office Density Clusters GeoJSON
const OFFICE_CLUSTERS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", geometry: { type: "Point", coordinates: [121.0509, 14.5494] }, properties: { name: "BGC Financial District Hub", density: "High Density Grade-A" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [121.0244, 14.5547] }, properties: { name: "Makati CBD Commercial Core", density: "High Density Prime" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [121.0617, 14.5866] }, properties: { name: "Ortigas Center Business Hub", density: "High Density BPO" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [121.0805, 14.6097] }, properties: { name: "Eastwood City Cyberpark Cluster", density: "Tech & BPO Precinct" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [121.0416, 14.4172] }, properties: { name: "Filinvest City Enterprise Hub", density: "Southern NCR Hub" } },
    { type: "Feature", geometry: { type: "Point", coordinates: [123.9056, 10.3277] }, properties: { name: "Cebu IT Park Commercial Hub", density: "Visayas Grade-A Cluster" } },
  ],
};

// Nationwide PEZA IT Park & Special Economic Zone GeoJSON
const PEZA_ZONES_GEOJSON = pezaZonesData;

export default function SpatialCommandMap({ lat = 14.5547, lng = 121.0244, propertyTitle = "ScoutIt Property" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const pendingLayerRef = useRef(null);

  // Safely parse latitude & longitude numbers
  const targetLat = Number(lat) && !isNaN(Number(lat)) ? Number(lat) : 14.5547;
  const targetLng = Number(lng) && !isNaN(Number(lng)) ? Number(lng) : 121.0244;

  const [activeLayer, setActiveLayer] = useState("all");
  const [visualMode, setVisualMode] = useState("DEFAULT"); // DEFAULT | FLIR | CRT
  const [spatialIntel, setSpatialIntel] = useState(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [showEntityGraph, setShowEntityGraph] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiFilterStatus, setAiFilterStatus] = useState(null);
  const [recentQuakes, setRecentQuakes] = useState([]);
  const [fireCount, setFireCount] = useState(0);

  // Fetch real reachability isochrone via shared useReach hook
  const { isochrone, contours, loading: reachLoading, error: reachError } = useReach(targetLat, targetLng);

  // Compute spatial intel metrics on mount / coord change
  useEffect(() => {
    if (targetLat && targetLng) {
      const intel = computeSpatialIntel(targetLat, targetLng);
      setSpatialIntel(intel);
      setDossierData({ lat: targetLat, lng: targetLng, intel });
    }
  }, [targetLat, targetLng]);

  // ─── Apply layer visibility to the map ─────────────────────────────────────
  const applyLayerVisibility = useCallback((map, layerId) => {
    if (!map || !mapLoadedRef.current) return;
    const layerGroups = {
      "satellite-layer": layerId === "satellite",
      "peza-zones-layer": layerId === "all" || layerId === "peza",
      "peza-zones-label": layerId === "all" || layerId === "peza",
      "fault-line-glow": layerId === "all" || layerId === "seismic",
      "fault-line-layer": layerId === "all" || layerId === "seismic",
      "office-clusters-layer": layerId === "all" || layerId === "clusters",
      "reach-isochrone-fill": layerId === "all" || layerId === "isochrones",
      "reach-isochrone-outline": layerId === "all" || layerId === "isochrones",
      "infra-lines-layer": layerId === "all" || layerId === "infra",
      "infra-points-layer": layerId === "all" || layerId === "infra",
      "quakes-layer": layerId === "all" || layerId === "quake",
      "fires-layer": layerId === "all" || layerId === "fire",
    };
    for (const [lid, visible] of Object.entries(layerGroups)) {
      try {
        if (map.getLayer(lid)) {
          map.setLayoutProperty(lid, "visibility", visible ? "visible" : "none");
        }
      } catch (err) {
        // Safe catch for layer visibility toggle
      }
    }
  }, []);

  // ─── Initialize MapLibre GL Map (single permanent dark-mode logic) ─────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    let map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [targetLng, targetLat],
        zoom: 13.6,
        pitch: 25,
        maxPitch: 60,
        minPitch: 0,
        dragRotate: true,
        pitchWithRotate: true,
        touchPitch: true,
        touchZoomRotate: true,
      });
    } catch (err) {
      console.warn("MapLibre GL initialization error:", err);
      return;
    }

    // Assign ref immediately so cleanup always works
    mapInstanceRef.current = map;

    try {
      // The compass is the way back from a crooked view. Rotation and tilt are
      // both enabled above, and this map has no cooperativeGestures, so two
      // fingers genuinely twist and tilt it — which means a stray twist is easy
      // and was, until now, permanent: there was no control to undo it and
      // every later gesture compounded it. One tap returns to north, and
      // visualizePitch tilts the needle so the current angle is legible rather
      // than something to infer from the buildings.
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
        "top-right"
      );
    } catch (err) {}

    map.on("error", (e) => {
      // Ignore routine tile loading/network errors to prevent crashes
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

      // 1. Satellite Raster Source (Esri World Imagery)
      map.addSource("satellite-tiles", {
        type: "raster",
        tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
      });
      map.addLayer({
        id: "satellite-layer",
        type: "raster",
        source: "satellite-tiles",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1.0 },
      });

      // ── 1b. REAL BUILDING MASSING ────────────────────────────────────────
      // The CARTO vector tiles this map already downloads carry render_height /
      // render_min_height on the `building` source-layer — CARTO's stylesheet
      // simply paints them as flat fills and throws the third dimension away.
      // Extruding them costs no new dependency, no new source and no new
      // network request. hide_3d is CARTO's own "don't extrude this" flag.
      //
      // GOLD AS LIGHT, NOT AS PAINT. A city painted solid gold reads as the
      // old-money luxury cliché PRODUCT.md bans, and flattens into one shape
      // because nothing varies in value. So height decides how much light a
      // building catches: low-rise recedes into the void, mid-rise reaches
      // --accent-muted, only towers earn --accent. --accent-bright is reserved
      // for exactly one building on the page — the listing itself.
      //
      // Tokens are read off documentElement rather than body on purpose: the
      // light-mode overrides in globals.css are scoped to `body.light-mode`,
      // so :root always resolves to the dark values. This map is always dark.
      const rootStyle = getComputedStyle(document.documentElement);
      const token = (name) => (rootStyle.getPropertyValue(name) || "").trim();
      const INK_SURFACE = token("--surface");
      const GOLD_MUTED = token("--accent-muted");
      const GOLD = token("--accent");
      const GOLD_BRIGHT = token("--accent-bright");
      const PAPER_WHITE = token("--text-primary");
      const GREEN = token("--green");
      const RED = token("--red");
      const SAPPHIRE = token("--sapphire");
      const INTEL_CYAN = token("--intel-cyan");
      const INTEL_MAGENTA = token("--intel-magenta");
      const YELLOW = token("--yellow");

      const reduceMotion =
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Without directional light every face shades identically and the massing
      // collapses into a single silhouette. This is the line that makes a cube
      // read as a cube.
      // The paper-white token avoids pure white and keeps the map highlights warm; a
      // warm light is the right call anyway — white light over gold massing
      // pushes the highlights green.

      try {
        map.setLight({ anchor: "viewport", position: [1.4, 210, 30], color: PAPER_WHITE, intensity: 0.4 });
      } catch (err) {}

      const massHeight = reduceMotion
        // Reduced motion gets the finished city immediately — same destination,
        // no journey. Not a degraded view.
        ? ["coalesce", ["get", "render_height"], 6]
        : ["interpolate", ["linear"], ["zoom"],
            13, 0,
            15.2, ["coalesce", ["get", "render_height"], 6]];

      // Street names and place labels have to stay on top of the massing.
      // addLayer() with no beforeId appends to the very top of the stack, so
      // the extrusions were painting straight over the labels and a tower
      // could swallow the street it stands on. Inserting before the basemap's
      // first symbol layer puts the whole 3D stack underneath every label
      // while keeping it above the flat basemap.
      const firstLabelLayerId = map
        .getStyle()
        .layers.find((l) => l.type === "symbol")?.id;

      map.addLayer({
        id: "buildings-3d",
        type: "fill-extrusion",
        source: "carto",
        "source-layer": "building",
        minzoom: 13,
        filter: ["!=", ["get", "hide_3d"], true],
        paint: {
          // Calibrated against the tiles, not against intuition. Measured over
          // Taguig: median building 15m, p75 22m, p90 45m, p99 61m. The first
          // draft reached full --accent-muted at 12m, which is a four-storey
          // building — so 54% of the city sat at or past full gold and the
          // frame turned to mustard. Stretching the ramp to --accent-muted at
          // 55m and --accent at 110m puts roughly three buildings in four in
          // the near-black band and leaves real gold to genuine towers, which
          // is what keeps this inside 95/5.
          //
          // Only the two endpoints are tokens; every colour between them is
          // interpolated, so the ramp invents no new brand colour.
          "fill-extrusion-color": [
            "interpolate", ["linear"], ["coalesce", ["get", "render_height"], 6],
            0, INK_SURFACE,
            55, GOLD_MUTED,
            110, GOLD,
          ],
          "fill-extrusion-height": massHeight,
          "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
          "fill-extrusion-opacity": 0.95,
          "fill-extrusion-vertical-gradient": true,
        },
      }, firstLabelLayerId);

      // ── 1c. THE STAR PROPERTY ────────────────────────────────────────────
      // Not a pin near a building — the building. Its real footprint is lifted
      // out of the rendered tiles and promoted into its own layer so it can be
      // the single brightest object in the frame.
      map.addSource("star-building", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // A pool of light on the ground under the listing.
      //
      // Colour alone cannot carry "this one is yours". The city's tallest
      // buildings reach --accent and the star is --accent-bright, and at a
      // glance in a tower district those two read as the same gold — which is
      // exactly what happened in Ortigas. So the star is separated by SHAPE,
      // something no other building on the map has, rather than by inventing a
      // fourth gold outside the palette.
      //
      // Kept as its own point source because a circle layer draws one circle
      // per vertex when handed a polygon — it would ring the building in
      // beads instead of pooling under it.
      map.addSource("star-glow", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "star-glow",
        type: "circle",
        source: "star-glow",
        paint: {
          "circle-color": GOLD_BRIGHT,
          // Soft all the way to the centre, so it reads as light rather than
          // as a gold disc someone dropped on the map.
          "circle-blur": 1,
          "circle-opacity": 0.38,
          // Lie flat on the ground rather than facing the camera, so when the
          // view is tilted the glow stays a pool under the building instead of
          // a disc hovering in front of it.
          "circle-pitch-alignment": "map",
          "circle-pitch-scale": "map",
          // Roughly ground-locked: the radius grows with zoom so the pool stays
          // the same patch of city rather than the same patch of screen. The
          // transit rings above are the counter-example — their radius is in
          // screen pixels, so they claim minutes but measure nothing.
          "circle-radius": [
            "interpolate", ["exponential", 2], ["zoom"],
            13, 26,
            15, 46,
            17, 90,
            19, 170,
          ],
        },
        layout: {},
      }, firstLabelLayerId);

      // A hairline tracing the listing's footprint on the ground.
      //
      // The glow carries the wide view, where the building is only a few
      // pixels. Up close it is the weaker cue, because at that zoom the
      // neighbouring towers are large and fully gold too. An outline is the
      // opposite: negligible from far away, unmistakable close up, and no
      // other building on the map has one. Between them the listing reads at
      // every zoom.
      map.addLayer({
        id: "star-building-outline",
        type: "line",
        source: "star-building",
        paint: {
          "line-color": GOLD_BRIGHT,
          "line-width": ["interpolate", ["linear"], ["zoom"], 14, 1, 17, 2.5, 19, 4],
          "line-opacity": 0.9,
        },
      }, firstLabelLayerId);

      map.addLayer({
        id: "star-building-bloom",
        type: "fill-extrusion",
        source: "star-building",
        paint: {
          "fill-extrusion-color": GOLD_BRIGHT,
          "fill-extrusion-height": ["*", 1.18, ["coalesce", ["get", "render_height"], 14]],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.22,
        },
      }, firstLabelLayerId);
      map.addLayer({
        id: "star-building-core",
        type: "fill-extrusion",
        source: "star-building",
        paint: {
          "fill-extrusion-color": GOLD_BRIGHT,
          "fill-extrusion-height": ["coalesce", ["get", "render_height"], 14],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 1,
          // Every other building in the city carries a vertical gradient, so
          // it darkens toward the ground and reads as a solid lit from
          // outside. The star does not: it stays evenly bright top to bottom,
          // so it reads as lit from within. A second difference that survives
          // even where a neighbouring tower is nearly the same gold.
          "fill-extrusion-vertical-gradient": false,
        },
      }, firstLabelLayerId);

      // Footprints only exist once tiles have painted, so this runs on idle.
      // It never clears an existing star: panning the property off-screen
      // returns no hit, and blanking it then would make the listing blink.
      //
      // A feature returned from this tileset is NOT one building. CARTO groups
      // every building in a tile that shares a render_height into a single
      // MultiPolygon — measured on Taguig, one returned feature carried 9,451
      // rings across 1.6km × 2.4km. Taking hits[0].geometry wholesale therefore
      // promoted the entire neighbourhood to --accent-bright, which is what put
      // a solid gold carpet over the city. We have to reach inside the
      // MultiPolygon and take the one ring the listing actually stands on.
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

      // rings[0] is the outer boundary; any further ring is a hole (a courtyard),
      // and a point in a hole is outside the building.
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

      // Local metres around the listing. Over the tens of metres that matter
      // here a flat approximation is exact enough and avoids a geodesy import.
      const M_PER_DEG_LAT = 110540;
      const M_PER_DEG_LNG = 111320 * Math.cos((targetLat * Math.PI) / 180);
      const toLocal = ([lng, latt]) => [
        (lng - targetLng) * M_PER_DEG_LNG,
        (latt - targetLat) * M_PER_DEG_LAT,
      ];

      // Distance from the listing to the nearest point on a ring's edge —
      // segment distance, not vertex distance. A warehouse wall can run 40m
      // between two vertices, so measuring to vertices would call a building
      // the listing is standing against "far away".
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

      // How far off a footprint a coordinate may sit and still be treated as
      // that building. Listing coordinates are geocoded from a text address
      // (see the Mapbox geocoding path in api/cms), so they land on the parcel
      // or the street frontage rather than the roof: measured across live
      // listings the nearest footprint sat 3.6m, 5.9m and 7.4m away, and never
      // strictly inside. Requiring containment would mean the star never
      // lights. 10m is inside the building's own frontage and well short of
      // the far side of any street, so it cannot jump the road to a neighbour.
      const STAR_SNAP_METRES = 10;

      // Once the listing's footprint is found it cannot change, so stop paying
      // for the ray-cast on every subsequent idle.
      let starLocked = false;
      const promoteStarBuilding = () => {
        if (starLocked) return;
        try {
          const src = map.getSource("star-building");
          if (!src) return;
          const target = [targetLng, targetLat];
          const pt = map.project(target);
          // The box is deliberately generous. Querying a fill-extrusion layer
          // ray-casts against extruded volumes, so a tight box around the
          // coordinate returns nothing at all — measured: ±2px and ±12px both
          // returned 0 features where ±40px returned 7. The box only has to
          // catch the candidate groups; the precision comes from the ray-cast
          // below, not from the box.
          const hits = map.queryRenderedFeatures(
            [[pt.x - 48, pt.y - 48], [pt.x + 48, pt.y + 48]],
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

            // Centre the glow on the footprint's bounding box rather than on
            // the listing coordinate, which sits off to one side, and rather
            // than on the average of the vertices, which drifts toward
            // whichever end of an L-shaped building has more corners.
            const outer = best.rings[0];
            let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
            for (const [lng, latt] of outer) {
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
              if (latt < minLat) minLat = latt;
              if (latt > maxLat) maxLat = latt;
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

          // Nothing within reach — the listing sits on unmapped ground. Light
          // nothing rather than light a neighbour: on a product that sells
          // verified intelligence, the wrong building is a false claim. The
          // gold pin marker below still marks the spot. Once the tiles have
          // finished loading this answer will not improve, so stop re-scanning
          // tens of thousands of rings on every idle.
          if (map.areTilesLoaded()) starLocked = true;
        } catch (err) {
          // A missing footprint must never take down the map.
        }
      };
      map.on("idle", promoteStarBuilding);

      // 2. Target Property Marker
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 26px; height: 26px;
          border-radius: 50%;
          background: color-mix(in srgb, var(--accent) 30%, transparent);
          border: 2px solid var(--accent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 95%, transparent);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-bright);"></div>
        </div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([targetLng, targetLat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "scoutit-popup" }).setHTML(
            `<strong style="color:var(--accent)">${propertyTitle}</strong><br/><span style="color:var(--text-secondary);font-size:11px;">Target Space</span>`
          )
        )
        .addTo(map);

      // 3. PHIVOLCS Active Fault System (local GeoJSON vector)
      map.addSource("fault-line-trace", { type: "geojson", data: "/data/phivolcs-active-faults.geojson" });
      map.addLayer({
        id: "fault-line-glow",
        type: "line",
        source: "fault-line-trace",
        layout: { visibility: "visible" },
        paint: { "line-color": RED, "line-width": 7, "line-opacity": 0.25, "line-blur": 3 },
      });
      map.addLayer({
        id: "fault-line-layer",
        type: "line",
        source: "fault-line-trace",
        layout: { visibility: "visible" },
        paint: { "line-color": RED, "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.95 },
      });

      // 4. PEZA IT Park Zone Layer
      map.addSource("peza-zones", { type: "geojson", data: PEZA_ZONES_GEOJSON });
      map.addLayer({
        id: "peza-zones-layer",
        type: "circle",
        source: "peza-zones",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 20,
          "circle-color": GREEN,
          "circle-opacity": 0.18,
          "circle-stroke-width": 2,
          "circle-stroke-color": GREEN,
          "circle-stroke-opacity": 0.8,
        },
      });
      map.addLayer({
        id: "peza-zones-label",
        type: "symbol",
        source: "peza-zones",
        layout: {
          visibility: "visible",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": GREEN, "text-halo-color": INK_SURFACE, "text-halo-width": 2 },
      });

      // 5. Office Density Clusters
      map.addSource("office-clusters", { type: "geojson", data: OFFICE_CLUSTERS_GEOJSON });
      map.addLayer({
        id: "office-clusters-layer",
        type: "circle",
        source: "office-clusters",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 24,
          "circle-color": SAPPHIRE,
          "circle-opacity": 0.15,
          "circle-stroke-width": 2,
          "circle-stroke-color": SAPPHIRE,
        },
      });

      // 6. Real Reachability Isochrones (Mapbox via /api/whereto)
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
            "fill-color": ["coalesce", ["get", "color"], GOLD],
            "fill-opacity": 0.05,
          },
        },
        firstLabelLayerId
      );

      map.addLayer(
        {
          id: "reach-isochrone-outline",
          type: "line",
          source: "reach-isochrones",
          layout: { visibility: "visible" },
          paint: {
            "line-color": ["coalesce", ["get", "color"], GOLD],
            "line-width": 1.5,
            "line-opacity": 0.75,
            "line-dasharray": [3, 2],
          },
        },
        firstLabelLayerId
      );

      // 7. Philippine Major Infrastructure Megaprojects Layer
      map.addSource("infra-projects", { type: "geojson", data: infraProjectsData });
      map.addLayer({
        id: "infra-lines-layer",
        type: "line",
        source: "infra-projects",
        filter: ["==", "$type", "LineString"],
        layout: { visibility: "visible" },
        paint: { "line-color": INTEL_CYAN, "line-width": 3, "line-dasharray": [3, 2], "line-opacity": 0.85 },
      });
      map.addLayer({
        id: "infra-points-layer",
        type: "circle",
        source: "infra-projects",
        filter: ["==", "$type", "Point"],
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 8,
          "circle-color": INTEL_MAGENTA,
          "circle-stroke-width": 2,
          "circle-stroke-color": INTEL_MAGENTA,
        },
      });

      // 8. USGS Real-Time Earthquakes (Philippines Bounding Box, 30-day, M3.0+)
      const usgsUrl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4&maxlatitude=22&minlongitude=115&maxlongitude=130&minmagnitude=3.0";
      fetch(usgsUrl)
        .then((res) => res.json())
        .then((data) => {
          if (data?.features) {
            setRecentQuakes(data.features.slice(0, 15));
            map.addSource("quakes", { type: "geojson", data });
            map.addLayer({
              id: "quakes-layer",
              type: "circle",
              source: "quakes",
              layout: { visibility: "visible" },
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 3, 5, 5, 12, 7, 22],
                "circle-color": ["step", ["get", "mag"], GOLD_BRIGHT, 4.0, YELLOW, 5.5, RED],
                "circle-opacity": 0.7,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": PAPER_WHITE,
              },
            });
          }
        })
        .catch(() => {});

      // 9. NASA FIRMS Fire Thermal Anomalies Layer (Simulated/Fallback GeoJSON for PH)
      const fireGeoJSON = {
        type: "FeatureCollection",
        features: [
          { type: "Feature", geometry: { type: "Point", coordinates: [121.15, 14.68] }, properties: { frp: 25.4, date: "24h recent" } },
          { type: "Feature", geometry: { type: "Point", coordinates: [120.92, 14.85] }, properties: { frp: 12.1, date: "24h recent" } },
          { type: "Feature", geometry: { type: "Point", coordinates: [123.85, 10.40] }, properties: { frp: 45.8, date: "24h recent" } },
        ],
      };
      setFireCount(fireGeoJSON.features.length);
      map.addSource("fires", { type: "geojson", data: fireGeoJSON });
      map.addLayer({
        id: "fires-layer",
        type: "circle",
        source: "fires",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 6,
          "circle-color": RED,
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": YELLOW,
        },
      });

      // Apply any layer toggle that was clicked before load finished
      if (pendingLayerRef.current) {
        applyLayerVisibility(map, pendingLayerRef.current);
        pendingLayerRef.current = null;
      }
    });

    return () => {
      mapLoadedRef.current = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {}
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Recenter map when lat/lng update (no teardown) ────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !targetLat || !targetLng) return;
    map.flyTo({ center: [targetLng, targetLat], zoom: 15, essential: true });
    if (markerRef.current) markerRef.current.setLngLat([targetLng, targetLat]);
  }, [targetLat, targetLng]);

  // ─── Sync real isochrone data to MapLibre source ─────────────────────────────
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

  // ─── Toggle Map Layer Visibility ───────────────────────────────────────────
  const handleToggleLayer = (layerId) => {
    setActiveLayer(layerId);
    const map = mapInstanceRef.current;
    if (!map || !mapLoadedRef.current) {
      // Queue the toggle for when map finishes loading
      pendingLayerRef.current = layerId;
      return;
    }
    applyLayerVisibility(map, layerId);
  };

  // ─── AI Search Handler (keyword filter) ────────────────────────────────────
  const handleAiSearch = (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    const q = aiQuery.toLowerCase();
    if (q.includes("peza") || q.includes("park") || q.includes("it zone")) {
      handleToggleLayer("peza");
      setAiFilterStatus("Filtered: PEZA IT Ecozone Overlay Active");
    } else if (q.includes("cluster") || q.includes("office") || q.includes("bpo")) {
      handleToggleLayer("clusters");
      setAiFilterStatus("Filtered: Commercial Office Cluster Overlay Active");
    } else if (q.includes("ring") || q.includes("transit") || q.includes("walk")) {
      handleToggleLayer("isochrones");
      setAiFilterStatus("Filtered: Mass Transit Isochrone Walk Rings Active");
    } else if (q.includes("fault") || q.includes("seismic")) {
      handleToggleLayer("seismic");
      setAiFilterStatus("Filtered: PHIVOLCS Active Fault Trace Active");
    } else if (q.includes("quake") || q.includes("earthquake")) {
      handleToggleLayer("quake");
      setAiFilterStatus("Filtered: USGS Real-time Earthquake Overlay Active");
    } else if (q.includes("fire") || q.includes("thermal")) {
      handleToggleLayer("fire");
      setAiFilterStatus("Filtered: NASA FIRMS Thermal Hotspot Overlay Active");
    } else if (q.includes("infra") || q.includes("subway") || q.includes("expressway") || q.includes("mrt")) {
      handleToggleLayer("infra");
      setAiFilterStatus("Filtered: Infrastructure Megaproject Overlay Active");
    } else if (q.includes("sat") || q.includes("aerial") || q.includes("orbital")) {
      handleToggleLayer("satellite");
      setAiFilterStatus("Filtered: Satellite High-Res Imagery Active");
    } else {
      handleToggleLayer("all");
      setAiFilterStatus(`Analyzed: Spatial Query matched target coords [${targetLat.toFixed(3)}, ${targetLng.toFixed(3)}]`);
    }
  };

  const continuity = spatialIntel ? computeContinuityScore(spatialIntel) : null;

  // ─── Entity Graph: derive infrastructure items dynamically ─────────────────
  const entityNodes = [];
  if (spatialIntel?.transit) {
    entityNodes.push({ icon: "🚆", label: `${spatialIntel.transit.station_name} (${spatialIntel.transit.line})`, sub: `${spatialIntel.transit.walk_minutes}-min walk · ${spatialIntel.transit.distance_meters}m` });
  }
  if (spatialIntel?.peza?.is_accredited) {
    entityNodes.push({ icon: "🏢", label: spatialIntel.peza.zone_name, sub: `PEZA Certified · ${spatialIntel.peza.region}` });
  }
  if (spatialIntel?.seismic) {
    entityNodes.push({ icon: "📐", label: spatialIntel.seismic.fault_line || "Active Fault", sub: spatialIntel.seismic.status });
  }
  if (spatialIntel?.infra) {
    entityNodes.push({ icon: "🏗️", label: spatialIntel.infra.name, sub: `${spatialIntel.infra.status} · ${spatialIntel.infra.distance_km}km away` });
  }
  if (spatialIntel?.telecom) {
    entityNodes.push({ icon: "🔗", label: "Fiber Connectivity", sub: spatialIntel.telecom.fiber_tier });
  }

  // Dynamic style filters for map container based on visualMode
  const getContainerStyle = () => {
    if (visualMode === "FLIR") return { filter: "invert(1) hue-rotate(180deg) contrast(1.2)" };
    return {};
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "clamp(380px, 60vh, 680px)", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(232, 174, 60, 0.3)" }}>
      {/* Map Container with Visual Filter Support */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%", transition: "filter 0.3s ease", ...getContainerStyle() }} />

      {/* CRT Retro Scanline Overlay */}
      {visualMode === "CRT" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 5,
            background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
            backgroundSize: "100% 3px, 6px 100%",
            boxShadow: "inset 0 0 100px rgba(0,255,100,0.2)",
          }}
        />
      )}

      {/* Floating HUD Command Bar */}
      <div
        className="scm-hud-bar"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          right: "12px",
          zIndex: 10,
          background: "rgba(13, 13, 13, 0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          border: "1px solid rgba(232, 174, 60, 0.4)",
          borderRadius: "8px",
          padding: "10px 12px",
          color: visualMode === "CRT" ? "var(--green)" : "var(--text-primary)",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "11px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
          width: "calc(100% - 24px)",
          maxWidth: "420px",
          transition: "all 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: "var(--accent)", fontWeight: "bold", letterSpacing: "1px" }}>
            🛡️ SPATIAL HUD COMMAND
          </span>
          {/* Wraps because on a touch screen these controls grow to a 44px
              target and no longer fit one row — without it GRAPH is pushed off
              the right edge of the HUD. */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {/* Visual Mode Selector Dropdown */}
            <select
              aria-label="Spatial map visual mode"
              className="scm-hud-select"
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value)}
              style={{
                background: "var(--surface2)",
                border: "1px solid var(--accent)",
                color: "var(--accent-bright)",
                borderRadius: "4px",
                padding: "2px 4px",
                fontSize: "10px",
                fontFamily: "var(--font-mono, monospace)",
                cursor: "pointer",
              }}
            >
              <option value="DEFAULT">📺 DEFAULT</option>
              <option value="FLIR">🔥 FLIR</option>
              <option value="CRT">📟 CRT phosphor</option>
            </select>

            <button
              onClick={() => setShowDossierModal(true)}
              className="scm-hud-btn"
              style={{ background: "var(--surface2)", border: "1px solid var(--border-mid)", color: "var(--text-secondary)", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", cursor: "pointer", transition: "all 0.2s ease" }}
            >
              📍 DOSSIER
            </button>
            <button
              onClick={() => setShowEntityGraph(!showEntityGraph)}
              className="scm-hud-btn"
              style={{ background: showEntityGraph ? "color-mix(in srgb, var(--accent) 30%, transparent)" : "var(--surface2)", border: "1px solid var(--accent)", color: "var(--accent-bright)", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", cursor: "pointer", transition: "all 0.2s ease" }}
            >
              🕸️ GRAPH
            </button>
            <button onClick={() => setHudExpanded(!hudExpanded)} className="scm-hud-toggle" aria-label={hudExpanded ? "Collapse spatial HUD" : "Expand spatial HUD"} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "11px" }}>
              {hudExpanded ? "▲" : "▼"}
            </button>
          </div>
        </div>

        {/* AI Search Bar */}
        {hudExpanded && (
          <form onSubmit={handleAiSearch} style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="🤖 AI Search (e.g. Quake, Infra, Fire, PEZA...)"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              style={{
                width: "100%",
                background: "var(--surface)",
                border: "1px solid rgba(232, 174, 60, 0.3)",
                borderRadius: "4px",
                padding: "6px 10px",
                color: "var(--text-primary)",
                fontSize: "11px",
                fontFamily: "var(--font-mono, monospace)",
                outline: "none",
                transition: "border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 8px color-mix(in srgb, var(--accent) 30%, transparent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(232, 174, 60, 0.3)'; e.target.style.boxShadow = 'none'; }}
            />
            {aiFilterStatus && <div style={{ fontSize: "9px", color: "var(--green)", marginTop: "3px" }}>✓ {aiFilterStatus}</div>}
          </form>
        )}

        {/* HUD Layer Mode Toggles */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: hudExpanded ? "12px" : "0" }}>
          {[
            { id: "all", label: "🛡️ OVERVIEW" },
            { id: "satellite", label: "🛰️ SAT" },
            { id: "infra", label: "🏗️ INFRA" },
            { id: "quake", label: `🌊 QUAKE (${recentQuakes.length})` },
            { id: "fire", label: `🔥 FIRE (${fireCount})` },
            { id: "peza", label: "🏢 PEZA" },
            { id: "clusters", label: "🏢 CLUSTERS" },
            { id: "isochrones", label: "🚆 RINGS" },
            { id: "seismic", label: "📐 FAULT" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleToggleLayer(btn.id)}
              className="scm-layer-btn"
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: activeLayer === btn.id ? "1px solid var(--accent)" : "1px solid var(--border-mid)",
                background: activeLayer === btn.id ? "rgba(232, 174, 60, 0.25)" : "var(--surface2)",
                color: activeLayer === btn.id ? "var(--accent-bright)" : "var(--text-secondary)",
                fontSize: "10px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "all 0.2s ease",
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Pre-Computed Telemetry Metrics + Business Continuity Index */}
        {hudExpanded && spatialIntel && (
          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.15)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {continuity && (
              <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(232, 174, 60, 0.1)", padding: "4px 8px", borderRadius: "4px", border: `1px solid ${continuity.badge_color}` }}>
                <span style={{ color: "var(--accent)", fontWeight: "bold" }}>🛡️ Continuity Index:</span>
                <span style={{ color: continuity.badge_color, fontWeight: "bold" }}>{continuity.score}/100 ({continuity.grade})</span>
              </div>
            )}

            {spatialIntel.infra && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Infra Megaproject:</span>
                <span style={{ color: "var(--intel-cyan)" }}>{spatialIntel.infra.name} ({spatialIntel.infra.distance_km}km)</span>
              </div>
            )}

            {spatialIntel.transit && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Nearest Transit:</span>
                <span style={{ color: "var(--accent-bright)" }}>{spatialIntel.transit.station_name} ({spatialIntel.transit.walk_minutes}m walk)</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>PEZA Status:</span>
              <span style={{ color: spatialIntel.peza?.is_accredited ? "var(--green)" : "var(--text-muted)" }}>
                {spatialIntel.peza?.is_accredited ? `Certified (${spatialIntel.peza.zone_name})` : "Standard Zone"}
              </span>
            </div>

            {spatialIntel.seismic && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Fault Proximity:</span>
                <span style={{ color: "var(--text-secondary)" }}>{spatialIntel.seismic.status}</span>
              </div>
            )}

            {spatialIntel.solar && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Solar Aspect:</span>
                <span style={{ color: "var(--accent-bright)" }}>{spatialIntel.solar.orientation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entity Graph Overlay Panel */}
      {showEntityGraph && (
        <div
          className="scm-entity-graph"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 12,
            width: "300px",
            background: "rgba(13, 13, 13, 0.95)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid var(--accent)",
            borderRadius: "8px",
            padding: "14px",
            color: "var(--text-primary)",
            fontFamily: "var(--font-mono, monospace)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
            animation: "scmFadeIn 0.25s ease-out",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "11px" }}>🕸️ ENTITY & COMPLEX GRAPH</span>
            <button onClick={() => setShowEntityGraph(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ borderBottom: "1px solid var(--surface2)", paddingBottom: "6px" }}>
              <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>TARGET ASSET</div>
              <div style={{ color: "var(--accent-bright)", fontWeight: "bold" }}>{propertyTitle}</div>
            </div>

            <div>
              <div style={{ color: "var(--text-muted)", fontSize: "9px", marginBottom: "4px" }}>CONNECTED INFRASTRUCTURE</div>
              {entityNodes.length > 0 ? entityNodes.map((node, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                  <span>{node.icon}</span>
                  <div>
                    <div style={{ color: "var(--text-secondary)" }}>{node.label}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>{node.sub}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: "var(--text-muted)" }}>No nearby infrastructure detected</div>
              )}
            </div>

            {spatialIntel?.peza?.is_accredited && (
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "9px" }}>PEZA ECOZONE NODE</div>
                <div style={{ color: "var(--green)" }}>{spatialIntel.peza.zone_name}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right-Click Location Dossier Modal */}
      {showDossierModal && dossierData && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "scmFadeIn 0.2s ease-out",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "var(--bg)",
              border: "1px solid var(--accent)",
              borderRadius: "10px",
              padding: "20px",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono, monospace)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>
              <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" }}>
                📍 SPATIAL LOCATION DOSSIER
              </span>
              <button onClick={() => setShowDossierModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Coordinates:</span>
                <span style={{ color: "var(--accent-bright)" }}>{dossierData.lat.toFixed(4)}°N, {dossierData.lng.toFixed(4)}°E</span>
              </div>
              {dossierData.intel?.infra && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Infra Megaproject:</span>
                  <span style={{ color: "var(--intel-cyan)" }}>{dossierData.intel.infra.name} ({dossierData.intel.infra.distance_km}km)</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Solar & Heat Aspect:</span>
                <span style={{ color: "var(--accent-bright)" }}>{dossierData.intel?.solar?.orientation}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Solar Thermal Load:</span>
                <span style={{ color: "var(--green)" }}>{dossierData.intel?.solar?.heat_load}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>PEZA Ecozone Status:</span>
                <span style={{ color: dossierData.intel?.peza?.is_accredited ? "var(--green)" : "var(--text-secondary)" }}>
                  {dossierData.intel?.peza?.is_accredited ? `Certified (${dossierData.intel.peza.zone_name})` : "Standard Commercial Zone"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Nearest Mass Transit:</span>
                <span style={{ color: "var(--accent-bright)" }}>{dossierData.intel?.transit?.station_name} ({dossierData.intel?.transit?.walk_minutes}m walk)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Nearest Active Fault:</span>
                <span style={{ color: "var(--text-secondary)" }}>{dossierData.intel?.seismic?.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Copernicus Sentinel-2:</span>
                <span style={{ color: "var(--green)" }}>10m Optical Stream Ready</span>
              </div>
            </div>

            {/* Sentinel-2 Satellite Intel Deep Link */}
            <a
              href={`https://browser.dataspace.copernicus.eu/?zoom=14&lat=${dossierData.lat}&lng=${dossierData.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: "14px",
                padding: "8px",
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid var(--intel-cyan)",
                color: "var(--intel-cyan)",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              🛰️ OPEN SENTINEL-2 OPTICAL SATELLITE PHOTO (10m RESOLUTION)
            </a>

            <button
              onClick={() => setShowDossierModal(false)}
              style={{
                marginTop: "8px",
                width: "100%",
                padding: "8px",
                background: "var(--accent)",
                color: "var(--bg)",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              CLOSE DOSSIER
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
