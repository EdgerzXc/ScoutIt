"use client";

import React, { useState, useRef, useEffect, useId } from "react";

/**
 * SemanticChip (A-192)
 * High-end, dark-luxury clickable indicator for architectural and spatial intelligence.
 * Replaces erratic floating hover tooltips with a tactile, accessible chip.
 *
 * @param {string} label - Display label (e.g., "NOAH Zero Flood", "100% Genset", "PEZA Registered")
 * @param {string} [detail] - Contextual technical briefing shown on click
 * @param {string} [statute] - Statutory or registry provenance (e.g. "Project NOAH 100-Yr Envelope", "PEZA IT Park")
 * @param {"gold"|"emerald"|"sapphire"|"amber"} [tone="gold"] - Signal accent tone
 * @param {React.ReactNode} [icon] - Optional leading glyph
 * @param {string} [className] - Optional extra class
 */
export default function SemanticChip({
  label,
  detail,
  statute,
  tone = "gold",
  icon,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const popoverId = useId();

  // Tone color configurations
  const toneMap = {
    gold: {
      accent: "var(--accent)",
      dot: "var(--accent-bright)",
      glow: "rgba(var(--accent-rgb), 0.15)",
      border: "rgba(var(--accent-rgb), 0.3)",
    },
    emerald: {
      accent: "#10b981",
      dot: "#34d399",
      glow: "rgba(16, 185, 129, 0.15)",
      border: "rgba(16, 185, 129, 0.35)",
    },
    sapphire: {
      accent: "#3b82f6",
      dot: "#60a5fa",
      glow: "rgba(59, 130, 246, 0.15)",
      border: "rgba(59, 130, 246, 0.35)",
    },
    amber: {
      accent: "#f59e0b",
      dot: "#fbbf24",
      glow: "rgba(245, 158, 11, 0.15)",
      border: "rgba(245, 158, 11, 0.35)",
    },
  };

  const selectedTone = toneMap[tone] || toneMap.gold;

  // Dismiss on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center align-middle ${className}`.trim()}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border transition-all duration-200 cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        style={{
          background: "var(--surface)",
          borderColor: open ? selectedTone.accent : "var(--border)",
          boxShadow: open ? `0 0 12px ${selectedTone.glow}` : "none",
        }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0 transition-transform duration-200 group-hover:scale-125"
          style={{ background: selectedTone.dot }}
          aria-hidden="true"
        />
        {icon && <span className="shrink-0 text-xs opacity-80" aria-hidden="true">{icon}</span>}
        <span
          className="font-mono text-xs font-medium tracking-[0.1em] uppercase transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
      </button>

      {/* Accessible Flyout Panel (Non-intrusive) */}
      {open && (
        <div
          id={popoverId}
          role="region"
          aria-label={label}
          className="absolute z-50 left-0 top-full mt-2 w-72 p-3.5 rounded-sm border backdrop-blur-md transition-all shadow-xl"
          style={{
            background: "rgba(18, 18, 18, 0.96)",
            borderColor: selectedTone.border,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(var(--accent-rgb), 0.1)",
          }}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border)]">
            <span
              className="font-mono text-xs tracking-[0.12em] uppercase font-semibold"
              style={{ color: selectedTone.accent }}
            >
              {label}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-mono text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors px-1"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {detail && (
            <p
              className="text-xs leading-relaxed mb-2"
              style={{ color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}
            >
              {detail}
            </p>
          )}

          {statute && (
            <div
              className="font-mono text-xs tracking-[0.08em] uppercase pt-1 border-t border-[var(--border)] opacity-75"
              style={{ color: "var(--text-muted)" }}
            >
              Reference: {statute}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
