/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import ReactionButtons from "@/components/ui/ReactionButtons";
import CategorySpecBlock from "@/components/property/CategorySpecBlock";
import { canSee, getCurrentTier, hasActiveRole } from "../../lib/entitlements";
import { useTrueClosestTransit } from "@/hooks/useTrueClosestTransit";
import { resolveTransitHub } from "@/lib/transit";

// Leaflet is huge. We dynamically import the InteractiveMap so the initial page load
// doesn't block on parsing the React Leaflet wrapper.
const InteractiveMap = dynamic(() => import("@/components/property/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", background: "#0d0d0d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8c8c8" }}>Loading tactical map…</span>
    </div>
  ),
});

// Code-split maplibre-gl + pmtiles out of the main property-page bundle — they&apos;re
// only needed if the visitor taps the Flood Risk Map tab.
const FloodHeatmapMap = dynamic(() => import("@/components/property/FloodHeatmapMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "clamp(360px, 48vh, 440px)", background: "#0d0d0d", border: "0.5px solid #262626", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8c8c8" }}>Loading flood hazard data…</span>
    </div>
  ),
});
// mapbox-gl + @turf/turf are only needed for the Rail Network tab, and that
// tab itself only renders for properties actually near the LRT/MRT network.
const ManilaTransitMap = dynamic(() => import("@/components/transit/ManilaTransitMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "clamp(420px, 52vh, 480px)", background: "#000", border: "0.5px solid #262626", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#c8c8c8" }}>Loading rail network…</span>
    </div>
  ),
});
import { DEEP_INTEL_SCHEMA } from "../../lib/deepIntelSchema";

// Loose bounding box around Metro Manila + the LRT/MRT lines' exurb extensions
// (Cavite, Antipolo) -- properties outside this simply aren&apos;t served by rail,
// so the tab only shows where it&apos;s actually a useful signal.
function isNearManilaRail(lat, lng) {
  return lat != null && lng != null && lat >= 14.2 && lat <= 14.9 && lng >= 120.7 && lng <= 121.3;
}
import "@/app/property/[id]/property-detail.css";
import { getChapterConfig } from "./chapterConfig";
import { Bed, Bath, Ruler, Car, Lock, Search, Camera, Building2 } from "lucide-react";
import InquiryModal from "@/components/property/InquiryModal";
import OperatorRequestModal from "@/components/property/OperatorRequestModal";

// ═══════════════════════════════════════════════════
// DATA — Airtable CMS first, mockDb fallback
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// TRANSIT HUBS — module-scope so coordinate references stay
// referentially stable across renders (avoids effect-dep loops).
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════
function SpatialVaultWidget({ lumaUrl, matterportUrl, heatmapUrl }) {
  // Tier-gated: the Vault unlocks at Cluster+. SSR-safe — locked until the client reads the viewer's tier.
  // NOTE: client-trusted for now; server-authoritative enforcement is the later security pass.
  const [hasSubscription, setHasSubscription] = useState(false);
  useEffect(() => { setHasSubscription(canSee("vault", getCurrentTier())); }, []);

  return (
    <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {lumaUrl && (
        <div className="vault-item">
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
            3D Spatial Map
          </h4>
          <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "11px", color: "var(--text-muted, #c8c8c8)", marginBottom: "12px" }}>
            Illustrative capture — this property&apos;s own 3D scan is in progress
          </p>
          <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <iframe src={hasSubscription ? lumaUrl : undefined} style={{ width: "100%", height: "100%", border: "none", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} title="3D Spatial Map" />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <span style={{ fontFamily: "'Courier New',monospace", fontSize: "9px", color: "#E8AE3C", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "16px" }}>Premium Subscription Required</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", display: "inline-block" }}>
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      {matterportUrl && (
        <div className="vault-item">
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "4px" }}>
            360° AR Room Tour
          </h4>
          <p style={{ fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: "11px", color: "var(--text-muted, #c8c8c8)", marginBottom: "12px" }}>
            Illustrative tour — this property&apos;s own 360° capture is in progress
          </p>
          <div style={{ position: "relative", width: "100%", height: "400px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <iframe src={hasSubscription ? matterportUrl : undefined} style={{ width: "100%", height: "100%", border: "none", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} title="360 Tour" />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", marginTop: "12px", display: "inline-block" }}>
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
      {heatmapUrl && (
        <div className="vault-item">
          <h4 style={{ fontFamily: "'Courier New',monospace", fontSize: "10px", color: "#E8AE3C", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "12px" }}>
            Drone Heatmap Analysis
          </h4>
          <div style={{ position: "relative", width: "100%", height: "200px", borderRadius: "4px", overflow: "hidden", border: "1px solid #262626" }}>
            <div style={{ width: "100%", height: "100%", background: "#111", filter: hasSubscription ? "none" : "blur(8px) brightness(0.5)" }} />
            {!hasSubscription && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(22,22,22,0.6)", backdropFilter: "blur(4px)" }}>
                <span style={{ fontFamily: "Georgia,serif", fontSize: "16px", color: "#f0ede8", marginBottom: "8px" }}>Unlock The Spatial Vault</span>
                <a href="/pricing/seeker" style={{ textDecoration: "none", fontFamily: "Georgia,serif", fontSize: "13px", color: "#0e0e0e", background: "#E8AE3C", border: "none", padding: "10px 24px", borderRadius: "2px", cursor: "pointer", marginTop: "12px", display: "inline-block" }}>
                  Upgrade to Cluster Tier →
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DeepIntelWidget({ open, onToggle, fields, values }) {
  // Deep intel unlocks at Solar+. SSR-safe — locked until the client reads the
  // viewer's tier. Solar+ reveals real values from `values` (keyed by label);
  // below Solar keeps the blur-locked teaser. Client-trusted for now (later
  // security pass enforces server-side) — real values ship only on demo/seed data.
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(canSee("deepIntel", getCurrentTier())); }, []);
  if (!fields || fields.length === 0) return null;

  const valueFor = (fieldKey) => {
    const v = values ? values[fieldKey] : undefined;
    return v != null && String(v).trim() !== "" ? v : null;
  };

  return (
    <div style={{marginTop:"32px"}}>
      <div style={{height:"1px", background:"#262626", marginBottom:"16px"}}/>
      <button
        onClick={onToggle}
        style={{width:"100%", background:"#161616", border:"0.5px solid #262626", padding:"14px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"2px"}}
      >
        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#E8AE3C", letterSpacing:"0.18em", textTransform:"uppercase"}}>
          DEEP INTELLIGENCE // {unlocked ? "UNLOCKED" : "VERIFIED SCOUT"}
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="#E8AE3C" strokeWidth="1.5">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}/>
        </svg>
      </button>
      {open && (unlocked ? (
        <div style={{background:"#161616", border:"0.5px solid #262626", borderTop:"none", padding:"20px", borderRadius:"0 0 2px 2px", display:"flex", flexDirection:"column"}}>
          {fields.map((field, i) => {
            const value = valueFor(field.key);
            return (
              <div key={field.key || i} style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom: i < fields.length - 1 ? "1px solid #262626" : "none", gap:"20px"}}>
                <span style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#c8c8c8"}}>{field.label || field}</span>
                {value !== null ? (
                  <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#E8AE3C", letterSpacing:"0.04em", textAlign:"right"}}>{value}</span>
                ) : (
                  <span style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#5a5a5a", letterSpacing:"0.08em", textAlign:"right"}}>Not recorded</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{background:"#161616", border:"0.5px solid #262626", borderTop:"none", padding:"20px", position:"relative", borderRadius:"0 0 2px 2px"}}>
          <div style={{filter:"blur(4px)", pointerEvents:"none", userSelect:"none", display:"flex", flexDirection:"column"}}>
            {fields.map((field, i) => (
              <div key={field.key || i} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom: i < fields.length - 1 ? "1px solid #262626" : "none"}}>
                <span style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#c8c8c8"}}>{field.label || field}</span>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#3a3a3a", letterSpacing:"0.1em"}}>████████</span>
              </div>
            ))}
          </div>
          <div style={{position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px", background:"rgba(22,22,22,0.88)", borderRadius:"0 0 2px 2px"}}>
            <span style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#E8AE3C", letterSpacing:"0.25em", textTransform:"uppercase"}}>SOLAR TIER UNLOCKS THIS</span>
            <a href="/pricing/seeker" style={{textDecoration:"none", fontFamily:"Georgia,serif", fontSize:"13px", color:"#0e0e0e", background:"#E8AE3C", border:"none", padding:"10px 24px", borderRadius:"2px", cursor:"pointer", letterSpacing:"0.04em"}}>
              Unlock Full Intelligence →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ENGINE ROOM PANEL (Cell 3 — Restaurants only)
// Collapsed by default. Operator-facing. Onlookers skip.
// ═══════════════════════════════════════════════════
function EngineRoomPanel({ property: d }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{marginBottom:"24px"}}>
      {/* Collapsed toggle — visible to all */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:"100%", background:"#161616", border:"0.5px solid #2a2a2a",
          padding:"14px 20px", cursor:"pointer", display:"flex",
          justifyContent:"space-between", alignItems:"center", borderRadius:"2px",
          marginBottom: open ? "0" : "0"
        }}
      >
        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#E8AE3C", letterSpacing:"0.18em", textTransform:"uppercase"}}>
          For Operators — Technical Specs
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="#E8AE3C" strokeWidth="1.5">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}/>
        </svg>
      </button>

      {open && (
        <div style={{background:"#161616", border:"0.5px solid #2a2a2a", borderTop:"none", padding:"20px", borderRadius:"0 0 2px 2px"}}>
          <div style={{display:"flex", flexDirection:"column"}}>
            {d.structural_notes && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Ventilation / Exhaust</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.structural_notes}</span>
              </div>
            )}
            {d.expansion_potential && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Electrical Load</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.expansion_potential}</span>
              </div>
            )}
            {d.zoning_type && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Zoning Classification</span>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#f0ede8", textAlign:"right", letterSpacing:"0.04em"}}>{d.zoning_type}</span>
              </div>
            )}
            {d.ceiling_height_text && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Ceiling Clearance</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.ceiling_height_text}</span>
              </div>
            )}
            {d.developer_name && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Building Owner / Developer</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.developer_name}</span>
              </div>
            )}
          </div>
          <p style={{fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"11.5px", color:"#6a6a6a", lineHeight:1.7, marginTop:"20px"}}>
            Technical specifications are provided by the space operator or building management. Verify independently before committing to a fit-out.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// BACK OF HOUSE PANEL (Venues only)
// Collapsed by default. Operator-facing.
// ═══════════════════════════════════════════════════
function BackOfHousePanel({ property: d }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{marginBottom:"24px"}}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width:"100%", background:"#161616", border:"0.5px solid #2a2a2a",
          padding:"14px 20px", cursor:"pointer", display:"flex",
          justifyContent:"space-between", alignItems:"center", borderRadius:"2px"
        }}
      >
        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#E8AE3C", letterSpacing:"0.18em", textTransform:"uppercase"}}>
          For Operators — Back of House
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="#E8AE3C" strokeWidth="1.5">
          <path d={open ? "M1 5L5 1L9 5" : "M1 1L5 5L9 1"}/>
        </svg>
      </button>

      {open && (
        <div style={{background:"#161616", border:"0.5px solid #2a2a2a", borderTop:"none", padding:"20px", borderRadius:"0 0 2px 2px"}}>
          <div style={{display:"flex", flexDirection:"column"}}>
            {d.structural_notes && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Load-In / Load-Out</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.structural_notes}</span>
              </div>
            )}
            {d.expansion_potential && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Rigging Notes</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.expansion_potential}</span>
              </div>
            )}
            {d.zoning_type && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Zoning Classification</span>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#f0ede8", textAlign:"right", letterSpacing:"0.04em"}}>{d.zoning_type}</span>
              </div>
            )}
            {d.ceiling_height_text && (
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", gap:"20px"}}>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Ceiling Clearance</span>
                <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.ceiling_height_text}</span>
              </div>
            )}
          </div>
          <p style={{fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"11.5px", color:"#6a6a6a", lineHeight:1.7, marginTop:"20px"}}>
            BOH specifications provided by venue management. Confirm rigging certifications, vendor exclusivity terms, and permit requirements before booking.
          </p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════
// Chapter state deep-links via ?chapter= (P2 from /impeccable critique: no way to
// share a link to a specific chapter, and refresh always reset to "The Space").
// Uses history.replaceState rather than Next.js router push so a chapter click
// never triggers a navigation/refetch — this is a URL bookmark, not a route change.
const VALID_CHAPTERS = new Set(["space","location","vault","life","whereto","buildplans","units","universe","services","yourmove"]);

function initialChapterFromUrl(fallback) {
  if (typeof window === "undefined") return fallback;
  const urlChapter = new URLSearchParams(window.location.search).get("chapter");
  return urlChapter && VALID_CHAPTERS.has(urlChapter) ? urlChapter : fallback;
}

export default function CommercialFlow({ slug, draftData, isDraftMode, externalActiveTab }) {
  // ── Interactive UI states ──────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode,         setPhotoMode]         = useState("natural");
  // Enhanced photos unlock at Solar+. SSR-safe — locked until the client reads the viewer's tier.
  const [canEnhance,        setCanEnhance]        = useState(false);
  useEffect(() => { setCanEnhance(canSee("enhancedPhotos", getCurrentTier())); }, []);
  // Market/investment "Hidden Intel" panel unlocks at Cluster+ (same SSR-safe pattern).
  const [canMarketIntel,    setCanMarketIntel]    = useState(false);
  useEffect(() => { setCanMarketIntel(canSee("marketIntel", getCurrentTier())); }, []);
  const [activeTab,         setActiveTab]         = useState(externalActiveTab || "space");
  // SSR-safe: useState's initializer can&apos;t read window (hydration mismatch —
  // React reuses the server-rendered value on mount instead of re-running the
  // initializer). Read the real ?chapter= param client-side, after mount, one
  // rAF past the initial commit — setting state synchronously in the mount
  // effect lands inside React StrictMode's dev-only double-hydration check
  // and logs a false-positive mismatch warning even though the end state is
  // correct either way; deferring one frame keeps the console clean.
  useEffect(() => {
    if (externalActiveTab) return;
    const raf = requestAnimationFrame(() => {
      const urlChapter = initialChapterFromUrl(null);
      if (urlChapter) setActiveTab(urlChapter);
    });
    return () => cancelAnimationFrame(raf);
     
  }, []);

  useEffect(() => {
    if (externalActiveTab && externalActiveTab !== activeTab) {
      setActiveTab(externalActiveTab);
      const scrollEl = document.querySelector('.zone-story');
      if (scrollEl) scrollEl.scrollTop = 0;
    }
  }, [externalActiveTab]);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [isOperatorRequestOpen, setIsOperatorRequestOpen] = useState(false);
  // The mobile bottom bar's "Inquire" action opens this modal via a global event,
  // so the primary CTA is always reachable from the thumb zone on a long page.
  useEffect(() => {
    const open = () => setIsInquiryOpen(true);
    window.addEventListener("scoutit:property-inquire", open);
    return () => window.removeEventListener("scoutit:property-inquire", open);
  }, []);
  const [propertyData, setPropertyData] = useState(() => draftData || null);
  const [dataLoading,  setDataLoading]  = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [whereToTab,        setWhereToTab]        = useState("map");
  const [locTab,            setLocTab]            = useState("map");

  // Per-panel accordion state (independent per section)
  const [accSpace,    setAccSpace]    = useState(null);
  const [accLocation, setAccLocation] = useState(null);
  const [accLife,     setAccLife]     = useState(null);
  const [accUniverse, setAccUniverse] = useState(null);
  const [accMove,     setAccMove]     = useState(null);
  const [widgets,     setWidgets]     = useState({});

  // ── Drag-to-scroll refs ───────────────────────
  const scrollRef    = useRef(null);
  const isDragging   = useRef(false);
  const startX       = useRef(0);
  const scrollStart  = useRef(0);
  const pointerDownX = useRef(null);
  const menuRef      = useRef(null);
  const touchStartX  = useRef(0);

  // ── Sync draftData when it changes ──
  useEffect(() => {
    if (draftData) {
      setPropertyData(draftData);
    }
  }, [draftData]);

  // ── Check if current user is the owner ──
  useEffect(() => {
    const saved = localStorage.getItem("scoutit_user");
    if (saved && propertyData) {
      try {
        const user = JSON.parse(saved);
        if (user.id === propertyData.ownerId) {
          setIsOwner(true);
        }
      } catch (e) {}
    }
  }, [propertyData]);

  // ── Fetch from Airtable in background; mock data already shown ──
  useEffect(() => {
    if (isDraftMode) return;
    async function loadProperty() {
      try {
        const res  = await fetch("/api/cms");
        if (!res.ok) return;
        const data = await res.json();
        if (data.properties && data.properties.length > 0) {
          // Match by slug (public links) OR by record id (dashboard links pass id)
          const match = data.properties.find(
            (p) =>
              (p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()) ||
              (p.id && p.id === slug)
          );
          if (match) {
            setPropertyData({ ...match });
          }
        }
      } catch { /* stay on mock data */ }
    }
    loadProperty();
  }, [slug]);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Detect horizontal navigation scroll to toggle fade masks
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    };

    el.addEventListener("scroll", checkScroll);
    checkScroll();

    // Check again if page elements settle or window size changes
    window.addEventListener("resize", checkScroll);
    const timer = setTimeout(checkScroll, 300);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [propertyData]);

  // Close platform menu on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Keyboard navigation for fullscreen photo lightbox
  // Also lock/unlock viewport on mobile when lightbox opens/closes
  useEffect(() => {
    if (!isLightboxOpen) {
      // Remove viewport lock when lightbox closes
      document.documentElement.classList.remove('lightbox-open');
      document.body.classList.remove('lightbox-open');
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      return;
    }
    
    // Lock viewport when lightbox opens
    document.documentElement.classList.add('lightbox-open');
    document.body.classList.add('lightbox-open');
    
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, propertyData]);

  // ── Hook calls that must run before early returns ──
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
  const publicTransitObj = useTrueClosestTransit(
    propertyData?.whereTo, 
    propertyData?.lat || propertyData?.latitude, 
    propertyData?.lng || propertyData?.longitude, 
    propertyData?.city, 
    mapboxToken
  );

  // ── Loading guard ─────────────────────────────
  if (dataLoading || !propertyData) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: "12px",
        letterSpacing: "0.15em",
        color: "var(--text-muted)"
      }}>
        LOADING SPACE INTELLIGENCE...
      </div>
    );
  }

  // ── Derived values ────────────────────────────
  const d           = propertyData;   // short alias
  const photos      = d.photos && d.photos.length > 0 ? d.photos : (d.image ? [d.image] : ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"]);
  const brokerInitials = (d.broker_name || "SA").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();

  // ── Category Detection & Custom Labels ──────────
  const cat = (d.spaceCategory || "").toLowerCase() || (d.property_type || "").toLowerCase();
  const isRestaurant = cat.includes("restaurant") || cat.includes("culinary");
  const isHospitality = cat.includes("str") || cat.includes("hospitality");
  const isVenue = cat.includes("venue") || cat.includes("event");

  // ── Chapter config (drives nav labels & chapter headings) ──
  const chapterConfig = getChapterConfig(d);
  const ch = Object.fromEntries(chapterConfig.map(c => [c.id, c]));

  // Determine brief label
  let briefLabel = "Property Details";
  if (isRestaurant) {
    briefLabel = "Culinary Details";
  } else if (isHospitality) {
    briefLabel = "Hospitality Details";
  } else if (isVenue) {
    briefLabel = "Venue Details";
  } else if (d.property_type?.toLowerCase().includes("commercial") || d.property_type?.toLowerCase().includes("office") || d.property_type?.toLowerCase().includes("retail") || cat.includes("commercial")) {
    briefLabel = "Commercial Details";
  }

  // ── Spec Pills Dynamic Curators ────────────────
  let pill1Val = d.beds;
  let pill1Label = "Bedrooms";
  let pill1Icon = <><path d="M1 9V5a2 2 0 012-2h8a2 2 0 012 2v4" strokeLinecap="round"/><path d="M1 9h12" strokeLinecap="round"/></>;

  let pill2Val = d.baths;
  let pill2Label = "Bathrooms";
  let pill2Icon = <><path d="M2 8h10M2 8V5a2 2 0 012-2v0a1 1 0 011 1v4" strokeLinecap="round"/><path d="M12 8v3" strokeLinecap="round"/></>;

  if (isRestaurant) {
    pill1Val = d.seating_capacity || "80 Seats";
    pill1Label = "Seating Capacity";
    pill1Icon = <><path d="M3 2h8v5H3V2zm0 5h8v4.5C11 12.3 10.3 13 9.5 13H4.5C3.7 13 3 12.3 3 11.5V7zM1 13h12" strokeLinecap="round"/></>;

    pill2Val = d.kitchen_grade || "Commercial AAA";
    pill2Label = "Kitchen Grade";
    pill2Icon = <><circle cx="6" cy="6" r="4"/><path d="M10 6h3" strokeLinecap="round"/><path d="M6 10v3" strokeLinecap="round"/></>;
  } else if (isHospitality) {
    pill1Val = d.accommodations || "2 Beach Suites";
    pill1Label = "Accommodations";
    pill1Icon = <><rect x="2" y="2" width="10" height="10" rx="1.5"/><circle cx="7" cy="7" r="1.5"/><path d="M3 5h4" strokeLinecap="round"/></>;

    pill2Val = d.hosting_capacity || "15 Guests";
    pill2Label = "Hosting Capacity";
    pill2Icon = <><circle cx="5" cy="4" r="2"/><circle cx="9" cy="4" r="2"/><path d="M2 11c0-2 2-3 3-3s3 1 3 3M7 11c0-2 2-3 3-3s3 1 3 3"/></>;
  } else if (isVenue) {
    pill1Val = d.seating_capacity || "350 Capacity";
    pill1Label = "Guest Capacity";
    pill1Icon = <><path d="M2 12a4 4 0 018 0" strokeLinecap="round"/><circle cx="6" cy="5" r="3"/><circle cx="12" cy="7" r="1.5"/><path d="M10 12a2 2 0 013-1" strokeLinecap="round"/></>;

    pill2Val = d.setup_grade || "Premium A/V";
    pill2Label = "Setup Grade";
    pill2Icon = <><circle cx="7" cy="7" r="5"/><path d="M7 2v2M7 10v2M2 7h2M10 7h2" strokeLinecap="round"/></>;
  }

  // Emoji icons for the Chapter 1 editorial stat block
  let pill1Emoji = <Bed size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />;
  let pill2Emoji = <Bath size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />;
  if (isRestaurant)      { pill1Emoji = "🍽"; pill2Emoji = "🔪"; }
  else if (isHospitality){ pill1Emoji = "🛎"; pill2Emoji = "👥"; }
  else if (isVenue)      { pill1Emoji = "👥"; pill2Emoji = "🎚"; }

  // ── Build Dynamic Units List ───────────────────
  // NOTE: `dynamicUnits` starts as spec-synthesized fallback units, then gets
  // overridden below by the owner&apos;s real units_inventory when one exists.
  let dynamicUnits = [];
  const isCommercial = 
    d.property_type?.toLowerCase().includes("commercial") || 
    d.property_type?.toLowerCase().includes("restaurant") || 
    d.property_type?.toLowerCase().includes("office") ||
    d.property_type?.toLowerCase().includes("retail") ||
    isVenue;

  if (isRestaurant) {
    // 1. Dining Area
    dynamicUnits.push({
      name: "Main Dining Area",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.6) : 150} sqm dining layout`,
        "Curated ambient lighting & interior acoustics",
        `Capacity: ${d.seating_capacity || "80 seats"}`,
        "Fitted furniture & custom seating plan"
      ]
    });
    // 2. Prep Kitchen
    dynamicUnits.push({
      name: "Prep Kitchen",
      specs: [
        "High electrical load capacity ready",
        "Dedicated HVAC & exhaust air integration",
        "Fresh water supply & commercial drainage lines",
        `Grade: ${d.kitchen_grade || "Commercial AAA"}`
      ]
    });
    // 3. Specialties / Menus
    dynamicUnits.push({
      name: "Secret Recipes & Menus",
      specs: [
        "Signature menu concept integration",
        "Locally-sourced organic supplier chain",
        "Award-winning recipe alignments",
        "Optimized food delivery flow"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} fitted guest washrooms`,
          "Exhaust system integrated",
          "Premium plumbing fixtures"
        ]
      });
    }
  } else if (isHospitality) {
    // 1. Main Guest Pavilion
    dynamicUnits.push({
      name: "Main Lounge & Pavilion",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.5) : 80} sqm central pavilion`,
        "High-vaulted ceiling with natural sea drafts",
        "Polished concrete & local coco-lumber columns",
        "Seamless indoor/outdoor integration"
      ]
    });
    // 2. Guest Suites
    dynamicUnits.push({
      name: "Guest Suites",
      specs: [
        `Accommodations: ${d.accommodations || "2 Luxury Suites"}`,
        "Premium ocean breeze ventilation",
        "En-suite bathroom & standing shower",
        "Private veranda access ready"
      ]
    });
    // 3. Wellness & Pool
    dynamicUnits.push({
      name: "Wellness & Pool Zones",
      specs: [
        "Saltwater pool integration",
        "Lush tropical manicured gardens",
        "Dedicated spa / massage pavilions",
        "Eco-friendly zero-footprint structures"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} separate guest washrooms`,
          "Exhaust system integrated",
          "Hot & cold utility water"
        ]
      });
    }
  } else if (isVenue) {
    // 1. Ballroom / Pavilion
    dynamicUnits.push({
      name: "Grand Ballroom / Glasshouse",
      specs: [
        `${d.floor_sqm ? Math.round(d.floor_sqm * 0.7) : 400} sqm event floor`,
        `Ceiling clearance: ${d.ceiling_height_text || "6.5 meters"}`,
        "Reinforced overhead rigging points",
        "Smart acoustic ceiling clouds"
      ]
    });
    // 2. Dressing Suite
    dynamicUnits.push({
      name: "VIP Holding & Dressing Suite",
      specs: [
        "Dedicated vanity mirrors & makeup console",
        "Private en-suite restroom & lounge seating",
        "Secure card-key access control",
        "Acoustical isolation from main floor"
      ]
    });
    // 3. Service Bay
    dynamicUnits.push({
      name: "Catering Prep & Service Bay",
      specs: [
        "Direct utility access & loading dock corridor",
        "Dedicated high flow wastewater line",
        "High load power outlets for cooling/cooking",
        "Easy ingress/egress for vendor teams"
      ]
    });
    // 4. Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      dynamicUnits.push({
        name: "Washrooms",
        specs: [
          `${bathsCount} separate washrooms`,
          "Modern high-traffic plumbing fixtures",
          "Dedicated makeup counter & wash basins",
          "Exhaust system integrated"
        ]
      });
    }
  } else {
    // Traditional Fallback
    // 1. Outdoor/Lobby/Pool
    if (d.outdoor_description && d.outdoor_description !== "None" && d.outdoor_description !== "") {
      let name = "Balcony";
      if (d.outdoor_description.toLowerCase().includes("pool") || d.outdoor_description.toLowerCase().includes("beach")) {
        name = "Pool & Beach";
      } else if (d.outdoor_description.toLowerCase().includes("lobby") || d.outdoor_description.toLowerCase().includes("foyer") || d.outdoor_description.toLowerCase().includes("waiting")) {
        name = "Lobby & Entrance";
      } else if (d.outdoor_description.toLowerCase().includes("garden") || d.outdoor_description.toLowerCase().includes("walkway")) {
        name = "Gardens & Walkways";
      } else if (d.outdoor_description.toLowerCase().includes("courtyard")) {
        name = "Courtyard";
      }
      
      dynamicUnits.push({
        name,
        specs: [
          d.outdoor_description,
          "Open Air / Access Space",
          "Safe & Maintained"
        ]
      });
    }

    // 2. Main Spaces (for Commercial) or Rooms (for Residential/STR)
    if (isCommercial) {
      dynamicUnits.push({
        name: "Main Hall / Space",
        specs: [
          `${d.floor_sqm ? Math.round(d.floor_sqm * 0.6) : 150} sqm est.`,
          "Open layout configuration",
          "Central lighting & acoustics",
          `${d.ceiling_height_text || "3.8m ceiling"}`
        ]
      });
      dynamicUnits.push({
        name: "Kitchen & Utilities",
        specs: [
          `${d.floor_sqm ? Math.round(d.floor_sqm * 0.25) : 50} sqm est.`,
          "High load power ready",
          "Fresh air intake systems",
          "Water supply integration"
        ]
      });
    } else {
      const bedsCount = Number(d.beds || 0);
      for (let i = 1; i <= bedsCount; i++) {
        dynamicUnits.push({
          name: i === 1 ? "Master Suite" : `Room ${i}`,
          specs: [
            `${bedsCount > 0 ? Math.round((d.floor_sqm * 0.6) / bedsCount) : 25} sqm est.`,
            "Premium ventilation & lighting",
            "Aircon integration ready",
            i === 1 ? "Large layout double-bed space" : "Single/Twin bed sizing",
            `${d.ceiling_height_text || "3.2m ceiling"}`
          ]
        });
      }
    }

    // 3. Bathrooms / Washrooms
    const bathsCount = Number(d.baths || 0);
    if (bathsCount > 0) {
      if (isCommercial) {
        dynamicUnits.push({
          name: "Washrooms",
          specs: [
            `${bathsCount} separate units`,
            "Modern plumbing fixtures",
            "High flow exhaust fans",
            "Dedicated wash stations"
          ]
        });
      } else {
        for (let i = 1; i <= bathsCount; i++) {
          dynamicUnits.push({
            name: i === 1 ? "Master Bath" : `Bathroom ${i}`,
            specs: [
              "Standing shower installation",
              "Hot & cold utility water",
              "Exhaust system integrated",
              i === 1 ? "Dual vanity ready" : "Single vanity sizing"
            ]
          });
        }
      }
    }
  }



  // ── Owner inventory override ───────────────────
  // Real owner-entered units (units_inventory) take precedence over the
  // spec-synthesized fallback. Each unit carries its own photo + specs.
  const realUnits = Array.isArray(d.units_inventory)
    ? d.units_inventory.filter(u => u && (u.name || u.size || u.price || u.photo))
    : [];
  if (realUnits.length > 0) {
    dynamicUnits = realUnits.map((u, i) => ({
      // id is the real property_units UUID, serialized into Units_JSON since
      // the /api/dashboard/units rewrite (SCOUTIT_MASTER_BUILD_SPEC.md §9) —
      // absent for any older/mock unit data, in which case no Unit Master
      // Page link renders (see the "View Unit Master Page" guard below).
      id: u.id || null,
      name: u.name || `Unit ${String(i + 1).padStart(2, "0")}`,
      specs: [
        u.size  ? `${u.size} sqm`     : null,
        u.floor ? `Floor ${u.floor}`  : null,
        u.price ? String(u.price)     : null,
        ...(Array.isArray(u.features) ? u.features : []),
      ].filter(Boolean),
      photo: u.photo || u.image || (Array.isArray(u.photos) ? u.photos.find(Boolean) : "") || "",
      isReal: true,
    }));
  }

  // The currently selected unit object (drives the in-context detail sub-panel).
  const activeUnitObj =
    dynamicUnits.find(u => u.name === selectedUnit) || dynamicUnits[0] || null;

  // ── Photo navigation ──────────────────────────
  const goPrev = () => setCurrentImageIndex(i => (i === 0 ? photos.length - 1 : i - 1));
  const goNext = () => setCurrentImageIndex(i => (i + 1) % photos.length);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX.current;
    if (diff > 50) {
      goPrev();
    } else if (diff < -50) {
      goNext();
    }
  };

  // ── Drag-to-scroll handlers ───────────────────
  // Pointer Events + setPointerCapture so the drag keeps tracking even when
  // the cursor leaves the (narrow) nav strip mid-drag -- the old mouse-event
  // version cancelled on mouseleave, which made fast drags feel like they
  // kept getting interrupted. Touch is left alone (native scroll handles it).
  // A press only becomes a drag once it moves past this many pixels -- below
  // that, we never preventDefault/capture, so a plain click on a nav-chapter
  // button underneath reaches it untouched (previously *every* pointerdown
  // claimed the pointer immediately, which silently ate all tab clicks).
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
      // Movement just confirmed this is a drag, not a click -- claim the
      // pointer now (not on pointerdown) so the browser's native text/content
      // selection drag doesn&apos;t fight our scroll from here on.
      isDragging.current = true;
      startX.current = pointerDownX.current;
      scrollRef.current.style.cursor = "grabbing";
      // CSS gives .nav-inner scroll-behavior:smooth for nice keyboard-focus
      // scrolling, but that animates every scrollLeft write -- during a live
      // drag that means dozens of overlapping animations fighting each other,
      // which is what made dragging feel laggy/late. Go instant while dragging.
      scrollRef.current.style.scrollBehavior = "auto";
      try { scrollRef.current.setPointerCapture(e.pointerId); } catch {}
    }
    e.preventDefault();
    const delta = (e.pageX - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollStart.current - delta;
  };

  // ── Accordion toggle ──────────────────────────
  const tog = (setter, current, key) => setter(current === key ? null : key);

  // Smooth scroll page to chapter content on mobile tab selection
  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", tabId);
      window.history.replaceState(null, "", url);
    }
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        document.querySelector('.zone-story')
          ?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
      }, 50);
    }
  };

  // ── Where To renderer ─────────────────────────
  // Extract sidebar location values dynamically from whereTo array
  const nearestMallObj = d.whereTo?.find(p => p.category?.toLowerCase() === "essentials" || p.category?.toLowerCase() === "business" || p.name?.toLowerCase().includes("mall") || p.name?.toLowerCase().includes("shop"));
  const nearestHospitalObj = d.whereTo?.find(p => p.category?.toLowerCase() === "healthcare" || p.name?.toLowerCase().includes("hospital") || p.name?.toLowerCase().includes("medical"));
  
  const hasWalk = d.whereTo?.some(p => p.distance?.toLowerCase().includes("walk"));
  const transitLabel = publicTransitObj?.name || "";
  // Clean the name for geocoding: drop parentheticals, "stops", normalize "Ave"
  const transitDestination = transitLabel
    ? `${transitLabel
        .replace(/\(.*?\)/g, "")
        .replace(/\b(jeepney|bus)?\s*stops?\b/gi, "")
        .replace(/\bAve\b/gi, "Avenue")
        .trim()}, ${d.city || "Metro Manila"}, Philippines`
    : "";
  const transitDestCoords = publicTransitObj?.trueCoords || null;

  const commuteCards = [
    { label: "BGC",     value: d.commute_bgc },
    { label: "Makati",  value: d.commute_makati },
    { label: "Ortigas", value: d.commute_ortigas },
  ].filter(c => c.value);

  // ── Where To renderer ─────────────────────────
  const renderWhereTo = () => {
    if (!d.whereTo || d.whereTo.length === 0) {
      return (
        <div style={{
          padding: "32px",
          background: "var(--surface)",
          border: "0.5px dashed var(--border-mid)",
          borderRadius: "4px",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--text-muted)",
          letterSpacing: "0.1em",
          gridColumn: "1 / -1"
        }}>
          [ LOCATION DETAILS N/A — NO DATA IN CMS ]
        </div>
      );
    }

    const groups = {};
    d.whereTo.forEach(p => {
      const cat = p.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return Object.entries(groups).map(([cat, items]) => (
      <div className="where-category" key={cat}>
        <div className="where-cat-label">{cat}</div>
        {items.map((item, idx) => (
          <div className="where-item" key={idx}>
            <span className="where-name">{item.name}</span>
            <span className="where-dist">{item.distance}</span>
          </div>
        ))}
      </div>
    ));
  };

  // ══════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════
  return (
    <>
      <div className="grain" />

      <div className="page">

        {/* ════ ZONE 1 – PHOTO ════ */}
        <div 
          className="zone-photo" 
          id="photoZone" 
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

          {photos.map((url, i) => (
            <div
              key={i}
              className={`photo-slide ${photoMode} ${currentImageIndex === i ? "active" : ""}`}
              style={{ 
                backgroundImage: `url(${url})`
              }}
            />
          ))}

          <div className="light-shaft" />

          <div className="photo-decor">
            <svg viewBox="0 0 1000 320" preserveAspectRatio="xMidYMid slice">
              <rect x="680" y="30" width="200" height="150" fill="none" stroke="rgba(232, 174, 60,0.1)" strokeWidth="1"/>
              <line x1="780" y1="30" x2="780" y2="180" stroke="rgba(232, 174, 60,0.07)" strokeWidth="0.5"/>
              <line x1="680" y1="105" x2="880" y2="105" stroke="rgba(232, 174, 60,0.07)" strokeWidth="0.5"/>
              <rect x="100" y="240" width="320" height="58" rx="3" fill="rgba(25,20,12,0.75)"/>
              <rect x="118" y="222" width="285" height="32" rx="3" fill="rgba(30,24,14,0.65)"/>
              <rect x="100" y="222" width="26"  height="76" rx="2" fill="rgba(28,22,13,0.7)"/>
              <rect x="392" y="222" width="26"  height="76" rx="2" fill="rgba(28,22,13,0.7)"/>
              <rect x="470" y="264" width="145" height="28" rx="2" fill="rgba(35,27,15,0.55)"/>
              <rect x="875" y="120" width="3"   height="140" fill="rgba(40,32,18,0.45)"/>
              <ellipse cx="876" cy="120" rx="19" ry="7" fill="rgba(40,32,18,0.35)"/>
            </svg>
          </div>

          <div className="photo-fade-top" />
          <div className="photo-fade-left" />
          <div className="photo-fade-bottom" />

          {/* Hero Intel */}
          <div 
            className="hero-intel"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <p className="hero-label">ScoutIt &middot; {briefLabel}</p>
            <h1 className="hero-title">{d.title}</h1>
            <p className="hero-location">{d.location || d.city || "Location on request"}</p>
            <p className="hero-hook">{d.hook}</p>
            {isOwner && (
              <div style={{ marginTop: '24px' }}>
                <Link href={`/dashboard?edit=${d.id}`} className="font-working-title text-sm tracking-widest text-[#0e0e0e] bg-gold-accent px-6 py-3 rounded hover:bg-[#e6a600] transition-colors uppercase font-bold inline-block border border-gold-accent shadow-[0_0_15px_rgba(232,174,60,0.4)] cursor-pointer">
                  Edit Property Dossier
                </Link>
              </div>
            )}
          </div>



          {/* Arrows */}
          <div className="photo-arrow left"  onClick={(e) => { e.stopPropagation(); goPrev(); }}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="9,2 4,7 9,12"/></svg>
          </div>
          <div className="photo-arrow right" onClick={(e) => { e.stopPropagation(); goNext(); }}>
            <svg className="arrow-svg" viewBox="0 0 14 14"><polyline points="5,2 10,7 5,12"/></svg>
          </div>

          {/* Controls */}
          <div className="photo-controls" onClick={(e) => e.stopPropagation()}>
            <div className="photo-controls-left">
              <div className="photo-toggle">
                <button
                  className={`toggle-btn ${photoMode === "natural"  ? "active" : "off"}`}
                  onClick={() => setPhotoMode("natural")}
                >Natural</button>
                {canEnhance ? (
                  <button
                    className={`toggle-btn ${photoMode === "enhanced" ? "active" : "off"}`}
                    onClick={() => setPhotoMode("enhanced")}
                  >Enhanced</button>
                ) : (
                  <a
                    href="/pricing/seeker"
                    className="toggle-btn off"
                    title="Enhanced photos unlock at Solar tier — upgrade to view"
                    style={{ display: "inline-flex", alignItems: "center", gap: "5px", textDecoration: "none" }}
                  >
                    <Lock size={9} strokeWidth={2} /> Enhanced
                  </a>
                )}
              </div>
              <button 
                className="toggle-btn off" 
                style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsLightboxOpen(true)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                Expand Photo
              </button>
              <div className="photo-dots">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`dot ${currentImageIndex === i ? "active" : ""}`}
                    onClick={() => setCurrentImageIndex(i)}
                  />
                ))}
              </div>
            </div>
            <div className="photo-count">{currentImageIndex + 1} / {photos.length}</div>
          </div>

        </div>{/* /zone-photo */}

        {/* Mobile-only Hero Intel (visible on mobile viewport, hidden on desktop) */}
        <div className="mobile-hero-intel">
          <p className="mobile-hero-label">ScoutIt &middot; {briefLabel}</p>
          <h1 className="mobile-hero-title">{d.title}</h1>
          <p className="mobile-hero-location">{d.location || d.city || "Location on request"}</p>
          <p className="mobile-hero-hook">{d.hook}</p>
          {isOwner && (
            <div style={{ marginTop: '20px' }}>
              <Link href={`/dashboard?edit=${d.id}`} className="font-working-title text-xs tracking-widest text-[#0e0e0e] bg-gold-accent px-5 py-3 rounded hover:bg-[#e6a600] transition-colors uppercase font-bold inline-block border border-gold-accent w-full text-center">
                Edit Property Dossier
              </Link>
            </div>
          )}
        </div>

        {/* ════ ZONE 2 – NAV (drag-to-scroll) ════ */}
        <div className={`zone-nav ${canScrollLeft ? "can-scroll-left" : ""} ${canScrollRight ? "can-scroll-right" : ""}`}>
          <div
            className="nav-inner"
            role="tablist"
            aria-label="Property chapters"
            ref={scrollRef}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" }}
            onPointerDown={onDragStart}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            onPointerMove={onDragMove}
          >

            {/* ── Core tabs ── */}
            {[
              { id: "space",    label: "The Space",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M6.5 9h7M6.5 12h4.5M6.5 6h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { id: "location", label: "Location",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2C7.24 2 5 4.24 5 7c0 4.5 5 11 5 11s5-6.5 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="7" r="2" stroke="currentColor" strokeWidth="1.3"/></svg> },
              { id: "vault",    label: "The Vault",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2l6 4v8l-6 4-6-4V6l6-4z" stroke="currentColor" strokeWidth="1.3"/><path d="M10 2v8M4 6l6 4M16 6l-6 4" stroke="currentColor" strokeWidth="1.3"/></svg> },
              { id: "life",     label: "Life Here",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 3C8 3 5 5 5 8c0 2 1 3.5 2.5 4.5L10 17l2.5-4.5C14 11.5 15 10 15 8c0-3-3-5-5-5z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="8" r="1.5" fill="currentColor" stroke="none"/></svg> },
              { id: "whereto",  label: "Where To?",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { id: "buildplans", label: "Build Plans",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h8M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 14l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="12" y="12" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg> },

            ].map((tab, idx, arr) => (
              <span key={tab.id} style={{display:"contents"}}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  className={`nav-chapter ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  {tab.icon}
                  <span className="chapter-label">{tab.label}</span>
                </button>
                {idx < arr.length - 1 && <div className="nav-divider" />}
              </span>
            ))}

            <div className="nav-section-divider" />

            {/* Units */}
            {dynamicUnits.length > 0 && (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === "units"}
                  className={`nav-chapter ${activeTab === "units" ? "active" : ""}`}
                  onClick={() => handleTabClick("units")}
                >
                  <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                    <rect x="3"  y="3"  width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                    <rect x="11" y="3"  width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                    <rect x="3"  y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                  </svg>
                  <span className="chapter-label">Units</span>
                </button>
                <div className="nav-divider" />
              </>
            )}

            {/* Universe */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "universe"}
              className={`nav-chapter ${activeTab === "universe" ? "active" : ""}`}
              onClick={() => handleTabClick("universe")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <rect x="3" y="6" width="14" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 6V5a3 3 0 016 0v1" stroke="currentColor" strokeWidth="1.3"/>
                <circle cx="10" cy="11.5" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              <span className="chapter-label">Universe</span>
            </button>

            <div className="nav-divider" />

            {/* Services */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "services"}
              className={`nav-chapter ${activeTab === "services" ? "active" : ""}`}
              onClick={() => handleTabClick("services")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <path d="M10 2.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L10 16.3 6.3 17.3l.7-4.3-3.1-3 4.3-.6z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              <span className="chapter-label">Services</span>
            </button>

            <div className="nav-divider" />

            {/* Your Move — CTA */}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "yourmove"}
              className={`nav-chapter nav-chapter--cta ${activeTab === "yourmove" ? "active" : ""}`}
              onClick={() => handleTabClick("yourmove")}
            >
              <svg className="chapter-icon" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h10M11 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="chapter-label">Your Move</span>
            </button>

          </div>{/* /nav-inner */}

        </div>{/* /zone-nav */}

        {/* ════ ZONE 3 – STORY ════ */}
        <div className="zone-story">

          {/* ── THE SPACE (Ch. 1) ── */}
          <div className={`chapter-panel ${activeTab === "space" ? "active" : ""}`} id="panel-space">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>01 — The Space</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {/* ── STAT BLOCK: category-aware ── */}
              {isRestaurant ? (
                /* Cell 1: The Kitchen & Dining Room stat block */
                <div style={{marginBottom:"36px"}}>
                  {d.aesthetic_tag && (
                    <div style={{marginBottom:"24px"}}>
                      <span style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"#E8AE3C", letterSpacing:"0.01em", lineHeight:1.2}}>
                        {d.aesthetic_tag || d.accordion_3_rating}
                      </span>
                    </div>
                  )}
                  <div className="property-features-scroll">
                    {[
                      d.seating_capacity || d.cover_count ? { icon:"🍽", val: d.seating_capacity || d.cover_count, label:"Cover Count" } : null,
                      d.kitchen_grade                     ? { icon:"🔪", val: d.kitchen_grade, label:"Kitchen Grade" } : null,
                      d.floor_sqm > 0                     ? { icon:<Ruler size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />, val: d.floor_sqm, label:"sqm total" } : null,
                      d.parking > 0                       ? { icon:<Car size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />, val: d.parking, label:"Parking Slots" } : null,
                    ].filter(Boolean).map((stat, i) => (
                      <div key={i} className="property-feature-item">
                        <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                          <span style={{fontSize:"24px", lineHeight:1, flexShrink:0}}>{stat.icon}</span>
                          <span style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.5vw,26px)", fontWeight:500, color:"#f0ede8", lineHeight:1.2}}>{stat.val}</span>
                        </div>
                        <div style={{fontFamily:"var(--font-body)", fontSize:"10px", fontWeight:600, color:"#c8c8c8", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"6px"}}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:"1px", background:"#262626", margin:"0 0 24px"}}/>
                  <div style={{display:"flex", flexDirection:"column"}}>
                    {d.seating_breakdown && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Seating Breakdown</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.seating_breakdown}</span>
                      </div>
                    )}
                    {d.ceiling_height_text && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ceiling Clearance</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.ceiling_height_text}</span>
                      </div>
                    )}
                    {d.outdoor_description && d.outdoor_description !== "None" && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Al Fresco / Outdoor</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                      </div>
                    )}
                  </div>
                  {d.accordion_3_text && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"17px", color:"#f0ede8", lineHeight:1.9, margin:"26px 0 0", maxWidth:"580px"}}>
                      {d.accordion_3_text}
                    </p>
                  )}
                </div>
              ) : isVenue ? (
                /* Cell 2: Production Capacity stat block */
                <div style={{marginBottom:"36px"}}>
                  {d.aesthetic_tag && (
                    <div style={{marginBottom:"24px"}}>
                      <span style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"#E8AE3C", letterSpacing:"0.01em", lineHeight:1.2}}>
                        {d.aesthetic_tag || d.accordion_3_rating}
                      </span>
                    </div>
                  )}
                  <div className="property-features-scroll">
                    {[
                      d.seating_capacity ? { icon:"🪑", val: d.seating_capacity, label:"Seated Capacity" } : null,
                      d.standing_capacity ? { icon:"👥", val: d.standing_capacity, label:"Standing Capacity" } : null,
                      d.setup_grade      ? { icon:"🎚", val: d.setup_grade, label:"Setup Grade" } : null,
                      d.floor_sqm > 0    ? { icon:<Ruler size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />, val: d.floor_sqm, label:"sqm floor" } : null,
                    ].filter(Boolean).map((stat, i) => (
                      <div key={i} className="property-feature-item">
                        <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                          <span style={{fontSize:"24px", lineHeight:1, flexShrink:0}}>{stat.icon}</span>
                          <span style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.5vw,26px)", fontWeight:500, color:"#f0ede8", lineHeight:1.2}}>{stat.val}</span>
                        </div>
                        <div style={{fontFamily:"var(--font-body)", fontSize:"10px", fontWeight:600, color:"#c8c8c8", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"6px"}}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:"1px", background:"#262626", margin:"0 0 24px"}}/>
                  <div style={{display:"flex", flexDirection:"column"}}>
                    {d.ceiling_height_text && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ceiling Clearance</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.ceiling_height_text}</span>
                      </div>
                    )}
                    {d.outdoor_description && d.outdoor_description !== "None" && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Outdoor / Covered</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                      </div>
                    )}
                  </div>
                  {d.accordion_3_text && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"17px", color:"#f0ede8", lineHeight:1.9, margin:"26px 0 0", maxWidth:"580px"}}>
                      {d.accordion_3_text}
                    </p>
                  )}
                </div>
              ) : (
                /* Default: generic stat block (Commercial, STR, Hospitality) */
                <>
                  {(d.aesthetic_tag || d.accordion_3_rating) && (
                    <div style={{marginBottom:"30px"}}>
                      <span style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"#E8AE3C", letterSpacing:"0.01em", lineHeight:1.2}}>
                        {d.aesthetic_tag || d.accordion_3_rating}
                      </span>
                    </div>
                  )}
                  <div className="property-features-scroll">
                    {[
                      pill1Val && pill1Val !== 0 ? { icon: pill1Emoji, val: pill1Val, label: pill1Label } : null,
                      pill2Val && pill2Val !== 0 ? { icon: pill2Emoji, val: pill2Val, label: pill2Label } : null,
                      d.floor_sqm > 0 ? { icon: <Ruler size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />, val: d.floor_sqm, label: "sqm floor" } : null,
                      d.parking > 0 ? { icon: <Car size={24} strokeWidth={1.5} style={{color:"#f0ede8"}} />, val: d.parking, label: "Parking Slots" } : null,
                      d.lot_sqm > 0 ? { icon: "🌿", val: d.lot_sqm, label: "Lot sqm" } : null,
                    ].filter(Boolean).map((stat, i) => (
                      <div key={i} className="property-feature-item">
                        <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                          <span style={{fontSize:"24px", lineHeight:1, flexShrink:0}}>{stat.icon}</span>
                          <span style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.5vw,26px)", fontWeight:500, color:"#f0ede8", lineHeight:1.2}}>{stat.val}</span>
                        </div>
                        <div style={{fontFamily:"var(--font-body)", fontSize:"10px", fontWeight:600, color:"#c8c8c8", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"6px"}}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{height:"1px", background:"#262626", margin:"0 0 24px"}}/>
                  <div style={{display:"flex", flexDirection:"column"}}>
                    {d.ceiling_height_text && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ceiling Height</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.ceiling_height_text}</span>
                      </div>
                    )}
                    {d.furnishing && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Furnishing</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{d.furnishing}</span>
                      </div>
                    )}
                    {d.outdoor_description && d.outdoor_description !== "None" && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Outdoor Space</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                      </div>
                    )}
                  </div>
                  {d.accordion_3_text && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"17px", color:"#f0ede8", lineHeight:1.9, margin:"26px 0 0", maxWidth:"580px"}}>
                      {d.accordion_3_text}
                    </p>
                  )}
                  <DeepIntelWidget
                    open={widgets.space}
                    onToggle={() => setWidgets(w => ({...w, space: !w.space}))}
                    values={d.details || d.deepIntel}
                    fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[1] || []}
                  />
                </>
              )}

              {/* ── CATEGORY SPEC BLOCK (per-category d.cat.* — SOP §2/§8) ──
                  Editorial deep-intel labels are folded into its single locked
                  teaser (replaces the separate DeepIntelWidget that used to sit
                  here, so The Space chapter shows one premium box, not two). */}
              <CategorySpecBlock
                property={d}
                extraLockedLabels={isRestaurant
                  ? ["Kitchen-to-Dining Ratio","Acoustic Baseline Score","Ambient Light Temperature","Ventilation Capacity"]
                  : isVenue
                  ? ["Rigging Load Ratings","Floor Load Limit","Acoustic Treatment Grade","Sound Isolation Rating"]
                  : ["Ventilation Quality","Noise Level Score","Natural Light Score","Privacy Score","Acoustic Baseline"]
                }
              />

            </div>

            <div className="panel-sidebar">
              {d.city && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Location</div><div className="sidebar-value">{d.city}</div>{d.location && <div className="sidebar-sub">{d.location}</div>}</div>}
              {d.property_type && <div className="sidebar-block"><div className="sidebar-label">Type</div><div className="sidebar-value">{d.property_type}</div></div>}
              {d.tenure && <div className="sidebar-block"><div className="sidebar-label">Tenure</div><div className="sidebar-value">{d.tenure}</div></div>}
              {d.year_built && <div className="sidebar-block"><div className="sidebar-label">Year Built</div><div className="sidebar-value">{d.year_built}</div></div>}
              {d.title_status && <div className="sidebar-block"><div className="sidebar-label">Title</div><div className="sidebar-value">{d.title_status}</div></div>}
            </div>
          </div>

          {/* ── THE VAULT (Ch. Premium) ── */}
          <div className={`chapter-panel ${activeTab === "vault" ? "active" : ""}`} id="panel-vault">
            <div className="panel-content" style={{ maxWidth: "100%" }}>
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#E8AE3C", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>PREMIUM — THE SPATIAL VAULT</div>
                <div style={{height:"1px", background:"#E8AE3C"}}/>
              </div>

              <div style={{marginBottom:"30px"}}>
                <span style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"#f0ede8", letterSpacing:"0.01em", lineHeight:1.2}}>
                  3D Virtual Tours & Blueprints
                </span>
              </div>

              <SpatialVaultWidget 
                lumaUrl={d.luma3dMapUrl} 
                matterportUrl={d.matterportTourUrl} 
                heatmapUrl={d.droneHeatmapUrl} 
              />
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background: "#E8AE3C"}}/><div className="sidebar-label" style={{color: "#E8AE3C"}}>Vault Status</div><div className="sidebar-value">Secured</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Verification</div><div className="sidebar-value">ScoutIT Pros</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Access</div><div className="sidebar-value">Cluster Tier Only</div></div>
            </div>
          </div>

          {/* ── LOCATION (Ch. 2) ── */}
          <div className={`chapter-panel ${activeTab === "location" ? "active" : ""}`} id="panel-location">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>02 — Location</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {(d.location || d.city) && (
                <div style={{margin:"0 0 28px"}}>
                  <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(28px,4.5vw,52px)", fontWeight:400, color:"#f0ede8", lineHeight:1.12}}>
                    {d.location || d.city}
                  </div>
                  {d.city && d.location && d.location !== d.city && (
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#c8c8c8", letterSpacing:"0.14em", marginTop:"10px", textTransform:"uppercase"}}>
                      {d.city} · NCR
                    </div>
                  )}
                </div>
              )}

              {/* Free location facts — grouped (Risk & Zoning / Access) per
                  /impeccable critique's chunking guideline (≤4 items/group) */}
              <div style={{display:"flex", flexDirection:"column", marginBottom:"24px"}}>
                {(d.flood_zone_status || d.zoning_classification) && (
                  <>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#5a5a5a", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"2px"}}>Risk &amp; Zoning</span>
                    {d.flood_zone_status && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Flood Zone</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.flood_zone_status}</span>
                      </div>
                    )}
                    {d.zoning_classification && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Zoning</span>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#f0ede8", textAlign:"right", letterSpacing:"0.04em"}}>{d.zoning_classification}</span>
                      </div>
                    )}
                  </>
                )}
                {(publicTransitObj || d.nearest_highway || d.street_type) && (
                  <>
                    <span style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#5a5a5a", letterSpacing:"0.18em", textTransform:"uppercase", marginTop:"16px", marginBottom:"2px"}}>Access</span>
                    {publicTransitObj && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Nearest Transit</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{publicTransitObj.name} · {publicTransitObj.distance}</span>
                      </div>
                    )}
                    {d.nearest_highway && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Major Road</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.nearest_highway}</span>
                      </div>
                    )}
                    {d.street_type && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Street Type</span>
                        <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.street_type}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Commute context cards */}
              {commuteCards.length > 0 && (
                <>
                  <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Commute Context</div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:"10px", marginBottom:"28px"}}>
                    {commuteCards.map(c => (
                      <div key={c.label} style={{flex:"1 1 120px", background:"#161616", border:"0.5px solid #262626", borderRadius:"4px", padding:"14px 16px"}}>
                        <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:"8px"}}>To {c.label}</div>
                        <div style={{fontFamily:"Georgia,serif", fontSize:"18px", color:"#f0ede8"}}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Public transport editorial */}
              {d.public_transport && (
                <p style={{fontFamily:"Georgia,serif", fontSize:"15px", color:"#f0ede8", lineHeight:1.85, margin:"0 0 28px", maxWidth:"580px"}}>
                  {d.public_transport}
                </p>
              )}

              <div style={{height:"1px", background:"#262626", margin:"0 0 20px"}}/>

              {/* Map / List toggle */}
              <div className="whereto-tabs" style={{marginBottom:"20px"}}>
                <button className={`whereto-tab-btn ${locTab === "map" ? "active" : ""}`} onClick={() => setLocTab("map")}>
                  <span className="btn-pulse"/>Tactical Map
                </button>
                <button className={`whereto-tab-btn ${locTab === "list" ? "active" : ""}`} onClick={() => setLocTab("list")}>
                  Directory List
                </button>
                <button className={`whereto-tab-btn ${locTab === "flood" ? "active" : ""}`} onClick={() => setLocTab("flood")}>
                  Flood Risk Map
                </button>
                {isNearManilaRail(d.lat || d.latitude, d.lng || d.longitude) && (
                  <button className={`whereto-tab-btn ${locTab === "transit" ? "active" : ""}`} onClick={() => setLocTab("transit")}>
                    Rail Network
                  </button>
                )}
              </div>

              {locTab === "flood" && (
                <FloodHeatmapMap
                  lat={d.lat || d.latitude}
                  lng={d.lng || d.longitude}
                  propertyTitle={d.title}
                />
              )}

              {locTab === "transit" && (
                <ManilaTransitMap
                  propertyLat={d.lat || d.latitude}
                  propertyLng={d.lng || d.longitude}
                  propertyTitle={d.title}
                  trueTransitCoords={transitDestCoords}
                />
              )}

              {locTab === "map" && (
                <div style={{height:"clamp(600px, 80vh, 850px)", minHeight:"600px", flexShrink:0, borderRadius:"4px", overflow:"hidden", border:"0.5px solid #262626", marginBottom:"80px"}}>
                  <InteractiveMap
                    lat={d.lat || d.latitude || 14.5547}
                    lng={d.lng || d.longitude || 121.0244}
                    propertyTitle={d.title}
                    vicinityData={d.whereTo}
                    routeDestination={transitDestination}
                    routeDestCoords={transitDestCoords}
                    routeLabel={transitLabel}
                    mapboxToken={mapboxToken}
                  />
                </div>
              )}

              {locTab === "list" && d.whereTo && d.whereTo.length > 0 && (
                <div style={{display:"flex", flexDirection:"column", marginBottom:"8px"}}>
                  {d.whereTo.map((item, idx) => (
                    <div key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #262626"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"#E8AE3C", flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{item.name}</div>
                          {item.category && <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px"}}>{item.category}</div>}
                        </div>
                      </div>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#c8c8c8", letterSpacing:"0.1em", flexShrink:0}}>{item.distance}</span>
                    </div>
                  ))}
                </div>
              )}

              <DeepIntelWidget
                open={widgets.location}
                onToggle={() => setWidgets(w => ({...w, location: !w.location}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[2] || []}
              />

            </div>

            <div className="panel-sidebar">
              {d.city && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">District</div><div className="sidebar-value">{d.city}</div><div className="sidebar-sub">NCR</div></div>}
              <div className="mini-map">
                <div className="map-road-h" style={{top:"33%"}}/><div className="map-road-h" style={{top:"55%"}}/>
                <div className="map-road-v" style={{left:"30%"}}/><div className="map-road-v" style={{left:"60%"}}/>
                <div className="map-pulse"/><div className="map-pin"/>
              </div>
              {d.street_type && <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>}
            </div>
          </div>

           {/* ── LIFE HERE (Ch. 3) — category-specific vibe framing ── */}
          <div className={`chapter-panel ${activeTab === "life" ? "active" : ""}`} id="panel-life">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>{ch['life']?.chapterNumber || '03'} — {ch['life']?.chapterLabel || 'Life Here'}</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {/* Best Suited For — gold chips */}
              {(() => {
                const tags = (d.bestForTags && d.bestForTags.length > 0)
                  ? d.bestForTags
                  : (d.best_for ? d.best_for.split("·").map(s => s.trim()).filter(Boolean) : []);
                if (tags.length === 0) return null;
                return (
                  <div style={{marginBottom:"28px"}}>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"14px"}}>
                      {isRestaurant ? "Best For" : isVenue ? "Ideal Events" : "Best Suited For"}
                    </div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"10px"}}>
                      {tags.map((t, i) => (
                        <span key={i} style={{fontFamily:"Georgia,serif", fontSize:"15px", color:"#E8AE3C", border:"0.5px solid rgba(232, 174, 60,0.4)", padding:"7px 18px", borderRadius:"4px", letterSpacing:"0.02em"}}>{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Editorial lead quote — lifestyle_vibe doubles as acoustic/vibe descriptor for restaurants */}
              {d.lifestyle_vibe && (
                <p style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(20px,2.6vw,26px)", fontWeight:400, color:"#f0ede8", lineHeight:1.45, margin:"0 0 24px", maxWidth:"560px"}}>
                  {d.lifestyle_vibe}
                </p>
              )}

              {/* Category-specific detail rows */}
              {isRestaurant && (
                /* Cell 7: The Vibe — acoustic profile, lighting, table intimacy */
                <div style={{display:"flex", flexDirection:"column", marginBottom:"20px"}}>
                  {d.acoustic_profile && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Acoustic Profile</span>
                      <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.acoustic_profile}</span>
                    </div>
                  )}
                  {d.lighting_temperature && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Lighting</span>
                      <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.lighting_temperature}</span>
                    </div>
                  )}
                  {d.community_feel && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.9, margin:"20px 0 0", maxWidth:"580px"}}>
                      {d.community_feel}
                    </p>
                  )}
                </div>
              )}

              {isVenue && (
                /* Cell 8: Event Atmosphere — sound isolation, acoustic treatment, lighting */
                <div style={{display:"flex", flexDirection:"column", marginBottom:"20px"}}>
                  {d.acoustic_profile && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Sound Isolation</span>
                      <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.acoustic_profile}</span>
                    </div>
                  )}
                  {d.lighting_temperature && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", gap:"20px"}}>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Lighting Capability</span>
                      <span style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8", textAlign:"right"}}>{d.lighting_temperature}</span>
                    </div>
                  )}
                  {d.community_feel && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.9, margin:"20px 0 0", maxWidth:"580px"}}>
                      {d.community_feel}
                    </p>
                  )}
                </div>
              )}

              {!isRestaurant && !isVenue && (
                /* Fallback: generic community / safety content for Commercial, STR, Hospitality */
                <>
                  {d.community_feel && (
                    <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.9, margin:"0 0 20px", maxWidth:"580px"}}>
                      {d.community_feel}
                    </p>
                  )}
                  {d.safety_perception && (
                    <>
                      <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", margin:"4px 0 12px"}}>Safety Perception</div>
                      <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.9, margin:"0", maxWidth:"580px"}}>
                        {d.safety_perception}
                      </p>
                    </>
                  )}
                </>
              )}

              <DeepIntelWidget
                open={widgets.life}
                onToggle={() => setWidgets(w => ({...w, life: !w.life}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[3] || []}
              />

            </div>

            <div className="panel-sidebar">
              {d.lifestyle_vibe && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">{isRestaurant ? 'Vibe' : isVenue ? 'Atmosphere' : 'Vibe'}</div><div className="sidebar-value">{d.lifestyle_vibe}</div></div>}
              {d.best_for && <div className="sidebar-block"><div className="sidebar-label">{isRestaurant ? 'Best For' : isVenue ? 'Ideal For' : 'Best for'}</div><div className="sidebar-value">{d.best_for}</div></div>}
              {d.acoustic_profile && <div className="sidebar-block"><div className="sidebar-label">Acoustics</div><div className="sidebar-value">{d.acoustic_profile}</div></div>}
              {!isRestaurant && !isVenue && d.street_type && <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>}
            </div>
          </div>

          {/* ── WHERE TO? (Ch. 4) — Around the Table / Guest Radius for restaurants/venues ── */}
          <div className={`chapter-panel ${activeTab === "whereto" ? "active" : ""}`} id="panel-whereto">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>{ch['whereto']?.chapterNumber || '04'} — {ch['whereto']?.chapterLabel || 'Where To?'}</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {/* Cell 9: Demand Anchors for restaurants and venues */}
              {(isRestaurant || isVenue) && d.demand_anchors && (
                <div style={{marginBottom:"28px"}}>
                  <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"14px"}}>
                    {isRestaurant ? "Demand Anchors — What Drives Cover Count" : "Demand Anchors — Event Traffic Sources"}
                  </div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:"8px", marginBottom:"20px"}}>
                    {(Array.isArray(d.demand_anchors)
                      ? d.demand_anchors
                      : d.demand_anchors.split(",").map(s => s.trim()).filter(Boolean)
                    ).map((anchor, i) => (
                      <span key={i} style={{
                        fontFamily:"'Courier New',monospace", fontSize:"10px",
                        color:"#f0ede8", background:"#1a1a1a",
                        border:"0.5px solid #2e2e2e", padding:"6px 14px",
                        borderRadius:"2px", letterSpacing:"0.1em", textTransform:"uppercase"
                      }}>{anchor}</span>
                    ))}
                  </div>
                  <div style={{height:"1px", background:"#262626", margin:"0 0 24px"}}/>
                </div>
              )}

              <div className="whereto-tabs" style={{marginBottom:"20px"}}>
                <button className={`whereto-tab-btn ${whereToTab === "map" ? "active" : ""}`} onClick={() => setWhereToTab("map")}>
                  <span className="btn-pulse"/>Tactical Map
                </button>
                <button className={`whereto-tab-btn ${whereToTab === "list" ? "active" : ""}`} onClick={() => setWhereToTab("list")}>
                  Directory List
                </button>
              </div>

              {whereToTab === "map" && (
                <div style={{height:"clamp(600px, 80vh, 850px)", minHeight:"600px", flexShrink:0, borderRadius:"4px", overflow:"hidden", border:"0.5px solid #262626", marginBottom:"120px"}}>
                  <InteractiveMap
                    lat={d.lat || d.latitude || 14.5547}
                    lng={d.lng || d.longitude || 121.0244}
                    propertyTitle={d.title}
                    vicinityData={d.whereTo}
                    mapboxToken={mapboxToken}
                  />
                </div>
              )}

              {whereToTab === "list" && d.whereTo && d.whereTo.length > 0 && (
                <div style={{display:"flex", flexDirection:"column", marginBottom:"24px"}}>
                  {d.whereTo.map((item, idx) => (
                    <div key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid #262626"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"#E8AE3C", flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#f0ede8"}}>{item.name}</div>
                          {item.category && <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px"}}>{item.category}</div>}
                        </div>
                      </div>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#c8c8c8", letterSpacing:"0.1em", flexShrink:0}}>{item.distance}</span>
                    </div>
                  ))}
                </div>
              )}

              {whereToTab === "list" && (!d.whereTo || d.whereTo.length === 0) && (
                <div style={{padding:"32px", background:"#161616", border:"0.5px dashed #262626", borderRadius:"2px", textAlign:"center", fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#c8c8c8", letterSpacing:"0.12em", marginBottom:"24px"}}>
                  [ LOCATION DETAILS N/A — NO DATA IN CMS ]
                </div>
              )}

              <DeepIntelWidget
                open={widgets.whereto}
                onToggle={() => setWidgets(w => ({...w, whereto: !w.whereto}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[4] || []}
              />

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block">
                <div className="sidebar-accent-line"/>
                <div className="sidebar-label">Nearest mall</div>
                <div className="sidebar-value">{nearestMallObj ? nearestMallObj.name : "N/A"}</div>
                <div className="sidebar-sub">{nearestMallObj ? nearestMallObj.distance : "Not specified"}</div>
              </div>
              <div className="sidebar-block">
                <div className="sidebar-label">Nearest hospital</div>
                <div className="sidebar-value">{nearestHospitalObj ? nearestHospitalObj.name : "N/A"}</div>
                <div className="sidebar-sub">{nearestHospitalObj ? nearestHospitalObj.distance : "Not specified"}</div>
              </div>
              <div className="sidebar-block">
                <div className="sidebar-label">Public transit</div>
                <div className="sidebar-value">{publicTransitObj ? publicTransitObj.name : "N/A"}</div>
                <div className="sidebar-sub">{publicTransitObj ? publicTransitObj.distance : "Not specified"}</div>
              </div>
            </div>
          </div>

          {/* ── BUILD PLANS (Ch. 5) — Engine Room for restaurants/venues, default for others ── */}
          <div className={`chapter-panel ${activeTab === "buildplans" ? "active" : ""}`} id="panel-buildplans">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>{ch['buildplans']?.chapterNumber || '05'} — {ch['buildplans']?.chapterLabel || 'Build Plans'}</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {isRestaurant ? (
                /* Cell 3: The Engine Room — collapsed by default, operator-facing */
                <EngineRoomPanel property={d} />
              ) : isVenue ? (
                /* Back of House — collapsed by default */
                <BackOfHousePanel property={d} />
              ) : (
                /* Default: Build Plans for Commercial, STR, Hospitality */
                <>
                  {d.expansion_potential && (
                    <>
                      <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Expansion Potential</div>
                      <p style={{fontFamily:"Georgia,serif", fontSize:"17px", color:"#f0ede8", lineHeight:1.9, margin:"0 0 28px", maxWidth:"580px"}}>
                        {d.expansion_potential}
                      </p>
                    </>
                  )}
                  {d.zoning_type && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid #262626", marginBottom:"24px", gap:"20px"}}>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.12em", textTransform:"uppercase"}}>Zoning Type</span>
                      <span style={{fontFamily:"'Courier New',monospace", fontSize:"12px", color:"#f0ede8", letterSpacing:"0.04em", textAlign:"right"}}>{d.zoning_type}</span>
                    </div>
                  )}
                  {d.developer_name && (
                    <div style={{background:"#161616", border:"0.5px solid #262626", borderRadius:"4px", padding:"18px 20px", marginBottom:"24px"}}>
                      <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>Developer</div>
                      <div style={{fontFamily:"Georgia,serif", fontSize:"18px", color:"#f0ede8", marginBottom: d.developer_notes ? "8px" : "0"}}>{d.developer_name}</div>
                      {d.developer_notes && (
                        <div style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#a0a0a0", lineHeight:1.7}}>{d.developer_notes}</div>
                      )}
                    </div>
                  )}
                  {d.structural_notes && (
                    <>
                      <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Structural Notes</div>
                      <p style={{fontFamily:"Georgia,serif", fontSize:"15px", color:"#f0ede8", lineHeight:1.85, margin:"0", maxWidth:"580px"}}>
                        {d.structural_notes}
                      </p>
                    </>
                  )}
                  <DeepIntelWidget
                    open={widgets.buildplans}
                    onToggle={() => setWidgets(w => ({...w, buildplans: !w.buildplans}))}
                    values={d.details || d.deepIntel}
                    fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[5] || []}
                  />
                </>
              )}

            </div>

            <div className="panel-sidebar">
              {isRestaurant ? (
                <>
                  {d.kitchen_grade && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Kitchen Grade</div><div className="sidebar-value">{d.kitchen_grade}</div></div>}
                  {d.seating_capacity && <div className="sidebar-block"><div className="sidebar-label">Cover Count</div><div className="sidebar-value">{d.seating_capacity}</div></div>}
                  {d.zoning_type && <div className="sidebar-block"><div className="sidebar-label">Zoning</div><div className="sidebar-value">{d.zoning_type}</div></div>}
                </>
              ) : isVenue ? (
                <>
                  {d.setup_grade && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Setup Grade</div><div className="sidebar-value">{d.setup_grade}</div></div>}
                  {d.zoning_type && <div className="sidebar-block"><div className="sidebar-label">Zoning</div><div className="sidebar-value">{d.zoning_type}</div></div>}
                </>
              ) : (
                <>
                  {d.zoning_type && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Zoning</div><div className="sidebar-value">{d.zoning_type}</div></div>}
                  {d.developer_name && <div className="sidebar-block"><div className="sidebar-label">Developer</div><div className="sidebar-value">{d.developer_name}</div></div>}
                  {d.year_built && <div className="sidebar-block"><div className="sidebar-label">Year built</div><div className="sidebar-value">{d.year_built}</div></div>}
                </>
              )}
            </div>
          </div>


          {/* ── UNITS (Ch. 7) ── */}
          <div className={`chapter-panel ${activeTab === "units" ? "active" : ""}`} id="panel-units">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>07 — Units &amp; Spaces</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <div className="units-z3-list">
                {dynamicUnits.map((u, ui) => {
                  const activeUnit = selectedUnit || (dynamicUnits.length > 0 ? dynamicUnits[0].name : "");
                  return (
                    <div
                      className={`unit-z3-row ${activeUnit === u.name ? "selected" : ""}`}
                      key={u.name}
                      id={`unit-row-${ui}`}
                      onClick={() => {
                        setSelectedUnit(u.name);
                        let targetIndex = 0;
                        if (u.name.toLowerCase().includes("suite") || u.name.toLowerCase().includes("master")) { targetIndex = 1 % photos.length; }
                        else if (u.name.toLowerCase().includes("room")) { const num = parseInt(u.name.replace(/\D/g, ""), 10); targetIndex = (isNaN(num) ? 1 : num) % photos.length; }
                        else if (u.name.toLowerCase().includes("bath") || u.name.toLowerCase().includes("washroom")) { targetIndex = (photos.length - 1) % photos.length; }
                        else if (u.name.toLowerCase().includes("kitchen") || u.name.toLowerCase().includes("utility")) { targetIndex = 1 % photos.length; }
                        else { targetIndex = 2 % photos.length; }
                        if (photos && photos.length > 0) setCurrentImageIndex(targetIndex);
                      }}
                    >
                      <div>
                        <div style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color: activeUnit === u.name ? "#E8AE3C" : "#c8c8c8", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>
                          UNIT {String(ui + 1).padStart(2, "0")}
                        </div>
                        <div className="unit-z3-name">{u.name}</div>
                      </div>
                      <div className="unit-z3-specs">
                        {u.specs.map(s => <span key={s} className="unit-z3-spec">{s}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Selected-unit detail sub-panel (in-context, no new page) ── */}
              {activeUnitObj && (
                <div style={{marginTop:"28px", border:"0.5px solid #262626", borderRadius:"6px", overflow:"hidden", background:"#121212"}}>
                  {activeUnitObj.photo ? (
                    <div style={{width:"100%", aspectRatio:"16 / 9", backgroundImage:`url(${activeUnitObj.photo})`, backgroundSize:"cover", backgroundPosition:"center", transition:"background-image 240ms ease"}}/>
                  ) : (
                    <div style={{width:"100%", aspectRatio:"16 / 9", display:"flex", alignItems:"center", justifyContent:"center", background:"#0d0d0d", fontFamily:"'Courier New',monospace", fontSize:"10px", letterSpacing:"0.2em", color:"#6a6a6a", textTransform:"uppercase"}}>
                      No unit photo provided
                    </div>
                  )}
                  <div style={{padding:"20px 22px"}}>
                    <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#E8AE3C", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"8px"}}>
                      Selected Unit — Full Detail
                    </div>
                    <div style={{fontFamily:"Georgia,serif", fontSize:"22px", color:"#f0ede8", marginBottom:"14px"}}>
                      {activeUnitObj.name}
                    </div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"8px"}}>
                      {activeUnitObj.specs.length > 0 ? (
                        activeUnitObj.specs.map(s => (
                          <span key={s} style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#c8c8c8", letterSpacing:"0.08em", border:"0.5px solid #262626", borderRadius:"3px", padding:"6px 10px"}}>{s}</span>
                        ))
                      ) : (
                        <span style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#6a6a6a"}}>No additional specs entered.</span>
                      )}
                    </div>
                    {/* Real units carry a stable id (property_units.id); synthesized
                        fallback units don&apos;t and have no master page to link to. */}
                    {activeUnitObj.id && (
                      <Link
                        href={`/property/${d.slug}/unit/${activeUnitObj.id}`}
                        style={{display:"inline-block", marginTop:"16px", fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#E8AE3C", letterSpacing:"0.1em", textTransform:"uppercase", textDecoration:"none"}}
                      >
                        View Unit Master Page →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <DeepIntelWidget
                open={widgets.units}
                onToggle={() => setWidgets(w => ({...w, units: !w.units}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "commercial"]?.[6] || []}
              />

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Total Areas</div><div className="sidebar-value">{dynamicUnits.length}</div></div>

              {/* Photo preview thumbnail */}
              {photos && photos.length > 0 && photos[0] && (
                <div style={{width:"100%", height:"120px", minHeight:"120px", flexShrink:0, borderRadius:"4px", overflow:"hidden", border:"0.5px solid #262626", backgroundImage:`url(${photos[currentImageIndex] || photos[0]})`, backgroundSize:"cover", backgroundPosition:"center"}}/>
              )}

              {/* Totals */}
              <div style={{display:"flex", flexDirection:"column", gap:"2px"}}>
                {isRestaurant ? (
                  <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Dining Capacity</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Kitchen Grade</div><div className="sidebar-value">{pill2Val}</div></div>}</>
                ) : isHospitality ? (
                  <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Accommodations</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Hosting Capacity</div><div className="sidebar-value">{pill2Val}</div></div>}</>
                ) : isVenue ? (
                  <>{pill1Val && <div className="sidebar-block"><div className="sidebar-label">Guest Capacity</div><div className="sidebar-value">{pill1Val}</div></div>}{pill2Val && <div className="sidebar-block"><div className="sidebar-label">Setup Grade</div><div className="sidebar-value">{pill2Val}</div></div>}</>
                ) : (
                  <>
                    {d.beds > 0 && <div className="sidebar-block"><div className="sidebar-label">Total Bedrooms</div><div className="sidebar-value">{d.beds}</div></div>}
                    {d.baths > 0 && <div className="sidebar-block"><div className="sidebar-label">Total Bathrooms</div><div className="sidebar-value">{d.baths}</div></div>}
                  </>
                )}
                {d.floor_sqm > 0 && <div className="sidebar-block"><div className="sidebar-label">Total Floor Area</div><div className="sidebar-value">{d.floor_sqm} sqm</div></div>}
              </div>

              {/* Clickable unit index */}
              {dynamicUnits.length > 0 && (
                <div className="sidebar-block">
                  <div className="sidebar-label" style={{marginBottom:"10px"}}>Unit Index</div>
                  <div style={{display:"flex", flexDirection:"column", gap:"2px"}}>
                    {dynamicUnits.map((u, ui) => {
                      const activeUnit = selectedUnit || dynamicUnits[0].name;
                      return (
                        <button
                          key={u.name}
                          onClick={() => {
                            setSelectedUnit(u.name);
                            const el = document.getElementById(`unit-row-${ui}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          style={{display:"flex", alignItems:"baseline", gap:"10px", width:"100%", textAlign:"left", background:"none", border:"none", borderBottom:"1px solid #262626", padding:"9px 0", cursor:"pointer"}}
                        >
                          <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color: activeUnit === u.name ? "#E8AE3C" : "#6a6a6a", letterSpacing:"0.12em", flexShrink:0}}>{String(ui + 1).padStart(2, "0")}</span>
                          <span style={{fontFamily:"Georgia,serif", fontSize:"13px", color: activeUnit === u.name ? "#f0ede8" : "#c8c8c8", lineHeight:1.3}}>{u.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── UNIVERSE (Ch. 8) ── */}
          <div className={`chapter-panel ${activeTab === "universe" ? "active" : ""}`} id="panel-universe">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>08 — Property Universe</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              {d.building_style && (
                <div style={{marginBottom:"24px"}}>
                  <span style={{fontFamily:"Georgia,serif", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"#E8AE3C", letterSpacing:"0.01em"}}>
                    {d.building_style}
                  </span>
                </div>
              )}

              {d.architect_designer && (
                <div style={{background:"#161616", border:"0.5px solid #262626", borderRadius:"4px", padding:"16px 20px", marginBottom:"28px"}}>
                  <div style={{fontFamily:"'Courier New',monospace", fontSize:"9px", color:"#c8c8c8", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>Architect / Designer</div>
                  <div style={{fontFamily:"Georgia,serif", fontSize:"18px", color:"#f0ede8"}}>{d.architect_designer}</div>
                </div>
              )}

              {d.universe_summary && (
                <p style={{fontFamily:"Georgia,serif", fontSize:"clamp(20px,2.5vw,26px)", color:"#f0ede8", lineHeight:1.85, margin:"0 0 8px", maxWidth:"640px"}}>
                  {d.universe_summary}
                </p>
              )}

              {d.scoutit_verdict && (
                <>
                  <div style={{height:"1px", background:"#262626", margin:"28px 0 20px"}}/>
                  <div className="verdict-block">
                    <div className="verdict-header"><div className="verdict-dot"/><div className="verdict-title">Space Intelligence Verdict</div></div>
                    <p className="verdict-text">{d.scoutit_verdict}</p>
                    {d.bestForTags && d.bestForTags.length > 0 && (
                      <div className="verdict-score">
                        {d.bestForTags.map((t, i) => <span key={i} className="verdict-pill">{t}</span>)}
                      </div>
                    )}
                  </div>
                </>
              )}

              <DeepIntelWidget
                open={widgets.universe}
                onToggle={() => setWidgets(w => ({...w, universe: !w.universe}))}
                values={d.deepIntel}
                fields={["Detailed Historical Transaction Records","Architectural Heritage Notes","Original Permit & Blueprint Archive","Provenance & Ownership Lineage"]}
              />

            </div>

            <div className="panel-sidebar">
              {/* Verdict — the ScoutIt editorial stamp, premium & final */}
              {d.scoutit_verdict && (
                <div className="sidebar-block" style={{paddingBottom:"22px", borderBottom:"1px solid #262626", marginBottom:"4px"}}>
                  <div className="sidebar-accent-line" style={{background:"#E8AE3C"}}/>
                  <div style={{fontFamily:"'Courier New',monospace", fontSize:"11px", color:"#E8AE3C", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"10px"}}>ScoutIt Verdict</div>
                  <div style={{fontFamily:"Georgia,serif", fontSize:"20px", color:"#E8AE3C", lineHeight:1.35}}>{d.scoutit_verdict}</div>
                </div>
              )}
              {d.building_style && <div className="sidebar-block"><div className="sidebar-label">Building Style</div><div className="sidebar-value">{d.building_style}</div></div>}
              {d.architect_designer && <div className="sidebar-block"><div className="sidebar-label">Architect</div><div className="sidebar-value">{d.architect_designer}</div></div>}
              {d.year_built && <div className="sidebar-block"><div className="sidebar-label">Year Built</div><div className="sidebar-value">{d.year_built}</div></div>}
              {d.title_status && <div className="sidebar-block"><div className="sidebar-label">Title Status</div><div className="sidebar-value" style={{color:"#4caf7d"}}>{d.title_status}</div></div>}
              {d.spaceCategory && <div className="sidebar-block"><div className="sidebar-label">Space Category</div><div className="sidebar-value">{d.spaceCategory}</div></div>}
            </div>
          </div>

          {/* ── SERVICES (Ch. 9) ── */}
          <div className={`chapter-panel ${activeTab === "services" ? "active" : ""}`} id="panel-services">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>09 — Services</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <p style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#f0ede8", lineHeight:1.85, margin:"0 0 28px", maxWidth:"560px"}}>
                Commission a ScoutIt ecosystem partner to go deeper on this space — from spatial renders to full due-diligence research.
              </p>

              <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
                {[
                  { icon:"🗺️", title:"Curated 3D Map",     desc:"Get a spatial 3D rendering of this property.",            href:"/photographers" },
                  { icon:"🎨", title:"Pre-Design Concept",  desc:"See this space redesigned to your preferences.",          href:"/event-planners" },
                  { icon:<Search size={22} strokeWidth={1.5} style={{color:"#f0ede8"}} />, title:"Site Research",       desc:"Commission a full due-diligence report on this property.", href:"/researchers" },
                  { icon:<Camera size={22} strokeWidth={1.5} style={{color:"#f0ede8"}} />, title:"Space Photography",   desc:"Get professional architectural photos taken.",            href:"/photographers" },
                  { icon:<Building2 size={22} strokeWidth={1.5} style={{color:"#f0ede8"}} />, title:"Verified Advisor",    desc:"Connect with an authorized space intelligence advisor.",  href:"/brokers" },
                ].map(svc => (
                  <Link
                    key={svc.title}
                    href={svc.href}
                    style={{textDecoration:"none", display:"flex", alignItems:"center", gap:"16px", padding:"18px 20px", background:"#161616", border:"0.5px solid #262626", borderRadius:"4px", transition:"border-color 0.2s ease"}}
                  >
                    <span style={{fontSize:"22px", flexShrink:0, lineHeight:1}}>{svc.icon}</span>
                    <span style={{flex:1, minWidth:0}}>
                      <span style={{display:"block", fontFamily:"Georgia,serif", fontSize:"17px", color:"#f0ede8", marginBottom:"3px"}}>{svc.title}</span>
                      <span style={{display:"block", fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"12.5px", color:"#c8c8c8", lineHeight:1.5}}>{svc.desc}</span>
                    </span>
                    <span style={{fontFamily:"Georgia,serif", fontSize:"16px", color:"#E8AE3C", flexShrink:0}}>→</span>
                  </Link>
                ))}
              </div>

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"#E8AE3C"}}/><div className="sidebar-label">Ecosystem</div><div className="sidebar-value">5 services live</div><div className="sidebar-sub">Vetted ScoutIt partners</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Fulfilment</div><div className="sidebar-value">Partner-direct</div></div>
            </div>
          </div>

          {/* ── YOUR MOVE ── */}
          <div className={`chapter-panel ${activeTab === "yourmove" ? "active" : ""}`} id="panel-yourmove">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"10px"}}>10 — Your Move</div>
                <div style={{height:"1px", background:"#262626"}}/>
              </div>

              <h2 style={{fontFamily:"Georgia,serif", fontWeight:400, fontSize:"clamp(26px,3.6vw,40px)", color:"#f0ede8", lineHeight:1.25, margin:"4px 0 28px", maxWidth:"600px"}}>
                When you&apos;re ready, we&apos;ll make the introduction.
              </h2>

              <div className="reactions-container" style={{marginTop:"0", display:"flex", flexDirection:"column", gap:"10px"}}>
                <p style={{fontFamily:"'Courier New',monospace", fontSize:"10px", textTransform:"uppercase", letterSpacing:"0.2em", color:"#c8c8c8", marginBottom:"16px"}}>HOW DOES THIS SPACE MAKE YOU FEEL?</p>
                <ReactionButtons propertyId={slug || "batasan-hills"} propertyTitle={d.title} category={d.property_type} city={d.city}/>
              </div>

              {/* Price — SOP §9. A price is Published only when a human authority
                  (Owner / Property Manager / Broker) confirmed it. Unverified or
                  withheld → "Price on request"; never display an unverified price. */}
              {(() => {
                const hasPrice = d.listed_price && d.listed_price.trim().toUpperCase() !== "N/A";
                const isPublished = (d.price_status || "").toLowerCase().includes("publish");
                const verifiedBy = (d.price_verified_by || "").trim();
                const isVerified = verifiedBy && verifiedBy.toLowerCase() !== "unverified";
                const showPrice = hasPrice && isPublished && isVerified;
                return (
                  <>
                    <div style={{height:"1px", background:"#262626", margin:"28px 0 24px"}}/>
                    {showPrice ? (
                      <div style={{padding:"22px 24px", background:"#161616", border:"0.5px solid #262626", borderRadius:"4px"}}>
                        <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(30px,4.2vw,44px)", fontWeight:400, color:"#f0ede8", lineHeight:1.1}}>{d.listed_price}</div>
                        {/* Verified-by badge — the confirmation the buyer can trust */}
                        <div style={{display:"inline-flex", alignItems:"center", gap:"7px", marginTop:"14px", padding:"6px 12px", border:"0.5px solid rgba(76,175,125,0.4)", borderRadius:"4px", background:"rgba(76,175,125,0.06)"}}>
                          <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#4caf7d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 7.5L6 11l5.5-7"/></svg>
                          <span style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#4caf7d", letterSpacing:"0.12em", textTransform:"uppercase"}}>Verified by {verifiedBy}</span>
                        </div>
                        {d.price_source && (
                          <div style={{fontFamily:"'Courier New',monospace", fontSize:"11px", letterSpacing:"0.1em", color:"#c8c8c8", marginTop:"12px"}}>
                            Source: {d.price_source}
                          </div>
                        )}
                        {d.price_notes && (
                          <div style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#a0a0a0", lineHeight:1.6, marginTop:"10px"}}>{d.price_notes}</div>
                        )}
                        <p style={{fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"11.5px", color:"#c8c8c8", lineHeight:1.7, marginTop:"16px"}}>
                          Price is provided and confirmed by the listing&apos;s authorized owner, property manager, or broker. ScoutIt displays it as confirmed by that party. For inquiries, speak directly with an authorized representative.
                        </p>
                      </div>
                    ) : (
                      <div style={{padding:"22px 24px", background:"#161616", border:"0.5px solid #262626", borderRadius:"4px"}}>
                        <div style={{fontFamily:"Georgia,serif", fontSize:"clamp(20px,2.6vw,26px)", fontWeight:400, color:"#f0ede8", lineHeight:1.2}}>Price on request</div>
                        <p style={{fontFamily:"Georgia,serif", fontSize:"14px", color:"#a0a0a0", lineHeight:1.7, margin:"10px 0 16px", maxWidth:"480px"}}>
                          No confirmed rate has been published for this space. Inquire with the owner, property manager, or broker for current pricing.
                        </p>
                        <Link href={`/property/${slug || "batasan-hills"}/brokers`} style={{display:"inline-block", fontFamily:"Georgia,serif", fontSize:"16px", color:"#E8AE3C", textDecoration:"none", letterSpacing:"0.01em"}}>
                          Inquire with an authorized broker →
                        </Link>
                      </div>
                    )}
                  </>
                );
              })()}

              <div style={{height:"1px", background:"#262626", margin:"28px 0 24px"}}/>

              <div style={{marginTop:"0"}}>
                <div style={{fontFamily:"'Courier New',monospace", fontSize:"10px", color:"#c8c8c8", letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:"12px"}}>Assigned Representative</div>
                <div className="broker-card">
                  <div className="broker-avatar">{brokerInitials}</div>
                  <div className="broker-info">
                    <div className="broker-name-el">{d.broker_name}</div>
                    <div className="broker-meta">Direct Listing</div>
                    <div className="broker-rating" style={{color:"#4caf7d"}}>Verified broker</div>
                  </div>
                </div>
              </div>

              <button onClick={() => setIsInquiryOpen(true)} className="move-cta" style={{textDecoration:"none", marginTop:"16px", width:"100%"}}>
                Connect with an Authorized Broker →
              </button>

              {/* Co-working operators only (Operator hat) — §9.2 delegation handshake */}
              {hasActiveRole("operator") && (
                <button
                  onClick={() => setIsOperatorRequestOpen(true)}
                  style={{
                    marginTop: "10px", width: "100%", background: "transparent",
                    border: "0.5px solid rgba(232,174,60,0.4)", color: "#E8AE3C",
                    fontFamily: "'Courier New',monospace", fontSize: "11px",
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    padding: "12px 16px", borderRadius: "4px", cursor: "pointer",
                  }}
                >
                  Request to Operate This Building →
                </button>
              )}

              {/* RA 9646 compliance badge */}
              <div style={{display:"inline-flex", alignItems:"center", gap:"8px", marginTop:"20px", padding:"8px 14px", border:"0.5px solid rgba(76,175,125,0.4)", borderRadius:"4px", background:"rgba(76,175,125,0.06)"}}>
                <span style={{width:"7px", height:"7px", borderRadius:"50%", background:"#4caf7d", flexShrink:0}}/>
                <span style={{fontFamily:"'Courier New',monospace", fontSize:"9.5px", color:"#4caf7d", letterSpacing:"0.14em", textTransform:"uppercase"}}>RA 9646 Compliant · Display-Only</span>
              </div>

              <p style={{fontFamily:"Georgia,serif", fontSize:"13px", color:"#c8c8c8", lineHeight:1.7, marginTop:"16px", maxWidth:"600px"}}>
                ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646, all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed, authorized real estate brokers.
              </p>

            </div>

            <div className="panel-sidebar">
              {d.tenure && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Acquisition</div><div className="sidebar-value">{d.tenure}</div>{d.title_status && <div className="sidebar-sub">{d.title_status}</div>}</div>}
              {d.scoutit_verdict && <div className="sidebar-block"><div className="sidebar-label">ScoutIt verdict</div><div className="sidebar-value" style={{color:"#4caf7d", fontSize:"12px", lineHeight:1.4}}>{d.scoutit_verdict}</div></div>}
            </div>
          </div>

         </div>{/* /zone-story */}


       </div>{/* /page */}

      {isOwner && !isDraftMode && (
        <button
          onClick={() => window.location.href = `/dashboard?edit=${d.id}`}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#E8AE3C',
            color: '#0A0908',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '4px',
            fontFamily: "'Courier New',monospace",
            fontSize: '12px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(232, 174, 60,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Enter Live Canvas
        </button>
      )}

      <InquiryModal
        isOpen={isInquiryOpen}
        onClose={() => setIsInquiryOpen(false)}
        propertyTitle={d.title}
        propertySlug={d.slug}
      />

      <OperatorRequestModal
        isOpen={isOperatorRequestOpen}
        onClose={() => setIsOperatorRequestOpen(false)}
        propertyTitle={d.title}
        propertySlug={d.slug}
      />

      {/* Lightbox / Fullscreen Modal */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button 
            className="lightbox-close" 
            onClick={(e) => { e.stopPropagation(); setIsLightboxOpen(false); }}
            aria-label="Close fullscreen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          
          <button 
            className="lightbox-arrow left" 
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            aria-label="Previous photo"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="9,2 4,7 9,12"/></svg>
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={photos[currentImageIndex]} 
              alt={`${d.title} fullscreen view`} 
              className={`lightbox-image ${photoMode}`} 
            />
          </div>

          <button 
            className="lightbox-arrow right" 
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            aria-label="Next photo"
          >
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="5,2 10,7 5,12"/></svg>
          </button>

          <div className="lightbox-counter">
            {currentImageIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
