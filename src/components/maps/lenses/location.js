// Location / Tactical Map Lens for Spatial Canvas
//
// Real-world places come from the `poi` source-layer of the CARTO vector tiles
// the map already downloads — the same trick as the building heights. No extra
// request, no new service. Measured: one Makati tile carries 4,857 POI features
// with class / subclass / name / rank.
import maplibregl from "maplibre-gl";
import { registerMapIcons, iconImageExpression } from "@/components/maps/mapIcons";

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

    // Clipped to the pedestrian band — see poiReachGeometry for why the widest
    // band is the wrong boundary for shops.
    const reachGeometry = poiReachGeometry(isochrone);
    this._reachGeometry = reachGeometry;

    const baseFilter = buildPoiFilter(null, reachGeometry);

    registerMapIcons(map, { world: SOFT_GREY, ours: GOLD });

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
            "icon-image": iconImageExpression("world", GROUP_CLASSES),
            "icon-size": ["interpolate", ["linear"], ["zoom"], 14, 0.72, 17, 0.95],
            // The icon is the anchor; the name hangs beneath it and is allowed
            // to drop out when space is tight, so a dense block still reads as
            // a field of marks rather than a wall of text.
            "icon-allow-overlap": false,
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular", "Noto Sans Regular"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 14, 9, 16, 10.5, 18, 12],
            "text-offset": [0, 1.15],
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
            "icon-opacity": 0.9,
          },
        },
        firstLabelLayerId
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
      // One symbol layer, not a circle plus a label: a listing's diamond and
      // its name are one object and must collide as one.
      map.addLayer({
        id: "nearby-listings-symbol",
        type: "symbol",
        source: "nearby-scoutit-listings",
        layout: {
          "icon-image": "icon-listing-ours",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 13, 0.8, 17, 1.05],
          // Ours always wins a collision against the world's amenities.
          "icon-allow-overlap": true,
          "text-allow-overlap": false,
          "text-field": ["get", "title"],
          "text-font": ["Open Sans Bold", "Noto Sans Regular"],
          "text-size": 10,
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-optional": true,
          "symbol-sort-key": 0,
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
    //
    // Hit-testing is done against a padded box rather than by binding to the
    // layers directly. A 22px icon is a 22px target, and a fingertip needs 44.
    // Querying a box around the tap gives the larger target without drawing
    // anything bigger, so the map stays visually restrained and still takes a
    // thumb. Listings are searched first so ours always wins a tie.
    const TAP_PAD = 22;
    const featureAt = (point) => {
      const box = [
        [point.x - TAP_PAD, point.y - TAP_PAD],
        [point.x + TAP_PAD, point.y + TAP_PAD],
      ];
      const layers = ["nearby-listings-symbol", "carto-pois-symbol"].filter((id) => map.getLayer(id));
      if (!layers.length) return null;
      for (const layer of layers) {
        const hit = map.queryRenderedFeatures(box, { layers: [layer] })[0];
        if (hit) return { hit, layer };
      }
      return null;
    };

    const handlers = {
      click: (e) => {
        const found = featureAt(e.point);
        if (!found) return;
        const { hit, layer } = found;
        const isListing = layer === "nearby-listings-symbol";
        const coords = hit.geometry?.type === "Point" ? hit.geometry.coordinates.slice() : e.lngLat;
        const slug = hit.properties?.slug;

        new maplibregl.Popup({ offset: 14, className: "scoutit-popup", maxWidth: "240px" })
          .setLngLat(coords)
          .setDOMContent(
            isListing
              ? buildPopupNode({
                  title: hit.properties?.title || "ScoutIt Listing",
                  titleColor: GOLD,
                  subtitle: "ScoutIt listing",
                  href: slug ? `/property/${encodeURIComponent(slug)}` : null,
                  hrefLabel: "View intelligence →",
                })
              : buildPopupNode({
                  title: hit.properties?.name || "Nearby place",
                  titleColor: PAPER_WHITE,
                  subtitle: String(hit.properties?.class || hit.properties?.subclass || "Amenity").replace(/_/g, " "),
                })
          )
          .addTo(map);
      },
      move: (e) => {
        map.getCanvas().style.cursor = featureAt(e.point) ? "pointer" : "";
      },
    };
    this._handlersByMap = this._handlersByMap || new WeakMap();
    this._handlersByMap.set(map, handlers);

    try {
      map.on("click", handlers.click);
      map.on("mousemove", handlers.move);
    } catch (err) {}
  },

  // Called when the reach arrives after the lens has already mounted.
  setReach(map, isochrone, activeSubLayer = "all") {
    this._reachGeometry = poiReachGeometry(isochrone);
    this.applyVisibility(map, activeSubLayer);
  },

  applyVisibility(map, activeSubLayer) {
    if (!map.getLayer("carto-pois-symbol")) return;
    const group = activeSubLayer && activeSubLayer !== "all" ? activeSubLayer : null;
    try {
      map.setFilter("carto-pois-symbol", buildPoiFilter(group, this._reachGeometry));
    } catch (err) {}
  },

  unmount(map) {
    const handlers = this._handlersByMap?.get(map);
    if (handlers) {
      try {
        map.off("click", handlers.click);
        map.off("mousemove", handlers.move);
        map.getCanvas().style.cursor = "";
      } catch (e) {}
      this._handlersByMap.delete(map);
    }

    ["nearby-listings-symbol", "carto-pois-symbol"].forEach((id) => {
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
 * The boundary nearby places are clipped to.
 *
 * The reach comes back as bands, and they are not the same kind of thing: a
 * 5-minute WALK and a 10-minute DRIVE. Measured over Ortigas the walk band is
 * 0.76km across and the drive band 4.46km — nearly six times wider. Clipping
 * cafes and pharmacies to a driving band would answer a question nobody asked
 * ("what could I drive to") and put several thousand places on the map.
 *
 * So the tightest band wins: that is the pedestrian reach, and "what is around
 * it that I would actually use" is a walking question. The wider band is still
 * drawn — it is real, and it says something about access — it just does not
 * govern which shops appear.
 *
 * With the distance-circle fallback there is only one band, so this returns it.
 */
export function poiReachGeometry(isochrone) {
  const features = isochrone?.features;
  if (!Array.isArray(features) || features.length === 0) return null;

  const spanOf = (g) => {
    const coords = [];
    const walk = (a) => {
      if (typeof a[0] === "number") coords.push(a);
      else a.forEach(walk);
    };
    walk(g.coordinates);
    if (!coords.length) return null;
    const lngs = coords.map((c) => c[0]);
    const lats = coords.map((c) => c[1]);
    return Math.max(...lngs) - Math.min(...lngs) + (Math.max(...lats) - Math.min(...lats));
  };

  let tightest = null;
  let tightestSpan = Infinity;
  for (const f of features) {
    const g = f?.geometry;
    if (!g || (g.type !== "Polygon" && g.type !== "MultiPolygon")) continue;
    const span = spanOf(g);
    if (span === null) continue;
    if (span < tightestSpan) {
      tightestSpan = span;
      tightest = g;
    }
  }
  return tightest;
}

export default locationLens;
