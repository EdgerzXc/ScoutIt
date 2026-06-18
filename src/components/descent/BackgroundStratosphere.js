"use client";

import { useEffect, useState } from "react";

/**
 * Layer 02 — Stratosphere: POV Skydiver Descent
 *
 * 26-second seamless loop:
 *   0–25%   HIGH ALTITUDE   cold space, stars, thin air
 *   25–58%  CLOUD PUNCH     white smear banks fly upward past camera
 *   58–80%  SUB-CLOUD       clearing, warm haze, city grid emerging
 *   80–100% CITY APPROACH   240 individual gold light points zoom up — cinematic
 *
 * City uses individual <div> point-lights (sharp, no blur) — same approach as
 * BackgroundOrbit.js stars. No blurry repeating gradients.
 */

function rnd(seed) {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const STARS = Array.from({ length: 38 }, (_, i) => ({
  left: `${(rnd(i + 3)  * 100).toFixed(1)}%`,
  top:  `${(rnd(i + 41) *  50).toFixed(1)}%`,
  size: `${(rnd(i + 5)  * 1.4 + 0.4).toFixed(1)}px`,
  o:     (rnd(i + 9)  * 0.45 + 0.12).toFixed(2),
}));

const SPEED_LINES = Array.from({ length: 28 }, (_, i) => ({
  angle:   ((i / 28) * 360).toFixed(1),
  len:     (10 + rnd(i + 7)  * 28).toFixed(1),
  delay:  (-(rnd(i + 13) * 4.5)).toFixed(2),
  dur:     (1.6 + rnd(i + 17) * 2.2).toFixed(2),
  opacity: (0.07 + rnd(i + 21) * 0.20).toFixed(2),
  warm:    i % 5 === 0,
}));

const CLOUDS = Array.from({ length: 8 }, (_, i) => ({
  left:   `${(rnd(i + 31) * 85 - 5).toFixed(1)}%`,
  width:  `${(26 + rnd(i + 37) * 62).toFixed(0)}vw`,
  height: `${(7  + rnd(i + 43) * 18).toFixed(0)}vh`,
  blur:   Math.round(14 + rnd(i + 47) * 26),
  dur:    (2.0 + rnd(i + 53) * 2.2).toFixed(1),
  delay:  (-(rnd(i + 59) * 4.4)).toFixed(1),
}));

/* District cluster centres removed — replaced with photorealistic image */

export default function BackgroundStratosphere() {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >

      {/* ── SKY STACK ─────────────────────────────────────────── */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, #010101 0%, #020202 28%, #030303 56%, #050505 100%)" }} />
      <div className="absolute inset-0 s2-sky-cloud"
        style={{ background: "linear-gradient(to bottom, #020202 0%, #040404 28%, #060606 56%, #080808 100%)" }} />
      <div className="absolute inset-0 s2-sky-sub"
        style={{ background: "linear-gradient(to bottom, #040404 0%, #050505 25%, #080808 56%, #0a0a0a 100%)" }} />
      <div className="absolute inset-0 s2-sky-city"
        style={{ background: "linear-gradient(to bottom, #050505 0%, #080808 22%, #0a0a0a 50%, #0d0d0d 100%)" }} />

      {/* ── STARS ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 s2-stars">
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.o, background: "#FFB800" }} />
        ))}
      </div>

      {/* ── ATMOSPHERIC HORIZON ───────────────────────────────── */}
      <div className="absolute s2-atmo"
        style={{
          top: "44%", left: "50%",
          width: "200vw", height: "12vh",
          transform: "translateX(-50%)",
          background: "linear-gradient(to top, rgba(255,184,0,0.85) 0%, rgba(255,184,0,0.15) 55%, transparent 100%)",
          borderRadius: "50%",
          filter: "blur(12px)",
          mixBlendMode: "screen",
        }}
      />

      {/* ── SPEED LINES ───────────────────────────────────────── */}
      <div className="absolute inset-0 s2-speed-wrap">
        {SPEED_LINES.map((ln, i) => (
          <div key={i} className="absolute"
            style={{ left: "50%", top: "47%", width: `${ln.len}vw`, height: "1px", transformOrigin: "0% 50%", transform: `rotate(${ln.angle}deg)` }}>
            <div className="s2-speed-line"
              style={{
                width: "100%", height: "100%",
                background: ln.warm
                  ? `linear-gradient(to right, transparent 0%, rgba(255,184,0,${ln.opacity}) 35%, transparent 100%)`
                  : `linear-gradient(to right, transparent 0%, rgba(255,201,41,${ln.opacity}) 35%, transparent 100%)`,
                animationDuration: `${ln.dur}s`,
                animationDelay: `${ln.delay}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── CLOUD RUSH — POV punch-through ───────────────────── */}
      {/* Clouds start small/centered (distant, ahead of you), scale up fast,
          then smear off the top — like punching through from above           */}
      <div className="absolute inset-0 overflow-hidden s2-cloud-layer">
        {CLOUDS.map((c, i) => (
          <div key={i} className="absolute s2-cloud-punch"
            style={{
              left: c.left,
              top: "38%",
              width: c.width,
              height: c.height,
              filter: `blur(${Math.round(c.blur * 0.6)}px)`,
              background: "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(15,10,0,0.95) 0%, rgba(255,184,0,0.20) 45%, transparent 72%)",
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
              transformOrigin: "50% 50%",
            }}
          />
        ))}
        {/* Full-screen gold flash at peak punch-through */}
        <div className="absolute inset-0 s2-cloud-flash"
          style={{ background: "rgba(255,184,0,0.55)", pointerEvents: "none" }} />
      </div>

      {/* ── CITY / LAND ───────────────────────────────────────── */}
      {/* High-res photorealistic city lighting mapped directly into the scale animation */}
      <div
        className="absolute inset-x-0 bottom-0 s2-city"
        style={{
          height: "55%",
          transformOrigin: "50% 100%",
          WebkitMaskImage: "linear-gradient(to top, #000 35%, transparent 100%)",
          maskImage:        "linear-gradient(to top, #000 35%, transparent 100%)",
        }}
      >
        {/* Dark earth surface */}
        <div className="absolute inset-0" style={{ backgroundColor: "#020202" }} />

        {/* Photorealistic City Grid Image */}
        <div className="absolute inset-0" style={{
          backgroundImage: "url(/assets/stratosphere_city.png)",
          backgroundSize: "cover",
          backgroundPosition: "center 70%",
          mixBlendMode: "screen",
          opacity: 0.95,
        }} />
      </div>

      {/* ── CITY BLOOM ────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-1/2 s2-bloom"
        style={{
          width: "120vw", height: "55vh",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse 95% 75% at 50% 100%, rgba(255,184,0,0.35) 0%, rgba(255,130,0,0.15) 50%, transparent 75%)",
          filter: "blur(32px)",
        }}
      />

      {/* ── POV VIGNETTE ──────────────────────────────────────── */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 74% 70% at 50% 46%, transparent 36%, rgba(0,0,0,0.76) 100%)" }} />

      {/* ── KEYFRAMES ─────────────────────────────────────────── */}
      <style dangerouslySetInnerHTML={{ __html: `

        @keyframes s2-sky-cloud {
          0%, 22% { opacity: 0; } 30%, 55% { opacity: 1; } 68%, 100% { opacity: 0; }
        }
        .s2-sky-cloud { animation: s2-sky-cloud 26s ease-in-out infinite; }

        @keyframes s2-sky-sub {
          0%, 55% { opacity: 0; } 66%, 78% { opacity: 1; } 90%, 100% { opacity: 0; }
        }
        .s2-sky-sub { animation: s2-sky-sub 26s ease-in-out infinite; }

        @keyframes s2-sky-city {
          0%, 74% { opacity: 0; } 86%, 100% { opacity: 1; }
        }
        .s2-sky-city { animation: s2-sky-city 26s ease-in-out infinite; }

        @keyframes s2-stars {
          0%, 18% { opacity: 1; } 34%, 100% { opacity: 0; }
        }
        .s2-stars { animation: s2-stars 26s ease-in-out infinite; }

        @keyframes s2-atmo { 
          0%, 28% { opacity: 0.8; } 
          42%, 100% { opacity: 0; } 
        }
        .s2-atmo { animation: s2-atmo 26s ease-in-out infinite; }

        @keyframes s2-speed-wrap {
          0%, 16% { opacity: 0; } 30%, 80% { opacity: 1; } 96%, 100% { opacity: 0; }
        }
        .s2-speed-wrap { animation: s2-speed-wrap 26s ease-in-out infinite; }

        @keyframes s2-speed-line {
          0%, 8% { opacity: 0; } 28% { opacity: 1; } 72% { opacity: 0.55; } 92%, 100% { opacity: 0; }
        }
        .s2-speed-line { animation: s2-speed-line linear infinite; }

        @keyframes s2-cloud-layer {
          0%, 20% { opacity: 0; } 30%, 65% { opacity: 1; } 80%, 100% { opacity: 0; }
        }
        .s2-cloud-layer { animation: s2-cloud-layer 26s ease-in-out infinite; }

        /* Cloud punch-through: starts small/distant at center,
           scales up like it's rushing AT camera, smears off top */
        @keyframes s2-cloud-punch {
          0%   { transform: scale(0.08) translateY(0);   opacity: 0; }
          12%  { transform: scale(0.22) translateY(-4vh); opacity: 0.6; }
          35%  { transform: scale(0.65) translateY(-12vh); opacity: 0.95; }
          60%  { transform: scale(1.6)  translateY(-28vh); opacity: 0.85; }
          82%  { transform: scale(3.2)  translateY(-55vh); opacity: 0.4; }
          100% { transform: scale(5.0)  translateY(-90vh); opacity: 0; }
        }
        .s2-cloud-punch { animation: s2-cloud-punch ease-in infinite; will-change: transform, opacity; }

        @keyframes s2-cloud-flash {
          0%, 28%  { opacity: 0; }
          42%      { opacity: 0.55; }
          58%      { opacity: 0; }
          100%     { opacity: 0; }
        }
        .s2-cloud-flash { animation: s2-cloud-flash 26s ease-in-out infinite; pointer-events: none; }

        @keyframes s2-city {
          0%   { transform: scale(0.65); opacity: 0; }
          40%  { transform: scale(0.85); opacity: 0.25; }
          65%  { transform: scale(1.00); opacity: 0.85; }
          100% { transform: scale(2.20); opacity: 1;    }
        }
        .s2-city { animation: s2-city 26s cubic-bezier(0.3,0,0.2,1) infinite; will-change: transform, opacity; }

        @keyframes s2-bloom {
          0%, 42% { opacity: 0.12; } 84%, 100% { opacity: 1; }
        }
        .s2-bloom { animation: s2-bloom 26s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .s2-sky-cloud, .s2-sky-sub, .s2-sky-city,
          .s2-stars, .s2-atmo,
          .s2-speed-wrap, .s2-speed-line,
          .s2-cloud-layer, .s2-cloud-punch, .s2-cloud-flash,
          .s2-city, .s2-bloom { animation: none !important; }
          .s2-city  { transform: scale(1.2); opacity: 0.85; }
          .s2-bloom { opacity: 0.5; }
          .s2-speed-wrap, .s2-cloud-layer { opacity: 0; }
        }

      `}} />
    </div>
  );
}
