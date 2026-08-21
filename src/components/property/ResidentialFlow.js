/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
// Third React Compiler disable, added 2026-08-13 — see the matching note in
// CommercialFlow.js. Introducing the useCuratedShare hook changed what the compiler
// can infer across this component, so it can no longer preserve the pre-existing
// manual memo on `cat`. Nothing is broken; the rule reports that the compiler is
// declining to auto-optimize, not that the memo is wrong.
/* eslint-disable react-hooks/preserve-manual-memoization */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ReactionButtons from "@/components/ui/ReactionButtons";
import { useTrueClosestTransit } from "@/hooks/useTrueClosestTransit";
import "@/app/property/[id]/property-detail.css";

// Leaflet is huge. We dynamically import the InteractiveMap so the initial page load
// doesn't block on parsing the React Leaflet wrapper.
const InteractiveMap = dynamic(() => import("@/components/property/InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "100%", width: "100%", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>Loading tactical map…</span>
    </div>
  ),
});
import { getChapterConfig } from "./chapterConfig";
import { PROPERTY_LEVEL_LABEL, childSpaceDisplayName, getPropertyHierarchy } from "@/lib/propertyHierarchy";
import { Lock, Unlock, Zap, ChevronRight, Share2, MapPin, Eye, Search, Layers, X, Home, Users, ArrowUpRight, Copy, Check, Bed, Bath, Ruler, Car, Building2, Camera } from "lucide-react";
import Image from "next/image";
import FreshnessBadge from "@/components/ui/FreshnessBadge";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import InViewport from "@/components/ui/InViewport";
import GlassPanel from "@/components/ui/GlassPanel";
import HoverCard from "@/components/ui/HoverCard";
import MeshHero from "@/components/ui/MeshHero";

// Heavy below-the-fold components dynamically imported to minimize initial mobile JS payload & TBT
const ShareModal = dynamic(() => import("./ShareModal"), { ssr: false });
const InquiryModal = dynamic(() => import("@/components/property/InquiryModal"), { ssr: false });
const PropertyFAQSection = dynamic(() => import("@/components/property/PropertyFAQSection"), { ssr: false });
const WhereToSection = dynamic(() => import("@/components/property/WhereToSection"), { ssr: false });
const OperatorRequestModal = dynamic(() => import("@/components/property/OperatorRequestModal"), { ssr: false });
const AffordabilityCalculator = dynamic(() => import("@/components/property/AffordabilityCalculator"), { ssr: false });
const SpatialVaultWidget = dynamic(() => import("@/components/property/SpatialVaultWidget"), { ssr: false });
import MonthlyCostCalculator from "@/components/property/MonthlyCostCalculator";
import FloodRiskBadge from "@/components/property/FloodRiskBadge";
import MarketChapter from "@/components/property/MarketChapter";
import IntelDoorCard from "@/components/intel/IntelDoorCard";
import AttachedFindingCard from "@/components/property/AttachedFindingCard";
import { getSignalsForProperty, getSignalBySlug, getSignalResolution } from "@/lib/signalsData";
import { hasInteractiveUnitPage, hasSpatial3D, unitMasterPageOverview, formatUnitPrice } from "@/lib/unitMasterPage";
import { canSee, getCurrentTier, hasActiveRole } from "@/lib/entitlements";
import useCuratedShare from "@/lib/useCuratedShare";
import { fieldLabel } from "@/lib/fieldLabel";
import { downloadPropertyTearSheet } from "@/lib/propertyTearSheet";

// Code-split maplibre-gl + pmtiles out of the main property-page bundle — they&apos;re
// only needed if the visitor taps the Flood Risk Map tab, which was the real cause
// of the slow mobile-data load (not the tab-gated render, the eager static import).
const FloodHeatmapMap = dynamic(() => import("@/components/property/FloodHeatmapMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "clamp(360px, 48vh, 440px)", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Loading flood hazard data…</span>
    </div>
  ),
});
// mapbox-gl + @turf/turf are only needed for the Rail Network tab, and that
// tab itself only renders for properties actually near the LRT/MRT network.
const ManilaTransitMap = dynamic(() => import("@/components/transit/ManilaTransitMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "clamp(420px, 52vh, 480px)", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Loading rail network…</span>
    </div>
  ),
});
const SpatialCommandMap = dynamic(() => import("@/components/property/SpatialCommandMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "420px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Loading spatial command HUD…</span>
    </div>
  ),
});
const SpatialCanvas = dynamic(() => import("@/components/maps/SpatialCanvas"), {
  ssr: false,
  loading: () => (
    <div style={{ height: "420px", background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>Loading spatial canvas…</span>
    </div>
  ),
});
const USE_SPATIAL_CANVAS = true;
import { DEEP_INTEL_SCHEMA } from "@/lib/deepIntelSchema";

// Matches the dynamic-import loading states above, so an <InViewport>-gated map
// reserves exactly the space it will occupy — nothing reflows when it mounts.
function mapPlaceholder(height, label) {
  return (
    <div style={{ height, background: "var(--bg)", border: "0.5px solid var(--border)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

// Loose bounding box around Metro Manila + the LRT/MRT lines' exurb extensions
// (Cavite, Antipolo) -- properties outside this simply aren&apos;t served by rail,
// so the tab only shows where it&apos;s actually a useful signal.
function isNearManilaRail(lat, lng) {
  return lat != null && lng != null && lat >= 14.2 && lat <= 14.9 && lng >= 120.7 && lng <= 121.3;
}

// ═══════════════════════════════════════════════════
// DATA — Airtable CMS first, mockDb fallback
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// TRANSIT HUBS — module-scope so coordinate references stay
// referentially stable across renders (avoids effect-dep loops).
// ═══════════════════════════════════════════════════
import { resolveTransitHub } from "@/lib/transit";

// ═══════════════════════════════════════════════════
// HELPER UTILITIES
// ═══════════════════════════════════════════════════
function DeepIntelWidget({ open, onToggle, fields, values }) {
  // Deep intel unlocks at Solar+. SSR-safe — locked until the client reads the
  // viewer's tier. Solar+ reveals real values from `values` (keyed by label);
  // below Solar keeps the blur-locked teaser. Client-trusted for now (later
  // security pass enforces server-side) — real values ship only on demo/seed data.
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => { setUnlocked(canSee("deepIntel", getCurrentTier())); }, []);
  if (!fields || fields.length === 0) return null;

  // Fields may be plain label strings OR schema objects ({key,label}) from
  // DEEP_INTEL_SCHEMA — resolve values by DI_ key first, then label
  // (mirrors CommercialFlow's tolerant widget).
  const valueFor = (field) => {
    const k = field && field.key ? field.key : field;
    const l = field && field.label ? field.label : field;
    const v = values ? (values[k] !== undefined ? values[k] : values[l]) : undefined;
    return v != null && String(v).trim() !== "" ? v : null;
  };

  return (
    <div className="mt-8">
      <div className="h-px bg-surface-variant mb-4" />
      <button
        onClick={onToggle}
        className="w-full bg-surface-alt border border-surface-variant p-4 cursor-pointer flex justify-between items-center rounded-sm hover:bg-surface-variant transition-colors active:scale-[0.99]"
      >
        <span className="font-mono text-[10px] text-gold-accent tracking-[0.18em] uppercase">
          DEEP INTELLIGENCE // {unlocked ? "UNLOCKED" : "VERIFIED SCOUT"}
        </span>
        <svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="var(--accent)" strokeWidth="1.5" className="transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="M1 1L5 5L9 1" />
        </svg>
      </button>
      {open && (unlocked ? (
        <GlassPanel className="p-5 flex flex-col rounded-b-sm border-t-0">
          {fields.map((field, i) => {
            const value = valueFor(field);
            return (
              <div key={(field && field.key) || i} className={`flex justify-between items-baseline py-3 gap-5 ${i < fields.length - 1 ? 'border-b border-surface-variant' : ''}`}>
                <span className="font-serif text-[13px] text-text-secondary">{fieldLabel(field)}</span>
                {value !== null ? (
                  <span className="font-mono text-xs text-gold-accent tracking-[0.04em] text-right">{value}</span>
                ) : (
                  <span className="font-mono text-[11px] text-text-muted tracking-[0.08em] text-right">Not recorded</span>
                )}
              </div>
            );
          })}
        </GlassPanel>
      ) : (
        <GlassPanel className="p-5 relative rounded-b-sm border-t-0">
          <div className="blur-sm pointer-events-none select-none flex flex-col">
            {fields.map((field, i) => (
              <div key={(field && field.key) || i} className={`flex justify-between items-center py-3 ${i < fields.length - 1 ? 'border-b border-surface-variant' : ''}`}>
                <span className="font-serif text-[13px] text-text-secondary">{fieldLabel(field)}</span>
                <span className="font-mono text-xs text-text-muted tracking-[0.1em]">████████</span>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-alt/90 rounded-b-sm backdrop-blur-md">
            <span className="font-mono text-[10px] text-gold-accent tracking-[0.25em] uppercase drop-shadow-md">SOLAR TIER UNLOCKS THIS</span>
            <a href="/pricing/seeker" className="no-underline font-serif text-[13px] text-background bg-gold-accent hover:bg-gold-accent-bright border-none px-6 py-2.5 rounded-sm cursor-pointer tracking-[0.04em] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(232,174,60,0.4)] active:scale-[0.98]">
              Unlock Full Intelligence →
            </a>
          </div>
        </GlassPanel>
      ))}
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
const VALID_CHAPTERS = new Set(["space","location","vault","life","whereto","buildplans","hiddenintel","units","universe","services","yourmove"]);

function initialChapterFromUrl(fallback) {
  if (typeof window === "undefined") return fallback;
  const urlChapter = new URLSearchParams(window.location.search).get("chapter");
  return urlChapter && VALID_CHAPTERS.has(urlChapter) ? urlChapter : fallback;
}

export default function ResidentialFlow({ slug, draftData, isDraftMode, externalActiveTab, initialData = null, articles = [] }) {
  const router = useRouter();
  // ── Interactive UI states ──────────────────────
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [photoMode,         setPhotoMode]         = useState("natural");
  const [isAutoPlaying,     setIsAutoPlaying]     = useState(true);
  const [isPhotoHovered,    setIsPhotoHovered]    = useState(false);
  // See CommercialFlow: hero slides sit at opacity:0 in-viewport, so the browser
  // downloads the whole gallery in parallel and starves the LCP image. Mount the
  // first slide up front, the rest once the main thread is idle. No visual change.
  const [galleryWarmed, setGalleryWarmed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const warm = () => setGalleryWarmed(true);
    const ric = window.requestIdleCallback;
    if (ric) { const h = ric(warm, { timeout: 3000 }); return () => window.cancelIdleCallback?.(h); }
    const t = setTimeout(warm, 1500);
    return () => clearTimeout(t);
  }, []);
  // Enhanced photos unlock at Solar+. SSR-safe — locked until the client reads the viewer's tier.
  const [canEnhance,        setCanEnhance]        = useState(false);
  useEffect(() => { setCanEnhance(canSee("enhancedPhotos", getCurrentTier())); }, []);
  // Market/investment "Hidden Intel" panel unlocks at Cluster+ (same SSR-safe pattern).
  // Operator role check (SSR-safe).
  const [isOperator,        setIsOperator]        = useState(false);
  useEffect(() => { setIsOperator(hasActiveRole("operator")); }, []);
  const [activeTab,         setActiveTab]         = useState(externalActiveTab || "space");

  // ── Chapters mount their maps only once the reader has opened them ────────
  // Chapter panels stay in the DOM at opacity:0 (property-detail.css), so every
  // reader sitting on chapter 01 was still paying to spin up a MapLibre context
  // in Location and a Leaflet one in Where To — two live maps for a page they
  // may never scroll to. Once a chapter has been opened we keep it mounted, so
  // going back to it is instant.
  const [openedChapters, setOpenedChapters] = useState(
    () => new Set([externalActiveTab || "space"])
  );
  useEffect(() => {
    setOpenedChapters((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);
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

  // ── Attached Finding from Stratosphere Detour ──
  const [attachedSignalSlug, setAttachedSignalSlug] = useState(null);
  const [attachedFindingKey, setAttachedFindingKey] = useState("resolved");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sig = params.get("signal");
    const fnd = params.get("finding");
    if (sig) {
      setAttachedSignalSlug(sig);
      if (fnd) setAttachedFindingKey(fnd);
    }
  }, []);

  const [menuOpen,   setMenuOpen]   = useState(false);
  // Seed from the server-resolved record so the first paint is real content,
  // not the loading gate.
  const [propertyData, setPropertyData] = useState(() => draftData || initialData || null);
  const [dataLoading,  setDataLoading]  = useState(() => !draftData && !initialData);
  const [intentStage,  setIntentStage]  = useState("explore");
  const [isOwner, setIsOwner] = useState(false);
  const [propertyRoster, setPropertyRoster] = useState([]);
  const [rosterLoaded, setRosterLoaded] = useState(false);
  const [rosterUnavailable, setRosterUnavailable] = useState(false);
  useEffect(() => {
    if (isDraftMode || !slug) return undefined;
    let cancelled = false;
    fetch(`/api/property/${encodeURIComponent(slug)}/brokers`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!cancelled) setPropertyRoster(Array.isArray(data?.brokers) ? data.brokers : []);
      })
      .catch(() => { if (!cancelled) { setPropertyRoster([]); setRosterUnavailable(true); } })
      .finally(() => { if (!cancelled) setRosterLoaded(true); });
    return () => { cancelled = true; };
  }, [slug, isDraftMode]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [whereToTab,        setWhereToTab]        = useState("map");
  const [isochroneData,     setIsochroneData]     = useState(null);
  const handleIsochrone = useCallback((geojson, contours) => {
    setIsochroneData({ geojson, contours });
  }, []);
  const [lifestylePois,     setLifestylePois]     = useState([]);
  const handlePoisLoaded = useCallback((pois) => {
    setLifestylePois(pois);
  }, []);
  const [locTab,            setLocTab]            = useState("map");
  const [isInquiryOpen,     setIsInquiryOpen]     = useState(false);
  // Share state now lives in useCuratedShare (declared below, once `d` exists).
  const [isOperatorRequestOpen, setIsOperatorRequestOpen] = useState(false);
  useEffect(() => {
    const open = () => setIsInquiryOpen(true);
    window.addEventListener("scoutit:property-inquire", open);
    return () => window.removeEventListener("scoutit:property-inquire", open);
  }, []);

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
      setDataLoading(false);
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
    // See CommercialFlow: with server-provided data this is a background refresh.
    // Don't re-raise the loading gate over already-painted content, and don't let
    // the /api/cms bundle compete with hydration — defer it to idle.
    const hasServerData = !!initialData;
    async function loadProperty() {
      if (!hasServerData) setDataLoading(true);
      try {
        const res  = await fetch("/api/cms");
        if (res.ok) {
          const data = await res.json();
          if (data.properties && data.properties.length > 0) {
            const match = (data.properties || []).find(
              (p) =>
                (p.slug && p.slug.toLowerCase() === (slug || "").toLowerCase()) ||
                (p.id && p.id === slug)
            );
            if (match) {
              setPropertyData({ ...match });
            }
          }
        }
      } catch { /* stay on mock data */ } finally {
        setDataLoading(false);
      }
    }
    if (!hasServerData) { loadProperty(); return; }
    const ric = typeof window !== "undefined" && window.requestIdleCallback;
    if (ric) { const h = ric(loadProperty, { timeout: 4000 }); return () => window.cancelIdleCallback?.(h); }
    const t = setTimeout(loadProperty, 2000);
    return () => clearTimeout(t);
  }, [slug, initialData]);

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

  // ── Derived values (memoized at top to respect React Rules of Hooks) ──
  const d = propertyData || {};

  // Whether this listing has a real position at all.
  //
  // Coordinates are not entered by owners. They are geocoded from the location
  // text — in the browser when the listing is created, and again server-side in
  // cmsCache for anything published without them. Both can come back empty if
  // the address is vague or the geocoder is down.
  //
  // Every map here used to fall back to 14.5547 / 121.0244 when that happened,
  // which is Makati CBD. The result was a listing anywhere in the country
  // rendering a confident, fully detailed map of a place it is not — buildings,
  // reach ring, nearby shops and all. On a product that sells verified
  // intelligence that is worse than showing nothing.
  const propLat = Number(d.lat ?? d.latitude ?? d.Latitude);
  const propLng = Number(d.lng ?? d.longitude ?? d.Longitude);
  const hasCoords = Number.isFinite(propLat) && Number.isFinite(propLng) && !(propLat === 0 && propLng === 0);

  // The one curated share path — desktop button, mobile bottom bar, and the
  // modal fallback all run through this. `enabled: !d.is_sample` is what keeps
  // sample listings from getting promotable copy; see useCuratedShare.
  const { shareTextOpen, setShareTextOpen, openCuratedShare } = useCuratedShare(d, {
    enabled: !d.is_sample,
  });

  const photos = useMemo(() => {
    const rawP = (Array.isArray(d?.photos) ? d.photos : [d?.photo || d?.image]).filter(p => typeof p === "string" && p.trim().length > 0);
    return rawP.length > 0 ? rawP : ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80"];
  }, [d]);

  const brokerInitials = useMemo(() => {
    return (d?.broker_name || " ").split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  }, [d?.broker_name]);

  // ── Category Detection & Custom Labels ──────────
  const cat = useMemo(() => (d?.spaceCategory || "").toLowerCase() || (d?.property_type || "").toLowerCase(), [d?.spaceCategory, d?.property_type]);
  const isRestaurant = cat.includes("restaurant") || cat.includes("culinary");
  const isHospitality = cat.includes("str") || cat.includes("hospitality");
  const isVenue = cat.includes("venue") || cat.includes("event");
  const hierarchy = useMemo(() => getPropertyHierarchy(d), [d]);

  // ── Chapter config (drives nav labels & chapter headings) ──
  const chapterConfig = useMemo(() => getChapterConfig(d), [d]);
  const ch = useMemo(() => Object.fromEntries(chapterConfig.map(c => [c.id, c])), [chapterConfig]);

  // ── Spatial Signals & Curiosity Doors (Stratosphere Detour) ──
  const propertySignals = useMemo(() => getSignalsForProperty(slug || d?.slug), [slug, d?.slug]);
  const finePrintSignal = useMemo(() => propertySignals.find(s => s.door === "hiddenintel") || propertySignals[0], [propertySignals]);
  const whereToSignal = useMemo(() => propertySignals.find(s => s.door === "whereto") || (propertySignals.length > 1 ? propertySignals[1] : null), [propertySignals]);
  const universeSignal = useMemo(() => propertySignals.find(s => s.door === "universe") || (propertySignals.length > 2 ? propertySignals[2] : null), [propertySignals]);

  const prefilledInquiryMsg = useMemo(() => {
    if (!attachedSignalSlug) return "";
    const res = getSignalResolution(attachedSignalSlug, attachedFindingKey);
    const sig = getSignalBySlug(attachedSignalSlug);
    if (!res || !sig) return "";
    return `Hi, I've reviewed the "${sig.title}" spatial dossier on ScoutIt (${res.name}: ${res.headline}). I'd like to discuss the ${res.inquiryTopic} for ${d?.title || "this property"}.`;
  }, [attachedSignalSlug, attachedFindingKey, d?.title]);

  // Determine brief label
  const briefLabel = useMemo(() => {
    if (isRestaurant) return "Culinary Details";
    if (isHospitality) return "Hospitality Details";
    if (isVenue) return "Venue Details";
    return "Residential Details";
  }, [isRestaurant, isHospitality, isVenue]);

  // ── Auto-next slideshow timer (pauses on hover/touch or lightbox) ──
  useEffect(() => {
    if (!isAutoPlaying || isPhotoHovered || isLightboxOpen || !propertyData) return;
    const rawP = (Array.isArray(propertyData.photos) ? propertyData.photos : [propertyData.photo || propertyData.image]).filter(p => typeof p === "string" && p.trim().length > 0);
    const count = rawP.length > 0 ? rawP.length : 1;
    if (count <= 1) return;
    const timer = setInterval(() => {
      setCurrentImageIndex((i) => (i + 1) % count);
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, isPhotoHovered, isLightboxOpen, propertyData]);

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

  // ── Spec Pills Dynamic Curators ────────────────
  let pill1Val = d.beds;
  let pill1Label = "Bedrooms";
  let pill1Icon = <><path d="M1 9V5a2 2 0 012-2h8a2 2 0 012 2v4" strokeLinecap="round"/><path d="M1 9h12" strokeLinecap="round"/></>;

  let pill2Val = d.baths;
  let pill2Label = "Bathrooms";
  let pill2Icon = <><path d="M2 8h10M2 8V5a2 2 0 012-2v0a1 1 0 011 1v4" strokeLinecap="round"/><path d="M12 8v3" strokeLinecap="round"/></>;

  if (isRestaurant) {
    pill1Val = d.seating_capacity || null;
    pill1Label = "Seating Capacity";
    pill1Icon = <><path d="M3 2h8v5H3V2zm0 5h8v4.5C11 12.3 10.3 13 9.5 13H4.5C3.7 13 3 12.3 3 11.5V7zM1 13h12" strokeLinecap="round"/></>;

    pill2Val = d.kitchen_grade || null;
    pill2Label = "Kitchen Grade";
    pill2Icon = <><circle cx="6" cy="6" r="4"/><path d="M10 6h3" strokeLinecap="round"/><path d="M6 10v3" strokeLinecap="round"/></>;
  } else if (isHospitality) {
    pill1Val = d.accommodations || null;
    pill1Label = "Accommodations";
    pill1Icon = <><rect x="2" y="2" width="10" height="10" rx="1.5"/><circle cx="7" cy="7" r="1.5"/><path d="M3 5h4" strokeLinecap="round"/></>;

    pill2Val = d.hosting_capacity || null;
    pill2Label = "Hosting Capacity";
    pill2Icon = <><circle cx="5" cy="4" r="2"/><circle cx="9" cy="4" r="2"/><path d="M2 11c0-2 2-3 3-3s3 1 3 3M7 11c0-2 2-3 3-3s3 1 3 3"/></>;
  } else if (isVenue) {
    pill1Val = d.seating_capacity || null;
    pill1Label = "Guest Capacity";
    pill1Icon = <><path d="M2 12a4 4 0 018 0" strokeLinecap="round"/><circle cx="6" cy="5" r="3"/><circle cx="12" cy="7" r="1.5"/><path d="M10 12a2 2 0 013-1" strokeLinecap="round"/></>;

    pill2Val = d.setup_grade || null;
    pill2Label = "Setup Grade";
    pill2Icon = <><circle cx="7" cy="7" r="5"/><path d="M7 2v2M7 10v2M2 7h2M10 7h2" strokeLinecap="round"/></>;
  }

  // Emoji icons for the Chapter 1 editorial stat block
  let pill1Emoji = <Bed size={24} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />;
  let pill2Emoji = <Bath size={24} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />;
  if (isRestaurant)      { pill1Emoji = "🍽"; pill2Emoji = "🔪"; }
  else if (isHospitality){ pill1Emoji = "🛎"; pill2Emoji = "👥"; }
  else if (isVenue)      { pill1Emoji = "👥"; pill2Emoji = "🎚"; }

  // ── 3. Dynamic Unit Generation (Mock specs) ──────
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
        d.seating_capacity ? `Capacity: ${d.seating_capacity}` : null,
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
        d.kitchen_grade ? `Grade: ${d.kitchen_grade}` : null
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
        d.accommodations ? `Accommodations: ${d.accommodations}` : null,
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
        d.ceiling_height_text ? `Ceiling clearance: ${d.ceiling_height_text}` : null,
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
      name: childSpaceDisplayName(u.name, i, d),
      specs: [
        u.size  ? `${u.size} sqm`       : null,
        u.floor ? `Floor ${u.floor}`    : null,
        u.price ? formatUnitPrice(u.price) : null,
        ...(Array.isArray(u.features) ? u.features : []),
      ].filter(Boolean),
      photo: u.photo || u.image || (Array.isArray(u.photos) ? u.photos.find(Boolean) : "") || "",
      operator_id: u.operator_id || null,
      // Carry the Unit Master Page signals so the teaser below can tell a real
      // micro-listing (operator / scenarios / floor plan / authored detail)
      // from a bare inventory row.
      details: u.details || {},
      subdivision_scenarios: u.subdivision_scenarios || [],
      isReal: true,
    }));
  }



  // ── Photo navigation ──────────────────────────
  const goPrev = () => setCurrentImageIndex(i => (i === 0 ? photos.length - 1 : i - 1));
  const goNext = () => setCurrentImageIndex(i => (i + 1) % photos.length);

  const handleTouchStart = (e) => {
    setIsPhotoHovered(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    setIsPhotoHovered(false);
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

  // PDF tear-sheet generation is intentionally limited to the hero briefing.
  const handleDownloadPdf = async () => {
    try {
      await downloadPropertyTearSheet({
        element: document.querySelector('#photoZone'),
        title: d.title,
      });
    } catch (err) {
      console.error("[PDF] Generation failed:", err);
    }
  };

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
          onMouseEnter={() => setIsPhotoHovered(true)}
          onMouseLeave={() => setIsPhotoHovered(false)}
          onClick={(e) => {
            const sel = typeof window !== "undefined" && window.getSelection()?.toString();
            if (sel && sel.trim().length > 0) return;
            if (e.target.closest("button, a, input, select, textarea, .hero-intel, .mobile-hero-intel, .photo-controls, .photo-arrow, .platform-nav, .platform-back-btn")) return;
            setIsLightboxOpen(true);
          }}
        >

          {photos.map((url, i) => (
            (i === 0 || galleryWarmed || Math.abs(i - currentImageIndex) <= 1) &&
            <Image
              key={i}
              src={url}
              alt={`${d.title} - ${d.spaceCategory || d.property_type || 'Residential Asset'} in ${d.location || d.city || 'Philippines'} | Photo ${i + 1} of ${photos.length}`}
              fill
              priority={i === 0}
              fetchPriority={i === 0 ? "high" : "low"}
              loading={i === 0 ? "eager" : "lazy"}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
              quality={75}
              className={`photo-slide ${photoMode} ${currentImageIndex === i ? "active" : ""}`}
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
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <p className="hero-label">ScoutIt &middot; {PROPERTY_LEVEL_LABEL} &middot; {briefLabel}</p>
            <div className="hero-text-overlay">
              <h1 className="hero-title">
                {d.title}
                <ProvenanceBadge record={d} />
              </h1>
              <p className="hero-location">{d.location || d.city || "Philippines"}</p>
            </div>
            <p className="hero-hook">{d.hook}</p>
            <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDownloadPdf(); }}
                className="font-mono text-xs tracking-wider text-black bg-gold-accent hover:opacity-90 px-3.5 py-1.5 rounded-full transition-all uppercase font-semibold inline-flex items-center gap-1.5 shadow-[0_0_12px_rgba(232,174,60,0.3)] cursor-pointer"
              >
                <span style={{ fontSize: '11px' }}>🖨️</span> Download Tear-Sheet
              </button>
              {isOwner && (
                <Link href={`/dashboard?edit=${d.id}`} className="font-mono text-xs tracking-wider text-text-secondary bg-surface-alt/80 hover:text-on-surface px-3.5 py-1.5 rounded-full transition-colors uppercase font-semibold inline-block border border-surface-variant cursor-pointer backdrop-blur-sm">
                  Edit Dossier
                </Link>
              )}
            </div>
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
              {photos.length > 1 && (
                <button
                  type="button"
                  className={`toggle-btn ${isAutoPlaying ? "active" : "off"}`}
                  style={{ marginLeft: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => setIsAutoPlaying(v => !v)}
                  title={isAutoPlaying ? "Pause automatic slideshow" : "Start automatic slideshow"}
                >
                  {isAutoPlaying ? "⏸ Auto" : "▶ Auto"}
                </button>
              )}
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
          <p className="mobile-hero-label">ScoutIt &middot; {PROPERTY_LEVEL_LABEL} &middot; {briefLabel}</p>
          <h1 className="mobile-hero-title">{d.title}<ProvenanceBadge record={d} /></h1>
          <p className="mobile-hero-location">{d.location || d.city || null}</p>
          <p className="mobile-hero-hook">{d.hook}</p>
          {isOwner && (
            <div style={{ marginTop: '20px' }}>
              <Link href={`/dashboard?edit=${d.id}`} className="font-working-title text-xs tracking-widest text-background bg-gold-accent px-5 py-3 rounded hover:bg-gold-accent-bright transition-colors uppercase font-bold inline-block border border-gold-accent w-full text-center">
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
              { id: "whereto",  label: ch['whereto']?.navLabel || "Where To?",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.3"/><path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg> },
              { id: "buildplans", label: ch['buildplans']?.navLabel || "Build Plans",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="1" stroke="currentColor" strokeWidth="1.3"/><path d="M6 6h8M6 9h8M6 12h5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M13 14l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="12" y="12" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1"/></svg> },
              { id: "hiddenintel", label: ch['hiddenintel']?.navLabel || "The Market",
                icon: <svg className="chapter-icon" viewBox="0 0 20 20" fill="none"><path d="M10 4C5.5 4 2 10 2 10s3.5 6 8 6 8-6 8-6-3.5-6-8-6z" stroke="currentColor" strokeWidth="1.3"/><circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" opacity="0.4"/></svg> },
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
                  <span className="chapter-label">{hierarchy.collectionLabel}</span>
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
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['space']?.chapterNumber || '01'} — {ch['space']?.chapterLabel || 'The Space'}</div>
                {ch['space']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['space'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {(d.aesthetic_tag || d.accordion_3_rating) && (
                <div style={{marginBottom:"30px"}}>
                  <span style={{fontFamily:"var(--font-body)", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"var(--accent)", letterSpacing:"0.01em", lineHeight:1.2}}>
                    {d.aesthetic_tag || d.accordion_3_rating}
                  </span>
                </div>
              )}

              <div className="property-features-scroll" role="group" tabIndex={0} aria-label="Scrollable property highlights">
                {[
                  pill1Val && pill1Val !== 0 ? { icon: pill1Emoji, val: pill1Val, label: pill1Label } : null,
                  pill2Val && pill2Val !== 0 ? { icon: pill2Emoji, val: pill2Val, label: pill2Label } : null,
                  d.floor_sqm > 0 ? { icon: <Ruler size={24} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />, val: d.floor_sqm, label: "sqm floor" } : null,
                  d.parking > 0 ? { icon: <Car size={24} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />, val: d.parking, label: "Parking Slots" } : null,
                  d.lot_sqm > 0 ? { icon: "🌿", val: d.lot_sqm, label: "Lot sqm" } : null,
                ].filter(Boolean).map((stat, i) => (
                  <div key={i} className="property-feature-item">
                    <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                      <span style={{fontSize:"24px", lineHeight:1, flexShrink:0}}>{stat.icon}</span>
                      <span style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.5vw,26px)", fontWeight:500, color:"var(--text-primary)", lineHeight:1.2}}>{stat.val}</span>
                    </div>
                    <div style={{fontFamily:"var(--font-body)", fontSize:"11px", fontWeight:600, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginTop:"6px"}}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{height:"1px", background:"var(--border)", margin:"0 0 24px"}}/>

              <div style={{display:"flex", flexDirection:"column"}}>
                {d.ceiling_height_text && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Ceiling Height</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.ceiling_height_text}</span>
                  </div>
                )}
                {d.furnishing && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Furnishing</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.furnishing}</span>
                  </div>
                )}
                {d.view && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>View</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.view}</span>
                  </div>
                )}
                {d.turnoverDate && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Turnover Date</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.turnoverDate}</span>
                  </div>
                )}
                {d.petPolicy && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Pet Policy</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.petPolicy}</span>
                  </div>
                )}
                {d.assocDues && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Assoc Dues</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--accent)"}}>₱{Number(d.assocDues).toLocaleString()} / mo <span style={{fontSize:"11px", color:"var(--accent-muted)"}}>(Verified)</span></span>
                  </div>
                )}
                {d.outdoor_description && d.outdoor_description !== "None" && (
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)"}}>
                    <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Outdoor Space</span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right", maxWidth:"55%"}}>{d.outdoor_description}</span>
                  </div>
                )}
              </div>

              {d.accordion_3_text && (
                <p style={{fontFamily:"var(--font-body)", fontSize:"17px", color:"var(--text-primary)", lineHeight:1.9, margin:"26px 0 0", maxWidth:"580px"}}>
                  {d.accordion_3_text}
                </p>
              )}

              <DeepIntelWidget
                open={widgets.space}
                onToggle={() => setWidgets(w => ({...w, space: !w.space}))}
                values={d.deepIntel}
                fields={[
                  d.floorLevel ? "Exact Floor Level" : null,
                  d.pricePerSqm ? "Price Per SQM" : null,
                  d.paymentTerms ? "Payment Terms" : null,
                  ...(DEEP_INTEL_SCHEMA[d.category || "residential"]?.[1] || []),
                ].filter(Boolean)}
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
            <div className="panel-content" style={{ maxWidth: "100%" }} tabIndex={0} aria-label="Scrollable Spatial Vault content">
              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--accent)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>THE VAULT</div>
                <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>Floor plans, scans & spatial records</div>
                <div style={{height:"1px", background:"var(--accent)"}}/>
              </div>

              <div style={{marginBottom:"30px"}}>
                <span style={{fontFamily:"var(--font-body)", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"var(--text-primary)", letterSpacing:"0.01em", lineHeight:1.2}}>
                  3D Virtual Tours & Blueprints
                </span>
              </div>

              {/* slug drives the server-side entitlement fetch (§45). The
                  d.* props arrive EMPTY on a public property page now — they
                  are stripped before serialisation — and are kept only for
                  callers that already hold entitled data. */}
              <SpatialVaultWidget
                slug={d.slug}
                lumaUrl={d.luma3dMapUrl}
                matterportUrl={d.matterportTourUrl}
                heatmapUrl={d.droneHeatmapUrl}
                floorPlans={d.floorPlans}
                hasVaultMedia={d.premiumAvailable?.includes("vault")}
              />
            </div>
            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background: "var(--accent)"}}/><div className="sidebar-label" style={{color: "var(--accent)"}}>Vault Status</div><div className="sidebar-value">Secured</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Verification</div><div className="sidebar-value">ScoutIT Pros</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Access</div><div className="sidebar-value">Cluster Tier Only</div></div>
            </div>
          </div>

          {/* ── LOCATION (Ch. 2) ── */}
          <div className={`chapter-panel ${activeTab === "location" ? "active" : ""}`} id="panel-location">
            <div className="panel-content chapter-frame--map">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['location']?.chapterNumber || '02'} — {ch['location']?.chapterLabel || 'Location'}</div>
                {ch['location']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['location'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {(d.location || d.city) && (
                <div style={{margin:"0"}}>
                  <div style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.1vw,26px)", fontWeight:400, color:"var(--text-primary)", lineHeight:1.2}}>
                    {d.location || d.city}
                  </div>

                </div>
              )}

              {/* The facts that used to sit in the right rail. As a strip above the
                  map they cost one line instead of a column, which is what lets
                  the chapter fit a single frame. */}
              {(d.street_type || publicTransitObj) && (
                <div style={{display:"flex", flexWrap:"wrap", gap:"18px", alignItems:"baseline", marginBottom:"0", paddingBottom:"10px", borderBottom:"1px solid var(--border)"}}>
                  {publicTransitObj && (
                    <div>
                      <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"10px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase"}}>Nearest transit</div>
                      <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{publicTransitObj.name} · {publicTransitObj.distance}</div>
                    </div>
                  )}
                  {d.street_type && (
                    <div>
                      <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"10px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase"}}>Street type</div>
                      <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{d.street_type}</div>
                    </div>
                  )}
                </div>
              )}
              {/* Map / List toggle */}
              <div className="whereto-tabs" style={{marginBottom:"0", marginTop:"0"}}>
                <button className={`whereto-tab-btn ${locTab === "map" ? "active" : ""}`} onClick={() => setLocTab("map")}>
                  <span className="btn-pulse"/>Map
                </button>
                <button className={`whereto-tab-btn ${locTab === "list" ? "active" : ""}`} onClick={() => setLocTab("list")}>
                  Directory List
                </button>
              </div>

              

              

              

              {locTab === "map" && hasCoords && (
                <InViewport
                  className="map-frame"
                  style={{flex:"0 0 auto", borderRadius:"4px", overflow:"hidden", border:"0.5px solid var(--border)", marginBottom:"20px"}}
                  fallback={mapPlaceholder("100%", "Tactical map")}
                >
                  {USE_SPATIAL_CANVAS ? (
                    <SpatialCanvas
                      lat={propLat}
                      lng={propLng}
                      propertyTitle={d.title}
                      initialLens="location"
                      availableLenses={isNearManilaRail(d.lat || d.latitude, d.lng || d.longitude)
                        ? ["location", "command", "flood", "transit"]
                        : ["location", "command", "flood"]}
                      height="100%"
                    />
                  ) : (
                    <InteractiveMap
                      lat={propLat}
                      lng={propLng}
                      propertyTitle={d.title}
                      vicinityData={d.whereTo}
                      lifestylePois={lifestylePois}
                      routeDestination={transitDestination}
                      routeDestCoords={transitDestCoords}
                      routeLabel={transitLabel}
                      mapboxToken={mapboxToken}
                    />
                  )}
                </InViewport>
              )}


              {locTab === "map" && !hasCoords && (
                <div className="map-frame" style={{display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", gap:"10px", textAlign:"center", padding:"28px", borderRadius:"4px", border:"0.5px dashed var(--border-mid)", background:"var(--surface)", marginBottom:"20px"}}>
                  <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)"}}>Position not verified</div>
                  <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-secondary)", maxWidth:"46ch", lineHeight:1.6}}>
                    This listing has no confirmed coordinates yet, so there is no map to show. The written detail below is unaffected.
                  </div>
                </div>
              )}
              {locTab === "list" && d.whereTo && d.whereTo.length > 0 && (
                <div style={{display:"flex", flexDirection:"column", marginBottom:"8px"}}>
                  {d.whereTo.map((item, idx) => (
                    <div key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid var(--border)"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"var(--accent)", flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{item.name}</div>
                          {item.category && <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px"}}>{item.category}</div>}
                        </div>
                      </div>
                      <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.1em", flexShrink:0}}>{item.distance}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Free location facts — grouped (Risk & Zoning / Access) per
                  /impeccable critique's chunking guideline (≤4 items/group) */}
              <div style={{display:"flex", flexDirection:"column", marginBottom:"24px"}}>
                {(d.flood_zone_status || d.zoning_classification) && (
                  <>
                    <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"2px"}}>Risk &amp; Zoning</span>
                    {d.flood_zone_status && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Flood Zone</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right"}}>{d.flood_zone_status}</span>
                      </div>
                    )}
                    {d.zoning_classification && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Zoning</span>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"12px", color:"var(--text-primary)", textAlign:"right", letterSpacing:"0.04em"}}>{d.zoning_classification}</span>
                      </div>
                    )}
                  </>
                )}
                {(publicTransitObj || d.nearest_highway || d.street_type) && (
                  <>
                    <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginTop:"16px", marginBottom:"2px"}}>Access</span>
                    {publicTransitObj && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Nearest Transit</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right"}}>{publicTransitObj.name} · {publicTransitObj.distance}</span>
                      </div>
                    )}
                    {d.nearest_highway && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Major Road</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right"}}>{d.nearest_highway}</span>
                      </div>
                    )}
                    {d.street_type && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Street Type</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right"}}>{d.street_type}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Commute context cards */}
              {commuteCards.length > 0 && (
                <>
                  <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Commute Context</div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:"10px", marginBottom:"28px"}}>
                    {commuteCards.map(c => (
                      <div key={c.label} style={{flex:"1 1 120px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", padding:"14px 16px"}}>
                        <div style={{fontFamily:"var(--font-mono, monospace)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.16em", textTransform:"uppercase", marginBottom:"8px"}}>To {c.label}</div>
                        <div style={{fontFamily:"var(--font-body)", fontSize:"18px", color:"var(--text-primary)"}}>{c.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Public transport editorial */}
              {d.public_transport && (
                <p style={{fontFamily:"var(--font-body)", fontSize:"15px", color:"var(--text-primary)", lineHeight:1.85, margin:"0 0 28px", maxWidth:"580px"}}>
                  {d.public_transport}
                </p>
              )}

              <div style={{height:"1px", background:"var(--border)", margin:"0 0 20px"}}/>

              <DeepIntelWidget
                open={widgets.location}
                onToggle={() => setWidgets(w => ({...w, location: !w.location}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "residential"]?.[2] || []}
              />

            </div>

          </div>

          {/* ── LIFE HERE (Ch. 3) ── */}
          <div className={`chapter-panel ${activeTab === "life" ? "active" : ""}`} id="panel-life">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['life']?.chapterNumber || '03'} — {ch['life']?.chapterLabel || 'Life Here'}</div>
                {ch['life']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['life'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {/* Best Suited For — gold chips, first thing shown */}
              {(() => {
                const tags = (d.bestForTags && d.bestForTags.length > 0)
                  ? d.bestForTags
                  : (d.best_for ? d.best_for.split("·").map(s => s.trim()).filter(Boolean) : []);
                if (tags.length === 0) return null;
                return (
                  <div style={{marginBottom:"28px"}}>
                    <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"14px"}}>Best Suited For</div>
                    <div style={{display:"flex", flexWrap:"wrap", gap:"10px"}}>
                      {tags.map((t, i) => (
                        <span key={i} style={{fontFamily:"var(--font-body)", fontSize:"15px", color:"var(--accent)", border:"0.5px solid color-mix(in srgb, var(--accent) 40%, transparent)", padding:"7px 18px", borderRadius:"4px", letterSpacing:"0.02em"}}>{t}</span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {d.lifestyle_vibe && (
                <p style={{fontFamily:"var(--font-body)", fontStyle:"italic", fontSize:"clamp(20px,2.6vw,26px)", fontWeight:400, color:"var(--text-primary)", lineHeight:1.45, margin:"0 0 24px", maxWidth:"560px"}}>
                  {d.lifestyle_vibe}
                </p>
              )}

              {d.community_feel && (
                <p style={{fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--text-primary)", lineHeight:1.9, margin:"0 0 20px", maxWidth:"580px"}}>
                  {d.community_feel}
                </p>
              )}

              {d.safety_perception && (
                <>
                  <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", margin:"4px 0 12px"}}>Safety Perception</div>
                  <p style={{fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--text-primary)", lineHeight:1.9, margin:"0", maxWidth:"580px"}}>
                    {d.safety_perception}
                  </p>
                </>
              )}

              <DeepIntelWidget
                open={widgets.life}
                onToggle={() => setWidgets(w => ({...w, life: !w.life}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "residential"]?.[3] || []}
              />

            </div>

            <div className="panel-sidebar">
              {d.lifestyle_vibe && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Vibe</div><div className="sidebar-value">{d.lifestyle_vibe}</div></div>}
              {d.best_for && <div className="sidebar-block"><div className="sidebar-label">Best for</div><div className="sidebar-value">{d.best_for}</div></div>}
              {d.street_type && <div className="sidebar-block"><div className="sidebar-label">Street type</div><div className="sidebar-value">{d.street_type}</div></div>}
            </div>
          </div>

          {/* ── WHERE TO? (Ch. 4) ── */}
          <div className={`chapter-panel ${activeTab === "whereto" ? "active" : ""}`} id="panel-whereto">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['whereto']?.chapterNumber || '04'} — {ch['whereto']?.chapterLabel || 'Where To?'}</div>
                {ch['whereto']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['whereto'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              <div className="whereto-tabs" style={{marginBottom:"20px"}}>
                <button className={`whereto-tab-btn ${whereToTab === "map" ? "active" : ""}`} onClick={() => setWhereToTab("map")}>
                  <span className="btn-pulse"/>Tactical Map
                </button>
                <button className={`whereto-tab-btn ${whereToTab === "list" ? "active" : ""}`} onClick={() => setWhereToTab("list")}>
                  Directory List
                </button>
                <button className={`whereto-tab-btn ${whereToTab === "lifestyle" ? "active" : ""}`} onClick={() => setWhereToTab("lifestyle")}>
                  Lifestyle Intel
                </button>
              </div>

              {whereToTab === "map" && hasCoords && openedChapters.has("whereto") && (
                <InViewport
                  style={{height:"clamp(420px, 70vh, 850px)", minHeight:"420px", flexShrink:0, borderRadius:"4px", overflow:"hidden", border:"0.5px solid var(--border)", marginBottom:"clamp(32px, 9vw, 120px)"}}
                  fallback={mapPlaceholder("100%", "Tactical map")}
                >
                  {USE_SPATIAL_CANVAS ? (
                    <SpatialCanvas
                      lat={propLat}
                      lng={propLng}
                      propertyTitle={d.title}
                      initialLens="location"
                      availableLenses={isNearManilaRail(d.lat || d.latitude, d.lng || d.longitude)
                        ? ["location", "command", "flood", "transit"]
                        : ["location", "command", "flood"]}
                      height="100%"
                    />
                  ) : (
                    <InteractiveMap
                      lat={propLat}
                      lng={propLng}
                      propertyTitle={d.title}
                      vicinityData={d.whereTo}
                      lifestylePois={lifestylePois}
                      mapboxToken={mapboxToken}
                      isochrone={isochroneData?.geojson || null}
                      contours={isochroneData?.contours || []}
                    />
                  )}
                </InViewport>
              )}

              {whereToTab === "list" && d.whereTo && d.whereTo.length > 0 && (
                <div style={{display:"flex", flexDirection:"column", marginBottom:"24px"}}>
                  {d.whereTo.map((item, idx) => (
                    <div key={idx} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"13px 0", borderBottom:"1px solid var(--border)"}}>
                      <div style={{display:"flex", alignItems:"center", gap:"12px"}}>
                        <div style={{width:"5px", height:"5px", borderRadius:"50%", background:"var(--accent)", flexShrink:0}}/>
                        <div>
                          <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)"}}>{item.name}</div>
                          {item.category && <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:"2px"}}>{item.category}</div>}
                        </div>
                      </div>
                      <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.1em", flexShrink:0}}>{item.distance}</span>
                    </div>
                  ))}
                </div>
              )}

              {whereToTab === "list" && (!d.whereTo || d.whereTo.length === 0) && (
                <div style={{padding:"32px", background:"var(--surface)", border:"0.5px dashed var(--border)", borderRadius:"2px", textAlign:"center", fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", marginBottom:"24px"}}>
                  [ LOCATION DETAILS N/A — NO DATA IN CMS ]
                </div>
              )}

              {/* Lifestyle Intel — live OpenStreetMap POIs + Mapbox reachability
                  (NEW_IDEAS.md §3). Kept mounted so POIs load immediately and render
                  as white dots on the Tactical Map. */}
              <div style={{ marginBottom: "24px", display: whereToTab === "lifestyle" ? "block" : "none" }}>
                <WhereToSection
                  lat={Number(d.lat ?? d.latitude)}
                  lng={Number(d.lng ?? d.longitude)}
                  onIsochrone={handleIsochrone}
                  onPoisLoaded={handlePoisLoaded}
                />
              </div>

              {/* Stratosphere Curiosity Door (Ch 04 -> Area Guide) */}
              {whereToSignal && (
                <IntelDoorCard
                  signal={whereToSignal}
                  propertySlug={slug || d?.slug}
                  doorChapterId="whereto"
                  doorChapterNumber={ch['whereto']?.chapterNumber || '04'}
                  overrideQuestion="What is the true walkability and district corridor rhythm around this building?"
                />
              )}

              <DeepIntelWidget
                open={widgets.whereto}
                onToggle={() => setWidgets(w => ({...w, whereto: !w.whereto}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "residential"]?.[4] || []}
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

          {/* ── BUILD PLANS (Ch. 5) — Operating Context for STR, defaults for Residential ── */}
          <div className={`chapter-panel ${activeTab === "buildplans" ? "active" : ""}`} id="panel-buildplans">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['buildplans']?.chapterNumber || '05'} — {ch['buildplans']?.chapterLabel || 'Build Plans'}</div>
                {ch['buildplans']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['buildplans'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {isHospitality ? (
                /* Cell 4: STR Operating Context — short-let legality block */
                <>
                  <p style={{fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--text-primary)", lineHeight:1.85, margin:"0 0 28px", maxWidth:"560px"}}>
                    Before committing to a short-term rental operation, understand the regulatory context governing this unit.
                  </p>

                  {/* STR Legality Status — the most critical field */}
                  {d.short_let_legal && (
                    <div style={{marginBottom:"24px"}}>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Short-Let Legal Status</div>
                      <div style={{
                        display:"inline-flex", alignItems:"center", gap:"10px",
                        padding:"12px 18px", borderRadius:"2px",
                        background: d.short_let_legal.includes("Permitted") && !d.short_let_legal.includes("Not")
                          ? "rgba(76,175,125,0.08)" : d.short_let_legal.includes("Not")
                          ? "rgba(200,80,80,0.08)" : "rgba(232, 174, 60,0.08)",
                        border: `0.5px solid ${
                          d.short_let_legal.includes("Permitted") && !d.short_let_legal.includes("Not")
                            ? "rgba(76,175,125,0.4)" : d.short_let_legal.includes("Not")
                            ? "rgba(200,80,80,0.4)" : "color-mix(in srgb, var(--accent) 40%, transparent)"}`
                      }}>
                        <span style={{
                          width:"8px", height:"8px", borderRadius:"50%", flexShrink:0,
                          background: d.short_let_legal.includes("Permitted") && !d.short_let_legal.includes("Not")
                            ? "var(--green)" : d.short_let_legal.includes("Not")
                            ? "var(--red)" : "var(--accent)"
                        }}/>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"17px", color:"var(--text-primary)"}}>{d.short_let_legal}</span>
                      </div>
                      {d.short_let_verified_date && (
                        <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", marginTop:"10px"}}>
                          Verified as of {d.short_let_verified_date} · Researcher-verified
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{display:"flex", flexDirection:"column", marginBottom:"28px"}}>
                    {d.expansion_potential && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>HOA / Building Rules</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right"}}>{d.expansion_potential}</span>
                      </div>
                    )}
                    {d.zoning_type && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Zoning</span>
                        <span style={{fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--text-primary)", textAlign:"right", letterSpacing:"0.04em"}}>{d.zoning_type}</span>
                      </div>
                    )}
                    {d.structural_notes && (
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", gap:"20px"}}>
                        <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase", flexShrink:0}}>Permit Notes</span>
                        <span style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-primary)", textAlign:"right", maxWidth:"55%"}}>{d.structural_notes}</span>
                      </div>
                    )}
                  </div>

                  <p style={{fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"11.5px", color:"var(--text-muted)", lineHeight:1.7, maxWidth:"560px"}}>
                    Legality status is researcher-verified and reviewed quarterly. Short-let compliance changes frequently — confirm current rules with building management and the local government unit before listing.
                  </p>
                </>
              ) : (
                /* Default: Build Plans for Residential */
                <>
                  {d.expansion_potential && (
                    <>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Expansion Potential</div>
                      <p style={{fontFamily:"var(--font-body)", fontSize:"17px", color:"var(--text-primary)", lineHeight:1.9, margin:"0 0 28px", maxWidth:"580px"}}>
                        {d.expansion_potential}
                      </p>
                    </>
                  )}
                  {d.zoning_type && (
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"11px 0", borderBottom:"1px solid var(--border)", marginBottom:"24px", gap:"20px"}}>
                      <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.12em", textTransform:"uppercase"}}>Zoning Type</span>
                      <span style={{fontFamily:"var(--font-mono)", fontSize:"12px", color:"var(--text-primary)", letterSpacing:"0.04em", textAlign:"right"}}>{d.zoning_type}</span>
                    </div>
                  )}
                  {d.developer_name && (
                    <div style={{background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", padding:"18px 20px", marginBottom:"24px"}}>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>Developer</div>
                      <div style={{fontFamily:"var(--font-body)", fontSize:"18px", color:"var(--text-primary)", marginBottom: d.developer_notes ? "8px" : "0"}}>{d.developer_name}</div>
                      {d.developer_notes && (
                        <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-secondary)", lineHeight:1.7}}>{d.developer_notes}</div>
                      )}
                    </div>
                  )}
                  {d.structural_notes && (
                    <>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:"12px"}}>Structural Notes</div>
                      <p style={{fontFamily:"var(--font-body)", fontSize:"15px", color:"var(--text-primary)", lineHeight:1.85, margin:"0", maxWidth:"580px"}}>
                        {d.structural_notes}
                      </p>
                    </>
                  )}
                  <DeepIntelWidget
                    open={widgets.buildplans}
                    onToggle={() => setWidgets(w => ({...w, buildplans: !w.buildplans}))}
                    values={d.details || d.deepIntel}
                    fields={DEEP_INTEL_SCHEMA[d.category || "residential"]?.[5] || []}
                  />
                </>
              )}

            </div>

            <div className="panel-sidebar">
              {isHospitality ? (
                <>
                  {d.short_let_legal && <div className="sidebar-block"><div className="sidebar-accent-line" style={{background: d.short_let_legal.includes("Permitted") && !d.short_let_legal.includes("Not") ? "var(--green)" : d.short_let_legal.includes("Not") ? "var(--red)" : "var(--accent)"}}/><div className="sidebar-label">Short-Let Status</div><div className="sidebar-value" style={{fontSize:"13px", lineHeight:1.4}}>{d.short_let_legal}</div></div>}
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

          {/* ── HIDDEN INTEL (Ch. 6) ── */}
          <div className={`chapter-panel ${activeTab === "hiddenintel" ? "active" : ""}`} id="panel-hiddenintel">
            <div className="panel-content">

              {/* The curiosity door comes FIRST: the question that sends a
                  reader to the intel belongs above the market numbers, not
                  after them. */}
{/* Stratosphere Curiosity Door (Ch 06 -> Commercial Signal / Decarbonization Ordinance) */}
              {finePrintSignal && (
                <IntelDoorCard
                  signal={finePrintSignal}
                  propertySlug={slug || d?.slug}
                  doorChapterId="hiddenintel"
                  doorChapterNumber={ch['hiddenintel']?.chapterNumber || '06'}
                />
              )}

              {/* MarketChapter (from main) replaces the ~55 lines of inline
                  market panel that used to sit here and existed ONLY on this
                  flow — commercial/STR/hospitality/restaurants/venues get it
                  too now. The inline version from the detour branch is the
                  one it superseded, so it is not carried over. */}
<MarketChapter
                property={d}
                articles={articles}
                deepIntel={d.deepIntel}
                chapterNumber={ch['hiddenintel']?.chapterNumber || '06'}
                chapterLabel={ch['hiddenintel']?.chapterLabel || 'The Market'}
                subtitle={ch['hiddenintel']?.subtitle || ''}
              />

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"var(--accent)"}}/><div className="sidebar-label">Cap rate est.</div><div className="sidebar-value" style={{color:"var(--text-muted)"}}><Lock size={13} strokeWidth={1.5} style={{verticalAlign:"-2px", marginRight:"5px"}} />Locked</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Price trend</div><div className="sidebar-value" style={{color:"var(--text-muted)"}}><Lock size={13} strokeWidth={1.5} style={{verticalAlign:"-2px", marginRight:"5px"}} />Locked</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Intel source</div><div className="sidebar-value">ScoutIt Verified</div></div>
            </div>
          </div>

          {/* ── UNITS (Ch. 7) ── */}
          <div className={`chapter-panel ${activeTab === "units" ? "active" : ""}`} id="panel-units">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['units']?.chapterNumber || '07'} — {ch['units']?.chapterLabel || 'Units & Spaces'}</div>
                {ch['units']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['units'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              <div className="units-z3-list">
                {dynamicUnits.map((u, ui) => {
                  const hasUnitPage = u.id && hasInteractiveUnitPage(u);
                  const teaserLabel = hasSpatial3D(u) ? "Explore 3D Space ✦" : "Open Master Page →";
                  const overview = hasUnitPage ? unitMasterPageOverview(u) : [];
                  const CardWrapper = hasUnitPage ? Link : "div";
                  const wrapperProps = hasUnitPage
                    ? { href: `/property/${d.slug}/unit/${u.id}`, style: { textDecoration: "none" } }
                    : {};

                  return (
                    <CardWrapper
                      className={`unit-z3-row ${!hasUnitPage ? "static-unit" : "has-master-page"}`}
                      key={u.name}
                      id={`unit-row-${ui}`}
                      {...wrapperProps}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color: "var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>
                            UNIT {String(ui + 1).padStart(2, "0")}
                          </div>
                          <div className="unit-z3-name">{u.name}</div>
                        </div>
                        {hasUnitPage && (
                          <div className="unit-ump-live">
                            <span className="unit-ump-live-dot" />
                            Master Page Live
                          </div>
                        )}
                      </div>

                      {/* What's inside the Unit Master Page — shown FIRST so
                          buyers know why to tap through */}
                      {hasUnitPage && (
                        <div className="unit-ump-overview">
                          {overview.map((item) => (
                            <span key={item} className="unit-ump-overview-chip">{item}</span>
                          ))}
                          <span className="unit-ump-open">{teaserLabel}</span>
                        </div>
                      )}

                      <div className="unit-z3-specs">
                        {u.specs.map(s => <span key={s} className="unit-z3-spec">{s}</span>)}
                      </div>
                    </CardWrapper>
                  );
                })}
              </div>

              {/* Units deep intel merged into Universe */}

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Total {hierarchy.collectionLabel}</div><div className="sidebar-value">{dynamicUnits.length}</div></div>

              {/* Photo preview thumbnail */}
              {photos && photos.length > 0 && photos[0] && (
                <div style={{width:"100%", height:"120px", minHeight:"120px", flexShrink:0, borderRadius:"4px", overflow:"hidden", border:"0.5px solid var(--border)", backgroundImage:`url(${photos[currentImageIndex] || photos[0]})`, backgroundSize:"cover", backgroundPosition:"center"}}/>
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
                      return (
                        <button
                          key={u.name}
                          onClick={() => {
                            const el = document.getElementById(`unit-row-${ui}`);
                            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                          style={{display:"flex", alignItems:"baseline", gap:"10px", width:"100%", textAlign:"left", background:"none", border:"none", borderBottom:"1px solid var(--border)", padding:"9px 0", cursor:"pointer"}}
                        >
                          <span style={{fontFamily:"var(--font-mono)", fontSize:"11px", color: "var(--text-muted)", letterSpacing:"0.12em", flexShrink:0}}>{String(ui + 1).padStart(2, "0")}</span>
                          <span style={{fontFamily:"var(--font-body)", fontSize:"13px", color: "var(--text-muted)", lineHeight:1.3}}>{u.name}</span>
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
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['universe']?.chapterNumber || '08'} — {ch['universe']?.chapterLabel || 'Property Universe'}</div>
                {ch['universe']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['universe'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {d.building_style && (
                <div style={{marginBottom:"24px"}}>
                  <span style={{fontFamily:"var(--font-body)", fontStyle:"italic", fontSize:"clamp(22px,3vw,30px)", fontWeight:400, color:"var(--accent)", letterSpacing:"0.01em"}}>
                    {d.building_style}
                  </span>
                </div>
              )}

              {d.architect_designer && (
                <div style={{background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", padding:"16px 20px", marginBottom:"28px"}}>
                  <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"8px"}}>Architect / Designer</div>
                  <div style={{fontFamily:"var(--font-body)", fontSize:"18px", color:"var(--text-primary)"}}>{d.architect_designer}</div>
                </div>
              )}

              {d.universe_summary && (
                <p style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.5vw,26px)", color:"var(--text-primary)", lineHeight:1.85, margin:"0 0 8px", maxWidth:"640px"}}>
                  {d.universe_summary}
                </p>
              )}

              {d.scoutit_verdict && (
                <>
                  <div style={{height:"1px", background:"var(--border)", margin:"28px 0 20px"}}/>
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

              {/* Stratosphere Curiosity Door (Ch 08 -> Developing Story / Transit Corridor) */}
              {universeSignal && (
                <IntelDoorCard
                  signal={universeSignal}
                  propertySlug={slug || d?.slug}
                  doorChapterId="universe"
                  doorChapterNumber={ch['universe']?.chapterNumber || '08'}
                  overrideQuestion="Is the wider masterplan & infrastructure actually active or a rendering?"
                />
              )}

              <DeepIntelWidget
                open={widgets.universe}
                onToggle={() => setWidgets(w => ({...w, universe: !w.universe}))}
                values={d.details || d.deepIntel}
                fields={DEEP_INTEL_SCHEMA[d.category || "residential"]?.[6] || []}
              />

            </div>

            <div className="panel-sidebar" tabIndex={0} aria-label="Scrollable property universe summary">
              {/* Verdict — the ScoutIt editorial stamp, premium & final */}
              {d.scoutit_verdict && (
                <div className="sidebar-block" style={{paddingBottom:"22px", borderBottom:"1px solid var(--border)", marginBottom:"4px"}}>
                  <div className="sidebar-accent-line" style={{background:"var(--accent)"}}/>
                  <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--accent)", letterSpacing:"0.18em", textTransform:"uppercase", marginBottom:"10px"}}>ScoutIt Verdict</div>
                  <div style={{fontFamily:"var(--font-body)", fontSize:"20px", color:"var(--accent)", lineHeight:1.35}}>{d.scoutit_verdict}</div>
                </div>
              )}
              {d.building_style && <div className="sidebar-block"><div className="sidebar-label">Building Style</div><div className="sidebar-value">{d.building_style}</div></div>}
              {d.architect_designer && <div className="sidebar-block"><div className="sidebar-label">Architect</div><div className="sidebar-value">{d.architect_designer}</div></div>}
              {d.year_built && <div className="sidebar-block"><div className="sidebar-label">Year Built</div><div className="sidebar-value">{d.year_built}</div></div>}
              {d.title_status && <div className="sidebar-block"><div className="sidebar-label">Title Status</div><div className="sidebar-value" style={{color:"var(--green)"}}>{d.title_status}</div></div>}
              {d.spaceCategory && <div className="sidebar-block"><div className="sidebar-label">Space Category</div><div className="sidebar-value">{d.spaceCategory}</div></div>}
            </div>
          </div>

          {/* ── SERVICES (Ch. 9) ── */}
          <div className={`chapter-panel ${activeTab === "services" ? "active" : ""}`} id="panel-services">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['services']?.chapterNumber || '09'} — {ch['services']?.chapterLabel || 'Services'}</div>
                {ch['services']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['services'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              <p style={{fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--text-primary)", lineHeight:1.85, margin:"0 0 28px", maxWidth:"560px"}}>
                Commission a ScoutIt ecosystem partner to go deeper on this space — from spatial renders to full due-diligence research.
              </p>

              <div style={{display:"flex", flexDirection:"column", gap:"10px"}}>
                {[
                  { icon:"🗺️", title:"Curated 3D Map",     desc:"Get a spatial 3D rendering of this property.",            href:"/photographers" },
                  { icon:"🎨", title:"Pre-Design Concept",  desc:"See this space redesigned to your preferences.",          href:"/event-planners" },
                  { icon:<Search size={22} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />, title:"Site Research",       desc:"Commission a full due-diligence report on this property.", href:"/researchers" },
                  { icon:<Camera size={22} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />, title:"Space Photography",   desc:"Get professional architectural photos taken.",            href:"/photographers" },
                  { icon:<Building2 size={22} strokeWidth={1.5} style={{color:"var(--text-primary)"}} />, title:"Verified Advisor",    desc:"Connect with an authorized space intelligence advisor.",  href:"/brokers" },
                ].map(svc => (
                  <Link
                    key={svc.title}
                    href={svc.href}
                    style={{textDecoration:"none", display:"flex", alignItems:"center", gap:"16px", padding:"18px 20px", background:"var(--surface)", border:"0.5px solid var(--border)", borderRadius:"4px", transition:"border-color 0.2s ease"}}
                  >
                    <span style={{fontSize:"22px", flexShrink:0, lineHeight:1}}>{svc.icon}</span>
                    <span style={{flex:1, minWidth:0}}>
                      <span style={{display:"block", fontFamily:"var(--font-body)", fontSize:"17px", color:"var(--text-primary)", marginBottom:"3px"}}>{svc.title}</span>
                      <span style={{display:"block", fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"12.5px", color:"var(--text-muted)", lineHeight:1.5}}>{svc.desc}</span>
                    </span>
                    <span style={{fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--accent)", flexShrink:0}}>→</span>
                  </Link>
                ))}
              </div>

            </div>

            <div className="panel-sidebar">
              <div className="sidebar-block"><div className="sidebar-accent-line" style={{background:"var(--accent)"}}/><div className="sidebar-label">Ecosystem</div><div className="sidebar-value">5 services live</div><div className="sidebar-sub">Vetted ScoutIt partners</div></div>
              <div className="sidebar-block"><div className="sidebar-label">Fulfilment</div><div className="sidebar-value">Partner-direct</div></div>
            </div>
          </div>

          {/* ── YOUR MOVE ── */}
          <div className={`chapter-panel ${activeTab === "yourmove" ? "active" : ""}`} id="panel-yourmove">
            <div className="panel-content">

              <div style={{marginBottom:"32px"}}>
                <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--text-muted)", letterSpacing:"0.25em", textTransform:"uppercase", marginBottom:"6px"}}>{ch['yourmove']?.chapterNumber || '10'} — {ch['yourmove']?.chapterLabel || 'Your Move'}</div>
                {ch['yourmove']?.subtitle && (
                  <div style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-secondary)", marginBottom:"10px", letterSpacing:"0.01em"}}>{ch['yourmove'].subtitle}</div>
                )}
                <div style={{height:"1px", background:"var(--border)"}}/>
              </div>

              {/* Attached Spatial Finding from Stratosphere Detour */}
              {attachedSignalSlug && (
                <AttachedFindingCard
                  signalSlug={attachedSignalSlug}
                  findingKey={attachedFindingKey}
                  propertySlug={slug || d?.slug}
                  onClear={() => setAttachedSignalSlug(null)}
                />
              )}

              <h2 style={{fontFamily:"var(--font-body)", fontWeight:400, fontSize:"clamp(26px,3.6vw,40px)", color:"var(--text-primary)", lineHeight:1.25, margin:"4px 0 28px", maxWidth:"600px"}}>
                When you&apos;re ready, we&apos;ll make the introduction.
              </h2>

              <div className="reactions-container" style={{marginTop:"0", display:"flex", flexDirection:"column", gap:"10px"}}>
                <p style={{fontFamily:"var(--font-mono)", fontSize:"11px", textTransform:"uppercase", letterSpacing:"0.2em", color:"var(--text-muted)", marginBottom:"16px"}}>HOW DOES THIS SPACE MAKE YOU FEEL?</p>
                <ReactionButtons propertyId={slug || "batasan-hills"} propertyTitle={d.title} category={d.property_type} city={d.city}/>
              </div>

              {/* Price — only when an authorized party has provided one ("N/A"/empty suppresses it) */}
              {(() => {
                const hasPrice = d.listed_price && d.listed_price.trim().toUpperCase() !== "N/A";
                return (
                  <>
                    <div style={{height:"1px", background:"var(--border)", margin:"28px 0 24px"}}/>
                    {hasPrice ? (
                      <GlassPanel className="p-6 rounded-md">
                        <div style={{fontFamily:"var(--font-body)", fontSize:"clamp(30px,4.2vw,44px)", fontWeight:400, color:"var(--text-primary)", lineHeight:1.1}}>{d.listed_price}</div>
                        {d.price_source && (
                          <div style={{fontFamily:"var(--font-mono)", fontSize:"11px", letterSpacing:"0.1em", color:"var(--text-muted)", marginTop:"10px"}}>
                            Price indicated by {d.price_source}
                          </div>
                        )}
                        {d.price_notes && (
                          <div style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-secondary)", lineHeight: 1.75, marginTop:"10px"}}>{d.price_notes}</div>
                        )}
                        <p style={{fontFamily:"system-ui,-apple-system,sans-serif", fontSize:"11.5px", color:"var(--text-muted)", lineHeight:1.7, marginTop:"16px"}}>
                          Price estimates are provided solely by authorized sellers, owners, or licensed property managers. ScoutIt does not set, verify, or guarantee any stated price. For inquiries, speak directly with an authorized representative.
                        </p>
                      </GlassPanel>
                    ) : (
                      <GlassPanel className="p-6 rounded-md">
                        <div style={{fontFamily:"var(--font-body)", fontSize:"clamp(20px,2.6vw,26px)", fontWeight:400, color:"var(--text-primary)", lineHeight:1.2}}>Price on request</div>
                        <p style={{fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text-secondary)", lineHeight:1.7, margin:"10px 0 16px", maxWidth:"480px"}}>
                          No confirmed rate has been published for this space. Inquire with the owner, property manager, or broker for current pricing.
                        </p>
                        <Link href={`/property/${slug || "batasan-hills"}/brokers`} style={{display:"inline-block", fontFamily:"var(--font-body)", fontSize:"16px", color:"var(--accent)", textDecoration:"none", letterSpacing:"0.01em"}}>
                          Inquire with an authorized broker →
                        </Link>
                      </GlassPanel>
                    )}
                  </>
                );
              })()}

              <AffordabilityCalculator
                listedPrice={d.listed_price}
                priceStatus={d.price_status}
                tenure={d.tenure}
              />

              <MonthlyCostCalculator d={d} />

              <div style={{height:"1px", background:"var(--border)", margin:"28px 0 24px"}}/>

              {rosterLoaded && (
                <div style={{ marginTop: "0", padding: "16px", border: "1px solid var(--accent-muted)", borderRadius: "4px", background: "rgba(232,174,60,0.03)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "8px" }}>Current Property Representation</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--on-surface)" }}>{rosterUnavailable ? "Representation status unavailable" : propertyRoster.length > 0 ? `${propertyRoster.length} active authorized broker${propertyRoster.length === 1 ? "" : "s"}` : "Unrepresented — uploader / lister route"}</div>
                  <Link href={`/property/${slug || "batasan-hills"}/brokers`} style={{ display: "inline-block", marginTop: "10px", color: "var(--accent-bright)", fontFamily: "var(--font-mono)", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>View current roster →</Link>
                </div>
              )}

              {/* Progressive Intent Ladder (§7) */}
              <div style={{ marginTop: "24px", padding: "20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Where are you in your evaluation?
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
                  Choose your level of interest. ScoutIt only connects you with authorized representatives when you ask.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setIntentStage(intentStage === "inspired" ? "explore" : "inspired")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: intentStage === "inspired" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: intentStage === "inspired" ? "rgba(232,174,60,0.12)" : "rgba(255,255,255,0.02)",
                      color: intentStage === "inspired" ? "var(--accent-bright)" : "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Tier 1</span>
                    <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500 }}>Inspired Me</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntentStage(intentStage === "fit" ? "explore" : "fit")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: intentStage === "fit" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: intentStage === "fit" ? "rgba(232,174,60,0.12)" : "rgba(255,255,255,0.02)",
                      color: intentStage === "fit" ? "var(--accent-bright)" : "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Tier 2</span>
                    <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500 }}>Potential Fit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIntentStage(intentStage === "interested" ? "explore" : "interested")}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "6px",
                      border: intentStage === "interested" ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: intentStage === "interested" ? "rgba(232,174,60,0.12)" : "rgba(255,255,255,0.02)",
                      color: intentStage === "interested" ? "var(--accent-bright)" : "var(--text-primary)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "4px" }}>Tier 3</span>
                    <span style={{ display: "block", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500 }}>Interested</span>
                  </button>
                </div>

                {/* Intent Stage Feedback & Actions */}
                {intentStage === "inspired" && (
                  <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Space recorded to your inspiration signals. Use the reaction buttons above to bookmark architectural details.
                  </div>
                )}

                {intentStage === "fit" && (
                  <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Space added to your evaluation shortlist. You can compare specs against other properties in your Dashboard Board.
                  </div>
                )}

                {intentStage === "interested" && (
                  <div style={{ marginTop: "12px" }}>
                    <div style={{ padding: "12px 14px", background: "rgba(232,174,60,0.08)", border: "1px solid var(--accent-muted)", borderRadius: "4px", fontSize: "13px", color: "var(--on-surface)", lineHeight: 1.5, marginBottom: "12px" }}>
                      Ready for introduction. Connect with an authorized, verified broker to arrange a private walkthrough or review title files.
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInquiryOpen(true)}
                      className="move-cta hover-glow active:scale-[0.98] transition-all"
                      style={{
                        width: "100%",
                        background: "var(--accent)",
                        color: "var(--on-accent)",
                        border: "none",
                        padding: "16px",
                        fontFamily: "var(--font-body)",
                        fontSize: "16px",
                        cursor: "pointer",
                        borderRadius: "4px",
                        fontWeight: "bold"
                      }}
                    >
                      Connect with an Authorized Broker →
                    </button>
                  </div>
                )}
              </div>

              {!d.is_sample && (
                <div style={{ marginTop: "12px", width: "100%" }}>
                  <button
                    onClick={openCuratedShare}
                    aria-label="Share this property's briefing"
                    className="w-full bg-transparent border border-surface-variant text-text-secondary font-mono text-xs tracking-[0.12em] uppercase font-bold py-3 px-4 rounded hover:bg-surface-alt transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    Share
                  </button>
                </div>
              )}
              {isOperator && (
                <button
                  onClick={() => setIsOperatorRequestOpen(true)}
                  className="mt-3 w-full bg-transparent border border-gold-accent/40 text-gold-accent font-mono text-[11px] tracking-[0.12em] uppercase py-3 px-4 rounded cursor-pointer hover:bg-gold-accent/10 active:scale-[0.98] transition-all"
                >
                  Request to Operate This Building →
                </button>
              )}

              {/* RA 9646 compliance badge */}
              <div style={{display:"inline-flex", alignItems:"center", gap:"8px", marginTop:"20px", padding:"8px 14px", border:"0.5px solid rgba(76,175,125,0.4)", borderRadius:"4px", background:"rgba(76,175,125,0.06)"}}>
                <span style={{width:"7px", height:"7px", borderRadius:"50%", background:"var(--green)", flexShrink:0}}/>
                <span style={{fontFamily:"var(--font-mono)", fontSize:"9.5px", color:"var(--green)", letterSpacing:"0.14em", textTransform:"uppercase"}}>RA 9646 Compliant · Display-Only</span>
              </div>

              <p style={{fontFamily:"var(--font-body)", fontSize:"13px", color:"var(--text-muted)", lineHeight:1.7, marginTop:"16px", maxWidth:"600px"}}>
                ScoutIt is a spatial intelligence archive. In compliance with R.A. 9646, all site walks, direct inquiries, and purchase offers are facilitated exclusively by licensed, authorized real estate brokers.
              </p>

            </div>

            <div className="panel-sidebar">
              {d.tenure && <div className="sidebar-block"><div className="sidebar-accent-line"/><div className="sidebar-label">Acquisition</div><div className="sidebar-value">{d.tenure}</div>{d.title_status && <div className="sidebar-sub">{d.title_status}</div>}</div>}
              {d.scoutit_verdict && <div className="sidebar-block"><div className="sidebar-label">ScoutIt verdict</div><div className="sidebar-value" style={{color:"var(--green)", fontSize:"12px", lineHeight:1.4}}>{d.scoutit_verdict}</div></div>}
            </div>
          </div>

         </div>{/* /zone-story */}

       </div>{/* /page */}

      {isOwner && !isDraftMode && (
        <button
          onClick={() => router.push(`/dashboard?edit=${d.id}`)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            border: 'none',
            padding: '14px 24px',
            borderRadius: '4px',
            fontFamily: "var(--font-mono)",
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
        propertySlug={slug || d.slug}
        defaultMessage={prefilledInquiryMsg}
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
              loading="lazy"
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

      {/* 3-Tier public Q&A — bottom of the chapter stack. Hidden in draft
          mode: an unpublished listing has no public audience to answer it. */}
      {/* Buyer-facing staleness notice. Renders ONLY past 6 months —
          see FreshnessBadge for why public surfaces stay quiet before that. */}
      {!isDraftMode && (
        <div style={{ padding: "0 16px", maxWidth: "900px", margin: "0 auto" }}>
          <FreshnessBadge lastVerifiedDate={d.last_verified_date || d.lastVerifiedDate} variant="public" />
        </div>
      )}

      {!isDraftMode && (
        <PropertyFAQSection propertySlug={d.slug || slug} propertyTitle={d.title} />
      )}

      <ShareModal
        isOpen={!!shareTextOpen}
        onClose={() => setShareTextOpen(null)}
        shareText={shareTextOpen}
        property={d}
        propertyUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />
    </>
  );
}
