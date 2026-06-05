"use client";

import { useEffect, useRef, useState } from "react";

export default function InteractiveMap({ lat, lng, propertyTitle, vicinityData = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // 1. Dynamically append Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // 2. Dynamically append Leaflet JS
    let script = document.getElementById("leaflet-js");
    if (!script) {
      script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      document.head.appendChild(script);
    }

    const startLeafletMap = () => {
      if (!window.L || !mapRef.current || mapInstance.current) return;

      const position = [lat || 14.5547, lng || 121.0244];

      // Initialize Map
      const map = window.L.map(mapRef.current, {
        center: position,
        zoom: 15,
        zoomControl: false,
        attributionControl: false
      });

      // Add CartoDB Dark Matter tile layer
      window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20
      }).addTo(map);

      // Custom Leaflet Zoom buttons positioned cleanly
      window.L.control.zoom({ position: "topright" }).addTo(map);

      // Create Custom HTML DivIcon for main property
      const mainPropertyIcon = window.L.divIcon({
        className: "custom-leaflet-marker property",
        html: `
          <div class="marker-outer-pulse"></div>
          <div class="marker-inner-dot"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      // Add Main Property Marker
      window.L.marker(position, { icon: mainPropertyIcon })
        .addTo(map)
        .bindPopup(`<strong style="color:#c8a96e">${propertyTitle || "ScoutIt Property"}</strong><br/><span style="color:#8a8a8a">Target Location</span>`, {
          className: "custom-leaflet-popup"
        });

      // Plot random offsets for vicinity indicators for visual representation
      vicinityData.forEach((item, index) => {
        // Generate small random offset within vicinity (approx 500m)
        const offsetLat = (Math.sin(index * 2.3) * 0.005);
        const offsetLng = (Math.cos(index * 1.9) * 0.005);
        const itemPosition = [position[0] + offsetLat, position[1] + offsetLng];

        const amenityIcon = window.L.divIcon({
          className: "custom-leaflet-marker amenity",
          html: `<div class="amenity-dot"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        window.L.marker(itemPosition, { icon: amenityIcon })
          .addTo(map)
          .bindPopup(`<strong>${item.name}</strong><br/><span style="color:#8a8a8a">${item.category} &middot; ${item.distance}</span>`, {
            className: "custom-leaflet-popup"
          });
      });

      mapInstance.current = map;
      setMapLoaded(true);
    };

    if (window.L) {
      startLeafletMap();
    } else {
      script.addEventListener("load", startLeafletMap);
    }

    return () => {
      // Map cleanup
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [lat, lng, propertyTitle, vicinityData]);

  return (
    <div className="map-view-wrapper">
      <div ref={mapRef} className="leaflet-map-node" />
      
      {!mapLoaded && (
        <div className="map-fallback-overlay">
          LOADING GEOGRAPHIC SATELLITE...
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

        .leaflet-map-node {
          width: 100%;
          height: 100%;
          z-index: 1;
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

        /* Marker Styles */
        .custom-leaflet-marker {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .custom-leaflet-marker.property {
          position: relative;
        }

        .marker-outer-pulse {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 1px solid #c8a96e;
          animation: leafletPulse 2s ease-out infinite;
        }

        .marker-inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #c8a96e;
          box-shadow: 0 0 10px #c8a96e;
        }

        @keyframes leafletPulse {
          0% {
            transform: scale(0.5);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .custom-leaflet-marker.amenity .amenity-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8a8a8a;
          border: 1px solid #1a1a1a;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          transition: all 0.2s ease;
        }

        .custom-leaflet-marker.amenity:hover .amenity-dot {
          background: #c8a96e;
          transform: scale(1.5);
          box-shadow: 0 0 8px #c8a96e;
        }

        /* Custom Popup Styles to match Dark Mode */
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #121212 !important;
          color: #f0ede8 !important;
          border: 0.5px solid #2d2a24 !important;
          border-radius: 4px !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          font-size: 11px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
        }

        .custom-leaflet-popup .leaflet-popup-tip {
          background: #121212 !important;
          border-left: 0.5px solid #2d2a24 !important;
          border-bottom: 0.5px solid #2d2a24 !important;
        }

        /* Zoom Control customization */
        .leaflet-bar {
          border: 0.5px solid #262626 !important;
          box-shadow: none !important;
        }

        .leaflet-bar a {
          background-color: #121212 !important;
          color: #8a8a8a !important;
          border-bottom: 0.5px solid #262626 !important;
          transition: all 0.2s ease;
        }

        .leaflet-bar a:hover {
          background-color: #1a1a1a !important;
          color: #c8a96e !important;
        }
      `}</style>
    </div>
  );
}
