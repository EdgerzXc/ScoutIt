// Location / Tactical Map Lens for Spatial Canvas
// Utilizes CARTO vector tile 'poi' source-layer directly for zero extra network requests,
// filtered to the 4 canonical groups (Daily, Wellness, Social, Transit).

const NOISE_CLASSES = [
  "gate",
  "lift_gate",
  "bicycle_parking",
  "bollard",
  "waste_basket",
  "toilets",
  "entrance",
  "shelter",
  "cycle_barrier",
  "recycling",
  "telephone",
  "bench",
  "post_box",
];

const DAILY_CLASSES = ["cafe", "bakery", "convenience", "supermarket", "grocery", "food_court", "deli", "shop"];
const WELLNESS_CLASSES = ["fitness_centre", "park", "pharmacy", "clinic", "hospital", "gym", "pitch", "swimming_pool", "sports_centre"];
const SOCIAL_CLASSES = ["restaurant", "bar", "mall", "pub", "fast_food", "nightclub", "cinema", "theatre", "museum", "gallery", "attraction"];
const TRANSIT_CLASSES = ["station", "bus_stop", "fuel", "bus_station", "subway_entrance", "tram_stop", "ferry_terminal", "bus"];

export const locationLens = {
  id: "location",
  label: "Tactical",
  massing: true,

  getLayerButtons() {
    return [
      { id: "all", label: "📍 ALL POIS" },
      { id: "daily", label: "☕ DAILY" },
      { id: "wellness", label: "🌿 WELLNESS" },
      { id: "social", label: "🍽️ SOCIAL" },
      { id: "transit", label: "🚆 TRANSIT" },
    ];
  },

  mount(map, { firstLabelLayerId, targetLat, targetLng, vicinityData = [], lifestylePois = [], nearbyListings = [], routeDestCoords = null, routeLabel = "" }) {
    const rootStyle = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const token = (name, fallback) => (rootStyle?.getPropertyValue(name) || "").trim() || fallback;
    const GOLD = token("--accent", "#E8AE3C");
    const GOLD_BRIGHT = token("--accent-bright", "#F7C64E");
    const PAPER_WHITE = token("--text-primary", "#f0ede8");
    const SOFT_GREY = "#c8c8c8";
    const VOID_BLACK = token("--bg-root", "#0e0e0e");

    // 1. Vector Tile POI Symbol Layer (from existing carto source)
    if (!map.getLayer("carto-pois-symbol")) {
      map.addLayer(
        {
          id: "carto-pois-symbol",
          type: "symbol",
          source: "carto",
          "source-layer": "poi",
          minzoom: 14,
          filter: ["all", ["!in", ["get", "class"], ["literal", NOISE_CLASSES]], ["has", "name"]],
          layout: {
            visibility: "visible",
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 16, 11, 18, 13],
            "text-offset": [0, 0.6],
            "text-anchor": "top",
            "text-optional": true,
            "text-max-width": 9,
          },
          paint: {
            "text-color": SOFT_GREY,
            "text-halo-color": VOID_BLACK,
            "text-halo-width": 1.5,
          },
        },
        firstLabelLayerId
      );

      // Visual point dot for each POI
      map.addLayer(
        {
          id: "carto-pois-circle",
          type: "circle",
          source: "carto",
          "source-layer": "poi",
          minzoom: 14,
          filter: ["all", ["!in", ["get", "class"], ["literal", NOISE_CLASSES]], ["has", "name"]],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 14, 3, 16, 4.5, 18, 6],
            "circle-color": SOFT_GREY,
            "circle-opacity": 0.85,
            "circle-stroke-width": 1,
            "circle-stroke-color": VOID_BLACK,
          },
        },
        "carto-pois-symbol"
      );
    }

    // 2. Nearby ScoutIt Listings (Gold markers + labels)
    const validListings = (nearbyListings || []).filter(
      (l) => typeof l.lat === "number" && Number.isFinite(l.lat) && typeof l.lng === "number" && Number.isFinite(l.lng)
    );

    const listingsGeoJson = {
      type: "FeatureCollection",
      features: validListings.map((l) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [l.lng, l.lat] },
        properties: {
          title: l.title || "ScoutIt Listing",
          price: l.price || "",
          slug: l.slug || "",
        },
      })),
    };

    if (!map.getSource("nearby-scoutit-listings")) {
      map.addSource("nearby-scoutit-listings", {
        type: "geojson",
        data: listingsGeoJson,
      });

      map.addLayer({
        id: "nearby-listings-circles",
        type: "circle",
        source: "nearby-scoutit-listings",
        paint: {
          "circle-radius": 6,
          "circle-color": GOLD,
          "circle-opacity": 0.95,
          "circle-stroke-width": 2,
          "circle-stroke-color": VOID_BLACK,
        },
      });

      map.addLayer({
        id: "nearby-listings-labels",
        type: "symbol",
        source: "nearby-scoutit-listings",
        layout: {
          "text-field": ["get", "title"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-optional": true,
        },
        paint: {
          "text-color": PAPER_WHITE,
          "text-halo-color": VOID_BLACK,
          "text-halo-width": 2,
        },
      });
    }

    // 3. Optional Destination Route Line
    if (routeDestCoords && Array.isArray(routeDestCoords) && routeDestCoords.length === 2) {
      const [destLat, destLng] = routeDestCoords;
      if (Number.isFinite(destLat) && Number.isFinite(destLng)) {
        const routeGeoJson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [targetLng, targetLat],
                  [destLng, destLat],
                ],
              },
              properties: { label: routeLabel || "Route" },
            },
          ],
        };

        if (!map.getSource("location-route-line")) {
          map.addSource("location-route-line", { type: "geojson", data: routeGeoJson });
          map.addLayer(
            {
              id: "location-route-line-layer",
              type: "line",
              source: "location-route-line",
              paint: {
                "line-color": GOLD_BRIGHT,
                "line-width": 2.5,
                "line-dasharray": [2, 2],
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
    if (!map.getLayer("carto-pois-symbol") || !map.getLayer("carto-pois-circle")) return;

    let classFilter = null;
    if (activeSubLayer === "daily") {
      classFilter = ["in", ["get", "class"], ["literal", DAILY_CLASSES]];
    } else if (activeSubLayer === "wellness") {
      classFilter = ["in", ["get", "class"], ["literal", WELLNESS_CLASSES]];
    } else if (activeSubLayer === "social") {
      classFilter = ["in", ["get", "class"], ["literal", SOCIAL_CLASSES]];
    } else if (activeSubLayer === "transit") {
      classFilter = ["in", ["get", "class"], ["literal", TRANSIT_CLASSES]];
    }

    const baseFilter = ["all", ["!in", ["get", "class"], ["literal", NOISE_CLASSES]], ["has", "name"]];
    const finalFilter = classFilter ? ["all", baseFilter, classFilter] : baseFilter;

    try {
      map.setFilter("carto-pois-symbol", finalFilter);
      map.setFilter("carto-pois-circle", finalFilter);
    } catch (err) {}
  },

  unmount(map) {
    const layerIds = [
      "location-route-line-layer",
      "nearby-listings-labels",
      "nearby-listings-circles",
      "carto-pois-circle",
      "carto-pois-symbol",
    ];
    layerIds.forEach((id) => {
      try {
        if (map.getLayer(id)) map.removeLayer(id);
      } catch (e) {}
    });
    const sourceIds = ["location-route-line", "nearby-scoutit-listings"];
    sourceIds.forEach((id) => {
      try {
        if (map.getSource(id)) map.removeSource(id);
      } catch (e) {}
    });
  },
};

export default locationLens;
