"use client";

import { useEffect, useRef, useState } from "react";

export default function InteractiveMap({ lat, lng, propertyTitle, vicinityData = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const hoveredRef = useRef(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [propertyPixel, setPropertyPixel] = useState({ x: 0, y: 0 });
  const [hoveredAmenity, setHoveredAmenity] = useState(null);
  const [hoveredPixel, setHoveredPixel] = useState(null);
  const [sweepAngle, setSweepAngle] = useState(0);

  // Smooth radar sweep animation loop
  useEffect(() => {
    let frame;
    const animate = () => {
      setSweepAngle((a) => (a + 1.2) % 360);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    // 1. Dynamically append Mapbox CSS
    if (!document.getElementById("mapbox-css")) {
      const link = document.createElement("link");
      link.id = "mapbox-css";
      link.rel = "stylesheet";
      link.href = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css";
      document.head.appendChild(link);
    }

    // 2. Dynamically append Mapbox JS
    let script = document.getElementById("mapbox-js");
    if (!script) {
      script = document.createElement("script");
      script.id = "mapbox-js";
      script.src = "https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js";
      document.head.appendChild(script);
    }

    const startMapbox = () => {
      if (!window.mapboxgl || !mapRef.current || mapInstance.current) return;

      const position = [lng || 121.0244, lat || 14.5547]; // Mapbox order: [lng, lat]

      // Set Access Token
      window.mapboxgl.accessToken = 
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 
        "";

      // Initialize Map
      const map = new window.mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: position,
        zoom: 14,
        attributionControl: false
      });

      // Add Zoom Navigation control without compass
      map.addControl(new window.mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      // Custom HTML main property element
      const mainPropertyEl = document.createElement("div");
      mainPropertyEl.className = "custom-mapbox-marker property";
      mainPropertyEl.innerHTML = `
        <div class="marker-outer-pulse"></div>
        <div class="marker-inner-dot"></div>
      `;

      // Add Main Property Marker
      new window.mapboxgl.Marker(mainPropertyEl)
        .setLngLat(position)
        .addTo(map);

      // Plot vicinity indicators on the map
      vicinityData.forEach((item, index) => {
        // Generate small random offset within vicinity (approx 500m)
        const offsetLat = (Math.sin(index * 2.3) * 0.005);
        const offsetLng = (Math.cos(index * 1.9) * 0.005);
        const itemPosition = [position[0] + offsetLng, position[1] + offsetLat]; // [lng, lat]

        const amenityEl = document.createElement("div");
        amenityEl.className = "custom-mapbox-marker amenity";
        amenityEl.innerHTML = `<div class="amenity-dot"></div>`;

        const marker = new window.mapboxgl.Marker(amenityEl)
          .setLngLat(itemPosition)
          .addTo(map);

        // Bind custom popup
        const popup = new window.mapboxgl.Popup({
          offset: 12,
          closeButton: false,
          className: "custom-mapbox-popup"
        }).setHTML(`<strong>${item.name}</strong><br/><span style="color:#8a8a8a">${item.category} &middot; ${item.distance}</span>`);

        // Mouse hover interactions for the custom marker DOM element
        amenityEl.addEventListener("mouseenter", () => {
          popup.setLngLat(itemPosition).addTo(map);
          const pixel = map.project(itemPosition);
          const data = {
            id: index,
            name: item.name,
            category: item.category,
            distance: item.distance,
            lnglat: itemPosition
          };
          hoveredRef.current = data;
          setHoveredAmenity(data);
          setHoveredPixel({ x: pixel.x, y: pixel.y });
        });

        amenityEl.addEventListener("mouseleave", () => {
          popup.remove();
          hoveredRef.current = null;
          setHoveredAmenity(null);
          setHoveredPixel(null);
        });
      });

      // Update HUD Overlay positioning dynamically on Map movement/renders
      const updatePositions = () => {
        const pPoint = map.project(position);
        setPropertyPixel({ x: pPoint.x, y: pPoint.y });

        if (hoveredRef.current) {
          const tPoint = map.project(hoveredRef.current.lnglat);
          setHoveredPixel({ x: tPoint.x, y: tPoint.y });
        }
      };

      // Hook render event for perfect smooth pixel updates on movement
      map.on("render", updatePositions);

      // Set map instance and update state
      map.on("load", () => {
        setTimeout(updatePositions, 100);
        setMapLoaded(true);
      });

      mapInstance.current = map;
    };

    if (window.mapboxgl) {
      startMapbox();
    } else {
      script.addEventListener("load", startMapbox);
    }

    return () => {
      // Map cleanup
      if (mapInstance.current) {
        mapInstance.current.off("render");
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, propertyTitle, vicinityData]);

  // Compute sweep line coordinates based on animation angle
  const sweepRad = (sweepAngle * Math.PI) / 180;
  const sweepLength = 150; // Sweeps up to outer ring radius
  const sweepX2 = propertyPixel.x + sweepLength * Math.cos(sweepRad);
  const sweepY2 = propertyPixel.y + sweepLength * Math.sin(sweepRad);

  return (
    <div className="map-view-wrapper">
      <div ref={mapRef} className="mapbox-map-node" />
      
      {/* 100% Free Transparent HUD Overlay (Blocks no pointer clicks) */}
      {mapLoaded && (
        <svg className="hud-radar-svg-overlay">
          {/* Concentric rings centered on property pin */}
          <circle cx={propertyPixel.x} cy={propertyPixel.y} r="50" className="mapbox-radar-ring" />
          <circle cx={propertyPixel.x} cy={propertyPixel.y} r="100" className="mapbox-radar-ring" />
          <circle cx={propertyPixel.x} cy={propertyPixel.y} r="150" className="mapbox-radar-ring" />
          <circle cx={propertyPixel.x} cy={propertyPixel.y} r="150" className="mapbox-radar-ring outer" strokeDasharray="1 3" />

          {/* Sweeper sweep line */}
          <line 
            x1={propertyPixel.x} 
            y1={propertyPixel.y} 
            x2={sweepX2} 
            y2={sweepY2} 
            className="mapbox-radar-sweep" 
          />

          {/* Target lock dashed vector line to hovered target pin */}
          {hoveredAmenity && hoveredPixel && (
            <>
              <line
                x1={propertyPixel.x}
                y1={propertyPixel.y}
                x2={hoveredPixel.x}
                y2={hoveredPixel.y}
                className="mapbox-radar-lock-line"
              />
              <circle
                cx={hoveredPixel.x}
                cy={hoveredPixel.y}
                r="10"
                className="mapbox-radar-lock-ring"
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

      {!mapLoaded && (
        <div className="map-fallback-overlay">
          LAUNCHING GEOGRAPHIC SATELLITE...
        </div>
      )}

      <style jsx global>{`
        .map-view-wrapper {
          position: relative;
          width: 100%;
          height: 380px;
          border: 0.5px solid #262626;
          border-radius: 8px;
          overflow: hidden;
          background: #0d0d0d;
        }

        .mapbox-map-node {
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
          pointer-events: none; /* Passes all clicks directly to Mapbox Map underlying */
          overflow: visible;
        }

        .mapbox-radar-ring {
          fill: none;
          stroke: rgba(200, 169, 110, 0.12);
          stroke-width: 0.5;
        }

        .mapbox-radar-ring.outer {
          stroke: rgba(200, 169, 110, 0.22);
          stroke-width: 0.6;
        }

        .mapbox-radar-sweep {
          stroke: rgba(200, 169, 110, 0.25);
          stroke-width: 0.6;
        }

        .mapbox-radar-lock-line {
          stroke: #c8a96e;
          stroke-width: 0.75;
          stroke-dasharray: 2 2;
        }

        .mapbox-radar-lock-ring {
          fill: none;
          stroke: #c8a96e;
          stroke-width: 0.5;
          animation: mapboxLockPulse 1.2s ease-out infinite;
          transform-origin: center;
        }

        @keyframes mapboxLockPulse {
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
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
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
          font-size: 7.5px;
          color: #c8a96e;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .hud-card-dist {
          font-family: var(--font-mono);
          font-size: 8.5px;
          color: #f0ede8;
          font-weight: 600;
        }

        .hud-card-name {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 10px;
          color: #f0ede8;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .hud-card-coords {
          font-family: var(--font-mono);
          font-size: 7.5px;
          color: #5a5a5a;
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
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #6a6a6a;
          z-index: 2;
        }

        /* Marker Pin adjustments */
        .custom-mapbox-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-mapbox-marker.property {
          position: relative;
        }

        .custom-mapbox-marker.property .marker-outer-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #c8a96e;
          animation: mapboxPulse 2s ease-out infinite;
        }

        .custom-mapbox-marker.property .marker-inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c8a96e;
          box-shadow: 0 0 10px #c8a96e;
        }

        @keyframes mapboxPulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .custom-mapbox-marker.amenity .amenity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8a8a8a;
          border: 1px solid #1a1a1a;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .custom-mapbox-marker.amenity:hover .amenity-dot {
          background: #c8a96e;
          transform: scale(1.5);
          box-shadow: 0 0 8px #c8a96e;
        }

        /* Custom Popup Styles to match Dark Mode */
        .custom-mapbox-popup .mapboxgl-popup-content {
          background: #121212 !important;
          color: #f0ede8 !important;
          border: 0.5px solid #2d2a24 !important;
          border-radius: 4px !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          font-size: 11px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
          padding: 8px 12px !important;
        }

        .custom-mapbox-popup .mapboxgl-popup-tip {
          border-bottom-color: #2d2a24 !important;
          border-top-color: #2d2a24 !important;
          border-left-color: transparent !important;
          border-right-color: transparent !important;
        }

        .mapboxgl-ctrl-group {
          background-color: #121212 !important;
          border: 0.5px solid #262626 !important;
          box-shadow: none !important;
        }

        .mapboxgl-ctrl-group button {
          width: 29px !important;
          height: 29px !important;
          border-bottom: 0.5px solid #262626 !important;
        }

        .mapboxgl-ctrl-group button span {
          filter: invert(1) brightness(0.7) !important;
        }

        .mapboxgl-ctrl-group button:hover {
          background-color: #1a1a1a !important;
        }
      `}</style>
    </div>
  );
}
