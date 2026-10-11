"use client";

import { useState } from "react";
import { Train, Footprints, Compass, MapPin, CheckCircle2 } from "lucide-react";

/**
 * SpatialTransitHighlight — Interactive spatial transit and mobility corridor widget (A-195).
 * Visualizes walking distances, upcoming subway lines, and multimodal infrastructure access.
 */
export default function SpatialTransitHighlight({
  title = "Transit Corridors & Regional Mobility",
  corridorName = "Metro Manila Transit Corridor",
  walkScore = 92,
  transitHubs = [],
}) {
  const [selectedHub, setSelectedHub] = useState(0);

  if (!transitHubs || transitHubs.length === 0) return null;

  return (
    <div
      className="my-6 rounded-xl border border-gold-accent/25 bg-surface-alt/90 p-5 sm:p-6 backdrop-blur-md shadow-lg"
      role="region"
      aria-label="Transit Corridor Highlight"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant/80 pb-4 mb-4">
        <div>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold-accent font-semibold flex items-center gap-1.5 mb-1">
            <Compass className="w-3.5 h-3.5" />
            SPATIAL MOBILITY INTELLIGENCE
          </span>
          <h3 className="font-serif text-lg sm:text-xl text-text-primary m-0 font-normal">
            {title}
          </h3>
          <span className="font-mono text-[12px] text-text-tertiary block mt-0.5">
            Corridor: <strong className="text-text-secondary">{corridorName}</strong>
          </span>
        </div>

        {walkScore ? (
          <div className="flex items-center gap-2 bg-black/40 border border-gold-accent/30 px-3 py-1.5 rounded-lg shrink-0">
            <Footprints className="w-4 h-4 text-gold-accent" />
            <div>
              <span className="font-mono text-[12px] text-text-secondary block">WALK SCORE</span>
              <span className="font-mono text-sm text-gold-accent font-semibold">
                {walkScore}/100 <span className="text-text-tertiary text-[12px]">· Highly Walkable</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Transit Hubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="list" aria-label="Transit Stations List">
        {transitHubs.map((hub, idx) => {
          const isSelected = selectedHub === idx;
          const isOperational = (hub.status || "").toLowerCase().includes("operational");

          return (
            <div
              key={idx}
              role="listitem"
              tabIndex={0}
              onClick={() => setSelectedHub(idx)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedHub(idx);
                }
              }}
              className={`p-3.5 rounded-lg border cursor-pointer transition-[color,border-color,background-color] duration-150 focus:outline-hidden focus:ring-1 focus:ring-gold-accent ${
                isSelected
                  ? "bg-gold-accent/10 border-gold-accent"
                  : "bg-black/35 border-surface-variant hover:border-surface-variant/80 hover:bg-black/45"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${isSelected ? "bg-gold-accent text-background" : "bg-surface text-gold-accent"}`}>
                    <Train className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm text-text-primary m-0 font-medium">
                      {hub.name}
                    </h4>
                    <span className="font-mono text-[12px] text-text-tertiary">
                      {hub.transitType}
                    </span>
                  </div>
                </div>

                {hub.status ? (
                  <span
                    className={`font-mono text-[12px] px-2 py-0.5 rounded border uppercase shrink-0 ${
                      isOperational
                        ? "text-emerald-400 border-emerald-500/30 bg-emerald-950/20"
                        : "text-amber-400 border-amber-500/30 bg-amber-950/20"
                    }`}
                  >
                    {hub.status}
                  </span>
                ) : null}
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-text-secondary border-t border-surface-variant/60 pt-2 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gold-accent" />
                  {hub.distanceMeters}m from site
                </span>
                <span className="text-text-primary font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-gold-accent" />
                  {hub.walkMinutes} min travel
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
