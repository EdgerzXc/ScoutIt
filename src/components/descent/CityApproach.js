"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import "./city-approach.css";

/*
 * CITY APPROACH — the last leg of the descent.
 *
 * The globe cannot show a city. Its geometry is 110m country borders, so at
 * every altitude there is nothing inside a country outline to reveal; flying
 * lower only enlarges empty polygons and floods the frame.
 *
 * This is real Metro Manila: the Carto dark basemap carries a `building`
 * source-layer, so the towers below are actual building footprints extruded
 * to their real heights, over real streets and real coastline.
 *
 * Purely scenery — no interaction, no controls, pointer-events off.
 */

const MANILA = { lng: 121.0244, lat: 14.5547 };

const START_ZOOM = 10.2;
/* The building tiles stop at z14, so this overzooms slightly — MapLibre
   upscales z14 geometry rather than dropping it, which keeps the towers
   while getting the camera close enough to read a street. */
const END_ZOOM = 15.2;
/* How long to wait for the arrival view to finish loading before handing
   over anyway. */
const PRELOAD_TIMEOUT_MS = 8000;

const START_PITCH = 45;
const END_PITCH = 66;

export default function CityApproach({
  active = false,
  durationMs = 6000,
  onReady = null,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const flownRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [MANILA.lng, MANILA.lat],
      zoom: START_ZOOM,
      pitch: START_PITCH,
      bearing: -18,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      /* Real building footprints, extruded to their real heights and tinted
         into the ScoutIt palette rather than left basemap-grey. This is the
         thing the globe could never provide. */
      if (map.getSource("carto")) {
        map.addLayer({
          id: "scout-buildings",
          type: "fill-extrusion",
          source: "carto",
          "source-layer": "building",
          minzoom: 12,
          /* The tile schema flags buildings that should not be extruded
             (courtyards, covered areas). Honouring it stops the skyline
             growing blocks that are not really there. */
          filter: ["!=", ["get", "hide_3d"], true],
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "render_height"], 12],
              0, "#241d10",
              60, "#4a3a16",
              180, "#8a6a22",
            ],
            "fill-extrusion-height": [
              "coalesce",
              ["get", "render_height"],
              12,
            ],
            "fill-extrusion-base": [
              "coalesce",
              ["get", "render_min_height"],
              0,
            ],
            "fill-extrusion-opacity": 0.92,
          },
        });
      }

      /* ── PRELOAD THE DESTINATION ──────────────────────────────────
         The map opens at START_ZOOM, but buildings only exist from zoom
         12, so flying straight from 10.2 would fetch the skyline DURING
         the cross-fade and the city would assemble itself in front of the
         reader.

         Instead: jump invisibly to the arrival view first, wait for the
         map to go idle (style, tiles and extrusions all resolved), then
         snap back to the start. The destination is then warm in the tile
         cache, so when the globe hands over the metropolis is already
         standing rather than loading. */
      map.jumpTo({ zoom: END_ZOOM, pitch: END_PITCH, bearing: -8 });

      let settled = false;
      const settle = () => {
        if (settled) return;
        settled = true;
        map.off("idle", settle);
        clearTimeout(bail);
        map.jumpTo({
          zoom: START_ZOOM,
          pitch: START_PITCH,
          bearing: -18,
          center: [MANILA.lng, MANILA.lat],
        });
        setReady(true);
        if (onReadyRef.current) onReadyRef.current();
      };

      /* A blocked CDN or a slow connection must not strand the descent on
         the globe forever — hand over warm if possible, cold if not. */
      const bail = setTimeout(settle, PRELOAD_TIMEOUT_MS);
      map.on("idle", settle);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      flownRef.current = false;
      setReady(false);
    };
  }, []);

  /* The approach itself. Fires once, when the globe hands over. */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !active || flownRef.current) return;
    flownRef.current = true;

    const still =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (still) {
      map.jumpTo({ zoom: END_ZOOM, pitch: END_PITCH, bearing: -8 });
      return;
    }

    map.easeTo({
      zoom: END_ZOOM,
      pitch: END_PITCH,
      bearing: -8,
      duration: durationMs,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
  }, [active, ready, durationMs]);

  return (
    <div
      className={`city-approach${active ? " is-active" : ""}`}
      aria-hidden="true"
    >
      <div ref={containerRef} className="city-approach__canvas" />
    </div>
  );
}
