/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Math function to draw a geographical circle without Turf.js
const createGeoJSONCircle = (center, radiusInKm, points = 64) => {
  const coords = { latitude: center[1], longitude: center[0] };
  const ret = [];
  const distanceX = radiusInKm / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
  const distanceY = radiusInKm / 110.574;
  for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      ret.push([coords.longitude + x, coords.latitude + y]);
  }
  ret.push(ret[0]);
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [ret] } };
};

export default function InteractiveRadiusMap({ onSearch, onClose, initialLng = 121.0215, initialLat = 14.5547 }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  
  const [radiusMiles, setRadiusMiles] = useState(5); // Default 5 miles
  const [center, setCenter] = useState([initialLng, initialLat]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Initialize Mapbox
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: 11,
      pitch: 45
    });

    map.on('load', () => {
      // Add Circle Source
      map.addSource('radius-circle', {
        type: 'geojson',
        data: createGeoJSONCircle(center, radiusMiles * 1.60934) // Convert miles to km for math
      });

      // Add Circle Layer (Fill)
      map.addLayer({
        id: 'radius-circle-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: {
          'fill-color': '#ffb800',
          'fill-opacity': 0.15
        }
      });

      // Add Circle Layer (Outline)
      map.addLayer({
        id: 'radius-circle-outline',
        type: 'line',
        source: 'radius-circle',
        paint: {
          'line-color': '#ffb800',
          'line-width': 2,
          'line-dasharray': [2, 2]
        }
      });

      // Create draggable center marker
      const el = document.createElement('div');
      el.className = 'custom-map-center-pin';
      el.innerHTML = '<div class="pin-dot"></div><div class="pin-pulse"></div>';
      
      const marker = new mapboxgl.Marker({ element: el, draggable: true })
        .setLngLat(center)
        .addTo(map);

      // Handle marker drag
      marker.on('dragend', () => {
        const lngLat = marker.getLngLat();
        setCenter([lngLat.lng, lngLat.lat]);
      });

      // Handle map click to move marker
      map.on('click', (e) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        setCenter([e.lngLat.lng, e.lngLat.lat]);
      });

      markerInstance.current = marker;
      setMapLoaded(true);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [MAPBOX_TOKEN]);

  // Update circle visually when radius or center changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return;
    
    // Update map circle
    const radiusKm = radiusMiles * 1.60934;
    const geoJsonData = createGeoJSONCircle(center, radiusKm);
    mapInstance.current.getSource('radius-circle')?.setData(geoJsonData);

  }, [radiusMiles, center, mapLoaded]);

  return (
    <div className="interactive-radius-wrapper">
      <div className="map-header-bar">
        <span>📍 Interactive Proximity Radar</span>
        <button onClick={onClose} className="close-map-btn">✕</button>
      </div>

      <div ref={mapContainerRef} className="mapbox-container" />

      {/* Control Panel Overlay */}
      <div className="map-control-panel">
        <div className="control-row">
          <span className="control-label">Search Radius</span>
          <span className="control-value">{radiusMiles} Miles ({(radiusMiles * 1.609).toFixed(1)} km)</span>
        </div>
        
        <input 
          type="range" 
          min="1" 
          max="50" 
          step="1"
          value={radiusMiles} 
          onChange={(e) => setRadiusMiles(parseInt(e.target.value))}
          className="radius-slider"
        />
        
        <div className="control-hint">
          Click anywhere on the map or drag the pin to set a new epicenter.
        </div>
        
        <button className="confirm-radar-btn" onClick={() => {
          onSearch(radiusMiles * 1.60934, center[0], center[1]);
          onClose();
        }}>
          CONFIRM RADAR SEARCH
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .interactive-radius-wrapper {
          width: 100%;
          height: 400px;
          position: relative;
          border: 1px solid #262626;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 24px;
          animation: slideDown 0.4s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .map-header-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 40px;
          background: rgba(13,13,13,0.85);
          backdrop-filter: blur(8px);
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 16px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #ffb800;
          border-bottom: 1px solid #262626;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .close-map-btn {
          background: none;
          border: none;
          color: #c8c8c8;
          font-size: 16px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-map-btn:hover { color: #f0ede8; }
        .mapbox-container {
          width: 100%;
          height: 100%;
          background: #000;
        }
        .map-control-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          width: 280px;
          background: rgba(18,18,18,0.9);
          backdrop-filter: blur(12px);
          border: 1px solid #2d2a24;
          border-radius: 6px;
          padding: 16px;
          z-index: 10;
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        }
        .control-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .control-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #c8c8c8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .control-value {
          font-family: var(--font-mono);
          font-size: 10px;
          color: #ffb800;
          font-weight: bold;
        }
        .radius-slider {
          width: 100%;
          appearance: none;
          background: #262626;
          height: 4px;
          border-radius: 2px;
          outline: none;
          margin-bottom: 12px;
        }
        .radius-slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffb800;
          cursor: pointer;
          border: 2px solid #1a1a1a;
        }
        .control-hint {
          font-size: 10px;
          color: #6a6a6a;
          line-height: 1.4;
          border-top: 1px dashed #262626;
          padding-top: 8px;
        }
        .custom-map-center-pin {
          width: 24px;
          height: 24px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: grab;
        }
        .custom-map-center-pin:active { cursor: grabbing; }
        .pin-dot {
          width: 10px;
          height: 10px;
          background: #ffb800;
          border-radius: 50%;
          border: 2px solid #000;
          z-index: 2;
        }
        .pin-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #ffb800;
          border-radius: 50%;
          opacity: 0.4;
          animation: mapPinPulse 1.5s infinite;
        }
        @keyframes mapPinPulse {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .confirm-radar-btn {
          width: 100%;
          margin-top: 16px;
          background: #ffb800;
          color: #000;
          border: none;
          padding: 12px 0;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border-radius: 4px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .confirm-radar-btn:hover { background: #d8ba7d; }
      `}} />
    </div>
  );
}
