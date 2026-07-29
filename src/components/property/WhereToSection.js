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

const MONO = "'Courier New',monospace";

export default function WhereToSection({ lat, lng, radiusM = 1200, onIsochrone }) {
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
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusM, onIsochrone]);

  useEffect(() => { load(); }, [load]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const layers = data?.layers || [];
  const visible = activeLayer === "all" ? layers : layers.filter((l) => l.id === activeLayer);
  const total = data?.totalPois ?? 0;
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
          font-family: Georgia, serif;
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
          font-family: Georgia, serif;
          font-size: 14px;
          color: #f0ede8;
          line-height: 1.35;
          overflow-wrap: anywhere;
        }
        .wt-row__type {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #6a6a6a;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-top: 3px;
        }
        .wt-row__dist {
          flex: 0 0 auto;
          text-align: right;
        }
        .wt-row__m {
          font-family: ${MONO};
          font-size: 11px;
          color: #c8c8c8;
          letter-spacing: 0.06em;
        }
        .wt-row__walk {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #6a6a6a;
          letter-spacing: 0.06em;
          margin-top: 3px;
        }

        .wt-blank {
          padding: 22px 16px;
          background: #161616;
          border: 0.5px dashed #262626;
          border-radius: 2px;
          text-align: center;
          font-family: ${MONO};
          font-size: 10px;
          color: #8a8a8a;
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
          border: 0.5px solid #262626;
          border-radius: 3px;
          color: #c8c8c8;
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
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
