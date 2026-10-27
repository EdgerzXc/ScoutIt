"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import ProfileButton from "@/components/ui/ProfileButton";
import CinematicJourney from "@/components/cinematic/CinematicJourney";
import dynamic from "next/dynamic";
import ScoutItWordmark from "@/components/brand/ScoutItWordmark";
import ScoutItMark from "@/components/brand/ScoutItMark";
const BlackHoleCanvas = dynamic(() => import("@/components/descent/BlackHoleCanvas"), { ssr: false });
const GoldenHorizonCanvas = dynamic(() => import("@/components/descent/GoldenHorizonCanvas"), { ssr: false });
const DriftingPropertyBubbles = dynamic(() => import("@/components/hero/DriftingPropertyBubbles"), { ssr: false });
const MobileCategoryQuickAccess = dynamic(() => import("@/components/hero/MobileCategoryQuickAccess"), { ssr: false });

const GOLDEN_DEFAULT_PARAMS = {
  horizonRadius: 0.16, diskInner: 0.22, diskOuter: 0.7, lensingStrength: 0.28,
  spinSpeed: 0.8, beamingStrength: 0.45, brightness: 1.1, bloomIntensity: 1.3,
  colorShift: 0, noiseFreq: 1.0, pitch: 0.12, yaw: 0.0, starfieldDensity: 0.6,
};
import InteractivePanel from "@/components/descent/InteractivePanel";
import Footer from "@/components/layout/Footer";
import {
  isLiteMode,
  setInteractiveMode,
  INTERACTIVE_MODE_EVENT,
} from "@/lib/liteMode";
import { syncAuthenticatedUserCache } from "@/lib/entitlements";
import { loadPublicCatalog } from "../lib/cms/publicCatalog";

export default function HomeClient() {
  const [driftingRocks, setDriftingRocks] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = localStorage.getItem("scoutit_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && active) {
            syncAuthenticatedUserCache(parsed);
            return;
          }
        }
        const { supabase } = await import("@/lib/supabaseClient");
        if (supabase?.auth?.getSession) {
          const { data } = await supabase.auth.getSession();
          const sbUser = data?.session?.user;
          if (sbUser && active) {
            const meta = sbUser.user_metadata || {};
            syncAuthenticatedUserCache({
              id: sbUser.id,
              email: sbUser.email,
              name: meta.full_name || meta.name || sbUser.email,
              tier: meta.subscription_tier || meta.tier || "starry",
              active_roles: Array.isArray(meta.active_roles) ? meta.active_roles : ["seeker"],
            });
          }
        }
      } catch {}
    })();
    return () => { active = false; };
  }, []);
  const containerRef = useRef(null);

  // Title-screen beam interaction (auto-fires on load + on UFO click)
  const [fireId, setFireId]   = useState(0);   // remounts the beam to replay its animation
  const [flashId, setFlashId] = useState(0);   // remounts the wordmark impact flash
  const [wordLit, setWordLit] = useState(false);
  const [powering, setPowering] = useState(false);
  const beamTimers = useRef([]);
  const beamInterval = useRef(null); // repeating auto-fire interval

  // Interactive Mode — hidden easter egg (5 clicks on the UFO within ~2s).
  // Not a security boundary, just a discovery gate; the beam/descent effects
  // below still fire on every single click same as before.
  const [interactiveMode, setInteractiveModeState] = useState(false);
  const [blackHoleParams, setBlackHoleParams] = useState(GOLDEN_DEFAULT_PARAMS);
  const ufoTapTimes = useRef([]);

  useEffect(() => {
    // Every homepage visit starts with the simple black hole, even when an
    // older browser still has the former saved Interactive preference.
    setInteractiveMode(false);
    const onToggle = (e) => setInteractiveModeState(!!e.detail?.on);
    window.addEventListener(INTERACTIVE_MODE_EVENT, onToggle);
    return () => {
      window.removeEventListener(INTERACTIVE_MODE_EVENT, onToggle);
      setInteractiveMode(false);
    };
  }, []);

  const fireBeam = useCallback((withPower) => {
    beamTimers.current.forEach(clearTimeout);
    beamTimers.current = [];
    const push = (fn, ms) => beamTimers.current.push(setTimeout(fn, ms));
    const launch = () => {
      setFireId((id) => id + 1);                                    // (re)play beam
      push(() => { setWordLit(true); setFlashId((f) => f + 1); }, 600); // beam reaches wordmark
      push(() => setWordLit(false), 1600);                          // hold, then 2s glow fade-back
    };
    if (withPower) {
      setPowering(true);
      push(() => { setPowering(false); launch(); }, 500);           // power-up flash, then fire
      // Cinematic journey disabled ΓÇö beam sequence ends here.
    } else {
      launch();
    }
  }, []);

  // Auto-fire on load, then repeat every 6s so the beam stays visible on both mobile & desktop
  useEffect(() => {
    if (isLiteMode()) return; // Lite Mode: no beam loop

    // Reduced motion: one static beam strike, no 6s repeat loop.
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const t = setTimeout(() => { if (!document.hidden) fireBeam(false); }, 2000);
      return () => {
        clearTimeout(t);
        beamTimers.current.forEach(clearTimeout);
      };
    }

    const startInterval = () => {
      if (beamInterval.current || document.hidden) return;
      beamInterval.current = setInterval(() => {
        if (!document.hidden) fireBeam(false);
      }, 6000);
    };

    const stopInterval = () => {
      if (beamInterval.current) {
        clearInterval(beamInterval.current);
        beamInterval.current = null;
      }
    };

    const t = setTimeout(() => {
      if (!document.hidden) fireBeam(false);
      startInterval();
    }, 2000);

    const onVisibilityChange = () => {
      if (document.hidden) {
        stopInterval();
      } else {
        startInterval();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(t);
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      beamTimers.current.forEach(clearTimeout);
    };
  }, [fireBeam]);



  useEffect(() => {
    loadPublicCatalog().catch((err) => {
      console.error("Failed to load CMS data on homepage:", err);
    });
  }, []);

  // Restore scroll position from sessionStorage
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("homepage_scroll");
    if (savedScroll && containerRef.current) {
      const timer = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop = parseInt(savedScroll, 10);
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Save scroll position at most once per frame ΓÇö writing sessionStorage on
  // every scroll event adds main-thread work during the scroll itself.
  const scrollSaveRaf = useRef(0);
  const handleScroll = (e) => {
    const target = e.currentTarget;
    if (!target || scrollSaveRaf.current) return;
    scrollSaveRaf.current = requestAnimationFrame(() => {
      scrollSaveRaf.current = 0;
      sessionStorage.setItem("homepage_scroll", target.scrollTop.toString());
    });
  };
  useEffect(() => () => {
    if (scrollSaveRaf.current) cancelAnimationFrame(scrollSaveRaf.current);
  }, []);

  // Ambient infall specks (rocks, comets, neutron stars). One
  // self-perpetuating timer chain with the cap checked inside the functional
  // updater (no stale closure, no resubscribe churn). Background depth behind
  // the property bubbles; disabled in Lite Mode / reduced motion / tiny phones.
  useEffect(() => {
    let active = true;

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const prefersReducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isLiteMode() || prefersReducedMotion || (isMobile && window.innerWidth < 480)) {
      setDriftingRocks([]);
      return;
    }

    const maxParticles = isMobile ? 2 : 6;

    const spawnRock = () => {
      if (!active) return;
      if (typeof document !== "undefined" && document.hidden) {
        timerId = setTimeout(spawnRock, 4000);
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);

      // Select type: 80% rock, 10% comet, 10% neutron star
      const rand = Math.random();
      let type = 'rock';
      let size = '6px';
      let scale = 1.0;
      let borderRadius = '50%';

      const side = Math.floor(Math.random() * 4);
      let startX_pct, startY_pct;

      if (side === 0) {
        // Left
        startX_pct = -5;
        startY_pct = Math.floor(10 + Math.random() * 80);
      } else if (side === 1) {
        // Right
        startX_pct = 105;
        startY_pct = Math.floor(10 + Math.random() * 80);
      } else if (side === 2) {
        // Top
        startX_pct = Math.floor(10 + Math.random() * 80);
        startY_pct = -5;
      } else {
        // Bottom
        startX_pct = Math.floor(10 + Math.random() * 80);
        startY_pct = 105;
      }

      const startX = `${startX_pct}vw`;
      const startY = `${startY_pct}vh`;

      // Angle calculation towards center (50%, 50%) taking screen aspect ratio into account
      const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
      const dx = (50 - startX_pct) * (w / 100);
      const dy = (50 - startY_pct) * (h / 100);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      if (rand < 0.8) {
        type = 'rock';
        size = Math.floor(4 + Math.random() * 5) + "px"; // 4px to 8px
        scale = parseFloat((0.8 + Math.random() * 0.4).toFixed(2));
        borderRadius = `${Math.floor(30 + Math.random()*20)}% ${Math.floor(40 + Math.random()*20)}% ${Math.floor(30 + Math.random()*20)}% ${Math.floor(30 + Math.random()*20)}%`;
      } else if (rand < 0.9) {
        type = 'comet';
        size = Math.floor(3 + Math.random() * 3) + "px"; // 3px to 5px (smaller head)
        scale = parseFloat((0.9 + Math.random() * 0.3).toFixed(2));
      } else {
        type = 'neutron';
        size = Math.floor(14 + Math.random() * 8) + "px"; // 14px to 22px (bigger than stones & comets!)
        scale = parseFloat((0.9 + Math.random() * 0.3).toFixed(2));
      }

      let duration = 12;
      if (type === 'comet') {
        duration = Math.floor(6 + Math.random() * 6); // 6s to 12s, fast
      } else if (type === 'neutron') {
        duration = Math.floor(16 + Math.random() * 8); // 16s to 24s, slow
      } else {
        duration = Math.floor(10 + Math.random() * 8); // 10s to 18s, medium
      }

      setDriftingRocks(prev => {
        if (prev.length >= maxParticles) return prev;
        return [...prev, { id, type, startX, startY, size, duration, borderRadius, angle, scale }];
      });

      // Mobile: spawn slower for performance; Desktop: spawn faster for impact
      const nextDelay = isMobile ?
        (6000 + Math.random() * 4000) :  // 6-10s on mobile
        (4000 + Math.random() * 5000);   // 4-9s on desktop
      timerId = setTimeout(spawnRock, nextDelay);
    };

    let timerId = setTimeout(spawnRock, isMobile ? 3000 : 2000); // delay animation start on mobile

    return () => {
      active = false;
      clearTimeout(timerId);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      onScroll={handleScroll}
      className="cinematic-container"
    >
      <ProfileButton floating />
      {/* SECTION 1: SPACE HERO */}
      <section className={`snap-section section-hook ${interactiveMode ? "interactive-hero" : ""}`}>
        {/* Cinematic Cosmic Space Background */}
        <div className="space-bg-container">
          {/* Balance mode (default, everyone): the raymarched golden black
              hole framing the wordmark. Interactive mode (unlocked via 5
              clicks on the UFO): the full Golden Horizon simulator — drag to
              orbit, click shockwaves, hover lensing — plus its control
              panel. Lite Mode wins over both — each component no-ops
              internally when it's on. */}
          {interactiveMode ? (
            <>
              <GoldenHorizonCanvas params={blackHoleParams} />
              <InteractivePanel
                params={blackHoleParams}
                onChange={setBlackHoleParams}
                onClose={() => setInteractiveMode(false)}
              />
            </>
          ) : (
            <BlackHoleCanvas />
          )}
          {/* The shader carries the core + disk now; keep only the bottom
              horizon glow for grounding, plus a soft scrim so the wordmark
              stays readable over the bright disk band. */}
          <div className="event-horizon"></div>
          <div className="hero-content-scrim" aria-hidden="true"></div>

          {/* Faint Drifting Cosmic Elements (Occasional Rocks, Comets, Neutron Stars) */}
          {driftingRocks.map((rock) => (
            <div
              key={rock.id}
              className="drifting-container"
              style={{
                position: 'absolute',
                top: rock.startY,
                left: rock.startX,
                width: rock.size,
                height: rock.size,
                animation: `driftToCenter ${rock.duration}s linear forwards`,
                pointerEvents: 'none',
                zIndex: 2
              }}
              onAnimationEnd={() => {
                setDriftingRocks((prev) => prev.filter((r) => r.id !== rock.id));
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotate(${rock.angle}deg) scale(${rock.scale})`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none'
                }}
              >
                {rock.type === 'rock' && (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: rock.borderRadius,
                      background: 'rgba(var(--accent-rgb), 0.55)', // Gold-tinted to match theme
                      boxShadow: '0 0 6px rgba(var(--accent-rgb), 0.25)',
                      filter: 'blur(0.5px)'
                    }}
                  />
                )}
                {rock.type === 'comet' && (
                  <div className="comet-head">
                    <div className="comet-tail"></div>
                  </div>
                )}
                {rock.type === 'neutron' && (
                  <div className="neutron-star-drifting" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Celestial Property Bubbles: drifting bodies fall into the black hole.
            This is the one hero bubble experience (rail/amphitheater removed). */}
        <DriftingPropertyBubbles />

        {/* Main hook content */}
        <div className="hook-content">

          {/* SEO / a11y heading — visually hidden; the styled wordmark below is decorative */}
          <h1 className="visually-hidden-h1">
            ScoutIt: Philippine Space Intelligence Platform
          </h1>

          {/* UFO (clickable easter egg) hovering above the wordmark + tractor beam */}
          <div className="title-ufo-zone">
            <span
              className={`title-ufo ${powering ? "powering" : ""}`}
              onClick={() => {
                fireBeam(true);

                // Secret gesture: 5 quick taps on the UFO toggle Interactive Mode.
                const now = Date.now();
                ufoTapTimes.current = ufoTapTimes.current.filter((tm) => now - tm < 2000);
                ufoTapTimes.current.push(now);
                if (ufoTapTimes.current.length >= 5) {
                  ufoTapTimes.current = [];
                  setInteractiveMode(!interactiveMode);
                }
              }}
              role="presentation"
            >
              <span className="title-ufo-underglow" />
              <span className="title-ufo-ping" />
              <svg className="title-ufo-svg" viewBox="0 0 120 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <filter id="ufoRimGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--accent)" floodOpacity="0.55" style={{ floodColor: "var(--accent)" }} />
                  </filter>
                </defs>
                {/* saucer body — wide disc */}
                <ellipse cx="60" cy="44" rx="55" ry="13" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" filter="url(#ufoRimGlow)" />
                {/* belly — slightly lighter underside */}
                <ellipse cx="60" cy="48" rx="40" ry="8" fill="var(--surface2)" />
                {/* belly lights — 4 evenly spaced gold dots */}
                <circle className="ufo-belly" cx="36" cy="49" r="2.2" />
                <circle className="ufo-belly" cx="52" cy="51" r="2.2" />
                <circle className="ufo-belly" cx="68" cy="51" r="2.2" />
                <circle className="ufo-belly" cx="84" cy="49" r="2.2" />
                {/* dome / cockpit — prominent, green-tinted */}
                <path d="M37 38 Q60 4 83 38 Z" fill="var(--surface3)" stroke="var(--accent)" strokeWidth="1" />
                {/* porthole windows ΓÇö sequential 1-2-3 blink */}
                <circle className="porthole porthole-1" cx="49" cy="28" r="4" />
                <circle className="porthole porthole-2" cx="60" cy="24" r="4" />
                <circle className="porthole porthole-3" cx="71" cy="28" r="4" />
              </svg>
            </span>
            {fireId > 0 && <span key={fireId} className="title-beam" />}
          </div>

          {/* ScoutIt wordmark */}
          <ScoutItWordmark className={`scoutit-wordmark ${wordLit ? "lit" : ""}`}>
            {flashId > 0 && <span key={`flash-${flashId}`} className="title-impact" />}
          </ScoutItWordmark>

          {/* Discipline badge */}
          <div className="title-badge">SPACE INTELLIGENCE TECHNOLOGY</div>

          {/* Divider */}
          <div className="title-divider"></div>

          {/* Spatial commerce and space intelligence value proposition */}
          <p className="title-tagline-intro">
            Space intelligence technology and spatial commerce for the Philippines. Architectural briefings, verified ground data, and named sources.
          </p>


          {/* Taglines */}
          <p className="title-tagline-1">Get lost in spaces that inspire you.</p>
          <div className="title-tagline-2">SPATIAL COMMERCE &middot; PHILIPPINE PROPERTY</div>

          {/* Primary action path — gives first-time visitors clear cascading doors in */}
          <div className="hero-cta-row">
            <Link href="/property" className="hero-cta-primary">Discover Spaces</Link>
            <Link href="/showcase" className="hero-cta-secondary">Orbit Showcase</Link>
            <Link href="/layer/orbit" className="hero-cta-secondary">6-Layer Descent</Link>
          </div>

          {/* Pre-launch founding-cohort capture */}
          <button
            type="button"
            className="hero-founding-link"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("scoutit:open-waitlist", { detail: { source: "hero" } })
              )
            }
          >
            ◈ Founding access · Lock your rate before launch
          </button>
        </div>

        {/* Scroll indicator removed — beam sequence begins the story */}
      </section>


      {/* =========================================
          LAUNCHPAD (ELEVATOR MENU)
          ========================================= */}
      <section data-scoutit-guide="scoutit-home-launchpad" className="relative w-full max-w-6xl mx-auto px-6 py-24 z-20 flex flex-col items-center" style={{ backgroundColor: 'transparent', contentVisibility: 'auto', containIntrinsicSize: 'auto 900px' }}>
        <div className="flex justify-center mb-6" style={{ fontSize: "32px", letterSpacing: "0.12em", color: "var(--accent)" }} aria-hidden="true">
          <ScoutItWordmark leading={<ScoutItMark />} />
        </div>

        {/* Immediate Category Fast-Track & Direct Jump Action Sheet */}
        <MobileCategoryQuickAccess />

        <h2 className="font-mono text-sm tracking-[0.12em] uppercase text-gold-accent mb-6 text-center opacity-80" style={{ textShadow: '0 0 10px rgba(var(--accent-rgb), 0.3)' }}>
          Browse Space Catalog
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {/* Card 01: Orbit */}
          <Link href="/layer/orbit" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(var(--accent-rgb),0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 01 // ORBIT</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">Orbit: Top Demand</h3>
            <p className="text-sm text-text-secondary">Properties ranked by real buyer and seeker inquiry demand across the market.</p>
          </Link>

          {/* Card 02: Stratosphere */}
          <Link href="/layer/stratosphere" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--accent-rgb),0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 02 // STRATOSPHERE</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">Stratosphere: Market Intel</h3>
            <p className="text-sm text-text-secondary">Independent neighborhood reports, pricing trends, and zoning analysis.</p>
          </Link>

          {/* Card 03: Metropolis */}
          <Link href="/layer/metropolis" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 lg:col-span-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(var(--accent-rgb),0.15),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 03 // METROPOLIS</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">Metropolis: Directory</h3>
            <p className="text-sm text-text-secondary">Search commercial, residential, and event spaces across the Philippines.</p>
          </Link>

          {/* Card 04: The Crust */}
          <Link href="/layer/crust" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--accent-rgb),0.05),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 04 // THE CRUST</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">The Crust: Professional Roster</h3>
            <p className="text-sm text-text-secondary">Licensed brokers, spatial photographers, site researchers, and event planners.</p>
          </Link>

          {/* Card 05: The Mantle */}
          <Link href="/layer/mantle" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--accent-rgb),0.12),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 05 // THE MANTLE</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">The Mantle: Platform Truth</h3>
            <p className="text-sm text-text-secondary">Data philosophy and verification standards.</p>
          </Link>

          {/* Card 06: The Core */}
          <Link href="/layer/core" className="text-left group relative bg-surface/80 backdrop-blur-md border border-border rounded-xl p-8 overflow-hidden hover:border-gold-accent/50 transition-all duration-500 hover:-translate-y-1 block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--accent-rgb),0.1),transparent_50%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="font-mono text-[12px] text-gold-accent tracking-widest mb-4">LAYER 06 // THE CORE</div>
            <h3 className="font-display text-2xl text-on-surface mb-2">The Core: Private Command</h3>
            <p className="text-sm text-text-secondary">Your personal board, saved comparisons, property portfolio, and deal inbox.</p>
          </Link>
        </div>
      </section>

      <style jsx global>{`
        /* Cinematic Snap Container */
        .cinematic-container {
          height: 100dvh;
          width: 100vw;
          overflow-y: scroll;
          /* NOTE: snap must stay "proximity" and there must be NO
             scroll-behavior:smooth here. With "mandatory" snap (and worse,
             mandatory + smooth), every wheel tick during the snap animation
             forces Chrome to restart it; combined with the hero canvas this
             locked up rendering for 30s+. Proximity still settles sections
             gently but lets free scrolling breathe. */
          scroll-snap-type: y proximity;
          background: var(--bg);
          color: var(--text-primary);
        }
        
        .cinematic-container::-webkit-scrollbar {
          display: none;
        }

        .snap-section {
          scroll-snap-align: start;
          width: 100%;
          height: 100dvh;
          position: relative;
          overflow: hidden;
        }

        /* Visually-hidden SEO/a11y heading */
        .visually-hidden-h1 {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* Hero primary action path */
        .hero-cta-row {
          display: flex;
          gap: 16px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          margin-top: 36px;
        }

        .hero-cta-primary {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--on-accent);
          background: var(--accent-fill);
          border: 1px solid var(--accent-fill);
          padding: 15px 34px;
          border-radius: 4px;
          text-decoration: none;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast), border-color var(--transition-fast);
          animation: glowPulse 3.2s ease-in-out infinite;
        }
        .hero-cta-primary:hover {
          background: var(--accent-fill-hover);
          border-color: var(--accent-fill-hover);
          box-shadow: 0 8px 30px rgba(var(--accent-rgb), 0.25);
          transform: translateY(-2px);
          animation: none;
        }
        .hero-cta-primary:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 3px;
        }

        .hero-cta-secondary {
          font-family: var(--font-body);
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--accent);
          background: transparent;
          border: 1px solid var(--accent-muted);
          padding: 15px 30px;
          border-radius: 4px;
          text-decoration: none;
          transition: transform var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast);
        }
        .hero-cta-secondary:hover {
          border-color: var(--accent);
          color: var(--accent-bright);
          transform: translateY(-2px);
        }
        .hero-cta-secondary:focus-visible {
          outline: 2px solid var(--accent-bright);
          outline-offset: 3px;
        }

        .hero-founding-link {
          display: inline-block;
          margin-top: 18px;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.78;
          transition: opacity var(--transition-fast), text-shadow var(--transition-fast);
        }
        .hero-founding-link:hover {
          opacity: 1;
          text-shadow: 0 0 14px rgba(var(--accent-rgb), 0.5);
        }
        .hero-founding-link:focus-visible {
          outline: 1.5px solid var(--accent-bright);
          outline-offset: 4px;
        }

        /* ─── SECTION 1: SPACE HERO ────────────────────────────────── */
        .section-hook {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          /* Deliberately dark in BOTH themes: this is the starfield hero and
             "outer space" is the concept. globals.css re-declares dark ink
             tokens for it in light mode (the inverted-island rule). */
          background: var(--bg);
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .space-bg-container {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
        }

        .event-horizon {
          position: absolute;
          bottom: -150px;
          left: 50%;
          transform: translateX(-50%);
          width: 140vw;
          height: 350px;
          border-radius: 50% 50% 0 0;
          background: radial-gradient(
            ellipse at top,
            rgba(var(--accent-rgb), 0.22) 0%,
            rgba(var(--accent-rgb), 0.06) 40%,
            transparent 70%
          );
          filter: blur(40px);
          pointer-events: none;
          z-index: 2;
        }

        /* Faint drifting rock fragments / meteors (Occasional) */
        @keyframes driftToCenter {
          0% {
            transform: scale(1);
            opacity: 0;
          }
          15% {
            opacity: 0.85; /* Bright and visible during flight */
          }
          90% {
            opacity: 0.85; /* Stays bright and visible for longer, including the tail */
          }
          100% {
            left: 50%;
            top: 50%;
            transform: scale(0.05); /* Sucked fully into the horizon */
            opacity: 0;
            filter: blur(2.5px);
          }
        }

        /* ── Comet Elements ── */
        .comet-head {
          width: 100%;
          height: 100%;
          background: var(--text-primary);
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(var(--text-primary-rgb), 0.9), 0 0 20px rgba(var(--accent-rgb), 0.4);
          position: relative;
        }
        .comet-tail {
          position: absolute;
          right: calc(100% - 2px);
          top: 50%;
          transform: translateY(-50%);
          width: 90px; /* Longer, highly noticeable tail */
          height: 3px; /* Thicker head connection */
          background: linear-gradient(to left, var(--text-primary) 0%, rgba(var(--accent-rgb), 0.6) 30%, rgba(var(--accent-rgb), 0.15) 75%, transparent 100%);
          clip-path: polygon(0 50%, 100% 0, 100% 100%); /* Elegant taper wedge shape */
          pointer-events: none;
        }

        /* ── Drifting Neutron Star ── */
        .neutron-star-drifting {
          width: 100%;
          height: 100%;
          background: color-mix(in srgb, var(--intel-cyan) 25%, white);
          border-radius: 50%;
          box-shadow:
            0 0 12px color-mix(in srgb, var(--intel-cyan) 80%, white),
            0 0 24px rgba(var(--accent-rgb), 0.6);
          animation: pulseNeutronDrifting 2.5s ease-in-out infinite alternate;
        }
        @keyframes pulseNeutronDrifting {
          0% {
            transform: scale(0.85);
            box-shadow:
              0 0 8px color-mix(in srgb, var(--intel-cyan) 70%, white),
              0 0 16px rgba(var(--accent-rgb), 0.4);
          }
          100% {
            transform: scale(1.15);
            box-shadow:
              0 0 16px color-mix(in srgb, var(--intel-cyan) 90%, white),
              0 0 32px rgba(var(--accent-rgb), 0.75);
          }
        }

        /* ΓöÇΓöÇ Main wordmark container ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
        .hook-content {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          z-index: 10;
          position: relative;
          box-sizing: border-box;
        }

        /* Event-horizon canvas ΓÇö full-cover, behind all hero content */
        .event-horizon-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          display: block;
        }

        /* Interactive Mode: let drags/clicks fall through the hero text
           block onto the Golden Horizon canvas, while every real control
           (links, buttons, the UFO) stays clickable. */
        .interactive-hero .hook-content {
          pointer-events: none;
        }
        .interactive-hero .hook-content a,
        .interactive-hero .hook-content button,
        .interactive-hero .hook-content .title-ufo {
          pointer-events: auto;
        }

        /* Readability scrim over the shader's bright disk band — a soft dark
           ellipse behind the wordmark/tagline block, invisible at the edges */
        .hero-content-scrim {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          background: radial-gradient(ellipse 44% 30% at 50% 62%, rgba(var(--bg-rgb), 0.34) 0%, rgba(var(--bg-rgb), 0.14) 55%, transparent 78%);
        }
        :global(body.light-mode) .hero-content-scrim {
          display: none;
        }

        /* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ TITLE SCREEN ΓÇö WORDMARK REDESIGN ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */
        .scoutit-wordmark {
          position: relative;
          display: flex;
          align-items: baseline;
          justify-content: center;
          margin: 0 0 20px;
          line-height: 1;
        }
        .scoutit-wordmark .word-s,
        .scoutit-wordmark .word-scout,
        .scoutit-wordmark .word-it {
          font-family: var(--font-display);
          font-weight: 400;
          font-size: clamp(64px, 10vw, 120px);
          letter-spacing: 0.12em;
          line-height: 1;
          /* slow fade-back to resting state (2s) when the lit class is removed */
          transition: color 2s ease, text-shadow 2s ease;
        }
        .scoutit-wordmark .word-scout { color: var(--text-primary); }
        .scoutit-wordmark .word-s     { color: var(--accent); }
        .scoutit-wordmark .word-it    { color: var(--accent); margin-right: -4px; }
        /* beam-hit illumination snaps on fast, then fades back slowly via base transition */
        .scoutit-wordmark.lit .word-scout {
          color: var(--text-primary);
          text-shadow: 0 0 60px rgba(var(--accent-rgb), 0.8), 0 0 120px rgba(var(--accent-rgb), 0.3);
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }
        .scoutit-wordmark.lit .word-s,
        .scoutit-wordmark.lit .word-it {
          color: var(--accent);
          text-shadow: 0 0 60px rgba(var(--accent-rgb), 0.9), 0 0 120px rgba(var(--accent-rgb), 0.4);
          transition: color 0.15s ease, text-shadow 0.15s ease;
        }
        :global(body.light-mode) .scoutit-wordmark .word-scout,
        :global(body.light-mode) .scoutit-wordmark.lit .word-scout {
          color: var(--text-primary);
          text-shadow: none;
        }
        :global(body.light-mode) .scoutit-wordmark .word-s,
        :global(body.light-mode) .scoutit-wordmark .word-it,
        :global(body.light-mode) .scoutit-wordmark.lit .word-s,
        :global(body.light-mode) .scoutit-wordmark.lit .word-it {
          color: var(--accent);
          text-shadow: none;
        }

        /* Impact flash burst at the wordmark when the beam lands */
        .title-impact {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(var(--accent-rgb), 0.6) 0%, rgba(var(--accent-rgb), 0) 60%);
          transform: translate(-50%, -50%) scale(0.3);
          pointer-events: none;
          opacity: 0;
          z-index: -1;
          animation: titleImpact 0.3s ease-out forwards;
        }

        /* ── UFO (clickable easter egg) hovering above the wordmark ── */
        .title-ufo-zone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          height: 160px;
          margin-bottom: 8px;
        }
        .title-ufo {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 24px;          /* generous, reliable click target around the saucer */
          cursor: pointer;
          z-index: 5;
          animation: titleUfoFloat 3s ease-in-out infinite;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          -webkit-user-select: none;
        }
        .title-ufo.powering { animation: none; }   /* stop floating during power-up */
        /* Soft gold underglow — UFO emits faint warmth downward */
        .title-ufo-underglow {
          position: absolute;
          top: 60%;
          left: 50%;
          transform: translateX(-50%);
          width: 180px;
          height: 90px;
          background: radial-gradient(ellipse at top, rgba(var(--accent-rgb), 0.12), rgba(var(--accent-rgb), 0) 70%);
          pointer-events: none;
          z-index: -1;
        }
        /* Faint gold "I'm alive" pulse ring beneath the saucer every 4s */
        .title-ufo-ping {
          position: absolute;
          top: 56%;
          left: 50%;
          width: 60px;
          height: 60px;
          margin: -30px 0 0 -30px;
          border-radius: 50%;
          border: 1px solid rgba(var(--accent-rgb), 0.5);
          pointer-events: none;
          opacity: 0;
          z-index: -1;
          animation: ufoPing 4s ease-out infinite;
        }
        .title-ufo-svg {
          width: 104px;
          height: auto;
          display: block;
          animation: titleSaucerTilt 9s ease-in-out infinite;
        }
        .title-ufo-svg .porthole { fill: var(--green); }
        /* sequential 1-2-3 blink (delays stagger the same keyframe) */
        .title-ufo-svg .porthole-1 { animation: portSeq 1.4s linear infinite; animation-delay: 0s; }
        .title-ufo-svg .porthole-2 { animation: portSeq 1.4s linear infinite; animation-delay: 0.2s; }
        .title-ufo-svg .porthole-3 { animation: portSeq 1.4s linear infinite; animation-delay: 0.4s; }
        /* power-up: all three flash together, rapidly, 3x over ~0.5s */
        .title-ufo.powering .porthole { animation: portPower 0.166s ease-in-out 3; }
        .title-ufo-svg .ufo-belly { fill: rgba(var(--accent-rgb), 0.6); }

        /* ── Tractor beam: gold cone, fades to transparent, extend → hold → fade ── */
        .title-beam {
          display: block;
          width: 3px;
          height: 80px;
          margin-top: 0;
          background: linear-gradient(
            to bottom,
            rgba(var(--accent-bright-rgb), 1) 0%,
            rgba(var(--accent-rgb), 0.85) 30%,
            rgba(var(--accent-rgb), 0.3) 70%,
            rgba(var(--accent-rgb), 0) 100%
          );
          box-shadow:
            0 0 8px rgba(var(--accent-rgb), 0.6),
            0 0 20px rgba(var(--accent-rgb), 0.25);
          border-radius: 0 0 4px 4px;
          transform-origin: top center;
          opacity: 0;
          animation: titleBeamSeq 1.5s ease-out forwards;
        }
        /* Desktop: slightly wider beam for more visual impact */
        @media (min-width: 769px) {
          .title-beam {
            width: 4px;
            height: 100px;
            box-shadow:
              0 0 12px rgba(var(--accent-rgb), 0.7),
              0 0 30px rgba(var(--accent-rgb), 0.3);
          }
        }

        /* ── Discipline badge ── */
        .title-badge {
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 13px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 22px;
        }

        /* ── Divider ── */
        .title-divider {
          width: 32px;
          height: 1px;
          background: rgba(var(--accent-rgb), 0.35);
          margin: 0 auto 22px;
        }

        /* ── Taglines ── */
        .title-tagline-intro {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 520px;
          margin: 0 auto 24px;
          text-align: center;
          font-weight: 400;
        }
        .title-tagline-1 {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 20px;
          color: var(--text-secondary);
          text-align: center;
          margin: 0 0 10px;
        }
        .title-tagline-2 {
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          text-align: center;
          margin: 0 0 34px;
        }

        @keyframes titleUfoFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes titleSaucerTilt {
          0%, 100% { transform: rotate(-2.5deg); }
          50%      { transform: rotate(2.5deg); }
        }
        /* sequential porthole: ON ~0.2s within a 1.4s cycle, staggered by delay */
        @keyframes portSeq {
          0%   { opacity: 0.15; }
          5%   { opacity: 1; }
          14%  { opacity: 1; }
          20%  { opacity: 0.15; }
          100% { opacity: 0.15; }
        }
        @keyframes portPower {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.15; }
        }
        @keyframes ufoPing {
          0%   { transform: scale(0.5); opacity: 0; }
          4%   { opacity: 0.6; }
          25%  { transform: scale(1); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes titleBeamSeq {
          0%   { transform: scaleY(0); opacity: 0; }
          6%   { opacity: 1; }
          40%  { transform: scaleY(1); opacity: 1; }   /* extended (~0.6s) */
          65%  { transform: scaleY(1); opacity: 1; }   /* hold (~0.4s) */
          100% { transform: scaleY(1); opacity: 0; }   /* fade out (~0.5s) */
        }
        @keyframes titleImpact {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          35%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        /* ════════════ END TITLE SCREEN ════════════ */

        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 6px rgba(var(--accent-rgb), 0.15); }
          50%      { box-shadow: 0 0 26px rgba(var(--accent-rgb), 0.55); }
        }

        /* Mobile Adjustments */
        @media (max-width: 1024px) {
          .cinematic-container {
            scroll-snap-type: none;
            height: auto;
            overflow-y: visible;
          }
          .snap-section {
            scroll-snap-align: none;
            height: auto !important;
            min-height: 100vh;
            overflow: visible;
          }
        }

        @media (max-width: 900px) {
          .section-hook {
            min-height: 70vh;
            padding: 40px 0;
          }
        }

        @media (max-width: 768px) {
          .cinematic-container {
            scroll-snap-type: none !important;
            height: auto !important;
            min-height: 100dvh !important;
            overflow-y: auto !important;
          }
          .snap-section {
            scroll-snap-align: none !important;
            height: auto !important;
            min-height: 100dvh !important;
            padding: 40px 16px !important;
          }
          .section-hook {
            min-height: 100dvh !important;
            padding: 60px 16px max(28px, calc(16px + env(safe-area-inset-bottom))) !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            width: 100% !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            box-sizing: border-box !important;
          }
          .hook-content {
            width: 100% !important;
            max-width: 480px !important;
            min-width: 0 !important;
            margin: 0 auto !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .scoutit-wordmark {
            margin: 0 0 16px !important;
          }
          .scoutit-wordmark .word-s,
          .scoutit-wordmark .word-scout,
          .scoutit-wordmark .word-it {
            font-size: clamp(36px, 8.5vw, 54px) !important;
            letter-spacing: 0.08em !important;
          }
          .title-ufo-zone {
            height: 90px !important;
            margin-bottom: 2px !important;
          }
          .title-ufo-svg {
            width: 72px !important;
          }
          .title-badge {
            font-size: 12px !important;
            letter-spacing: 0.1em !important;
            margin-bottom: 8px !important;
          }
          .title-divider {
            margin: 8px auto 14px !important;
          }
          .title-tagline-intro {
            font-size: 13px !important;
            line-height: 1.55 !important;
            margin: 0 auto 14px !important;
            max-width: 100% !important;
            padding: 0 8px !important;
          }
          .title-tagline-1 {
            font-size: clamp(16px, 4vw, 19px) !important;
            margin-bottom: 4px !important;
          }
          .title-tagline-2 {
            font-size: 12px !important;
            letter-spacing: 0.12em !important;
            margin: 0 0 18px !important;
          }
          .hero-cta-row {
            width: 100% !important;
            max-width: 360px !important;
            margin: 18px auto 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
          .hero-cta-primary {
            width: 100% !important;
            min-height: 48px !important;
            padding: 14px 20px !important;
            font-size: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .hero-cta-secondary {
            width: 100% !important;
            min-height: 44px !important;
            padding: 12px 18px !important;
            font-size: 12px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .hero-cta-row a[href="/showcase"] {
            display: none !important;
          }
          .hero-founding-link {
            margin-top: 14px !important;
            font-size: 12px !important;
            min-height: 44px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }

        @media (max-width: 640px) {
          .cinematic-container {
            height: auto;
            padding-bottom: env(safe-area-inset-bottom);
          }
          .snap-section {
            height: auto;
            min-height: auto;
            padding: 24px 14px !important;
          }
          .scoutit-wordmark {
            margin-bottom: 16px;
            gap: 0.02em;
          }
          button, [role="button"], .header-menu-btn, .header-back-btn {
            min-height: 44px !important;
          }
        }

        @media (max-width: 480px) {
          .cinematic-container {
            height: auto;
          }
          .snap-section {
            height: auto;
            min-height: auto;
            padding: 20px 10px !important;
          }
          .scoutit-wordmark {
            margin-bottom: 14px;
            gap: 0;
          }
          .drifting-container {
            display: none !important;
          }
          .event-horizon {
            height: 250px;
            width: 120vw;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
          .hero-cta-primary {
            animation: none !important;
            box-shadow: var(--shadow-glow-soft) !important;
          }
        }

        @media (max-height: 600px) and (orientation: landscape) {
          .section-hook {
            min-height: 100vh;
            padding: 20px 16px;
          }
          .scoutit-wordmark {
            margin-bottom: 20px;
          }
        }
      `}</style>

      <section className="snap-section section-footer-wrapper" style={{ height: 'auto', minHeight: 'auto', scrollSnapAlign: 'end' }}>
        <Footer />
      </section>

      {/* Cinematic golden-light journey ΓÇö overlay, activated by the UFO click */}
      <CinematicJourney />
    </main>
  );
}
