"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  ArrowRight, 
  Radio, 
  Compass, 
  BookOpen, 
  Building2, 
  MapPin, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  Crosshair, 
  Minimize2, 
  CheckCircle2, 
  ArrowUpRight, 
  Info, 
  ChevronDown, 
  Search, 
  X, 
  Layers 
} from "lucide-react";

import LayerNav from "@/components/descent/LayerNav";
import LayerTransition from "@/components/descent/LayerTransition";
import StratosphereRadarMap from "@/components/intel/StratosphereRadarMap";
import ActiveDetourHud from "@/components/intel/ActiveDetourHud";
import FulfilmentTerminal from "@/components/intel/FulfilmentTerminal";
import { SPATIAL_SIGNALS, getSignalBySlug } from "@/lib/signalsData";

// ── 3 CORE INTELLIGENCE SECTORS ─────────────────────────────────
const INTEL_CHANNELS = [
  { id: "all", label: "All Sectors", icon: Layers },
  { id: "zoning", label: "Zoning & Rules", icon: ShieldCheck },
  { id: "transit", label: "Infrastructure", icon: Compass },
  { id: "market", label: "Market Yields", icon: TrendingUp }
];

const TERRITORY_CORRIDORS = [
  "All",
  "Makati CBD",
  "BGC & Taguig",
  "Manila Bay",
  "Siargao",
  "Metro Cebu"
];

// ── SEVERITY COLOR MAP ──────────────────────────────────────────
const SEVERITY_COLORS = {
  high: "linear-gradient(90deg, #e8644a 0%, #E8AE3C 100%)",
  moderate: "linear-gradient(90deg, #E8AE3C 0%, #F7C64E 100%)",
  positive: "linear-gradient(90deg, #4caf7d 0%, #6dd5a0 100%)",
};

// ── SVG PROGRESS RING ─────────────────────────────────────────
function ProgressRing({ current, total }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const progress = (current / total) * circumference;
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="s2-progress-ring">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke="var(--accent)" strokeWidth="2.5"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
        style={{ fill: "var(--accent)", fontSize: "11px", fontFamily: "var(--font-mono)", fontWeight: 700 }}>
        {current}/{total}
      </text>
    </svg>
  );
}

export default function StratosphereLayer() {
  const router = useRouter();
  
  // ── WORKBENCH STATE ──────────────────────────────────────────
  const [activeSignalId, setActiveSignalId] = useState("sig-makati-leed");
  const [investigationMode, setInvestigationMode] = useState(false);
  const [activeChannel, setActiveChannel] = useState("all");
  const [activeTerritory, setActiveTerritory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChapter, setActiveChapter] = useState(1);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [showSourcesPopover, setShowSourcesPopover] = useState(false);
  const [mobileSection, setMobileSection] = useState("radar");

  // ── CURIOSITY LOOP / DETOUR STATE ─────────────────────────────
  const [fromProperty, setFromProperty] = useState(null);
  const [fromDoor, setFromDoor] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const prop = params.get("fromProperty");
    const sig = params.get("signal");
    const door = params.get("door");
    if (prop) {
      setFromProperty(prop);
      setInvestigationMode(true);
    }
    if (door) {
      setFromDoor(door);
    }
    if (sig) {
      const matched = SPATIAL_SIGNALS.find(s => s.slug === sig || s.id === sig);
      if (matched) {
        setActiveSignalId(matched.id);
        setInvestigationMode(true);
      }
    }
  }, []);

  const totalChapters = 8;

  // Filter Signals by Channel, Territory & Active Search Query
  const filteredSignals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return SPATIAL_SIGNALS.filter(sig => {
      const matchChannel = activeChannel === "all" || sig.channel === activeChannel;
      const matchTerritory = activeTerritory === "All" || 
        sig.region.toLowerCase().includes(activeTerritory.toLowerCase()) || 
        sig.location.toLowerCase().includes(activeTerritory.toLowerCase());
      const matchSearch = !q || 
        sig.title.toLowerCase().includes(q) ||
        sig.location.toLowerCase().includes(q) ||
        sig.corridorName.toLowerCase().includes(q) ||
        sig.searchTerms.some(t => t.toLowerCase().includes(q)) ||
        sig.affectedSpaces.some(p => p.title.toLowerCase().includes(q));

      return matchChannel && matchTerritory && matchSearch;
    });
  }, [activeChannel, activeTerritory, searchQuery]);

  const currentSignal = useMemo(() => {
    return SPATIAL_SIGNALS.find(s => s.id === activeSignalId) || SPATIAL_SIGNALS[0];
  }, [activeSignalId]);

  // Find if origin property is in this signal's affected spaces
  const targetMatchedSpace = useMemo(() => {
    if (!fromProperty || !currentSignal?.affectedSpaces) return null;
    return currentSignal.affectedSpaces.find(
      sp => (sp.propertySlug || sp.slug || "").toLowerCase() === fromProperty.toLowerCase()
    );
  }, [fromProperty, currentSignal]);

  useEffect(() => {
    if (filteredSignals.length > 0) {
      if (!filteredSignals.some(s => s.id === activeSignalId)) {
        setActiveSignalId(filteredSignals[0].id);
      }
    }
  }, [filteredSignals, activeSignalId]);

  const scrollToChapter = (chapterNum) => {
    setActiveChapter(chapterNum);
    const el = document.getElementById(`chapter-${chapterNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`s2-page ${investigationMode ? "s2-investigation-active" : "s2-overview-active"}`}>
      
      {/* ── LAYER NAV ── */}
      <LayerNav 
        prev={{ href: "/layer/orbit", label: "Orbit" }} 
        next={{ href: "/layer/metropolis", label: "Metropolis" }} 
      />

      {/* ── ACTIVE DETOUR HUD (WHEN ARRIVING FROM A PROPERTY CHAPTER) ── */}
      {fromProperty && (
        <ActiveDetourHud
          fromProperty={fromProperty}
          propertyTitle={targetMatchedSpace?.title || fromProperty}
          door={fromDoor}
          relationReason={targetMatchedSpace?.relationReason}
        />
      )}

      {/* ── MAIN ── */}
      <main className="s2-main">
        <div className="s2-container">

          {/* ── HEADER (Glassmorphism, simplified) ── */}
          <header className="s2-header">
            <div className="s2-header-inner">
              <div className="s2-header-left">
                <h1 className="s2-title">
                  Spatial Intelligence<span className="s2-title-accent"> & Investigation</span>
                </h1>
                <p className="s2-subtitle">
                  Verified signals. Building exposure. Corridor analysis.
                </p>
              </div>
              <div className="s2-header-badge">
                <span className="s2-badge-dot" />
                <span>Verified</span>
              </div>
            </div>
          </header>

          {/* ── SEARCH & FILTERS ── */}
          <section className="s2-filters" aria-label="Search and filter signals">
            <div className="s2-search-wrap">
              <Search size={15} className="s2-search-icon" />
              <input
                type="text"
                className="s2-search-input"
                placeholder="Search building, corridor, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="s2-search-clear" onClick={() => setSearchQuery("")}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="s2-filter-row">
              <div className="s2-channels">
                {INTEL_CHANNELS.map(ch => {
                  const Icon = ch.icon;
                  const active = activeChannel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      className={`s2-channel-pill ${active ? "active" : ""}`}
                      onClick={() => setActiveChannel(ch.id)}
                    >
                      <Icon size={13} />
                      <span>{ch.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="s2-corridors">
                {TERRITORY_CORRIDORS.map(t => (
                  <button
                    key={t}
                    type="button"
                    className={`s2-corridor-pill ${activeTerritory === t ? "active" : ""}`}
                    onClick={() => setActiveTerritory(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── MOBILE TABS ── */}
          <div className="s2-mobile-tabs" role="tablist">
            <button type="button" className={`s2-mob-tab ${mobileSection === "radar" ? "active" : ""}`} onClick={() => setMobileSection("radar")}>
              <Compass size={13} /> Radar
            </button>
            <button type="button" className={`s2-mob-tab ${mobileSection === "brief" ? "active" : ""}`} onClick={() => setMobileSection("brief")}>
              <FileText size={13} /> Brief
            </button>
            <button type="button" className={`s2-mob-tab ${mobileSection === "investigation" ? "active" : ""}`} onClick={() => { setMobileSection("investigation"); setInvestigationMode(true); }}>
              <Sparkles size={13} /> Investigate
            </button>
          </div>

          {/* ── GRID ── */}
          <div className="s2-grid">

            {/* ════ LEFT COLUMN ════ */}
            {investigationMode ? (
              <aside className="s2-rail" aria-label="Investigation navigation">
                <button type="button" className="s2-rail-back" onClick={() => { setInvestigationMode(false); setMobileSection("brief"); }}>
                  <Minimize2 size={13} />
                  <span>Back</span>
                </button>

                <ProgressRing current={activeChapter} total={totalChapters} />

                <nav className="s2-rail-chapters" aria-label="Chapters">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(ch => (
                    <button
                      key={ch}
                      type="button"
                      className={`s2-rail-ch ${activeChapter === ch ? "active" : ""}`}
                      onClick={() => scrollToChapter(ch)}
                    >
                      {String(ch).padStart(2, "0")}
                    </button>
                  ))}
                </nav>
              </aside>
            ) : (
              <aside className={`s2-left ${mobileSection === "radar" ? "s2-mob-visible" : ""}`}>
                
                {/* Radar Map */}
                <section className="s2-radar-card">
                  <div className="s2-card-head">
                    <span className="s2-card-label">
                      <Crosshair size={12} />
                      Radar — {currentSignal.corridorName}
                    </span>
                    <span className="s2-live-tag">Live</span>
                  </div>
                  <StratosphereRadarMap
                    currentSignal={currentSignal}
                    affectedSpaces={currentSignal.affectedSpaces}
                    hoveredPropertyId={hoveredPropertyId}
                    onSelectProperty={(prop) => router.push(`/property/${prop.slug}`)}
                  />
                </section>

                {/* Signal Feed */}
                <section className="s2-signal-card">
                  <div className="s2-card-head">
                    <span className="s2-card-label">
                      <Radio size={12} />
                      Signals ({filteredSignals.length})
                    </span>
                  </div>

                  <div className="s2-signal-list">
                    {filteredSignals.length === 0 ? (
                      <div className="s2-empty">
                        <p>No results for &ldquo;{searchQuery}&rdquo;</p>
                        <button type="button" onClick={() => { setSearchQuery(""); setActiveChannel("all"); }} className="s2-reset-link">
                          Reset filters
                        </button>
                      </div>
                    ) : (
                      filteredSignals.map(sig => {
                        const isSelected = sig.id === currentSignal.id;
                        return (
                          <article
                            key={sig.id}
                            className={`s2-signal-item ${isSelected ? "selected" : ""}`}
                            onClick={() => { setActiveSignalId(sig.id); setMobileSection("brief"); }}
                            tabIndex={0}
                            role="button"
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveSignalId(sig.id); setMobileSection("brief"); } }}
                          >
                            {/* Severity heat bar */}
                            <div className="s2-heat-bar" style={{ background: SEVERITY_COLORS[sig.severity] || SEVERITY_COLORS.moderate }} />
                            
                            <div className="s2-signal-content">
                              <div className="s2-signal-top">
                                <span className="s2-signal-cat">{sig.channel === "zoning" ? "Zoning" : sig.channel === "transit" ? "Infrastructure" : "Market"}</span>
                                <span className="s2-signal-status">{sig.statusBadge}</span>
                              </div>
                              <h3 className="s2-signal-title">{sig.title}</h3>
                              <div className="s2-signal-meta">
                                <span><MapPin size={10} /> {sig.location}</span>
                                <span><Building2 size={10} /> {sig.summary.affectedCount} spaces</span>
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </section>
              </aside>
            )}

            {/* ════ RIGHT COLUMN ════ */}
            <section className={`s2-right ${mobileSection !== "radar" ? "s2-mob-visible" : ""}`}>
              
              {!investigationMode ? (
                /* ── INTELLIGENCE BRIEF ── */
                <article className="s2-brief">
                  
                  {/* Meta chips */}
                  <div className="s2-brief-meta">
                    <span className="s2-chip-primary">{currentSignal.channel === "zoning" ? "Zoning & Regulatory" : currentSignal.channel === "transit" ? "Infrastructure & Transit" : "Market Trends"}</span>
                    <span className="s2-chip-neutral"><MapPin size={10} /> {currentSignal.location}</span>
                    <span className="s2-chip-neutral"><ShieldCheck size={10} /> Verified</span>
                  </div>

                  {/* Headline */}
                  <h2 className="s2-brief-title">{currentSignal.title}</h2>
                  
                  {/* Provenance */}
                  <div className="s2-provenance">
                    <div className="s2-provenance-left">
                      <ShieldCheck size={12} />
                      <span>{currentSignal.investigation.evidenceSources.length} verified sources · {currentSignal.confidence.replace("% CONFIDENCE", "%")}</span>
                    </div>
                    <button
                      type="button"
                      className={`s2-src-toggle ${showSourcesPopover ? "open" : ""}`}
                      onClick={() => setShowSourcesPopover(!showSourcesPopover)}
                    >
                      {showSourcesPopover ? "Hide" : "Sources"}
                      <ChevronDown size={11} />
                    </button>
                  </div>

                  {showSourcesPopover && (
                    <div className="s2-sources-drawer">
                      {currentSignal.investigation.evidenceSources.map((src, i) => (
                        <div key={i} className="s2-source-row">
                          <span className="s2-source-type">{src.type}</span>
                          <span className="s2-source-name">{src.name}</span>
                          <span className="s2-source-date">{src.date}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Gradient divider */}
                  <div className="s2-gradient-divider" />

                  {/* Merged insight paragraph */}
                  <div className="s2-insight">
                    <p>
                      <strong>{currentSignal.summary.whatHappened}</strong>{" "}
                      {currentSignal.summary.whyItMatters}
                    </p>
                  </div>

                  {/* Gradient divider */}
                  <div className="s2-gradient-divider" />

                  {/* Exposed Spaces */}
                  <div className="s2-spaces-grid">
                    {currentSignal.affectedSpaces.map((prop) => {
                      const isTargetProp = fromProperty && (
                        (prop.slug && prop.slug.toLowerCase() === fromProperty.toLowerCase()) ||
                        (prop.propertySlug && prop.propertySlug.toLowerCase() === fromProperty.toLowerCase())
                      );
                      return (
                        <div
                          key={prop.id}
                          className={`s2-space-card ${hoveredPropertyId === prop.id ? "focused" : ""} ${isTargetProp ? "s2-space-target" : ""}`}
                          style={isTargetProp ? {
                            borderColor: "#E8AE3C",
                            background: "rgba(232, 174, 60, 0.08)",
                            boxShadow: "0 0 16px rgba(232, 174, 60, 0.2)",
                          } : {}}
                          onMouseEnter={() => setHoveredPropertyId(prop.id)}
                          onMouseLeave={() => setHoveredPropertyId(null)}
                          onClick={() => router.push(`/property/${prop.slug}`)}
                        >
                          <div className="s2-space-top">
                            <span className="s2-space-dist">{prop.distance}</span>
                            <span className={`s2-space-class ${prop.classification.replace(/\s+/g, '-').toLowerCase()}`}>
                              {prop.classification === "ALREADY COMPLIANT" ? "Compliant" :
                               prop.classification === "UPGRADE REQUIRED" ? "Upgrade Needed" :
                               prop.classification === "RETROFIT REQUIRED" ? "Retrofit Pending" :
                               prop.classification === "PRIME BENEFICIARY" ? "Prime" :
                               prop.classification === "HIGH IMPACT" ? "High Impact" :
                               prop.classification}
                            </span>
                          </div>
                          <h4 className="s2-space-name" style={isTargetProp ? { color: "#F7C64E" } : {}}>
                            {prop.title}
                            {isTargetProp && (
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#E8AE3C", marginLeft: "6px" }}>
                                [TARGET]
                              </span>
                            )}
                          </h4>
                          <p className="s2-space-impact">{prop.impactTag}</p>
                          
                          {/* Progressive hover detail */}
                          <div className="s2-space-reveal">
                            <span className="s2-space-specs">{prop.specs}</span>
                            <span className="s2-space-reason">{prop.relationReason}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Investigation CTA */}
                  <button
                    type="button"
                    className="s2-investigate-cta"
                    onClick={() => { setInvestigationMode(true); setMobileSection("investigation"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  >
                    <Sparkles size={14} />
                    <span>Deep Investigation</span>
                    <ArrowRight size={14} />
                  </button>

                </article>
              ) : (
                /* ── INVESTIGATION ENGINE ── */
                <article className="s2-investigation">
                  
                  <div className="s2-inv-top">
                    <button type="button" className="s2-inv-back" onClick={() => setInvestigationMode(false)}>
                      <ArrowRight size={13} className="s2-flip" />
                      <span>Return to overview</span>
                    </button>
                    <div className="s2-inv-status">
                      <span className="s2-dot-live" />
                      <span>{currentSignal.slug}</span>
                    </div>
                  </div>

                  {/* CH 01 — The Signal */}
                  <section id="chapter-1" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">01</span> The Signal</div>
                    <h2 className="s2-ch-headline">{currentSignal.investigation.chapter01.headline || currentSignal.investigation.chapter01.abstract}</h2>
                    <p className="s2-ch-body">{currentSignal.investigation.chapter01.lede || currentSignal.investigation.chapter01.abstract}</p>
                    <div className="s2-ch-callout">
                      <ShieldCheck size={13} />
                      <span>{currentSignal.investigation.chapter01.jurisdiction || "Verified Spatial Authority"}</span>
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 02 — Corridors */}
                  <section id="chapter-2" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">02</span> Catchment Corridors</div>
                    <div className="s2-corridor-grid">
                      {(currentSignal.investigation.chapter02.corridors || currentSignal.investigation.chapter02.findings || []).map((c, i) => (
                        <div key={i} className={`s2-corridor-card ${i === 0 ? "s2-bento-wide" : ""}`}>
                          <div className="s2-corridor-top">
                            <span className="s2-corridor-name">{c.name || c.title}</span>
                            <span className="s2-corridor-len">{c.length || "Active Corridor"}</span>
                          </div>
                          <div className="s2-corridor-bottom">
                            <span>{c.towerCount != null ? `${c.towerCount} ${c.towerCount === 0 ? "Estates" : "Towers"}` : "Impact Zone"}</span>
                            <span className="s2-corridor-focus">{c.focus || (c.body ? c.body.slice(0, 48) + "..." : "Primary Catchment")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 03 — Requirements */}
                  <section id="chapter-3" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">03</span> Requirements</div>
                    <div className="s2-req-grid">
                      {currentSignal.investigation.chapter03.frameworkSteps.map((s, idx) => (
                        <div key={idx} className={`s2-req-card ${idx === 0 ? "s2-bento-wide" : ""}`}>
                          <span className="s2-req-num">{s.step}</span>
                          <h4 className="s2-req-title">{s.title}</h4>
                          <p className="s2-req-desc">{s.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 04 — Building Exposure & Origin Property Ledger */}
                  <section id="chapter-4" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">04</span> Building Exposure & Ledger</div>
                    <div className="s2-ledger">
                      {currentSignal.investigation.chapter04.buildingLedger.map((b, idx) => {
                        const isTarget = fromProperty && (
                          (b.slug && b.slug.toLowerCase() === fromProperty.toLowerCase()) ||
                          b.name.toLowerCase().includes(fromProperty.toLowerCase().replace(/-/g, ' '))
                        );
                        return (
                          <div
                            key={idx}
                            className={`s2-ledger-row ${isTarget ? "s2-ledger-target" : ""}`}
                            style={isTarget ? {
                              border: "1.5px solid #E8AE3C",
                              background: "rgba(232, 174, 60, 0.14)",
                              boxShadow: "0 0 16px rgba(232, 174, 60, 0.2)",
                              borderRadius: "6px",
                              padding: "12px 14px",
                            } : {}}
                          >
                            <div className="s2-ledger-name" style={isTarget ? { color: "#F7C64E", fontWeight: 600 } : {}}>
                              <Building2 size={13} style={isTarget ? { color: "#F7C64E" } : {}} />
                              <span>{b.name}</span>
                              {isTarget && (
                                <span
                                  style={{
                                    fontFamily: "var(--font-mono)",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    background: "#E8AE3C",
                                    color: "#0e0e0e",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    marginLeft: "8px",
                                  }}
                                >
                                  ● YOUR TARGET PROPERTY
                                </span>
                              )}
                            </div>
                            <span className={`s2-ledger-status ${(b.status || "").toLowerCase().replace(/\s+/g, '-')}`}>
                              {b.status === "ALREADY COMPLIANT" ? "Compliant" :
                               b.status === "UPGRADE REQUIRED" ? "Upgrade" :
                               b.status === "RETROFIT REQUIRED" ? "Retrofit" :
                               b.status === "PRIME BENEFICIARY" ? "Prime" : b.status}
                            </span>
                            <span className="s2-ledger-detail">{b.detail}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 05 — Timeline */}
                  <section id="chapter-5" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">05</span> Timeline</div>
                    <div className="s2-timeline">
                      <div className="s2-timeline-track" />
                      <div className="s2-timeline-nodes">
                        {(currentSignal.investigation.chapter05.timeline || currentSignal.investigation.chapter05.timelineEvents || []).map((step, idx) => (
                          <div key={idx} className={`s2-timeline-node ${step.current || step.status === "active" ? "current" : ""}`}>
                            <div className="s2-tl-year-wrap">
                              <span className="s2-tl-year">{step.year || step.date}</span>
                              {(step.current || step.status === "active") && <span className="s2-tl-now">Now</span>}
                            </div>
                            <div className="s2-tl-dot" />
                            <h4 className="s2-tl-phase">{step.phase || step.title || step.label}</h4>
                            <p className="s2-tl-detail">{step.detail || step.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 06 — Pressures & Risk */}
                  <section id="chapter-6" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">06</span> Pressures & Risk Metrics</div>
                    <div className="s2-pressure-grid">
                      {(currentSignal.investigation.chapter06.pressures || currentSignal.investigation.chapter06.riskPills || []).map((p, idx) => (
                        <div key={idx} className="s2-pressure-card">
                          <div className="s2-pressure-top">
                            <span className="s2-pressure-title">{p.title || p.label}</span>
                            <span className={`s2-pressure-sev ${(p.severity || p.level || "MED").toLowerCase()}`}>
                              {p.severity || p.level || p.value}
                            </span>
                          </div>
                          <p className="s2-pressure-text">{p.text || p.desc || p.value}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 07 — Market Divergence */}
                  <section id="chapter-7" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">07</span> Market Divergence</div>
                    <div className="s2-divergence">
                      <div className="s2-diverge-block s2-positive">
                        <div className="s2-diverge-head">
                          <CheckCircle2 size={13} />
                          <span>{currentSignal.investigation.chapter07.marketShift?.certifiedStock?.title || currentSignal.investigation.chapter07.modernStock?.title || "Compliant / Prime Inventory"}</span>
                        </div>
                        <ul>
                          {(currentSignal.investigation.chapter07.marketShift?.certifiedStock?.points || currentSignal.investigation.chapter07.modernStock?.points || []).map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="s2-diverge-block s2-negative">
                        <div className="s2-diverge-head">
                          <AlertTriangle size={13} />
                          <span>{currentSignal.investigation.chapter07.marketShift?.legacyStock?.title || currentSignal.investigation.chapter07.legacyStock?.title || "Legacy / Uncertified Inventory"}</span>
                        </div>
                        <ul>
                          {(currentSignal.investigation.chapter07.marketShift?.legacyStock?.points || currentSignal.investigation.chapter07.legacyStock?.points || []).map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>

                  <div className="s2-gradient-divider" />

                  {/* CH 08 — Impact Matrix */}
                  <section id="chapter-8" className="s2-chapter">
                    <div className="s2-ch-label"><span className="s2-ch-num">08</span> Impact Matrix</div>
                    <div className="s2-matrix">
                      <div className="s2-matrix-head">
                        <span>Factor</span>
                        <span>Short Term</span>
                        <span>Long Term</span>
                        <span>Rationale</span>
                      </div>
                      {currentSignal.investigation.chapter08.impactMatrix.map((row, idx) => (
                        <div key={idx} className="s2-matrix-row">
                          <span className="s2-mx-factor">{row.factor}</span>
                          <span className={`s2-mx-val ${(row.shortTerm || row.impact || "").includes('BOOST') || (row.shortTerm || row.impact || "").includes('BENEFIT') ? 'boost' : (row.shortTerm || row.impact || "").includes('FRICTION') || (row.shortTerm || row.impact || "").includes('STRAIN') ? 'friction' : ''}`}>
                            {row.shortTerm || row.impact}
                          </span>
                          <span className={`s2-mx-val ${(row.longTerm || "").includes('BOOST') ? 'boost' : (row.longTerm || "").includes('FRICTION') ? 'friction' : ''}`}>
                            {row.longTerm || row.impact || "HIGH"}
                          </span>
                          <span className="s2-mx-reason">{row.rationale || row.detail}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Evidence Ledger */}
                  <section className="s2-evidence">
                    <div className="s2-ev-head">
                      <FileText size={13} />
                      <span>Source Provenance</span>
                    </div>
                    {currentSignal.investigation.evidenceSources.map((src, i) => (
                      <div key={i} className="s2-ev-row">
                        <span className="s2-ev-type">{src.type}</span>
                        <span className="s2-ev-name">{src.name}</span>
                        <span className="s2-ev-date">{src.date}</span>
                        <span className="s2-ev-verified"><ShieldCheck size={10} /> Verified</span>
                      </div>
                    ))}
                  </section>

                  {/* ── FULFILMENT TERMINAL (REPLACES GENERIC FOOTER) ── */}
                  <FulfilmentTerminal
                    signal={currentSignal}
                    fromProperty={fromProperty}
                    affectedSpaces={currentSignal.affectedSpaces}
                    defaultResolutionKey={targetMatchedSpace?.defaultResolution || "resolved"}
                    onBackToBrief={() => {
                      setInvestigationMode(false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />

                </article>
              )}

            </section>
          </div>

          {/* ── INTEL ARCHIVE LINK ── */}
          <section className="s2-archive">
            <div className="s2-archive-inner">
              <div>
                <span className="s2-archive-label"><BookOpen size={12} /> Intel Repository</span>
                <h3 className="s2-archive-title">Historical Market Intelligence & Briefings</h3>
                <p className="s2-archive-desc">Browse verified dispatches, cadastral logs, and zoning gazettes.</p>
              </div>
              <Link href="/intel" className="s2-btn-outline">
                Open Intel Hub →
              </Link>
            </div>
          </section>

        </div>

        {/* Layer Transition */}
        <div className="s2-descent">
          <LayerTransition 
            nextNum="03" 
            nextName="Metropolis" 
            nextHref="/layer/metropolis" 
            teaser="Drop below the clouds. The city directory opens up." 
          />
        </div>
      </main>

      {/* ═══════════════════════════════════════════════════════════
         STYLES — Redesigned with taste skill principles
         ═══════════════════════════════════════════════════════════ */}
      <style jsx global>{`

        /* ── BASE ── */
        .s2-page {
          min-height: 100vh;
          background: #0d0d0d !important;
          color: #f0ede8;
          font-family: var(--font-body);
          position: relative;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          padding-bottom: calc(88px + env(safe-area-inset-bottom));
          -webkit-font-smoothing: antialiased;
        }

        .s2-main {
          flex: 1;
          position: relative;
          z-index: 10;
          padding-top: 80px;
        }

        .s2-container {
          max-width: 1340px;
          margin: 0 auto;
          padding: 12px clamp(16px, 3vw, 36px) 24px;
        }

        /* ── GLASSMORPHISM HEADER ── */
        .s2-header {
          position: sticky;
          top: 56px;
          z-index: 30;
          margin-bottom: 20px;
          border-radius: 12px;
          overflow: hidden;
        }

        .s2-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          padding: 18px 24px;
          background: rgba(13, 13, 13, 0.72);
          backdrop-filter: blur(24px) saturate(140%);
          -webkit-backdrop-filter: blur(24px) saturate(140%);
          border: 1px solid rgba(232, 174, 60, 0.12);
          border-radius: 12px;
        }

        .s2-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 2.8vw, 30px);
          font-weight: 500;
          line-height: 1.25;
          letter-spacing: -0.015em;
          color: #f7f5f0;
          margin: 0;
        }

        .s2-title-accent {
          color: var(--accent);
        }

        .s2-subtitle {
          font-size: 14px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 4px 0 0;
        }

        .s2-header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
        }

        .s2-badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-bright);
          box-shadow: 0 0 8px var(--accent-bright);
        }

        /* ── SEARCH & FILTERS ── */
        .s2-filters {
          margin-bottom: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .s2-search-wrap {
          position: relative;
          width: 100%;
        }

        .s2-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .s2-search-input {
          width: 100%;
          background: rgba(22, 22, 22, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 8px;
          padding: 10px 36px 10px 38px;
          color: #f0ede8;
          font-family: var(--font-body);
          font-size: 13px;
          transition: all 0.2s ease;
        }

        .s2-search-input:focus {
          outline: none;
          border-color: rgba(232, 174, 60, 0.4);
          background: rgba(26, 26, 26, 0.95);
          box-shadow: 0 0 12px rgba(232, 174, 60, 0.1);
        }

        .s2-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .s2-filter-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .s2-channels {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .s2-channel-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(22, 22, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          padding: 6px 12px;
          color: var(--text-secondary);
          font-family: var(--font-body);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .s2-channel-pill:hover {
          background: rgba(30, 30, 30, 0.8);
          border-color: rgba(255, 255, 255, 0.12);
          color: #f0ede8;
        }

        .s2-channel-pill.active {
          background: rgba(232, 174, 60, 0.12);
          border-color: rgba(232, 174, 60, 0.35);
          color: var(--accent);
          font-weight: 500;
        }

        .s2-corridors {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .s2-corridor-pill {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 4px;
          padding: 4px 8px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 10.5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .s2-corridor-pill:hover {
          color: var(--text-secondary);
        }

        .s2-corridor-pill.active {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
          color: #f0ede8;
        }

        /* ── MOBILE TABS ── */
        .s2-mobile-tabs {
          display: none;
          gap: 4px;
          background: rgba(22, 22, 22, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 16px;
        }

        .s2-mob-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: transparent;
          border: none;
          border-radius: 6px;
          padding: 8px;
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
        }

        .s2-mob-tab.active {
          background: rgba(232, 174, 60, 0.12);
          color: var(--accent);
          font-weight: 500;
        }

        /* ── GRID LAYOUT ── */
        .s2-grid {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 24px;
          align-items: start;
        }

        .s2-investigation-active .s2-grid {
          grid-template-columns: 64px 1fr;
        }

        /* ── LEFT COLUMN (OVERVIEW) ── */
        .s2-left {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .s2-radar-card, .s2-signal-card {
          background: rgba(18, 18, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          overflow: hidden;
        }

        .s2-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .s2-card-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }

        .s2-live-tag {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #4caf7d;
          background: rgba(76, 175, 125, 0.12);
          padding: 2px 6px;
          border-radius: 3px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .s2-signal-list {
          display: flex;
          flex-direction: column;
          max-height: 440px;
          overflow-y: auto;
        }

        .s2-signal-item {
          position: relative;
          display: flex;
          padding: 12px 14px 12px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .s2-signal-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .s2-signal-item.selected {
          background: rgba(232, 174, 60, 0.06);
        }

        .s2-heat-bar {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
        }

        .s2-signal-content {
          flex: 1;
          min-width: 0;
        }

        .s2-signal-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 4px;
        }

        .s2-signal-cat {
          font-family: var(--font-mono);
          font-size: 9.5px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .s2-signal-status {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--accent);
          letter-spacing: 0.04em;
        }

        .s2-signal-title {
          font-size: 13px;
          font-weight: 500;
          color: #f0ede8;
          margin: 0 0 6px;
          line-height: 1.35;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .s2-signal-meta {
          display: flex;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .s2-signal-meta span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .s2-empty {
          padding: 24px 16px;
          text-align: center;
          color: var(--text-muted);
          font-size: 12px;
        }

        .s2-reset-link {
          margin-top: 8px;
          background: transparent;
          border: none;
          color: var(--accent);
          font-size: 11px;
          cursor: pointer;
          text-decoration: underline;
        }

        /* ── LEFT COLUMN (INVESTIGATION RAIL) ── */
        .s2-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: sticky;
          top: 130px;
          background: rgba(18, 18, 18, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 12px 6px;
        }

        .s2-rail-back {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 9px;
          text-transform: uppercase;
          cursor: pointer;
          padding: 6px;
          border-radius: 4px;
          transition: all 0.15s ease;
        }

        .s2-rail-back:hover {
          color: #f0ede8;
          background: rgba(255, 255, 255, 0.05);
        }

        .s2-rail-chapters {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 100%;
        }

        .s2-rail-ch {
          background: transparent;
          border: none;
          border-radius: 4px;
          padding: 6px 0;
          color: var(--text-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
        }

        .s2-rail-ch:hover {
          color: #f0ede8;
          background: rgba(255, 255, 255, 0.04);
        }

        .s2-rail-ch.active {
          color: var(--accent);
          font-weight: 700;
          background: rgba(232, 174, 60, 0.12);
        }

        /* ── RIGHT COLUMN (BRIEF) ── */
        .s2-brief {
          background: rgba(18, 18, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: clamp(18px, 2.5vw, 32px);
        }

        .s2-brief-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .s2-chip-primary {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent);
          background: rgba(232, 174, 60, 0.1);
          border: 1px solid rgba(232, 174, 60, 0.2);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .s2-chip-neutral {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 3px 8px;
          border-radius: 4px;
        }

        .s2-brief-title {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.4vw, 28px);
          font-weight: 500;
          line-height: 1.3;
          color: #f7f5f0;
          margin: 0 0 12px;
        }

        .s2-provenance {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .s2-provenance-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: #4caf7d;
        }

        .s2-src-toggle {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 3px 8px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 10px;
          cursor: pointer;
        }

        .s2-sources-drawer {
          background: rgba(14, 14, 14, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          padding: 8px 12px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .s2-source-row {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .s2-source-type {
          color: var(--accent);
          text-transform: uppercase;
        }

        .s2-source-name {
          color: var(--text-secondary);
          flex: 1;
          margin: 0 12px;
        }

        .s2-gradient-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(232, 174, 60, 0.18), transparent);
          margin: 20px 0;
        }

        .s2-insight p {
          font-size: 14.5px;
          line-height: 1.65;
          color: #e0deda;
          margin: 0;
        }

        .s2-insight strong {
          color: #f7f5f0;
          font-weight: 500;
        }

        .s2-spaces-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .s2-space-card {
          background: rgba(14, 14, 14, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .s2-space-card:hover, .s2-space-card.focused {
          border-color: rgba(232, 174, 60, 0.35);
          background: rgba(22, 22, 22, 0.9);
          transform: translateY(-2px);
        }

        .s2-space-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .s2-space-dist {
          font-family: var(--font-mono);
          font-size: 9.5px;
          color: var(--text-muted);
        }

        .s2-space-class {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .s2-space-class.already-compliant {
          color: #4caf7d;
          background: rgba(76, 175, 125, 0.12);
        }

        .s2-space-class.upgrade-required {
          color: #E8AE3C;
          background: rgba(232, 174, 60, 0.12);
        }

        .s2-space-class.retrofit-required {
          color: #e8644a;
          background: rgba(232, 100, 74, 0.12);
        }

        .s2-space-class.prime-beneficiary {
          color: #6dd5a0;
          background: rgba(109, 213, 160, 0.12);
        }

        .s2-space-name {
          font-size: 13.5px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .s2-space-impact {
          font-size: 11.5px;
          color: var(--text-secondary);
          margin: 0 0 8px;
        }

        .s2-space-reveal {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.04);
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .s2-space-reason {
          color: #c0bdb7;
        }

        .s2-investigate-cta {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(232, 174, 60, 0.16) 0%, rgba(232, 174, 60, 0.06) 100%);
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 8px;
          padding: 12px 20px;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .s2-investigate-cta:hover {
          background: linear-gradient(135deg, rgba(232, 174, 60, 0.24) 0%, rgba(232, 174, 60, 0.12) 100%);
          border-color: var(--accent);
          box-shadow: 0 0 16px rgba(232, 174, 60, 0.15);
        }

        /* ── RIGHT COLUMN (INVESTIGATION) ── */
        .s2-investigation {
          background: rgba(18, 18, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: clamp(20px, 3vw, 40px);
        }

        .s2-inv-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .s2-inv-back {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 6px 12px;
          color: var(--text-secondary);
          font-family: var(--font-mono);
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .s2-inv-back:hover {
          color: #f0ede8;
          border-color: rgba(255, 255, 255, 0.2);
        }

        .s2-flip {
          transform: rotate(180deg);
        }

        .s2-inv-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .s2-dot-live {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #4caf7d;
          box-shadow: 0 0 6px #4caf7d;
        }

        .s2-chapter {
          scroll-margin-top: 140px;
        }

        .s2-ch-label {
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .s2-ch-num {
          color: var(--text-muted);
        }

        .s2-ch-headline {
          font-family: var(--font-display);
          font-size: clamp(20px, 2.6vw, 30px);
          font-weight: 500;
          line-height: 1.3;
          color: #f7f5f0;
          margin: 0 0 14px;
        }

        .s2-ch-body {
          font-size: 15px;
          line-height: 1.7;
          color: #d6d3ce;
          margin: 0 0 16px;
        }

        .s2-ch-callout {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid var(--accent);
          padding: 8px 12px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: #e0deda;
        }

        .s2-corridor-grid, .s2-req-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .s2-corridor-card, .s2-req-card {
          background: rgba(14, 14, 14, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 14px;
        }

        .s2-bento-wide {
          grid-column: 1 / -1;
        }

        .s2-corridor-top {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .s2-corridor-name {
          font-size: 13px;
          font-weight: 500;
          color: #f7f5f0;
        }

        .s2-corridor-len {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--accent);
        }

        .s2-corridor-bottom {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-muted);
        }

        .s2-req-num {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 4px;
          display: block;
        }

        .s2-req-title {
          font-size: 13px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .s2-req-desc {
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        .s2-ledger {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .s2-ledger-row {
          display: grid;
          grid-template-columns: 200px 140px 1fr;
          align-items: center;
          gap: 12px;
          background: rgba(14, 14, 14, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 6px;
          padding: 8px 12px;
        }

        .s2-ledger-name {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 500;
          color: #f0ede8;
        }

        .s2-ledger-status {
          font-family: var(--font-mono);
          font-size: 9.5px;
          text-transform: uppercase;
          justify-self: start;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .s2-ledger-status.compliant, .s2-ledger-status.already-compliant {
          color: #4caf7d;
          background: rgba(76, 175, 125, 0.12);
        }

        .s2-ledger-status.upgrade, .s2-ledger-status.upgrade-required {
          color: #E8AE3C;
          background: rgba(232, 174, 60, 0.12);
        }

        .s2-ledger-status.retrofit, .s2-ledger-status.retrofit-required {
          color: #e8644a;
          background: rgba(232, 100, 74, 0.12);
        }

        .s2-ledger-status.prime, .s2-ledger-status.prime-beneficiary {
          color: #6dd5a0;
          background: rgba(109, 213, 160, 0.12);
        }

        .s2-ledger-detail {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .s2-timeline {
          position: relative;
          padding: 12px 0 12px 24px;
        }

        .s2-timeline-track {
          position: absolute;
          left: 6px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: rgba(255, 255, 255, 0.08);
        }

        .s2-timeline-nodes {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .s2-timeline-node {
          position: relative;
        }

        .s2-timeline-node.current .s2-tl-dot {
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
        }

        .s2-tl-dot {
          position: absolute;
          left: -23px;
          top: 4px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid #0d0d0d;
        }

        .s2-tl-year-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }

        .s2-tl-year {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: var(--accent);
          font-weight: 600;
        }

        .s2-tl-now {
          font-family: var(--font-mono);
          font-size: 8.5px;
          background: #4caf7d;
          color: #000;
          padding: 1px 4px;
          border-radius: 2px;
          text-transform: uppercase;
          font-weight: 700;
        }

        .s2-tl-phase {
          font-size: 13px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 2px;
        }

        .s2-tl-detail {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
        }

        .s2-pressure-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .s2-pressure-card {
          background: rgba(14, 14, 14, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 12px;
        }

        .s2-pressure-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .s2-pressure-title {
          font-size: 12px;
          font-weight: 500;
          color: #f0ede8;
        }

        .s2-pressure-sev {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 2px 5px;
          border-radius: 3px;
          text-transform: uppercase;
        }

        .s2-pressure-sev.high, .s2-pressure-sev.critical {
          color: #e8644a;
          background: rgba(232, 100, 74, 0.12);
        }

        .s2-pressure-sev.moderate, .s2-pressure-sev.med {
          color: #E8AE3C;
          background: rgba(232, 174, 60, 0.12);
        }

        .s2-pressure-sev.positive, .s2-pressure-sev.low {
          color: #4caf7d;
          background: rgba(76, 175, 125, 0.12);
        }

        .s2-pressure-text {
          font-size: 11px;
          line-height: 1.45;
          color: var(--text-secondary);
          margin: 0;
        }

        .s2-divergence {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .s2-diverge-block {
          background: rgba(14, 14, 14, 0.7);
          border-radius: 8px;
          padding: 14px;
        }

        .s2-diverge-block.s2-positive {
          border: 1px solid rgba(76, 175, 125, 0.2);
        }

        .s2-diverge-block.s2-negative {
          border: 1px solid rgba(232, 100, 74, 0.2);
        }

        .s2-diverge-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .s2-positive .s2-diverge-head {
          color: #4caf7d;
        }

        .s2-negative .s2-diverge-head {
          color: #e8644a;
        }

        .s2-diverge-block ul {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .s2-diverge-block li {
          font-size: 12px;
          line-height: 1.45;
          color: var(--text-secondary);
        }

        .s2-matrix {
          background: rgba(14, 14, 14, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          overflow: hidden;
        }

        .s2-matrix-head {
          display: grid;
          grid-template-columns: 140px 100px 100px 1fr;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .s2-matrix-row {
          display: grid;
          grid-template-columns: 140px 100px 100px 1fr;
          gap: 12px;
          padding: 10px 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-size: 12px;
          align-items: center;
        }

        .s2-mx-factor {
          font-weight: 500;
          color: #f0ede8;
        }

        .s2-mx-val {
          font-family: var(--font-mono);
          font-size: 10.5px;
          color: var(--text-muted);
        }

        .s2-mx-val.boost {
          color: #4caf7d;
        }

        .s2-mx-val.friction {
          color: #e8644a;
        }

        .s2-mx-reason {
          font-size: 11.5px;
          color: var(--text-secondary);
        }

        .s2-evidence {
          margin-top: 24px;
          background: rgba(14, 14, 14, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 12px 14px;
        }

        .s2-ev-head {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10.5px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .s2-ev-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 4px 0;
          color: var(--text-muted);
        }

        .s2-ev-type {
          color: var(--accent);
          width: 80px;
        }

        .s2-ev-name {
          flex: 1;
          color: var(--text-secondary);
        }

        .s2-ev-verified {
          display: flex;
          align-items: center;
          gap: 3px;
          color: #4caf7d;
        }

        /* ── INTEL ARCHIVE LINK ── */
        .s2-archive {
          margin-top: 32px;
          background: rgba(22, 22, 22, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 20px 24px;
        }

        .s2-archive-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
        }

        .s2-archive-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 4px;
        }

        .s2-archive-title {
          font-size: 16px;
          font-weight: 500;
          color: #f7f5f0;
          margin: 0 0 4px;
        }

        .s2-archive-desc {
          font-size: 12.5px;
          color: var(--text-secondary);
          margin: 0;
        }

        .s2-btn-outline {
          background: transparent;
          border: 1px solid rgba(232, 174, 60, 0.3);
          border-radius: 6px;
          padding: 8px 16px;
          color: var(--accent);
          font-family: var(--font-mono);
          font-size: 11px;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.15s ease;
        }

        .s2-btn-outline:hover {
          background: rgba(232, 174, 60, 0.1);
          border-color: var(--accent);
        }

        .s2-descent {
          margin-top: 32px;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .s2-grid {
            grid-template-columns: 1fr;
          }

          .s2-investigation-active .s2-grid {
            grid-template-columns: 1fr;
          }

          .s2-left {
            display: none;
          }

          .s2-left.s2-mob-visible {
            display: flex;
          }

          .s2-right {
            display: none;
          }

          .s2-right.s2-mob-visible {
            display: block;
          }

          .s2-mobile-tabs {
            display: flex;
          }

          .s2-rail {
            position: static;
            flex-direction: row;
            justify-content: space-between;
            padding: 8px 14px;
          }

          .s2-rail-chapters {
            flex-direction: row;
            width: auto;
          }

          .s2-divergence {
            grid-template-columns: 1fr;
          }

          .s2-matrix-head, .s2-matrix-row {
            grid-template-columns: 120px 80px 80px 1fr;
          }

          .s2-ledger-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }

      `}</style>
    </div>
  );
}
