/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundCore() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[#000000]" />

      {/* The Core Radiant Gradient Background */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Molten Outer Core Glow */}
        <div 
          className="absolute bg-[#FFB800] rounded-full blur-[120px] opacity-20"
          style={{
            width: `calc(40vw + var(--sp) * 40vw)`,
            height: `calc(40vw + var(--sp) * 40vw)`,
            transform: `scale(calc(1 + sin(var(--sp) * 3.1415)))`
          }}
        />
        {/* Inner Core Solid Shadow */}
        <div 
          className="absolute bg-[#050505] rounded-full shadow-[inset_0_0_100px_#000]"
          style={{
            width: `calc(20vw + var(--sp) * 20vw)`,
            height: `calc(20vw + var(--sp) * 20vw)`,
            opacity: `calc(var(--sp) * 0.8)`
          }}
        />
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#000000] to-transparent" />
    </div>
  );
}
