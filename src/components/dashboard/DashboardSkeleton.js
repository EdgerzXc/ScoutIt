"use client";

// ═══════════════════════════════════════════════════════════════
// DASHBOARD LOADING SKELETONS — ACTION 01_NOW B2 (2026-08-08)
//
// ── THE PROBLEM THIS SOLVES ─────────────────────────────────────
// Three of seven dashboard modes had ZERO loading state. While data was in
// flight the screen was indistinguishable from "you have nothing" — the worst
// possible ambiguity in a first session.
//
// A new broker signing in saw an empty pipeline that was not empty. There is no
// error, no spinner and no second chance at that impression: they conclude the
// product is dead and close the tab before the fetch resolves.
//
// ── WHY SKELETONS AND NOT A SPINNER ─────────────────────────────
// A skeleton reserves the layout the real content will occupy, so nothing jumps
// when data lands. A centred spinner collapses the page to zero height and then
// pushes everything down — the CLS source `/property` already had to fix.
//
// ── THE RULE ────────────────────────────────────────────────────
// 🔴 An empty state must only render AFTER loading genuinely finishes.
// `isLoading` already existed on DashboardContext and was already exported.
// These modes simply never consumed it. Gate every empty state on it.
// ═══════════════════════════════════════════════════════════════

function Shimmer({ className = "" }) {
  return (
    <div
      className={`bg-surface-variant/60 rounded animate-pulse ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * Card-grid skeleton — listings, saved spaces, search results.
 * @param {number} count how many placeholder cards to reserve
 */
export function CardGridSkeleton({ count = 6, label = "Loading your spaces" }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      {/* Screen readers get a sentence; sighted users get the shapes. Without
          this the whole load is silent to a screen reader — the page simply
          appears to be empty, which is the same bug in a different medium. */}
      <span className="sr-only">{label}…</span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-surface-variant overflow-hidden"
          >
            <Shimmer className="h-40 w-full rounded-none" />
            <div className="p-4 flex flex-col gap-3">
              <Shimmer className="h-4 w-3/4" />
              <Shimmer className="h-3 w-1/2" />
              <div className="flex gap-2 pt-1">
                <Shimmer className="h-3 w-12" />
                <Shimmer className="h-3 w-12" />
                <Shimmer className="h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Row-list skeleton — pipelines, pitches, deal tables, import previews.
 */
export function RowListSkeleton({ count = 5, label = "Loading" }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}…</span>
      <div className="flex flex-col gap-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-4 rounded-lg border border-surface-variant"
          >
            <Shimmer className="w-10 h-10 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <Shimmer className="h-3.5 w-2/5" />
              <Shimmer className="h-3 w-1/4" />
            </div>
            <Shimmer className="h-6 w-16 shrink-0 hidden sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CardGridSkeleton;
