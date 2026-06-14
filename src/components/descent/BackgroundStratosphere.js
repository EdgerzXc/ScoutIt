/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

export default function BackgroundStratosphere() {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#05050a] via-[#081428] to-[#05050a]" />

      {/* Cloud layer 1: Slowest (Background) */}
      <div 
        className="absolute inset-x-0 h-[300%] mix-blend-screen"
        style={{
          opacity: 0.6,
          background: 'radial-gradient(ellipse at center, rgba(100,160,255,0.35) 0%, transparent 60%)',
          backgroundSize: '100% 100%',
          transform: `translateY(calc(var(--sp) * -20%))`, // Moves UP as we descend
        }}
      />

      {/* Cloud layer 2: Medium (Midground) */}
      <div 
        className="absolute inset-x-0 h-[300%] mix-blend-screen"
        style={{
          opacity: 0.8,
          backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,184,0,0.35) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(100,180,255,0.35) 0%, transparent 40%)',
          transform: `translateY(calc(var(--sp) * -40%))`, // Moves UP faster
        }}
      />

      {/* Cloud layer 3: Fast (Foreground wisps) */}
      <div 
        className="absolute inset-x-0 h-[300%] mix-blend-screen"
        style={{
          opacity: 0.7,
          backgroundImage: 'radial-gradient(ellipse at 50% 80%, rgba(255,255,255,0.25) 0%, transparent 60%)',
          transform: `translateY(calc(var(--sp) * -60%))`, // Moves UP fastest
        }}
      />

      {/* Cloud Streaks (Horizontal haze) */}
      <div 
        className="absolute inset-x-0 blur-md mix-blend-screen"
        style={{
          height: '60px',
          top: '30%',
          opacity: 0.15,
          background: 'linear-gradient(to right, transparent, rgba(150,200,255,0.8), transparent)',
          transform: `translateY(calc(var(--sp) * -30px))`,
        }}
      />
      <div 
        className="absolute inset-x-0 blur-lg mix-blend-screen"
        style={{
          height: '80px',
          top: '55%',
          opacity: 0.12,
          background: 'linear-gradient(to right, transparent, rgba(200,220,255,0.6), transparent)',
          transform: `translateY(calc(var(--sp) * -60px))`,
        }}
      />
      <div 
        className="absolute inset-x-0 blur-sm mix-blend-screen"
        style={{
          height: '40px',
          top: '75%',
          opacity: 0.2,
          background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)',
          transform: `translateY(calc(var(--sp) * -90px))`,
        }}
      />

      {/* The Radar UFO - Moves up and scales out to simulate passing it */}
      <div 
        className="absolute w-40 h-[6px] bg-accent shadow-[0_0_30px_#FFB800] rounded-full"
        style={{
          top: `calc(70% - var(--sp) * 60%)`, // Starts low, flies UP
          left: `calc(10% + var(--sp) * 80%)`,
          transform: `rotate(15deg) scale(calc(1 + var(--sp) * 2))`,
          opacity: `calc(1 - var(--sp) * 0.8)` // Fades out as we pass it
        }}
      />

      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
    </div>
  );
}
