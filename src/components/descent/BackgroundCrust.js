/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundCrust() {
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
        {/* Strata Textures - 4 distinct bands */}
        <div className="absolute inset-x-0 top-0 h-[25%] bg-[#111008] border-b-[8px] border-[#151210]" />
        
        <div className="absolute inset-x-0 top-[25%] h-[25%] bg-[#151210] border-b-[12px] border-[#1a1614]">
          {/* Gold Veins - keeping existing path logic but wrapped inside the band or covering the whole thing */}
        </div>

        <div className="absolute inset-x-0 top-[50%] h-[25%] bg-[#1a1614] border-b-[6px] border-[#111008]" />
        
        <div className="absolute inset-x-0 top-[75%] h-[25%] bg-[#111008]" />

        {/* Gold Veins SVG covering the strata */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }} preserveAspectRatio="none">
          <path d="M0,50 Q200,100 400,20 T800,150 T1200,80" fill="none" stroke="#FFB800" strokeWidth="4" className="drop-shadow-[0_0_12px_#FFB800]" />
          <path d="M0,150 Q300,50 600,120 T1200,180" fill="none" stroke="#FFB800" strokeWidth="3" className="drop-shadow-[0_0_8px_#FFB800]" />
          <path d="M0,250 Q400,150 800,220 T1200,280" fill="none" stroke="#FFB800" strokeWidth="2" className="drop-shadow-[0_0_6px_#FFB800]" />
        </svg>
      </div>

      <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#151210] to-transparent z-10" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#000000] to-transparent z-10" />
    </div>
  );
}
