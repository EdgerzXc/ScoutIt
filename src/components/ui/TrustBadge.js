"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { getBadgeDetails, TRUST_BADGES } from "@/lib/BadgeEngine";

const POPOVER_WIDTH = 256; // matches w-64; used for viewport clamping
const VIEWPORT_MARGIN = 12;

/**
 * Explainable Trust Badge Component
 *
 * Displays a clean luxury badge with an interactive popover explaining why and
 * how the trust credential was granted (§5).
 *
 * Touch behaviour is deliberate. Hover is a pointer-only affordance: binding it
 * on touch means the synthetic mouseenter opens the popover and the click that
 * follows immediately toggles it shut, so it never opens on a phone. Hover is
 * therefore gated on `pointerType === "mouse"` and tap goes through the click
 * path alone.
 *
 * Position is computed as `fixed` from the trigger's rect and clamped to the
 * viewport, because an `absolute left-1/2` popover 256px wide is clipped by any
 * badge sitting near a screen edge — which is exactly where the broker roster
 * puts them at 390px.
 */
export default function TrustBadge({
  badgeId,
  verifiedDate = "Recently Verified",
  className = "",
}) {
  const [showPopover, setShowPopover] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const popoverId = useId();
  const badge = getBadgeDetails(badgeId) || TRUST_BADGES[badgeId];

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
    const ideal = r.left + r.width / 2 - width / 2;
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.round(
      Math.min(Math.max(ideal, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxLeft))
    );
    setCoords({
      left,
      bottom: Math.round(window.innerHeight - r.top + 8),
      width: Math.round(width),
      // Percentage of the popover's own width that sits under the trigger, so
      // it scales up FROM the badge rather than from its own centre. Once the
      // popover is clamped to a viewport edge those two stop coinciding.
      originX: Math.round(
        Math.min(Math.max(((r.left + r.width / 2 - left) / width) * 100, 0), 100)
      ),
    });
  }, []);

  const open = useCallback(() => {
    place();
    setShowPopover(true);
  }, [place]);

  const close = useCallback(() => setShowPopover(false), []);

  useEffect(() => {
    if (!showPopover) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e) => {
      if (!triggerRef.current?.contains(e.target)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, { passive: true, capture: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close, { capture: true });
      window.removeEventListener("resize", close);
    };
  }, [showPopover, close]);

  if (!badge) return null;

  return (
    <span className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={showPopover}
        aria-controls={showPopover ? popoverId : undefined}
        aria-label={`${badge.name}: ${badge.description}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showPopover ? close() : open();
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") open();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") close();
        }}
        onFocus={open}
        onBlur={close}
        /* No touch-size override here on purpose. globals.css already gives
           every button min-height/min-width 48px under
           `(hover: none) and (pointer: coarse)`, so the tap target is met
           site-wide; adding padding here only double-pays it. */
        className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/10 hover:bg-gold-accent/20 transition-colors font-mono text-[12px] uppercase tracking-wider text-gold-accent cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-accent"
      >
        <span className="text-[12px] leading-none">{badge.icon || "🛡️"}</span>
        <span className="font-semibold">{badge.name}</span>
      </button>

      {showPopover && coords && (
        <span
          id={popoverId}
          role="tooltip"
          style={{
            left: coords.left,
            bottom: coords.bottom,
            width: coords.width,
            transformOrigin: `${coords.originX}% bottom`,
          }}
          className="fixed block p-3 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl z-50 text-left pointer-events-none motion-safe:animate-[badgePopIn_150ms_cubic-bezier(0.23,1,0.32,1)]"
        >
          <span className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/[0.08]">
            <span className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-widest text-gold-accent font-bold">
              <span>{badge.icon || "🛡️"}</span>
              <span>{badge.name}</span>
            </span>
            <span className="font-mono text-[12px] text-muted uppercase tracking-wider shrink-0">
              {verifiedDate}
            </span>
          </span>
          <span className="block font-sans text-[12px] text-text-secondary leading-relaxed mb-2">
            {badge.description}
          </span>
          <span className="block bg-black/30 p-1.5 rounded border border-white/[0.04]">
            <span className="block font-mono text-[12px] uppercase tracking-widest text-muted mb-0.5">
              Verification Proof
            </span>
            <span className="block font-sans text-[12px] text-text-primary leading-tight">
              {badge.criteria}
            </span>
          </span>
        </span>
      )}
    </span>
  );
}
