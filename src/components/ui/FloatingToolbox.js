"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { reportError } from "@/lib/reportError";
import { getStoredLiteMode, setLiteMode } from "@/lib/liteMode";
import { notifyLightModeChanged } from "@/lib/lightMode";
import { guideForPath } from "@/lib/pageGuides";
import { guideForVerifiedRole } from "@/lib/journeyGuides";

export default function FloatingToolbox({ showTrigger = true }) {
  const router = useRouter();
  const previousFocusRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("dark");
  const [lite, setLite] = useState(false);
  // The guide is resolved from the surface the reader is actually on. It was
  // one fixed four-card sequence shown identically everywhere, which is why it
  // never landed — see src/lib/pageGuides.js.
  //
  // The role comes from /api/profile/me/role, which verifies the session and
  // reads the role FROM THE DATABASE. It is deliberately not read from
  // `scoutit_user` in localStorage: §1.5 forbids treating that as an
  // authorization signal, and this component cannot be the exception.
  //
  // Null role is the normal signed-out case and yields the role-neutral copy,
  // so nothing waits on the fetch — the guide is usable before it resolves.
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile/me/role")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.role) setRole(d.role);
      })
      .catch(() => {
        // Neutral copy is a fine outcome. A guide is not worth an error state.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeGuide = guideForPath(pathname, role);
  const verifiedJourney = guideForVerifiedRole(role);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardKind, setWizardKind] = useState("page");
  const [wizardStep, setWizardStep] = useState(0);
  const [journeyProgress, setJourneyProgress] = useState(null);
  const wizardRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ x: 24, y: 450 });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);

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
    const requestedMode = localStorage.getItem("scoutit_display_mode") || legacy || "dark";
    // Light Mode remains implemented for later remediation, but its full-route
    // contrast audit failed the pilot gate. Normalize old selections to Dark.
    const savedMode = requestedMode === "light" ? "dark" : requestedMode;
    if (requestedMode === "light") localStorage.setItem("scoutit_display_mode", "dark");
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
    if (!localStorage.getItem("scoutit_help_seen_v1")) {
      localStorage.setItem("scoutit_help_seen_v1", "1");
      setOpen(true);
    }


    setLite(getStoredLiteMode());

    setMounted(true);

    function handleOpenDisplay() {
      setOpen(true);
    }
    window.__scoutitOpenDisplaySettings = handleOpenDisplay;
    window.addEventListener("scoutit:open-display-settings", handleOpenDisplay);
    if (window.__scoutitDisplaySettingsRequested) {
      delete window.__scoutitDisplaySettingsRequested;
      handleOpenDisplay();
    }
    window.dispatchEvent(new CustomEvent("scoutit:display-settings-ready"));
    return () => {
      window.removeEventListener("scoutit:open-display-settings", handleOpenDisplay);
      if (window.__scoutitOpenDisplaySettings === handleOpenDisplay) {
        delete window.__scoutitOpenDisplaySettings;
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    window.dispatchEvent(new CustomEvent("scoutit:display-settings-state", {
      detail: { open },
    }));
  }, [mounted, open]);
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
    setReportFailed(false);
    const delivered = await reportError({ kind: "user_report", message: reportText.trim() });
    setReportSending(false);
    if (!delivered) {
      setReportFailed(true);
      return;
    }
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
        if (wizardOpen) {
          setWizardOpen(false);
          requestAnimationFrame(() => previousFocusRef.current?.focus?.());
        } else {
          setOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [wizardOpen]);

  useEffect(() => {
    if (!verifiedJourney) return;
    try {
      const saved = JSON.parse(localStorage.getItem("scoutit_journey_guide_v1") || "null");
      if (saved?.journeyId === verifiedJourney.id && Number.isInteger(saved.step)) {
        setJourneyProgress({ journeyId: saved.journeyId, step: Math.min(saved.step, verifiedJourney.steps.length - 1) });
      }
    } catch { /* private mode or malformed prior state */ }
  }, [verifiedJourney]);

  const pageSteps = activeGuide.steps;
  const journeySteps = verifiedJourney?.steps || [];
  const wizardSteps = wizardKind === "journey" ? journeySteps : pageSteps;
  const currentStep = wizardSteps[Math.min(wizardStep, Math.max(0, wizardSteps.length - 1))];

  function rememberProgress(step) {
    if (!verifiedJourney) return;
    const next = { journeyId: verifiedJourney.id, step };
    setJourneyProgress(next);
    try { localStorage.setItem("scoutit_journey_guide_v1", JSON.stringify(next)); } catch {}
  }

  function openWizard(kind, trigger) {
    previousFocusRef.current = document.querySelector('button[aria-label="Menu"]') || containerRef.current?.querySelector('[role="button"]') || trigger || document.activeElement;
    setWizardKind(kind);
    const step = kind === "journey" && journeyProgress?.journeyId === verifiedJourney?.id ? journeyProgress.step : 0;
    setWizardStep(step || 0);
    setWizardOpen(true);
    setOpen(false);
  }

  function closeWizard() {
    setWizardOpen(false);
    requestAnimationFrame(() => previousFocusRef.current?.focus?.());
  }

  function changeWizardStep(nextStep) {
    const bounded = Math.max(0, Math.min(nextStep, wizardSteps.length - 1));
    setWizardStep(bounded);
    if (wizardKind === "journey") rememberProgress(bounded);
  }

  function finishJourney() {
    try { localStorage.setItem("scoutit_journey_guide_v1", JSON.stringify({ journeyId: verifiedJourney.id, step: 0, completed: true })); } catch {}
    setJourneyProgress(null);
    closeWizard();
  }

  function restartJourney(trigger) {
    setJourneyProgress(null);
    try { localStorage.removeItem("scoutit_journey_guide_v1"); } catch {}
    previousFocusRef.current = document.querySelector('button[aria-label="Menu"]') || containerRef.current?.querySelector('[role="button"]') || trigger || document.activeElement;
    setWizardKind("journey");
    setWizardStep(0);
    setWizardOpen(true);
    setOpen(false);
    rememberProgress(0);
  }

  function openJourneyStep() {
    if (!currentStep?.route) return;
    if (pathname !== currentStep.route) router.push(currentStep.route);
    else document.querySelector(`[data-scoutit-guide="${currentStep.target}"]`)?.scrollIntoView({ behavior: lite ? "auto" : "smooth", block: "center" });
  }

  useEffect(() => {
    if (!wizardOpen || wizardKind !== "journey" || !currentStep || pathname !== currentStep.route) return;
    const timer = window.setTimeout(() => {
      const target = document.querySelector(`[data-scoutit-guide="${currentStep.target}"]`);
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: lite ? "auto" : "smooth", block: "center" });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [currentStep, lite, pathname, wizardKind, wizardOpen]);

  useEffect(() => {
    if (wizardOpen) window.setTimeout(() => wizardRef.current?.querySelector("button")?.focus(), 0);
  }, [wizardOpen]);

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
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent, #E8AE3C)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                Help & Display
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
              aria-label="Close Help & Display"
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
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, marginTop: 1 }}>
                    {desc}
                  </div>
                </div>
                {mode === key && <span style={{ color: "#E8AE3C", fontSize: 12, marginLeft: "auto" }}>✓</span>}
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
                <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.3, marginTop: 1 }}>
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

          {/* Page help and server-verified journey */}
          <div style={{ padding: "8px 9px 4px" }}>
            <button
              onClick={(event) => openWizard("page", event.currentTarget)}
              style={{
                width: "100%",
                background: "rgba(232, 174, 60,0.05)",
                border: "1px solid rgba(232, 174, 60,0.18)",
                borderRadius: 5, padding: "9px 12px",
                cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "#E8AE3C",
              }}
            >
              <span style={{ fontSize: 13 }}>◈</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Help for this page
              </span>
            </button>
            {verifiedJourney ? (
              <button
                onClick={(event) => journeyProgress ? openWizard("journey", event.currentTarget) : restartJourney(event.currentTarget)}
                style={{ width: "100%", marginTop: 5, background: "rgba(232, 174, 60,0.1)", border: "1px solid rgba(232, 174, 60,0.28)", borderRadius: 5, padding: "9px 12px", cursor: "pointer", color: "#E8AE3C", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "left" }}
              >
                {journeyProgress ? "Resume guided journey" : "Start guided journey"}
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                style={{ width: "100%", marginTop: 5, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 5, padding: "9px 12px", cursor: "pointer", color: "rgba(255,255,255,0.62)", fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", textAlign: "left" }}
              >
                Sign in for a role guide
              </button>
            )}
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
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Report Issue
              </span>
            </button>
          </div>

        </div>
      )}

      {/* Non-blocking guide card: the page remains usable around it. */}
      {wizardOpen && currentStep && (
          <div
            ref={wizardRef}
            role="dialog"
            aria-modal="false"
            aria-labelledby="scoutit-guide-title"
            className="toolbox-float"
            style={{ position: "fixed", right: 12, bottom: 88, zIndex: 100000, width: "min(420px, calc(100vw - 24px))", maxHeight: "calc(100dvh - 112px)", overflowY: "auto", background: "#111111", border: "1px solid rgba(232, 174, 60,0.3)", borderRadius: 12, boxShadow: "0 18px 60px rgba(0,0,0,0.75)" }}
          >
            {/* Wizard header */}
            <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#E8AE3C", letterSpacing: "0.12em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  {`${wizardKind === "journey" ? `${verifiedJourney.role} journey` : activeGuide.label} // ${wizardStep + 1} of ${wizardSteps.length}`}
                </span>
                <h2 id="scoutit-guide-title" style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "#f0ede8", fontWeight: 400, lineHeight: 1.2 }}>
                  {currentStep.title}
                </h2>
              </div>
              <button onClick={closeWizard} aria-label="Dismiss guide" style={{ background: "none", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 8, flexShrink: 0 }}>✕</button>
            </div>

            {/* Wizard body */}
            <div style={{ padding: "24px 24px 18px" }}>
              <p style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.8, margin: 0 }}>
                {currentStep.body}
              </p>
              {currentStep.tip && <p style={{ margin: "12px 0 0", color: "rgba(255,255,255,0.58)", fontSize: 12, lineHeight: 1.6 }}>Tip: {currentStep.tip}</p>}
              {wizardKind === "journey" && (
                <button onClick={openJourneyStep} style={{ marginTop: 16, width: "100%", padding: 11, background: "rgba(232,174,60,0.1)", color: "#E8AE3C", border: "1px solid rgba(232,174,60,0.3)", borderRadius: 6, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  {pathname === currentStep.route ? "Show me on this page" : "Open this step"}
                </button>
              )}
            </div>

            {/* Step dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: 6, paddingBottom: 20 }}>
              {wizardSteps.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to guide step ${i + 1}`}
                  onClick={() => changeWizardStep(i)}
                  style={{
                    width: i === wizardStep ? 22 : 6, height: 6, borderRadius: 3,
                    background: i === wizardStep ? "#E8AE3C" : "rgba(255,255,255,0.12)",
                    cursor: "pointer", transition: lite ? "none" : "width 0.25s, background 0.2s", border: 0, padding: 0,
                  }}
                />
              ))}
            </div>

            {/* Wizard nav */}
            <div style={{ padding: "12px 24px 20px", display: "flex", gap: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {wizardStep > 0 && (
                <button
                  onClick={() => changeWizardStep(wizardStep - 1)}
                  style={{ flex: 1, padding: "11px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 6, color: "#c8c8c8", fontFamily: "var(--font-body)", fontSize: 13, cursor: "pointer" }}
                >← Back</button>
              )}
              <button
                onClick={() => wizardStep < wizardSteps.length - 1 ? changeWizardStep(wizardStep + 1) : (wizardKind === "journey" ? finishJourney() : closeWizard())}
                style={{ flex: 1, padding: "11px 0", background: "#E8AE3C", border: "none", borderRadius: 6, color: "#000", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                {wizardStep < wizardSteps.length - 1 ? "Next →" : (wizardKind === "journey" ? "Finish ✓" : "Got it ✓")}
              </button>
            </div>
            {wizardKind === "journey" && (
              <div style={{ padding: "0 24px 18px", display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => changeWizardStep(Math.min(wizardStep + 1, wizardSteps.length - 1))} style={{ background: "none", border: 0, color: "rgba(255,255,255,0.58)", fontSize: 12, cursor: "pointer" }}>Skip step</button>
                <button onClick={(event) => restartJourney(event.currentTarget)} style={{ background: "none", border: 0, color: "rgba(232,174,60,0.8)", fontSize: 12, cursor: "pointer" }}>Restart journey</button>
              </div>
            )}
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
                <p className="text-xs text-[rgba(255,255,255,0.6)] mb-4">Tell us what went wrong or felt off. This goes straight to the team without session recording.</p>
                <textarea
                  className="w-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.1)] rounded px-4 py-3 text-[#f0ede8] text-sm min-h-[120px] focus:outline-none focus:border-gold-accent transition-colors"
                  placeholder="What happened?"
                  value={reportText}
                  onChange={e => { setReportText(e.target.value); setReportFailed(false); }}
                  maxLength={2000}
                  autoFocus
                />
                {reportFailed && <p role="alert" className="mt-3 text-xs text-error">The report was not delivered. Please keep your text and try again after reconnecting.</p>}
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
