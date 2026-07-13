"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "@/app/property/[id]/property-detail.css";
import FloodRiskBadge from "@/components/property/FloodRiskBadge";
import UnitInquiryModal from "@/components/property/UnitInquiryModal";
import SpatialVaultWidget from "@/components/property/SpatialVaultWidget";
import PromoteModal from "./PromoteModal";
import { canSee, getCurrentTier } from "@/lib/entitlements";
import {
  unitCapacity,
  scenarioCapacity,
  unitTypeLabel,
} from "@/lib/unitMasterPage";

const SpecCard = ({ label, value }) => {
  if (value == null || value === "") return null;
  return (
    <div className="sidebar-block">
      <div className="sidebar-accent-line" />
      <div className="sidebar-label">{label}</div>
      <div className="sidebar-value">{value}</div>
    </div>
  );
};

export default function UnitMasterPage({ slug, unitId, previewProperty, previewUnit }) {
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [inquiryPrefill, setInquiryPrefill] = useState("");
  const [unlockedVault, setUnlockedVault] = useState(false);
  
  // Photo states
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode, setPhotoMode] = useState("natural");
  const touchStartX = useRef(null);

  // Tab & scroll states
  const [activeTab, setActiveTab] = useState("space");
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  const pointerDownX = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    setUnlockedVault(canSee("vault", getCurrentTier()));
  }, []);

  useEffect(() => {
    if (previewProperty) {
      setProperty(previewProperty);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms");
        const data = await res.json();
        const match = (data.properties || []).find(
          (p) =>
            (p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()) ||
            (p.id && p.id === slug)
        );
        if (!cancelled) setProperty(match || null);
      } catch (e) {
        console.error("Failed to load property for unit page", e);
        if (!cancelled) setProperty(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, previewProperty]);

  // Manage nav scroll indicators
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setCanScrollLeft(el.scrollLeft > 5);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    handleScroll();
    return () => {
      el.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [loading]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #0e0e0e)" }}>
        <span style={{ fontFamily: "'Courier New',monospace", fontSize: "12px", color: "#c8c8c8", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Loading Unit Intelligence…
        </span>
      </div>
    );
  }

  const unit = previewUnit || property?.units_inventory?.find((u) => u.id === unitId);

  if (!property || !unit) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg, #0e0e0e)", gap: "16px" }}>
        <p style={{ fontFamily: "Georgia,serif", fontSize: "20px", color: "#f0ede8" }}>This unit could not be found.</p>
        {property?.slug && (
          <Link href={`/property/${property.slug}`} style={{ color: "var(--accent, #E8AE3C)", fontFamily: "'Courier New',monospace", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            ← Back to {property.title}
          </Link>
        )}
      </div>
    );
  }

  const d = unit.details || {};
  const scenarios = Array.isArray(unit.subdivision_scenarios) ? unit.subdivision_scenarios : [];
  const operatorName = unit.operator_display_name || null;

  const photos = Array.isArray(unit.photos) && unit.photos.filter(Boolean).length
    ? unit.photos.filter(Boolean)
    : (unit.image || unit.photo ? [unit.image || unit.photo] : []);
  
  // If no photos, inject a fallback so layout doesn't break
  const displayPhotos = photos.length > 0 ? photos : ["/placeholder-unit.jpg"];

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) || scenarios[0] || null;

  const cap = unitCapacity(unit);
  const features = Array.isArray(unit.features) ? unit.features : [];
  const inclusions = Array.isArray(d.lease_inclusions) ? d.lease_inclusions.filter(Boolean) : [];

  const availabilityLabel =
    unit.availability_status === "occupied" ? "Currently Occupied"
      : unit.availability_status === "coming_soon" ? "Coming Soon"
        : "Available";

  const openInquiry = (prefill) => {
    setInquiryPrefill(prefill || "");
    setIsInquiryOpen(true);
  };

  // ── Photo navigation ──────────────────────────
  const goPrev = () => setCurrentImageIndex(i => (i === 0 ? displayPhotos.length - 1 : i - 1));
  const goNext = () => setCurrentImageIndex(i => (i + 1) % displayPhotos.length);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (diff > 50) goPrev();
    else if (diff < -50) goNext();
  };

  // ── Drag-to-scroll handlers ───────────────────
  const DRAG_THRESHOLD = 6;
  const onDragStart = (e) => {
    if (e.pointerType === "touch") return;
    pointerDownX.current = e.pageX;
    scrollStart.current  = scrollRef.current.scrollLeft;
  };
  const onDragEnd = (e) => {
    pointerDownX.current = null;
    if (!isDragging.current) return;
    isDragging.current = false;
    if (scrollRef.current) {
      scrollRef.current.style.cursor = "grab";
      scrollRef.current.style.scrollBehavior = "";
      if (e?.pointerId != null) {
        try { scrollRef.current.releasePointerCapture(e.pointerId); } catch {}
      }
    }
  };
  const onDragMove = (e) => {
    if (pointerDownX.current == null) return;
    if (!isDragging.current) {
      if (Math.abs(e.pageX - pointerDownX.current) < DRAG_THRESHOLD) return;
      isDragging.current = true;
      startX.current = pointerDownX.current;
      scrollRef.current.style.cursor = "grabbing";
      scrollRef.current.style.scrollBehavior = "auto";
      try { scrollRef.current.setPointerCapture(e.pointerId); } catch {}
    }
    e.preventDefault();
    const delta = (e.pageX - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollStart.current - delta;
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setTimeout(() => {
        document.querySelector('.zone-story')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  };
  const ACCENT = "var(--accent, #E8AE3C)";

  return (
    <>
      <div className="grain" />
      <div className="page" style={{ position: "relative" }}>
        
        {/* Back Link Overlay */}
        <Link
          href={`/property/${property.slug}`}
          style={{ position: "absolute", top: "24px", left: "24px", zIndex: 100, color: "#c8c8c8", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", background: "rgba(14,14,14,0.6)", padding: "8px 12px", borderRadius: "4px", backdropFilter: "blur(4px)", textDecoration: "none", border: "0.5px solid #262626" }}
        >
          ← Back to {property.title}
        </Link>

        {/* ════ ZONE 1 – PHOTO ════ */}
        <div className="zone-photo" id="photoZone" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          {displayPhotos.map((url, i) => (
            <div
              key={i}
              className={`photo-slide ${photoMode} ${currentImageIndex === i ? "active" : ""}`}
              style={{ backgroundImage: `url(${url})`, backgroundPosition: "center", backgroundSize: "cover" }}
            />
          ))}

          <div className="light-shaft" />
          <div className="photo-fade-top" />
          <div className="photo-fade-left" />
          <div className="photo-fade-bottom" />

          {/* Hero Intel */}
          <div className="hero-intel" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <p className="hero-label" style={{ color: ACCENT }}>ScoutIt &middot; Unit Dossier</p>
            <h1 className="hero-title">{unit.name}</h1>
            <p className="hero-location">{property.title} &middot; {property.location || property.city}</p>
            <p className="hero-hook">{d.unit_type ? unitTypeLabel(d.unit_type) : "Premium Space"} &middot; {availabilityLabel}</p>
          </div>

          {/* Arrows */}
          {displayPhotos.length > 1 && (
            <>
              <div className="photo-arrow left" onClick={(e) => { e.stopPropagation(); goPrev(); }}>
                <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12"/></svg>
              </div>
              <div className="photo-arrow right" onClick={(e) => { e.stopPropagation(); goNext(); }}>
                <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="5,2 10,7 5,12"/></svg>
              </div>
            </>
          )}

          {/* Controls */}
          <div className="photo-controls" onClick={(e) => e.stopPropagation()}>
            <div className="photo-controls-left">
              <div className="photo-dots">
                {displayPhotos.map((_, i) => (
                  <div key={i} className={`dot ${currentImageIndex === i ? "active" : ""}`} onClick={() => setCurrentImageIndex(i)} />
                ))}
              </div>
            </div>
            <div className="photo-count">{currentImageIndex + 1} / {displayPhotos.length}</div>
          </div>
        </div>

        {/* Mobile Hero Intel */}
        <div className="mobile-hero-intel">
          <p className="mobile-hero-label" style={{ color: ACCENT }}>ScoutIt &middot; Unit Dossier</p>
          <h1 className="mobile-hero-title">{unit.name}</h1>
          <p className="mobile-hero-location">{property.title} &middot; {property.location || property.city}</p>
          <p className="mobile-hero-hook">{d.unit_type ? unitTypeLabel(d.unit_type) : "Premium Space"} &middot; {availabilityLabel}</p>
        </div>

        {/* ════ ZONE 2 – NAV (drag-to-scroll) ════ */}
        <div className={`zone-nav ${canScrollLeft ? "can-scroll-left" : ""} ${canScrollRight ? "can-scroll-right" : ""}`}>
          <div className="nav-inner" role="tablist" ref={scrollRef} style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }} onPointerDown={onDragStart} onPointerUp={onDragEnd} onPointerCancel={onDragEnd} onPointerMove={onDragMove}>
            {[
              { id: "space", label: "The Space" },
              ...(d.differentiator ? [{ id: "diff", label: "The Differentiator" }] : []),
              { id: "vault", label: "The Vault" },
              { id: "terms", label: "Terms & Fit-Out" },
              { id: "building", label: "The Building" },
              { id: "yourmove", label: "Your Move" }
            ].map((tab, idx, arr) => (
              <span key={tab.id} style={{ display: "contents" }}>
                <button
                  type="button" role="tab" aria-selected={activeTab === tab.id}
                  className={`nav-chapter ${tab.id === "yourmove" ? "nav-chapter--cta" : ""} ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <span className="chapter-label">{tab.label}</span>
                </button>
                {idx < arr.length - 1 && <div className="nav-divider" />}
              </span>
            ))}
          </div>
        </div>

        {/* ════ ZONE 3 – STORY ════ */}
        <div className="zone-story">
          
          {/* ── 01: THE SPACE ── */}
          <div className={`chapter-panel ${activeTab === "space" ? "active" : ""}`} id="panel-space">
            <div className="panel-content">
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>01 — The Space</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {features.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                  {features.map((f) => (
                    <span key={f} style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#f0ede8", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", padding: "7px 13px" }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {/* Interactive "This space flexes" */}
              {scenarios.length > 0 && activeScenario && (
                <div style={{ background: "linear-gradient(145deg, #141414, #0d0d0d)", border: "0.5px solid #262626", borderRadius: "8px", padding: "22px" }}>
                  <div style={{ fontFamily: "'Courier New',monospace", fontSize: "11px", color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "14px" }}>
                    This space flexes ✦
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
                    {scenarios.map((s) => {
                      const active = s.id === activeScenario.id;
                      return (
                        <button
                          key={s.id} onClick={() => setActiveScenarioId(s.id)}
                          style={{
                            fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.06em", textTransform: "uppercase",
                            padding: "8px 14px", borderRadius: "4px", cursor: "pointer",
                            background: active ? ACCENT : "transparent", color: active ? "#0e0e0e" : "#c8c8c8",
                            border: active ? `1px solid ${ACCENT}` : "0.5px solid #333", fontWeight: active ? 700 : 400,
                          }}
                        >
                          {s.label || "Layout"}{s.recommended ? " ★" : ""}
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", alignItems: "start" }}>
                    <SpecCard label="Configuration" value={activeScenario.cuts ? `${activeScenario.cuts} × ${activeScenario.sqm_each || "?"} sqm` : (activeScenario.sqm_each ? `${activeScenario.sqm_each} sqm` : null)} />
                    {(() => {
                      const sc = scenarioCapacity(activeScenario);
                      return <SpecCard label="Capacity / cut" value={sc ? `${sc.estimated ? "~" : ""}${sc.value} seats${sc.estimated ? " (est.)" : ""}` : null} />;
                    })()}
                    {/* Rate hidden from Ch 1 per RA 9646 - only Your Move */}
                    {activeScenario.recommended && <SpecCard label="ScoutIt Note" value="★ Recommended layout" />}
                  </div>

                  {activeScenario.floor_plan_2d_url && (
                    <div style={{ marginTop: "16px", width: "100%", borderRadius: "6px", overflow: "hidden", border: "0.5px solid #262626" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activeScenario.floor_plan_2d_url} alt={`${activeScenario.label} layout`} style={{ width: "100%", display: "block" }} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="panel-sidebar">
              <SpecCard label="Unit Size" value={unit.size ? `${unit.size} sqm` : null} />
              <SpecCard label="Floor" value={unit.floor ? `Level ${unit.floor}` : null} />
              <SpecCard label="Capacity" value={cap ? `${cap.estimated ? "~" : ""}${cap.value} seats${cap.estimated ? " (est.)" : ""}` : null} />
              <SpecCard label="Fit-Out" value={d.fit_out_status || null} />
              <SpecCard label="Availability" value={availabilityLabel} />
            </div>
          </div>

          {/* ── 02: THE DIFFERENTIATOR ── */}
          {d.differentiator && (
            <div className={`chapter-panel ${activeTab === "diff" ? "active" : ""}`} id="panel-diff">
              <div className="panel-content">
                <div style={{marginBottom:"32px"}}>
                  <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>02 — The Differentiator</div>
                  <div style={{height:"1px", background:"#262626"}}/>
                </div>
                <p style={{ fontFamily: "Georgia,serif", fontSize: "17px", color: "#e8e4dd", lineHeight: 1.65, margin: "0 0 16px 0", maxWidth: "680px" }}>
                  {d.differentiator}
                </p>
              </div>
              <div className="panel-sidebar" />
            </div>
          )}

          {/* ── 03: THE VAULT ── */}
          <div className={`chapter-panel ${activeTab === "vault" ? "active" : ""}`} id="panel-vault">
            <div className="panel-content" style={{ maxWidth: "100%" }}>
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:ACCENT, letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>PREMIUM — THE SPATIAL VAULT</div>
                <div style={{height:"1px", background:ACCENT}}/>
              </div>

              {unlockedVault ? (
                <SpatialVaultWidget
                  lumaUrl={d.floor_plan_3d_data || unit.luma_url}
                  matterportUrl={d.matterport_url || unit.matterport_url}
                  heatmapUrl={d.floor_plan_2d_url || unit.heatmap_url}
                />
              ) : (
                <div style={{ position: "relative", width: "100%", padding: "24px", borderRadius: "8px", background: "rgba(22,22,22,0.5)", border: "0.5px solid #262626", overflow: "hidden", minHeight: "180px" }}>
                  <div style={{ filter: "blur(6px)", opacity: 0.4, pointerEvents: "none" }}>
                    <div style={{ width: "100%", height: "20px", background: "#333", marginBottom: "8px", borderRadius: "2px" }} />
                    <div style={{ width: "80%", height: "20px", background: "#333", marginBottom: "8px", borderRadius: "2px" }} />
                  </div>
                  <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(4px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", textAlign: "center", padding: "20px" }}>
                    <span style={{ fontFamily: "Georgia,serif", fontSize: "15px", color: "#f0ede8", maxWidth: "360px" }}>
                      Interactive 3D floor plan {"&"} unit-specific spatial media.
                    </span>
                    <a href="/pricing/cluster" style={{ textDecoration: "none", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: ACCENT, padding: "10px 16px", borderRadius: "2px", color: "#0e0e0e", fontWeight: "bold" }}>
                      Unlock the Unit Vault // Cluster+
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 04: TERMS ── */}
          <div className={`chapter-panel ${activeTab === "terms" ? "active" : ""}`} id="panel-terms">
            <div className="panel-content">
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>04 — Terms & Fit-Out</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {inclusions.length > 0 && (
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ fontFamily:"'Courier New',monospace", fontSize:"10px", color:ACCENT, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"10px" }}>What&apos;s Included</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {inclusions.map((inc) => (
                      <span key={inc} style={{ fontFamily: "Georgia,serif", fontSize: "13px", color: "#f0ede8", background: "#161616", border: "0.5px solid #262626", borderRadius: "4px", padding: "7px 13px" }}>
                        ✓ {inc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {d.house_rules && (
                <div>
                  <div style={{ fontFamily:"'Courier New',monospace", fontSize:"10px", color:ACCENT, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"10px" }}>House Rules</div>
                  <p style={{ fontFamily: "Georgia,serif", fontSize: "14px", color: "#a0a0a0", lineHeight: 1.6, maxWidth: "680px", margin: 0 }}>
                    {d.house_rules}
                  </p>
                </div>
              )}
            </div>

            <div className="panel-sidebar">
              <SpecCard label="Operating Hours" value={d.operating_hours || null} />
              <SpecCard label="Minimum Term" value={d.min_term || null} />
              <SpecCard label="Deposit" value={d.deposit || null} />
            </div>
          </div>

          {/* ── 05: THE BUILDING ── */}
          <div className={`chapter-panel ${activeTab === "building" ? "active" : ""}`} id="panel-building">
            <div className="panel-content">
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>05 — The Building</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>
              <p style={{ fontFamily: "Georgia,serif", fontSize: "18px", color: "#f0ede8", margin: "0 0 14px 0" }}>{property.title}</p>
              <FloodRiskBadge floodRiskScore={property.flood_risk_score} floodZoneStatus={property.flood_zone_status} />
              <div style={{ marginTop: "24px" }}>
                <Link href={`/property/${property.slug}`} style={{ color: ACCENT, fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  View full building intelligence →
                </Link>
              </div>
            </div>

            <div className="panel-sidebar">
              <SpecCard label="Location" value={property.location || null} />
              <SpecCard label="Building Grade" value={property.building_grade || property.cm_building_grade || null} />
              <SpecCard label="Public Transport" value={property.public_transport || null} />
              <SpecCard label="Nearest Highway" value={property.nearest_highway || null} />
            </div>
          </div>

          {/* ── 06: YOUR MOVE ── */}
          <div className={`chapter-panel ${activeTab === "yourmove" ? "active" : ""}`} id="panel-yourmove">
            <div className="panel-content">
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>06 — Your Move</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>
              
              <div className="broker-card" style={{ marginBottom: "24px", maxWidth: "400px" }}>
                <div className="broker-avatar">{(operatorName || property.broker_name || "S")[0]}</div>
                <div className="broker-info">
                  <div className="broker-name-el">{operatorName || property.broker_name || "Building Owner"}</div>
                  <div className="broker-meta">{operatorName ? "Delegated Operator" : "Direct Listing"}</div>
                </div>
              </div>

              <button onClick={() => openInquiry("")} className="move-cta" style={{ maxWidth: "400px", width: "100%", textDecoration: "none" }}>
                Contact {operatorName ? "This Operator" : "The Owner"} →
              </button>

              <button
                onClick={() => setIsPromoteOpen(true)}
                style={{
                  marginTop: "10px", maxWidth: "400px", width: "100%", background: "transparent",
                  border: "0.5px solid rgba(232,174,60,0.6)", color: "#E8AE3C",
                  fontFamily: "'Courier New',monospace", fontSize: "12px",
                  letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "bold",
                  padding: "12px 16px", borderRadius: "4px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  boxShadow: "0 0 10px rgba(232,174,60,0.15)"
                }}
                className="hover:bg-gold-accent hover:text-[#0e0e0e] transition-colors"
              >
                Promote ✦
              </button>
              
              {scenarios.length > 0 && (
                <button
                  onClick={() => openInquiry("I'd like to request a custom cut / configuration for this space that isn't listed.")}
                  style={{ display: "block", marginTop: "12px", maxWidth: "400px", width: "100%", background: "transparent", border: "0.5px solid #333", color: "#c8c8c8", fontFamily: "'Courier New',monospace", fontSize: "11px", letterSpacing: "0.08em", textTransform: "uppercase", padding: "12px", borderRadius: "4px", cursor: "pointer" }}
                >
                  None of these fit? Request a custom cut →
                </button>
              )}
            </div>

            <div className="panel-sidebar">
              <SpecCard label="Listed Rate" value={d.price || unit.price || null} />
              {activeScenario && activeScenario.price_each && (
                <SpecCard label={`Rate (${activeScenario.label})`} value={activeScenario.price_each} />
              )}
            </div>
          </div>

        </div>{/* /zone-story */}

      </div>{/* /page */}

      <UnitInquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        propertyTitle={property.title}
        propertySlug={property.slug}
        unitId={unit.id}
        unitName={unit.name}
        operatorDisplayName={operatorName}
        prefillMessage={inquiryPrefill}
      />

      <PromoteModal
        isOpen={isPromoteOpen}
        onClose={() => setIsPromoteOpen(false)}
        propertyData={unit}
        link={typeof window !== 'undefined' ? window.location.href : `https://scoutit.com/property/${property.slug}/unit/${unit.id}`}
      />
    </>
  );
}
