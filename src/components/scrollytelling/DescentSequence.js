"use client";

/**
 * DescentSequence — ScoutIt scrollytelling manifesto.
 *
 * Stage 1: UFO click → near-black veil fades over the still-visible homepage.
 * Stage 2 (this file): the descent is now driven by a single `progress` value
 * (0 → 1) accumulated from wheel/touch. Everything visual is a pure function of
 * that one number, which is what makes reverse-scrubbing free and glitch-proof.
 *
 * At this stage `progress` reveals the user's molten-gold ribbon
 * (public/scrollytelling/golden-liquid.jpeg) growing along its diagonal —
 * teardrop (bottom-left) → tip (top-right) — with a travelling glow at the
 * leading edge. Mission nodes and the finale → /about arrive in later stages.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const GOLD_SRC = "/scrollytelling/golden-liquid.jpeg";
// How much wheel travel completes the whole descent (higher = slower/longer).
const SCROLL_DISTANCE = 2600;

export default function DescentSequence({ onExit }) {
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

  // Mutable mirror of progress so wheel handlers read the latest without
  // re-binding listeners on every frame.
  const progressRef = useRef(0);
  const touchY = useRef(null);

  const beginExit = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onExit?.(), 700);
  }, [onExit]);

  const applyDelta = useCallback(
    (deltaY) => {
      const prev = progressRef.current;
      const next = Math.min(1, Math.max(0, prev + deltaY / SCROLL_DISTANCE));
      // Scrolling back up past the very start exits the sequence.
      if (prev <= 0.0001 && deltaY < 0) {
        beginExit();
        return;
      }
      progressRef.current = next;
      setProgress(next);
    },
    [beginExit]
  );

  // Fade in on mount.
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Wheel + touch drive progress; ESC exits.
  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      applyDelta(e.deltaY);
    };
    const onTouchStart = (e) => {
      touchY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e) => {
      if (touchY.current == null) return;
      const y = e.touches[0]?.clientY ?? touchY.current;
      const dy = touchY.current - y; // swipe up = positive = descend
      touchY.current = y;
      e.preventDefault();
      applyDelta(dy * 2.2);
    };
    const onKey = (e) => {
      if (e.key === "Escape") beginExit();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [applyDelta, beginExit]);

  const visible = entered && !leaving;

  // ── Derived visuals (pure functions of progress) ──────────────────
  // Veil deepens quickly in the first 12% so the world goes dark before the
  // gold appears.
  const veilOpacity = Math.min(0.92, (progress / 0.12) * 0.92);

  // The reveal edge sweeps along the diagonal as progress grows. We soften it
  // with a trailing band so the gold "flows" in rather than wipes in.
  const edge = progress * 118 - 9; // -9 → 109 (%) so it fully clears at p=1
  const maskStop = `${edge.toFixed(1)}%`;
  const maskStopSoft = `${(edge + 16).toFixed(1)}%`;

  // Travelling glow: rides the diagonal from teardrop (≈18%,72%) to tip
  // (≈84%,20%) of the stage.
  const glowX = 18 + progress * 66;
  const glowY = 72 - progress * 52;

  const hintGone = progress > 0.04;

  return (
    <div
      className="descent-root"
      data-visible={visible ? "true" : "false"}
      role="dialog"
      aria-label="ScoutIt descent"
    >
      <div className="descent-veil" style={{ opacity: visible ? veilOpacity : 0 }} />
      <div className="descent-vignette" />

      {/* The molten-gold ribbon, revealed along its diagonal by `progress`. */}
      <div className="descent-gold-stage" data-on={progress > 0.001 ? "true" : "false"}>
        <div
          className="descent-gold"
          style={{
            WebkitMaskImage: `linear-gradient(to top right, #000 ${maskStop}, transparent ${maskStopSoft})`,
            maskImage: `linear-gradient(to top right, #000 ${maskStop}, transparent ${maskStopSoft})`,
          }}
        >
          <img src={GOLD_SRC} alt="" draggable="false" />
          {/* Cover the AI sparkle watermark in the bottom-right corner. */}
          <span className="descent-gold-watermark-mask" />
        </div>

        {/* Leading-edge glow that rides the reveal. */}
        <div
          className="descent-glow"
          style={{
            left: `${glowX}%`,
            top: `${glowY}%`,
            opacity: progress > 0.02 && progress < 0.99 ? 1 : 0,
          }}
        />
      </div>

      {/* Quiet guidance — fades out once the descent is underway. */}
      <div className="descent-hint" data-gone={hintGone ? "true" : "false"}>
        <span className="descent-hint-line">SCROLL TO DESCEND</span>
        <button className="descent-exit" onClick={beginExit} type="button">
          ESC TO EXIT
        </button>
      </div>

      <style>{`
        .descent-root {
          position: fixed;
          inset: 0;
          z-index: 9000;
          pointer-events: none;
        }

        .descent-veil {
          position: absolute;
          inset: 0;
          background: #000;
          transition: opacity 0.25s linear;
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
        .descent-root[data-visible="true"] .descent-vignette { opacity: 1; }

        .descent-gold-stage {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .descent-gold-stage[data-on="true"] { opacity: 1; }

        .descent-gold {
          position: relative;
          width: 92vw;
          max-width: 1200px;
        }
        .descent-gold img {
          display: block;
          width: 100%;
          height: auto;
          /* The source is gold-on-black; screen blend drops its black bg so it
             sits seamlessly on the veil and only the gold glows through. */
          mix-blend-mode: screen;
          filter: saturate(1.05) brightness(1.04);
        }
        .descent-gold-watermark-mask {
          position: absolute;
          right: 0;
          bottom: 0;
          width: 9%;
          height: 16%;
          background: radial-gradient(ellipse at bottom right, #000 55%, rgba(0,0,0,0) 100%);
        }

        .descent-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          transition: opacity 0.4s ease;
          background: radial-gradient(
            circle,
            rgba(255, 232, 170, 0.55) 0%,
            rgba(200, 169, 110, 0.28) 32%,
            rgba(200, 169, 110, 0) 70%
          );
          mix-blend-mode: screen;
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
          pointer-events: auto;
        }
        .descent-root[data-visible="true"] .descent-hint {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
        .descent-hint[data-gone="true"] {
          opacity: 0 !important;
          transition: opacity 0.5s ease;
          pointer-events: none;
        }

        .descent-hint-line {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          letter-spacing: 0.42em;
          color: rgba(200, 169, 110, 0.78);
          text-indent: 0.42em;
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
        .descent-exit:hover { color: rgba(240, 237, 232, 0.7); }

        @keyframes descentPulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .descent-vignette, .descent-hint { transition-duration: 0.2s; }
          .descent-hint-line { animation: none; opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}
