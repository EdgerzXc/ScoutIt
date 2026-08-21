"use client";

import { useEffect } from "react";
import Link from "next/link";
import { sanitizeError, errorReference } from "@/lib/sanitizeError";
import { reportError } from "@/lib/reportError";

// ─────────────────────────────────────────────────────────────────────────
// GLOBAL ERROR BOUNDARY  (NEW_IDEAS.md §2)
//
// Without this, one crashed component white-screens the whole route -- which
// in practice means a broker mid-walkthrough, phone in hand, looking at
// nothing. This intercepts the crash and renders a dark-gold recovery card
// with a working Reload, while logging the real error to Sentry (via the
// global handler) and through the privacy-limited Sentry report helper.
//
// MOBILE FIRST: single-column stack, full-width 48px buttons, generous
// padding. The one media query widens it on desktop.
// ─────────────────────────────────────────────────────────────────────────

export default function GlobalError({ error, reset }) {
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
          background: #0d0d0d;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
        }
        .err-card {
          width: 100%;
          max-width: 420px;
          background: #161616;
          border: 0.5px solid #262626;
          border-top: 1px solid var(--accent, #E8AE3C);
          border-radius: 4px;
          padding: 28px 20px;
          box-shadow: 0 0 40px rgba(232, 174, 60, 0.06);
        }
        .err-eyebrow {
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent, #E8AE3C);
          margin-bottom: 14px;
        }
        .err-title {
          font-family: var(--font-display);
          font-size: 24px;
          line-height: 1.25;
          font-weight: 400;
          color: #f0ede8;
          margin: 0 0 10px;
        }
        .err-message {
          font-family: var(--font-display);
          font-size: 14px;
          line-height: 1.7;
          color: #8a8a8a;
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
          transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
        }
        .err-btn--gold {
          background: var(--accent-bright, #F7C64E);
          border: none;
          color: #0d0d0d;
        }
        .err-btn--gold:hover { background: var(--accent, #E8AE3C); }
        .err-btn--ghost {
          background: transparent;
          border: 0.5px solid #262626;
          color: #c8c8c8;
        }
        .err-btn--ghost:hover {
          border-color: var(--accent-muted, #6E531A);
          color: var(--accent, #E8AE3C);
        }
        .err-ref {
          font-family: var(--font-mono, 'Courier New', monospace);
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4a4a4a;
          margin-top: 20px;
          text-align: center;
        }

        @media (min-width: 700px) {
          .err-card { padding: 36px 34px; }
          .err-title { font-size: 28px; }
          .err-actions { flex-direction: row; }
          .err-btn { width: auto; flex: 1; }
        }
      `}</style>
    </div>
  );
}
