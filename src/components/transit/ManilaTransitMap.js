"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  point as turfPoint,
  lineString,
  length as turfLength,
  along as turfAlong,
  lineSliceAlong as turfLineSliceAlong,
  bbox as turfBbox,
  center as turfCenter,
  distance as turfDistance,
} from "@turf/turf";
import manilaTransit from "@/data/manila_transit.json";
import manilaStations from "@/data/manila_transit_stations.json";

// Real-world track geometry sourced from OpenStreetMap route relations
// (LRT Line 1, LRT Line 2, MRT Line 3) — see src/data/manila_transit.json.
// trainCount/speedKmh are rendering choices, not source data — MRT-3 runs the
// most frequent service of the three in real life, so it gets the most trains.
const LINE_META = manilaTransit.features.map((f) => {
  const counts = { lrt1: 4, lrt2: 3, mrt3: 5 };
  const speeds = { lrt1: 45, lrt2: 40, mrt3: 50 };
  return {
    id: f.properties.id,
    name: f.properties.name,
    color: f.properties.color,
    trainCount: counts[f.properties.id] || 4,
    speedKmh: speeds[f.properties.id] || 45,
  };
});

const SOURCE_ID = "manila-transit-lines";
const TRAIL_KM = 0.9; // how far behind the train the moving-light trail extends
const PROPERTY_MARKER_SOURCE = "property-pin";
const PROPERTY_CONNECTOR_SOURCE = "property-connector";
// Beyond this, "nearest station" stops being a useful commute signal — the
// property just isn't served by rail, so skip the connector line and say so.
const MAX_RELEVANT_KM = 15;

// Every real station across all three lines, flattened once, for nearest-station lookups.
const ALL_STATIONS = LINE_META.flatMap((line) =>
  (manilaStations[line.id] || []).map((s) => ({ ...s, lineId: line.id, lineName: line.name, lineColor: line.color }))
);

function nearestStationTo(lat, lng) {
  const propertyPoint = turfPoint([lng, lat]);
  let best = null;
  ALL_STATIONS.forEach((s) => {
    const d = turfDistance(propertyPoint, turfPoint([s.lon, s.lat]), { units: "kilometers" });
    if (!best || d < best.distanceKm) {
      best = { name: s.name, lineName: s.lineName, lineColor: s.lineColor, lon: s.lon, lat: s.lat, distanceKm: d };
    }
  });
  return best;
}

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Builds the trailing "light" segment behind a train's current position,
// always ordered tail (oldest/dimmest) -> head (current/brightest) so the
// line-gradient's progress 0->1 reads correctly regardless of travel direction.
function trailFeature(track, totalKm, distanceKm, direction) {
  const a = direction === "forward" ? Math.max(0, distanceKm - TRAIL_KM) : distanceKm;
  const b = direction === "forward" ? distanceKm : Math.min(totalKm, distanceKm + TRAIL_KM);
  const from = Math.min(a, b);
  const to = Math.max(a, b, from + 0.001); // guard against a zero-length slice at either end
  const sliced = turfLineSliceAlong(track, from, to, { units: "kilometers" });
  if (direction === "backward") sliced.geometry.coordinates.reverse();
  return sliced;
}

function layerIdsForLine(line) {
  const ids = [`${line.id}-outer`, `${line.id}-glow`, `${line.id}-core`, `${line.id}-stations-circle`, `${line.id}-stations-label`];
  for (let i = 0; i < line.trainCount; i++) {
    ids.push(`${line.id}-trail-${i}`, `${line.id}-train-${i}`);
  }
  return ids;
}

export default function ManilaTransitMap({ propertyLat, propertyLng, propertyTitle } = {}) {
  const mapContainerRef = useRef(null);
  const mapInstance = useRef(null);
  const propertyMarkerRef = useRef(null);
  const rafRef = useRef(null);
  const lineDataRef = useRef({}); // id -> { track, totalKm }
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [visibleLines, setVisibleLines] = useState(
    () => Object.fromEntries(LINE_META.map((l) => [l.id, true]))
  );
  const visibleLinesRef = useRef(visibleLines);
  visibleLinesRef.current = visibleLines;

  const hasProperty = typeof propertyLat === "number" && typeof propertyLng === "number";
  const [nearestStation, setNearestStation] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    if (!token) {
      setLoadState("error");
      return;
    }
    mapboxgl.accessToken = token;

    // Frame all three lines instead of guessing a center — accurate to
    // whatever the real OSM geometry actually covers.
    const combined = {
      type: "FeatureCollection",
      features: manilaTransit.features,
    };
    const [minLng, minLat, maxLng, maxLat] = turfBbox(combined);
    const { geometry: { coordinates: centerCoords } } = turfCenter(combined);

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: centerCoords,
      zoom: 11,
      pitch: 60,
      antialias: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");

    map.on("load", () => {
      try {
        if (!hasProperty) {
          map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, pitch: 60, duration: 0 });
        }

        map.addSource(SOURCE_ID, { type: "geojson", data: combined });

        LINE_META.forEach((line) => {
          const filter = ["==", ["get", "id"], line.id];

          // ── Neon stack: soft wide halo -> tinted glow -> bright white core ──
          map.addLayer({
            id: `${line.id}-outer`,
            type: "line",
            source: SOURCE_ID,
            filter,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": line.color,
              "line-width": 22,
              "line-blur": 16,
              "line-opacity": 0.28,
            },
          });

          map.addLayer({
            id: `${line.id}-glow`,
            type: "line",
            source: SOURCE_ID,
            filter,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": line.color,
              "line-width": 9,
              "line-blur": 5,
              "line-opacity": 0.7,
            },
          });

          map.addLayer({
            id: `${line.id}-core`,
            type: "line",
            source: SOURCE_ID,
            filter,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": "#FFFFFF",
              "line-width": 2.2,
              "line-blur": 0,
              "line-opacity": 1,
            },
          });

          // ── Real stations for this line — static markers + labels ──
          const stations = manilaStations[line.id] || [];
          map.addSource(`${line.id}-stations`, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: stations.map((s) => ({
                type: "Feature",
                properties: { name: s.name },
                geometry: { type: "Point", coordinates: [s.lon, s.lat] },
              })),
            },
          });

          map.addLayer({
            id: `${line.id}-stations-circle`,
            type: "circle",
            source: `${line.id}-stations`,
            paint: {
              "circle-radius": 4,
              "circle-color": "#0d0d0d",
              "circle-stroke-width": 2,
              "circle-stroke-color": "#FFFFFF",
              "circle-opacity": 0.9,
            },
          });

          map.addLayer({
            id: `${line.id}-stations-label`,
            type: "symbol",
            source: `${line.id}-stations`,
            minzoom: 12,
            layout: {
              "text-field": ["get", "name"],
              "text-size": 11,
              "text-offset": [0, 1.1],
              "text-anchor": "top",
              "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            },
            paint: {
              "text-color": "#f0ede8",
              "text-halo-color": "#0d0d0d",
              "text-halo-width": 1.4,
            },
          });

          // ── Trains + their moving-light trails ──
          const feature = manilaTransit.features.find((f) => f.properties.id === line.id);
          const track = lineString(feature.geometry.coordinates);
          const totalKm = turfLength(track, { units: "kilometers" });
          lineDataRef.current[line.id] = { track, totalKm };

          for (let i = 0; i < line.trainCount; i++) {
            const startKm = (i / line.trainCount) * totalKm;

            map.addSource(`${line.id}-trail-${i}`, {
              type: "geojson",
              lineMetrics: true,
              data: trailFeature(track, totalKm, startKm, "forward"),
            });
            map.addLayer({
              id: `${line.id}-trail-${i}`,
              type: "line",
              source: `${line.id}-trail-${i}`,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-width": 5,
                "line-blur": 1.5,
                "line-gradient": [
                  "interpolate", ["linear"], ["line-progress"],
                  0, hexToRgba(line.color, 0),
                  0.7, hexToRgba(line.color, 0.65),
                  1, "#FFFFFF",
                ],
              },
            });

            map.addSource(`${line.id}-train-${i}`, {
              type: "geojson",
              data: turfAlong(track, startKm, { units: "kilometers" }),
            });
            map.addLayer({
              id: `${line.id}-train-${i}`,
              type: "circle",
              source: `${line.id}-train-${i}`,
              paint: {
                "circle-radius": 6,
                "circle-color": "#FFFFFF",
                "circle-opacity": 1,
                "circle-blur": 0.6,
                "circle-stroke-width": 2,
                "circle-stroke-color": line.color,
              },
            });
          }
        });

        // ── Pinpoint the actual property + its closest real station ──
        if (hasProperty) {
          const nearest = nearestStationTo(propertyLat, propertyLng);
          setNearestStation(nearest);

          const el = document.createElement("div");
          el.className = "transit-property-marker";
          el.innerHTML = `<div class="transit-property-marker-pulse"></div><div class="transit-property-marker-dot"></div>`;
          propertyMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat([propertyLng, propertyLat])
            .setPopup(new mapboxgl.Popup({ offset: 16, closeButton: false }).setText(propertyTitle || "This property"))
            .addTo(map);

          const withinCoverage = nearest && nearest.distanceKm <= MAX_RELEVANT_KM;

          if (withinCoverage) {
            map.addSource(PROPERTY_CONNECTOR_SOURCE, {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: [[propertyLng, propertyLat], [nearest.lon, nearest.lat]] },
              },
            });
            map.addLayer({
              id: PROPERTY_CONNECTOR_SOURCE,
              type: "line",
              source: PROPERTY_CONNECTOR_SOURCE,
              layout: { "line-join": "round", "line-cap": "round" },
              paint: {
                "line-color": "#E8AE3C",
                "line-width": 2,
                "line-opacity": 0.85,
                "line-dasharray": [1, 1.6],
              },
            });

            map.fitBounds(
              [[propertyLng, propertyLat], [nearest.lon, nearest.lat]],
              { padding: 90, maxZoom: 15, pitch: 60, duration: 0 }
            );
          } else {
            map.jumpTo({ center: [propertyLng, propertyLat], zoom: 12, pitch: 60 });
          }
        }

        setLoadState("ready");

        // ── Telemetry loop: every train travels back-and-forth along the
        // real track curve, each on its own phase offset and per-line speed ──
        const animate = (t) => {
          LINE_META.forEach((line) => {
            if (!visibleLinesRef.current[line.id]) return;
            const { track, totalKm } = lineDataRef.current[line.id];
            if (!totalKm) return;
            const cycleKm = totalKm * 2;
            const kmPerMs = line.speedKmh / 3600000;

            for (let i = 0; i < line.trainCount; i++) {
              const phaseOffset = (i / line.trainCount) * cycleKm;
              const traveled = (t * kmPerMs + phaseOffset) % cycleKm;
              const direction = traveled <= totalKm ? "forward" : "backward";
              const distanceKm = direction === "forward" ? traveled : cycleKm - traveled;

              const point = turfAlong(track, distanceKm, { units: "kilometers" });
              const trainSrc = map.getSource(`${line.id}-train-${i}`);
              if (trainSrc) trainSrc.setData(point);

              const trailSrc = map.getSource(`${line.id}-trail-${i}`);
              if (trailSrc) trailSrc.setData(trailFeature(track, totalKm, distanceKm, direction));
            }
          });
          rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
      } catch (err) {
        console.error("[ManilaTransitMap] Failed to build layers:", err);
        setLoadState("error");
      }
    });

    map.on("error", (e) => {
      console.error("[ManilaTransitMap] Map error:", e?.error);
    });

    mapInstance.current = map;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (propertyMarkerRef.current) propertyMarkerRef.current.remove();
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLine = (id) => {
    const nextVisible = !visibleLines[id];
    setVisibleLines((prev) => ({ ...prev, [id]: nextVisible }));

    const map = mapInstance.current;
    if (!map) return;
    const line = LINE_META.find((l) => l.id === id);
    const visibility = nextVisible ? "visible" : "none";
    layerIdsForLine(line).forEach((layerId) => {
      if (map.getLayer(layerId)) map.setLayoutProperty(layerId, "visibility", visibility);
    });
  };

  return (
    <div className="transit-map-wrapper">
      <div ref={mapContainerRef} className="transit-map-container" />

      <div className="transit-map-panel">
        <div className="transit-map-panel-title">Metro Manila Rail Network</div>
        {LINE_META.map((line) => (
          <label key={line.id} className="transit-map-toggle">
            <input
              type="checkbox"
              checked={visibleLines[line.id]}
              onChange={() => toggleLine(line.id)}
            />
            <span className="transit-map-swatch" style={{ background: line.color, boxShadow: `0 0 6px ${line.color}` }} />
            <span className="transit-map-toggle-label">{line.name}</span>
          </label>
        ))}
      </div>

      {hasProperty && nearestStation && (
        <div className="transit-map-nearest">
          <div className="transit-map-panel-title">Nearest Rail Station</div>
          {nearestStation.distanceKm <= MAX_RELEVANT_KM ? (
            <>
              <div className="transit-map-nearest-row">
                <span className="transit-map-swatch" style={{ background: nearestStation.lineColor, boxShadow: `0 0 6px ${nearestStation.lineColor}` }} />
                <span className="transit-map-nearest-name">{nearestStation.name}</span>
              </div>
              <div className="transit-map-nearest-sub">{nearestStation.lineName}</div>
              <div className="transit-map-nearest-distance">{nearestStation.distanceKm.toFixed(2)} km away</div>
              <div className="transit-map-nearest-hint">
                {nearestStation.distanceKm <= 0.6
                  ? "Walking distance"
                  : nearestStation.distanceKm <= 2
                  ? "Short tricycle/jeepney ride"
                  : "A quick drive away"}
              </div>
            </>
          ) : (
            <div className="transit-map-nearest-sub">
              Outside current LRT/MRT coverage — closest station ({nearestStation.name}) is {nearestStation.distanceKm.toFixed(1)} km away.
            </div>
          )}
        </div>
      )}

      {loadState === "loading" && (
        <div className="transit-map-status">Loading transit network…</div>
      )}
      {loadState === "error" && (
        <div className="transit-map-status transit-map-status-error">
          Transit map unavailable right now.
        </div>
      )}

      <style jsx global>{`
        .transit-map-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 600px;
          border: 0.5px solid #262626;
          border-radius: 4px;
          overflow: hidden;
          background: #000;
        }
        .transit-map-container {
          width: 100%;
          height: 100%;
          min-height: 600px;
        }
        .transit-map-panel {
          position: absolute;
          top: 16px;
          left: 16px;
          z-index: 5;
          background: rgba(13, 13, 13, 0.85);
          backdrop-filter: blur(10px);
          border: 0.5px solid #262626;
          border-radius: 6px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 200px;
        }
        .transit-map-panel-title {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent, #e8ae3c);
          margin-bottom: 2px;
        }
        .transit-map-toggle {
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
        }
        .transit-map-toggle input {
          accent-color: var(--accent-bright, #f7c64e);
          width: 14px;
          height: 14px;
          cursor: pointer;
        }
        .transit-map-swatch {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .transit-map-toggle-label {
          font-family: Georgia, serif;
          font-size: 13px;
          color: #f0ede8;
        }
        .transit-map-status {
          position: absolute;
          top: 16px;
          right: 56px;
          z-index: 5;
          background: rgba(13, 13, 13, 0.85);
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
        .transit-map-status-error { color: #eb5757; }

        .transit-map-nearest {
          position: absolute;
          bottom: 16px;
          left: 16px;
          z-index: 5;
          background: rgba(13, 13, 13, 0.85);
          backdrop-filter: blur(10px);
          border: 0.5px solid rgba(232, 174, 60, 0.4);
          border-radius: 6px;
          padding: 14px 16px;
          min-width: 200px;
          max-width: 260px;
        }
        .transit-map-nearest-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .transit-map-nearest-name {
          font-family: Georgia, serif;
          font-size: 15px;
          color: #f0ede8;
        }
        .transit-map-nearest-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.04em;
          color: #c8c8c8;
          margin-top: 4px;
        }
        .transit-map-nearest-distance {
          font-family: var(--font-mono);
          font-size: 18px;
          color: var(--accent-bright, #f7c64e);
          font-weight: 600;
          margin-top: 8px;
        }
        .transit-map-nearest-hint {
          font-family: var(--font-mono);
          font-size: 9.5px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #6a6a6a;
          margin-top: 3px;
        }

        .transit-property-marker {
          width: 22px;
          height: 22px;
          position: relative;
        }
        .transit-property-marker-pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid #e8ae3c;
          animation: transitPropertyPulse 2s ease-out infinite;
        }
        .transit-property-marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #e8ae3c;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px #e8ae3c, 0 0 20px rgba(232, 174, 60, 0.6);
        }
        @keyframes transitPropertyPulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
