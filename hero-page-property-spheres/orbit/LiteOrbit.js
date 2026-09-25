"use client";

// Lite tier of the orbital rail: the same prev / active / peek
// composition as still images — transform + opacity only, no WebGL.

import { useEffect, useRef, useState } from "react";
import { CATEGORY_WORLDS, COUNT, worldAt, fallbackUrl } from "./categories";

const AUTO_MS = 12000;

export function LiteOrbit({ index, onPrev, onNext, onSelect }) {
  const prev = worldAt(index - 1);
  const active = worldAt(index);
  const next = worldAt(index + 1);
  const [nudge, setNudge] = useState(false);
  const nudges = useRef(0);
  const interacted = useRef(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (reduced) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      onNext();
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [reduced, onNext]);

  // One-time discovery nudge: the peek still breathes upward once.
  useEffect(() => {
    if (reduced) return;
    const t = setTimeout(() => {
      if (!interacted.current && nudges.current < 2) {
        nudges.current += 1;
        setNudge(true);
        setTimeout(() => setNudge(false), 950);
      }
    }, 4000);
    return () => clearTimeout(t);
  }, [reduced, index]);

  const touch = () => {
    interacted.current = true;
  };

  return (
    <div className="lite-stack" onPointerDown={touch}>
      <button type="button" className="lite-prev" onClick={onPrev} aria-label={`Show ${prev.key} planet`}>
        <img src={fallbackUrl(prev.slug)} alt="" draggable={false} />
      </button>
      <button
        type="button"
        className="lite-active"
        onClick={() => onSelect(active.id)}
        aria-label={`${active.key} spaces — open directory`}
      >
        <img key={active.id} src={fallbackUrl(active.slug)} alt={`${active.key} planet`} draggable={false} />
      </button>
      <button
        type="button"
        className={`lite-peek${nudge ? " nudging" : ""}`}
        onClick={onNext}
        aria-label={`Show ${next.key} planet — more categories below`}
      >
        <img src={fallbackUrl(next.slug)} alt="" draggable={false} />
      </button>

      <style jsx>{`
        .lite-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 100%;
          height: 100%;
          justify-content: center;
        }
        .lite-prev {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          opacity: 0.8;
          transition: opacity var(--transition-fast), transform var(--transition-fast);
        }
        .lite-prev:hover { opacity: 1; transform: translateY(-2px); }
        .lite-prev img {
          width: 200px;
          height: 200px;
          object-fit: contain;
          display: block;
        }
        .lite-active {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .lite-active img {
          width: min(300px, 100%);
          height: min(300px, 100%);
          object-fit: contain;
          display: block;
          animation: liteFade 0.9s ease;
          filter: drop-shadow(0 0 26px rgba(232, 174, 60, 0.18));
        }
        @keyframes liteFade {
          from { opacity: 0; transform: scale(0.94); }
          to { opacity: 1; transform: scale(1); }
        }
        .lite-peek {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          height: 100px;
          overflow: hidden;
          opacity: 0.65;
          transition: opacity var(--transition-fast);
        }
        .lite-peek:hover { opacity: 0.9; }
        .lite-peek img {
          width: 210px;
          height: 320px;
          object-fit: contain;
          object-position: top;
          display: block;
        }
        .lite-peek.nudging { animation: liteNudge 0.95s ease; }
        @keyframes liteNudge {
          0%, 100% { transform: translateY(0); }
          45% { transform: translateY(-11px); }
        }
      `}</style>
    </div>
  );
}

export { COUNT };
