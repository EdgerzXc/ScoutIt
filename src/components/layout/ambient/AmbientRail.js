"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAmbientData } from "./ambientData";

const FADE_MS = 240;
const HOVER_RESUME_MS = 1800;
const MANUAL_RESUME_MS = 8000;

export default function AmbientRail({ user }) {
  const items = useAmbientData(user);
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
      aria-label="Local ambient information"
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
              <span className="ambient-copy-desktop">{currentItem.text}</span>
              <span className="ambient-copy-mobile">{currentItem.mobileText || currentItem.text}</span>
            </span>
          )}
        </div>
        <button type="button" className="ambient-nav" onClick={() => next(true)} aria-label="Next ambient information" aria-controls="ambient-rail-status" disabled={items.length <= 1}>
          <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6.25 3.5 4 4.5-4 4.5" /></svg>
        </button>
      </div>
      <div className="ambient-track" aria-hidden="true" style={{ "--ambient-progress": progress }}>
        <span className="ambient-thread" />
        <span className="ambient-segment" />
      </div>      <span className="ambient-sr-status" aria-live="polite" aria-atomic="true">{announcement}</span>

      <style jsx>{`
        .ambient-rail {
          position: relative;
          width: min(100%, 392px);
          min-width: 0;
          min-height: 44px;
          padding: 3px 12px 4px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          border-radius: 999px;
          border: 1px solid rgba(var(--accent-rgb), .13);
          background: linear-gradient(180deg, rgba(255,255,255,.035), transparent 52%), rgba(4,4,4,.34);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.045), inset 0 -1px 0 rgba(var(--accent-rgb), .035), 0 8px 32px rgba(0,0,0,.16);
          user-select: none;
          isolation: isolate;
        }
        .ambient-rail::before {
          content: "";
          position: absolute;
          inset: 2px;
          z-index: -1;
          border-radius: inherit;
          border: 1px solid rgba(var(--accent-rgb), .045);
          pointer-events: none;
        }
        .ambient-content {
          width: 100%;
          height: 25px;
          display: grid;
          grid-template-columns: 36px minmax(0, 1fr) 36px;
          align-items: center;
        }
        .ambient-viewport { position: relative; min-width: 0; overflow: hidden; text-align: center; }
        .ambient-viewport::before,
        .ambient-viewport::after {
          content: "";
          position: absolute;
          top: 50%;
          width: 18px;
          height: 1px;
          opacity: .34;
          pointer-events: none;
        }
        .ambient-viewport::before { left: 0; background: linear-gradient(90deg, rgba(var(--accent-rgb), .58), transparent); }
        .ambient-viewport::after { right: 0; background: linear-gradient(270deg, rgba(var(--accent-rgb), .58), transparent); }
        .ambient-copy {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding: 0 22px;
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 600;
          letter-spacing: .16em;
          color: var(--text-secondary);
          text-shadow: 0 0 18px rgba(var(--accent-rgb), .08);
          animation: ambientReveal 420ms cubic-bezier(.23,1,.32,1) both;
          transition: opacity ${FADE_MS}ms cubic-bezier(.23,1,.32,1), transform ${FADE_MS}ms cubic-bezier(.23,1,.32,1), color 180ms cubic-bezier(.23,1,.32,1);
        }
        .ambient-copy.is-leaving { opacity: 0; transform: translate3d(0,-3px,0); }
        .ambient-copy-mobile { display: none; }
        .ambient-nav {
          width: 36px;
          height: 36px;
          padding: 0;
          display: grid;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--accent);
          cursor: pointer;
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms cubic-bezier(.23,1,.32,1), color 160ms cubic-bezier(.23,1,.32,1), background 160ms cubic-bezier(.23,1,.32,1), transform 140ms cubic-bezier(.23,1,.32,1);
        }
        .ambient-nav svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.15; stroke-linecap: round; stroke-linejoin: round; }
        .ambient-rail:hover .ambient-nav,
        .ambient-rail:focus-within .ambient-nav,
        .ambient-nav:focus-visible { opacity: .72; pointer-events: auto; }
        .ambient-nav:hover,
        .ambient-nav:focus-visible { color: var(--accent-bright); background: rgba(var(--accent-rgb),.075); opacity: 1; }
        .ambient-nav:active { transform: scale(.94); }
        .ambient-nav:focus-visible { outline: 1px solid var(--accent-bright); outline-offset: -4px; }
        .ambient-nav:disabled { cursor: default; opacity: 0 !important; }
        .ambient-track { --ambient-travel: 132px; position: relative; width: 164px; height: 7px; overflow: hidden; }
        .ambient-track::before {
          content: "";
          position: absolute;
          top: 3px;
          left: 0;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb),.18) 16%, rgba(var(--accent-rgb),.34) 50%, rgba(var(--accent-rgb),.18) 84%, transparent);
        }
        .ambient-thread {
          position: absolute;
          top: 3px;
          left: 0;
          width: 44px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(var(--accent-rgb),.86), transparent);
          filter: drop-shadow(0 0 3px rgba(var(--accent-rgb),.42));
          animation: ambientThread 6.8s cubic-bezier(.45,0,.55,1) infinite;
        }
        .ambient-segment {
          position: absolute;
          top: 2px;
          left: 0;
          width: 32px;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(var(--accent-rgb),.18), var(--accent-bright), rgba(var(--accent-rgb),.18));
          box-shadow: 0 0 8px rgba(var(--accent-rgb),.34);
          transform: translate3d(calc(var(--ambient-progress) * var(--ambient-travel)),0,0);
          transition: transform 520ms cubic-bezier(.32,.72,0,1);
        }
        .ambient-rail:hover .ambient-copy,
        .ambient-rail:focus-within .ambient-copy { color: var(--text-primary); }
        .ambient-rail.is-paused .ambient-thread { animation-play-state: paused; }
        .ambient-sr-status { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
        @keyframes ambientReveal {
          from { opacity: 0; transform: translate3d(0,4px,0); }
          to { opacity: 1; transform: translate3d(0,0,0); }
        }
        @keyframes ambientThread {
          0% { transform: translate3d(-56px,0,0); opacity: 0; }
          18% { opacity: .9; }
          82% { opacity: .9; }
          100% { transform: translate3d(176px,0,0); opacity: 0; }
        }
        @media (max-width: 768px) {
          .ambient-rail { padding-inline: 7px; }
          .ambient-content { grid-template-columns: 32px minmax(0,1fr) 32px; }
          .ambient-copy { padding-inline: 14px; font-size: 8.5px; letter-spacing: .11em; }
          .ambient-track { --ambient-travel: 76px; width: 100px; }
          .ambient-segment { width: 24px; }
        }
        @media (max-width: 560px) {
          .ambient-rail { min-height: 38px; padding-inline: 3px; }
          .ambient-copy-desktop { display: none; }
          .ambient-copy-mobile { display: inline; }
          .ambient-content { grid-template-columns: 28px minmax(0,1fr) 28px; }
          .ambient-nav { width: 28px; height: 34px; }
          .ambient-copy { padding-inline: 8px; }
          .ambient-track { --ambient-travel: 52px; width: 72px; }
          .ambient-segment { width: 20px; }
        }
        @media (hover: none), (pointer: coarse) { .ambient-nav { opacity: .56; pointer-events: auto; } }
        @media (prefers-reduced-motion: reduce) {
          .ambient-copy { animation: none; transition: none; transform: none !important; }
          .ambient-thread { display: none; }
          .ambient-segment { transition: none; }
        }
      `}</style>
    </div>
  );
}
