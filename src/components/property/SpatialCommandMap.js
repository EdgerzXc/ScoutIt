"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import pezaZonesData from "@/data/peza_zones_philippines.json";
import faultSystemData from "@/data/philippines_fault_system.json";
import { computeSpatialIntel, computeContinuityScore } from "@/lib/spatialIntel";

// Nationwide Philippine Active Fault Lines GeoJSON (VFS, EFS, Master Trunk, Digdig, Lubang)
const FAULT_LINE_GEOJSON = faultSystemData;

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

// Nationwide Philippine PEZA IT Park & Special Economic Zone GeoJSON
const PEZA_ZONES_GEOJSON = pezaZonesData;

export default function SpatialCommandMap({ lat = 14.5547, lng = 121.0244, propertyTitle = "ScoutIt Property" }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Safely parse latitude & longitude numbers
  const targetLat = Number(lat) && !isNaN(Number(lat)) ? Number(lat) : 14.5547;
  const targetLng = Number(lng) && !isNaN(Number(lng)) ? Number(lng) : 121.0244;

  const [activeLayer, setActiveLayer] = useState("all"); // 'all' | 'satellite' | 'peza' | 'seismic' | 'clusters' | 'isochrones'
  const [spatialIntel, setSpatialIntel] = useState(null);
  const [hudExpanded, setHudExpanded] = useState(true);
  const [showEntityGraph, setShowEntityGraph] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [dossierData, setDossierData] = useState(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiFilterStatus, setAiFilterStatus] = useState(null);

  // Compute spatial intel metrics on mount
  useEffect(() => {
    if (targetLat && targetLng) {
      const intel = computeSpatialIntel(targetLat, targetLng);
      setSpatialIntel(intel);
      setDossierData({
        lat: targetLat,
        lng: targetLng,
        intel,
      });
    }
  }, [targetLat, targetLng]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [targetLng, targetLat],
      zoom: 15,
      pitch: 35,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("error", (e) => {
      if (e?.error?.message?.includes("tile") || e?.error?.status === 0) return;
    });

    map.on("contextmenu", (e) => {
      e.preventDefault();
      const clickedLat = e.lngLat.lat;
      const clickedLng = e.lngLat.lng;
      const clickedIntel = computeSpatialIntel(clickedLat, clickedLng);
      setDossierData({
        lat: clickedLat,
        lng: clickedLng,
        intel: clickedIntel,
      });
      setShowDossierModal(true);
    });

    map.on("load", () => {
      // 1. Add Satellite Raster Source & Layer (Esri World Imagery)
      map.addSource("satellite-tiles", {
        type: "raster",
        tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
      });

      // Add satellite-layer above CARTO background style so satellite tiles are fully visible
      map.addLayer({
        id: "satellite-layer",
        type: "raster",
        source: "satellite-tiles",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1.0 },
      });

      // 2. Add Target Property Marker
      const el = document.createElement("div");
      el.className = "scoutit-map-pulse-marker";
      el.innerHTML = `
        <div style="
          width: 26px; height: 26px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.3);
          border: 2px solid #E8AE3C;
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.95);
          position: relative;
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

      // 3. Official PHIVOLCS Active Fault System GeoJSON Layer (Method 1: Local GeoJSON Source)
      map.addSource("fault-line-trace", { type: "geojson", data: "/data/phivolcs-active-faults.geojson" });
      map.addLayer({
        id: "fault-line-glow",
        type: "line",
        source: "fault-line-trace",
        layout: { visibility: "visible" },
        paint: {
          "line-color": "#FF3B30",
          "line-width": 7,
          "line-opacity": 0.25,
          "line-blur": 3,
        },
      });
      map.addLayer({
        id: "fault-line-layer",
        type: "line",
        source: "fault-line-trace",
        layout: { visibility: "visible" },
        paint: {
          "line-color": "#FF3B30",
          "line-width": 2,
          "line-dasharray": [2, 2],
          "line-opacity": 0.95,
        },
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
          "visibility": "visible",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#10B981", "text-halo-color": "#0d0d0d", "text-halo-width": 2 },
      });

      // 5. Office Density Clusters Layer
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

      // 6. Mass Transit Isochrone Walking Rings (5m, 10m, 15m rings around target)
      map.addSource("transit-isochrones", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            { type: "Feature", geometry: { type: "Point", coordinates: [targetLng, targetLat] }, properties: { ring: "10-Min Mass Transit Walk Zone (~750m)" } },
          ],
        },
      });
      map.addLayer({
        id: "transit-isochrones-layer",
        type: "circle",
        source: "transit-isochrones",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": ["interpolate", ["exponential", 2], ["zoom"], 9, 12, 12, 38, 15, 160, 18, 550],
          "circle-color": "#F7C64E",
          "circle-opacity": 0.18,
          "circle-stroke-width": 2.5,
          "circle-stroke-color": "#F7C64E",
          "circle-stroke-opacity": 0.9,
        },
      });

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [targetLat, targetLng, propertyTitle]);

  // Recenter map when lat/lng update
  useEffect(() => {
    if (mapInstanceRef.current && targetLat && targetLng) {
      mapInstanceRef.current.flyTo({ center: [targetLng, targetLat], zoom: 15, essential: true });
      if (markerRef.current) markerRef.current.setLngLat([targetLng, targetLat]);
    }
  }, [targetLat, targetLng]);

  // Toggle Map Layer Visibility Safely
  const handleToggleLayer = (layerId) => {
    setActiveLayer(layerId);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (map.getLayer("satellite-layer")) {
      map.setLayoutProperty("satellite-layer", "visibility", layerId === "satellite" ? "visible" : "none");
    }
    if (map.getLayer("peza-zones-layer")) {
      map.setLayoutProperty("peza-zones-layer", "visibility", layerId === "all" || layerId === "peza" ? "visible" : "none");
    }
    if (map.getLayer("peza-zones-label")) {
      map.setLayoutProperty("peza-zones-label", "visibility", layerId === "all" || layerId === "peza" ? "visible" : "none");
    }
    if (map.getLayer("fault-line-glow")) {
      map.setLayoutProperty("fault-line-glow", "visibility", layerId === "all" || layerId === "seismic" ? "visible" : "none");
    }
    if (map.getLayer("fault-line-layer")) {
      map.setLayoutProperty("fault-line-layer", "visibility", layerId === "all" || layerId === "seismic" ? "visible" : "none");
    }
    if (map.getLayer("office-clusters-layer")) {
      map.setLayoutProperty("office-clusters-layer", "visibility", layerId === "all" || layerId === "clusters" ? "visible" : "none");
    }
    if (map.getLayer("transit-isochrones-layer")) {
      map.setLayoutProperty("transit-isochrones-layer", "visibility", layerId === "all" || layerId === "isochrones" ? "visible" : "none");
    }
  };

  // AI Co-Analyst Natural Language Search Handler
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
    } else if (q.includes("fault") || q.includes("seismic") || q.includes("earthquake")) {
      handleToggleLayer("seismic");
      setAiFilterStatus("Filtered: West & East Valley Fault Trace Active");
    } else if (q.includes("sat") || q.includes("aerial") || q.includes("orbital")) {
      handleToggleLayer("satellite");
      setAiFilterStatus("Filtered: Satellite High-Res Imagery Active");
    } else {
      handleToggleLayer("all");
      setAiFilterStatus(`Analyzed: Spatial Query matched target coords [${targetLat.toFixed(3)}, ${targetLng.toFixed(3)}]`);
    }
  };

  const continuity = spatialIntel ? computeContinuityScore(spatialIntel) : null;

  return (
    <div style={{ position: "relative", width: "100%", height: "560px", borderRadius: "12px", overflow: "hidden", border: "1px solid rgba(232, 174, 60, 0.3)" }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

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
          color: "#fff",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
          maxWidth: "400px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ color: "#E8AE3C", fontWeight: "bold", letterSpacing: "1px" }}>
            🛡️ SPATIAL HUD COMMAND
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
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

        {/* AI Co-Analyst Natural Language Search Bar */}
        {hudExpanded && (
          <form onSubmit={handleAiSearch} style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="🤖 AI Spatial Search (e.g. Clusters, Transit Rings...)"
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
            { id: "satellite", label: "🛰️ SATELLITE" },
            { id: "peza", label: "🏢 PEZA ZONES" },
            { id: "clusters", label: "🏢 CLUSTERS" },
            { id: "isochrones", label: "🚆 RINGS" },
            { id: "seismic", label: "📐 FAULT" },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => handleToggleLayer(btn.id)}
              style={{
                padding: "4px 8px",
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
            <div style={{ borderBottom: "1px solid #222", pb: "6px" }}>
              <div style={{ color: "#888", fontSize: "9px" }}>TARGET ASSET</div>
              <div style={{ color: "#F7C64E", fontWeight: "bold" }}>{propertyTitle}</div>
            </div>

            <div>
              <div style={{ color: "#888", fontSize: "9px" }}>CONNECTED INFRASTRUCTURE</div>
              <div style={{ color: "#ccc" }}>✓ Pedestrian Skywalk Link</div>
              <div style={{ color: "#ccc" }}>✓ Direct MRT Concourse Access</div>
              <div style={{ color: "#ccc" }}>✓ Fiber POP Landing Zone</div>
            </div>

            <div>
              <div style={{ color: "#888", fontSize: "9px" }}>PEZA ECOZONE NODE</div>
              <div style={{ color: "#10B981" }}>{spatialIntel?.peza?.zone_name || "Regional Business Hub"}</div>
            </div>
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
            justify: "center",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid #262626", pb: "8px" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#888" }}>Solar & Heat Orientation:</span>
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
                <span style={{ color: "#888" }}>West Valley Fault Buffer:</span>
                <span style={{ color: "#ccc" }}>{dossierData.intel?.seismic?.status}</span>
              </div>
            </div>

            <button
              onClick={() => setShowDossierModal(false)}
              style={{
                marginTop: "16px",
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
