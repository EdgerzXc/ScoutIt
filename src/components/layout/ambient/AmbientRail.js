"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAmbientData } from "./ambientData";

const FADE_MS = 240;
const HOVER_RESUME_MS = 1800;
const MANUAL_RESUME_MS = 8000;

export default function AmbientRail({ user, context = null }) {
  const items = useAmbientData(user, context);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [resumePending, setResumePending] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const autoTimer = useRef(null);
  const transitionTimer = useRef(null);
  const resumeTimer = useRef(null);
  const manuallyNavigated = useRef(false);
  const touchStart = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => { if (activeIndex >= items.length) setActiveIndex(0); }, [activeIndex, items.length]);
  useEffect(() => () => {
    window.clearTimeout(autoTimer.current);
    window.clearTimeout(transitionTimer.current);
    window.clearTimeout(resumeTimer.current);
  }, []);

  const changeState = useCallback((targetIndex, manual = false) => {
    if (items.length <= 1 || targetIndex === activeIndex || transitioning) return;
    if (manual) {
      manuallyNavigated.current = true;
      setAnnouncement(items[targetIndex]?.text || "");
    }
    setTransitioning(true);
    transitionTimer.current = window.setTimeout(() => {
      setActiveIndex(targetIndex);
      setTransitioning(false);
    }, reducedMotion ? 0 : FADE_MS);
  }, [activeIndex, items, reducedMotion, transitioning]);

  const next = useCallback((manual = false) => {
    changeState((activeIndex + 1) % items.length, manual);
  }, [activeIndex, changeState, items.length]);

  const previous = useCallback((manual = false) => {
    changeState((activeIndex - 1 + items.length) % items.length, manual);
  }, [activeIndex, changeState, items.length]);

  const paused = hovered || focused || resumePending || !pageVisible;
  useEffect(() => {
    window.clearTimeout(autoTimer.current);
    if (items.length <= 1 || paused || transitioning) return undefined;
    autoTimer.current = window.setTimeout(() => next(false), items[activeIndex]?.duration || 5000);
    return () => window.clearTimeout(autoTimer.current);
  }, [activeIndex, items, next, paused, transitioning]);

  const scheduleResume = () => {
    window.clearTimeout(resumeTimer.current);
    setResumePending(true);
    const delay = manuallyNavigated.current ? MANUAL_RESUME_MS : HOVER_RESUME_MS;
    manuallyNavigated.current = false;
    resumeTimer.current = window.setTimeout(() => setResumePending(false), delay);
  };

  const currentItem = items[activeIndex] || null;
  const progress = items.length > 1 ? activeIndex / (items.length - 1) : 0.5;

  return (
    <div
      className={`ambient-rail ${paused ? "is-paused" : ""}`}
      role="group"
      aria-label={context?.source === "property" ? `Property conditions for ${context.shortName}` : "Local ambient information"}
      onMouseEnter={() => { window.clearTimeout(resumeTimer.current); setResumePending(false); setHovered(true); }}
      onMouseLeave={() => { setHovered(false); scheduleResume(); }}
      onFocusCapture={() => { window.clearTimeout(resumeTimer.current); setResumePending(false); setFocused(true); }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          scheduleResume();
        }
      }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const end = event.changedTouches[0]?.clientX;
        if (touchStart.current == null || end == null || Math.abs(end - touchStart.current) < 36) return;
        if (end < touchStart.current) next(true); else previous(true);
      }}
    >
      <div className="ambient-content">
        <button type="button" className="ambient-nav" onClick={() => previous(true)} aria-label="Previous ambient information" aria-controls="ambient-rail-status" disabled={items.length <= 1}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m9.75 3.5-4 4.5 4 4.5" /></svg>
        </button>
        <div id="ambient-rail-status" className="ambient-viewport" aria-hidden="true">
          {currentItem && (
            <span key={currentItem.id} className={`ambient-copy ${transitioning ? "is-leaving" : ""}`}>
              <span className="ambient-copy-desktop">
                {(currentItem.segments || []).map((segment, index) => (
                  <span key={`${segment.text}-${index}`} className={`ambient-token ambient-token-${segment.tone}`}>{segment.text}</span>
                ))}
              </span>
              <span className="ambient-copy-mobile">
                {(currentItem.mobileSegments || currentItem.segments || []).map((segment, index) => (
                  <span key={`${segment.text}-${index}`} className={`ambient-token ambient-token-${segment.tone}`}>{segment.text}</span>
                ))}
              </span>
            </span>
          )}
        </div>
        <button type="button" className="ambient-nav" onClick={() => next(true)} aria-label="Next ambient information" aria-controls="ambient-rail-status" disabled={items.length <= 1}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6.25 3.5 4 4.5-4 4.5" /></svg>
        </button>
      </div>
      <div className="ambient-track" aria-hidden="true" style={{ "--ambient-progress": progress }}>
        <span className="ambient-segment" />
      </div>
      <span className="ambient-sr-status" aria-live="polite" aria-atomic="true">{announcement}</span>

      <style jsx>{`
        .ambient-rail {
          position: relative;
          width: 100%;
          max-width: 392px;
          min-width: 0;
          min-height: 44px;
          padding: 4px 10px 5px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 999px;
          border: 1px solid rgba(var(--accent-rgb), .16);
          background: linear-gradient(180deg, rgba(255,255,255,.04), transparent 52%), rgba(6,6,6,.45);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.05), inset 0 -1px 0 rgba(var(--accent-rgb), .04), 0 8px 32px rgba(0,0,0,.22);
          user-select: none;
          isolation: isolate;
        }
        .ambient-rail::before {
          content: "";
          position: absolute;
          inset: 2px;
          z-index: -1;
          border-radius: inherit;
          border: 1px solid rgba(var(--accent-rgb), .05);
          pointer-events: none;
        }
        .ambient-content {
          width: 100%;
          display: grid;
          grid-template-columns: 24px minmax(0, 1fr) 24px;
          align-items: center;
          justify-items: center;
        }
        .ambient-viewport {
          position: relative;
          width: 100%;
          min-width: 0;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 0;
        }
        .ambient-viewport::before,
        .ambient-viewport::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 10px;
          height: 1px;
          opacity: .34;
          pointer-events: none;
        }
        .ambient-viewport::before { left: 0; background: linear-gradient(90deg, rgba(var(--accent-rgb), .58), transparent); }
        .ambient-viewport::after { right: 0; background: linear-gradient(270deg, rgba(var(--accent-rgb), .58), transparent); }
        .ambient-copy {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 4px;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .09em;
          line-height: 1.3;
          color: var(--text-secondary);
          text-shadow: none;
          animation: ambientReveal 260ms cubic-bezier(.23,1,.32,1) both;
          transition: opacity ${FADE_MS}ms cubic-bezier(.23,1,.32,1), transform ${FADE_MS}ms cubic-bezier(.23,1,.32,1);
        }
        .ambient-copy.is-leaving { opacity: 0; transform: translate3d(0,-3px,0); }
        .ambient-copy-desktop { display: inline-flex; }
        .ambient-copy-mobile { display: none; }
        .ambient-copy-desktop,
        .ambient-copy-mobile { align-items: center; justify-content: center; min-width: 0; }
        .ambient-token { display: inline-flex; align-items: center; min-width: 0; transition: color 160ms ease, text-shadow 160ms ease; }
        .ambient-token + .ambient-token::before {
          content: "\\00B7";
          flex: 0 0 auto;
          margin: 0 .48em;
          color: rgba(var(--accent-rgb),.42);
        }
        .ambient-token-context { color: var(--text-primary); }
        .ambient-token-label { color: var(--text-secondary); font-weight: 600; }
        .ambient-token-detail { color: var(--text-muted); font-weight: 600; }
        .ambient-token-value { color: var(--accent-bright); text-shadow: 0 0 10px rgba(var(--accent-rgb),.24); }
        .ambient-nav {
          width: 24px;
          height: 24px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--accent);
          cursor: pointer;
          opacity: 0.65;
          transition: opacity 180ms cubic-bezier(.23,1,.32,1), color 160ms cubic-bezier(.23,1,.32,1), background 160ms cubic-bezier(.23,1,.32,1), transform 140ms cubic-bezier(.23,1,.32,1);
        }
        .ambient-nav svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .ambient-rail:hover .ambient-nav,
        .ambient-rail:focus-within .ambient-nav,
        .ambient-nav:focus-visible { opacity: .85; }
        .ambient-nav:hover,
        .ambient-nav:focus-visible { color: var(--accent-bright); background: rgba(var(--accent-rgb),.1); opacity: 1; }
        .ambient-nav:active { transform: scale(.92); }
        .ambient-nav:focus-visible { outline: 1px solid var(--accent-bright); outline-offset: 1px; }
        .ambient-nav:disabled { cursor: default; opacity: 0 !important; }
        .ambient-track {
          --ambient-travel: 132px;
          position: relative;
          width: 164px;
          height: 3px;
          margin-top: 3px;
          overflow: hidden;
        }
        .ambient-track::before {
          content: "";
          position: absolute;
          top: 1px;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb),.22) 16%, rgba(var(--accent-rgb),.44) 50%, rgba(var(--accent-rgb),.22) 84%, transparent);
        }
        .ambient-segment {
          position: absolute;
          top: 0;
          left: 0;
          width: 36px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(var(--accent-rgb),.22), var(--accent-bright), rgba(var(--accent-rgb),.22));
          box-shadow: 0 0 10px rgba(var(--accent-rgb),.52), 0 0 20px rgba(var(--accent-rgb),.18);
          transform: translate3d(calc(var(--ambient-progress) * var(--ambient-travel)),0,0);
          transition: transform 260ms cubic-bezier(.32,.72,0,1);
        }
        .ambient-rail:hover .ambient-token-value,
        .ambient-rail:focus-within .ambient-token-value { color: var(--accent-bright); text-shadow: 0 0 12px rgba(var(--accent-rgb),.38); }
        .ambient-rail:hover .ambient-token-context { color: var(--text-primary); }
        .ambient-sr-status { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        @keyframes ambientReveal {
          from { opacity: 0; transform: translate3d(0,3px,0); }
          to { opacity: 1; transform: translate3d(0,0,0); }
        }
        @media (max-width: 768px) {
          .ambient-rail {
            min-height: 40px;
            padding: 3px 8px 4px;
          }
          .ambient-content {
            grid-template-columns: 20px minmax(0,1fr) 20px;
          }
          .ambient-nav {
            width: 20px;
            height: 20px;
          }
          .ambient-nav svg { width: 10px; height: 10px; }
          .ambient-copy {
            font-size: 11.5px;
            letter-spacing: .075em;
          }
          .ambient-track { --ambient-travel: 76px; width: 100px; }
          .ambient-segment { width: 28px; }
        }
        @media (max-width: 560px) {
          .ambient-rail {
            min-height: 36px;
            box-sizing: border-box;
            padding: 0 4px 2px;
          }
          .ambient-copy-desktop { display: none; }
          .ambient-copy-mobile { display: inline-flex; }

          /* The header collapses this row by animating a grid track to 0fr.
             That only works if the grid item can actually reach zero, and the
             min-height above stops it dead: the row measured 89px collapsed
             and 89px open until this was added. The grid track holds the open
             height, so releasing the min-height costs nothing at rest. */
          :global(.global-header) .ambient-rail {
            min-height: 0;
            overflow: hidden;
          }

          /* The arrows go, and the text takes the whole line.
             ──────────────────────────────────────────────────────────────
             Two 32px buttons plus their grid gutters were spending ~70px of a
             ~300px line on controls, on the one screen size with no room to
             spare. They are not lost, only made implicit: this rail already
             advances on its own timer, and the swipe handler above (36px
             threshold, calls next/previous) is the manual control on touch.
             So §1.5's requirement that manual previous/next stay deterministic
             still holds — a thumb swipes here rather than hunting a 32px
             target. Desktop keeps the visible arrows, where there is room and
             no swipe. */
          .ambient-content {
            grid-template-columns: minmax(0,1fr);
          }
          .ambient-nav { display: none; }
          .ambient-copy {
            font-size: 11px;
            letter-spacing: .06em;
          }
        }

        /* The smallest phones still could not fit a whole message inline:
           "LOCAL TIME 1:01 AM" wanted 124px and had 102px at 320px. Tracking
           is the cheapest thing to give back — at this size the wide letter
           spacing is costing legibility more than it adds, and the label keeps
           its meaning where dropping it would have left a bare "1:01 AM". */
        @media (max-width: 380px) {
          .ambient-copy {
            font-size: 10px;
            letter-spacing: .01em;
          }
          .ambient-rail {
            padding: 0 2px 2px;
          }
          /* The timer becomes a full-width hairline on the header's bottom edge.
             ──────────────────────────────────────────────────────────────
             It used to be a 64px stub tucked under the text, which nobody
             notices — and it matters more now than it did, because with the
             arrows gone this is the only visible sign that the rail advances
             on its own.

             Two changes of substance. It spans the whole width and rides the
             border that is already there, so it costs no vertical space. And
             it fills rather than slides: a bar scaling from the left reads as
             "time until the next one" without needing a label, where a small
             travelling dot reads as decoration. scaleX is a compositor
             property, so this is free to animate. */
          .ambient-track {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            width: auto;
            height: 1px;
            margin-top: 0;
            border-radius: 0;
          }
          .ambient-track::before { top: 0; }
          .ambient-segment {
            width: 100%;
            height: 1px;
            border-radius: 0;
            transform: scaleX(var(--ambient-progress));
            transform-origin: left center;
            transition: transform 260ms linear;
          }
        }
        @media (hover: none), (pointer: coarse) {
          .ambient-nav {
            position: relative;
            width: 32px;
            height: 32px;
            min-width: 32px;
            min-height: 32px;
            padding: 0;
            opacity: .62;
            pointer-events: auto;
            -webkit-tap-highlight-color: transparent;
          }
          .ambient-nav::before {
            content: "";
            position: absolute;
            inset: -6px;
            border-radius: 50%;
          }
          .ambient-nav::after {
            content: "";
            position: absolute;
            inset: 7px;
            border-radius: 50%;
            transition: background 140ms cubic-bezier(.23,1,.32,1);
          }
          .ambient-nav svg { position: relative; z-index: 1; }
          .ambient-nav:hover,
          .ambient-nav:focus-visible { background: transparent; }
          .ambient-nav:hover::after,
          .ambient-nav:focus-visible::after { background: rgba(var(--accent-rgb),.055); }
          .ambient-nav:active::after { background: rgba(var(--accent-rgb),.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ambient-copy { animation: none; transition: none; transform: none !important; }
          .ambient-segment { transition: none; }
        }
      `}</style>
    </div>
  );
}
