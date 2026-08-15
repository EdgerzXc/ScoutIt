import pezaZonesData from "@/data/peza_zones_philippines.json";
import infraProjectsData from "@/data/ph_infrastructure_projects.json";

// Major Philippine Enterprise Office Density Clusters GeoJSON
export const OFFICE_CLUSTERS_GEOJSON = {
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

export const PEZA_ZONES_GEOJSON = pezaZonesData;
export const INFRA_PROJECTS_GEOJSON = infraProjectsData;

export const commandLens = {
  id: "command",
  label: "Command",
  massing: true,

  getLayerButtons(state = {}) {
    return [
      { id: "all", label: "🛡️ OVERVIEW" },
      { id: "satellite", label: "🛰️ SAT" },
      { id: "infra", label: "🏗️ INFRA" },
      { id: "quake", label: `🌊 QUAKE (${state.quakeCount ?? 0})` },
      { id: "fire", label: `🔥 FIRE (${state.fireCount ?? 0})` },
      { id: "peza", label: "🏢 PEZA" },
      { id: "clusters", label: "🏢 CLUSTERS" },
      { id: "isochrones", label: "🚆 REACH" },
      { id: "seismic", label: "📐 FAULT" },
    ];
  },

  // Add sources and layers specific to the Command lens
  mount(map, { firstLabelLayerId, targetLat, targetLng, isochrone, onQuakesLoaded, onFiresLoaded }) {
    // 1. Satellite Raster
    if (!map.getSource("satellite-tiles")) {
      map.addSource("satellite-tiles", {
        type: "raster",
        tiles: ["https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
        tileSize: 256,
      });
      map.addLayer({
        id: "satellite-layer",
        type: "raster",
        source: "satellite-tiles",
        layout: { visibility: "none" },
        paint: { "raster-opacity": 1.0 },
      });
    }

    // 2. PHIVOLCS Active Faults
    if (!map.getSource("fault-line-trace")) {
      map.addSource("fault-line-trace", { type: "geojson", data: "/data/phivolcs-active-faults.geojson" });
      map.addLayer(
        {
          id: "fault-line-glow",
          type: "line",
          source: "fault-line-trace",
          layout: { visibility: "visible" },
          paint: { "line-color": "#FF3B30", "line-width": 7, "line-opacity": 0.25, "line-blur": 3 },
        },
        firstLabelLayerId
      );
      map.addLayer(
        {
          id: "fault-line-layer",
          type: "line",
          source: "fault-line-trace",
          layout: { visibility: "visible" },
          paint: { "line-color": "#FF3B30", "line-width": 2, "line-dasharray": [2, 2], "line-opacity": 0.95 },
        },
        firstLabelLayerId
      );
    }

    // 3. PEZA IT Zones
    if (!map.getSource("peza-zones")) {
      map.addSource("peza-zones", { type: "geojson", data: PEZA_ZONES_GEOJSON });
      map.addLayer({
        id: "peza-zones-layer",
        type: "circle",
        source: "peza-zones",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 20,
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
          visibility: "visible",
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
        },
        paint: { "text-color": "#10B981", "text-halo-color": "#0d0d0d", "text-halo-width": 2 },
      });
    }

    // 4. Office Clusters
    if (!map.getSource("office-clusters")) {
      map.addSource("office-clusters", { type: "geojson", data: OFFICE_CLUSTERS_GEOJSON });
      map.addLayer({
        id: "office-clusters-layer",
        type: "circle",
        source: "office-clusters",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 24,
          "circle-color": "#3B82F6",
          "circle-opacity": 0.15,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#60A5FA",
        },
      });
    }

    // 5. Infra Megaprojects
    if (!map.getSource("infra-projects")) {
      map.addSource("infra-projects", { type: "geojson", data: INFRA_PROJECTS_GEOJSON });
      map.addLayer(
        {
          id: "infra-lines-layer",
          type: "line",
          source: "infra-projects",
          filter: ["==", "$type", "LineString"],
          layout: { visibility: "visible" },
          paint: { "line-color": "#06B6D4", "line-width": 3, "line-dasharray": [3, 2], "line-opacity": 0.85 },
        },
        firstLabelLayerId
      );
      map.addLayer({
        id: "infra-points-layer",
        type: "circle",
        source: "infra-projects",
        filter: ["==", "$type", "Point"],
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 8,
          "circle-color": "#EC4899",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#F472B6",
        },
      });
    }

    // 6. USGS Earthquakes
    const usgsUrl =
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=4&maxlatitude=22&minlongitude=115&maxlongitude=130&minmagnitude=3.0";
    fetch(usgsUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data?.features && map.getStyle()) {
          onQuakesLoaded?.(data.features);
          if (!map.getSource("usgs-quakes")) {
            map.addSource("usgs-quakes", { type: "geojson", data });
            map.addLayer({
              id: "quakes-layer",
              type: "circle",
              source: "usgs-quakes",
              layout: { visibility: "visible" },
              paint: {
                "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 3, 4, 5, 9, 7, 16],
                "circle-color": "#E11D48",
                "circle-opacity": 0.35,
                "circle-stroke-width": 1.5,
                "circle-stroke-color": "#FB7185",
              },
            });
          }
        }
      })
      .catch(() => {});

    // 7. NASA FIRMS Fire Hotspots
    const simulatedFires = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", geometry: { type: "Point", coordinates: [121.012, 14.521] }, properties: { brightness: 325.4, scan: "MODIS Thermal" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [121.085, 14.562] }, properties: { brightness: 310.8, scan: "VIIRS I-Band" } },
        { type: "Feature", geometry: { type: "Point", coordinates: [121.043, 14.615] }, properties: { brightness: 340.2, scan: "MODIS Thermal" } },
      ],
    };
    onFiresLoaded?.(simulatedFires.features.length);
    if (!map.getSource("nasa-firms-fires")) {
      map.addSource("nasa-firms-fires", { type: "geojson", data: simulatedFires });
      map.addLayer({
        id: "fires-layer",
        type: "circle",
        source: "nasa-firms-fires",
        layout: { visibility: "visible" },
        paint: {
          "circle-radius": 10,
          "circle-color": "#FF4500",
          "circle-opacity": 0.4,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFA500",
        },
      });
    }
  },

  applyVisibility(map, activeSubLayer) {
    const layerGroups = {
      "satellite-layer": activeSubLayer === "satellite",
      "peza-zones-layer": activeSubLayer === "all" || activeSubLayer === "peza",
      "peza-zones-label": activeSubLayer === "all" || activeSubLayer === "peza",
      "fault-line-glow": activeSubLayer === "all" || activeSubLayer === "seismic",
      "fault-line-layer": activeSubLayer === "all" || activeSubLayer === "seismic",
      "office-clusters-layer": activeSubLayer === "all" || activeSubLayer === "clusters",
      "reach-isochrone-fill": activeSubLayer === "all" || activeSubLayer === "isochrones",
      "reach-isochrone-outline": activeSubLayer === "all" || activeSubLayer === "isochrones",
      "infra-lines-layer": activeSubLayer === "all" || activeSubLayer === "infra",
      "infra-points-layer": activeSubLayer === "all" || activeSubLayer === "infra",
      "quakes-layer": activeSubLayer === "all" || activeSubLayer === "quake",
      "fires-layer": activeSubLayer === "all" || activeSubLayer === "fire",
    };

    for (const [lid, visible] of Object.entries(layerGroups)) {
      try {
        if (map.getLayer(lid)) {
          map.setLayoutProperty(lid, "visibility", visible ? "visible" : "none");
        }
      } catch (err) {}
    }
  },

  unmount(map) {
    const layerIds = [
      "fires-layer",
      "quakes-layer",
      "infra-points-layer",
      "infra-lines-layer",
      "office-clusters-layer",
      "peza-zones-label",
      "peza-zones-layer",
      "fault-line-layer",
      "fault-line-glow",
      "satellite-layer",
    ];
    layerIds.forEach((id) => {
      try {
        if (map.getLayer(id)) map.removeLayer(id);
      } catch (e) {}
    });
    const sourceIds = [
      "nasa-firms-fires",
      "usgs-quakes",
      "infra-projects",
      "office-clusters",
      "peza-zones",
      "fault-line-trace",
      "satellite-tiles",
    ];
    sourceIds.forEach((id) => {
      try {
        if (map.getSource(id)) map.removeSource(id);
      } catch (e) {}
    });
  },
};

export default commandLens;
