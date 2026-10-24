// Lite Mode places `lite-mode` on <html> to freeze CSS animations/transitions,
// hide canvas particle loops, and disable backdrop-blur on low-end devices.

export const LITE_MODE_KEY = "scoutit_lite_mode";
export const LITE_MODE_EVENT = "scoutit:litemode";

export function isLiteMode() {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains("lite-mode");
  }
  return false;
}

// Interactive Mode unlocks the full-experience hero layer via the 5-click UFO
// easter egg when Lite Mode is off. It lasts only until reload.
const LEGACY_INTERACTIVE_MODE_KEY = "scoutit_interactive_mode";
export const INTERACTIVE_MODE_EVENT = "scoutit:interactivemode";

export function setInteractiveMode(on) {
  if (typeof document === "undefined") return;
  try {
    localStorage.removeItem(LEGACY_INTERACTIVE_MODE_KEY);
  } catch {}
  document.documentElement.classList.toggle("interactive-mode", !!on);
  window.dispatchEvent(new CustomEvent(INTERACTIVE_MODE_EVENT, { detail: { on: !!on } }));
}

export function getStoredLiteMode() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(LITE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLiteMode(on) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(LITE_MODE_KEY, on ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle("lite-mode", !!on);
  window.dispatchEvent(new CustomEvent(LITE_MODE_EVENT, { detail: { on: !!on } }));
}
