"use client";

import { useState } from "react";
import {
  GOLDEN_DEFAULT_PARAMS,
  GOLDEN_PRESETS,
  GOLDEN_PALETTE_NAMES,
} from "./GoldenHorizonCanvas";

// ═══════════════════════════════════════════════════════════════
// Interactive Mode's visitor-facing control panel — a minimizable deck over
// the hero's Golden Horizon black hole. Mirrors the generator app's three
// control groups (Preset Catalogs / Gravitational Physics / Aesthetics) in
// the site's gold/dark inline-style language so it feels native rather than
// like a bolted-on dev tool. Only rendered when Interactive Mode is
// unlocked (5-click UFO easter egg).
// ═══════════════════════════════════════════════════════════════

// Slider ranges copied from the generator's Physics + Aesthetics tabs.
const PHYSICS_SLIDERS = [
  { key: "horizonRadius", label: "Horizon Radius", min: 0.06, max: 0.25, step: 0.01 },
  { key: "lensingStrength", label: "Gravitational Lensing", min: 0.05, max: 0.5, step: 0.01 },
  { key: "diskInner", label: "Disk Inner Edge", min: 0.08, max: 0.35, step: 0.01 },
  { key: "diskOuter", label: "Disk Outer Edge", min: 0.35, max: 0.95, step: 0.01 },
  { key: "starfieldDensity", label: "Starfield Density", min: 0, max: 1.0, step: 0.05 },
];

const AESTHETIC_SLIDERS = [
  { key: "spinSpeed", label: "Orbital Spin Speed", min: 0.1, max: 2.0, step: 0.05 },
  { key: "beamingStrength", label: "Doppler Beaming", min: 0, max: 1.0, step: 0.05 },
  { key: "noiseFreq", label: "Gas Detail", min: 0.5, max: 3.0, step: 0.1 },
  { key: "brightness", label: "Disk Brightness", min: 0.4, max: 2.0, step: 0.05 },
];

// The generator's logical constraints: the disk can never dip inside the
// horizon, and inner/outer edges push each other apart instead of crossing.
function applyConstraints(params, key, value) {
  const updated = { ...params, [key]: value };
  if (key === "horizonRadius" && updated.diskInner < value + 0.02) {
    updated.diskInner = value + 0.02;
  }
  if (key === "diskInner" && value < updated.horizonRadius + 0.02) {
    updated.diskInner = updated.horizonRadius + 0.02;
  }
  if (key === "diskInner" && value > updated.diskOuter - 0.05) {
    updated.diskOuter = value + 0.05;
  }
  if (key === "diskOuter" && value < updated.diskInner + 0.05) {
    updated.diskInner = Math.max(updated.horizonRadius + 0.02, value - 0.05);
  }
  return updated;
}

function SliderGroup({ sliders, params, onSet }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {sliders.map(({ key, label, min, max, step }) => (
        <div key={key}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, marginBottom: 3 }}>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
            <span style={{ color: "#E8AE3C" }}>{Number(params[key]).toFixed(2)}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key]}
            onChange={(e) => onSet(key, parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#E8AE3C", height: 4, cursor: "pointer" }}
          />
        </div>
      ))}
    </div>
  );
}

const sectionTitleStyle = {
  fontSize: 9,
  color: "rgba(255,255,255,0.4)",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  marginBottom: 6,
};

const dividerStyle = { height: 1, background: "rgba(255,255,255,0.05)" };

export default function InteractivePanel({ params, onChange, onClose }) {
  const [minimized, setMinimized] = useState(false);

  const setParam = (key, value) => onChange(applyConstraints(params, key, value));

  const activePresetId = GOLDEN_PRESETS.find(
    (p) =>
      Math.abs(params.horizonRadius - p.params.horizonRadius) < 0.005 &&
      params.colorShift === p.params.colorShift
  )?.id;

  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        top: 14,
        zIndex: 5,
        width: minimized ? "auto" : 236,
        maxHeight: "calc(100% - 28px)",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10,10,10,0.82)",
        border: "1px solid rgba(232, 174, 60,0.25)",
        borderRadius: 10,
        backdropFilter: "blur(10px)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        fontFamily: "var(--font-mono, monospace)",
        color: "#e5e2e1",
        overflow: "hidden",
      }}
    >
      {/* Header — always visible, doubles as the minimize toggle */}
      <div
        style={{
          padding: "9px 11px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          cursor: "pointer",
          flexShrink: 0,
          borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}
        onClick={() => setMinimized((m) => !m)}
        role="button"
        tabIndex={0}
        aria-expanded={!minimized}
        aria-label={minimized ? "Expand black hole controls" : "Minimize black hole controls"}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8AE3C" }} />
          <span style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "#E8AE3C" }}>
            Golden Horizon
          </span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{minimized ? "▸" : "▾"}</span>
          {onClose && !minimized && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Exit Interactive Mode"
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 12, padding: "0 2px" }}
            >
              ✕
            </button>
          )}
        </span>
      </div>

      {!minimized && (
        <div style={{ padding: "10px 11px 12px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          {/* Preset catalogs — the generator's 5 curated singularities */}
          <div>
            <div style={sectionTitleStyle}>Preset Catalogs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {GOLDEN_PRESETS.map((preset) => {
                const active = preset.id === activePresetId;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onChange({ ...preset.params })}
                    title={preset.description}
                    style={{
                      fontSize: 9,
                      padding: "6px 8px",
                      borderRadius: 5,
                      cursor: "pointer",
                      textAlign: "left",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: `1px solid ${active ? "rgba(232, 174, 60,0.5)" : "rgba(255,255,255,0.08)"}`,
                      background: active ? "rgba(232, 174, 60,0.12)" : "rgba(255,255,255,0.02)",
                      color: active ? "#E8AE3C" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Palette picker */}
          <div>
            <div style={sectionTitleStyle}>Stellar Metal Scheme</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {GOLDEN_PALETTE_NAMES.map((name, idx) => {
                const active = params.colorShift === idx;
                return (
                  <button
                    key={name}
                    onClick={() => setParam("colorShift", idx)}
                    style={{
                      fontSize: 9,
                      padding: "6px 6px",
                      borderRadius: 5,
                      cursor: "pointer",
                      textAlign: "left",
                      border: `1px solid ${active ? "rgba(232, 174, 60,0.5)" : "rgba(255,255,255,0.08)"}`,
                      background: active ? "rgba(232, 174, 60,0.12)" : "rgba(255,255,255,0.02)",
                      color: active ? "#E8AE3C" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={dividerStyle} />

          {/* Gravitational physics */}
          <div>
            <div style={sectionTitleStyle}>Gravitational Physics</div>
            <SliderGroup sliders={PHYSICS_SLIDERS} params={params} onSet={setParam} />
          </div>

          <div style={dividerStyle} />

          {/* Aesthetics */}
          <div>
            <div style={sectionTitleStyle}>Aesthetics</div>
            <SliderGroup sliders={AESTHETIC_SLIDERS} params={params} onSet={setParam} />
          </div>

          <p style={{ margin: 0, fontSize: 9.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
            Drag the black hole to orbit it in 3D. Click for a spacetime shockwave. Hover to bend light around your cursor.
          </p>

          <button
            onClick={() => onChange({ ...GOLDEN_DEFAULT_PARAMS })}
            style={{
              marginTop: 2,
              fontSize: 9.5,
              padding: "7px 0",
              borderRadius: 6,
              cursor: "pointer",
              textAlign: "center",
              color: "rgba(255,255,255,0.45)",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
