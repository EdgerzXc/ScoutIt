"use client";

/**
 * AmbientSound — a procedurally generated "deep space" drone, synthesized live
 * with the Web Audio API. No audio file is shipped or hosted: the mood is built
 * from detuned oscillators (open fifths/octaves), a slow breathing filter, and a
 * synthesized reverb tail for cinematic space.
 *
 * Browsers block audio until a user gesture, so the engine only starts when a
 * "scoutit:start-ambient" event fires (dispatched by the hero CTAs on click).
 * A floating control then lets the visitor mute/unmute, and the choice is
 * remembered so we never force sound on someone who turned it off.
 */

import { useEffect, useRef, useState } from "react";

const PREF_KEY = "scoutit_ambient"; // "on" | "off"
const TARGET_GAIN = 0.16; // subtle — atmosphere, not a soundtrack
const FADE_IN = 4.0;
const FADE_OUT = 1.4;

// Open, emotionally-neutral chord (A1 · E2 · A2 · E3) — vast rather than happy/sad.
const VOICES = [55.0, 82.41, 110.0, 164.81];

// Build a noise-decay impulse response so the convolver reverb gives real depth.
function makeImpulse(ctx, seconds, decay) {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

export default function AmbientSound() {
  const [mounted, setMounted] = useState(false);
  const [started, setStarted] = useState(false); // engine created at least once
  const [playing, setPlaying] = useState(false);

  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const nodesRef = useRef([]); // oscillators/LFOs to stop on teardown

  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Engine lifecycle ──────────────────────────────────────────────────
  const buildEngine = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    const ctx = new AudioCtx();
    ctxRef.current = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    // Warm, deep tone: keep highs out of the way.
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 640;
    lowpass.Q.value = 0.7;

    // Reverb for cinematic space (dry + wet blend).
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx, 3.6, 2.4);
    const wet = ctx.createGain();
    wet.gain.value = 0.55;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;
    lowpass.connect(dry).connect(master);
    lowpass.connect(reverb).connect(wet).connect(master);

    const nodes = [];

    VOICES.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "triangle" : "sine";
      osc.frequency.value = freq;
      osc.detune.value = Math.random() * 8 - 4;

      const vGain = ctx.createGain();
      // Let the root sit a touch louder; thin the upper voices.
      vGain.gain.value = (TARGET_GAIN / VOICES.length) * (i === 0 ? 1.5 : 0.85);
      osc.connect(vGain).connect(lowpass);
      osc.start();
      nodes.push(osc);

      // Slow detune drift so the pad never sits perfectly still.
      const drift = ctx.createOscillator();
      drift.frequency.value = 0.04 + Math.random() * 0.07;
      const driftAmt = ctx.createGain();
      driftAmt.gain.value = 4 + Math.random() * 5;
      drift.connect(driftAmt).connect(osc.detune);
      drift.start();
      nodes.push(drift);
    });

    // Breathing filter sweep — the "inhale/exhale" of the room.
    const breath = ctx.createOscillator();
    breath.frequency.value = 0.055;
    const breathAmt = ctx.createGain();
    breathAmt.gain.value = 200;
    breath.connect(breathAmt).connect(lowpass.frequency);
    breath.start();
    nodes.push(breath);

    nodesRef.current = nodes;
    return true;
  };

  const fadeTo = (value, seconds) => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(value, now + seconds);
  };

  const startAmbient = async () => {
    try {
      if (!ctxRef.current) {
        if (!buildEngine()) return;
      }
      await ctxRef.current.resume();
      fadeTo(TARGET_GAIN, FADE_IN);
      setStarted(true);
      setPlaying(true);
      try { localStorage.setItem(PREF_KEY, "on"); } catch {}
    } catch {
      /* audio unavailable — fail silently, the site is unaffected */
    }
  };

  const muteAmbient = () => {
    fadeTo(0, FADE_OUT);
    setPlaying(false);
    try { localStorage.setItem(PREF_KEY, "off"); } catch {}
    const ctx = ctxRef.current;
    if (ctx) {
      // Suspend after the fade completes to stop using CPU while silent.
      window.setTimeout(() => {
        if (ctx.state === "running") ctx.suspend().catch(() => {});
      }, FADE_OUT * 1000 + 100);
    }
  };

  // ── Wiring: hero CTA gesture + tab visibility + cleanup ────────────────
  useEffect(() => {
    const onStart = () => {
      // Honor an explicit opt-out — never force sound back on.
      let pref = null;
      try { pref = localStorage.getItem(PREF_KEY); } catch {}
      if (pref === "off") return;
      startAmbient();
    };
    window.addEventListener("scoutit:start-ambient", onStart);

    const onVisibility = () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      if (document.hidden) {
        if (ctx.state === "running") ctx.suspend().catch(() => {});
      } else if (playing && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("scoutit:start-ambient", onStart);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [playing]);

  useEffect(() => {
    return () => {
      // Teardown on unmount (route-level safety; layout-mounted so rare).
      nodesRef.current.forEach((n) => { try { n.stop(); } catch {} });
      if (ctxRef.current) { try { ctxRef.current.close(); } catch {} }
    };
  }, []);

  const toggle = () => (playing ? muteAmbient() : startAmbient());

  // The control only appears once the experience has been triggered, so it never
  // clutters the first view. Once present, it persists so sound can be re-enabled.
  if (!mounted || !started) return null;

  return (
    <>
      <button
        type="button"
        className="ambient-toggle"
        onClick={toggle}
        aria-pressed={playing}
        aria-label={playing ? "Mute ambient sound" : "Play ambient sound"}
        title={playing ? "Mute ambient sound" : "Play ambient sound"}
      >
        {playing ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        )}
        {playing && <span className="ambient-pulse" aria-hidden="true" />}
      </button>

      <style jsx>{`
        .ambient-toggle {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 950;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: rgba(10, 10, 10, 0.85);
          border: 1.5px solid ${playing ? "rgba(232, 174, 60, 0.55)" : "rgba(232, 174, 60, 0.22)"};
          color: ${playing ? "var(--accent-bright, #F7C64E)" : "rgba(232, 174, 60, 0.6)"};
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-shadow: ${playing
            ? "0 0 18px rgba(232, 174, 60, 0.3), 0 4px 16px rgba(0,0,0,0.5)"
            : "0 4px 16px rgba(0,0,0,0.55)"};
          transition: color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          -webkit-tap-highlight-color: transparent;
        }

        .ambient-toggle:hover {
          color: var(--accent-bright, #F7C64E);
          border-color: rgba(232, 174, 60, 0.55);
        }

        .ambient-toggle:focus-visible {
          outline: 1.5px solid var(--accent-bright, #F7C64E);
          outline-offset: 2px;
        }

        /* Soft breathing ring while sound plays. */
        .ambient-pulse {
          position: absolute;
          inset: -1.5px;
          border-radius: 50%;
          border: 1.5px solid rgba(232, 174, 60, 0.5);
          animation: ambientPulse 3.4s ease-out infinite;
          pointer-events: none;
        }

        @keyframes ambientPulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }

        /* Sit above the mobile bottom nav so it's never hidden. */
        @media (max-width: 768px) {
          .ambient-toggle {
            bottom: 86px;
            right: 16px;
            width: 42px;
            height: 42px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .ambient-pulse { animation: none; }
        }
      `}</style>
    </>
  );
}
