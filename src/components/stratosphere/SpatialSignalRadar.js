"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MapCreditControl from "@/components/maps/MapCreditControl";
import { generateBeaconGeoJSON, DISTRICT_COORDS } from "@/lib/communitySignalsAdapter";
import "./spatial-signal-radar.css";

const METRO_MANILA_CENTER = { lng: 121.0350, lat: 14.5500 };
const DEFAULT_ZOOM = 11.2;
const DEFAULT_PITCH = 48;
const DEFAULT_BEARING = -16;

export default function SpatialSignalRadar({
  allSignals = [],
  filteredSignals = [],
  selectedSignal = null,
  hoveredSignalId = null,
  selectedDistrict = null,
  onSelectSignal = () => {},
  onHoverSignal = () => {},
  onSelectDistrict = () => {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [webglSupported, setWebglSupported] = useState(true);

  // Check WebGL availability for fallback
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  const filteredIdsSet = React.useMemo(() => {
    return new Set(filteredSignals.map((s) => s.id));
  }, [filteredSignals]);

  // Generate GeoJSON based on all signals and filtered set (dimming non-matches)
  const geoData = React.useMemo(() => {
    return generateBeaconGeoJSON(allSignals, filteredIdsSet);
  }, [allSignals, filteredIdsSet]);

  const allSignalsRef = useRef(allSignals);
  const onHoverSignalRef = useRef(onHoverSignal);
  const onSelectSignalRef = useRef(onSelectSignal);
  const geoDataRef = useRef(geoData);

  useEffect(() => {
    allSignalsRef.current = allSignals;
    onHoverSignalRef.current = onHoverSignal;
    onSelectSignalRef.current = onSelectSignal;
    geoDataRef.current = geoData;
  });

  /* ── 1. MAP INITIALIZATION ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [METRO_MANILA_CENTER.lng, METRO_MANILA_CENTER.lat],
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      maxPitch: 65,
      cooperativeGestures: true,
      attributionControl: false, // Critical CVE-2026-85061 sink mitigation
    });

    mapInstanceRef.current = map;

    // Standard ScoutIt controls
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new MapCreditControl(), "bottom-right");

    map.on("load", () => {
      /* ── SUBDUED 3D BUILDINGS ── */
      if (map.getSource("carto")) {
        map.addLayer({
          id: "carto-buildings-3d",
          type: "fill-extrusion",
          source: "carto",
          "source-layer": "building",
          minzoom: 12,
          filter: ["!=", ["get", "hide_3d"], true],
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["coalesce", ["get", "render_height"], 10],
              0, "#121212",
              60, "#221d15",
              180, "#3a2d12",
            ],
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], 10],
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
            "fill-extrusion-opacity": 0.82,
          },
        });
      }

      /* ── BEACON GROUND RINGS ── */
      map.addSource("radar-ground-rings-src", {
        type: "geojson",
        data: geoDataRef.current.groundRings,
      });

      map.addLayer({
        id: "radar-ground-rings-fill",
        type: "fill",
        source: "radar-ground-rings-src",
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "*",
            ["get", "opacity"],
            0.12,
          ],
        },
      });

      map.addLayer({
        id: "radar-ground-rings-line",
        type: "line",
        source: "radar-ground-rings-src",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 1.2,
          "line-opacity": ["get", "opacity"],
        },
      });

      /* ── 3D VERTICAL BEACON PILLARS ── */
      map.addSource("radar-beacons-src", {
        type: "geojson",
        data: geoDataRef.current.beacons,
      });

      map.addLayer({
        id: "signal-beacons-3d",
        type: "fill-extrusion",
        source: "radar-beacons-src",
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.82,
        },
      });

      /* ── HOVER / SELECTION EVENTS ON BEACONS ── */
      map.on("mousemove", "signal-beacons-3d", (e) => {
        if (e.features && e.features.length > 0) {
          map.getCanvas().style.cursor = "pointer";
          const id = e.features[0].properties?.id;
          if (id) onHoverSignalRef.current(id);
        }
      });

      map.on("mouseleave", "signal-beacons-3d", () => {
        map.getCanvas().style.cursor = "";
        onHoverSignalRef.current(null);
      });

      map.on("click", "signal-beacons-3d", (e) => {
        if (e.features && e.features.length > 0) {
          const id = e.features[0].properties?.id;
          const match = allSignalsRef.current.find((s) => s.id === id);
          if (match) onSelectSignalRef.current(match);
        }
      });

      map.on("zoom", () => {
        setCurrentZoom(map.getZoom());
      });

      setMapLoaded(true);
    });

    let resizeObserver = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.resize();
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  /* ── 2. DYNAMIC GEOJSON UPDATE ON FILTER / SEARCH CHANGE ── */
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const beaconsSrc = map.getSource("radar-beacons-src");
    if (beaconsSrc) {
      beaconsSrc.setData(geoData.beacons);
    }

    const ringsSrc = map.getSource("radar-ground-rings-src");
    if (ringsSrc) {
      ringsSrc.setData(geoData.groundRings);
    }
  }, [geoData, mapLoaded]);

  /* ── 3. CAMERA TRANSITION ON DISTRICT SELECTION ── */
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (selectedDistrict && DISTRICT_COORDS[selectedDistrict]) {
      const coords = DISTRICT_COORDS[selectedDistrict];
      map.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 13.5,
        pitch: 52,
        bearing: -12,
        duration: reduceMotion ? 0 : 1600,
        essential: true,
      });
    } else if (!selectedDistrict && !selectedSignal) {
      // Return to metro overview
      map.flyTo({
        center: [METRO_MANILA_CENTER.lng, METRO_MANILA_CENTER.lat],
        zoom: DEFAULT_ZOOM,
        pitch: DEFAULT_PITCH,
        bearing: DEFAULT_BEARING,
        duration: reduceMotion ? 0 : 1400,
        essential: true,
      });
    }
  }, [selectedDistrict, selectedSignal, mapLoaded]);

  /* ── 4. CAMERA GLIDE ON CARD SELECTION ── */
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !selectedSignal) return;
    const map = mapInstanceRef.current;

    if (selectedSignal.coords?.lng && selectedSignal.coords?.lat) {
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

      map.flyTo({
        center: [selectedSignal.coords.lng, selectedSignal.coords.lat],
        zoom: 14.5,
        pitch: 58,
        bearing: -10,
        duration: reduceMotion ? 0 : 1400,
        essential: true,
      });
    }
  }, [selectedSignal, mapLoaded]);

  if (!webglSupported) {
    return (
      <div className="ssr-container ssr-fallback" aria-label="Stratosphere Spatial Radar Fallback">
        <div className="ssr-fallback-card">
          <h4 className="ssr-fallback-title">Spatial Radar: 2D Dossier Mode Active</h4>
          <p className="ssr-fallback-desc">
            WebGL acceleration is unavailable on this device. All geospatial signals and metrics remain accessible in the dossier feed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ssr-container" aria-label="Stratosphere 3D Spatial Radar">
      <div ref={mapContainerRef} className="ssr-canvas" />

      {/* Radar HUD telemetry watermark */}
      <div className="ssr-hud-overlay" aria-hidden="true">
        <div className="ssr-hud-top-left">
          <span className="ssr-hud-dot" />
          <span className="ssr-hud-text">SPATIAL INTEL RADAR // METRO MANILA</span>
        </div>
        <div className="ssr-hud-top-right">
          <span className="ssr-hud-text">
            PINS: {filteredSignals.filter((signal) => signal.coords?.lat && signal.coords?.lng).length} SHOWN / {allSignals.filter((signal) => signal.coords?.lat && signal.coords?.lng).length} TOTAL
          </span>
        </div>
        <div className="ssr-hud-bottom-left">
          <span className="ssr-hud-tag">
            {selectedDistrict ? `SECTOR: ${selectedDistrict.toUpperCase()}` : "MACRO LEVEL // ALL SECTORS"}
          </span>
        </div>
      </div>
    </div>
  );
}
