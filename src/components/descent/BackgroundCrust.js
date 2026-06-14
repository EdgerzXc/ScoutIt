/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundCrust() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-[#151210]" />

      {/* Geologic Strata Background (Translates UP heavily to simulate tunneling DOWN) */}
      <div 
        className="absolute inset-x-0 w-full"
        style={{
          height: '250%', // Extra height to allow scrolling
          top: '-50%',
          transform: `translateY(calc(var(--sp) * -40%))`, // Negative translateY means it moves UP! This is correct for descending.
        }}
      >
        {/* Strata Textures */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-[#151210] to-[#1a1614] border-b-[8px] border-[#2a2420]" />
        <div className="absolute inset-x-0 top-[30%] h-[40%] bg-[#1a1614] border-b-[12px] border-[#110e0c]">
          {/* Gold Veins */}
          <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
            <path d="M0,50 Q200,100 400,20 T800,150 T1200,80" fill="none" stroke="#FFB800" strokeWidth="4" className="drop-shadow-[0_0_12px_#FFB800]" />
            <path d="M0,150 Q300,50 600,120 T1200,180" fill="none" stroke="#FFB800" strokeWidth="3" className="drop-shadow-[0_0_8px_#FFB800]" />
            <path d="M0,250 Q400,150 800,220 T1200,280" fill="none" stroke="#FFB800" strokeWidth="2" className="drop-shadow-[0_0_6px_#FFB800]" />
          </svg>
        </div>
        <div className="absolute inset-x-0 top-[70%] h-[30%] bg-[#0f0c0a] border-b-[4px] border-[#3a2000]" />
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#151210] to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#000000] to-transparent z-10" />
    </div>
  );
}
