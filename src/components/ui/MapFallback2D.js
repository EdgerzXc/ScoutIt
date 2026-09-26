"use client";

import React from "react";

/**
 * 2D Luxury Map Fallback (A-161 Phase 2)
 * Rendered when WebGL hardware acceleration is unavailable, disabled, or fails to initialize.
 * Preserves dark luxury ScoutIt DNA while displaying coordinates, location, and navigation links.
 */
export default function MapFallback2D({
  title = "Spatial Map: 2D Mode Active",
  locationName = "",
  coordinates = null,
  lat = null,
  lng = null,
  className = "",
  minHeight = "min-h-[320px]",
  style = {},
}) {
  const effectiveCoords = coordinates || (lat != null && lng != null ? [lng, lat] : null);
  const coordText = effectiveCoords
    ? Array.isArray(effectiveCoords)
      ? `${effectiveCoords[1]?.toFixed?.(4) ?? effectiveCoords[1]}, ${effectiveCoords[0]?.toFixed?.(4) ?? effectiveCoords[0]}`
      : typeof effectiveCoords === "string"
      ? effectiveCoords
      : null
    : null;

  return (
    <div
      className={`relative w-full ${minHeight} bg-[#0d0d0d] border border-white/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center overflow-hidden ${className}`}
      style={style}
      role="region"
      aria-label={title}
    >
      {/* Background subtle spatial grid */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--accent) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "0 0, 12px 12px",
        }}
      />

      <div className="relative z-10 max-w-sm flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-[rgba(var(--accent-rgb),0.1)] border border-[rgba(var(--accent-rgb),0.3)] flex items-center justify-center mb-3">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[var(--accent)]"
            aria-hidden="true"
          >
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>

        <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)] mb-1">
          Hardware Acceleration Standby
        </p>

        <h3 className="font-serif text-lg text-white mb-2">
          {title}
        </h3>

        {locationName && (
          <p className="text-white/80 font-medium text-sm mb-1">
            {locationName}
          </p>
        )}

        {coordText && (
          <p className="font-mono text-xs text-white/60 mb-3 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
            {coordText}
          </p>
        )}

        <p className="text-white/60 text-xs leading-relaxed max-w-xs mb-4">
          3D WebGL acceleration is unavailable on this device. Spatial telemetry and property data remain active.
        </p>

        {coordText && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              locationName ? `${locationName} ${coordText}` : coordText
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[var(--accent)] hover:text-[var(--accent-bright)] transition-colors py-1.5 px-3 rounded-full border border-[rgba(var(--accent-rgb),0.2)] hover:border-[rgba(var(--accent-rgb),0.4)]"
          >
            <span>Open External Map</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
