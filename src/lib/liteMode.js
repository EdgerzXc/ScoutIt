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

// ═══════════════════════════════════════════════════════════════
// Interactive Mode — the "full experience" hero layer (unlockable via a
// secret 5-click on the UFO easter egg). Independent of Lite Mode: Lite
// always wins (checked first by consumers), Interactive only matters when
// Lite is off. Not a security boundary — this is an easter egg gate, not an
// auth check. Once Mission Control ships real staff roles, gate this on the
// role too rather than the click alone.
//
// Three effective hero tiers read by src/app/page.js:
//   lite off + interactive off -> Balance  (BlackHoleCanvas — raymarched golden hero)
//   lite off + interactive on  -> Interactive (GoldenHorizonCanvas simulator + panel)
//   lite on                    -> nothing (both components no-op)
// ═══════════════════════════════════════════════════════════════

export const INTERACTIVE_MODE_KEY = "scoutit_interactive_mode";
export const INTERACTIVE_MODE_EVENT = "scoutit:interactivemode";

// True if Interactive Mode is currently active (live DOM class, same
// no-flash pattern as Lite Mode).
export function isInteractiveMode() {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("interactive-mode");
  }
  return false;
}

// Read the stored preference only (ignores the live DOM class). SSR-safe.
export function getStoredInteractiveMode() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(INTERACTIVE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

// Turn Interactive Mode on/off: persist it, toggle the <html> class, and
// notify any listening component so they react live (no reload needed).
export function setInteractiveMode(on) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(INTERACTIVE_MODE_KEY, on ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle("interactive-mode", !!on);
  window.dispatchEvent(new CustomEvent(INTERACTIVE_MODE_EVENT, { detail: { on: !!on } }));
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
