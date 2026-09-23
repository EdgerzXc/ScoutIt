"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MapPin, Radio, Sparkles } from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import DescentBackdrop from "@/components/descent/DescentBackdrop";
import StratosphereTerminal from "@/components/stratosphere/StratosphereTerminal";
import { getSignals } from "@/data/mock/mockArticles";
import {
  COMMUNITY_SIGNALS,
  pipelineArticlesToSignals,
} from "@/lib/communitySignalsAdapter";
import { loadPublicCatalog } from "@/lib/cms/publicCatalog";
import SampleIntelDisclosure from "@/components/intel/SampleIntelDisclosure";
import {
  LIFECYCLE,
  effectiveLifecycle,
  filterByLifecycle,
  isOverdue,
  isPipelineSignal,
  timingLine,
  sortByAttention,
  pipelinePulse,
  liveIntelToSignals,
  mergeLivePipeline,
} from "@/lib/pipelineLifecycle";
import "./stratosphere-layer.css";

const LIFECYCLE_FILTERS = [
  { key: "all", label: "All signals" },
  { key: LIFECYCLE.PLANNED, label: "Planned" },
  { key: LIFECYCLE.CONSTRUCTION, label: "Under construction" },
  { key: LIFECYCLE.OPENING_TODAY, label: "Opening today" },
];

// Lifecycle pill beside the status badge. Renders nothing for signals
// without lifecycle data — most of the feed — so existing rows are
// pixel-identical until a pipeline signal arrives. An overdue record (past
// opening date, still pre-completion) gets the red watch pill instead of
// silently pretending its date never passed.
function LifecycleBadge({ signal }) {
  if (isOverdue(signal)) {
    return <span className="strat-lifecycle-badge is-overdue">Overdue watch</span>;
  }
  const lc = effectiveLifecycle(signal);
  if (!lc) return null;
  return (
    <span className={`strat-lifecycle-badge${lc === LIFECYCLE.OPENING_TODAY ? " is-today" : ""}`}>
      {lc}
    </span>
  );
}

// One-line pulse: the whole pipeline set at a glance. Renders nothing when
// there is no pipeline data, so feeds without supply entries are unchanged.
function PipelinePulse({ pulse }) {
  if (!pulse || pulse.total === 0) return null;
  const parts = [];
  if (pulse.opening > 0) parts.push(`${pulse.opening} opening today`);
  if (pulse.rising > 0) parts.push(`${pulse.rising} rising`);
  if (pulse.planned > 0) parts.push(`${pulse.planned} planned`);
  if (pulse.overdue > 0) parts.push(`${pulse.overdue} overdue watch`);
  return (
    <p className="strat-pipeline-pulse" role="status">
      <span className="strat-pipeline-pulse-label">Pipeline pulse</span>
      <span>{parts.join(" · ")}</span>
      {pulse.sample === "sample" && <span className="strat-pulse-sample">Sample data</span>}
      {pulse.sample === "mixed" && <span className="strat-pulse-sample">Incl. samples</span>}
    </p>
  );
}

/*
 * LAYER 02 - STRATOSPHERE // COMMUNITY SPATIAL RADAR
 *
 * Evolved into ScoutIt's geospatial community demand interface.
 * Visitors can explore the real-time 3D spatial radar terminal (64% 3D map,
 * 36% structured dossiers) or engage the cinematic descent approach.
 */

export default function StratospherePreview() {
  const [viewMode, setViewMode] = useState("RADAR"); // "RADAR" | "DESCENT"
  // Live pipeline intel merges over the mock feed (A-156): lifecycle rows
  // from the CMS join as real records; everything else about this page —
  // mocks included — behaves exactly as before when none exist.
  const [livePipeline, setLivePipeline] = useState([]);
  useEffect(() => {
    let alive = true;
    loadPublicCatalog()
      .then((d) => {
        if (alive) setLivePipeline(liveIntelToSignals(d?.intel || []));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
  const signals = useMemo(
    () => mergeLivePipeline(getSignals(), livePipeline),
    [livePipeline]
  );
  const [lifecycleFilter, setLifecycleFilter] = useState("all");
  // The full feed keeps its existing order (non-pipeline rows are never
  // reshuffled). A lifecycle view sorts by attention: now, nearest dated,
  // sourced, stable — see pipelineLifecycle.sortByAttention.
  const visibleSignals = useMemo(() => {
    const filtered = filterByLifecycle(signals, lifecycleFilter);
    return lifecycleFilter === "all" ? filtered : sortByAttention(filtered);
  }, [signals, lifecycleFilter]);
  const pulse = useMemo(() => pipelinePulse(signals), [signals]);
  // Phase 2: pipeline intel rides the radar as UPCOMING_SUPPLY beacons
  // through the terminal's own `initialSignals` prop — strip, beacons,
  // dossiers, and filters all read that one array, so there is no second
  // source to drift. Bridged ids are `pipeline-` prefixed; community ids
  // are `sig-` prefixed; the two sets cannot collide.
  const radarSignals = useMemo(
    () => [...COMMUNITY_SIGNALS, ...pipelineArticlesToSignals(signals)],
    [signals]
  );

  return (
    <div className="stratosphere-layer">
      {/* The descent backdrop runs when in DESCENT mode so the skydiver
          handover stays intact without competing for WebGL contexts */}
      {viewMode === "DESCENT" && (
        <div className="descent-backdrop" aria-hidden="true">
          <DescentBackdrop />
        </div>
      )}

      <LayerNav
        prev={{ href: "/layer/orbit", label: "Orbit" }}
        next={{ href: "/layer/metropolis", label: "Metropolis" }}
      />

      <main className="strat-main">
        <div className="strat-top-banner">
          <header className="strat-intro">
            <div className="strat-kicker-row">
              <p className="strat-kicker">
                <span className="strat-live-dot" aria-hidden="true" />
                Layer 02 &mdash; Stratosphere &mdash; Community Spatial Radar
              </p>

              <div className="strat-view-toggle" role="group" aria-label="Layer 02 presentation mode">
                <button
                  type="button"
                  className={`strat-toggle-btn ${viewMode === "RADAR" ? "active" : ""}`}
                  onClick={() => setViewMode("RADAR")}
                >
                  <Compass size={12} aria-hidden="true" />
                  <span>Interactive Radar</span>
                </button>
                <button
                  type="button"
                  className={`strat-toggle-btn ${viewMode === "DESCENT" ? "active" : ""}`}
                  onClick={() => setViewMode("DESCENT")}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  <span>Cinematic Descent</span>
                </button>
              </div>
            </div>

            <h1 className="strat-headline">
              The ground shifts. Find what changed near your{" "}
              <span className="strat-headline-accent">space</span>.
            </h1>

            <span className="strat-underline" aria-hidden="true" />
          </header>
        </div>

        {viewMode === "RADAR" ? (
          <div className="strat-radar-wrapper">
            <StratosphereTerminal initialViewMode="SPATIAL" initialSignals={radarSignals} />
          </div>
        ) : (
          <div className="strat-container">
            {/* The preview proper: live signals */}
            <section className="strat-signals" aria-labelledby="strat-signals-title">
              <h2 id="strat-signals-title" className="strat-signals-title">
                <Radio size={13} aria-hidden="true" />
                <span>Moving right now</span>
                <span
                  className="strat-signals-count"
                  aria-label={`${visibleSignals.length} live signals`}
                >
                  {visibleSignals.length}
                </span>
              </h2>

              <PipelinePulse pulse={pulse} />

              <div className="strat-lifecycle-filter" role="group" aria-label="Filter by supply lifecycle">
                {LIFECYCLE_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={lifecycleFilter === f.key}
                    className={`strat-lifecycle-chip${lifecycleFilter === f.key ? " active" : ""}`}
                    onClick={() => setLifecycleFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <ul className="strat-signal-list">
                {visibleSignals.length === 0 && (
                  <li className="strat-signal-empty">
                    Nothing in this stage right now — the rest of the feed is one tap away.
                  </li>
                )}
                {visibleSignals.map((signal, i) => (
                  <li
                    key={signal.slug}
                    className="strat-signal-row"
                    style={{ "--row-index": i }}
                  >
                    <Link href={`/intel/${signal.slug}`} className="strat-signal-link">
                      <span className="strat-signal-index" aria-hidden="true">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="strat-signal-body">
                        <span className="strat-signal-status">
                          {signal.status}
                          {signal.isSample ? <SampleIntelDisclosure compact /> : null}
                          <LifecycleBadge signal={signal} />
                        </span>
                        <span className="strat-signal-title">{signal.title}</span>
                        <span className="strat-signal-meta">
                          <MapPin size={11} aria-hidden="true" />
                          {signal.city}
                          <span className="strat-signal-sep" aria-hidden="true">
                            /
                          </span>
                          <span className="strat-sr-only">, </span>
                          {signal.event}
                          {isPipelineSignal(signal) && (
                            <>
                              <span className="strat-signal-sep" aria-hidden="true">
                                ·
                              </span>
                              <span className="strat-signal-timing">{timingLine(signal)}</span>
                            </>
                          )}
                        </span>
                      </span>

                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Portals into Stratosphere and Metropolis */}
            <nav className="strat-doors" aria-label="Continue into Stratosphere">
              <Link href="/stratosphere" className="strat-door strat-door--primary">
                <span className="strat-door-label">Full Radar Terminal</span>
                <span className="strat-door-sub">Direct workspace view</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link href="/discover" className="strat-door">
                <span className="strat-door-label">See it on the map</span>
                <span className="strat-door-sub">Where it is happening</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>

              <Link href="/intel" className="strat-door">
                <span className="strat-door-label">Read the intel</span>
                <span className="strat-door-sub">What has been written</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </nav>
          </div>
        )}

        <LayerTransition
          nextNum="03"
          nextName="Metropolis"
          nextHref="/layer/metropolis"
          teaser="Touch down. Walk the directory of verified spaces across the archipelago."
        />
      </main>
    </div>
  );
}

