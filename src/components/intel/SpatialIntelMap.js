"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// 1. Regional Location Boundaries GeoJSON (Highlights whole city/zone areas)
const REGIONAL_ZONES_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { city: "BGC, Taguig", region: "Metro Manila", slug: "bgc-spatial-movement" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.0420, 14.5410],
            [121.0590, 14.5410],
            [121.0590, 14.5590],
            [121.0420, 14.5590],
            [121.0420, 14.5410],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { city: "Makati CBD, Metro Manila", region: "Metro Manila", slug: "green-office-demand" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.0150, 14.5470],
            [121.0330, 14.5470],
            [121.0330, 14.5630],
            [121.0150, 14.5630],
            [121.0150, 14.5470],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { city: "Siargao, Surigao del Norte", region: "Visayas / Mindanao", slug: "surf-front-land-rush" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [126.1350, 9.7550],
            [126.1800, 9.7550],
            [126.1800, 9.8020],
            [126.1350, 9.8020],
            [126.1350, 9.7550],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { city: "El Nido, Palawan", region: "MIMAROPA", slug: "off-grid-island-living" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [119.3650, 11.1550],
            [119.4150, 11.1550],
            [119.4150, 11.2050],
            [119.3650, 11.2050],
            [119.3650, 11.1550],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { city: "Poblacion, Makati", region: "Metro Manila", slug: "poblacion-food-architecture" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [121.0250, 14.5580],
            [121.0370, 14.5580],
            [121.0370, 14.5680],
            [121.0250, 14.5680],
            [121.0250, 14.5580],
          ],
        ],
      },
    },
    {
      type: "Feature",
      properties: { city: "Bay Area, Manila", region: "Metro Manila", slug: "manila-venue-trends" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [120.9680, 14.5220],
            [120.9940, 14.5220],
            [120.9940, 14.5460],
            [120.9680, 14.5460],
            [120.9680, 14.5220],
          ],
        ],
      },
    },
  ],
};

// 2. Zone Center Point Markers GeoJSON (Mathematically locked coordinates)
const ZONE_POINTS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { city: "BGC, Taguig", label: "BGC TAGUIG" }, geometry: { type: "Point", coordinates: [121.0509, 14.5494] } },
    { type: "Feature", properties: { city: "Makati CBD, Metro Manila", label: "MAKATI CBD" }, geometry: { type: "Point", coordinates: [121.0244, 14.5547] } },
    { type: "Feature", properties: { city: "Siargao, Surigao del Norte", label: "SIARGAO" }, geometry: { type: "Point", coordinates: [126.1594, 9.7794] } },
    { type: "Feature", properties: { city: "El Nido, Palawan", label: "EL NIDO" }, geometry: { type: "Point", coordinates: [119.3894, 11.1794] } },
    { type: "Feature", properties: { city: "Poblacion, Makati", label: "POBLACION" }, geometry: { type: "Point", coordinates: [121.0304, 14.5624] } },
    { type: "Feature", properties: { city: "Bay Area, Manila", label: "BAY AREA" }, geometry: { type: "Point", coordinates: [120.9814, 14.5344] } },
  ],
};

// 3. 3D Building Extrusions GeoJSON
const INTEL_BUILDINGS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { slug: "bgc-spatial-movement", height: 45 }, geometry: { type: "Polygon", coordinates: [[[121.0498, 14.5484], [121.0518, 14.5484], [121.0518, 14.5504], [121.0498, 14.5504], [121.0498, 14.5484]]] } },
    { type: "Feature", properties: { slug: "green-office-demand", height: 160 }, geometry: { type: "Polygon", coordinates: [[[121.0238, 14.5537], [121.0258, 14.5537], [121.0258, 14.5557], [121.0238, 14.5557], [121.0238, 14.5537]]] } },
    { type: "Feature", properties: { slug: "surf-front-land-rush", height: 20 }, geometry: { type: "Polygon", coordinates: [[[126.1584, 9.7784], [126.1604, 9.7784], [126.1604, 9.7804], [126.1584, 9.7804], [126.1584, 9.7784]]] } },
    { type: "Feature", properties: { slug: "off-grid-island-living", height: 25 }, geometry: { type: "Polygon", coordinates: [[[119.3884, 11.1784], [119.3904, 11.1784], [119.3904, 11.1804], [119.3884, 11.1804], [119.3884, 11.1784]]] } },
    { type: "Feature", properties: { slug: "poblacion-food-architecture", height: 48 }, geometry: { type: "Polygon", coordinates: [[[121.0294, 14.5614], [121.0314, 14.5614], [121.0314, 14.5634], [121.0294, 14.5634], [121.0294, 14.5614]]] } },
    { type: "Feature", properties: { slug: "manila-venue-trends", height: 58 }, geometry: { type: "Polygon", coordinates: [[[120.9804, 14.5334], [120.9824, 14.5334], [120.9824, 14.5354], [120.9804, 14.5354], [120.9804, 14.5334]]] } },
  ],
};

export default function SpatialIntelMap({
  articles = [],
  activeArticleSlug = null,
  selectedCity = null,
  onSelectCity = () => {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedCityRef = useRef(selectedCity);
  const onSelectCityRef = useRef(onSelectCity);
  const [activeCityName, setActiveCityName] = useState(null);

  useEffect(() => {
    selectedCityRef.current = selectedCity;
    onSelectCityRef.current = onSelectCity;
  }, [selectedCity, onSelectCity]);

  // Group articles by city/location
  const locations = useMemo(() => {
    const locationGroups = articles.reduce((acc, art) => {
      if (!art.city) return acc;
      const key = art.city;
      if (!acc[key]) {
        acc[key] = {
          city: art.city,
          region: art.region || "Philippines",
          lat: art.lat || 14.5547,
          lng: art.lng || 121.0244,
          articles: [],
        };
      }
      acc[key].articles.push(art);
      return acc;
    }, {});

    return Object.values(locationGroups);
  }, [articles]);

  // 1. Initialize MapLibre GL Map with Native Vector Layers (100% Mathematical Precision)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [121.0244, 14.5547],
      zoom: 11,
      pitch: 45,
      bearing: -15,
      maxPitch: 70,
      cooperativeGestures: true, // Prevents mobile scroll trapping
    });

    mapInstanceRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      // Layer A: Regional Area Polygon Fill (Location Highlight)
      map.addSource("zone-areas-src", {
        type: "geojson",
        data: REGIONAL_ZONES_GEOJSON,
      });

      map.addLayer({
        id: "zone-areas-fill",
        type: "fill",
        source: "zone-areas-src",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "city"], selectedCityRef.current || ""],
            "#F7C64E",
            "rgba(232, 174, 60, 0.15)",
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "city"], selectedCityRef.current || ""],
            0.4,
            0.15,
          ],
        },
      });

      map.addLayer({
        id: "zone-areas-outline",
        type: "line",
        source: "zone-areas-src",
        paint: {
          "line-color": "#F7C64E",
          "line-width": [
            "case",
            ["==", ["get", "city"], selectedCityRef.current || ""],
            2.5,
            1,
          ],
          "line-opacity": 0.8,
        },
      });

      // Layer B: 3D Building Extrusions
      map.addSource("intel-buildings-src", {
        type: "geojson",
        data: INTEL_BUILDINGS_GEOJSON,
      });

      map.addLayer({
        id: "intel-3d-buildings",
        type: "fill-extrusion",
        source: "intel-buildings-src",
        paint: {
          "fill-extrusion-color": "#F7C64E",
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": 0,
          "fill-extrusion-opacity": 0.75,
        },
      });

      // Layer C: Native Vector Point Markers (Mathematically Locked - Never Shifts on Zoom)
      map.addSource("zone-points-src", {
        type: "geojson",
        data: ZONE_POINTS_GEOJSON,
      });

      map.addLayer({
        id: "zone-points-glow",
        type: "circle",
        source: "zone-points-src",
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "city"], selectedCityRef.current || ""],
            14,
            9,
          ],
          "circle-color": "#F7C64E",
          "circle-opacity": 0.3,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F7C64E",
        },
      });

      map.addLayer({
        id: "zone-points-core",
        type: "circle",
        source: "zone-points-src",
        paint: {
          "circle-radius": 5,
          "circle-color": "#F7C64E",
          "circle-opacity": 1.0,
        },
      });

      // Layer D: Vector Labels on Map
      map.addLayer({
        id: "zone-points-labels",
        type: "symbol",
        source: "zone-points-src",
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["Metropolis Bold", "Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
        },
        paint: {
          "text-color": "#E8AE3C",
          "text-halo-color": "#0d0d0d",
          "text-halo-width": 2,
        },
      });

      // Click Interactivity on Native Vector Layers
      map.on("click", "zone-areas-fill", (e) => {
        const clickedCity = e.features[0]?.properties?.city;
        if (clickedCity) {
          onSelectCityRef.current(selectedCityRef.current === clickedCity ? null : clickedCity);
        }
      });

      map.on("click", "zone-points-glow", (e) => {
        const clickedCity = e.features[0]?.properties?.city;
        if (clickedCity) {
          onSelectCityRef.current(selectedCityRef.current === clickedCity ? null : clickedCity);
        }
      });

      map.on("mouseenter", "zone-areas-fill", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const hoverCity = e.features[0]?.properties?.city;
        if (hoverCity) setActiveCityName(hoverCity);
      });

      map.on("mouseleave", "zone-areas-fill", () => {
        map.getCanvas().style.cursor = "";
        setActiveCityName(null);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update Vector Layer Styles on Selected City Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.getLayer("zone-areas-fill")) return;

    map.setPaintProperty("zone-areas-fill", "fill-color", [
      "case",
      ["==", ["get", "city"], selectedCity || ""],
      "#F7C64E",
      "rgba(232, 174, 60, 0.15)",
    ]);

    map.setPaintProperty("zone-areas-fill", "fill-opacity", [
      "case",
      ["==", ["get", "city"], selectedCity || ""],
      0.45,
      0.15,
    ]);

    map.setPaintProperty("zone-areas-outline", "line-width", [
      "case",
      ["==", ["get", "city"], selectedCity || ""],
      2.5,
      1,
    ]);

    map.setPaintProperty("zone-points-glow", "circle-radius", [
      "case",
      ["==", ["get", "city"], selectedCity || ""],
      16,
      9,
    ]);
  }, [selectedCity]);

  // 3. Camera FlyTo on Location Filter Selection (User Action Only)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedCity) {
      const match = locations.find((l) => l.city === selectedCity);
      if (match) {
        map.flyTo({
          center: [match.lng, match.lat],
          zoom: 13.5,
          pitch: 55,
          bearing: -20,
          duration: 1800,
          essential: true,
        });
        return;
      }
    } else {
      map.flyTo({
        center: [121.0244, 14.5547],
        zoom: 9.5,
        pitch: 45,
        bearing: -15,
        duration: 1800,
        essential: true,
      });
    }
  }, [selectedCity, locations]);

  return (
    <div className="spatial-intel-map-card bg-surface-alt/90 border border-surface-variant rounded-sm p-4 relative overflow-hidden flex flex-col h-full select-none">
      {/* Map Header */}
      <div className="map-header flex items-center justify-between mb-3 z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-accent animate-ping"></span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-gold-accent font-bold">
            3D SPATIAL RADAR // REGIONAL HIGHLIGHTS
          </span>
        </div>
        <span className="font-mono text-[9px] text-text-muted uppercase tracking-wider">
          MAPLIBRE VECTOR ZONES // {locations.length} ACTIVE
        </span>
      </div>

      {/* Map Container */}
      <div className="map-canvas-container relative flex-1 min-h-[420px] md:min-h-[500px] rounded-xs border border-surface-variant/50 overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full min-h-[420px] md:min-h-[500px]" />

        {/* Floating Active Info Overlay */}
        {(activeCityName || selectedCity) && (
          <div className="absolute bottom-3 left-3 right-3 bg-surface/95 border border-gold-accent/40 rounded-xs p-2.5 backdrop-blur-md shadow-2xl z-20 flex items-center justify-between pointer-events-auto">
            <div>
              <span className="font-mono text-[9px] text-gold-accent tracking-widest uppercase block">
                {selectedCity ? "ACTIVE REGIONAL HIGHLIGHT" : "RADAR ZONE FOCUS"}
              </span>
              <h4 className="font-display text-xs text-text-primary font-bold m-0">
                {activeCityName || selectedCity}
              </h4>
            </div>
            {selectedCity ? (
              <button
                onClick={() => onSelectCity(null)}
                className="font-mono text-[9px] text-gold-accent border border-gold-accent/40 px-2 py-1 rounded-xs hover:bg-gold-accent/10 transition-colors uppercase cursor-pointer"
              >
                ✕ Reset Area Filter
              </button>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="map-footer flex items-center justify-between mt-3 px-1 font-mono text-[9px] text-text-muted uppercase">
        <span>Vector Locked Coordinates & Regional Area Fills</span>
        <span className="text-gold-accent/80">
          {selectedCity ? `Area Locked: ${selectedCity}` : "Click Zone Polygon To Filter"}
        </span>
      </div>

      {/* MapLibre ships its controls as white browser chrome. On the property
          canvas those are restyled; this map never got the same treatment, so
          on a phone the attribution rendered as a 64px white slab and the zoom
          buttons as two white squares sitting on a near-black instrument card.
          Same treatment as spatial-canvas.css, scoped to this card. */}
      <style jsx global>{`
        .spatial-intel-map-card .maplibregl-ctrl-group {
          background: rgba(14, 14, 14, 0.92);
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          box-shadow: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .spatial-intel-map-card .maplibregl-ctrl-group button + button {
          border-top: 1px solid #2a2a2a;
        }
        .spatial-intel-map-card .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
          filter: invert(85%) sepia(18%) saturate(360%) hue-rotate(357deg) brightness(95%);
        }
        .spatial-intel-map-card .maplibregl-ctrl-group button:hover {
          background: rgba(232, 174, 60, 0.12);
        }

        /* Collapsed to the ⓘ toggle by default. Expanded it was four wrapped
           lines and 64px tall on a 412px screen, covering the city it credits.
           The attribution stays reachable, which is the licence requirement;
           it just stops being the brightest object on the map. */
        .spatial-intel-map-card .maplibregl-ctrl-attrib {
          background: rgba(14, 14, 14, 0.7);
          font-size: 9px;
        }
        .spatial-intel-map-card .maplibregl-ctrl-attrib a,
        .spatial-intel-map-card .maplibregl-ctrl-attrib {
          color: #c8c8c8;
        }
        .spatial-intel-map-card .maplibregl-ctrl-attrib-button {
          background-color: rgba(14, 14, 14, 0.7);
          filter: invert(85%) sepia(18%) saturate(360%) hue-rotate(357deg) brightness(95%);
        }

        /* "Use two fingers to move the map" was unstyled system white. */
        .spatial-intel-map-card .maplibregl-cooperative-gesture-screen {
          background: rgba(14, 14, 14, 0.72);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          letter-spacing: 0.08em;
          color: #f0ede8;
        }

        @media (pointer: coarse) {
          .spatial-intel-map-card .maplibregl-ctrl-group button {
            width: 44px;
            height: 44px;
          }
          .spatial-intel-map-card .maplibregl-ctrl-group button .maplibregl-ctrl-icon {
            background-size: 20px 20px;
          }
        }
      `}</style>
    </div>
  );
}
