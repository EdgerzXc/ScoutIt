"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAmbientData } from "./useAmbientData";

export default function AmbientInformationRail({ user }) {
  const items = useAmbientData(user);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const hoverLeaveTimer = useRef(null);
  const manualNavTimer = useRef(null);
  const autoRotateTimer = useRef(null);
  const isInteracting = isHovered || isFocused;

  // Clamp activeIndex if items array length changes (e.g. data loads dynamically)
  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length) {
      setActiveIndex(0);
    }
  }, [items, activeIndex]);

  // Handle state change with subtle fade transition
  const changeState = useCallback((targetIndex) => {
    if (targetIndex === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(targetIndex);
      setIsTransitioning(false);
    }, 280); // 280ms fade out before swapping text
  }, [activeIndex, isTransitioning]);

  const handleNext = useCallback(() => {
    if (items.length <= 1) return;
    const nextIdx = (activeIndex + 1) % items.length;
    changeState(nextIdx);
  }, [activeIndex, items.length, changeState]);

  const handlePrev = useCallback(() => {
    if (items.length <= 1) return;
    const prevIdx = (activeIndex - 1 + items.length) % items.length;
    changeState(prevIdx);
  }, [activeIndex, items.length, changeState]);

  // Auto-rotation lifecycle
  useEffect(() => {
    if (items.length <= 1 || isInteracting) {
      if (autoRotateTimer.current) clearInterval(autoRotateTimer.current);
      return;
    }

    const currentDuration = items[activeIndex]?.duration || 5000;

    autoRotateTimer.current = setTimeout(() => {
      handleNext();
    }, currentDuration);

    return () => {
      if (autoRotateTimer.current) clearTimeout(autoRotateTimer.current);
    };
  }, [activeIndex, items, isInteracting, handleNext]);

  // Hover leave handler: wait 2 seconds before resuming auto-rotation
  const handleMouseEnter = () => {
    if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    if (manualNavTimer.current) clearTimeout(manualNavTimer.current);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverLeaveTimer.current) clearTimeout(hoverLeaveTimer.current);
    hoverLeaveTimer.current = setTimeout(() => {
      // Auto-rotation resumes via useEffect when isInteracting becomes false
    }, 2000);
  };

  // Rail track click navigation (optional hit zones)
  const handleTrackClick = (e) => {
    if (items.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetIdx = Math.round(ratio * (items.length - 1));
    changeState(targetIdx);
  };

  // Fallback: If no items exist yet (initial load / degrade gracefully)
  const currentItem = items[activeIndex] || null;

  // Gold indicator position percentage (0 to 100)
  const progressRatio = items.length > 1 ? activeIndex / (items.length - 1) : 0;

  return (
    <div
      className="ambient-rail-container"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Upper Information Area (Text + Reserved Arrow Target Spaces) */}
      <div className="ambient-content-wrapper">
        {/* Subtle Previous Arrow Button */}
        <button
          type="button"
          className={`ambient-nav-btn prev ${isInteracting && items.length > 1 ? "visible" : ""}`}
          onClick={handlePrev}
          aria-label="Previous ambient information"
          tabIndex={items.length > 1 ? 0 : -1}
        >
          ‹
        </button>

        {/* Display Text Container */}
        <div className="ambient-text-viewport">
          {currentItem ? (
            <span className={`ambient-text-node ${isTransitioning ? "transitioning" : ""}`}>
              {currentItem.text}
            </span>
          ) : (
            <span className="ambient-text-node static-dash" />
          )}
        </div>

        {/* Subtle Next Arrow Button */}
        <button
          type="button"
          className={`ambient-nav-btn next ${isInteracting && items.length > 1 ? "visible" : ""}`}
          onClick={handleNext}
          aria-label="Next ambient information"
          tabIndex={items.length > 1 ? 0 : -1}
        >
          ›
        </button>
      </div>

      {/* Gold Position Rail Indicator */}
      <div
        className="ambient-track"
        onClick={handleTrackClick}
        title={items.length > 1 ? "Click rail to jump to ambient state" : undefined}
      >
        <div className="ambient-track-base" />
        <div
          className="ambient-gold-segment"
          style={{
            left: `${progressRatio * 100}%`,
            transform: `translateX(-${progressRatio * 100}%)`,
          }}
        />
      </div>

      <style jsx>{`
        .ambient-rail-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 380px;
          min-height: 40px;
          margin: 0 auto;
          position: relative;
          user-select: none;
          contain: layout paint;
        }

        .ambient-content-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 22px;
          position: relative;
          gap: 6px;
        }

        /* Fixed-width nav button reservation prevents layout jumping */
        .ambient-nav-btn {
          background: transparent;
          border: none;
          color: var(--accent, #E8AE3C);
          font-family: var(--font-mono, monospace);
          font-size: 16px;
          line-height: 1;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s ease, visibility 0.25s ease, color 0.2s ease;
          padding: 0;
          flex-shrink: 0;
        }

        .ambient-nav-btn.visible {
          opacity: 0.55;
          visibility: visible;
        }

        .ambient-nav-btn.visible:hover {
          opacity: 1;
          color: var(--accent-bright, #F7C64E);
          transform: scale(1.15);
        }

        .ambient-nav-btn:focus-visible {
          outline: 1px solid var(--accent);
          border-radius: 50%;
          opacity: 1;
          visibility: visible;
        }

        .ambient-text-viewport {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        .ambient-text-node {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary, #a1a1a1);
          white-space: nowrap;
          transition: opacity 280ms cubic-bezier(0.4, 0, 0.2, 1), transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 1;
          transform: translateY(0);
          will-change: opacity, transform;
        }

        .ambient-text-node.transitioning {
          opacity: 0;
          transform: translateY(3px);
        }

        .ambient-rail-container:hover .ambient-text-node {
          color: var(--text-primary, #ffffff);
        }

        .ambient-track {
          width: 140px;
          height: 8px;
          display: flex;
          align-items: center;
          position: relative;
          cursor: pointer;
          padding: 3px 0;
        }

        .ambient-track-base {
          width: 100%;
          height: 1.5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 1px;
          transition: background 0.25s ease;
        }

        .ambient-rail-container:hover .ambient-track-base {
          background: rgba(255, 255, 255, 0.15);
        }

        .ambient-gold-segment {
          position: absolute;
          top: 3px;
          width: 28px;
          height: 2px;
          background: var(--accent, #E8AE3C);
          border-radius: 1px;
          box-shadow: 0 0 6px rgba(232, 174, 60, 0.35);
          transition: left 450ms cubic-bezier(0.4, 0, 0.2, 1), transform 450ms cubic-bezier(0.4, 0, 0.2, 1), background-color 0.25s ease;
          pointer-events: none;
        }

        .ambient-rail-container:hover .ambient-gold-segment {
          background: var(--accent-bright, #F7C64E);
          box-shadow: 0 0 10px rgba(247, 198, 78, 0.55);
        }

        /* Responsive Scaling for smaller screens */
        @media (max-width: 768px) {
          .ambient-rail-container {
            max-width: 240px;
          }
          .ambient-text-node {
            font-size: 10px;
            letter-spacing: 0.08em;
          }
          .ambient-track {
            width: 100px;
          }
          .ambient-gold-segment {
            width: 20px;
          }
        }

        @media (max-width: 520px) {
          .ambient-rail-container {
            max-width: 160px;
          }
          .ambient-text-node {
            font-size: 9px;
            letter-spacing: 0.05em;
          }
          .ambient-track {
            width: 70px;
          }
        }

        /* Accessibility: Respect Reduced Motion */
        @media (prefers-reduced-motion: reduce) {
          .ambient-text-node {
            transition: opacity 150ms linear;
            transform: none !important;
          }
          .ambient-gold-segment {
            transition: left 200ms linear;
          }
        }
      `}</style>
    </div>
  );
}
