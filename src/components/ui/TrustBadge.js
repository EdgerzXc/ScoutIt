"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
 * Rendered via document.body portal to escape ancestor CSS transforms and
 * backdrop filters. Position is computed as `fixed` from the trigger's rect and
 * clamped to the viewport.
 */
export default function TrustBadge({
  badgeId,
  verifiedDate = null,
  className = "",
}) {
  const [showPopover, setShowPopover] = useState(false);
  const [coords, setCoords] = useState(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const hideTimerRef = useRef(null);
  const isPinnedRef = useRef(false);
  const popoverId = useId();
  const badge = getBadgeDetails(badgeId) || TRUST_BADGES[badgeId];

  useEffect(() => {
    setMounted(true);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

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
    const placeBelow = r.top < 160;

    setCoords({
      left,
      top: placeBelow ? Math.round(r.bottom + 8) : undefined,
      bottom: !placeBelow ? Math.round(window.innerHeight - r.top + 8) : undefined,
      width: Math.round(width),
      // Percentage of the popover's own width that sits under the trigger, so
      // it scales up FROM the badge rather than from its own centre. Once the
      // popover is clamped to a viewport edge those two stop coinciding.
      originX: Math.round(
        Math.min(Math.max(((r.left + r.width / 2 - left) / width) * 100, 0), 100)
      ),
    });
  }, []);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 180);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const open = useCallback(() => {
    cancelHide();
    place();
    setShowPopover(true);
  }, [cancelHide, place]);

  const close = useCallback(() => {
    cancelHide();
    isPinnedRef.current = false;
    setShowPopover(false);
  }, [cancelHide]);

  useEffect(() => {
    if (!showPopover) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !popoverRef.current?.contains(e.target)
      ) {
        close();
      }
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

  const popoverContent = showPopover && coords ? (
    <span
      ref={popoverRef}
      id={popoverId}
      role="tooltip"
      style={{
        left: coords.left,
        top: coords.top != null ? coords.top : undefined,
        bottom: coords.bottom != null ? coords.bottom : undefined,
        width: coords.width,
        transformOrigin: `${coords.originX}% ${coords.top != null ? "top" : "bottom"}`,
        zIndex: 99999,
      }}
      className="fixed block p-3 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-lg shadow-2xl text-left pointer-events-auto motion-safe:animate-[badgePopIn_150ms_cubic-bezier(0.23,1,0.32,1)] trust-lens"
      onPointerEnter={cancelHide}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse" && !isPinnedRef.current) {
          scheduleHide();
        }
      }}
    >
      <span className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-white/[0.08]">
        <span className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-widest text-gold-accent font-bold">
          <span>{badge.icon || "🛡️"}</span>
          <span>{badge.name}</span>
        </span>
        {verifiedDate ? (
          <span className="font-mono text-[12px] text-muted uppercase tracking-wider shrink-0">
            {verifiedDate}
          </span>
        ) : null}
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
  ) : null;

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
          if (isPinnedRef.current) {
            close();
          } else {
            isPinnedRef.current = true;
            open();
          }
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") open();
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse" && !isPinnedRef.current) {
            scheduleHide();
          }
        }}
        onFocus={open}
        onBlur={() => {
          if (!isPinnedRef.current) close();
        }}
        className="relative inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/10 hover:bg-gold-accent/20 transition-colors font-mono text-[12px] uppercase tracking-wider text-gold-accent cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-accent"
      >
        <span className="text-[12px] leading-none">{badge.icon || "🛡️"}</span>
        <span className="font-semibold">{badge.name}</span>
      </button>

      {mounted && typeof document !== "undefined" && popoverContent
        ? createPortal(popoverContent, document.body)
        : null}
    </span>
  );
}
