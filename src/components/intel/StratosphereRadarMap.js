"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function StratosphereRadarMap({
  currentSignal,
  affectedSpaces = [],
  hoveredPropertyId = null,
  onSelectProperty = () => {}
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const signalMarkerRef = useRef(null);
  const propertyMarkersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  // Initialize MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [121.0244, 14.5547],
        zoom: 14.2,
        pitch: 42,
        bearing: -12,
        attributionControl: false,
        interactive: true,
        scrollZoom: false,
        dragRotate: false
      });

      map.on("load", () => {
        setMapLoaded(true);
      });

      map.on("error", () => {
        setMapError(true);
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.warn("MapLibre init error in StratosphereRadarMap:", err);
      setMapError(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const onSelectPropertyRef = useRef(onSelectProperty);

  useEffect(() => {
    onSelectPropertyRef.current = onSelectProperty;
  }, [onSelectProperty]);

  // Update camera and drop pins when active signal changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentSignal || !mapLoaded) return;

    const lng = currentSignal.coords?.lng || 121.0244;
    const lat = currentSignal.coords?.lat || 14.5547;

    // Smooth camera fly-to
    map.flyTo({
      center: [lng, lat],
      zoom: 14.4,
      pitch: 42,
      bearing: -10,
      duration: 1400,
      essential: true
    });

    // 1. Remove previous signal marker
    if (signalMarkerRef.current) {
      signalMarkerRef.current.remove();
      signalMarkerRef.current = null;
    }

    // 2. Create Animated Signal Beacon Pin Element
    const el = document.createElement("div");
    el.className = "signal-pin-wrapper";
    el.innerHTML = `
      <div class="signal-pin-core">
        <div class="signal-beacon-ring"></div>
        <div class="signal-beacon-ring ring-2"></div>
        <div class="signal-pin-head"></div>
        <div class="signal-pin-pulse"></div>
      </div>
      <div class="signal-pin-label">${currentSignal.category} SIGNAL</div>
    `;

    signalMarkerRef.current = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map);

    // 3. Clear and render Property Markers
    propertyMarkersRef.current.forEach(m => m.remove());
    propertyMarkersRef.current = [];

    affectedSpaces.forEach((prop, i) => {
      // Approximate coordinate offset around signal if specific coords not in object
      const propLng = prop.coords?.lng || (lng + (i === 0 ? 0.0025 : i === 1 ? -0.003 : 0.004));
      const propLat = prop.coords?.lat || (lat + (i === 0 ? -0.002 : i === 1 ? 0.0035 : 0.002));

      const propEl = document.createElement("div");
      propEl.className = `property-pin-wrapper ${hoveredPropertyId === prop.id ? "is-hovered" : ""}`;
      propEl.innerHTML = `
        <div class="property-pin-dot"></div>
        <div class="property-pin-callout">${prop.title}</div>
      `;

      propEl.addEventListener("click", () => {
        onSelectPropertyRef.current?.(prop);
      });

      const propMarker = new maplibregl.Marker({ element: propEl, anchor: "center" })
        .setLngLat([propLng, propLat])
        .addTo(map);

      propertyMarkersRef.current.push(propMarker);
    });
  }, [currentSignal, affectedSpaces, mapLoaded, hoveredPropertyId]);

  // Update hover state on property pins
  useEffect(() => {
    propertyMarkersRef.current.forEach((marker, i) => {
      const prop = affectedSpaces[i];
      const el = marker.getElement();
      if (!el || !prop) return;
      if (hoveredPropertyId === prop.id) {
        el.classList.add("is-hovered");
      } else {
        el.classList.remove("is-hovered");
      }
    });
  }, [hoveredPropertyId, affectedSpaces]);

  if (mapError) {
    // Graceful fallback to tactical coordinate reticle
    return (
      <div className="radar-fallback-deck">
        <div className="radar-fallback-grid" />
        <div className="radar-fallback-reticle">
          <span className="text-gold font-mono text-[12px]">
            {currentSignal?.coords?.lat?.toFixed(4)}°N, {currentSignal?.coords?.lng?.toFixed(4)}°E
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="stratosphere-map-root">
      <div ref={mapContainerRef} className="stratosphere-map-canvas" />

      {/* Top Left Coordinate Telemetry Box */}
      <div className="map-telemetry-badge">
        <span className="telemetry-dot" />
        <span className="telemetry-coords">
          {currentSignal?.coords?.lat?.toFixed(4)}°N, {currentSignal?.coords?.lng?.toFixed(4)}°E
        </span>
      </div>

      {/* Bottom Map Legend */}
      <div className="map-legend-overlay">
        <span className="legend-chip"><span className="chip-dot is-signal" /> EVENT PIN</span>
        <span className="legend-chip"><span className="chip-dot is-prop" /> LINKED SPACE</span>
      </div>

      <style jsx global>{`
        .stratosphere-map-root {
          position: relative;
          width: 100%;
          height: 220px;
          background: #09090b;
          overflow: hidden;
          border-radius: 8px;
        }

        .stratosphere-map-canvas {
          width: 100%;
          height: 100%;
        }

        /* ── ANIMATED SIGNAL BEACON PIN ── */
        .signal-pin-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          pointer-events: auto;
          z-index: 10;
        }

        .signal-pin-core {
          width: 14px;
          height: 14px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .signal-pin-head {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 10px var(--accent-bright), 0 0 20px var(--accent);
          z-index: 2;
        }

        .signal-beacon-ring {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid var(--accent);
          opacity: 0.8;
          animation: beaconWave 2s infinite ease-out;
        }

        .signal-beacon-ring.ring-2 {
          animation-delay: 0.7s;
        }

        @keyframes beaconWave {
          0% { transform: scale(0.3); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .signal-pin-label {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent-bright);
          background: rgba(13, 13, 16, 0.9);
          border: 1px solid rgba(232, 174, 60, 0.35);
          padding: 1px 5px;
          border-radius: 2px;
          letter-spacing: 0.1em;
          white-space: nowrap;
          text-transform: uppercase;
        }

        /* ── PROPERTY PINS ── */
        .property-pin-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
          z-index: 5;
        }

        .property-pin-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f0ede8;
          border: 1.5px solid var(--accent);
          box-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
          transition: all 0.2s ease;
        }

        .property-pin-callout {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: #c8c6be;
          background: rgba(18, 18, 22, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1px 4px;
          border-radius: 2px;
          white-space: nowrap;
          display: none;
        }

        .property-pin-wrapper:hover .property-pin-callout,
        .property-pin-wrapper.is-hovered .property-pin-callout {
          display: block;
        }

        .property-pin-wrapper.is-hovered .property-pin-dot {
          background: var(--accent-bright);
          transform: scale(1.5);
          box-shadow: 0 0 10px var(--accent-bright);
        }

        /* ── MAP OVERLAYS ── */
        .map-telemetry-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(13, 13, 16, 0.85);
          border: 1px solid rgba(232, 174, 60, 0.25);
          padding: 3px 7px;
          border-radius: 3px;
          z-index: 2;
          pointer-events: none;
        }

        .telemetry-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 6px var(--accent);
        }

        .telemetry-coords {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent);
        }

        .map-legend-overlay {
          position: absolute;
          bottom: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          background: rgba(13, 13, 16, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 3px 7px;
          border-radius: 3px;
          z-index: 2;
          pointer-events: none;
        }

        .legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          letter-spacing: 0.08em;
        }

        .chip-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
        }
        .chip-dot.is-signal { background: var(--accent-bright); }
        .chip-dot.is-prop { background: #f0ede8; }

        .radar-fallback-deck {
          width: 100%;
          height: 220px;
          background: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .radar-fallback-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
}
