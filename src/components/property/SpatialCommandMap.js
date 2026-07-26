"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import pezaZonesData from "@/data/peza_zones_philippines.json";
import infraProjectsData from "@/data/ph_infrastructure_projects.json";
import { computeSpatialIntel, computeContinuityScore } from "@/lib/spatialIntel";

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
    const layerGroups = {
      "satellite-layer": layerId === "satellite",
      "peza-zones-layer": layerId === "all" || layerId === "peza",
      "peza-zones-label": layerId === "all" || layerId === "peza",
      "fault-line-glow": layerId === "all" || layerId === "seismic",
      "fault-line-layer": layerId === "all" || layerId === "seismic",
      "office-clusters-layer": layerId === "all" || layerId === "clusters",
      "transit-ring-5": layerId === "all" || layerId === "isochrones",
      "transit-ring-10": layerId === "all" || layerId === "isochrones",
      "transit-ring-15": layerId === "all" || layerId === "isochrones",
      "infra-lines-layer": layerId === "all" || layerId === "infra",
      "infra-points-layer": layerId === "all" || layerId === "infra",
      "quakes-layer": layerId === "all" || layerId === "quake",
      "fires-layer": layerId === "all" || layerId === "fire",
    };
    for (const [lid, visible] of Object.entries(layerGroups)) {
      if (map.getLayer(lid)) {
        map.setLayoutProperty(lid, "visibility", visible ? "visible" : "none");
      }
    }
  }, []);

  // ─── Initialize MapLibre GL Map (once) ─────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [targetLng, targetLat],
      zoom: 15,
      pitch: 35,
    });

    // Assign ref immediately so cleanup always works
    mapInstanceRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (e) => {
      if (e?.error?.message?.includes("tile") || e?.error?.status === 0) return;
    });

    map.on("contextmenu", (e) => {
      e.preventDefault();
      const clickedIntel = computeSpatialIntel(e.lngLat.lat, e.lngLat.lng);
      setDossierData({ lat: e.lngLat.lat, lng: e.lngLat.lng, intel: clickedIntel });
      setShowDossierModal(true);
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

      // 2. Target Property Marker
      const el = document.createElement("div");
      el.innerHTML = `
        <div style="
          width: 26px; height: 26px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.3);
          border: 2px solid #E8AE3C;
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.95);
          display: flex; align-items: center; justify-content: center;
        ">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: #F7C64E;"></div>
        </div>
      `;

      markerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([targetLng, targetLat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "scoutit-popup" }).setHTML(
            `<strong style="color:#E8AE3C">${propertyTitle}</strong><br/><span style="color:#ccc;font-size:11px;">Target Space</span>`
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
        paint: { "line-color": "#FF3B30", "line-width": 7, "line-opacity": 0.25, "line-blur": 3 },
      });
      map.addLayer({
        id: "fault-line-layer",
        type: "line",
        source: "fault-line-trace",
        layout: { visibility: "visible" },
        paint: { "line-color": "#FF3B30", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.95 },
      });

      // 4. PEZA IT Park Zone Layer
      map.addSource("peza-zones", { type: "geojson", data: PEZA_ZONES_GEOJSON });
      map.addLayer({
        id: "peza-zones-layer",
        type: "circle",
        source: "peza-zones",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 6, 12, 28, 15, 110, 18, 450],
          "circle-color": "#10B981",
          "circle-opacity": 0.18,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#10B981",
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
        paint: { "text-color": "#10B981", "text-halo-color": "#0d0d0d", "text-halo-width": 2 },
      });

      // 5. Office Density Clusters
      map.addSource("office-clusters", { type: "geojson", data: OFFICE_CLUSTERS_GEOJSON });
      map.addLayer({
        id: "office-clusters-layer",
        type: "circle",
        source: "office-clusters",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 8, 12, 35, 15, 140],
          "circle-color": "#3B82F6",
          "circle-opacity": 0.15,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#60A5FA",
        },
      });

      // 6. Concentric Transit Walking Rings (5-min / 10-min / 15-min)
      const ringSource = {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [{ type: "Feature", geometry: { type: "Point", coordinates: [targetLng, targetLat] }, properties: {} }],
        },
      };
      map.addSource("transit-rings", ringSource);

      // 15-min ring (~1125m) — outermost, most transparent
      map.addLayer({
        id: "transit-ring-15",
        type: "circle",
        source: "transit-rings",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 18, 12, 57, 15, 240, 18, 825],
          "circle-color": "transparent",
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#F7C64E",
          "circle-stroke-opacity": 0.35,
        },
      });
      // 10-min ring (~750m)
      map.addLayer({
        id: "transit-ring-10",
        type: "circle",
        source: "transit-rings",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 12, 12, 38, 15, 160, 18, 550],
          "circle-color": "transparent",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F7C64E",
          "circle-stroke-opacity": 0.55,
        },
      });
      // 5-min ring (~375m) — innermost, most visible
      map.addLayer({
        id: "transit-ring-5",
        type: "circle",
        source: "transit-rings",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 6, 12, 19, 15, 80, 18, 275],
          "circle-color": "rgba(247, 198, 78, 0.08)",
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#F7C64E",
          "circle-stroke-opacity": 0.9,
        },
      });

      // 7. Philippine Major Infrastructure Megaprojects Layer
      map.addSource("infra-projects", { type: "geojson", data: infraProjectsData });
      map.addLayer({
        id: "infra-lines-layer",
        type: "line",
        source: "infra-projects",
        filter: ["==", "$type", "LineString"],
        layout: { visibility: "visible" },
        paint: { "line-color": "#06B6D4", "line-width": 3, "line-dasharray": [3, 2], "line-opacity": 0.85 },
      });
      map.addLayer({
        id: "infra-points-layer",
        type: "circle",
        source: "infra-projects",
        filter: ["==", "$type", "Point"],
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 8,
          "circle-color": "#EC4899",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F472B6",
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
                "circle-color": ["step", ["get", "mag"], "#F7C64E", 4.0, "#F97316", 5.5, "#EF4444"],
                "circle-opacity": 0.7,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#ffffff",
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
          "circle-color": "#EF4444",
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F59E0B",
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
        mapInstanceRef.current.remove();
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
    <div style={{ position: "relative", width: "100%", height: "560px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(232, 174, 60, 0.3)" }}>
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
        style={{
          position: "absolute",
          top: "16px",
          left: "16px",
          zIndex: 10,
          background: "rgba(13, 13, 13, 0.92)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(232, 174, 60, 0.4)",
          borderRadius: "8px",
          padding: "12px 14px",
          color: visualMode === "CRT" ? "#00FF66" : "#fff",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
          maxWidth: "420px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: "#E8AE3C", fontWeight: "bold", letterSpacing: "1px" }}>
            🛡️ SPATIAL HUD COMMAND
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            {/* Visual Mode Selector Dropdown */}
            <select
              value={visualMode}
              onChange={(e) => setVisualMode(e.target.value)}
              style={{
                background: "#1a1a1a",
                border: "1px solid #E8AE3C",
                color: "#F7C64E",
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
              style={{ background: "#222", border: "1px solid #444", color: "#ccc", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", cursor: "pointer" }}
            >
              📍 DOSSIER
            </button>
            <button
              onClick={() => setShowEntityGraph(!showEntityGraph)}
              style={{ background: showEntityGraph ? "rgba(232,174,60,0.3)" : "#222", border: "1px solid #E8AE3C", color: "#F7C64E", borderRadius: "4px", padding: "2px 6px", fontSize: "10px", cursor: "pointer" }}
            >
              🕸️ GRAPH
            </button>
            <button onClick={() => setHudExpanded(!hudExpanded)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "11px" }}>
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
                background: "#161616",
                border: "1px solid rgba(232, 174, 60, 0.3)",
                borderRadius: "4px",
                padding: "5px 8px",
                color: "#fff",
                fontSize: "11px",
                fontFamily: "var(--font-mono, monospace)",
                outline: "none",
              }}
            />
            {aiFilterStatus && <div style={{ fontSize: "9px", color: "#10B981", marginTop: "3px" }}>✓ {aiFilterStatus}</div>}
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
              style={{
                padding: "4px 7px",
                borderRadius: "4px",
                border: activeLayer === btn.id ? "1px solid #E8AE3C" : "1px solid #333",
                background: activeLayer === btn.id ? "rgba(232, 174, 60, 0.25)" : "#1a1a1a",
                color: activeLayer === btn.id ? "#F7C64E" : "#aaa",
                fontSize: "9px",
                cursor: "pointer",
                fontWeight: "bold",
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
                <span style={{ color: "#E8AE3C", fontWeight: "bold" }}>🛡️ Continuity Index:</span>
                <span style={{ color: continuity.badge_color, fontWeight: "bold" }}>{continuity.score}/100 ({continuity.grade})</span>
              </div>
            )}

            {spatialIntel.infra && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Infra Megaproject:</span>
                <span style={{ color: "#06B6D4" }}>{spatialIntel.infra.name} ({spatialIntel.infra.distance_km}km)</span>
              </div>
            )}

            {spatialIntel.transit && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Nearest Transit:</span>
                <span style={{ color: "#F7C64E" }}>{spatialIntel.transit.station_name} ({spatialIntel.transit.walk_minutes}m walk)</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#888" }}>PEZA Status:</span>
              <span style={{ color: spatialIntel.peza?.is_accredited ? "#10B981" : "#888" }}>
                {spatialIntel.peza?.is_accredited ? `Certified (${spatialIntel.peza.zone_name})` : "Standard Zone"}
              </span>
            </div>

            {spatialIntel.seismic && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Fault Proximity:</span>
                <span style={{ color: "#ccc" }}>{spatialIntel.seismic.status}</span>
              </div>
            )}

            {spatialIntel.solar && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Solar Aspect:</span>
                <span style={{ color: "#F7C64E" }}>{spatialIntel.solar.orientation}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entity Graph Overlay Panel */}
      {showEntityGraph && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            zIndex: 12,
            width: "300px",
            background: "rgba(13, 13, 13, 0.95)",
            backdropFilter: "blur(16px)",
            border: "1px solid #E8AE3C",
            borderRadius: "8px",
            padding: "14px",
            color: "#fff",
            fontFamily: "var(--font-mono, monospace)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.8)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ color: "#E8AE3C", fontWeight: "bold", fontSize: "11px" }}>🕸️ ENTITY & COMPLEX GRAPH</span>
            <button onClick={() => setShowEntityGraph(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
          </div>

          <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ borderBottom: "1px solid #222", paddingBottom: "6px" }}>
              <div style={{ color: "#888", fontSize: "9px" }}>TARGET ASSET</div>
              <div style={{ color: "#F7C64E", fontWeight: "bold" }}>{propertyTitle}</div>
            </div>

            <div>
              <div style={{ color: "#888", fontSize: "9px", marginBottom: "4px" }}>CONNECTED INFRASTRUCTURE</div>
              {entityNodes.length > 0 ? entityNodes.map((node, i) => (
                <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                  <span>{node.icon}</span>
                  <div>
                    <div style={{ color: "#ccc" }}>{node.label}</div>
                    <div style={{ color: "#666", fontSize: "9px" }}>{node.sub}</div>
                  </div>
                </div>
              )) : (
                <div style={{ color: "#555" }}>No nearby infrastructure detected</div>
              )}
            </div>

            {spatialIntel?.peza?.is_accredited && (
              <div>
                <div style={{ color: "#888", fontSize: "9px" }}>PEZA ECOZONE NODE</div>
                <div style={{ color: "#10B981" }}>{spatialIntel.peza.zone_name}</div>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "440px",
              background: "#0d0d0d",
              border: "1px solid #E8AE3C",
              borderRadius: "10px",
              padding: "20px",
              color: "#fff",
              fontFamily: "var(--font-mono, monospace)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #262626", paddingBottom: "8px" }}>
              <span style={{ color: "#E8AE3C", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" }}>
                📍 SPATIAL LOCATION DOSSIER
              </span>
              <button onClick={() => setShowDossierModal(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "11px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Coordinates:</span>
                <span style={{ color: "#F7C64E" }}>{dossierData.lat.toFixed(4)}°N, {dossierData.lng.toFixed(4)}°E</span>
              </div>
              {dossierData.intel?.infra && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#888" }}>Infra Megaproject:</span>
                  <span style={{ color: "#06B6D4" }}>{dossierData.intel.infra.name} ({dossierData.intel.infra.distance_km}km)</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Solar & Heat Aspect:</span>
                <span style={{ color: "#F7C64E" }}>{dossierData.intel?.solar?.orientation}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Solar Thermal Load:</span>
                <span style={{ color: "#10B981" }}>{dossierData.intel?.solar?.heat_load}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>PEZA Ecozone Status:</span>
                <span style={{ color: dossierData.intel?.peza?.is_accredited ? "#10B981" : "#aaa" }}>
                  {dossierData.intel?.peza?.is_accredited ? `Certified (${dossierData.intel.peza.zone_name})` : "Standard Commercial Zone"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Nearest Mass Transit:</span>
                <span style={{ color: "#F7C64E" }}>{dossierData.intel?.transit?.station_name} ({dossierData.intel?.transit?.walk_minutes}m walk)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Nearest Active Fault:</span>
                <span style={{ color: "#ccc" }}>{dossierData.intel?.seismic?.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Copernicus Sentinel-2:</span>
                <span style={{ color: "#10B981" }}>10m Optical Stream Ready</span>
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
                border: "1px solid #06B6D4",
                color: "#67E8F9",
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
                background: "#E8AE3C",
                color: "#0d0d0d",
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
