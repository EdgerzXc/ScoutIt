"use client";

import { useState } from "react";

export default function VicinityRadar({ data = [] }) {
  const [hoveredItem, setHoveredItem] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="radar-empty-state">
        [ NO VICINITY RADAR DATA AVAILABLE ]
      </div>
    );
  }

  // Helper to parse distance to a relative radius percentage (15% to 85%)
  const getRadius = (distanceText = "") => {
    const text = distanceText.toLowerCase();
    // Extract numbers from distance string
    const match = text.match(/\d+/);
    const num = match ? parseInt(match[0], 10) : 5;

    if (text.includes("walk")) {
      // Very close: 15% to 35% radius
      return 15 + Math.min(num * 3, 20);
    } else if (text.includes("drive")) {
      // Moderately far: 45% to 75% radius
      return 45 + Math.min(num * 1.5, 30);
    } else if (text.includes("boat")) {
      // Very far: 75% to 85% radius
      return 75 + Math.min(num * 0.5, 10);
    }
    // Default fallback radius
    return 40 + (num % 5) * 8;
  };

  // Process data items into plotted coordinate nodes
  const nodes = data.map((item, index) => {
    const radius = getRadius(item.distance);
    // Evenly distribute angles around 360 degrees
    const angleDegree = (index * (360 / data.length) + 45) % 360;
    const angleRad = (angleDegree * Math.PI) / 180;
    
    // Coordinates relative to 50, 50 center
    const x = 50 + radius * Math.cos(angleRad);
    const y = 50 + radius * Math.sin(angleRad);

    return {
      ...item,
      x,
      y,
      radius,
      angleDegree,
      id: index
    };
  });

  return (
    <div className="radar-container">
      {/* HUD Info Header */}
      <div className="radar-header">
        <div className="hud-metric">
          <span className="hud-label">RADAR RANGE</span>
          <span className="hud-value">5KM RADIAL GRID</span>
        </div>
        <div className="hud-metric">
          <span className="hud-label">TARGETS</span>
          <span className="hud-value">{data.length} IN VICINITY</span>
        </div>
      </div>

      <div className="radar-canvas-wrapper">
        <svg className="radar-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Concentric distance rings */}
          <circle cx="50" cy="50" r="15" className="radar-grid-ring" />
          <circle cx="50" cy="50" r="30" className="radar-grid-ring" />
          <circle cx="50" cy="50" r="45" className="radar-grid-ring" />
          <circle cx="50" cy="50" r="45" className="radar-grid-ring outer" strokeDasharray="1 3" />

          {/* Crosshairs */}
          <line x1="50" y1="5" x2="50" y2="95" className="radar-grid-line" />
          <line x1="5" y1="50" x2="95" y2="50" className="radar-grid-line" />

          {/* Animated Sweeper line */}
          <g className="radar-sweep-group">
            <line x1="50" y1="50" x2="50" y2="5" className="radar-sweep-line" />
            <path d="M 50,50 L 50,5 A 45,45 0 0,1 72.5,11.0 Z" className="radar-sweep-trail" />
          </g>

          {/* Connection Line to Hovered Item */}
          {hoveredItem !== null && (
            <line
              x1="50"
              y1="50"
              x2={nodes[hoveredItem].x}
              y2={nodes[hoveredItem].y}
              className="radar-target-line"
            />
          )}

          {/* Center Target (The Property) */}
          <g className="center-target">
            <circle cx="50" cy="50" r="3" className="center-pulse" />
            <circle cx="50" cy="50" r="1.5" className="center-dot" />
          </g>

          {/* Plotted Targets */}
          {nodes.map((node) => {
            const isHovered = hoveredItem === node.id;
            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredItem(node.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`radar-target-group ${isHovered ? "active" : ""}`}
              >
                {/* Glow ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="3.5"
                  className="target-glow"
                />
                {/* Visual pin */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="1.2"
                  className="target-dot"
                />
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip HUD Card */}
        <div className={`radar-hud-card ${hoveredItem !== null ? "visible" : ""}`}>
          {hoveredItem !== null && (
            <>
              <div className="card-top">
                <span className="card-category">{nodes[hoveredItem].category || "VICINITY"}</span>
                <span className="card-distance">{nodes[hoveredItem].distance}</span>
              </div>
              <div className="card-title">{nodes[hoveredItem].name}</div>
              <div className="card-footer">
                <span>BEARING: {Math.round(nodes[hoveredItem].angleDegree)}° NNE</span>
                <span>RANGE: {nodes[hoveredItem].radius * 50}m EST</span>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .radar-container {
          background: rgba(14, 14, 14, 0.45);
          border: 0.5px solid #262626;
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          position: relative;
          overflow: hidden;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
        }

        .radar-empty-state {
          padding: 48px;
          color: #6a6a6a;
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.15em;
          text-align: center;
        }

        .radar-header {
          display: flex;
          justify-content: space-between;
          width: 100%;
          border-bottom: 0.5px solid #222;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .hud-metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .hud-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #5a5a5a;
          letter-spacing: 0.1em;
        }

        .hud-value {
          font-family: var(--font-mono);
          font-size: 11px;
          color: #c8a96e;
          font-weight: 500;
          letter-spacing: 0.05em;
        }

        .radar-canvas-wrapper {
          position: relative;
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1;
        }

        .radar-svg {
          width: 100%;
          height: 100%;
          background: transparent;
          overflow: visible;
        }

        /* Radar Grid styling */
        .radar-grid-ring {
          fill: none;
          stroke: #1f1f1f;
          stroke-width: 0.25;
        }

        .radar-grid-ring.outer {
          stroke: #2a2a2a;
          stroke-width: 0.3;
        }

        .radar-grid-line {
          stroke: #1f1f1f;
          stroke-width: 0.2;
        }

        /* Animated Radar Sweep */
        .radar-sweep-group {
          transform-origin: 50px 50px;
          animation: sweep 4s linear infinite;
        }

        .radar-sweep-line {
          stroke: rgba(200, 169, 110, 0.45);
          stroke-width: 0.3;
        }

        .radar-sweep-trail {
          fill: url(#sweepGradient);
          opacity: 0.15;
        }

        @keyframes sweep {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        /* Target lines and dots */
        .radar-target-line {
          stroke: rgba(200, 169, 110, 0.4);
          stroke-width: 0.25;
          stroke-dasharray: 1 1;
        }

        .center-target {
          cursor: crosshair;
        }

        .center-pulse {
          fill: none;
          stroke: #c8a96e;
          stroke-width: 0.3;
          transform-origin: 50px 50px;
          animation: pulse 2s ease-out infinite;
        }

        .center-dot {
          fill: #c8a96e;
        }

        @keyframes pulse {
          0% {
            r: 1.5;
            opacity: 1;
          }
          100% {
            r: 7;
            opacity: 0;
          }
        }

        .radar-target-group {
          cursor: pointer;
        }

        .target-dot {
          fill: #8a8a8a;
          transition: all 0.2s ease;
        }

        .target-glow {
          fill: none;
          stroke: #c8a96e;
          stroke-width: 0.5;
          opacity: 0;
          transition: all 0.25s ease;
          transform-origin: center;
        }

        .radar-target-group:hover .target-dot,
        .radar-target-group.active .target-dot {
          fill: #c8a96e;
          scale: 1.3;
        }

        .radar-target-group:hover .target-glow,
        .radar-target-group.active .target-glow {
          opacity: 0.4;
          stroke-width: 0.8;
          animation: pulse 1.5s ease-out infinite;
        }

        /* Tooltip Card styling */
        .radar-hud-card {
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          background: rgba(18, 18, 18, 0.85);
          border: 0.5px solid #2d2a24;
          border-radius: 4px;
          padding: 8px 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 2px;
          pointer-events: none;
        }

        .radar-hud-card.visible {
          bottom: 10px;
          opacity: 1;
          visibility: visible;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-category {
          font-family: var(--font-mono);
          font-size: 8px;
          color: #c8a96e;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .card-distance {
          font-family: var(--font-mono);
          font-size: 9px;
          color: #f0ede8;
          font-weight: 600;
        }

        .card-title {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 11px;
          color: #f0ede8;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 7.5px;
          color: #6a6a6a;
          margin-top: 4px;
          border-top: 0.5px solid #222;
          padding-top: 4px;
        }
      `}</style>
      
      {/* SVG Gradient definition injected globally */}
      <svg style={{ height: 0, width: 0, position: "absolute" }}>
        <defs>
          <linearGradient id="sweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8a96e" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#c8a96e" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c8a96e" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
