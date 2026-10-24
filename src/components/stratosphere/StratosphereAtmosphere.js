"use client";

import React from "react";
import "./stratosphere-atmosphere.css";

/**
 * StratosphereAtmosphere — Layer 02 Atmospheric Spatial Telemetry Vector Graphic
 *
 * Implements high-altitude isobar elevation curves, aerospace radar range rings,
 * spatial flight corridor vectors, coordinate telemetry stamps, and silky GPU
 * motionmaxxing stream flows behind the Stratosphere hero header.
 *
 * Design constraints:
 * - 95% deep obsidian, 5% gold design tokens (var(--accent), var(--accent-bright), var(--accent-muted))
 * - Zero pointer interference (pointer-events: none, z-index: 0)
 * - Zero cumulative layout shift (CLS = 0)
 * - Full responsive SVG scaling (preserveAspectRatio="xMidYMid slice")
 * - prefers-reduced-motion safe
 */
export default function StratosphereAtmosphere() {
  return (
    <div className="sw-atmosphere-container" aria-hidden="true">
      <svg
        className="sw-atmosphere-svg"
        viewBox="0 0 1600 680"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Ambient Stratospheric Golden Aura Gradient */}
          <radialGradient
            id="stratAtmosphereAura"
            cx="75%"
            cy="32%"
            r="65%"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.14" />
            <stop offset="42%" stopColor="var(--accent-muted)" stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0" />
          </radialGradient>

          {/* Primary High-Altitude Jetstream Gradient */}
          <linearGradient id="stratStreamGradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.0" />
            <stop offset="20%" stopColor="var(--accent-muted)" stopOpacity="0.35" />
            <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="80%" stopColor="var(--accent-bright)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>

          {/* Secondary Harmonic Wave Gradient */}
          <linearGradient id="stratStreamGradSecondary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-muted)" stopOpacity="0.0" />
            <stop offset="35%" stopColor="var(--accent)" stopOpacity="0.3" />
            <stop offset="75%" stopColor="var(--accent-muted)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent-muted)" stopOpacity="0.0" />
          </linearGradient>

          {/* Radar Sweep Radial Gradient */}
          <linearGradient id="stratSweepBeam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-bright)" stopOpacity="0.45" />
            <stop offset="40%" stopColor="var(--accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Ambient atmospheric backdrop illumination */}
        <rect width="1600" height="680" fill="url(#stratAtmosphereAura)" className="sw-atmosphere-glow" />

        {/* ── 1. STRATOSPHERIC ISOBAR & ELEVATION CONTOURS ── */}
        <g className="sw-isobar-group">
          {/* Top Delicate Altitude Wave */}
          <path
            d="M -120,130 Q 340,50 740,150 T 1380,100 T 1750,170"
            stroke="var(--accent-muted)"
            strokeWidth="1"
            strokeOpacity="0.25"
          />

          {/* Primary High-Altitude Jetstream with MotionMaxxing Flow */}
          <path
            d="M -120,220 Q 320,120 780,250 T 1400,180 T 1750,270"
            stroke="url(#stratStreamGradPrimary)"
            strokeWidth="1.75"
            strokeDasharray="14 10 32 10"
            className="sw-stream-dash sw-stream-primary"
          />

          {/* Harmonic Wave Contour */}
          <path
            d="M -120,310 Q 380,230 820,350 T 1440,280 T 1750,360"
            stroke="url(#stratStreamGradSecondary)"
            strokeWidth="1.2"
            strokeDasharray="8 14"
            className="sw-stream-dash sw-stream-secondary"
          />

          {/* Tropospheric Transition Boundary */}
          <path
            d="M -120,410 Q 420,320 860,440 T 1460,380 T 1750,470"
            stroke="var(--accent-muted)"
            strokeWidth="1"
            strokeOpacity="0.22"
            strokeDasharray="4 10"
          />

          {/* Baseline Spatial Grid Vector */}
          <path
            d="M -120,510 Q 450,430 900,530 T 1480,480 T 1750,550"
            stroke="var(--border)"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
        </g>

        {/* ── 2. HIGH-ALTITUDE SPATIAL RADAR ARRAY (Centered at X=1180, Y=220) ── */}
        <g className="sw-radar-array-group">
          {/* Concentric Range Rings */}
          <circle
            cx="1180"
            cy="220"
            r="85"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
          <circle
            cx="1180"
            cy="220"
            r="180"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeOpacity="0.2"
            strokeDasharray="5 7"
          />
          <circle
            cx="1180"
            cy="220"
            r="290"
            stroke="var(--accent-muted)"
            strokeWidth="1"
            strokeOpacity="0.14"
            strokeDasharray="3 7"
          />
          <circle
            cx="1180"
            cy="220"
            r="420"
            stroke="var(--accent-muted)"
            strokeWidth="1"
            strokeOpacity="0.08"
          />

          {/* Radar Angular Axis Crosshairs */}
          <line
            x1="760"
            y1="220"
            x2="1600"
            y2="220"
            stroke="var(--accent-muted)"
            strokeWidth="0.8"
            strokeOpacity="0.2"
            strokeDasharray="4 6"
          />
          <line
            x1="1180"
            y1="-60"
            x2="1180"
            y2="500"
            stroke="var(--accent-muted)"
            strokeWidth="0.8"
            strokeOpacity="0.2"
            strokeDasharray="4 6"
          />
          <line
            x1="880"
            y1="-80"
            x2="1480"
            y2="520"
            stroke="var(--accent-muted)"
            strokeWidth="0.6"
            strokeOpacity="0.12"
            strokeDasharray="2 8"
          />
          <line
            x1="880"
            y1="520"
            x2="1480"
            y2="-80"
            stroke="var(--accent-muted)"
            strokeWidth="0.6"
            strokeOpacity="0.12"
            strokeDasharray="2 8"
          />

          {/* Sweeping Radar Beam (GPU Transform Animation) */}
          <g className="sw-sweep-beam-pivot">
            <line
              x1="1180"
              y1="220"
              x2="1470"
              y2="220"
              stroke="url(#stratSweepBeam)"
              strokeWidth="2"
            />
            <polygon
              points="1180,220 1465,195 1470,220"
              fill="url(#stratSweepBeam)"
              opacity="0.35"
            />
          </g>
        </g>

        {/* ── 3. HIGH-SPEED TRANSIT ARTERIAL VECTORS & WAYPOINTS ── */}
        <g className="sw-transit-vectors">
          <path
            d="M 160,560 L 320,120 L 780,250 L 1180,220 L 1420,180"
            stroke="var(--accent)"
            strokeWidth="1"
            strokeOpacity="0.32"
            strokeDasharray="6 6"
          />
        </g>

        {/* ── 4. TELEMETRY STATIONS & SENSOR NODES ── */}
        <g className="sw-sensor-nodes">
          {/* Station 01: High-Altitude Western Corridor */}
          <g transform="translate(320, 120)">
            <circle r="3" fill="var(--accent-bright)" />
            <circle r="12" fill="none" stroke="var(--accent)" strokeWidth="1" className="sw-node-pulse" />
            <text x="14" y="4" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent)" letterSpacing="0.08em">
              ALT 32,400M · SENSOR 01
            </text>
          </g>

          {/* Station 02: Central Metro Manila Apex */}
          <g transform="translate(780, 250)">
            <circle r="3.5" fill="var(--accent-bright)" />
            <circle r="16" fill="none" stroke="var(--accent-bright)" strokeWidth="1" className="sw-node-pulse sw-node-pulse--delay" />
            <text x="16" y="4" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-bright)" letterSpacing="0.08em">
              14.5547° N · 121.0244° E [NCR-BGC]
            </text>
          </g>

          {/* Station 03: Radar Center Origin Beacon */}
          <g transform="translate(1180, 220)">
            <circle r="22" fill="var(--accent)" fillOpacity="0.12" />
            <circle r="4" fill="var(--accent-bright)" />
            <circle r="10" fill="none" stroke="var(--accent-bright)" strokeWidth="1.2" className="sw-node-pulse" />
            <text x="18" y="-8" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent)" letterSpacing="0.1em">
              STRATOSPHERIC RADAR ARRAY · 589nm
            </text>
          </g>

          {/* Station 04: Eastern Telemetry Waypoint */}
          <g transform="translate(1420, 180)">
            <circle r="3" fill="var(--accent-bright)" />
            <circle r="12" fill="none" stroke="var(--accent)" strokeWidth="1" className="sw-node-pulse sw-node-pulse--delay2" />
            <text x="14" y="4" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-muted)" letterSpacing="0.08em">
              RADIAL 072° · INTEL GRID
            </text>
          </g>
        </g>

        {/* ── 5. VERNIER ELEVATION SCALE TICKS (Left Margin) ── */}
        <g className="sw-vernier-scale" opacity="0.45">
          <line x1="12" y1="90" x2="26" y2="90" stroke="var(--accent)" strokeWidth="1" />
          <text x="32" y="94" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-muted)">+35K M</text>

          <line x1="18" y1="170" x2="26" y2="170" stroke="var(--accent-muted)" strokeWidth="1" />
          <text x="32" y="174" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-muted)">+30K M</text>

          <line x1="12" y1="250" x2="26" y2="250" stroke="var(--accent)" strokeWidth="1" />
          <text x="32" y="254" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent)">+25K M [STRATO]</text>

          <line x1="18" y1="330" x2="26" y2="330" stroke="var(--accent-muted)" strokeWidth="1" />
          <text x="32" y="334" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-muted)">+20K M</text>

          <line x1="12" y1="410" x2="26" y2="410" stroke="var(--accent-muted)" strokeWidth="1" />
          <text x="32" y="414" fontFamily="var(--font-mono)" fontSize="12" fill="var(--accent-muted)">+15K M</text>
        </g>
      </svg>
    </div>
  );
}
