"use client";

import { useEffect, useRef, useState } from "react";

export default function InteractiveMap({ lat, lng, propertyTitle, vicinityData = [], routeDestination = "", routeDestCoords = null, routeLabel = "", mapboxToken = "" }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const hoveredRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredAmenity, setHoveredAmenity] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);


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
        attributionControl: false,
        scrollWheelZoom: false,
        dragging: !window.L.Browser.mobile // prevents swiping from moving map on mobile
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

      const mainPopup = document.createElement('div');
      const mainTitle = document.createElement('strong');
      mainTitle.style.color = '#E8AE3C';
      mainTitle.textContent = propertyTitle || "ScoutIt Property";
      const mainSub = document.createElement('span');
      mainSub.style.color = '#c8c8c8';
      mainSub.textContent = 'Target Location';
      mainPopup.appendChild(mainTitle);
      mainPopup.appendChild(document.createElement('br'));
      mainPopup.appendChild(mainSub);

      // Add Main Property Marker
      window.L.marker(position, { icon: mainPropertyIcon })
        .addTo(map)
        .bindPopup(mainPopup, {
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

        const marker = window.L.marker(itemPosition, { icon: amenityIcon })
          .addTo(map);

        const amenityPopup = document.createElement('div');
        const amenityTitle = document.createElement('strong');
        amenityTitle.textContent = item.name;
        const amenitySub = document.createElement('span');
        amenitySub.style.color = '#c8c8c8';
        amenitySub.innerHTML = `${item.category.replace(/</g, '&lt;')} &middot; ${item.distance.replace(/</g, '&lt;')}`;
        amenityPopup.appendChild(amenityTitle);
        amenityPopup.appendChild(document.createElement('br'));
        amenityPopup.appendChild(amenitySub);

        // Bind custom popup & mouseover HUD trigger
        marker.bindPopup(amenityPopup, {
          className: "custom-leaflet-popup"
        });

        marker.on("mouseover", () => {
          const data = {
            id: index,
            name: item.name,
            category: item.category,
            distance: item.distance,
            latlng: itemPosition
          };
          hoveredRef.current = data;
          setHoveredAmenity(data);
          updatePositions();
        });

        marker.on("mouseout", () => {
          hoveredRef.current = null;
          setHoveredAmenity(null);
          updatePositions();
        });
      });

      // ── Optional: Mapbox Directions gold route line ──
      // Uses explicit destination coordinates when provided (reliable),
      // otherwise falls back to geocoding the destination name.
      if ((routeDestCoords || routeDestination) && mapboxToken) {
        (async () => {
          try {
            let destLat, destLng;
            if (Array.isArray(routeDestCoords) && routeDestCoords.length === 2) {
              [destLat, destLng] = routeDestCoords;
            } else {
              // Geocode the destination name, biased to the property's vicinity (PH only)
              const geoUrl =
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(routeDestination)}.json` +
                `?proximity=${position[1]},${position[0]}&country=ph&limit=1&access_token=${mapboxToken}`;
              const geoRes = await fetch(geoUrl);
              const geoData = await geoRes.json();
              if (!geoData.features || geoData.features.length === 0) return;
              [destLng, destLat] = geoData.features[0].center;
            }
            // Prefer the caller-supplied display label
            const destName = routeLabel || routeDestination || "Nearest transit hub";

            // 2. Driving directions FROM the transit hub TO the property
            //    (this map answers "how do I get to this property?")
            const dirUrl =
              `https://api.mapbox.com/directions/v5/mapbox/driving/` +
              `${destLng},${destLat};${position[1]},${position[0]}` +
              `?geometries=geojson&overview=full&access_token=${mapboxToken}`;
            const dirRes = await fetch(dirUrl);
            const dirData = await dirRes.json();
            if (!dirData.routes || dirData.routes.length === 0) return;
            const route = dirData.routes[0];
            const latlngs = route.geometry.coordinates.map((c) => [c[1], c[0]]);

            if (!mapInstance.current) return;

            // 3. Draw the gold route polyline
            const routeLine = window.L.polyline(latlngs, {
              color: "#E8AE3C",
              weight: 3,
              opacity: 0.9,
              lineJoin: "round",
              lineCap: "round",
            }).addTo(map);
            routeLayerRef.current = routeLine;

            // 4. Origin marker at the transit hub (where the journey begins)
            const originIcon = window.L.divIcon({
              className: "custom-leaflet-marker amenity",
              html: `<div class="route-origin-dot"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            });
            const routePopup = document.createElement('div');
            const routeTitle = document.createElement('strong');
            routeTitle.style.color = '#E8AE3C';
            routeTitle.textContent = destName;
            const routeSub = document.createElement('span');
            routeSub.style.color = '#c8c8c8';
            routeSub.textContent = 'Transit hub · route start';
            routePopup.appendChild(routeTitle);
            routePopup.appendChild(document.createElement('br'));
            routePopup.appendChild(routeSub);

            window.L.marker([destLat, destLng], { icon: originIcon })
              .addTo(map)
              .bindPopup(routePopup, { className: "custom-leaflet-popup" });

            // 5. Frame both endpoints
            map.fitBounds(routeLine.getBounds(), { padding: [55, 55], maxZoom: 15 });
            setTimeout(updatePositions, 120);

            // 6. Surface the real travel time
            setRouteInfo({
              destName,
              minutes: Math.max(1, Math.round(route.duration / 60)),
              km: (route.distance / 1000).toFixed(1),
            });
          } catch {
            /* network/geocode failure → no route line, map still renders */
          }
        })();
      }

      // Update HUD Overlay positioning dynamically on Map Movement
      const updatePositions = () => {
        if (!mapInstance.current) return;
        try {
          const pPoint = map.latLngToContainerPoint(position);
          
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
            const tPoint = map.latLngToContainerPoint(hoveredRef.current.latlng);
            if (ll) {
              ll.setAttribute('x1', pPoint.x); ll.setAttribute('y1', pPoint.y);
              ll.setAttribute('x2', tPoint.x); ll.setAttribute('y2', tPoint.y);
            }
            if (lr) {
              lr.setAttribute('cx', tPoint.x); lr.setAttribute('cy', tPoint.y);
            }
          }
        } catch (e) {
          // Ignore Leaflet not being fully initialized (e.g. _leaflet_pos undefined)
        }
      };

      // Recompute size after a visibility/size change and re-frame the view
      // so the property stays centered (fixes maps that mount while hidden).
      const recenter = () => {
        if (!mapInstance.current) return;
        try {
          mapInstance.current.invalidateSize();
          if (routeLayerRef.current) {
            mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [55, 55], maxZoom: 15 });
          } else {
            mapInstance.current.setView(position, mapInstance.current.getZoom() || 15);
          }
          updatePositions();
        } catch (e) {
          // Prevent Leaflet errors during ResizeObserver events from creating infinite loops
        }
      };

      // Set initial positions
      map.whenReady(() => {
        setTimeout(updatePositions, 100);
      });

      map.on("move", updatePositions);
      map.on("zoomend", updatePositions);
      map.on("resize", updatePositions);

      mapInstance.current = map;
      setMapLoaded(true);

      // Re-center a few times after mount to catch late layout/visibility settling
      [150, 400, 900].forEach((ms) => setTimeout(recenter, ms));

      // Set up ResizeObserver to handle tab changes or visibility switches cleanly
      if (typeof window !== "undefined" && window.ResizeObserver) {
        resizeObserver = new window.ResizeObserver(() => {
          if (mapInstance.current) {
            // Slight delay allows CSS transitions/layouts to settle
            setTimeout(recenter, 100);
          }
        });
        if (mapRef.current) {
          resizeObserver.observe(mapRef.current);
        }
      }
    };

    let resizeObserver;

    if (window.L) {
      startLeafletMap();
    } else {
      script.addEventListener("load", startLeafletMap);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      // Map cleanup
      if (mapInstance.current) {
        mapInstance.current.off("move");
        mapInstance.current.off("zoomend");
        mapInstance.current.off("resize");
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // We use JSON.stringify for arrays/objects to prevent reference-equality React loops 
    // that destroy and recreate the Leaflet map unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, propertyTitle, JSON.stringify(vicinityData), routeDestination, JSON.stringify(routeDestCoords), routeLabel, mapboxToken]);

  const sweepLength = 150; // Sweeps up to outer ring radius

  return (
    <div className="map-view-wrapper">
      <div ref={mapRef} className="leaflet-map-node" />
      
      {/* 100% Free Transparent HUD Overlay (Blocks no pointer clicks) */}
      {mapLoaded && (
        <svg className="hud-radar-svg-overlay">
          {/* Concentric rings centered on property pin */}
          <circle id="radar-ring-1" cx="0" cy="0" r="50" className="leaflet-radar-ring" />
          <circle id="radar-ring-2" cx="0" cy="0" r="100" className="leaflet-radar-ring" />
          <circle id="radar-ring-3" cx="0" cy="0" r="150" className="leaflet-radar-ring" />
          <circle id="radar-ring-4" cx="0" cy="0" r="150" className="leaflet-radar-ring outer" strokeDasharray="1 3" />

          {/* Sweeper sweep line */}
          <line 
            id="radar-sweep"
            x1="0" 
            y1="0" 
            x2="0" 
            y2="-150" 
            className="leaflet-radar-sweep animated" 
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
                className="leaflet-radar-lock-line"
              />
              <circle
                id="radar-lock-ring"
                cx="0"
                cy="0"
                r="10"
                className="leaflet-radar-lock-ring"
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

        .leaflet-map-node {
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
          pointer-events: none; /* Passes all clicks directly to Leaflet Map underlying */
          overflow: visible;
        }

        .leaflet-radar-ring {
          fill: none;
          stroke: rgba(232, 174, 60, 0.12);
          stroke-width: 0.5;
        }

        .leaflet-radar-ring.outer {
          stroke: rgba(232, 174, 60, 0.22);
          stroke-width: 0.6;
        }

        .leaflet-radar-sweep {
          stroke: rgba(232, 174, 60, 0.25);
          stroke-width: 0.6;
        }

        .leaflet-radar-sweep.animated {
          animation: radarSweep 3s linear infinite;
        }

        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .leaflet-radar-lock-line {
          stroke: #E8AE3C;
          stroke-width: 0.75;
          stroke-dasharray: 2 2;
        }

        .leaflet-radar-lock-ring {
          fill: none;
          stroke: #E8AE3C;
          stroke-width: 0.5;
          animation: leafletLockPulse 1.2s ease-out infinite;
          transform-origin: center;
        }

        @keyframes leafletLockPulse {
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
          color: #E8AE3C;
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
          font-size: 11px;
          color: #E8AE3C;
          font-weight: 600;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }
        .map-route-label .route-dest {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          color: #f0ede8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .map-route-label .route-km {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #c8c8c8;
          white-space: nowrap;
        }

        /* Marker Pin adjustments */
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
          border: 1px solid #E8AE3C;
          animation: leafletPulse 2s ease-out infinite;
        }

        .marker-inner-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #E8AE3C;
          box-shadow: 0 0 10px #E8AE3C;
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
          background: #c8c8c8;
          border: 1px solid #1a1a1a;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
          transition: all 0.2s ease;
        }

        /* Route origin (transit hub) — gold ring marking where the journey starts */
        .custom-leaflet-marker .route-origin-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #0e0e0e;
          border: 2px solid #E8AE3C;
          box-shadow: 0 0 8px rgba(232, 174, 60, 0.7);
        }

        .custom-leaflet-marker.amenity:hover .amenity-dot {
          background: #E8AE3C;
          transform: scale(1.5);
          box-shadow: 0 0 8px #E8AE3C;
        }

        /* Custom Popup Styles */
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

        .leaflet-bar {
          border: 0.5px solid #262626 !important;
          box-shadow: none !important;
        }

        .leaflet-bar a {
          background-color: #121212 !important;
          color: #c8c8c8 !important;
          border-bottom: 0.5px solid #262626 !important;
          transition: all 0.2s ease;
        }

        .leaflet-bar a:hover {
          background-color: #1a1a1a !important;
          color: #E8AE3C !important;
        }
      `}</style>
    </div>
  );
}
