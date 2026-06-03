"use client";

import { useState, useEffect } from "react";

const REACTION_SHAPES = {
  "Save": {
    label: "Save",
    symbol: "🔖",
    svg: (
      <svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <path d="M10,0 L70,0 L70,90 L40,65 L10,90 Z" />
      </svg>
    )
  },
  "Inspired Me": {
    label: "Inspired Me",
    symbol: "✦",
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35" />
      </svg>
    )
  },
  "Potential Fit": {
    label: "Potential Fit",
    symbol: "◎",
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,5 93,27.5 93,72.5 50,95 7,72.5 7,27.5" />
      </svg>
    )
  },
  "Interested": {
    label: "Interested",
    symbol: "♡",
    svg: (
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <path d="M50,85 C50,85 10,55 10,30 C10,15 22,5 35,5 C42,5 48,9 50,13 C52,9 58,5 65,5 C78,5 90,15 90,30 C90,55 50,85 50,85 Z" />
      </svg>
    )
  }
};

export default function ReactionButtons({ propertyId, propertyTitle, category, city }) {
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

      // Trigger confirmation text fade logic
      setShowConfirm(true);
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
    <div className="reaction-buttons-wrapper">
      <div className="reaction-tiles-row">
        {Object.entries(REACTION_SHAPES).map(([type, data]) => {
          const isActive = activeReaction === type;
          return (
            <div
              key={type}
              className={`reaction-tile ${isActive ? "active" : ""}`}
              onClick={() => handleReactionClick(type)}
            >
              <div className="shape-wrapper">
                {data.svg}
                <span className="icon-overlay">{data.symbol}</span>
              </div>
              <span className="tile-label">{data.label}</span>
            </div>
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
        }

        .shape-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
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
          stroke: #262626;
          stroke-width: 1.5;
          transition: all 0.25s ease;
        }

        .icon-overlay {
          position: relative;
          z-index: 2;
          font-size: 14px;
          color: #8a8a8a;
          user-select: none;
          transition: color 0.25s ease;
        }

        /* Hover states */
        .reaction-tile:hover .shape-wrapper {
          transform: scale(1.05);
        }

        .reaction-tile:hover .shape-wrapper :global(svg) {
          stroke: #c8a96e;
        }

        /* Active states */
        .reaction-tile.active .shape-wrapper :global(svg) {
          fill: #c8a96e;
          stroke: #c8a96e;
        }

        .reaction-tile.active .icon-overlay {
          color: #0e0e0e;
        }

        /* Label styling */
        .tile-label {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #8a8a8a;
          margin-top: 8px;
          transition: color 0.25s ease;
          text-align: center;
        }

        .reaction-tile.active .tile-label {
          color: #c8a96e;
        }

        /* Confirmation text */
        .confirm-text {
          font-family: system-ui, -apple-system, sans-serif;
          color: #8a8a8a;
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
            width: 64px;
            height: 64px;
          }
          .icon-overlay {
            font-size: 12px;
          }
          .tile-label {
            font-size: 9px;
            letter-spacing: 1px;
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
          fill: #c8a96e;
          stroke: #c8a96e;
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
