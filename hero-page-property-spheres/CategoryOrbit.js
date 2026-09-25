"use client";

// CategoryOrbit — shell over the hero orbital rail. Owns the tier
// decision, committed index, labels, keyboard, and routing; the 3D
// railway lives in orbit/useOrbitScene, stills in orbit/LiteOrbit.

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useOrbitScene } from "./orbit/useOrbitScene";
import { LiteOrbit } from "./orbit/LiteOrbit";
import { CATEGORY_WORLDS, worldAt, worldById, routeFor } from "./orbit/categories";
import { isLiteMode } from "@/lib/liteMode";

function OrbitCanvas({ apiRef, visibleRef, initialIndex, onCommit, onSelect, debugRef }) {
  const canvasRef = useRef(null);
  useOrbitScene(canvasRef, { initialIndex, onCommit, onSelect, apiRef, visibleRef, debugRef });
  return <canvas ref={canvasRef} className="orbit-canvas" aria-hidden="true" />;
}

export default function CategoryOrbit({ counts = {} }) {
  const router = useRouter();
  const railRef = useRef(null);
  const apiRef = useRef(null);
  const visibleRef = useRef(true);
  const [index, setIndex] = useState(0);
  const [lite, setLite] = useState(true); // SSR-safe: stills until 3D proves itself
  const [devouring, setDevouring] = useState(false);
  const firedRef = useRef(false);

  const active = worldAt(index);
  const prev = worldAt(index - 1);

  // Tier decision: LiteMode, small screens, reduced motion, or no
  // WebGL all get the still-image rail.
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = typeof window !== "undefined" && window.innerWidth < 900;
    let webgl = true;
    try {
      const c = document.createElement("canvas");
      webgl = !!(
        window.WebGLRenderingContext &&
        (c.getContext("webgl2") || c.getContext("webgl"))
      );
    } catch {
      webgl = false;
    }
    setLite(isLiteMode() || small || reduced || !webgl);
  }, []);

  // Freeze rail motion while the hero is off-screen.
  useEffect(() => {
    const el = railRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      visibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const go = useCallback((dir) => {
    if (lite) {
      setIndex((i) => (i + dir + CATEGORY_WORLDS.length) % CATEGORY_WORLDS.length);
    } else {
      apiRef.current?.fling(dir > 0 ? 1 : -1);
    }
  }, [lite]);

  const devour = useCallback((id) => {
    if (firedRef.current) return;
    firedRef.current = true;
    setDevouring(true);
    const w = worldById(id) ?? active;
    setTimeout(() => router.push(routeFor(w.type)), 580);
  }, [router, active]);

  const onRailKey = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); go(-1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); apiRef.current?.nudgeSpin(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); apiRef.current?.nudgeSpin(1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); devour(active.id); }
  };

  const count = counts[active.key];
  const debugRef = useRef(null);
  const showDebug =
    typeof window !== "undefined" && window.location.search.includes("orbitdebug");

  return (
    <div
      ref={railRef}
      className={`orbit-rail${devouring ? " devouring" : ""}`}
      tabIndex={0}
      onKeyDown={onRailKey}
      role="region"
      aria-label={`Space category orbit. Showing ${active.key}${
        typeof count === "number" && count > 0 ? `, ${count} spaces` : ""
      }. Arrow keys cycle categories, Enter opens the directory.`}
    >
      <button
        type="button"
        className="orbit-prev-label"
        onClick={() => go(-1)}
        aria-label={`Back to ${prev.key} category`}
      >
        {`${String(((index - 1 + CATEGORY_WORLDS.length) % CATEGORY_WORLDS.length) + 1).padStart(2, "0")} // ${prev.key.toUpperCase()}`}
      </button>

      <div className="orbit-stage">
        {lite ? (
          <LiteOrbit
            index={index}
            onPrev={() => go(-1)}
            onNext={() => go(1)}
            onSelect={devour}
          />
        ) : (
          <>
            <OrbitCanvas
              apiRef={apiRef}
              visibleRef={visibleRef}
              initialIndex={index}
              onCommit={setIndex}
              onSelect={devour}
              debugRef={debugRef}
            />
            {showDebug && <pre ref={debugRef} className="orbit-debug" />}
          </>
        )}
      </div>

      <button type="button" className="orbit-label" onClick={() => devour(active.id)}>
        <span className="orbit-eyebrow">
          {`${String(index + 1).padStart(2, "0")} // ${active.key.toUpperCase()}`}
        </span>
        <span className="orbit-line">{active.line}</span>
        <span className="orbit-cta">
          {typeof count === "number" && count > 0 ? `${count} spaces →` : "— spaces"}
        </span>
      </button>
      <span className="orbit-hint">drag to orbit · tap to descend</span>

      <style jsx>{`
        .orbit-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          max-height: 100dvh;
          user-select: none;
          -webkit-user-select: none;
          transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.55s ease, filter 0.55s ease;
        }
        .orbit-rail:focus-visible {
          outline: 1.5px solid var(--accent-muted);
          outline-offset: 6px;
          border-radius: 8px;
        }
        .orbit-rail.devouring {
          transform: translate(38vw, -4vh) scale(0.12);
          opacity: 0;
          filter: brightness(2.2) saturate(1.4);
          pointer-events: none;
        }
        .orbit-stage {
          width: min(100%, 400px);
          height: clamp(480px, 72dvh, 700px);
          position: relative;
        }
        .orbit-canvas {
          width: 100%;
          height: 100%;
          display: block;
          touch-action: pan-y;
          cursor: grab;
        }
        .orbit-canvas:active { cursor: grabbing; }
        .orbit-prev-label {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          opacity: 0.62;
          padding: 2px 8px;
          transition: opacity var(--transition-fast), color var(--transition-fast);
        }
        .orbit-prev-label:hover { opacity: 1; color: var(--accent); }
        .orbit-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 8px;
          text-align: center;
        }
        .orbit-eyebrow {
          font-family: var(--font-mono);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
        }
        .orbit-line {
          font-family: var(--font-body);
          font-size: 13px;
          font-style: italic;
          color: var(--text-secondary);
        }
        .orbit-cta {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          opacity: 0.78;
          min-width: 11ch;
          transition: opacity var(--transition-fast), text-shadow var(--transition-fast);
        }
        .orbit-label:hover .orbit-cta {
          opacity: 1;
          text-shadow: 0 0 14px rgba(232, 174, 60, 0.5);
        }
        .orbit-hint {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          opacity: 0.5;
        }
        .orbit-debug {
          position: absolute;
          left: 0;
          bottom: 0;
          z-index: 50;
          font-family: monospace;
          font-size: 10px;
          line-height: 1.5;
          color: #7f7;
          background: rgba(0, 0, 0, 0.85);
          padding: 6px 8px;
          margin: 0;
          max-width: 100%;
          white-space: pre-wrap;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
