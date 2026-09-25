"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { getInfoTip } from "@/lib/infoTips";

const POPOVER_WIDTH = 264;
const VIEWPORT_MARGIN = 12;

// ─────────────────────────────────────────────────────────────────────────
// INFO TIP (A-160) — the "?" mark.
//
// Same proven mechanics as TrustBadge's popover: hover opens for mice only
// (touch synthesis would toggle it straight back shut), tap toggles, Escape /
// outside-tap / scroll / resize closes, and the fixed panel is clamped to the
// viewport so an edge-placed "?" never bleeds off a 390px phone. Content comes
// from the infoTips registry — this component renders, never authors, copy.
//
// Tightened and solidified:
// - Single discrete glyph inside an accessible 44px tap target (negative margins
//   prevent inline line-height distortion).
// - Smart vertical flipping: if trigger sits within 150px of viewport top,
//   places popover below the trigger so it never clips off the top screen edge.
// - High-contrast accessible focus ring, press feedback (:active), and reduced-motion.
// ─────────────────────────────────────────────────────────────────────────
export default function InfoTip({ tipId, label = "More information", className = "" }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popoverId = useId();
  const tip = getInfoTip(tipId);

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const ideal = r.left + r.width / 2 - width / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.round(Math.min(Math.max(ideal, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxLeft)));
    
    // Vertical placement: place below if trigger is near viewport top, otherwise place above
    const placeBelow = r.top < 150;

    setCoords({
      left,
      top: placeBelow ? Math.round(r.bottom + 8) : undefined,
      bottom: !placeBelow ? Math.round(window.innerHeight - r.top + 8) : undefined,
      width: Math.round(width),
    });
  }, []);

  const show = useCallback(() => {
    place();
    setOpen(true);
  }, [place]);

  const hide = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") hide();
    };
    const onDown = (e) => {
      if (!triggerRef.current?.contains(e.target)) hide();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", hide, { passive: true, capture: true });
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", hide, { capture: true });
      window.removeEventListener("resize", hide);
    };
  }, [open, hide]);

  if (!tip) return null;

  return (
    <span className={`infotip-wrap ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="infotip-btn"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`${label}: ${tip.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) hide();
          else show();
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") show();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") hide();
        }}
        onFocus={show}
        onBlur={hide}
      >
        <span className="infotip-glyph" aria-hidden="true">?</span>
      </button>

      {open && coords && (
        <span
          id={popoverId}
          role="tooltip"
          className="infotip-pop"
          style={{
            left: coords.left,
            top: coords.top != null ? coords.top : undefined,
            bottom: coords.bottom != null ? coords.bottom : undefined,
            width: coords.width,
          }}
        >
          <span className="infotip-title">{tip.title}</span>
          <span className="infotip-body">{tip.body}</span>
        </span>
      )}

      <style jsx>{`
        .infotip-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
          margin: 0 3px;
        }
        .infotip-btn {
          min-width: 44px;
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: -13px -13px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-family: var(--font-mono);
          cursor: pointer;
          transition: color var(--transition-fast);
        }
        .infotip-glyph {
          width: 18px;
          height: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-solid);
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          line-height: 1;
          color: inherit;
          transition: color var(--transition-fast), border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
        }
        .infotip-btn[aria-expanded="true"] .infotip-glyph {
          color: var(--accent-bright);
          border-color: var(--accent);
          background: rgba(var(--accent-rgb), 0.12);
        }
        .infotip-btn:focus-visible {
          outline: none;
        }
        .infotip-btn:focus-visible .infotip-glyph {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
          border-color: var(--accent);
          color: var(--accent-bright);
        }
        .infotip-btn:active .infotip-glyph {
          transform: scale(0.92);
          border-color: var(--accent);
          color: var(--accent-bright);
        }
        .infotip-pop {
          position: fixed;
          display: block;
          z-index: 2500;
          padding: 13px 15px;
          background: rgba(18, 18, 18, 0.96);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid var(--accent-muted);
          border-radius: 4px;
          box-shadow: 0 14px 34px rgba(0, 0, 0, 0.65), 0 0 1px rgba(var(--accent-rgb), 0.3);
          text-align: left;
          pointer-events: none;
          animation: infotip-in 160ms var(--ease-out-custom);
        }
        .infotip-title {
          display: block;
          margin-bottom: 5px;
          color: var(--accent-bright);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .infotip-body {
          display: block;
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.55;
        }
        @keyframes infotip-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (hover: hover) and (pointer: fine) {
          .infotip-btn:hover .infotip-glyph {
            color: var(--accent-bright);
            border-color: var(--accent-muted);
            background: rgba(var(--accent-rgb), 0.08);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .infotip-pop {
            animation: none;
          }
          .infotip-glyph {
            transition: none;
          }
        }
      `}</style>
    </span>
  );
}
