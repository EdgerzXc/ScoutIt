// A-146: one place deciding scroll animation.
//
// Users who asked for reduced motion (OS setting) get an instant jump
// everywhere; everyone else keeps smooth scroll. Call sites must use
// motionSafeScrollBehavior() instead of a hardcoded behavior — six of them
// animated unconditionally, ignoring both Lite and the OS switch.

import { isLiteMode } from "@/lib/liteMode";

export function prefersReducedMotion() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function motionSafeScrollBehavior() {
  // Lite implies stillness too: a user on a weak device who never set the OS
  // switch still paid for every smooth scroll. isLiteMode is DOM-read and
  // SSR-safe, so this stays callable during render.
  return prefersReducedMotion() || isLiteMode() ? "auto" : "smooth";
}
