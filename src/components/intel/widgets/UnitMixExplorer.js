"use client";

import { useState } from "react";
import { Layers, Maximize2, Tag, Sparkles, Check } from "lucide-react";

/**
 * UnitMixExplorer — Interactive unit mix and floorplate configuration explorer (A-195).
 * Allows readers to inspect unit layouts, areas, efficiencies, and capital/lease estimates.
 */
export default function UnitMixExplorer({
  title = "Unit Mix & Space Architecture",
  totalUnits,
  units = [],
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!units || units.length === 0) return null;

  const currentUnit = units[selectedIndex] || units[0];
  const areaSqm = Number(currentUnit.areaSqm) || 0;
  const areaSqft = Math.round(areaSqm * 10.7639);

  return (
    <div
      className="my-6 rounded-xl border border-gold-accent/25 bg-surface-alt/90 p-5 sm:p-6 backdrop-blur-md shadow-lg"
      role="region"
      aria-label="Unit Mix Explorer"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-variant/80 pb-4 mb-4">
        <div>
          <span className="font-mono text-[12px] uppercase tracking-[0.14em] text-gold-accent font-semibold flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5" />
            SPACE CONFIGURATIONS & LAYOUTS
          </span>
          <h3 className="font-serif text-lg sm:text-xl text-text-primary m-0 font-normal">
            {title}
          </h3>
        </div>

        {totalUnits ? (
          <span className="font-mono text-[12px] text-text-secondary bg-black/40 border border-surface-variant px-2.5 py-1 rounded shrink-0">
            TOTAL UNITS: <strong className="text-text-primary">{totalUnits}</strong>
          </span>
        ) : null}
      </div>

      {/* Unit Type Selector Buttons */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1" role="tablist" aria-label="Unit Space Types">
        {units.map((unit, idx) => (
          <button
            key={idx}
            type="button"
            role="tab"
            aria-selected={selectedIndex === idx}
            onClick={() => setSelectedIndex(idx)}
            className={`font-mono text-[12px] uppercase tracking-wider px-3.5 py-2 rounded-sm transition-[color,border-color,background-color] duration-150 flex items-center gap-1.5 shrink-0 ${
              selectedIndex === idx
                ? "bg-gold-accent/15 border border-gold-accent text-gold-accent font-semibold"
                : "bg-surface border border-surface-variant text-text-secondary hover:text-text-primary hover:border-surface-variant/80"
            }`}
          >
            <span>{unit.type}</span>
            <span className="text-text-tertiary text-[12px]">({unit.areaSqm}m²)</span>
          </button>
        ))}
      </div>

      {/* Selected Unit Details Card */}
      <div className="rounded-lg bg-black/40 border border-surface-variant p-4 sm:p-5" role="tabpanel" aria-label="Selected Unit Spec">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-variant/60 pb-4 mb-4">
          <div>
            <span className="font-mono text-[12px] text-gold-accent uppercase tracking-widest block mb-0.5">
              ACTIVE SELECTION
            </span>
            <h4 className="font-serif text-lg text-text-primary m-0">
              {currentUnit.type}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-surface border border-surface-variant px-3 py-1.5 rounded">
              <Maximize2 className="w-3.5 h-3.5 text-gold-accent" />
              <span className="font-mono text-[12px] text-text-primary">
                <strong>{areaSqm}</strong> m² <span className="text-text-tertiary">({areaSqft} sq ft)</span>
              </span>
            </div>

            {currentUnit.priceRange ? (
              <div className="flex items-center gap-1.5 bg-surface border border-gold-accent/30 px-3 py-1.5 rounded">
                <Tag className="w-3.5 h-3.5 text-gold-accent" />
                <span className="font-mono text-[12px] text-gold-accent font-semibold">
                  {currentUnit.priceRange}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Highlights and Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="font-mono text-[12px] text-text-secondary uppercase tracking-wider block mb-2">
              Architectural Highlights
            </span>
            {currentUnit.highlights && currentUnit.highlights.length > 0 ? (
              <ul className="space-y-1.5 m-0 p-0 list-none">
                {currentUnit.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-sans text-text-secondary">
                    <Check className="w-3.5 h-3.5 text-gold-accent shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs font-sans text-text-secondary m-0">
                Premium layout with optimized natural light and structural integrity.
              </p>
            )}
          </div>

          <div>
            <span className="font-mono text-[12px] text-text-secondary uppercase tracking-wider block mb-2">
              Floor Plate Usability
            </span>
            <div className="p-3 rounded bg-surface/60 border border-surface-variant flex items-center justify-between">
              <div>
                <span className="font-mono text-[12px] text-text-secondary block">Usable Efficiency</span>
                <span className="font-mono text-sm text-text-primary font-semibold">
                  {currentUnit.efficiency || "88% Usable Net Area"}
                </span>
              </div>
              <Sparkles className="w-4 h-4 text-gold-accent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
