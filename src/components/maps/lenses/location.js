// Location / Tactical Map Lens for Spatial Canvas
//
// Real-world places come from the `poi` source-layer of the CARTO vector tiles
// the map already downloads — the same trick as the building heights. No extra
// request, no new service. Measured: one Makati tile carries 4,857 POI features
// with class / subclass / name / rank.
import maplibregl from "maplibre-gl";

// ~900 features per tile in the sample are pure infrastructure clutter — the
// map must never show a bollard next to a restaurant.
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

const GROUP_CLASSES = {
  daily: DAILY_CLASSES,
  wellness: WELLNESS_CLASSES,
  social: SOCIAL_CLASSES,
  transit: TRANSIT_CLASSES,
};

// MapLibre validates `filter` against the style spec and, when it fails, fires
// an `error` EVENT and silently declines to add the layer — it does not throw.
// The first draft of this file used ["!in", ["get","class"], ["literal", [...]]],
// which is legacy filter syntax requiring a plain string key. Validation
// rejected it with "filter[1][1]: string expected, array found", the layer was
// never added, no exception surfaced, and the entire nearby-places feature
// rendered nothing while looking perfectly correct in source.
//
// The expression form of "not in" is ["!", ["in", ...]]. There is no "!in"
// expression.
const NOT_NOISE = ["!", ["in", ["get", "class"], ["literal", NOISE_CLASSES]]];

/**
 * Builds the POI filter.
 *
 * `reachGeometry` is the isochrone — the owner's rule is that only what is
 * genuinely inside the glowing shape may appear. MapLibre's ["within", geom]
 * does that natively against the tile geometry, so nothing has to be fetched or
 * computed client-side. When the isochrone is unavailable we show nothing
 * rather than falling back to "everything in view", which would quietly break
 * the promise the circle makes.
 */
export function buildPoiFilter(group, reachGeometry) {
  const parts = [NOT_NOISE, ["has", "name"]];

  const classes = GROUP_CLASSES[group];
  if (classes) parts.push(["in", ["get", "class"], ["literal", classes]]);

  if (reachGeometry) {
    parts.push(["within", reachGeometry]);
  } else {
    // No measured reach yet — render nothing.
    parts.push(false);
  }

  return ["all", ...parts];
}

// Popup content is built as DOM nodes, never as an HTML string.
//
// maplibregl.Popup#setHTML assigns the string to innerHTML. POI names come from
// OpenStreetMap, which anyone in the world can edit, so a place named
// `<img src=x onerror=...>` would execute script on a ScoutIt property page.
// textContent cannot be parsed as markup, which closes that off entirely.
function buildPopupNode({ title, titleColor, subtitle, href, hrefLabel }) {
  const root = document.createElement("div");
  root.style.fontFamily = "var(--font-body, sans-serif)";

  const strong = document.createElement("strong");
  strong.textContent = title;
  strong.style.cssText = `font-size:12px;color:${titleColor};`;
  root.appendChild(strong);

  if (subtitle) {
    root.appendChild(document.createElement("br"));
    const span = document.createElement("span");
    span.textContent = subtitle;
    span.style.cssText =
      "color:var(--accent,#E8AE3C);font-family:var(--font-mono,monospace);font-size:9.5px;text-transform:uppercase;letter-spacing:0.08em;";
    root.appendChild(span);
  }

  if (href) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "4px";
    const a = document.createElement("a");
    a.href = href;
    a.textContent = hrefLabel;
    a.style.cssText =
      "color:var(--accent-bright,#F7C64E);font-size:10px;font-family:var(--font-mono,monospace);text-decoration:none;letter-spacing:0.05em;";
    wrap.appendChild(a);
    root.appendChild(wrap);
  }

  return root;
}

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

  mount(map, { firstLabelLayerId, nearbyListings = [], isochrone = null }) {
    const rootStyle = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
    const token = (name, fallback) => (rootStyle?.getPropertyValue(name) || "").trim() || fallback;
    const GOLD = token("--accent", "#E8AE3C");
    const PAPER_WHITE = token("--text-primary", "#f0ede8");
    const SOFT_GREY = token("--text-secondary", "#c8c8c8");
    const VOID_BLACK = token("--bg", "#0e0e0e");

    // The reach is a FeatureCollection of bands; the outermost is the whole
    // reachable area, so POIs are clipped to that.
    const reachGeometry = widestReachGeometry(isochrone);
    this._reachGeometry = reachGeometry;

    const baseFilter = buildPoiFilter(null, reachGeometry);

    if (!map.getLayer("carto-pois-symbol")) {
      map.addLayer(
        {
          id: "carto-pois-symbol",
          type: "symbol",
          source: "carto",
          "source-layer": "poi",
          minzoom: 14,
          filter: baseFilter,
          layout: {
            visibility: "visible",
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 16, 11, 18, 13],
            "text-offset": [0, 0.6],
            "text-anchor": "top",
            "text-optional": true,
            "text-max-width": 9,
            // The tiles carry `rank` — lower is more important. Sorting by it
            // means that when labels collide the significant place survives
            // rather than whichever happened to be drawn first.
            "symbol-sort-key": ["coalesce", ["get", "rank"], 99],
          },
          paint: {
            "text-color": SOFT_GREY,
            "text-halo-color": VOID_BLACK,
            "text-halo-width": 1.5,
          },
        },
        firstLabelLayerId
      );

      map.addLayer(
        {
          id: "carto-pois-circle",
          type: "circle",
          source: "carto",
          "source-layer": "poi",
          minzoom: 14,
          filter: baseFilter,
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

    // ── Nearby ScoutIt listings ────────────────────────────────────────────
    // A listing without coordinates is skipped entirely. It must never be
    // placed at a fallback position — a mark in the wrong city is worse than
    // no mark at all.
    const validListings = (nearbyListings || []).filter(
      (l) => Number.isFinite(Number(l?.lat)) && Number.isFinite(Number(l?.lng))
    );

    const listingsGeoJson = {
      type: "FeatureCollection",
      features: validListings.map((l) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [Number(l.lng), Number(l.lat)] },
        properties: {
          title: l.title || "ScoutIt Listing",
          slug: l.slug || "",
        },
      })),
    };

    if (!map.getSource("nearby-scoutit-listings")) {
      map.addSource("nearby-scoutit-listings", { type: "geojson", data: listingsGeoJson });

      // --accent, not --accent-muted: muted gold measures 2.66:1 against Void
      // Black, under the 3:1 minimum for a non-text UI element, and it is also
      // the colour the massing gives mid-rise buildings, so muted marks would
      // camouflage against the city. The star property stays distinct because
      // it is a whole glowing building, not because it is a brighter dot.
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
          "text-font": ["Open Sans Bold", "Noto Sans Regular"],
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
    } else {
      map.getSource("nearby-scoutit-listings").setData(listingsGeoJson);
    }

    // ── Interaction ────────────────────────────────────────────────────────
    // Handlers are stored per map instance, not on the lens object. The lens is
    // a module singleton shared by every canvas on the page, so writing them to
    // `this` means a second canvas overwrites the first one's handlers and
    // unmount then detaches the wrong listeners.
    const handlers = {
      poiClick: (e) => {
        const f = e.features?.[0];
        if (!f) return;
        new maplibregl.Popup({ offset: 12, className: "scoutit-popup" })
          .setLngLat(e.lngLat)
          .setDOMContent(
            buildPopupNode({
              title: f.properties?.name || "Nearby Point",
              titleColor: PAPER_WHITE,
              subtitle: f.properties?.class || f.properties?.subclass || "Amenity",
            })
          )
          .addTo(map);
      },
      listingClick: (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const slug = f.properties?.slug;
        new maplibregl.Popup({ offset: 12, className: "scoutit-popup" })
          .setLngLat(f.geometry.coordinates.slice())
          .setDOMContent(
            buildPopupNode({
              title: f.properties?.title || "ScoutIt Listing",
              titleColor: GOLD,
              href: slug ? `/property/${encodeURIComponent(slug)}` : null,
              hrefLabel: "View intelligence →",
            })
          )
          .addTo(map);
      },
      enter: () => {
        map.getCanvas().style.cursor = "pointer";
      },
      leave: () => {
        map.getCanvas().style.cursor = "";
      },
    };
    this._handlersByMap = this._handlersByMap || new WeakMap();
    this._handlersByMap.set(map, handlers);

    try {
      map.on("click", "carto-pois-circle", handlers.poiClick);
      map.on("click", "nearby-listings-circles", handlers.listingClick);
      map.on("mouseenter", "carto-pois-circle", handlers.enter);
      map.on("mouseleave", "carto-pois-circle", handlers.leave);
      map.on("mouseenter", "nearby-listings-circles", handlers.enter);
      map.on("mouseleave", "nearby-listings-circles", handlers.leave);
    } catch (err) {}
  },

  // Called when the reach arrives after the lens has already mounted.
  setReach(map, isochrone, activeSubLayer = "all") {
    this._reachGeometry = widestReachGeometry(isochrone);
    this.applyVisibility(map, activeSubLayer);
  },

  applyVisibility(map, activeSubLayer) {
    if (!map.getLayer("carto-pois-symbol") || !map.getLayer("carto-pois-circle")) return;
    const group = activeSubLayer && activeSubLayer !== "all" ? activeSubLayer : null;
    const filter = buildPoiFilter(group, this._reachGeometry);
    try {
      map.setFilter("carto-pois-symbol", filter);
      map.setFilter("carto-pois-circle", filter);
    } catch (err) {}
  },

  unmount(map) {
    const handlers = this._handlersByMap?.get(map);
    if (handlers) {
      try {
        map.off("click", "carto-pois-circle", handlers.poiClick);
        map.off("click", "nearby-listings-circles", handlers.listingClick);
        map.off("mouseenter", "carto-pois-circle", handlers.enter);
        map.off("mouseleave", "carto-pois-circle", handlers.leave);
        map.off("mouseenter", "nearby-listings-circles", handlers.enter);
        map.off("mouseleave", "nearby-listings-circles", handlers.leave);
      } catch (e) {}
      this._handlersByMap.delete(map);
    }

    ["nearby-listings-labels", "nearby-listings-circles", "carto-pois-circle", "carto-pois-symbol"].forEach((id) => {
      try {
        if (map.getLayer(id)) map.removeLayer(id);
      } catch (e) {}
    });
    try {
      if (map.getSource("nearby-scoutit-listings")) map.removeSource("nearby-scoutit-listings");
    } catch (e) {}
  },
};

/**
 * The isochrone comes back as bands (5 / 10 / 15 min). The widest one is the
 * whole reachable area — that is the boundary POIs are clipped to.
 */
export function widestReachGeometry(isochrone) {
  const features = isochrone?.features;
  if (!Array.isArray(features) || features.length === 0) return null;

  let widest = null;
  let widestSpan = -Infinity;
  for (const f of features) {
    const g = f?.geometry;
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
    const coords = [];
    const walk = (a) => {
      if (typeof a[0] === "number") coords.push(a);
      else a.forEach(walk);
    };
    walk(g.coordinates);
    if (!coords.length) continue;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    const span = Math.max(...lngs) - Math.min(...lngs) + (Math.max(...lats) - Math.min(...lats));
    if (span > widestSpan) {
      widestSpan = span;
      widest = g;
    }
  }
  return widest;
}

export default locationLens;
