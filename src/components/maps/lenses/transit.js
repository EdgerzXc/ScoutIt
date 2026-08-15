// Manila Rail Transit Lens for Spatial Canvas
import {
  point as turfPoint,
  distance as turfDistance,
} from "@turf/turf";
import manilaTransit from "@/data/manila_transit.json";
import manilaStations from "@/data/manila_transit_stations.json";

const LINE_META = manilaTransit.features.map((f) => ({
  id: f.properties.id,
  name: f.properties.name,
  color: f.properties.color,
}));

const ALL_STATIONS = LINE_META.flatMap((line) =>
  (manilaStations[line.id] || []).map((s) => ({ ...s, lineId: line.id, lineName: line.name, lineColor: line.color }))
);

const MAX_RELEVANT_KM = 15;

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

export const transitLens = {
  id: "transit",
  label: "Transit",
  massing: false,

  getLayerButtons() {
    return [
      { id: "all", label: "🚆 ALL LINES" },
      { id: "lrt1", label: "🟡 LRT-1" },
      { id: "lrt2", label: "🟣 LRT-2" },
      { id: "mrt3", label: "🔵 MRT-3" },
    ];
  },

  mount(map, { firstLabelLayerId, targetLat, targetLng }) {
    const rootStyle = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const token = (name, fallback) => (rootStyle?.getPropertyValue(name) || "").trim() || fallback;
    const GOLD = token("--accent", "#E8AE3C");
    const VOID_BLACK = token("--bg-root", "#0e0e0e");

    const combinedTransit = {
      type: "FeatureCollection",
      features: manilaTransit.features,
    };

    if (!map.getSource("manila-transit-lines")) {
      map.addSource("manila-transit-lines", { type: "geojson", data: combinedTransit });

      LINE_META.forEach((line) => {
        const filter = ["==", ["get", "id"], line.id];

        map.addLayer(
          {
            id: `${line.id}-glow`,
            type: "line",
            source: "manila-transit-lines",
            filter,
            paint: {
              "line-color": line.color,
              "line-width": 6,
              "line-opacity": 0.4,
              "line-blur": 3,
            },
          },
          firstLabelLayerId
        );

        map.addLayer(
          {
            id: `${line.id}-core`,
            type: "line",
            source: "manila-transit-lines",
            filter,
            paint: {
              "line-color": line.color,
              "line-width": 2.5,
              "line-opacity": 0.95,
            },
          },
          firstLabelLayerId
        );

        const stationsGeo = {
          type: "FeatureCollection",
          features: (manilaStations[line.id] || []).map((s) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [s.lon, s.lat] },
            properties: { name: s.name, lineId: line.id },
          })),
        };

        map.addSource(`${line.id}-stations`, { type: "geojson", data: stationsGeo });

        map.addLayer({
          id: `${line.id}-stations-circle`,
          type: "circle",
          source: `${line.id}-stations`,
          paint: {
            "circle-radius": 4,
            "circle-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-stroke-color": line.color,
          },
        });

        map.addLayer({
          id: `${line.id}-stations-label`,
          type: "symbol",
          source: `${line.id}-stations`,
          minzoom: 12.5,
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": 10,
            "text-offset": [0, 1.1],
            "text-anchor": "top",
            "text-optional": true,
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": VOID_BLACK,
            "text-halo-width": 2,
          },
        });
      });
    }

    // Nearest station connector calculation
    if (typeof targetLat === "number" && typeof targetLng === "number") {
      const nearest = nearestStationTo(targetLat, targetLng);
      if (nearest && nearest.distanceKm <= MAX_RELEVANT_KM) {
        const connectorGeo = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [targetLng, targetLat],
                  [nearest.lon, nearest.lat],
                ],
              },
              properties: { distanceKm: nearest.distanceKm },
            },
          ],
        };

        if (!map.getSource("transit-property-connector")) {
          map.addSource("transit-property-connector", { type: "geojson", data: connectorGeo });
          map.addLayer(
            {
              id: "transit-property-connector-layer",
              type: "line",
              source: "transit-property-connector",
              paint: {
                "line-color": GOLD,
                "line-width": 2,
                "line-dasharray": [3, 3],
                "line-opacity": 0.85,
              },
            },
            firstLabelLayerId
          );
        }
      }
    }
  },

  applyVisibility(map, activeSubLayer) {
    LINE_META.forEach((line) => {
      const visible = activeSubLayer === "all" || activeSubLayer === line.id;
      const layerIds = [
        `${line.id}-glow`,
        `${line.id}-core`,
        `${line.id}-stations-circle`,
        `${line.id}-stations-label`,
      ];
      layerIds.forEach((lid) => {
        try {
          if (map.getLayer(lid)) {
            map.setLayoutProperty(lid, "visibility", visible ? "visible" : "none");
          }
        } catch (e) {}
      });
    });
  },

  unmount(map) {
    try {
      if (map.getLayer("transit-property-connector-layer")) {
        map.removeLayer("transit-property-connector-layer");
      }
      if (map.getSource("transit-property-connector")) {
        map.removeSource("transit-property-connector");
      }
      LINE_META.forEach((line) => {
        const layerIds = [
          `${line.id}-stations-label`,
          `${line.id}-stations-circle`,
          `${line.id}-core`,
          `${line.id}-glow`,
        ];
        layerIds.forEach((lid) => {
          try {
            if (map.getLayer(lid)) map.removeLayer(lid);
          } catch (e) {}
        });
        try {
          if (map.getSource(`${line.id}-stations`)) map.removeSource(`${line.id}-stations`);
        } catch (e) {}
      });
      if (map.getSource("manila-transit-lines")) {
        map.removeSource("manila-transit-lines");
      }
    } catch (e) {}
  },
};

export default transitLens;
