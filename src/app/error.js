"use client";

import { useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import ScoutItMark from "@/components/brand/ScoutItMark";
import { sanitizeError, errorReference } from "@/lib/sanitizeError";
import { reportError } from "@/lib/reportError";

// ─────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR BOUNDARY  (NEW_IDEAS.md §2)
//
// Without this, one crashed component white-screens the whole route -- which
// in practice means a broker mid-walkthrough, phone in hand, looking at
// nothing. This intercepts the crash and renders a theme-aware recovery card
// with a working Reload, while logging the real error to Sentry (via the
// global handler) and through the privacy-limited Sentry report helper.
//
// MOBILE FIRST: single-column stack, full-width 48px buttons, generous
// padding. The one media query widens it on desktop.
// ─────────────────────────────────────────────────────────────────────────

export default function GlobalError({ error, reset }) {
  useLayoutEffect(() => {
    // A failed hydration can replace the root body class before the normal
    // display controller mounts. Keep the recovery card in the saved mode.
    try {
      let mode = localStorage.getItem("scoutit_display_mode");
      if (!mode && localStorage.getItem("scoutit_accessibility_mode") === "high-contrast") {
        mode = "high-contrast";
      }
      document.body.classList.toggle("high-contrast", mode === "high-contrast");
      document.body.classList.toggle("light-mode", mode === "light");
    } catch {
      // Storage may be blocked; the page stays on its dark default.
    }
  }, []);

  useEffect(() => {
    // Best-effort — the logger must never throw inside an error boundary.
    reportError({
      kind: "crash",
      message: error?.message,
      stack: error?.stack,
      context: { digest: error?.digest, boundary: "app/error.js" },
    }).catch(() => {});
  }, [error]);

  const message = sanitizeError(error);
  const reference = errorReference(error);

  return (
    <div className="err-root">
      <div className="err-card" role="alert">
        <ScoutItMark size={44} className="err-mark" />
        <div className="err-eyebrow">Signal Interrupted</div>

        <h1 className="err-title">Unable to load this section</h1>
        <p className="err-message">{message}</p>

        <div className="err-actions">
          <button className="err-btn err-btn--gold" onClick={() => reset()}>
            Reload
          </button>
          <Link href="/discover" className="err-btn err-btn--ghost">
            Back to the Map
          </Link>
        </div>

        <div className="err-ref">Reference · {reference}</div>
      </div>

      <style jsx global>{`
        .err-root {
          min-height: 100vh;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .err-card {
          width: 100%;
          max-width: 420px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-top-color: var(--accent-border);
          border-radius: 4px;
          padding: 28px 20px;
          box-shadow: var(--shadow-glow-soft);
        }
        .err-mark {
          color: var(--accent);
          display: block;
          margin: 0 auto 16px;
          opacity: 0.9;
        }
        .err-eyebrow {
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 14px;
        }
        .err-title {
          font-family: var(--font-display);
          font-size: 24px;
          line-height: 1.25;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 10px;
        }
        .err-message {
          font-family: var(--font-display);
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 24px;
        }
        .err-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .err-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          width: 100%;
          box-sizing: border-box;
          border-radius: 3px;
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
          transition: background-color var(--transition), border-color var(--transition), color var(--transition), transform var(--transition);
        }
        .err-btn--gold {
          background: var(--accent-fill);
          border: none;
          color: var(--on-accent);
        }
        .err-btn--ghost {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-primary);
        }
        .err-btn:active { transform: scale(0.98); }
        @media (hover: hover) and (pointer: fine) {
          .err-btn--gold:hover { background: var(--accent-fill-hover); }
          .err-btn--ghost:hover {
            border-color: var(--accent-border);
            color: var(--accent);
          }
        }
        .err-ref {
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-top: 20px;
          text-align: center;
        }

        @media (min-width: 700px) {
          .err-card { padding: 36px 34px; }
          .err-title { font-size: 28px; }
          .err-actions { flex-direction: row; }
          .err-btn { width: auto; flex: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .err-btn { transition: none; }
          .err-btn:active { transform: none; }
        }
      `}</style>
    </div>
  );
}
