"use client";

import { useState, useEffect, useRef } from "react";
import { reportError } from "@/lib/reportError";
import { TIERS, TIER_LABELS } from "@/lib/entitlements";
import { getStoredLiteMode, setLiteMode } from "@/lib/liteMode";
import { notifyLightModeChanged } from "@/lib/lightMode";

// Dev-only tier/role switcher lives inside this eye toolbox. It stays HIDDEN from
// the public — revealed only by a secret gesture (tap the eye 5× quickly) or the
// ?dev=1 URL. Toggling writes a mock user's tier/role to localStorage + reloads so
// the entitlement gates re-read. ⚠️ remove before launch — scaffolding.
const DEV_ROLES = ["seeker", "owner", "broker", "photographer", "researcher"];

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

export default function FloatingToolbox({ showTrigger = true }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("dark");
  const [lite, setLite] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 450 });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  // ── Dev tools (hidden) ──
  const [devOn, setDevOn] = useState(false);
  const [devTier, setDevTier] = useState("starry");
  const [devRole, setDevRole] = useState("seeker");
  const tapTimes = useRef([]);

  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const anchor = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 });
  const livePos = useRef({ x: 24, y: 450 });

  // Apply theme classes to body
  function applyTheme(m) {
    if (typeof document === 'undefined') return;
    document.body.classList.remove("high-contrast", "light-mode");
    if (m === "high-contrast") document.body.classList.add("high-contrast");
    if (m === "light") document.body.classList.add("light-mode");
    // Tell canvas-based visuals to tear down / rebuild immediately.
    // A WebGL shader cannot read a CSS variable, so the hero has to be
    // told in JS rather than restyled (§62).
    notifyLightModeChanged();
  }

  useEffect(() => {
    // On mobile the fixed bottom nav (~74px) owns the bottom of the screen, so
    // default the toolbox above it instead of on top of the nav / page content.
    const navClear = window.matchMedia("(max-width: 768px)").matches ? 88 : 24;
    const viewH = window.innerHeight || 800;
    const fallbackY = Math.max(100, viewH - 120 - navClear);
    
    // Migrate old key
    const legacy = localStorage.getItem("scoutit_accessibility_mode") === "high-contrast" ? "high-contrast" : null;
    const savedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    const savedPos = (() => {
      try { return JSON.parse(localStorage.getItem("scoutit_toolbox_pos")); }
      catch { return null; }
    })();

    let p = savedPos;
    if (!p || typeof p.x !== 'number' || typeof p.y !== 'number' || p.y < 80 || p.y > viewH - 60) {
      p = { x: 24, y: fallbackY };
    }

    livePos.current = p;
    setPos(p);

    setMode(savedMode);
    applyTheme(savedMode);

    setLite(getStoredLiteMode());

    // Dev tools: ?dev=1 / ?dev=0 still work as a backup entry; otherwise read the
    // stored flag. The 5-tap gesture toggles the same flag live (see onPointerUp).
    const devParam = new URLSearchParams(window.location.search).get("dev");
    if (devParam === "1") localStorage.setItem("scoutit_dev", "1");
    if (devParam === "0") localStorage.removeItem("scoutit_dev");

    setDevOn(localStorage.getItem("scoutit_dev") === "1");
    try {
      const u = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (u) {

        setDevTier(String(u.subscription_tier || u.tier || "starry").toLowerCase());
        const r = (u.active_roles || u.tags || [])[0];
        if (r) {

          setDevRole(String(r).toLowerCase());
        }
      }
    } catch {}


    setMounted(true);

    function handleOpenDisplay() {
      setOpen(true);
    }
    window.addEventListener("scoutit:open-display-settings", handleOpenDisplay);
    return () => window.removeEventListener("scoutit:open-display-settings", handleOpenDisplay);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.dispatchEvent(new CustomEvent("scoutit:display-settings-state", {
      detail: { open },
    }));
  }, [mounted, open]);
  // Apply a mock tier/role and reload so entitlement gates re-read.
  const applyDev = (nextTier, nextRole) => {
    try {
      let u = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (!u) {
        u = {
          id: "master-dev",
          full_name: "Master Developer",
          email: "dev@scoutit.com",
          connects_balance: 9999
        };
      }
      u.subscription_tier = nextTier;
      u.tier = nextTier;
      u.active_roles = ["buyer", "owner", "broker"]; // User wanted a master account with everything
      u.tags = ["buyer", "owner", "broker"];
      localStorage.setItem("scoutit_user", JSON.stringify(u));
      
      if (window.location.pathname.includes("/onboarding")) {
        window.location.assign("/dashboard");
      } else {
        window.location.reload();
      }
    } catch {}
  };

  const turnOffDev = () => {
    localStorage.removeItem("scoutit_dev");
    setDevOn(false);
  };

  // Dev-only entry point into the in-app console PREVIEWS (SCOUTIT_MASTER_BUILD_SPEC.md
  // §3) -- there is deliberately no way to reach this from normal account activation.
  //
  // ⚠️ These are previews inside the MAIN app. The real staff console is the
  // SEPARATE `mission-control/` deployment and is NOT reachable from here.
  const enterMissionControl = (modeId) => {
    try {
      let u = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (!u) {
        u = { id: "master-dev", full_name: "Master Developer", email: "dev@scoutit.com", connects_balance: 9999 };
      }
      u.tags = [...new Set([...(u.tags || []), modeId])];
      u.active_roles = [...new Set([...(u.active_roles || []), modeId])];
      u.primaryMode = modeId;
      localStorage.setItem("scoutit_user", JSON.stringify(u));
      window.location.assign("/dashboard");
    } catch {}
  };

  const changeMode = (m) => {
    setMode(m);
    applyTheme(m);
    localStorage.setItem("scoutit_display_mode", m);
  };

  const toggleLite = () => {
    const next = !lite;
    setLite(next);
    setLiteMode(next);
  };

  const submitReport = async () => {
    if (!reportText.trim()) return;
    setReportSending(true);
    await reportError({ kind: "user_report", message: reportText.trim() });
    setReportSending(false);
    setReportSent(true);
    setReportText("");
    setTimeout(() => { setReportSent(false); setReportOpen(false); }, 2200);
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
    // Keep the button out from under the mobile bottom nav even while dragging.
    const navClear = window.matchMedia("(max-width: 768px)").matches ? 88 : 0;
    const nx = Math.max(0, Math.min(window.innerWidth - 56, anchor.current.posX + dx));
    const ny = Math.max(0, Math.min(window.innerHeight - 56 - navClear, anchor.current.posY + dy));
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
      // Secret gesture: 5 quick taps on the eye toggle the hidden Dev Tools.
      const now = Date.now();
      tapTimes.current = tapTimes.current.filter((t) => now - t < 1500);
      tapTimes.current.push(now);
      if (tapTimes.current.length >= 5) {
        tapTimes.current = [];
        const next = localStorage.getItem("scoutit_dev") !== "1";
        if (next) localStorage.setItem("scoutit_dev", "1");
        else localStorage.removeItem("scoutit_dev");
        setDevOn(next);
        setOpen(true); // reveal the panel so the Dev Tools section is visible
        return;
      }
      setOpen((o) => !o);
    } else {
      const p = { ...livePos.current };
      setPos(p);
      localStorage.setItem("scoutit_toolbox_pos", JSON.stringify(p));
      setOpen(false);
    }
  };

  const [panelPos, setPanelPos] = useState(null);
  const isDraggingPanel = useRef(false);
  const panelRef = useRef(null);
  const panelAnchor = useRef({ clientX: 0, clientY: 0, posX: 0, posY: 0 });

  const viewW = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const viewH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const defaultPanelX = Math.max(16, Math.min(viewW - 250, pos.x > viewW - 290 ? viewW - 250 : pos.x));
  const defaultPanelY = Math.max(60, Math.min(viewH - 450, pos.y > viewH - 300 ? viewH - 450 : pos.y));
  const activePanelX = panelPos ? panelPos.x : defaultPanelX;
  const activePanelY = panelPos ? panelPos.y : defaultPanelY;

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const onPanelPointerDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("button")) return;
    isDraggingPanel.current = true;
    panelAnchor.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: activePanelX,
      posY: activePanelY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPanelPointerMove = (e) => {
    if (!isDraggingPanel.current) return;
    const dx = e.clientX - panelAnchor.current.clientX;
    const dy = e.clientY - panelAnchor.current.clientY;
    const nx = Math.max(10, Math.min(viewW - 240, panelAnchor.current.posX + dx));
    const ny = Math.max(10, Math.min(viewH - 450, panelAnchor.current.posY + dy));
    setPanelPos({ x: nx, y: ny });
    if (panelRef.current) {
      panelRef.current.style.left = nx + "px";
      panelRef.current.style.top = ny + "px";
    }
  };

  const onPanelPointerUp = () => {
    isDraggingPanel.current = false;
  };

  if (!mounted) return null;

  const eyeActive = mode !== "dark";

  return (
    <>
      {/* ── Draggable eye trigger ── */}
      {showTrigger && <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="toolbox-float"
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
              ? (mode === "high-contrast" ? "#E8AE3C" : "rgba(232, 174, 60,0.14)")
              : "rgba(10,10,10,0.85)",
            border: `1.5px solid ${eyeActive ? "rgba(232, 174, 60,0.55)" : "rgba(232, 174, 60,0.22)"}`,
            color: mode === "high-contrast" ? "#000" : "#E8AE3C",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "grab", position: "relative",
            boxShadow: eyeActive
              ? "0 0 18px rgba(232, 174, 60,0.3), 0 4px 16px rgba(0,0,0,0.5)"
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
              background: "#E8AE3C", border: "1.5px solid #0e0e0e",
            }} />
          )}
        </div>
      </div>}

      {/* ── Draggable Toolbox panel ── */}
      {open && (
        <div
          ref={panelRef}
          className="toolbox-float"
          style={{
            position: "fixed", left: activePanelX, top: activePanelY,
            zIndex: 99998, width: 228,
            background: "var(--surface, #111111)",
            border: "1px solid var(--border-solid, rgba(232, 174, 60,0.25))",
            borderRadius: 10,
            boxShadow: "var(--shadow-lg, 0 12px 48px rgba(0,0,0,0.75))",
            overflow: "hidden",
          }}
        >
          {/* Draggable Header */}
          <div
            onPointerDown={onPanelPointerDown}
            onPointerMove={onPanelPointerMove}
            onPointerUp={onPanelPointerUp}
            style={{
              padding: "11px 14px 10px",
              borderBottom: "1px solid var(--border-solid, rgba(255,255,255,0.08))",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              cursor: "grab", userSelect: "none", touchAction: "none",
              background: "rgba(255,255,255,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ cursor: "grab", opacity: 0.5, fontSize: 12, color: "var(--accent)" }}>⠿</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--accent, #E8AE3C)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700 }}>
                Display Settings
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              aria-label="Close Display Settings"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid var(--border-mid, rgba(255,255,255,0.15))",
                color: "var(--text-primary, #fff)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: "bold",
                lineHeight: 1,
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, transform 0.1s",
              }}
            >
              ✕
            </button>
          </div>

          {/* Mode options */}
          <div style={{ padding: "9px 9px 7px", display: "flex", flexDirection: "column", gap: 5 }}>
            {[
              { key: "dark",          label: "Dark Mode",     desc: "Cosmic default",        dot: "#1e1e1e", dotBorder: "rgba(255,255,255,0.18)" },
              { key: "light",         label: "Light Mode",    desc: "Bright, open reading",  dot: "#f0ede8", dotBorder: "rgba(0,0,0,0.18)" },
              { key: "high-contrast", label: "High Contrast", desc: "Maximum readability",   dot: "#E8AE3C", dotBorder: "rgba(232, 174, 60,0.4)" },
            ].map(({ key, label, desc, dot, dotBorder }) => (
              <button
                key={key}
                onClick={() => changeMode(key)}
                style={{
                  width: "100%",
                  background: mode === key ? "rgba(232, 174, 60,0.09)" : "rgba(255,255,255,0.025)",
                  border: `1px solid ${mode === key ? "rgba(232, 174, 60,0.3)" : "rgba(255,255,255,0.06)"}`,
                  borderRadius: 5, padding: "8px 10px",
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, border: `1.5px solid ${dotBorder}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: mode === key ? "#E8AE3C" : "#e5e2e1", fontWeight: mode === key ? 600 : 400, lineHeight: 1.3 }}>
                    {label}
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, marginTop: 1 }}>
                    {desc}
                  </div>
                </div>
                {mode === key && <span style={{ color: "#E8AE3C", fontSize: 11, marginLeft: "auto" }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Lite Mode toggle — kills animations for low-end machines */}
          <div style={{ padding: "0 9px 8px" }}>
            <button
              onClick={toggleLite}
              aria-pressed={lite}
              style={{
                width: "100%",
                background: lite ? "rgba(232, 174, 60,0.09)" : "rgba(255,255,255,0.025)",
                border: `1px solid ${lite ? "rgba(232, 174, 60,0.3)" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 5, padding: "8px 10px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 9, textAlign: "left",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: lite ? "#E8AE3C" : "#e5e2e1", fontWeight: lite ? 600 : 400, lineHeight: 1.3 }}>
                  Lite Mode {lite ? "· On" : "· Off"}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, marginTop: 1 }}>
                  Stops animations for older devices
                </div>
              </div>
              <span style={{
                flexShrink: 0, width: 34, height: 19, borderRadius: 999,
                background: lite ? "#F7C64E" : "rgba(255,255,255,0.14)",
                border: `1px solid ${lite ? "#F7C64E" : "rgba(255,255,255,0.18)"}`,
                position: "relative", transition: "background 0.2s",
              }}>
                <span style={{
                  position: "absolute", top: 1.5, left: 1.5, width: 14, height: 14, borderRadius: "50%",
                  background: "#0e0e0e", transition: "transform 0.2s",
                  transform: lite ? "translateX(15px)" : "translateX(0)",
                }} />
              </span>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "0 9px" }} />

          {/* Wizard Guide */}
          <div style={{ padding: "8px 9px 4px" }}>
            <button
              onClick={() => { setWizardStep(0); setWizardOpen(true); setOpen(false); }}
              style={{
                width: "100%",
                background: "rgba(232, 174, 60,0.05)",
                border: "1px solid rgba(232, 174, 60,0.18)",
                borderRadius: 5, padding: "9px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#E8AE3C",
              }}
            >
              <span style={{ fontSize: 13 }}>◈</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Wizard Guide
              </span>
            </button>
          </div>

          {/* Report Issue */}
          <div style={{ padding: "0 9px 10px" }}>
            <button
              onClick={() => { setReportOpen(true); setOpen(false); }}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 5, padding: "9px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)",
              }}
            >
              <span style={{ fontSize: 13 }}>⚑</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Report Issue
              </span>
            </button>
          </div>

          {/* ── Dev Tools (hidden) — revealed by 5-tap on the eye, or ?dev=1 ── */}
          {devOn && (
            <>
              <div style={{ height: 1, background: "rgba(232, 174, 60,0.18)", margin: "0 9px" }} />
              <div style={{ padding: "9px 11px 11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#E8AE3C", letterSpacing: "0.2em", textTransform: "uppercase" }}>Dev · Tier</span>
                  <button onClick={turnOffDev} aria-label="Hide Developer Options" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 8.5, letterSpacing: "0.12em", textTransform: "uppercase" }}>Hide ✕</button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 9 }}>
                  {TIERS.map((t) => {
                    const on = t === devTier;
                    return (
                      <button key={t} onClick={() => applyDev(t, devRole)} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "4px 7px", borderRadius: 4, cursor: "pointer", textTransform: "capitalize", border: "1px solid " + (on ? "#E8AE3C" : "rgba(255,255,255,0.12)"), background: on ? "#E8AE3C" : "transparent", color: on ? "#0e0e0e" : "#c8c8c8" }}>{TIER_LABELS[t]}</button>
                    );
                  })}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Role</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {DEV_ROLES.map((r) => {
                    const on = r === devRole;
                    return (
                      <button key={r} onClick={() => applyDev(devTier, r)} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "4px 7px", borderRadius: 4, cursor: "pointer", textTransform: "capitalize", border: "1px solid " + (on ? "#E8AE3C" : "rgba(255,255,255,0.12)"), background: on ? "#E8AE3C" : "transparent", color: on ? "#0e0e0e" : "#c8c8c8" }}>{r}</button>
                    );
                  })}
                </div>

                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", margin: "10px 0 6px" }}>In-app console previews</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <button onClick={() => enterMissionControl("mc_staff")} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "6px 8px", borderRadius: 4, cursor: "pointer", textAlign: "left", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#c8c8c8" }}>
                    Staff Console — simulated (not the real one)
                  </button>
                  <button onClick={() => enterMissionControl("mc_enterprise")} style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, padding: "6px 8px", borderRadius: 4, cursor: "pointer", textAlign: "left", border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "#c8c8c8" }}>
                    Enterprise Console — preview (scoped to own)
                  </button>
                </div>
              </div>
            </>
          )}
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
          <div style={{ width: "100%", maxWidth: 460, background: "#111111", border: "1px solid rgba(232, 174, 60,0.2)", borderRadius: 12, overflow: "hidden" }}>
            {/* Wizard header */}
            <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "#E8AE3C", letterSpacing: "0.22em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Guide // {wizardStep + 1} of {WIZARD_STEPS.length}
                </span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#f0ede8", fontWeight: 400, lineHeight: 1.2 }}>
                  {WIZARD_STEPS[wizardStep].title}
                </h2>
              </div>
              <button onClick={() => setWizardOpen(false)} aria-label="Close" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.28)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}>✕</button>
            </div>

            {/* Wizard body */}
            <div style={{ padding: "32px 24px 20px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 40, color: "#E8AE3C", marginBottom: 20, lineHeight: 1 }}>
                {WIZARD_STEPS[wizardStep].glyph}
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: 380, margin: "0 auto" }}>
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
                    background: i === wizardStep ? "#E8AE3C" : "rgba(255,255,255,0.12)",
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
                style={{ flex: 1, padding: "11px 0", background: "#E8AE3C", border: "none", borderRadius: 6, color: "#000", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {wizardStep < WIZARD_STEPS.length - 1 ? "Next →" : "Got it ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Problem overlay ── */}
      {reportOpen && (
        <div className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center bg-background/70 backdrop-blur-sm p-4" onClick={() => setReportOpen(false)}>
          <div className="w-full max-w-md bg-[#111] border border-surface-variant rounded-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-3">✅</div>
                <p className="font-working-title text-on-surface">Thank you — we got it.</p>
              </div>
            ) : (
              <>
                <h3 className="font-headline-editorial text-xl text-[#f0ede8] mb-1">Report a problem</h3>
                <p className="text-xs text-[rgba(255,255,255,0.6)] mb-4">Tell us what went wrong or felt off. This goes straight to the team.</p>
                <textarea
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded px-4 py-3 text-[#f0ede8] text-sm min-h-[120px] focus:outline-none focus:border-gold-accent transition-colors"
                  placeholder="What happened?"
                  value={reportText}
                  onChange={e => setReportText(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-3 mt-4">
                  <button type="button" className="flex-1 border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.6)] hover:text-white font-label-caps uppercase tracking-widest text-sm py-3 rounded transition-colors" onClick={() => setReportOpen(false)}>Cancel</button>
                  <button type="button" className="flex-1 bg-gold-accent text-black font-label-caps uppercase tracking-widest font-bold text-sm py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50" disabled={!reportText.trim() || reportSending} onClick={submitReport}>{reportSending ? "Sending…" : "Send report"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
