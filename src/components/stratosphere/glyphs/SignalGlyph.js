"use client";

import React from "react";
import "./signal-glyphs.css";

/**
 * 1. SPATIAL VOLUME GLYPH
 * Lightweight SVG isometric wireframe box representing architectural volume,
 * footprint proportion, and ceiling height without any WebGL overhead.
 */
export function SpatialVolumeGlyph({ data = {}, label = "" }) {
  const { width = 30, depth = 30, height = 15, ceilingM = 5.0, hasCorner = false } = data;

  // Isometric projection coordinates (origin at center 60, 55)
  const ox = 60;
  const oy = 60;

  // Isometric vectors: x goes down-left, y goes down-right, z goes straight up
  const scale = 0.85;
  const dx = (width * scale) * 0.866;
  const dy = (width * scale) * 0.5;
  const px = (depth * scale) * 0.866;
  const py = (depth * scale) * 0.5;
  const hz = height * scale * 1.5;

  // Points for 3D box
  // Base: b0 (front), b1 (right), b2 (back), b3 (left)
  const b0 = [ox, oy + dy + py];
  const b1 = [ox + px, oy + py];
  const b2 = [ox, oy];
  const b3 = [ox - dx, oy + dy];

  // Top: t0, t1, t2, t3 (shifted up by hz)
  const t0 = [b0[0], b0[1] - hz];
  const t1 = [b1[0], b1[1] - hz];
  const t2 = [b2[0], b2[1] - hz];
  const t3 = [b3[0], b3[1] - hz];

  const topFace = `${t0.join(",")} ${t1.join(",")} ${t2.join(",")} ${t3.join(",")}`;
  const leftFace = `${b0.join(",")} ${b3.join(",")} ${t3.join(",")} ${t0.join(",")}`;
  const rightFace = `${b0.join(",")} ${b1.join(",")} ${t1.join(",")} ${t0.join(",")}`;

  return (
    <div className="sg-glyph sg-glyph-volume" title={label || `${ceilingM}m clear ceiling volume`}>
      <svg viewBox="0 0 120 110" className="sg-svg" aria-hidden="true">
        {/* Ground grid / shadow */}
        <ellipse cx={ox} cy={oy + py + 6} rx={36} ry={14} className="sg-ground-shadow" />

        {/* Left facet */}
        <polygon points={leftFace} className="sg-face sg-face-left" />

        {/* Right facet */}
        <polygon
          points={rightFace}
          className={`sg-face sg-face-right ${hasCorner ? "sg-face-corner-accent" : ""}`}
        />

        {/* Top facet */}
        <polygon points={topFace} className="sg-face sg-face-top" />

        {/* Wireframe outlines */}
        <polyline points={`${t3.join(",")} ${t0.join(",")} ${t1.join(",")}`} className="sg-wire-highlight" />
        <line x1={t0[0]} y1={t0[1]} x2={b0[0]} y2={b0[1]} className="sg-wire-pillar" />

        {/* Height dimension tick */}
        <line x1={t3[0] - 6} y1={t3[1]} x2={t3[0] - 6} y2={b3[1]} className="sg-dim-line" />
        <line x1={t3[0] - 9} y1={t3[1]} x2={t3[0] - 3} y2={t3[1]} className="sg-dim-tick" />
        <line x1={t3[0] - 9} y1={b3[1]} x2={t3[0] - 3} y2={b3[1]} className="sg-dim-tick" />
      </svg>
      <div className="sg-caption">
        <span className="sg-dim-metric">{ceilingM}m CEILING</span>
        {hasCorner && <span className="sg-tag-accent">CORNER FRONT</span>}
      </div>
    </div>
  );
}

/**
 * 2. TREND GLYPH
 * Micro sparkline and momentum indicator for market observations.
 */
export function TrendGlyph({ data = {}, label = "" }) {
  const { trend = "+35%", direction = "up", sparkline = [10, 20, 25, 38, 50] } = data;

  const width = 90;
  const height = 40;
  const max = Math.max(...sparkline, 1);
  const min = Math.min(...sparkline, 0);

  const points = sparkline
    .map((val, i) => {
      const x = (i / (sparkline.length - 1)) * (width - 12) + 6;
      const y = height - 8 - ((val - min) / (max - min || 1)) * (height - 16);
      return `${x},${y}`;
    })
    .join(" ");

  const lastPoint = points.split(" ").pop();
  const [lx, ly] = lastPoint ? lastPoint.split(",") : [width - 6, height / 2];

  return (
    <div className="sg-glyph sg-glyph-trend" title={label || `Market shift: ${trend}`}>
      <svg viewBox={`0 0 ${width} ${height}`} className="sg-svg" aria-hidden="true">
        <polyline points={points} className="sg-sparkline" />
        <circle cx={lx} cy={ly} r={3} className="sg-spark-dot" />
      </svg>
      <div className="sg-caption">
        <span className={`sg-trend-badge ${direction === "up" ? "sg-trend-up" : "sg-trend-down"}`}>
          {trend}
        </span>
      </div>
    </div>
  );
}

/**
 * 3. LOCATION PULSE GLYPH
 * Concentric radar circles indicating foot traffic, transit catchment, or spatial intensity.
 */
export function LocationPulseGlyph({ data = {}, label = "" }) {
  const { radiusM = 800 } = data;

  return (
    <div className="sg-glyph sg-glyph-pulse" title={label || `${radiusM}m catchment radius`}>
      <svg viewBox="0 0 90 50" className="sg-svg" aria-hidden="true">
        {/* Concentric radar rings */}
        <circle cx="45" cy="25" r="22" className="sg-radar-ring sg-radar-ring-3" />
        <circle cx="45" cy="25" r="14" className="sg-radar-ring sg-radar-ring-2" />
        <circle cx="45" cy="25" r="6" className="sg-radar-ring sg-radar-ring-1" />
        <circle cx="45" cy="25" r="2.5" className="sg-radar-core" />
      </svg>
      <div className="sg-caption">
        <span className="sg-dim-metric">{radiusM}m CATCHMENT</span>
      </div>
    </div>
  );
}

/**
 * 4. SUPPLY DEMAND GLYPH
 * Balanced micro meter comparing supply vs demand pressure.
 */
export function SupplyDemandGlyph({ data = {}, label = "" }) {
  const { supplyRate = 75, demandRate = 60, status = "SURPLUS" } = data;

  return (
    <div className="sg-glyph sg-glyph-meter" title={label || `Supply/Demand status: ${status}`}>
      <div className="sg-meter-bars" aria-hidden="true">
        <div className="sg-meter-track">
          <div className="sg-meter-fill sg-supply-fill" style={{ width: `${Math.min(supplyRate, 100)}%` }} />
        </div>
        <div className="sg-meter-track">
          <div className="sg-meter-fill sg-demand-fill" style={{ width: `${Math.min(demandRate, 100)}%` }} />
        </div>
      </div>
      <div className="sg-caption">
        <span className="sg-meter-label">SUPPLY / DEMAND</span>
        <span className="sg-meter-status">{status}</span>
      </div>
    </div>
  );
}

/**
 * 5. EXPANSION GLYPH
 * Radial expansion scope with campus/regional radius callout.
 */
export function ExpansionGlyph({ data = {}, label = "" }) {
  const { campusRadiusKm = 2.5, targetPax = 300 } = data;

  return (
    <div className="sg-glyph sg-glyph-expansion" title={label || `${campusRadiusKm}km target expansion zone`}>
      <svg viewBox="0 0 90 50" className="sg-svg" aria-hidden="true">
        <polygon points="45,10 68,36 22,36" className="sg-target-polygon" />
        <circle cx="45" cy="26" r="3" className="sg-target-pin" />
      </svg>
      <div className="sg-caption">
        <span className="sg-dim-metric">{campusRadiusKm}km ZONE</span>
        {targetPax ? <span className="sg-dim-metric">~{targetPax} PAX</span> : null}
      </div>
    </div>
  );
}

/**
 * Master dispatcher for Signal Glyphs.
 */
export default function SignalGlyph({ type = "volume", data = {}, label = "" }) {
  switch (type) {
    case "volume":
      return <SpatialVolumeGlyph data={data} label={label} />;
    case "trend":
      return <TrendGlyph data={data} label={label} />;
    case "pulse":
      return <LocationPulseGlyph data={data} label={label} />;
    case "supply_demand":
      return <SupplyDemandGlyph data={data} label={label} />;
    case "expansion":
      return <ExpansionGlyph data={data} label={label} />;
    default:
      return <SpatialVolumeGlyph data={data} label={label} />;
  }
}
