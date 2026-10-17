"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isLiteMode } from "@/lib/liteMode";
import styles from "./driftingPropertyBubbles.module.css";

// ═══════════════════════════════════════════════════════════════
// CANONICAL SPACE CATEGORIES
// ═══════════════════════════════════════════════════════════════
export const CELESTIAL_SPACES = [
  {
    id: "commercial",
    type: "Commercial",
    label: "Offices",
    subtitle: "Class-A HQ Sky Towers",
    zone: "ZONE 02 // COM",
    diorama: "commercial",
  },
  {
    id: "residential",
    type: "Residential",
    label: "Residences",
    subtitle: "Penthouses & Estates",
    zone: "ZONE 01 // RES",
    diorama: "residential",
  },
  {
    id: "restaurants",
    type: "Restaurants",
    label: "F&B & Retail",
    subtitle: "Culinary & Dining Pavilions",
    zone: "ZONE 03 // FNB",
    diorama: "restaurants",
  },
  {
    id: "venues",
    type: "Venues",
    label: "Event Venues",
    subtitle: "Gala Domes & Exhibition Shells",
    zone: "ZONE 04 // VEN",
    diorama: "venues",
  },
  {
    id: "str",
    type: "STR",
    label: "STR & Stays",
    subtitle: "Island Sanctuaries & Villas",
    zone: "ZONE 05 // STR",
    diorama: "str",
  },
  {
    id: "hospitality",
    type: "Hospitality",
    label: "Hospitality",
    subtitle: "5-Star Resorts & Hotels",
    zone: "ZONE 06 // HOS",
    diorama: "hospitality",
  },
];

const ORBITAL_CLASSES = [styles.vectorNE, styles.vectorNW, styles.vectorSE, styles.vectorSW];

// ═══════════════════════════════════════════════════════════════
// ARCHITECTURAL 3D DIORAMA RENDERER
// ═══════════════════════════════════════════════════════════════
// Per-model fill factors, measured from each PNG's actual content extents:
// flat villas get big zooms to bleed edge-to-edge, tall towers get gentle
// ones so spires/beacons are never cropped by the globe rim.
const DIORAMA_SCALE = {
  residential: 1.4,
  commercial: 1.12,
  restaurants: 1.25,
  venues: 1.15,
  str: 1.45,
  hospitality: 1.15,
};

// Single source for the cache-buster: bump here and both the renders and the
// idle prefetch below stay in lockstep.
const BUBBLE_IMG_V = "20261015-v6";
const bubbleImg = (dioramaType) => `/images/bubbles/bubble_${dioramaType}.png?v=${BUBBLE_IMG_V}`;

function CategoryDiorama({ dioramaType }) {
  const [imgError, setImgError] = useState(false);
  const imgPath = bubbleImg(dioramaType);

  if (!imgError) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imgPath}
        alt={`${dioramaType} architectural diorama`}
        className={styles.blender3dImage}
        style={{ "--diorama-scale": DIORAMA_SCALE[dioramaType] ?? 1.28 }}
        onError={() => setImgError(true)}
        loading="eager"
        decoding="async"
      />
    );
  }

  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="154" rx="72" ry="24" fill="rgba(24, 20, 14, 0.95)" stroke="rgba(var(--accent-rgb, 232, 174, 60), 0.4)" strokeWidth="1" />
      <path d="M52 124 L100 146 L148 124 L100 102 Z" fill="rgba(35, 30, 22, 0.96)" stroke="rgba(var(--accent-rgb, 232, 174, 60), 0.55)" strokeWidth="1" />
      <line x1="60" y1="124" x2="60" y2="148" stroke="rgba(var(--accent-rgb, 232, 174, 60), 0.65)" strokeWidth="1.4" />
      <line x1="140" y1="124" x2="140" y2="148" stroke="rgba(var(--accent-rgb, 232, 174, 60), 0.65)" strokeWidth="1.4" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// INTERNAL COSMIC PARTICLES
// ═══════════════════════════════════════════════════════════════
const STATIC_PARTICLES = [
  { x: 30, y: 35, size: 2.2, opacity: 0.85 },
  { x: 70, y: 24, size: 2.0, opacity: 0.7 },
  { x: 22, y: 70, size: 1.8, opacity: 0.75 },
  { x: 78, y: 64, size: 2.4, opacity: 0.9 },
  { x: 44, y: 80, size: 1.8, opacity: 0.6 },
  { x: 60, y: 46, size: 2.2, opacity: 0.95 },
];

function InternalCosmicDust({ lite }) {
  if (lite) return null;
  return (
    <div className={styles.particleLayer}>
      {STATIC_PARTICLES.map((p, i) => (
        <span
          key={`particle-${i}`}
          className={styles.cosmicParticle}
          style={{
            top: `${p.y}%`,
            left: `${p.x}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT: DriftingPropertyBubbles
// ═══════════════════════════════════════════════════════════════
export default function DriftingPropertyBubbles() {
  const router = useRouter();
  const [lite, setLite] = useState(false);
  const [activeDrifters, setActiveDrifters] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);
  const [consumingId, setConsumingId] = useState(null);

  const cycleIndexRef = useRef(0);
  const vectorIndexRef = useRef(0);
  const timersRef = useRef([]);

  // Stray warp timers must never fire after unmount.
  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    setLite(isLiteMode());
  }, []);

  // Singularity Warp: the inner globe flies to the measured black-hole
  // center (50vw/40vh — shader parks the hole 10% above canvas center via
  // `uv.y -= 0.20`) with shrink + fade + defocus, blooms the burst, DWELLS so
  // the entry is actually seen, then routes. WAAPI is used instead of a CSS
  // class swap because swapping animations resets the wrapper's animated
  // left/top and teleports the bubble to its spawn corner.
  const SINGULARITY_X = 0.5;
  const SINGULARITY_Y = 0.4;
  const FLIGHT_MS = 650;
  const DWELL_MS = 400;

  const handleWarp = useCallback((drifter, wrapperEl) => {
    if (consumingId) return;
    setConsumingId(drifter.uniqueId);

    try {
      const r = wrapperEl?.getBoundingClientRect();
      const inner = wrapperEl?.firstElementChild;
      if (r && inner?.animate) {
        const dx = window.innerWidth * SINGULARITY_X - (r.left + r.width / 2);
        const dy = window.innerHeight * SINGULARITY_Y - (r.top + r.height / 2);
        inner.animate(
          [
            { transform: "scale(1) rotate(0deg)", opacity: 1, filter: "blur(0px)", offset: 0 },
            {
              transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) scale(0.45) rotate(160deg)`,
              opacity: 0.7,
              filter: "blur(3px)",
              offset: 0.55,
            },
            {
              transform: `translate(${dx}px, ${dy}px) scale(0.02) rotate(360deg)`,
              opacity: 0,
              filter: "blur(10px)",
              offset: 1,
            },
          ],
          { duration: FLIGHT_MS, easing: "cubic-bezier(0.55, 0, 0.55, 0.2)", fill: "forwards" }
        );
        // Sibling label pills are NOT inside the globe — without this they
        // linger at the freeze point while the globe flies away. Kill fast.
        Array.from(wrapperEl.children)
          .slice(1)
          .forEach((sib) => {
            try {
              sib.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
            } catch {}
          });
      }
    } catch {
      // No WAAPI (ancient browser): bubble freezes, timeout still routes.
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scoutit:black-hole-consume", {
          detail: { category: drifter.category.type },
        })
      );
    }

    // Flight, then dwell on the burst bloom at the hole so the entry reads
    // before the route change (previously navigation cut the payoff frame).
    timersRef.current.push(setTimeout(() => {
      setActiveDrifters((prev) => prev.filter((d) => d.uniqueId !== drifter.uniqueId));
      setConsumingId(null);
      router.push(`/property?type=${encodeURIComponent(drifter.category.type)}`);
    }, FLIGHT_MS + DWELL_MS));
  }, [consumingId, router]);

  // Spawn a new drifting celestial bubble (max 2 simultaneously).
  // NOTE: ref increments live OUTSIDE the updater on purpose. The old code
  // incremented inside it — React StrictMode double-invokes updaters in dev,
  // so refs advanced twice per spawn and only even-parity vectors (NE, SE)
  // ever committed: bubbles appeared on the RIGHT side only.
  const spawnDrifter = useCallback(() => {
    if (isLiteMode()) return;

    const category = CELESTIAL_SPACES[cycleIndexRef.current % CELESTIAL_SPACES.length];
    cycleIndexRef.current += 1;

    const vectorClass = ORBITAL_CLASSES[vectorIndexRef.current % ORBITAL_CLASSES.length];
    vectorIndexRef.current += 1;

    const uniqueId = `drifter-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    setActiveDrifters((prev) => {
      if (prev.length >= 2) return prev;
      return [...prev, { uniqueId, category, vectorClass }];
    });
  }, []);

  // Spawner loop: spawn immediately on mount, then maintain cadence.
  // Start offsets are randomized per visit so first paint varies; rotation
  // after that is round-robin (guaranteed even L/R + category coverage —
  // pure Math.random would streak and starve corners).
  useEffect(() => {
    if (isLiteMode()) return;

    cycleIndexRef.current = Math.floor(Math.random() * CELESTIAL_SPACES.length);
    vectorIndexRef.current = Math.floor(Math.random() * ORBITAL_CLASSES.length);

    // Spawn first bubble immediately
    const firstTimer = setTimeout(() => {
      spawnDrifter();
    }, 400);

    // Spawn second bubble 6 seconds later
    const secondTimer = setTimeout(() => {
      spawnDrifter();
    }, 6500);

    // Periodic spawner to replenish as they finish
    const interval = setInterval(() => {
      if (document.hidden) return;
      spawnDrifter();
    }, 9000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
      clearInterval(interval);
    };
  }, [spawnDrifter]);

  // Clean up completed drifters when CSS animation ends
  const handleDriftEnd = (uniqueId) => {
    setActiveDrifters((prev) => prev.filter((d) => d.uniqueId !== uniqueId));
  };

  // Warm the diorama PNGs during idle: only ~2 are mounted at first paint, so
  // without this later spawns pop in half-loaded. Mounted URLs are cache hits
  // (no double fetch); runs once, never blocks first paint.
  useEffect(() => {
    const preload = () => {
      CELESTIAL_SPACES.forEach(({ diorama }) => {
        const img = new Image();
        img.decoding = "async";
        img.src = bubbleImg(diorama);
      });
    };
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(preload, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className={styles.container} data-testid="drifting-property-bubbles">
      {/* ── ACTIVE DRIFTING HEAVENLY PROPERTY BODIES (MAX 2) ── */}
      {activeDrifters.map((drifter) => {
        const isHovered = hoveredId === drifter.uniqueId;
        const isConsuming = consumingId === drifter.uniqueId;
        const { category, vectorClass, uniqueId } = drifter;

        return (
          <div
            key={uniqueId}
            className={`${styles.drifterWrapper} ${vectorClass} ${isConsuming ? styles.consuming : ""}`}
            role="button"
            tabIndex={0}
            title={`${category.label} · ${category.subtitle}`}
            aria-label={`Drifting space category: ${category.label}. ${category.subtitle}. Click to explore.`}
            onClick={(e) => handleWarp(drifter, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleWarp(drifter, e.currentTarget);
              }
            }}
            onMouseEnter={() => setHoveredId(uniqueId)}
            onMouseLeave={() => setHoveredId(null)}
            onPointerEnter={() => setHoveredId(uniqueId)}
            onPointerLeave={() => setHoveredId(null)}
            onFocus={() => setHoveredId(uniqueId)}
            onBlur={() => setHoveredId(null)}
            onAnimationEnd={(e) => {
              // Ignore any child animation events completely
              if (e.target !== e.currentTarget) return;
              if (!e.animationName || !e.animationName.includes("orbitInfall")) return;

              if (!isConsuming) {
                handleDriftEnd(uniqueId);
              }
            }}
          >
            <div className={styles.bubbleBase}>
              {/* Outer Corona Halo */}
              <span className={styles.sphereCorona} />

              {/* Fresnel Optics */}
              <span className={styles.glassGleamTop} />
              <span className={styles.glassRimGlow} />
              <span className={styles.glassBottomBounce} />

              {/* Drifting Golden Cosmic Dust */}
              <InternalCosmicDust lite={lite} />

              {/* Pure 3D Architectural Diorama */}
              <div className={styles.dioramaViewport}>
                <CategoryDiorama dioramaType={category.diorama} />
              </div>

              {/* Hover Telemetry Callout Pill (pointer users) */}
              {isHovered && !isConsuming && (
                <div className={styles.telemetryPill}>
                  <span className={styles.telemetryZone}>{category.zone}</span>
                  <span className={styles.telemetryAction}>· {category.label} (Click to Enter)</span>
                </div>
              )}

              {/* Persistent mini label — hover never fires on touch, so the
                  type would otherwise be a mystery blob on mobile. Short label
                  always reads; full pill upgrades it on hover/focus. */}
              {!isHovered && !isConsuming && (
                <div className={styles.miniLabel} aria-hidden="true">
                  <span>{category.label}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* ── ACCRETION BURST FLARE (AT SINGULARITY CENTER ON CONSUME) ── */}
      {consumingId && <div className={styles.accretionBurst} />}
    </div>
  );
}
