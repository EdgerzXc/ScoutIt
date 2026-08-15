// UP NOAH Flood Hazard Lens for Spatial Canvas
// Cloud-optimized PMTiles vector tiles via HTTP range requests
import maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";

const FLOOD_PERIODS = [
  { id: "5yr", label: "5-YR RECENT", file: "flood_5yr.pmtiles", layer: "flood_5yr" },
  { id: "25yr", label: "25-YR MID", file: "flood_25yr.pmtiles", layer: "flood_25yr" },
  { id: "100yr", label: "100-YR MAX", file: "flood_100yr.pmtiles", layer: "flood_100yr" },
];

const NOAH_BASE_URL = "https://huggingface.co/datasets/bettergovph/project-noah-hazard-maps/resolve/main/PMTiles/layers/";

const HAZARD_LEVELS = [
  { value: 1, label: "Low", color: "#F2C94C" },
  { value: 2, label: "Medium", color: "#F2994A" },
  { value: 3, label: "High", color: "#EB5757" },
];

let protocolRegistered = false;
function ensurePmtilesProtocol() {
  if (protocolRegistered) return;
  try {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    protocolRegistered = true;
  } catch (err) {}
}

function pmtilesUrlFor(period) {
  return `pmtiles://${NOAH_BASE_URL}${period.file}`;
}

export const floodLens = {
  id: "flood",
  label: "Flood",
  massing: false, // Explicit owner decision: extrusions disabled to highlight hazard surface

  getLayerButtons() {
    return FLOOD_PERIODS.map((p) => ({
      id: p.id,
      label: p.label,
    }));
  },

  mount(map, { firstLabelLayerId, targetLat, targetLng }) {
    ensurePmtilesProtocol();
    this.activePeriod = FLOOD_PERIODS[2]; // Default to 100yr worst-case

    if (map.getLayer("flood-hazard-fill")) map.removeLayer("flood-hazard-fill");
    if (map.getSource("flood-hazard")) map.removeSource("flood-hazard");

    map.addSource("flood-hazard", {
      type: "vector",
      url: pmtilesUrlFor(this.activePeriod),
    });

    map.addLayer(
      {
        id: "flood-hazard-fill",
        type: "fill",
        source: "flood-hazard",
        "source-layer": this.activePeriod.layer,
        paint: {
          "fill-color": [
            "match",
            ["get", "Var"],
            1,
            HAZARD_LEVELS[0].color,
            2,
            HAZARD_LEVELS[1].color,
            3,
            HAZARD_LEVELS[2].color,
            "#666666",
          ],
          "fill-opacity": 0.55,
        },
      },
      firstLabelLayerId
    );
  },

  applyVisibility(map, activeSubLayer) {
    const period = FLOOD_PERIODS.find((p) => p.id === activeSubLayer) || FLOOD_PERIODS[2];
    this.activePeriod = period;

    try {
      if (map.getLayer("flood-hazard-fill")) map.removeLayer("flood-hazard-fill");
      if (map.getSource("flood-hazard")) map.removeSource("flood-hazard");

      map.addSource("flood-hazard", {
        type: "vector",
        url: pmtilesUrlFor(period),
      });

      map.addLayer({
        id: "flood-hazard-fill",
        type: "fill",
        source: "flood-hazard",
        "source-layer": period.layer,
        paint: {
          "fill-color": [
            "match",
            ["get", "Var"],
            1,
            HAZARD_LEVELS[0].color,
            2,
            HAZARD_LEVELS[1].color,
            3,
            HAZARD_LEVELS[2].color,
            "#666666",
          ],
          "fill-opacity": 0.55,
        },
      });
    } catch (err) {}
  },

  unmount(map) {
    try {
      if (map.getLayer("flood-hazard-fill")) map.removeLayer("flood-hazard-fill");
      if (map.getSource("flood-hazard")) map.removeSource("flood-hazard");
    } catch (e) {}
  },
};

export default floodLens;
