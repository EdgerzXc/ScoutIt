/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect } from "react";
import { Bookmark, Sparkles, Target, Heart } from "lucide-react";

const REACTION_SHAPES = {
  "Save": {
    label: "Save",
    symbol: <Bookmark strokeWidth={1.5} size="1em" />,
    svg: (
      <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,0 L70,0 L70,90 L40,65 L10,90 Z" />
      </svg>
    )
  },
  "Inspired Me": {
    label: "Inspired Me",
    symbol: <Sparkles strokeWidth={1.5} size="1em" />,
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
      </svg>
    )
  },
  "Potential Fit": {
    label: "Potential Fit",
    symbol: <Target strokeWidth={1.5} size="1em" />,
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" />
      </svg>
    )
  },
  "Interested": {
    label: "Interested",
    symbol: <Heart strokeWidth={1.5} size="1em" />,
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,85 C50,85 10,55 10,30 C10,15 22,5 35,5 C42,5 48,9 50,13 C52,9 58,5 65,5 C78,5 90,15 90,30 C90,55 50,85 50,85 Z" />
      </svg>
    )
  }
};

export default function ReactionButtons({ propertyId, propertyTitle, category, city, small = false, isBroker = false }) {
  const [activeReaction, setActiveReaction] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Read initial reaction state on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("scoutit_reactions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const matched = parsed.find(item => item.property_id === propertyId);
          if (matched) {
            setActiveReaction(matched.reaction_type);
          }
        }
      }
    } catch (e) {
      // ignore
    }
  }, [propertyId]);

  const handleReactionClick = (type) => {
    let nextReaction = null;
    try {
      const raw = localStorage.getItem("scoutit_reactions") || "[]";
      let parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) parsed = [];

      const index = parsed.findIndex(item => item.property_id === propertyId);

      if (activeReaction === type) {
        // Deactivate / remove
        if (index > -1) {
          parsed.splice(index, 1);
        }
        nextReaction = null;
      } else {
        // Activate / switch
        const newItem = {
          property_id: propertyId,
          property_title: propertyTitle,
          category: category,
          city: city,
          reaction_type: type,
          is_broker: isBroker,
          timestamp: Date.now()
        };

        if (index > -1) {
          parsed[index] = newItem;
        } else {
          parsed.push(newItem);
        }
        nextReaction = type;
      }

      localStorage.setItem("scoutit_reactions", JSON.stringify(parsed));
      setActiveReaction(nextReaction);
      setShowConfirm(true);

      // Fire anonymous POST to analytics API
      if (nextReaction) {
        fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ property_id: propertyId, reaction_type: nextReaction, city, category }),
        }).catch(() => {});
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (showConfirm) {
      const timer = setTimeout(() => {
        setShowConfirm(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfirm]);

  return (
    <div className={`reaction-buttons-wrapper ${small ? "small" : ""}`}>
      <div className={`reaction-tiles-row reaction-row ${small ? "small" : ""}`}>
        {Object.entries(REACTION_SHAPES).map(([type, data]) => {
          const isActive = activeReaction === type;
          return (
            <button
              key={type}
              type="button"
              className={`reaction-tile ${isActive ? "active" : ""}`}
              onClick={() => handleReactionClick(type)}
              aria-pressed={isActive}
              aria-label={data.label}
            >
              <div className="shape-wrapper">
                {data.svg}
                <span className="icon-overlay">{data.symbol}</span>
              </div>
              <span className="tile-label">{data.label}</span>
            </button>
          );
        })}
      </div>

      <div className={`confirm-text ${showConfirm ? "visible" : ""}`}>
        Noted. Your board has been updated.
      </div>

      <style jsx>{`
        .reaction-buttons-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .reaction-tiles-row.small {
          gap: 8px;
          flex-wrap: nowrap;
          width: 100%;
          justify-content: space-around;
        }

        .reaction-tiles-row.small .shape-wrapper {
          width: 34px;
          height: 34px;
        }

        .reaction-tiles-row.small .icon-overlay {
          font-size: 14px;
        }

        .reaction-tiles-row.small .tile-label {
          display: none;
        }

        .reaction-tiles-row {
          display: flex;
          gap: 20px;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
        }

        .reaction-tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          background: transparent;
          border: none;
          padding: 0;
          border-radius: 8px;
        }

        .reaction-tile:focus-visible {
          outline: 1.5px solid var(--accent-bright, #ffc929);
          outline-offset: 4px;
        }

        .shape-wrapper {
          position: relative;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease;
        }

        .shape-wrapper :global(svg) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          fill: #1c1c1c;
          stroke: #4a4a4a;
          stroke-width: 3px;
          transition: all 0.25s ease;
        }

        .icon-overlay {
          position: relative;
          z-index: 2;
          font-size: 22px;
          opacity: 0.85;
          color: #c8c8c8;
          user-select: none;
          transition: all 0.25s ease;
        }

        /* Hover states */
        .reaction-tile:hover .shape-wrapper {
          transform: scale(1.05);
        }

        .reaction-tile:hover .shape-wrapper :global(svg) {
          stroke: var(--accent-bright, #ffc929);
          stroke-width: 3px;
          filter: drop-shadow(0 0 6px rgba(255, 184, 0, 0.35));
        }

        /* Active states */
        .reaction-tile.active .shape-wrapper :global(svg) {
          fill: #ffb800;
          stroke: #ffb800;
          stroke-width: 3px;
        }

        .reaction-tile.active .icon-overlay {
          color: #0e0e0e;
          opacity: 1;
        }

        /* Label styling */
        .tile-label {
          font-family: var(--font-mono, monospace);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #c8c8c8);
          margin-top: 6px;
          transition: color 0.25s ease;
          text-align: center;
        }

        .reaction-tile:hover .tile-label {
          color: var(--accent-bright, #ffc929);
        }

        .reaction-tile.active .tile-label {
          color: #ffb800;
        }

        /* Confirmation text */
        .confirm-text {
          font-family: var(--font-mono, monospace);
          color: var(--accent, #ffb800);
          letter-spacing: 0.08em;
          font-size: 12px;
          margin-top: 12px;
          text-align: center;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.25s ease, visibility 0.25s ease;
        }

        .confirm-text.visible {
          opacity: 1;
          visibility: visible;
        }

        @media (max-width: 640px) {
          .shape-wrapper {
            width: 52px;
            height: 52px;
          }
          .icon-overlay {
            font-size: 20px;
          }
          .tile-label {
            font-size: 9px;
            letter-spacing: 1px;
            margin-top: 6px;
          }
        }
      `}</style>
    </div>
  );
}

export function ReactionBadge({ reactionType }) {
  const shapeData = REACTION_SHAPES[reactionType];
  if (!shapeData) return null;

  return (
    <div className="badge-wrapper">
      <div className="badge-svg-container">
        {shapeData.svg}
      </div>
      <div className="tooltip">{reactionType}</div>

      <style jsx>{`
        .badge-wrapper {
          position: relative;
          display: inline-block;
          cursor: pointer;
        }

        .badge-svg-container {
          width: 24px;
          height: 24px;
        }

        .badge-svg-container :global(svg) {
          width: 100%;
          height: 100%;
          fill: #ffb800;
          stroke: #ffb800;
          stroke-width: 1.5;
        }

        .tooltip {
          visibility: hidden;
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background-color: #161616;
          border: 1px solid #262626;
          color: #f0ede8;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          z-index: 10;
          opacity: 0;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
        }

        .badge-wrapper:hover .tooltip {
          visibility: visible;
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
