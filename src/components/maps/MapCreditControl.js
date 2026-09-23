import "@/components/maps/map-credit.css";

/**
 * The map credit line — drawn by us, out of DOM nodes.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 * MapLibre's own `AttributionControl` renders the credit like this:
 *
 *   this._innerContainer.innerHTML = DOM.sanitize(attribHTML);
 *
 * `DOM.sanitize` is the function CVE-2026-85061 (CVSS 10.0) bypasses, and
 * that line is its ONLY caller inside maplibre-gl 5.24.0 — U-028 had already
 * removed the popup sink, so the attribution control was the last one left.
 *
 * `attribHTML` is not ours to trust. It is fetched at runtime from CARTO's
 * TileJSON and arrives as live markup (`&copy; <a href=...>CARTO</a>, ...`),
 * so remote third-party HTML was being pushed through a known-broken sanitizer
 * into `innerHTML` on eight maps.
 *
 * There is nothing to upgrade to. 5.24.0 is the end of the 5.x line and the fix
 * ships only in 6.4.1+, whose major rewrite blanked every map surface in this
 * repo. So the sink is REMOVED rather than patched: every map passes
 * `attributionControl: false` and mounts this instead. The vulnerable function
 * becomes uncallable here, which is a stronger claim than "unreached" — it is
 * what `mapAttributionSink.test.js` pins and what lets the advisory be
 * dismissed honestly.
 *
 * ── WHY THE CREDIT STAYS ────────────────────────────────────────────────────
 * Switching the control off must not drop the credit. OpenStreetMap's data is
 * free *on condition* that it is attributed (ODbL), and CARTO's terms ask the
 * same, so the text below is a licence obligation, not decoration. Removing it
 * to silence a security warning would trade one problem for a worse one.
 */

// Kept identical to the destinations CARTO's own TileJSON pointed at, so this
// swap changes how the credit is BUILT and not what it claims. (OSM's own
// guidance prefers /copyright over /about — a content change for the owner to
// make deliberately, not a side effect of a security fix.)
const CARTO_HREF = "https://carto.com/about-carto/";
const OSM_HREF = "https://www.openstreetmap.org/about/";

function creditLink(href, label) {
  const link = document.createElement("a");
  link.className = "map-credit__link";
  link.href = href;
  link.target = "_blank";
  // noopener closes the reverse-tab-nabbing hole that bare target=_blank opens;
  // noreferrer keeps the visitor's current property page out of the referer.
  link.rel = "noopener noreferrer";
  link.textContent = label;
  return link;
}

export default class MapCreditControl {
  onAdd(map) {
    this._map = map;

    const container = document.createElement("div");
    container.className = "map-credit";

    // Every piece below is a node. Nothing here is ever parsed as markup, which
    // is the whole point of the file — see the docblock.
    container.appendChild(document.createTextNode("© "));
    container.appendChild(creditLink(CARTO_HREF, "CARTO"));
    container.appendChild(document.createTextNode(", © "));
    container.appendChild(creditLink(OSM_HREF, "OpenStreetMap"));
    // "contributors" is part of the required OSM credit, not a flourish.
    container.appendChild(document.createTextNode(" contributors"));

    this._container = container;
    return container;
  }

  onRemove() {
    this._container?.remove();
    this._container = null;
    this._map = null;
  }

  // Bottom-right is where MapLibre put it, so existing map layouts keep their
  // corner budget and nothing else has to move.
  getDefaultPosition() {
    return "bottom-right";
  }
}
