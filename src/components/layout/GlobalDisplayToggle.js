"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// THE EYE, EVERYWHERE
// NEW_IDEAS_2.md §62
//
// The display-settings eye lived only in `components/layout/Header.js`, and
// ELEVEN pages do not render Header: /settings, /dashboard, /profile, /terms,
// /privacy, /login, /onboarding, /showcase, /off-market, /about-you, /descent.
// On those pages a user had no way to reach Light / Lite / Dark — and they are
// exactly the long, text-heavy pages where someone reaches for light mode.
//
// `FloatingToolbox` is global and can open the same panel, but it is a
// draggable widget the user has to find and may have moved off to a corner.
// A settings control should not depend on remembering where you parked it.
//
// ── WHY IT SELF-SUPPRESSES RATHER THAN REPLACING THE HEADER BUTTON ──
// Moving the eye out of Header entirely would be the "one owner" answer, but
// it changes header layout on 16 pages that currently look correct, and that
// is a visual change I cannot verify on all of them. So this renders ONLY when
// no `.header-eye-btn` is on the page. Wherever Header exists, nothing changes;
// wherever it does not, the control appears. No page ends up with two.
//
// It dispatches the same `scoutit:open-display-settings` event Header does, so
// FloatingToolbox stays the single implementation of the panel itself.
// ─────────────────────────────────────────────────────────────────────────

export default function GlobalDisplayToggle() {
  const [needed, setNeeded] = useState(false);

  useEffect(() => {
    // Run after paint so Header (which may be dynamically imported) has
    // mounted; otherwise this would briefly decide "no header" on every page.
    const check = () => setNeeded(!document.querySelector(".header-eye-btn"));
    const id = requestAnimationFrame(check);

    // Client-side navigation swaps the page without remounting this component,
    // so re-check when the route changes. A control that is correct only on
    // first load is not a control.
    const observer = new MutationObserver(check);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
    };
  }, []);

  if (!needed) return null;

  return (
    <button
      type="button"
      className="global-display-toggle"
      onClick={() => window.dispatchEvent(new CustomEvent("scoutit:open-display-settings"))}
      aria-label="Display settings (Light / Lite / Dark mode)"
      title="Display settings (Light / Lite / Dark mode)"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>

      <style jsx>{`
        .global-display-toggle {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 60;
          width: 44px;   /* 44px minimum tap target */
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-mid);
          background: var(--surface);
          color: var(--text-secondary);
          cursor: pointer;
          transition: color var(--transition-fast), border-color var(--transition-fast),
                      background var(--transition-fast);
        }
        .global-display-toggle:hover {
          color: var(--accent);
          border-color: var(--accent-border);
        }
        .global-display-toggle:active { transform: scale(0.96); }
        .global-display-toggle:focus-visible {
          outline: 1.5px solid var(--accent);
          outline-offset: 2px;
        }
        /* Clear of the mobile bottom nav; the top-right corner is free on the
           headerless pages by definition. */
        @media (max-width: 768px) {
          .global-display-toggle { top: 12px; right: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .global-display-toggle { transition: none; }
          .global-display-toggle:active { transform: none; }
        }
      `}</style>
    </button>
  );
}
