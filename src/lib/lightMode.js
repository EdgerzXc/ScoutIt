// ─────────────────────────────────────────────────────────────────────────
// LIGHT MODE — the AESTHETIC setting
// NEW_IDEAS_2.md §62
//
// ⚠️ NOT `lite` mode. These are two different features whose names differ by
// one letter, and conflating them has already cost time:
//
//   lite  mode  →  PERFORMANCE. class on <html>. lib/liteMode.js.
//                  Disables heavy visuals for weak devices/connections.
//   light mode  →  AESTHETIC.   class on <body>. this file.
//                  Dark-gold → white-gold, for users who do not want the
//                  futuristic look at all.
//
// A user can want light WITHOUT wanting lite: a designer on a fast laptop who
// simply prefers a light interface. And lite without light: an old phone on
// 3G that still wants the dark brand. They are independent axes.
//
// This module exists because the WebGL hero has to know about light mode, and
// a shader cannot read a CSS variable — see the note in BlackHoleCanvas.
// ─────────────────────────────────────────────────────────────────────────

/** Body class that carries the light theme. Set by FloatingToolbox / BottomNav. */
export const LIGHT_MODE_CLASS = "light-mode";

/** Fired when the user switches theme, so canvas-based visuals can tear down live. */
export const LIGHT_MODE_EVENT = "scoutit:lightmode";

/**
 * Is the light (white-gold) theme currently active?
 *
 * Reads the DOM rather than storage, because the body class is the single
 * source of truth — the toolbox and the mobile nav both write it, and CSS
 * already keys off it. A second source would be a second thing to keep in sync.
 *
 * @returns {boolean} false during SSR, where there is no document.
 */
export function isLightMode() {
  if (typeof document === "undefined") return false;
  return document.body.classList.contains(LIGHT_MODE_CLASS);
}

/**
 * Announce a theme change so listeners (the hero canvas) can react immediately
 * instead of waiting for a remount.
 *
 * Call this straight after adding/removing the class. Kept separate from the
 * class write so the existing 'applyTheme' functions stay the one place that
 * decides what the class should be.
 */
export function notifyLightModeChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(LIGHT_MODE_EVENT, { detail: { light: isLightMode() } }));
}
