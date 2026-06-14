/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundMetropolis() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Dark background */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      {/* Amber glow at vanishing point */}
      <div 
        className="absolute inset-0 mix-blend-screen"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(255,184,0,0.15) 0%, transparent 60%)'
        }}
      />

      {/* Perspective Grid Container */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translateY(calc(var(--sp) * -20px))`
        }}
      >
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <g stroke="#FFB800" strokeWidth="1" style={{ opacity: 0.35 }}>
            {/* Radiating perspective lines */}
            <line x1="50%" y1="30%" x2="-50%" y2="100%" />
            <line x1="50%" y1="30%" x2="-20%" y2="100%" />
            <line x1="50%" y1="30%" x2="10%" y2="100%" />
            <line x1="50%" y1="30%" x2="35%" y2="100%" />
            <line x1="50%" y1="30%" x2="50%" y2="100%" />
            <line x1="50%" y1="30%" x2="65%" y2="100%" />
            <line x1="50%" y1="30%" x2="90%" y2="100%" />
            <line x1="50%" y1="30%" x2="120%" y2="100%" />
            <line x1="50%" y1="30%" x2="150%" y2="100%" />

            {/* Horizontal cross lines with increasing spacing */}
            <line x1="0" y1="35%" x2="100%" y2="35%" />
            <line x1="0" y1="42%" x2="100%" y2="42%" />
            <line x1="0" y1="52%" x2="100%" y2="52%" />
            <line x1="0" y1="65%" x2="100%" y2="65%" />
            <line x1="0" y1="82%" x2="100%" y2="82%" />
            <line x1="0" y1="100%" x2="100%" y2="100%" />
          </g>
        </svg>

        {/* Glowing City Nodes (keeping logic, adapting positioning) */}
        {[...Array(40)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-2 h-2 bg-accent rounded-full shadow-[0_0_15px_#FFB800]"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${30 + ((i * 41) % 70)}%`, // keep nodes below horizon line (30%)
              opacity: `calc(0.4 + (var(--sp) * 0.6))`
            }}
          />
        ))}
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#0d0d0d] to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10" />
    </div>
  );
}
