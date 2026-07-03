/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';

// Free, open-licensed UP NOAH flood hazard data (100-year return period), self-served as
// cloud-optimized vector tiles via HTTP range requests - no full-file download needed.
// Source: huggingface.co/datasets/bettergovph/project-noah-hazard-maps
const FLOOD_PMTILES_URL = 'pmtiles://https://huggingface.co/datasets/bettergovph/project-noah-hazard-maps/resolve/main/PMTiles/layers/flood_100yr.pmtiles';
const FLOOD_SOURCE_LAYER = 'flood_100yr';

// NOAH's own Low/Medium/High hazard classification (Var: 1/2/3).
const HAZARD_LEVELS = [
  { value: 1, label: 'Low', color: '#F2C94C' },
  { value: 2, label: 'Medium', color: '#F2994A' },
  { value: 3, label: 'High', color: '#EB5757' },
];

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (protocolRegistered) return;
  const protocol = new Protocol();
  maplibregl.addProtocol('pmtiles', protocol.tile);
  protocolRegistered = true;
}

export default function FloodHeatmapMap({ lat, lng, propertyTitle }) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current || lat == null || lng == null) return;

    ensurePmtilesProtocol();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [lng, lat],
      zoom: 13,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      try {
        map.addSource('flood-hazard', {
          type: 'vector',
          url: FLOOD_PMTILES_URL,
        });

        map.addLayer({
          id: 'flood-hazard-fill',
          type: 'fill',
          source: 'flood-hazard',
          'source-layer': FLOOD_SOURCE_LAYER,
          paint: {
            'fill-color': [
              'match', ['get', 'Var'],
              1, HAZARD_LEVELS[0].color,
              2, HAZARD_LEVELS[1].color,
              3, HAZARD_LEVELS[2].color,
              '#666666',
            ],
            'fill-opacity': 0.5,
          },
        });

        new maplibregl.Marker({ color: '#E8AE3C' })
          .setLngLat([lng, lat])
          .addTo(map);

        setLoadState('ready');
      } catch (err) {
        console.error('[FloodHeatmapMap] Failed to add hazard layer:', err);
        setLoadState('error');
      }
    });

    map.on('error', (e) => {
      console.error('[FloodHeatmapMap] Map error:', e?.error);
    });

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, [lat, lng]);

  if (lat == null || lng == null) return null;

  return (
    <div className="flood-heatmap-wrapper">
      <div ref={mapContainerRef} className="flood-heatmap-container" />

      {loadState === 'loading' && (
        <div className="flood-heatmap-status">Loading hazard data…</div>
      )}
      {loadState === 'error' && (
        <div className="flood-heatmap-status flood-heatmap-status-error">
          Flood hazard layer unavailable right now.
        </div>
      )}

      <div className="flood-heatmap-legend">
        <div className="flood-heatmap-legend-title">100-Year Flood Hazard</div>
        {HAZARD_LEVELS.map((level) => (
          <div className="flood-heatmap-legend-row" key={level.value}>
            <span className="flood-heatmap-legend-swatch" style={{ background: level.color }} />
            <span>{level.label}</span>
          </div>
        ))}
      </div>

      <div className="flood-heatmap-disclaimer">
        Source: UP NOAH (open data). Historical hazard modeling, periodically refreshed — not a
        real-time flood forecast.
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .flood-heatmap-wrapper {
          width: 100%;
          height: clamp(360px, 48vh, 440px);
          flex-shrink: 0;
          position: relative;
          border: 0.5px solid #262626;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .flood-heatmap-container {
          width: 100%;
          height: clamp(360px, 48vh, 440px);
          background: #000;
        }
        .flood-heatmap-status {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(13,13,13,0.85);
          backdrop-filter: blur(8px);
          border: 0.5px solid #262626;
          border-radius: 4px;
          padding: 6px 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #c8c8c8;
        }
        .flood-heatmap-status-error { color: #EB5757; }
        .flood-heatmap-legend {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: rgba(13,13,13,0.85);
          backdrop-filter: blur(8px);
          border: 0.5px solid #262626;
          border-radius: 4px;
          padding: 10px 14px;
          z-index: 5;
        }
        .flood-heatmap-legend-title {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c8c8c8;
          margin-bottom: 8px;
        }
        .flood-heatmap-legend-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: Georgia, serif;
          font-size: 12px;
          color: #f0ede8;
          margin-bottom: 4px;
        }
        .flood-heatmap-legend-row:last-child { margin-bottom: 0; }
        .flood-heatmap-legend-swatch {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          flex-shrink: 0;
        }
        .flood-heatmap-disclaimer {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.04em;
          color: #6a6a6a;
          line-height: 1.5;
          padding: 8px 2px 0;
        }
      `}} />
    </div>
  );
}
