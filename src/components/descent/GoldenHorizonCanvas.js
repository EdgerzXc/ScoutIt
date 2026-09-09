"use client";

import { useEffect, useRef, useState } from "react";
import { isLiteMode, LITE_MODE_EVENT } from "@/lib/liteMode";
import {
  GOLDEN_DEFAULT_PARAMS,
  GOLDEN_PALETTE_NAMES,
  GOLDEN_PRESETS,
  createRenderer,
} from "./blackHoleEngine";

// ═══════════════════════════════════════════════════════════════
// Golden Horizon V3.1 — Interactive Mode's black hole (thin consumer).
// The render engine (shaders, GL setup, loop, guards) lives in
// ./blackHoleEngine.js (A-088 Phase 0); this file keeps React state,
// the params sync, HUD JSX/CSS, and pointer-listener attachment.
// Re-exported below so existing importers (InteractivePanel) move nothing.
// ═══════════════════════════════════════════════════════════════

export { GOLDEN_DEFAULT_PARAMS, GOLDEN_PALETTE_NAMES, GOLDEN_PRESETS };

// Shader sources, presets, and the render loop live in ./blackHoleEngine.js
// (A-088 Phase 0). This file keeps only React state, HUD, and listeners.

// (Engine code lives in ./blackHoleEngine.js — see header.)

export default function GoldenHorizonCanvas({ params: paramsProp }) {
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [isCapturing3D, setIsCapturing3D] = useState(false);
  // A-098: a lost GL context (tab backgrounding, GPU reset) otherwise
  // freezes the hero on a dead canvas. The session bump re-runs the setup
  // effect below; the static scrim behind (page-level .event-horizon glow)
  // carries the scene meanwhile — the same honest fallback Lite Mode and
  // no-WebGL devices already get.
  const [contextLost, setContextLost] = useState(false);
  const [glSession, setGlSession] = useState(0);
  const paramsRef = useRef({ ...GOLDEN_DEFAULT_PARAMS, ...paramsProp });

  // Live HUD readouts (pitch/yaw/zoom) are poked directly into these DOM
  // nodes from the render loop — no per-frame React re-renders.
  const hudPitchRef = useRef(null);
  const hudYawRef = useRef(null);
  const hudZoomRef = useRef(null);

  useEffect(() => {
    paramsRef.current = { ...GOLDEN_DEFAULT_PARAMS, ...paramsProp };
  }, [paramsProp]);

  // A-088 Phase 0: the render engine lives in ./blackHoleEngine.js. This
  // effect only wires it — params, preserveDrawingBuffer opt-in (the UFO
  // easter egg captures 3D), HUD pokes, capture state — and attaches the
  // same pointer listeners with the same speed scales. No behavior change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createRenderer(canvas, {
      // The easter egg captures 3D: keep the opt-in this surface always had.
      preserveDrawingBuffer: true,
      getParams: () => paramsRef.current,
      initialCamera: { pitch: paramsRef.current.pitch, yaw: paramsRef.current.yaw },
      isLiteMode,
      liteModeEvent: LITE_MODE_EVENT,
      onFirstFrame: () => setRevealed(true),
      onCaptureChange: (capturing) => setIsCapturing3D(capturing),
      onHud: ({ pitch, yaw, zoomLabel }) => {
        if (hudPitchRef.current) hudPitchRef.current.textContent = pitch.toFixed(3);
        if (hudYawRef.current) hudYawRef.current.textContent = yaw.toFixed(3);
        if (hudZoomRef.current) hudZoomRef.current.textContent = zoomLabel;
      },
    });
    if (!renderer) return; // Lite Mode or no WebGL — CSS fallback stays

    // A-098: preventDefault keeps restoration possible; without it the
    // canvas can never recover and the hero stays dead for the session.
    const onContextLost = (e) => {
      e.preventDefault();
      renderer.destroy();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      setGlSession((s) => s + 1);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const onMouseDown = (e) => renderer.beginDrag(e.clientX, e.clientY);
    const onMouseMove = (e) => renderer.moveDrag(e.clientX, e.clientY, 0.005);
    const onTouchStart = (e) => {
      if (e.touches.length === 0) return;
      renderer.beginDrag(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 0) return;
      renderer.moveDrag(e.touches[0].clientX, e.touches[0].clientY, 0.008);
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion) {
      canvas.addEventListener("mousedown", onMouseDown);
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseup", renderer.endDrag);
      canvas.addEventListener("mouseleave", renderer.endDrag);
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      canvas.addEventListener("touchend", renderer.endDrag);
    }

    return () => {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", renderer.endDrag);
      canvas.removeEventListener("mouseleave", renderer.endDrag);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", renderer.endDrag);
      renderer.destroy();
    };
  }, [glSession]);

  return (
    <div
      className="golden-horizon-wrap"
      style={{
        opacity: revealed ? 1 : 0,
        transition: "opacity 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <canvas
        ref={canvasRef}
        className="golden-horizon-canvas"
        title="Click or drag to send gravity shockwaves and look at the black hole in 3D dimensions"
        style={contextLost ? { opacity: 0 } : undefined}
      />
      {/* A-098: honest static fallback while the GL context is gone — the
          page-level horizon glow shows through instead of a frozen frame. */}
      {contextLost && <div className="golden-horizon-fallback" aria-hidden="true" />}

      {/* Cinematic WebGL Indicator HUD (top-left, appears on hover) */}
      <div className="gh-hud gh-hint" aria-hidden="true">
        <span className="gh-ping" />
        WEBGL CINEMATIC SINGULARITY • DRAG TO ORBIT • CLICK TO RIPPLE
      </div>

      {/* Interactive Holographic HUD Overlay (while dragging in 3D) */}
      {isCapturing3D && (
        <>
          <div className="gh-reticle" aria-hidden="true">
            <div className="gh-ring-outer" />
            <div className="gh-ring-inner"><span className="gh-dot" /></div>
            <div className="gh-cross-h" />
            <div className="gh-cross-v" />
            <div className="gh-label gh-label-top">OBSV_NODE_Z_CENTER</div>
            <div className="gh-label gh-label-bottom">E_HORIZON_PROXIMITY_99.8%</div>
          </div>

          <div className="gh-hud gh-status" aria-hidden="true">
            <span className="gh-ping" />
            <span className="gh-status-title">3D DIMENSION LOCK ACTIVE</span>
            <span className="gh-sep">|</span>
            <span>PITCH: <span ref={hudPitchRef}>0.000</span> rad</span>
            <span className="gh-sep">|</span>
            <span>YAW: <span ref={hudYawRef}>0.000</span> rad</span>
          </div>

          <div className="gh-hud gh-matrix" aria-hidden="true">
            <div className="gh-matrix-title">OBSERVATION COUPLING</div>
            <div className="gh-matrix-row"><span>GRAVITY LENSING:</span><span className="gh-gold">100.0% (ACTIVE)</span></div>
            <div className="gh-matrix-row"><span>DOPPLER BOOSTING:</span><span className="gh-gold">EASED_LOCK</span></div>
            <div className="gh-matrix-row"><span>TELEPHOTO RANGE:</span><span className="gh-gold" ref={hudZoomRef}>x2.40</span></div>
          </div>
        </>
      )}

      <style jsx>{`
        .golden-horizon-wrap {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          user-select: none;
        }
        .golden-horizon-canvas {
          width: 100%;
          height: 100%;
          display: block;
          cursor: grab;
          touch-action: pan-y;
        }
        .golden-horizon-canvas:active {
          cursor: grabbing;
        }
        .golden-horizon-fallback {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 62%, rgba(232, 174, 60, 0.16), transparent 62%),
            linear-gradient(to bottom, transparent 40%, rgba(0, 0, 0, 0.55));
        }

        .gh-hud {
          position: absolute;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(232, 174, 60, 0.25);
          border-radius: 8px;
          font-family: var(--font-mono), 'Courier New', monospace;
          color: rgba(232, 174, 60, 0.9);
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
        }
        .gh-hint {
          top: 16px;
          left: 16px;
          padding: 6px 12px;
          font-size: 12px;
          letter-spacing: 0.12em;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .golden-horizon-wrap:hover .gh-hint {
          opacity: 1;
        }
        .gh-ping {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #e8ae3c;
          animation: ghPing 1.2s ease-out infinite;
          flex-shrink: 0;
        }
        @keyframes ghPing {
          0% { box-shadow: 0 0 0 0 rgba(232, 174, 60, 0.6); }
          100% { box-shadow: 0 0 0 8px rgba(232, 174, 60, 0); }
        }

        .gh-reticle {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 2;
        }
        .gh-ring-outer {
          position: absolute;
          width: 192px;
          height: 192px;
          border-radius: 50%;
          border: 1px dashed rgba(232, 174, 60, 0.15);
          animation: ghSpin 12s linear infinite;
        }
        .gh-ring-inner {
          position: absolute;
          width: 112px;
          height: 112px;
          border-radius: 50%;
          border: 1px solid rgba(232, 174, 60, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gh-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: rgba(232, 174, 60, 0.7);
        }
        .gh-cross-h {
          position: absolute;
          width: 144px;
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(232, 174, 60, 0.3), transparent);
        }
        .gh-cross-v {
          position: absolute;
          height: 144px;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(232, 174, 60, 0.3), transparent);
        }
        .gh-label {
          position: absolute;
          font-family: var(--font-mono), 'Courier New', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: rgba(232, 174, 60, 0.4);
        }
        .gh-label-top { transform: translateY(-96px); }
        .gh-label-bottom { transform: translateY(96px); }
        @keyframes ghSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .gh-status {
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          padding: 8px 16px;
          font-size: 12px;
          border-color: rgba(232, 174, 60, 0.3);
          box-shadow: 0 0 20px rgba(232, 174, 60, 0.15);
          animation: ghPulse 2s ease-in-out infinite;
          z-index: 2;
          white-space: nowrap;
        }
        .gh-status-title {
          font-weight: 700;
          letter-spacing: 0.12em;
        }
        .gh-sep { color: rgba(255, 255, 255, 0.2); }
        .gh-status span:not(.gh-status-title):not(.gh-sep):not(.gh-ping) {
          color: rgba(255, 255, 255, 0.55);
        }
        @keyframes ghPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.72; }
        }

        .gh-matrix {
          top: 16px;
          right: 16px;
          padding: 10px 12px;
          font-size: 12px;
          flex-direction: column;
          align-items: stretch;
          gap: 5px;
          color: rgba(255, 255, 255, 0.5);
          z-index: 2;
        }
        .gh-matrix-title {
          color: #e8ae3c;
          font-weight: 700;
          letter-spacing: 0.14em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 4px;
        }
        .gh-matrix-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }
        .gh-gold { color: rgba(232, 174, 60, 0.9); font-weight: 700; }

        @media (max-width: 768px) {
          .gh-matrix, .gh-hint { display: none; }
        }
      `}</style>
    </div>
  );
}
