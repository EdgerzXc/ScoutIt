"use client";

import { useState } from "react";
import { MATERIAL_SWAP_OPTIONS, DEFAULT_MATERIAL_CONFIG } from "@/lib/spatialStudio";
import { Sliders, Sun, Moon, Wrench } from "lucide-react";

export default function MaterialSwapperToolbar({
  activeConfig = DEFAULT_MATERIAL_CONFIG,
  onChange,
  onRequestRevision,
  canRequestRevision = false,
}) {
  const [config, setConfig] = useState(activeConfig);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleUpdate = (category, value) => {
    const next = { ...config, [category]: value };
    setConfig(next);
    onChange?.(next);
  };

  return (
    <aside aria-label="Interactive Spatial Material Swapper" className="absolute bottom-4 left-4 right-4 z-20 flex flex-col items-center pointer-events-none">
      <div className="w-full max-w-2xl bg-surface/90 border border-border/80 backdrop-blur-xl rounded-2xl p-3 sm:p-4 shadow-2xl pointer-events-auto flex flex-col gap-3">
        {/* Dock Header */}
        <div className="flex items-center justify-between border-b border-border-subtle/50 pb-2">
          <div className="flex items-center gap-2">
            <Sliders size={14} className="text-[var(--accent)]" />
            <span className="font-mono text-[12px] uppercase tracking-wider text-text-primary font-bold">
              In-Viewer Material Swapper
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full font-mono text-[12px] uppercase tracking-wider bg-[var(--accent)]/10 text-[var(--accent-bright)] border border-[var(--accent)]/20">
              Zero-Wait Preview
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canRequestRevision && (
              <button
                type="button"
                onClick={onRequestRevision}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--accent)] text-black hover:bg-[var(--accent-bright)] font-mono text-[12px] uppercase tracking-wider font-bold transition shadow-md active:scale-95"
              >
                <Wrench size={12} />
                <span>Request Studio Tweak</span>
                <span className="hidden md:inline text-[12px] opacity-80">(4–12h SLA)</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-text-muted hover:text-text-primary font-mono text-[12px] uppercase px-2 py-1 rounded transition"
            >
              {isExpanded ? "Minimize" : "Expand"}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* 1. Flooring Swapper */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-muted">
                Flooring
              </span>
              <div className="flex gap-1.5">
                {MATERIAL_SWAP_OPTIONS.flooring.map((option) => {
                  const isActive = config.flooring === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleUpdate("flooring", option.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[12px] uppercase tracking-wider transition truncate ${
                        isActive
                          ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                          : "bg-surface-alt/80 text-text-secondary hover:text-text-primary border border-border/50"
                      }`}
                      title={option.label}
                    >
                      {option.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Partitions Swapper */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-muted">
                Partitions
              </span>
              <div className="flex gap-1.5">
                {MATERIAL_SWAP_OPTIONS.partitions.map((option) => {
                  const isActive = config.partitions === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleUpdate("partitions", option.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[12px] uppercase tracking-wider transition truncate ${
                        isActive
                          ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                          : "bg-surface-alt/80 text-text-secondary hover:text-text-primary border border-border/50"
                      }`}
                      title={option.label}
                    >
                      {option.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Lighting Mood */}
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[12px] uppercase tracking-wider text-text-muted">
                Lighting Mood
              </span>
              <div className="flex gap-1.5">
                {MATERIAL_SWAP_OPTIONS.lighting.map((option) => {
                  const isActive = config.lighting === option.id;
                  const Icon = option.id === "daylight" ? Sun : Moon;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleUpdate("lighting", option.id)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-mono text-[12px] uppercase tracking-wider transition flex items-center justify-center gap-1.5 truncate ${
                        isActive
                          ? "bg-[var(--accent)] text-black font-bold shadow-sm"
                          : "bg-surface-alt/80 text-text-secondary hover:text-text-primary border border-border/50"
                      }`}
                    >
                      <Icon size={12} />
                      <span>{option.id === "daylight" ? "Day (5000K)" : "Dusk (2700K)"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
