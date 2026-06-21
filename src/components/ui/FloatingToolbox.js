"use client";

import { useState, useEffect, useRef } from "react";

const WIZARD_STEPS = [
  {
    glyph: "◈",
    title: "The Descent",
    body: "ScoutIt is structured as layers — Stratosphere down to Core. Each layer reveals a deeper dimension of a space. Start at the top and descend before you commit.",
  },
  {
    glyph: "◉",
    title: "Space Directory",
    body: "Every property, office, and venue lives at /property. Filter by sector, location, and aesthetic. Use Proximity Radar to find spaces within a radius of any point on the map.",
  },
  {
    glyph: "◐",
    title: "Roles & Connects",
    body: "Your role shapes what you see. Brokers build Scout Ratings through verified closings. Providers showcase portfolios. Seekers track saved spaces. Connects are the platform currency.",
  },
  {
    glyph: "◑",
    title: "Your Profile",
    body: "Your public profile is opt-in. Toggle visibility per role. Seeker activity and your Connects balance are always private — never visible to anyone but you.",
  },
];

export default function FloatingToolbox() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("dark");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 0 });

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const anchor = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 });
  const livePos = useRef({ x: 24, y: 0 });

  useEffect(() => {
    const fallbackY = window.innerHeight - 80;
    // Migrate old key
    const legacy = localStorage.getItem("scoutit_accessibility_mode") === "high-contrast" ? "high-contrast" : null;
    const savedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    const savedPos = (() => {
      try { return JSON.parse(localStorage.getItem("scoutit_toolbox_pos")); }
      catch { return null; }
    })();
    const p = savedPos ?? { x: 24, y: fallbackY };
    livePos.current = p;
    setPos(p);
    setMode(savedMode);
    _apply(savedMode);
    setMounted(true);
  }, []);

  const _apply = (m) => {
    document.body.classList.remove("high-contrast", "light-mode");
    if (m === "high-contrast") document.body.classList.add("high-contrast");
    if (m === "light") document.body.classList.add("light-mode");
  };

  const changeMode = (m) => {
    setMode(m);
    _apply(m);
    localStorage.setItem("scoutit_display_mode", m);
  };

  // ── Drag ──────────────────────────────────────────────────────────────
  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    hasMoved.current = false;
    anchor.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: livePos.current.x,
      posY: livePos.current.y,
    };
    containerRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!isDragging.current) return;
    const dx = e.clientX - anchor.current.clientX;
    const dy = e.clientY - anchor.current.clientY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved.current = true;
    const nx = Math.max(0, Math.min(window.innerWidth - 56, anchor.current.posX + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 56, anchor.current.posY + dy));
    livePos.current = { x: nx, y: ny };
    // Direct DOM update — bypasses React for smooth 60fps drag
    if (containerRef.current) {
      containerRef.current.style.left = nx + "px";
      containerRef.current.style.top  = ny + "px";
    }
  };

  const onPointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (!hasMoved.current) {
      setOpen((o) => !o);
    } else {
      const p = { ...livePos.current };
      setPos(p);
      localStorage.setItem("scoutit_toolbox_pos", JSON.stringify(p));
      setOpen(false);
    }
  };

  if (!mounted) return null;

  const eyeActive = mode !== "dark";
  const panelRight = pos.x > window.innerWidth - 290;
  const panelX = panelRight ? pos.x - 222 : pos.x + 58;
  const panelY = Math.max(8, Math.min(pos.y - 20, window.innerHeight - 300));

  return (
    <>
      {/* ── Draggable eye trigger ── */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="toolbox-float hidden md:block"
        style={{ position: "fixed", left: pos.x, top: pos.y, zIndex: 99999, userSelect: "none", touchAction: "none" }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Display Toolbox"
          aria-expanded={open}
          onKeyDown={(e) => e.key === "Enter" && setOpen((o) => !o)}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: eyeActive
              ? (mode === "high-contrast" ? "#ffb800" : "rgba(255,184,0,0.14)")
              : "rgba(10,10,10,0.85)",
            border: `1.5px solid ${eyeActive ? "rgba(255,184,0,0.55)" : "rgba(255,184,0,0.22)"}`,
            color: mode === "high-contrast" ? "#000" : "#ffb800",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "grab", position: "relative",
            boxShadow: eyeActive
              ? "0 0 18px rgba(255,184,0,0.3), 0 4px 16px rgba(0,0,0,0.5)"
              : "0 4px 16px rgba(0,0,0,0.55)",
            transition: "background 0.25s, box-shadow 0.25s, border-color 0.25s",
          }}
        >
          {/* Eye SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={eyeActive ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" fill={eyeActive ? "currentColor" : "none"} />
          </svg>
          {/* Active-mode dot */}
          {eyeActive && (
            <span style={{
              position: "absolute", top: 0, right: 0,
              width: 10, height: 10, borderRadius: "50%",
              background: "#ffb800", border: "1.5px solid #0e0e0e",
            }} />
          )}
        </div>
      </div>

      {/* ── Toolbox panel ── */}
      {open && (
        <div
          className="toolbox-float"
          style={{
            position: "fixed", left: panelX, top: panelY,
            zIndex: 99998, width: 218,
            background: "#111111",
            border: "1px solid rgba(255,184,0,0.2)",
            borderRadius: 8,
            boxShadow: "0 12px 48px rgba(0,0,0,0.75)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div style={{
            padding: "11px 14px 10px",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#ffb800", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Display
            </span>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: "1px 2px" }}>✕</button>
          </div>

          {/* Mode options */}
          <div style={{ padding: "9px 9px 7px", display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { key: "dark",          label: "Dark Mode",     desc: "Cosmic default",        dot: "#1e1e1e", dotBorder: "rgba(255,255,255,0.18)" },
              { key: "light",         label: "Light Mode",    desc: "Bright, open reading",  dot: "#f0ede8", dotBorder: "rgba(0,0,0,0.18)" },
              { key: "high-contrast", label: "High Contrast", desc: "Maximum readability",   dot: "#ffb800", dotBorder: "rgba(255,184,0,0.4)" },
            ].map(({ key, label, desc, dot, dotBorder }) => (
              <button
                key={key}
                onClick={() => changeMode(key)}
                style={{
                  width: "100%",
                  background: mode === key ? "rgba(255,184,0,0.09)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${mode === key ? "rgba(255,184,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 5, padding: "8px 10px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, border: `1.5px solid ${dotBorder}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: mode === key ? "#ffb800" : "#e5e2e1", fontWeight: mode === key ? 600 : 400, lineHeight: 1.3 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, marginTop: 1 }}>
                    {desc}
                  </div>
                </div>
                {mode === key && <span style={{ color: "#ffb800", fontSize: 11, marginLeft: "auto" }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 9px" }} />

          {/* Wizard Guide */}
          <div style={{ padding: "8px 9px 10px" }}>
            <button
              onClick={() => { setWizardStep(0); setWizardOpen(true); setOpen(false); }}
              style={{
                width: "100%",
                background: "rgba(255,184,0,0.05)",
                border: "1px solid rgba(255,184,0,0.18)",
                borderRadius: 5, padding: "9px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#ffb800",
              }}
            >
              <span style={{ fontSize: 13 }}>◈</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Wizard Guide
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── Wizard Guide overlay ── */}
      {wizardOpen && (
        <div
          className="toolbox-float"
          style={{
            position: "fixed", inset: 0, zIndex: 100000,
            background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
          onClick={(e) => e.target === e.currentTarget && setWizardOpen(false)}
        >
          <div style={{ width: "100%", maxWidth: 460, background: "#111111", border: "1px solid rgba(255,184,0,0.2)", borderRadius: 12, overflow: "hidden" }}>
            {/* Wizard header */}
            <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#ffb800", letterSpacing: "0.22em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Guide // {wizardStep + 1} of {WIZARD_STEPS.length}
                </span>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: 24, color: "#f0ede8", fontWeight: 400, lineHeight: 1.2 }}>
                  {WIZARD_STEPS[wizardStep].title}
                </h2>
              </div>
              <button onClick={() => setWizardOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}>✕</button>
            </div>

            {/* Wizard body */}
            <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 40, color: "#ffb800", marginBottom: 20, lineHeight: 1 }}>
                {WIZARD_STEPS[wizardStep].glyph}
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 15, color: "rgba(240,237,232,0.82)", lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
                {WIZARD_STEPS[wizardStep].body}
              </p>
            </div>

            {/* Step dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 20 }}>
              {WIZARD_STEPS.map((_, i) => (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => setWizardStep(i)}
                  style={{
                    width: i === wizardStep ? 22 : 6, height: 6, borderRadius: 3,
                    background: i === wizardStep ? "#ffb800" : "rgba(255,255,255,0.12)",
                    cursor: "pointer", transition: "width 0.25s, background 0.2s",
                  }}
                />
              ))}
            </div>

            {/* Wizard nav */}
            <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {wizardStep > 0 && (
                <button
                  onClick={() => setWizardStep((s) => s - 1)}
                  style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, color: "#c8c8c8", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}
                >← Back</button>
              )}
              <button
                onClick={() => wizardStep < WIZARD_STEPS.length - 1 ? setWizardStep((s) => s + 1) : setWizardOpen(false)}
                style={{ flex: 1, padding: "11px 0", background: "#ffb800", border: "none", borderRadius: 6, color: "#000", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {wizardStep < WIZARD_STEPS.length - 1 ? "Next →" : "Got it ✓"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
