"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
// A-121: static, matching every other MapLibre surface in this codebase. This
// component is itself lazy-loaded by its parents via next/dynamic, so the
// stylesheet is still code-split with it.
import "maplibre-gl/dist/maplibre-gl.css";

// ═══════════════════════════════════════════════════════════════════════
// A-121 — ONE MAP ENGINE. This surface was the last Leaflet holdout.
// ═══════════════════════════════════════════════════════════════════════
//
// The public property page rendered through Leaflet while all ten other map
// surfaces rendered through MapLibre: two renderers, two stylesheets, two sets
// of marker and popup conventions, and two libraries to keep patched. The
// security half closed earlier (Leaflet stopped being fetched from `unpkg.com`
// at runtime); this is the other half.
//
// THE CONSTRAINT THAT SHAPED EVERY DECISION BELOW: the owner is satisfied with
// how this map looks, so the port must not change it. That is achievable, and
// the way it is achieved is the raster basemap.
//
// Leaflet drew CARTO's **raster** dark-matter tiles. MapLibre is a vector
// renderer, but it renders raster sources natively — so this keeps the exact
// same tile URL and the basemap is pixel-for-pixel what it was. It deliberately
// does NOT switch to the vector `dark-matter-gl-style` used elsewhere in the
// app: that is a different-looking map, and "while we're in here" is how a
// renderer swap turns into a redesign nobody asked for.
//
// What genuinely could not be identical is the chrome the library owns — the
// popup bubble and the zoom buttons are a different DOM in MapLibre than in
// Leaflet. Those are restyled at the bottom of this file to match what was
// there, which is most of the CSS diff.
//
// Class names lost their `leaflet-` prefix in the same pass. A selector named
// after a library that is no longer installed is a small lie that costs the
// next reader a search.

/**
 * Leaflet's `{s}` subdomain rotation and `{r}` retina suffix are Leaflet
 * template tokens; MapLibre has neither. Expanding them here preserves exactly
 * what was being requested before — the same hosts, and `@2x` on the same
 * displays — rather than quietly serving different tiles.
 */
function cartoRasterTiles() {
  const retina =
    typeof window !== "undefined" && window.devicePixelRatio > 1 ? "@2x" : "";
  return ["a", "b", "c"].map(
    (s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}${retina}.png`
  );
}

/** The style document for a bare raster basemap. No vector layers by design. */
function rasterBasemapStyle() {
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: cartoRasterTiles(),
        tileSize: 256,
        maxzoom: 20,
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

/**
 * Build a marker element. Leaflet's `divIcon` took an HTML string; MapLibre
 * takes a real element, which is strictly better here — U-028's rule is that
 * map content is built as DOM nodes, and this removes the last HTML string.
 */
function markerElement(className, childClassNames) {
  const el = document.createElement("div");
  el.className = className;
  for (const child of childClassNames) {
    const node = document.createElement("div");
    node.className = child;
    el.appendChild(node);
  }
  return el;
}

/** The two-line popup body every marker on this map uses. */
function popupBody(titleText, titleColor, subNode) {
  const wrap = document.createElement("div");
  const title = document.createElement("strong");
  title.style.color = titleColor;
  title.textContent = titleText;
  wrap.appendChild(title);
  wrap.appendChild(document.createElement("br"));
  wrap.appendChild(subNode);
  return wrap;
}

/** A plain-text subtitle. `textContent`, never `innerHTML` (U-028). */
function popupSub(color, text) {
  const sub = document.createElement("span");
  sub.style.color = color;
  sub.textContent = text;
  return sub;
}

const POPUP_OPTIONS = {
  className: "custom-map-popup",
  closeButton: false,
  closeOnClick: true,
  offset: 14,
  maxWidth: "260px",
};

export default function InteractiveMap({ lat, lng, propertyTitle, vicinityData = [], lifestylePois = [], routeDestination = "", routeDestCoords = null, routeLabel = "", isochrone = null, contours = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const hoveredRef = useRef(null);
  const routeBoundsRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;
    let resizeObserver;

    // MapLibre is [lng, lat]; Leaflet was [lat, lng]. Every coordinate in this
    // file goes through one of these two, so the order is stated once rather
    // than flipped by hand at fourteen call sites.
    const position = [lat || 14.5547, lng || 121.0244];
    const centre = [position[1], position[0]];

    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: rasterBasemapStyle(),
      center: centre,
      zoom: 15,
      attributionControl: false,
      scrollZoom: false,
      dragPan: !isMobile,
      // The old map could not rotate or tilt, because Leaflet cannot. Keeping
      // it flat is part of "nothing about this map changes".
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: false,
    });
    mapInstance.current = map;

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right"
    );

    // ── HUD projection ────────────────────────────────────────────────
    // The radar rings, sweep and target-lock line are an SVG overlay in
    // container pixels, so they have to be re-projected on every map move.
    // Leaflet's `latLngToContainerPoint` is MapLibre's `project`, same space.
    const updatePositions = () => {
      if (!mapInstance.current) return;
      try {
        const pPoint = map.project(centre);

        const r1 = document.getElementById("radar-ring-1");
        const r2 = document.getElementById("radar-ring-2");
        const r3 = document.getElementById("radar-ring-3");
        const r4 = document.getElementById("radar-ring-4");
        const sw = document.getElementById("radar-sweep");
        const ll = document.getElementById("radar-lock-line");
        const lr = document.getElementById("radar-lock-ring");

        if (r1) { r1.setAttribute('cx', pPoint.x); r1.setAttribute('cy', pPoint.y); }
        if (r2) { r2.setAttribute('cx', pPoint.x); r2.setAttribute('cy', pPoint.y); }
        if (r3) { r3.setAttribute('cx', pPoint.x); r3.setAttribute('cy', pPoint.y); }
        if (r4) { r4.setAttribute('cx', pPoint.x); r4.setAttribute('cy', pPoint.y); }
        if (sw) {
          sw.setAttribute('x1', pPoint.x); sw.setAttribute('y1', pPoint.y);
          sw.setAttribute('x2', pPoint.x); sw.setAttribute('y2', pPoint.y - 150);
          sw.style.transformOrigin = `${pPoint.x}px ${pPoint.y}px`;
        }

        if (hoveredRef.current) {
          const tPoint = map.project(hoveredRef.current.lngLat);
          if (ll) {
            ll.setAttribute('x1', pPoint.x); ll.setAttribute('y1', pPoint.y);
            ll.setAttribute('x2', tPoint.x); ll.setAttribute('y2', tPoint.y);
          }
          if (lr) {
            lr.setAttribute('cx', tPoint.x); lr.setAttribute('cy', tPoint.y);
          }
        }
      } catch {
        // The map can be mid-teardown when a queued frame lands.
      }
    };

    // Recompute size after a visibility/size change and re-frame the view so
    // the property stays centred (fixes maps that mount while hidden).
    const recenter = () => {
      if (!mapInstance.current) return;
      try {
        map.resize();
        if (routeBoundsRef.current) {
          map.fitBounds(routeBoundsRef.current, { padding: 55, maxZoom: 15, animate: false });
        } else {
          map.jumpTo({ center: centre, zoom: map.getZoom() || 15 });
        }
        updatePositions();
      } catch {
        // Never let a ResizeObserver callback throw into a loop.
      }
    };

    // ── Markers ───────────────────────────────────────────────────────
    const mainMarkerEl = markerElement("custom-map-marker property", [
      "marker-outer-pulse",
      "marker-inner-dot",
    ]);
    mainMarkerEl.setAttribute("title", propertyTitle || "ScoutIt property location");
    mainMarkerEl.setAttribute("aria-label", propertyTitle || "ScoutIt property location");

    new maplibregl.Marker({ element: mainMarkerEl, anchor: "center" })
      .setLngLat(centre)
      .setPopup(
        new maplibregl.Popup(POPUP_OPTIONS).setDOMContent(
          popupBody(
            propertyTitle || "ScoutIt Property",
            "#E8AE3C",
            popupSub("#c8c8c8", "Target Location")
          )
        )
      )
      .addTo(map);

    // Hover wiring is shared by both marker kinds: Leaflet's marker.on()
    // becomes a listener on the element MapLibre is positioning.
    const bindHover = (el, data) => {
      el.addEventListener("mouseenter", () => {
        hoveredRef.current = data;
        setHoveredAmenity(data);
        updatePositions();
      });
      el.addEventListener("mouseleave", () => {
        hoveredRef.current = null;
        setHoveredAmenity(null);
        updatePositions();
      });
    };

    const activePois =
      Array.isArray(lifestylePois) && lifestylePois.length > 0 ? lifestylePois : [];

    if (activePois.length > 0) {
      activePois.forEach((item, index) => {
        const itemLat = Number(item.lat);
        const itemLng = Number(item.lon ?? item.lng);
        if (!Number.isFinite(itemLat) || !Number.isFinite(itemLng)) return;

        const itemLngLat = [itemLng, itemLat];
        const el = markerElement("custom-map-marker white-dot", ["white-dot-marker-core"]);
        el.setAttribute("title", item.name || "Nearby lifestyle point");
        el.setAttribute("aria-label", item.name || "Nearby lifestyle point");

        const catLabel = item.layerLabel || item.category || item.type || "Lifestyle Intel";
        const distLabel = item.distance || (item.meters ? `${item.meters} m` : "");

        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(itemLngLat)
          .setPopup(
            new maplibregl.Popup(POPUP_OPTIONS).setDOMContent(
              popupBody(
                item.name,
                "#ffffff",
                popupSub("#E8AE3C", `${catLabel} · ${distLabel}`)
              )
            )
          )
          .addTo(map);

        bindHover(el, {
          id: index,
          name: item.name,
          category: catLabel,
          distance: distLabel,
          lngLat: itemLngLat,
        });
      });
    } else {
      // Fallback: plot vicinity indicators when lifestylePois is not provided.
      vicinityData.forEach((item, index) => {
        const offsetLat = Math.sin(index * 2.3) * 0.005;
        const offsetLng = Math.cos(index * 1.9) * 0.005;
        const itemLngLat = [centre[0] + offsetLng, centre[1] + offsetLat];

        const el = markerElement("custom-map-marker amenity", ["amenity-dot"]);
        el.setAttribute("title", item.name || "Nearby amenity");
        el.setAttribute("aria-label", item.name || "Nearby amenity");

        new maplibregl.Marker({ element: el, anchor: "center" })
          .setLngLat(itemLngLat)
          .setPopup(
            new maplibregl.Popup(POPUP_OPTIONS).setDOMContent(
              popupBody(
                item.name,
                "#f0ede8",
                popupSub("#c8c8c8", `${item.category} · ${item.distance}`)
              )
            )
          )
          .addTo(map);

        bindHover(el, {
          id: index,
          name: item.name,
          category: item.category,
          distance: item.distance,
          lngLat: itemLngLat,
        });
      });
    }

    // ── Gold route line ───────────────────────────────────────────────
    // Leaflet's L.polyline becomes a GeoJSON source and a line layer. Same
    // colour, same width, same round joins and caps.
    const drawRoute = async () => {
      try {
        let destLat, destLng;
        if (Array.isArray(routeDestCoords) && routeDestCoords.length === 2) {
          [destLat, destLng] = routeDestCoords;
        } else {
          // A-078: geocoding is routed through our own server so the Mapbox
          // token never reaches a public page.
          const geoUrl =
            `/api/mapbox?op=geocode&q=${encodeURIComponent(routeDestination)}` +
            `&proximity=${encodeURIComponent(`${centre[0]},${centre[1]}`)}`;
          const geoRes = await fetch(geoUrl);
          const geoJson = await geoRes.json();
          const features = geoJson?.data?.features;
          if (!features || features.length === 0) return;
          [destLng, destLat] = features[0].center;
        }

        const destName = routeLabel || routeDestination || "Nearest transit hub";

        // Driving directions FROM the transit hub TO the property — this map
        // answers "how do I get to this property?".
        const dirUrl =
          `/api/mapbox?op=directions&profile=driving&coordinates=` +
          encodeURIComponent(`${destLng},${destLat};${centre[0]},${centre[1]}`);
        const dirRes = await fetch(dirUrl);
        const dirJson = await dirRes.json();
        const routes = dirJson?.data?.routes;
        if (!routes || routes.length === 0) return;
        if (cancelled || !mapInstance.current) return;

        const route = routes[0];
        const coordinates = route.geometry.coordinates; // already [lng, lat]

        const addRouteLayers = () => {
          if (!mapInstance.current || map.getSource("scoutit-route")) return;
          map.addSource("scoutit-route", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: { type: "LineString", coordinates },
            },
          });
          map.addLayer({
            id: "scoutit-route-line",
            type: "line",
            source: "scoutit-route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#E8AE3C",
              "line-width": 3,
              "line-opacity": 0.9,
            },
          });
        };

        if (map.isStyleLoaded()) addRouteLayers();
        else map.once("load", addRouteLayers);

        // Origin marker at the transit hub, where the journey begins.
        const originEl = markerElement("custom-map-marker amenity", ["route-origin-dot"]);
        originEl.setAttribute("title", destName || "Transit route origin");
        originEl.setAttribute("aria-label", destName || "Transit route origin");
        new maplibregl.Marker({ element: originEl, anchor: "center" })
          .setLngLat([destLng, destLat])
          .setPopup(
            new maplibregl.Popup(POPUP_OPTIONS).setDOMContent(
              popupBody(destName, "#E8AE3C", popupSub("#c8c8c8", "Transit hub · route start"))
            )
          )
          .addTo(map);

        // Frame both endpoints. Leaflet's polyline.getBounds() becomes an
        // explicit LngLatBounds over the same coordinates.
        const bounds = coordinates.reduce(
          (acc, c) => acc.extend(c),
          new maplibregl.LngLatBounds(coordinates[0], coordinates[0])
        );
        routeBoundsRef.current = bounds;
        map.fitBounds(bounds, { padding: 55, maxZoom: 15, animate: false });
        setTimeout(updatePositions, 120);

        setRouteInfo({
          destName,
          minutes: Math.max(1, Math.round(route.duration / 60)),
          km: (route.distance / 1000).toFixed(1),
        });
      } catch {
        /* network/geocode failure → no route line, map still renders */
      }
    };

    if (routeDestCoords || routeDestination) drawRoute();

    // ── Lifecycle ─────────────────────────────────────────────────────
    map.on("load", () => {
      if (cancelled) return;
      setMapLoaded(true);
      setTimeout(updatePositions, 100);
    });
    map.on("move", updatePositions);
    map.on("zoomend", updatePositions);
    map.on("resize", updatePositions);

    // Re-centre a few times after mount to catch late layout/visibility
    // settling, exactly as before.
    [150, 400, 900].forEach((ms) => setTimeout(recenter, ms));

    if (typeof window !== "undefined" && window.ResizeObserver) {
      resizeObserver = new window.ResizeObserver(() => {
        if (mapInstance.current) setTimeout(recenter, 100);
      });
      if (mapRef.current) resizeObserver.observe(mapRef.current);
    }

    return () => {
      cancelled = true;
      if (resizeObserver) resizeObserver.disconnect();
      routeBoundsRef.current = null;
      if (mapInstance.current) {
        // `remove()` tears down every listener, marker, source and layer this
        // effect added, so they are not unwound one at a time.
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      setMapLoaded(false);
    };
    // JSON.stringify on the array/object props prevents reference-equality
    // React loops that would destroy and rebuild the map unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, propertyTitle, JSON.stringify(vicinityData), JSON.stringify(lifestylePois), routeDestination, JSON.stringify(routeDestCoords), routeLabel]);

  // ── Isochrone overlay (NEW_IDEAS.md §3) ─────────────────────────────
  // Reachability polygons arrive asynchronously from /api/whereto, well after
  // the map mounts. This is a SEPARATE effect on purpose: folding it into the
  // main one would tear down and rebuild the whole map every time the polygons
  // resolve.
  //
  // A radius circle lies — it counts a cafe across a river as "nearby". These
  // bands show what is actually reachable on foot and by car.
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapLoaded) return;

    const SOURCE = "scoutit-isochrone";
    const LAYERS = [
      "scoutit-isochrone-fill",
      "scoutit-isochrone-line",
      "scoutit-isochrone-line-driving",
    ];

    const removeIsochrone = () => {
      if (!mapInstance.current) return;
      try {
        for (const id of LAYERS) if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(SOURCE)) map.removeSource(SOURCE);
      } catch {
        /* already gone */
      }
    };

    removeIsochrone();
    if (!isochrone?.features?.length) return;

    try {
      // Largest polygon first so the tighter walk band paints on top of the
      // wider drive band rather than being buried under it.
      const ordered = {
        ...isochrone,
        features: [...isochrone.features].sort((a, b) => {
          const rank = (f) => (f?.properties?.profile === "driving" ? 0 : 1);
          return rank(a) - rank(b);
        }),
      };

      map.addSource(SOURCE, { type: "geojson", data: ordered });

      const colour = ["coalesce", ["get", "color"], "#E8AE3C"];

      // The bands sit at the BOTTOM of the layer stack so they never cover the
      // route line. Markers are DOM overlays in MapLibre and are always above
      // the canvas, so Leaflet's bringToBack() juggling is not needed — the pins
      // stay clickable by construction.
      const firstLayerId = map.getStyle()?.layers?.find((l) => l.id !== "carto")?.id;

      map.addLayer(
        {
          id: "scoutit-isochrone-fill",
          type: "fill",
          source: SOURCE,
          paint: { "fill-color": colour, "fill-opacity": 0.07 },
        },
        firstLayerId
      );

      // `line-dasharray` is not data-driven in MapLibre, so the dashed driving
      // band and the solid walking band are two filtered layers rather than one
      // layer with a per-feature dash.
      map.addLayer(
        {
          id: "scoutit-isochrone-line",
          type: "line",
          source: SOURCE,
          filter: ["!=", ["get", "profile"], "driving"],
          paint: { "line-color": colour, "line-width": 1, "line-opacity": 0.55 },
        },
        firstLayerId
      );
      map.addLayer(
        {
          id: "scoutit-isochrone-line-driving",
          type: "line",
          source: SOURCE,
          filter: ["==", ["get", "profile"], "driving"],
          paint: {
            "line-color": colour,
            "line-width": 1,
            "line-opacity": 0.55,
            "line-dasharray": [4, 4],
          },
        },
        firstLayerId
      );
    } catch (err) {
      // A malformed polygon must never take down the map.
      console.error("[InteractiveMap] isochrone render failed:", err?.message);
    }

    return removeIsochrone;
  }, [isochrone, mapLoaded]);

  return (
    <div className="map-view-wrapper">
      <div ref={mapRef} className="spatial-map-node" />

      {/* Isochrone legend — only when bands are actually drawn */}
      {mapLoaded && isochrone?.features?.length > 0 && contours.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: "10px",
            bottom: "10px",
            zIndex: 500,
            background: "rgba(13,13,13,0.82)",
            backdropFilter: "blur(6px)",
            border: "0.5px solid #262626",
            borderRadius: "3px",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            pointerEvents: "none",
          }}
        >
          {contours.map((c) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span
                style={{
                  width: "14px",
                  height: "2px",
                  background: c.color,
                  flexShrink: 0,
                  opacity: 0.9,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "#c8c8c8",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}
              >
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 100% Free Transparent HUD Overlay (Blocks no pointer clicks) */}
      {mapLoaded && (
        <svg className="hud-radar-svg-overlay">
          {/* Concentric rings centered on property pin */}
          <circle id="radar-ring-1" cx="0" cy="0" r="50" className="map-radar-ring" />
          <circle id="radar-ring-2" cx="0" cy="0" r="100" className="map-radar-ring" />
          <circle id="radar-ring-3" cx="0" cy="0" r="150" className="map-radar-ring" />
          <circle id="radar-ring-4" cx="0" cy="0" r="150" className="map-radar-ring outer" strokeDasharray="1 3" />

          {/* Sweeper sweep line */}
          <line
            id="radar-sweep"
            x1="0"
            y1="0"
            x2="0"
            y2="-150"
            className="map-radar-sweep animated"
          />

          {/* Target lock dashed vector line to hovered target pin */}
          {hoveredAmenity && (
            <>
              <line
                id="radar-lock-line"
                x1="0"
                y1="0"
                x2="0"
                y2="0"
                className="map-radar-lock-line"
              />
              <circle
                id="radar-lock-ring"
                cx="0"
                cy="0"
                r="10"
                className="map-radar-lock-ring"
              />
            </>
          )}
        </svg>
      )}

      {/* Floating HUD Card Info */}
      <div className={`map-hud-card ${hoveredAmenity ? "visible" : ""}`}>
        {hoveredAmenity && (
          <>
            <div className="hud-card-top">
              <span className="hud-card-cat">{hoveredAmenity.category}</span>
              <span className="hud-card-dist">{hoveredAmenity.distance}</span>
            </div>
            <div className="hud-card-name">{hoveredAmenity.name}</div>
            <div className="hud-card-coords">
              BEARING LOCK: {Math.round((hoveredAmenity.id * (360 / vicinityData.length) + 45) % 360)}° NNE
            </div>
          </>
        )}
      </div>

      {/* Gold route travel-time label */}
      {routeInfo && (
        <div className="map-route-label">
          <span className="route-dot" />
          <span className="route-dest">from {routeInfo.destName}</span>
          <span className="route-time">{routeInfo.minutes} min</span>
          <span className="route-km">· {routeInfo.km} km</span>
        </div>
      )}

      {!mapLoaded && (
        <div className="map-fallback-overlay">
          LAUNCHING GEOGRAPHIC SATELLITE...
        </div>
      )}

      <style jsx global>{`
        .map-view-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 360px;
          border: 0.5px solid #262626;
          border-radius: 8px;
          overflow: hidden;
          background: #0d0d0d;
        }

        .spatial-map-node {
          width: 100%;
          height: 100%;
          z-index: 1;
        }

        /* HUD SVG overlays styling */
        .hud-radar-svg-overlay {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: none; /* Passes all clicks directly to the map below */
          overflow: hidden;
        }

        /* Lifestyle Intel Glowing White Dot Markers */
        .custom-map-marker.white-dot {
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
        }

        .white-dot-marker-core {
          width: 9px;
          height: 9px;
          background: #ffffff;
          border: 1.5px solid #0d0d0d;
          border-radius: 50%;
          box-shadow: 0 0 8px #ffffff, 0 0 16px rgba(232, 174, 60, 0.4);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s ease, box-shadow 0.2s ease;
        }

        @media (hover: hover) and (pointer: fine) {
          .custom-map-marker.white-dot:hover .white-dot-marker-core {
            transform: scale(1.7);
            background: #F7C64E;
            box-shadow: 0 0 12px #F7C64E, 0 0 24px rgba(247, 198, 78, 0.8);
          }
        }

        .map-radar-ring {
          fill: none;
          stroke: rgba(232, 174, 60, 0.12);
          stroke-width: 0.5;
        }

        .map-radar-ring.outer {
          stroke: rgba(232, 174, 60, 0.22);
          stroke-width: 0.6;
        }

        .map-radar-sweep {
          stroke: rgba(232, 174, 60, 0.25);
          stroke-width: 0.6;
        }

        .map-radar-sweep.animated {
          animation: radarSweep 3s linear infinite;
        }

        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .map-radar-lock-line {
          stroke: #E8AE3C;
          stroke-width: 0.75;
          stroke-dasharray: 2 2;
        }

        .map-radar-lock-ring {
          fill: none;
          stroke: #E8AE3C;
          stroke-width: 0.5;
          animation: mapLockPulse 1.2s ease-out infinite;
          transform-origin: center;
        }

        @keyframes mapLockPulse {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }

        /* Floating HUD Card overlay */
        .map-hud-card {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 200px;
          background: rgba(14, 14, 14, 0.88);
          border: 0.5px solid #2d2a24;
          border-radius: 4px;
          padding: 8px 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          opacity: 0;
          visibility: hidden;
          transition: color 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), filter 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 2px;
          pointer-events: none;
          backdrop-filter: blur(12px);
        }

        .map-hud-card.visible {
          opacity: 1;
          visibility: visible;
        }

        .hud-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .hud-card-cat {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #E8AE3C;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hud-card-dist {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #f0ede8;
          font-weight: 600;
        }

        .hud-card-name {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          color: #f0ede8;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hud-card-coords {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #777;
          margin-top: 2px;
          border-top: 0.5px solid #222;
          padding-top: 2px;
        }

        .map-fallback-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0d0d0d;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          color: #6a6a6a;
          z-index: 2;
        }

        /* Gold route travel-time label */
        .map-route-label {
          position: absolute;
          bottom: 14px;
          left: 14px;
          z-index: 100;
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(14, 14, 14, 0.9);
          border: 0.5px solid rgba(232, 174, 60, 0.4);
          border-radius: 4px;
          padding: 7px 12px;
          backdrop-filter: blur(12px);
          max-width: calc(100% - 28px);
        }
        .map-route-label .route-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #E8AE3C;
          box-shadow: 0 0 6px #E8AE3C;
          flex-shrink: 0;
        }
        .map-route-label .route-time {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #E8AE3C;
          font-weight: 600;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .map-route-label .route-dest {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 12px;
          color: #f0ede8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .map-route-label .route-km {
          font-family: var(--font-mono);
          font-size: 12px;
          color: #c8c8c8;
          white-space: nowrap;
        }

        /* Marker Pin adjustments */
        .custom-map-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* MapLibre sizes a marker from its element, where Leaflet took an
           explicit iconSize. These are the same 24/14/12/16px boxes the
           divIcons declared, so the pins land in the same place. */
        .custom-map-marker.property { position: relative; width: 24px; height: 24px; }
        .custom-map-marker.white-dot { width: 14px; height: 14px; }
        .custom-map-marker.amenity { width: 12px; height: 12px; }
        .custom-map-marker.amenity:has(.route-origin-dot) { width: 16px; height: 16px; }

        .marker-outer-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #E8AE3C;
          animation: mapMarkerPulse 2s ease-out infinite;
        }

        .marker-inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E8AE3C;
          box-shadow: 0 0 10px #E8AE3C;
        }

        @keyframes mapMarkerPulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .custom-map-marker.amenity .amenity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #c8c8c8;
          border: 1px solid #1a1a1a;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
        }

        /* Route origin (transit hub) — gold ring marking where the journey starts */
        .custom-map-marker .route-origin-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0e0e0e;
          border: 2px solid #E8AE3C;
          box-shadow: 0 0 8px rgba(232, 174, 60, 0.7);
        }

        @media (hover: hover) and (pointer: fine) {
          .custom-map-marker.amenity:hover .amenity-dot {
            background: #E8AE3C;
            transform: scale(1.5);
            box-shadow: 0 0 8px #E8AE3C;
          }
        }

        /* Popup styles.
           A-121: MapLibre's popup is a different element tree from Leaflet's --
           maplibregl-popup-content and maplibregl-popup-tip where it was
           leaflet-popup-content-wrapper and leaflet-popup-tip. Same surface,
           same border, same shadow, so the bubble reads as it did.
           (No backticks in here: this block is a template literal, and one
           would close it.) */
        .custom-map-popup .maplibregl-popup-content {
          background: #121212 !important;
          color: #f0ede8 !important;
          border: 0.5px solid #2d2a24 !important;
          border-radius: 4px !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          font-size: 12px !important;
          padding: 8px 12px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }

        .custom-map-popup .maplibregl-popup-tip {
          border-top-color: #121212 !important;
          border-bottom-color: #121212 !important;
          border-left-color: #121212 !important;
          border-right-color: #121212 !important;
        }

        /* Zoom control. MapLibre renders buttons where Leaflet rendered
           anchors; the palette, the hairline border and the flat shadow are
           carried across so the control looks unchanged. */
        .map-view-wrapper .maplibregl-ctrl-group {
          background: #121212 !important;
          border: 0.5px solid #262626 !important;
          border-radius: 3px !important;
          box-shadow: none !important;
        }

        .map-view-wrapper .maplibregl-ctrl-group button {
          background-color: #121212 !important;
          border-bottom: 0.5px solid #262626 !important;
          width: 30px;
          height: 30px;
          transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
        }

        .map-view-wrapper .maplibregl-ctrl-group button:last-child {
          border-bottom: none !important;
        }

        /* The control glyphs are inline-SVG background images; a filter is the
           only way to recolour them without shipping replacement icons. */
        .map-view-wrapper .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
          filter: invert(78%) sepia(6%) saturate(0%) hue-rotate(180deg) brightness(95%);
        }

        @media (hover: hover) and (pointer: fine) {
          .map-view-wrapper .maplibregl-ctrl-group button:hover {
            background-color: #1a1a1a !important;
          }
          .map-view-wrapper .maplibregl-ctrl-group button:hover .maplibregl-ctrl-icon {
            filter: invert(74%) sepia(47%) saturate(716%) hue-rotate(348deg) brightness(96%) contrast(92%);
          }
        }

        .map-view-wrapper .maplibregl-ctrl-group button:active {
          transform: scale(0.94);
        }

        @media (max-width: 640px) {
          .map-hud-card {
            top: auto !important;
            bottom: 12px !important;
            left: 12px !important;
            right: 12px !important;
            width: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
