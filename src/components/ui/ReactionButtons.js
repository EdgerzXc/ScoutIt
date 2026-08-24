/* eslint-disable react-hooks/purity */
"use client";

import { useState, useEffect } from "react";
import { Bookmark, Sparkles, Target, Heart } from "lucide-react";
import { reactionFeedback } from "@/components/ui/reactionFeedback";
import { reportError } from "@/lib/reportError";

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
  // "idle" | "saved" | "removed" | "storage-failed" -- see reactionFeedback.js
  const [status, setStatus] = useState("idle");

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

    // The local write and the anonymous ping are two different promises to the
    // user, and they get two different failure paths. Your Board is this
    // localStorage entry -- if it lands, the action succeeded.
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
      setStatus(nextReaction ? "saved" : "removed");
    } catch (error) {
      // Private browsing and a full quota both land here. Previously this was
      // an empty catch and the success message rendered anyway.
      setStatus("storage-failed");
      return;
    }

    // Anonymous analytics. A 429 or a 502 here is not the user's problem and
    // must not change what the interface just told them -- but it is somebody's
    // problem, so it goes to Sentry rather than into an empty catch block.
    if (nextReaction) {
      fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ property_id: propertyId, reaction_type: nextReaction, city, category }),
      })
        .then((res) => {
          if (!res.ok) {
            reportError({
              kind: "crash",
              message: `Reaction ping failed with ${res.status}`,
              context: { reaction_type: nextReaction },
            });
          }
        })
        .catch((error) => {
          reportError({
            kind: "crash",
            message: `Reaction ping threw: ${error?.message || "unknown"}`,
            context: { reaction_type: nextReaction },
          });
        });
    }
  };

  useEffect(() => {
    if (status === "idle") return;
    // A warning is worth a longer read than a confirmation.
    const timer = setTimeout(() => setStatus("idle"), status === "storage-failed" ? 4000 : 2000);
    return () => clearTimeout(timer);
  }, [status]);

  const feedback = reactionFeedback(status);

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
              title={data.label}
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

      {/* aria-live because this line now reports state rather than decorating. */}
      <div
        className={`confirm-text ${feedback ? "visible" : ""} ${feedback?.tone === "warn" ? "warn" : ""}`}
        role="status"
        aria-live="polite"
      >
        {feedback?.message || ""}
      </div>

      <style jsx>{`
        .reaction-buttons-wrapper {
          /* The stock CSS easings are too soft to read at these durations. */
          --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
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
          width: 44px; /* Minimum mobile tap target */
          height: 44px;
        }

        .reaction-tiles-row.small .icon-overlay {
          font-size: 16px;
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
          touch-action: manipulation;
          transition: transform 160ms var(--ease-out-strong);
        }

        /* The !important here was fighting nothing -- hover targets the child
           .shape-wrapper, press targets the tile. 0.92 also overshot the range
           where a press reads as feedback rather than as the tile shrinking. */
        .reaction-tile:active {
          transform: scale(0.96);
        }

        .reaction-tile:focus-visible {
          outline: 1.5px solid var(--accent-bright, #F7C64E);
          outline-offset: 4px;
        }

        .shape-wrapper {
          position: relative;
          width: 52px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 220ms var(--ease-out-strong);
        }

        .shape-wrapper :global(svg) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          fill: #1c1c1c;
          stroke: #4a4a4a;
          stroke-width: 3px;
          /* Named properties only. "all" also tweened stroke-width and the
             drop-shadow filter, which is the expensive half of this rule. */
          transition: fill 220ms ease, stroke 220ms ease, filter 220ms ease;
        }

        .icon-overlay {
          position: relative;
          z-index: 2;
          font-size: 22px;
          opacity: 0.85;
          color: #c8c8c8;
          user-select: none;
          transition: color 220ms ease, opacity 220ms ease;
        }

        /* Hover states.
           Gated: on a touch screen every tap fires :hover and then STAYS there
           until the next tap elsewhere, so a tile the user already released
           keeps the gold glow and reads as still selected. */
        @media (hover: hover) and (pointer: fine) {
          .reaction-tile:hover .shape-wrapper {
            transform: scale(1.05);
          }

          .reaction-tile:hover .shape-wrapper :global(svg) {
            stroke: var(--accent-bright, #F7C64E);
            stroke-width: 3px;
            filter: drop-shadow(0 0 6px rgba(232, 174, 60, 0.35));
          }
        }

        /* Active states */
        .reaction-tile.active .shape-wrapper :global(svg) {
          fill: #E8AE3C;
          stroke: #E8AE3C;
          stroke-width: 3px;
          filter: drop-shadow(0 0 10px rgba(232, 174, 60, 0.4));
        }

        .reaction-tile.active .icon-overlay {
          color: #121212;
          opacity: 1;
        }

        /* Label styling */
        .tile-label {
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-secondary, #c8c8c8);
          margin-top: 6px;
          transition: color 0.25s ease;
          text-align: center;
        }

        @media (hover: hover) and (pointer: fine) {
          .reaction-tile:hover .tile-label {
            color: var(--accent-bright, #F7C64E);
          }
        }

        .reaction-tile.active .tile-label {
          color: #E8AE3C;
        }

        /* Confirmation text */
        .confirm-text {
          font-family: var(--font-mono, monospace);
          color: var(--accent, #E8AE3C);
          letter-spacing: 0.1em;
          font-size: 12px;
          text-transform: uppercase;
          margin-top: 16px;
          text-align: center;
          min-height: 1em; /* row is reserved, so nothing below it shifts */
          opacity: 0;
          pointer-events: none;
          text-shadow: 0 0 8px rgba(232, 174, 60, 0.3);
          transform: translateY(4px);
          /* Exit is quicker than entry: the message has already been read by
             the time it leaves, so lingering only delays the next one. */
          transition: opacity 160ms var(--ease-out-strong),
                      transform 160ms var(--ease-out-strong),
                      color 160ms ease;
        }

        .confirm-text.visible {
          opacity: 1;
          transform: translateY(0);
          transition-duration: 220ms;
        }

        /* A blocked save is not a gold moment. Muted terracotta reads as
           "something is off" while staying inside the warm palette -- a
           system red would be the only cool-shifted pixel on the page. */
        .confirm-text.warn {
          color: #D08C6A;
          text-shadow: none;
        }

        /* Reduced motion means less movement, not less information: the colour
           and opacity changes that carry state are kept, the travel is not. */
        @media (prefers-reduced-motion: reduce) {
          .reaction-tile,
          .shape-wrapper {
            transition: none;
          }
          .reaction-tile:active,
          .reaction-tile:hover .shape-wrapper {
            transform: none;
          }
          .confirm-text,
          .confirm-text.visible {
            transform: none;
          }
          .confirm-text {
            transition: opacity 160ms ease, color 160ms ease;
          }
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
            font-size: 12px;
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
    </div>
  );
}
