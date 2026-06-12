"use client";

/**
 * DescentSequence — Stage 1 of the ScoutIt scrollytelling manifesto.
 *
 * For now this only handles the "lights dimming" descent: when the UFO is
 * clicked, the homepage stays visible underneath but a near-black veil fades
 * in over it, the page locks in place, and a quiet hint appears. ESC (or the
 * hint's exit affordance) fades everything back out.
 *
 * Later stages add: the molten-gold crack reveal (reference/golden liquid.jpeg),
 * the six mission nodes, and the finale → /about. This file is intentionally
 * self-contained and lazy-loaded so it has zero cost until activation.
 */

import { useEffect, useState, useCallback } from "react";

export default function DescentSequence({ onExit }) {
  // `entered` flips on right after mount so the veil/hint can transition in
  // from 0 → full instead of appearing instantly.
  const [entered, setEntered] = useState(false);
  // `leaving` plays the reverse fade before we tell the parent to unmount us.
  const [leaving, setLeaving] = useState(false);

  const beginExit = useCallback(() => {
    setLeaving(true);
    // Match the 700ms CSS transition before unmounting.
    setTimeout(() => onExit?.(), 700);
  }, [onExit]);

  // Fade in on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // ESC exits from any point in the sequence.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") beginExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [beginExit]);

  const visible = entered && !leaving;

  return (
    <div
      className="descent-root"
      data-visible={visible ? "true" : "false"}
      role="dialog"
      aria-label="ScoutIt descent"
    >
      {/* The near-black veil that dims the homepage without hiding it. */}
      <div className="descent-veil" />

      {/* A radial vignette so the edges fall away faster than the centre — the
          eye is drawn inward, which is where the gold will later appear. */}
      <div className="descent-vignette" />

      {/* Quiet guidance. Restrained, letterspaced, gold-tinted. */}
      <div className="descent-hint">
        <span className="descent-hint-line">SCROLL TO DESCEND</span>
        <button className="descent-exit" onClick={beginExit} type="button">
          ESC TO EXIT
        </button>
      </div>

      <style>{`
        .descent-root {
          position: fixed;
          inset: 0;
          z-index: 9000;            /* above page content, below the film grain (9999) */
          pointer-events: none;     /* let the dimmed homepage stay non-interactive but visible */
        }

        .descent-veil {
          position: absolute;
          inset: 0;
          background: #000;
          opacity: 0;
          transition: opacity 1.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .descent-root[data-visible="true"] .descent-veil {
          opacity: 0.92;            /* 95% darkness rule — homepage still faintly readable */
        }

        .descent-vignette {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 1.6s cubic-bezier(0.4, 0, 0.2, 1);
          background: radial-gradient(
            ellipse 60% 60% at 50% 50%,
            rgba(0,0,0,0) 0%,
            rgba(0,0,0,0.55) 70%,
            rgba(0,0,0,0.85) 100%
          );
        }
        .descent-root[data-visible="true"] .descent-vignette {
          opacity: 1;
        }

        .descent-hint {
          position: absolute;
          left: 50%;
          bottom: 8vh;
          transform: translateX(-50%) translateY(10px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          opacity: 0;
          transition: opacity 1s ease 0.8s, transform 1s ease 0.8s;
          pointer-events: auto;     /* the exit button must be clickable */
        }
        .descent-root[data-visible="true"] .descent-hint {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }

        .descent-hint-line {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.42em;
          color: rgba(200, 169, 110, 0.78);
          text-indent: 0.42em;       /* balance the trailing letter-spacing */
          animation: descentPulse 3.2s ease-in-out infinite;
        }

        .descent-exit {
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          letter-spacing: 0.34em;
          text-indent: 0.34em;
          color: rgba(240, 237, 232, 0.34);
          padding: 6px 10px;
          transition: color 0.3s ease;
        }
        .descent-exit:hover {
          color: rgba(240, 237, 232, 0.7);
        }

        @keyframes descentPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .descent-veil,
          .descent-vignette,
          .descent-hint { transition-duration: 0.2s; }
          .descent-hint-line { animation: none; opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
