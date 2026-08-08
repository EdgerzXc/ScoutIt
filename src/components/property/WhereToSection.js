"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// WHERE TO? V2 — lifestyle POI layers  (NEW_IDEAS.md §3)
//
// Chapter 04 previously rendered only hand-keyed CMS entries, which meant
// almost every listing showed "[ LOCATION DETAILS N/A ]". This pulls real
// OpenStreetMap data so walkability is answered automatically.
//
// HONEST BLANK RULE, three distinct states — the wording matters:
//   • lookup failed       → "couldn't reach the map network, try again"
//   • lookup ok, 0 nodes  → "NO VERIFIED NODES WITHIN RADIUS" (a real fact
//                            about the location, and a legitimate signal)
//   • lookup ok, n nodes  → the list
// Collapsing these into one message would turn an outage into a false claim
// about the neighbourhood.
//
// MOBILE FIRST: layer chips scroll horizontally, rows are full-width, and
// nothing depends on hover. The single 700px query is the desktop upgrade.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "var(--font-mono)";

// 900 m, matching DEFAULT_RADIUS_M in lib/overpassIntel.js. 1200 m throttled
// repeatedly against live Overpass (15 filters × a large area); 900 m returned
// 25 POIs reliably. Still roughly an 11-minute walk. If these two numbers ever
// disagree again, the component wins and the server default is dead code.
export default function WhereToSection({ lat, lng, radiusM = 900, onIsochrone, onPoisLoaded }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeLayer, setActiveLayer] = useState("all");

  const load = useCallback(async () => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`/api/whereto?lat=${lat}&lon=${lng}&radius=${radiusM}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setFailed(true);
        return;
      }
      setData(json);
      // Hand the reachability polygons up so the map can overlay them.
      if (json.isochrone) onIsochrone?.(json.isochrone, json.contours);
      // Hand all Lifestyle Intel POIs up so the Tactical Map renders white dot markers.
      if (json.layers && Array.isArray(json.layers)) {
        const allPois = json.layers.flatMap(layer =>
          (layer.items || []).map(item => ({
            ...item,
            layerId: layer.id,
            layerLabel: layer.label,
            category: item.type || layer.label,
            distance: item.distance || (item.meters ? `${item.meters} m` : ""),
            lat: item.lat,
            lng: item.lon ?? item.lng
          }))
        );
        onPoisLoaded?.(allPois);
      }
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusM, onIsochrone, onPoisLoaded]);

  useEffect(() => { load(); }, [load]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const layers = data?.layers || [];
  const visible = activeLayer === "all" ? layers : layers.filter((l) => l.id === activeLayer);
  const total = data?.totalPois ?? 0;
  // null when the server couldn't measure it — see the render block below.
  const walkability = data?.walkability || null;
  const radiusLabel = data?.radiusM ? `${(data.radiusM / 1000).toFixed(1)} km` : "1.2 km";

  return (
    <section className="wt-root">
      <style jsx global>{`
        /* ── MOBILE FIRST ─────────────────────────────────────────────── */
        .wt-root { margin-bottom: 28px; }
        .wt-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 6px;
        }
        .wt-title {
          font-family: ${MONO};
          font-size: 10px;
          color: var(--accent, #E8AE3C);
          letter-spacing: 0.2em;
          text-transform: uppercase;
        }
        .wt-count {
          font-family: ${MONO};
          font-size: 9px;
          color: #6a6a6a;
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        .wt-sub {
          font-family: var(--font-body);
          font-size: 12.5px;
          line-height: 1.6;
          color: #8a8a8a;
          margin: 0 0 16px;
        }

        /* Layer chips — horizontal scroll on phone, never squeezed */
        .wt-chips {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 3px;
          margin-bottom: 16px;
        }
        .wt-chips::-webkit-scrollbar { display: none; }
        .wt-chip {
          flex: 0 0 auto;
          min-height: 36px;
          padding: 0 13px;
          background: transparent;
          border: 0.5px solid #262626;
          border-radius: 3px;
          color: #c8c8c8;
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .wt-chip.active {
          border-color: var(--accent-muted, #6E531A);
          color: var(--accent, #E8AE3C);
          background: rgba(232, 174, 60, 0.06);
        }
        .wt-chip:disabled { opacity: 0.3; cursor: not-allowed; }

        .wt-layer { margin-bottom: 22px; }
        .wt-layer__head {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #1e1e1e;
          margin-bottom: 4px;
        }
        .wt-layer__label {
          font-family: ${MONO};
          font-size: 9.5px;
          color: #c8c8c8;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .wt-layer__n {
          font-family: ${MONO};
          font-size: 9px;
          color: #4a4a4a;
          margin-left: auto;
        }

        .wt-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid #161616;
        }
        .wt-row:last-child { border-bottom: none; }
        .wt-row__main { min-width: 0; }
        .wt-row__name {
          font-family: var(--font-body);
        /* Group within a layer */
        .wt-group { margin-top: 10px; }
        .wt-group__label {
          font-family: ${MONO};
          font-size: 8.5px;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .wt-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 7px;
        }
        @media (max-width: 480px) {
          .wt-grid { grid-template-columns: 1fr; }
        }

        .wt-card {
          display: flex;
          flex-direction: column;
          padding: 10px 11px;
          background: var(--surface);
          border: 0.5px solid var(--border-solid);
          border-radius: 2px;
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease, background-color 0.15s ease, transform 0.15s ease;
        }
        .wt-card:hover {
          border-color: var(--accent-muted, #6E531A);
          background: var(--surface2);
          transform: translateY(-1px);
        }
        .wt-card:active {
          transform: scale(0.98);
        }
        .wt-card__top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 6px;
        }
        .wt-card__name {
          font-family: var(--font-body, sans-serif);
          font-size: 11.5px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .wt-card__dist {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.08em;
          color: var(--accent, #E8AE3C);
          white-space: nowrap;
        }
        .wt-card__meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 9.5px;
          color: var(--text-secondary);
          letter-spacing: 0.04em;
          margin-top: 3px;
        }
        .wt-card__cat { text-transform: uppercase; font-family: ${MONO}; font-size: 8.5px; color: var(--text-muted); }
        .wt-card__desc {
          font-size: 9.5px;
          color: var(--text-secondary);
          letter-spacing: 0.06em;
          margin-top: 3px;
        }

        .wt-blank {
          padding: 22px 16px;
          background: var(--surface2);
          border: 0.5px dashed var(--border-mid);
          border-radius: 2px;
          text-align: center;
          font-family: ${MONO};
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 0.12em;
          line-height: 1.8;
        }
        .wt-blank--layer {
          padding: 14px;
          font-size: 9px;
          text-align: left;
          letter-spacing: 0.1em;
        }
        .wt-retry {
          margin-top: 12px;
          min-height: 40px;
          padding: 0 18px;
          background: transparent;
          border: 0.5px solid var(--border-solid);
          border-radius: 3px;
          color: var(--text-secondary);
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }
        /* ── WALKABILITY (W10 · WALK-01) ────────────────────────────── */
        .wt-walk {
          display: flex;
          align-items: baseline;
          gap: 12px;
          padding: 14px 0 15px;
          border-top: 1px solid #1e1e1e;
          border-bottom: 1px solid #1e1e1e;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .wt-walk__score {
          font-family: var(--font-body);
          font-size: 30px;
          line-height: 1;
          color: #f0ede8;
          font-weight: 400;
        }
        .wt-walk__of {
          font-family: ${MONO};
          font-size: 9px;
          color: #4a4a4a;
          letter-spacing: 0.1em;
          margin-left: -7px;
        }
        .wt-walk__main { min-width: 0; flex: 1; }
        .wt-walk__label {
          font-family: ${MONO};
          font-size: 9.5px;
          color: #c8c8c8;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 1.5;
        }
        .wt-walk__note {
          font-family: var(--font-body);
          font-size: 12px;
          line-height: 1.6;
          color: #6a6a6a;
          margin-top: 4px;
        }
        /* Low confidence is stated, not styled away. A score computed from
           almost no nodes is still a number, and a number the reader trusts
           more than it deserves is worse than no number at all. */
        .wt-walk__flag {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #e8c84a;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 5px;
        }

        .wt-source {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #4a4a4a;
          letter-spacing: 0.1em;
          margin-top: 14px;
          line-height: 1.7;
        }

        /* ── DESKTOP ──────────────────────────────────────────────────── */
        @media (min-width: 700px) {
          .wt-chips { overflow-x: visible; flex-wrap: wrap; }
          .wt-layers-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 0 32px;
          }
          .wt-row__name { font-size: 14.5px; }
        }
      `}</style>

      <div className="wt-head">
        <div className="wt-title">Lifestyle Intel</div>
        {data && <div className="wt-count">{total} within {radiusLabel}</div>}
      </div>
      <p className="wt-sub">
        Live OpenStreetMap data around this address. Distances are straight-line;
        walk times assume a normal urban pace.
      </p>

      {/* ── WALKABILITY (W10 · WALK-01) ──────────────────────────────────
          'calculateWalkabilityScore()' existed with zero callers until now
          (§51). Rendered ONLY when the server actually returned one — the
          route sends null on a failed lookup rather than the function's
          neutral 50, so an Overpass outage can never render as "MODERATE
          PEDESTRIAN ACCESS". Nothing here is shown while loading or failed:
          those states are already spoken for below. */}
      {!loading && !failed && walkability && (
        <div className="wt-walk">
          <div>
            <span className="wt-walk__score">{walkability.score}</span>
            <span className="wt-walk__of">/100</span>
          </div>
          <div className="wt-walk__main">
            <div className="wt-walk__label">{walkability.label}</div>
            <div className="wt-walk__note">
              Scored from the {total} verified place{total === 1 ? "" : "s"} within{" "}
              {radiusLabel}, weighted by how close the nearest few are.
            </div>
            {walkability.confidence === "low" && (
              <div className="wt-walk__flag">
                ⚠ Low confidence — too few mapped places nearby to be sure
              </div>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="wt-blank">Scanning the neighbourhood…</div>
      ) : failed ? (
        // Lookup FAILED — say so. Never imply the area is empty.
        <div className="wt-blank">
          [ COULDN&apos;T REACH THE MAP NETWORK ]
          <br />
          <button className="wt-retry" onClick={load}>Retry</button>
        </div>
      ) : !data?.poiOk ? (
        <div className="wt-blank">
          [ LIFESTYLE DATA TEMPORARILY UNAVAILABLE ]
          <br />
          <button className="wt-retry" onClick={load}>Retry</button>
        </div>
      ) : total === 0 ? (
        // Lookup SUCCEEDED and found nothing. That is a real, useful fact.
        <div className="wt-blank">
          [ N/A — NO VERIFIED NODES WITHIN {radiusLabel} RADIUS ]
        </div>
      ) : (
        <>
          <div className="wt-chips">
            <button
              className={`wt-chip ${activeLayer === "all" ? "active" : ""}`}
              onClick={() => setActiveLayer("all")}
            >
              All ({total})
            </button>
            {layers.map((l) => (
              <button
                key={l.id}
                className={`wt-chip ${activeLayer === l.id ? "active" : ""}`}
                onClick={() => setActiveLayer(l.id)}
                disabled={l.count === 0}
              >
                {l.icon} {l.label} ({l.count})
              </button>
            ))}
          </div>

          <div className={activeLayer === "all" ? "wt-layers-grid" : ""}>
            {visible.map((layer) => (
              <div className="wt-layer" key={layer.id}>
                <div className="wt-layer__head">
                  <span aria-hidden="true">{layer.icon}</span>
                  <span className="wt-layer__label">{layer.label}</span>
                  <span className="wt-layer__n">{layer.count}</span>
                </div>

                {layer.count === 0 ? (
                  <div className="wt-blank wt-blank--layer">
                    N/A — none within {radiusLabel}
                  </div>
                ) : (
                  layer.items.map((item) => (
                    <div className="wt-row" key={item.id}>
                      <div className="wt-row__main">
                        <div className="wt-row__name">{item.name}</div>
                        <div className="wt-row__type">{item.type}</div>
                      </div>
                      <div className="wt-row__dist">
                        <div className="wt-row__m">{item.distance}</div>
                        <div className="wt-row__walk">{item.walkLabel}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>

          <div className="wt-source">
            Source: OpenStreetMap contributors (ODbL)
            {data?.contours?.length ? " · Reachability by Mapbox" : ""}
          </div>
        </>
      )}
    </section>
  );
}
