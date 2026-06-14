/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundMetropolis() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[#0a0a0a]" />

      <div 
        className="absolute w-[200vw] h-[200vh] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          perspective: '1000px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* The Grid Plane */}
        <div 
          className="absolute inset-0 mix-blend-screen"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,184,0,0.35) 2px, transparent 2px),
              linear-gradient(to bottom, rgba(255,184,0,0.35) 2px, transparent 2px)
            `,
            backgroundSize: '120px 120px',
            // Positive Y translates TOWARDS the camera when rotated 60deg X!
            transform: `rotateX(60deg) translateZ(-500px) translateY(calc(var(--sp) * 1000px))`,
            opacity: `calc(0.2 + var(--sp) * 0.8)` // Fades in as we descend
          }}
        >
          {/* Glowing City Nodes */}
          {[...Array(40)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-4 h-4 bg-accent rounded-full shadow-[0_0_25px_#FFB800]"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 41) % 100}%`,
                opacity: `calc(0.4 + (var(--sp) * 0.6))`
              }}
            />
          ))}
        </div>
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#0d0d0d] to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10" />
    </div>
  );
}
