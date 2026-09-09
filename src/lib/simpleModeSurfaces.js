import { shouldRender, simpleCollapsed } from "@/lib/simpleMode";

// ═══════════════════════════════════════════════════════════════
// SIMPLE MODE — PER-SURFACE DECISIONS
// A-083 phase 1
//
// ── WHY THESE LIVE HERE AND NOT IN THE COMPONENTS ────────────────────
// A mutation test caught the reason. With the decision inline in
// `ChapterSubtitle`, deleting its guard — which stops Simple removing
// anything, the entire point of phase 1 — left the whole suite green, because
// nothing could call a JSX component without a React renderer and this
// project's Vitest setup does not transform JSX in `.js`.
//
// A guard that cannot be exercised is the vacuous-guard failure this ledger
// keeps recording. So each surface decision is a pure function here, tested by
// calling it, and the component is a thin shell around it.
// ═══════════════════════════════════════════════════════════════

/**
 * Should a chapter subtitle render?
 *
 * Every subtitle in `chapterConfig.js` is a `description` by the derivation
 * rule: explanatory prose attached to a named thing.
 */
export function chapterSubtitleVisible(text, simple) {
  if (!text) return false;
  return shouldRender({ role: "description", simple });
}

/**
 * Should a secondary block sit behind its expander right now?
 *
 * `detail` collapses, never deletes — so `open` is the user's own answer and
 * it always wins. In Pro this is false regardless, which is what makes every
 * `SimpleDetail` / `SidebarDetails` a pass-through in Pro.
 */
export function detailGroupCollapsed(simple, open) {
  return simpleCollapsed({ role: "detail", simple }) && !open;
}

/** The property sidebar's name for the same decision. */
export const sidebarGroupCollapsed = detailGroupCollapsed;

/**
 * Does this sidebar group have anything behind it?
 *
 * A-085 phase 1. Widening the classification put groups around fields that
 * are individually optional — zoning, acoustics, street type are each absent
 * on some listings — and an expander whose every child is missing would open
 * onto nothing. That is a worse screen than the one before the fold, so an
 * empty group renders as nothing at all, in both modes.
 *
 * @param {number} fieldCount how many children actually rendered
 */
export function sidebarGroupVisible(fieldCount) {
  return fieldCount > 0;
}
