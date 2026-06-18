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

/* District cluster centres — simulate BGC / Makati / Ortigas / QC from altitude */
const DISTRICTS = [
  [18, 52], [42, 65], [65, 55], [32, 80],
  [78, 60], [52, 73], [14, 70], [88, 52],
  [28, 88], [68, 85], [50, 48], [38, 58],
];

export default function BackgroundStratosphere() {
  const [cityLights, setCityLights] = useState([]);

  useEffect(() => {
    const lights = [];
    for (let i = 0; i < 260; i++) {
      const d = DISTRICTS[i % DISTRICTS.length];
      const spread = 10 + (i % 4) * 4;
      const left = Math.max(1, Math.min(99, d[0] + (rnd(i + 100) - 0.5) * spread * 2));
      const top  = Math.max(4, Math.min(97, d[1] + (rnd(i + 200) - 0.5) * spread));

      const isMajor = rnd(i + 300) < 0.10; // bright landmark / intersection
      const isMid   = rnd(i + 400) < 0.28; // normal street light
      // rest are dim fill lights

      const colorRoll = rnd(i + 500);
      const color = colorRoll < 0.60 ? "#FFB800"
                  : colorRoll < 0.82 ? "#FFC929"
                  : colorRoll < 0.94 ? "#fff4d0"
                  : "#ffeaa0"; // occasional cool white

      lights.push({
        left:    `${left.toFixed(1)}%`,
        top:     `${top.toFixed(1)}%`,
        size: isMajor ? `${(2.2 + rnd(i + 600) * 1.4).toFixed(1)}px`
                      : isMid   ? `${(1.0 + rnd(i + 700) * 0.8).toFixed(1)}px`
                                : `${(0.4 + rnd(i + 800) * 0.5).toFixed(1)}px`,
        opacity: isMajor ? (0.80 + rnd(i + 900)  * 0.20).toFixed(2)
                         : isMid   ? (0.48 + rnd(i + 1000) * 0.32).toFixed(2)
                                   : (0.18 + rnd(i + 1100) * 0.25).toFixed(2),
        color,
        /* box-shadow glow — crisp halo, NOT filter:blur */
        glow: isMajor ? "0 0 4px rgba(255,184,0,0.85), 0 0 9px rgba(255,184,0,0.35)"
                      : isMid   ? "0 0 2px rgba(255,184,0,0.65)"
                                : "none",
      });
    }
    setCityLights(lights);
  }, []);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >

      {/* ── SKY STACK ─────────────────────────────────────────── */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, #010208 0%, #020308 28%, #060609 56%, #070705 100%)" }} />
      <div className="absolute inset-0 s2-sky-cloud"
        style={{ background: "linear-gradient(to bottom, #030510 0%, #060a18 28%, #0a0b10 56%, #090806 100%)" }} />
      <div className="absolute inset-0 s2-sky-sub"
        style={{ background: "linear-gradient(to bottom, #040304 0%, #060505 25%, #0a0804 56%, #0c0a04 100%)" }} />
      <div className="absolute inset-0 s2-sky-city"
        style={{ background: "linear-gradient(to bottom, #060402 0%, #0a0706 22%, #0e0c04 50%, #111006 100%)" }} />

      {/* ── STARS ─────────────────────────────────────────────── */}
      <div className="absolute inset-0 s2-stars">
        {STARS.map((s, i) => (
          <div key={i} className="absolute rounded-full"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, opacity: s.o, background: "#fff7e6" }} />
        ))}
      </div>

      {/* ── ATMOSPHERIC LIMB ──────────────────────────────────── */}
      <div className="absolute s2-atmo"
        style={{
          top: "44%", left: "50%",
          width: "200vw", height: "12vh",
          transform: "translateX(-50%)",
          background: "linear-gradient(to top, rgba(255,155,55,0.55) 0%, rgba(85,145,255,0.28) 55%, transparent 100%)",
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
                  ? `linear-gradient(to right, transparent 0%, rgba(255,200,80,${ln.opacity}) 35%, transparent 100%)`
                  : `linear-gradient(to right, transparent 0%, rgba(200,215,255,${ln.opacity}) 35%, transparent 100%)`,
                animationDuration: `${ln.dur}s`,
                animationDelay: `${ln.delay}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* ── CLOUD RUSH ────────────────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden s2-cloud-layer">
        {CLOUDS.map((c, i) => (
          <div key={i} className="absolute s2-cloud-rush"
            style={{
              left: c.left, top: "50%",
              width: c.width, height: c.height,
              filter: `blur(${c.blur}px)`,
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,227,242,0.92) 0%, transparent 70%)",
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
            }}
          />
        ))}
      </div>

      {/* ── CITY / LAND ───────────────────────────────────────── */}
      {/*  260 individual sharp point-lights + soft district glow blobs.
          The whole block scales toward viewer. Mask fades the top edge.      */}
      <div
        className="absolute inset-x-0 bottom-0 s2-city"
        style={{
          height: "46%",
          transformOrigin: "50% 100%",
          WebkitMaskImage: "linear-gradient(to top, #000 42%, transparent 100%)",
          maskImage:        "linear-gradient(to top, #000 42%, transparent 100%)",
        }}
      >
        {/* Dark earth surface */}
        <div className="absolute inset-0" style={{ backgroundColor: "#050402" }} />

        {/* District ambient glow — large, soft, no repeating pattern */}
        <div className="absolute inset-0" style={{
          backgroundImage:
            "radial-gradient(ellipse 40% 65% at 19% 52%, rgba(255,184,0,0.16), transparent 65%)," +
            "radial-gradient(ellipse 32% 52% at 58% 70%, rgba(255,176,0,0.13), transparent 62%)," +
            "radial-gradient(ellipse 36% 56% at 84% 53%, rgba(255,150,0,0.12), transparent 62%)," +
            "radial-gradient(ellipse 24% 46% at 42% 88%, rgba(255,200,60,0.14), transparent 60%)",
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }} />

        {/* Individual city light points — crisp, sharp, box-shadow glow only */}
        {cityLights.map((lt, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: lt.left, top: lt.top,
              width: lt.size, height: lt.size,
              opacity: lt.opacity,
              backgroundColor: lt.color,
              boxShadow: lt.glow,
            }}
          />
        ))}
      </div>

      {/* ── CITY BLOOM ────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-1/2 s2-bloom"
        style={{
          width: "110vw", height: "48vh",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse 90% 70% at 50% 100%, rgba(255,184,0,0.11) 0%, rgba(255,130,0,0.05) 42%, transparent 72%)",
          filter: "blur(28px)",
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

        @keyframes s2-atmo { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        .s2-atmo { animation: s2-atmo 14s ease-in-out infinite; }

        @keyframes s2-speed-wrap {
          0%, 16% { opacity: 0; } 30%, 80% { opacity: 1; } 96%, 100% { opacity: 0; }
        }
        .s2-speed-wrap { animation: s2-speed-wrap 26s ease-in-out infinite; }

        @keyframes s2-speed-line {
          0%, 8% { opacity: 0; } 28% { opacity: 1; } 72% { opacity: 0.55; } 92%, 100% { opacity: 0; }
        }
        .s2-speed-line { animation: s2-speed-line linear infinite; }

        @keyframes s2-cloud-layer {
          0%, 23% { opacity: 0; } 34%, 62% { opacity: 1; } 78%, 100% { opacity: 0; }
        }
        .s2-cloud-layer { animation: s2-cloud-layer 26s ease-in-out infinite; }

        @keyframes s2-cloud-rush {
          0%   { transform: translateY( 120vh); opacity: 0; }
          8%   { opacity: 1; }
          88%  { opacity: 0.9; }
          100% { transform: translateY(-130vh); opacity: 0; }
        }
        .s2-cloud-rush { animation: s2-cloud-rush linear infinite; will-change: transform, opacity; }

        @keyframes s2-city {
          0%   { transform: scale(0.76); opacity: 0.28; }
          30%  { transform: scale(0.85); opacity: 0.44; }
          62%  { transform: scale(1.00); opacity: 0.68; }
          100% { transform: scale(1.70); opacity: 1;    }
        }
        .s2-city { animation: s2-city 26s cubic-bezier(0.18,0,0.38,1) infinite; will-change: transform, opacity; }

        @keyframes s2-bloom {
          0%, 42% { opacity: 0.12; } 84%, 100% { opacity: 1; }
        }
        .s2-bloom { animation: s2-bloom 26s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .s2-sky-cloud, .s2-sky-sub, .s2-sky-city,
          .s2-stars, .s2-atmo,
          .s2-speed-wrap, .s2-speed-line,
          .s2-cloud-layer, .s2-cloud-rush,
          .s2-city, .s2-bloom { animation: none !important; }
          .s2-city  { transform: scale(1.2); opacity: 0.85; }
          .s2-bloom { opacity: 0.5; }
          .s2-speed-wrap, .s2-cloud-layer { opacity: 0; }
        }

      `}} />
    </div>
  );
}
