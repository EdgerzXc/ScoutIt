// ═══════════════════════════════════════════════════════════════
// Lite Mode — a global "performance" switch for low-end phones.
//
// When on, a `lite-mode` class is placed on <html>. The CSS kill-switch in
// globals.css then freezes every animation/transition, hides the cosmic
// canvas + drifting particles, and drops expensive backdrop-blur. JS-driven
// loops (the homepage event-horizon canvas, the title beam, particle spawns)
// also read isLiteMode() and simply never start.
//
// SSR-safe: every reader guards `typeof window`. The no-flash class is applied
// by an inline <head> script in layout.js before first paint.
// ═══════════════════════════════════════════════════════════════

export const LITE_MODE_KEY = "scoutit_lite_mode";
export const LITE_MODE_EVENT = "scoutit:litemode";

// True if Lite Mode is currently active (stored preference OR reduced-motion).
export function isLiteMode() {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("lite-mode");
  }
  return false;
}

// Read the stored preference only (ignores the live DOM class). SSR-safe.
export function getStoredLiteMode() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LITE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

// Turn Lite Mode on/off: persist it, toggle the <html> class, and notify any
// listening component (homepage canvas, the toggles) so they react live.
export function setLiteMode(on) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(LITE_MODE_KEY, on ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle("lite-mode", !!on);
  window.dispatchEvent(new CustomEvent(LITE_MODE_EVENT, { detail: { on: !!on } }));
}
