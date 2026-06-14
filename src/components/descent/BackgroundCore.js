/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundCore() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {/* Base black */}
      <div className="absolute inset-0 bg-[#000000]" />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes corePulse {
          0% { opacity: 0.5; }
          50% { opacity: 0.8; }
          100% { opacity: 0.5; }
        }
      `}} />

      {/* The Core Radiant Gradient Background */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: `scale(calc(1 + var(--sp) * 0.3))`
        }}
      >
        {/* Center Glow (Pulsing Heat) */}
        <div 
          className="absolute inset-0"
          style={{
            animation: 'corePulse 3s ease-in-out infinite',
            background: 'radial-gradient(circle at center, rgba(255,140,0,0.6) 0%, rgba(255,80,0,0.2) 40%, transparent 70%)'
          }}
        />

        {/* Second Ring (Mix Blend Screen) */}
        <div 
          className="absolute inset-0 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,184,0,0.3) 0%, transparent 50%)'
          }}
        />
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#000000] to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#000000] to-transparent z-10" />
    </div>
  );
}
