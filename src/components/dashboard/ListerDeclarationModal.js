"use client";

import { useEffect, useRef, useState } from "react";
import {
  LISTER_RELATIONSHIPS,
  OWNER_SOVEREIGNTY_DISCLAIMER,
  DISCLAIMER_VERSION,
} from "@/lib/listerRelationship";

// ─────────────────────────────────────────────────────────────────────────
// LISTER RELATIONSHIP DECLARATION — the publish gate
// NEW_IDEAS.md §34.3 · NEW_IDEAS_2.md §50 · WORK ORDER W2
//
// `/api/dashboard/publish` returns 422 { requiresDeclaration: true } when a
// listing has never been declared. This is the screen that answers it. Until
// it existed the route was unanswerable and NOTHING could be published — the
// 200-listing north star was blocked on a missing form.
//
// ── WHY IT IS BLOCKING, WHEN ALMOST NOTHING ELSE IS ─────────────────
// MonthlyFreshnessModal is deliberately dismissible: a nagged owner clicks
// whatever clears fastest, and there the fast click is a claim about accuracy.
// This modal is the opposite case. It is not a nag — it is the last step of an
// action the user just deliberately started, and RESA RA 9646 says the claim
// cannot go public undeclared. So: no dismiss-and-continue. Cancel means the
// listing stays a draft, which is stated plainly rather than implied.
//
// ── EMOJI ICONS DELIBERATELY NOT RENDERED ───────────────────────────
// LISTER_RELATIONSHIPS carries an `icon` per option. 02_FRONTEND_STANDARD's
// anti-slop list bars emoji-as-iconography in production UI, and this is a
// legal declaration — the least appropriate surface on the site for a 🏠. The
// label and the detail line carry the meaning on their own.
//
// ── ORDER IS AUTHORITY ──────────────────────────────────────────────
// Rendered in LISTER_RELATIONSHIPS order, which descends by authority, so the
// strongest claim is read first. Nothing is pre-selected: a default here would
// manufacture a legal claim from inattention, the same failure §47.2 closed on
// adult_eligibility_status.
//
// Mobile first: full-screen sheet at 390px, centred card from 700px.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

export default function ListerDeclarationModal({
  open,
  listingTitle,
  busy = false,
  error = null,
  onSubmit,
  onCancel,
}) {
  const [relationship, setRelationship] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState(false);
  const cardRef = useRef(null);

  // A fresh prompt must never inherit the previous listing's answers.
  useEffect(() => {
    if (open) {
      setRelationship(null);
      setAgreed(false);
      setTouched(false);
      // Focus the card, not the first radio — landing on "Direct Property
      // Owner" with a screen reader mid-announcement is how someone agrees to
      // the wrong thing.
      requestAnimationFrame(() => cardRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onCancel?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  // `agreed === true` only — the server validates identically. A truthy check
  // here would let a non-boolean through and produce a passing UI against a
  // rejecting API.
  const ready = Boolean(relationship) && agreed === true;

  const submit = () => {
    setTouched(true);
    if (!ready || busy) return;
    onSubmit?.({ relationship, agreed: true });
  };

  return (
    <div className="ld-overlay" role="presentation">
      <style jsx global>{`
        /* ── MOBILE FIRST (390px): full-screen sheet ──────────────────── */
        .ld-overlay {
          position: fixed;
          inset: 0;
          z-index: 950;
          background: rgba(8, 8, 8, 0.88);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: ldFade 180ms ease-out;
        }
        .ld-card {
          width: 100%;
          max-height: 92dvh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: #121212;
          border: 0.5px solid #262626;
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          padding: 22px 18px calc(18px + env(safe-area-inset-bottom, 0px));
          outline: none;
          animation: ldRise 220ms ease-out;
        }
        @keyframes ldFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ldRise {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ld-overlay, .ld-card { animation: none; }
          .ld-opt, .ld-btn { transition: none; }
        }

        .ld-eyebrow {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--accent, #E8AE3C);
          letter-spacing: 0.22em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .ld-title {
          font-family: Georgia, serif;
          font-size: 20px;
          line-height: 1.3;
          color: #f0ede8;
          margin: 0 0 8px;
          font-weight: 400;
        }
        .ld-sub {
          font-family: Georgia, serif;
          font-size: 13px;
          line-height: 1.7;
          color: #8a8a8a;
          margin: 0 0 6px;
        }
        .ld-listing {
          font-family: ${MONO};
          font-size: 9px;
          color: #6a6a6a;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          overflow-wrap: anywhere;
          margin-bottom: 18px;
        }

        .ld-legend {
          font-family: ${MONO};
          font-size: 9px;
          color: #8a8a8a;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          padding: 0;
          margin-bottom: 10px;
        }
        .ld-fieldset { border: none; padding: 0; margin: 0 0 4px; }

        .ld-opt {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          width: 100%;
          text-align: left;
          min-height: 44px;
          padding: 14px 13px;
          margin-bottom: 8px;
          background: #161616;
          border: 0.5px solid #262626;
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 160ms ease-out, background-color 160ms ease-out;
        }
        .ld-opt:hover { border-color: #3a3a3a; }
        .ld-opt:focus-within { outline: 2px solid #6E531A; outline-offset: 2px; }
        .ld-opt--on {
          background: rgba(232, 174, 60, 0.06);
          border-color: var(--accent-muted, #6E531A);
        }
        .ld-radio {
          flex: 0 0 auto;
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: #E8AE3C;
          cursor: pointer;
        }
        .ld-opt__main { min-width: 0; flex: 1; }
        .ld-opt__label {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.35;
          color: #f0ede8;
          margin-bottom: 4px;
        }
        .ld-opt__detail {
          font-family: Georgia, serif;
          font-size: 12.5px;
          line-height: 1.6;
          color: #8a8a8a;
        }

        .ld-disclaimer {
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid var(--accent-muted, #6E531A);
          padding: 12px 13px;
          margin: 16px 0 12px;
          font-family: Georgia, serif;
          font-size: 12.5px;
          line-height: 1.65;
          color: #c8c8c8;
        }
        .ld-disclaimer__head {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--accent, #E8AE3C);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .ld-version {
          font-family: ${MONO};
          font-size: 8.5px;
          color: #5a5a5a;
          letter-spacing: 0.1em;
          margin-top: 9px;
        }

        .ld-agree {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          min-height: 44px;
          padding: 11px 2px;
          cursor: pointer;
        }
        .ld-agree__box {
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin-top: 1px;
          accent-color: #E8AE3C;
          cursor: pointer;
        }
        .ld-agree__text {
          font-family: Georgia, serif;
          font-size: 13px;
          line-height: 1.6;
          color: #c8c8c8;
        }

        .ld-hint {
          font-family: ${MONO};
          font-size: 9.5px;
          color: #8a8a8a;
          letter-spacing: 0.06em;
          line-height: 1.7;
          margin-top: 8px;
        }
        .ld-error {
          font-family: ${MONO};
          font-size: 10px;
          color: #e8644a;
          letter-spacing: 0.05em;
          line-height: 1.7;
          margin-top: 10px;
        }

        .ld-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
          position: sticky;
          bottom: 0;
          background: #121212;
          padding-top: 12px;
        }
        .ld-btn {
          min-height: 48px;
          width: 100%;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 140ms ease-out, opacity 140ms ease-out;
        }
        .ld-btn:active { transform: scale(0.97); }
        .ld-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .ld-btn:disabled:active { transform: none; }
        .ld-btn--gold  { background: #F7C64E; border: none; color: #0d0d0d; font-weight: bold; }
        .ld-btn--ghost { background: transparent; border: 0.5px solid #262626; color: #c8c8c8; }
        .ld-btn:focus-visible { outline: 2px solid #E8AE3C; outline-offset: 2px; }

        /* ── 700px+: centred card ─────────────────────────────────────── */
        @media (min-width: 700px) {
          .ld-overlay { align-items: center; padding: 28px; }
          .ld-card {
            max-width: 560px;
            border-radius: 6px;
            border-bottom: 0.5px solid #262626;
            padding: 28px 30px 24px;
          }
          .ld-title { font-size: 23px; }
          .ld-actions { flex-direction: row-reverse; }
          .ld-btn { width: auto; flex: 1; }
        }
      `}</style>

      <div
        className="ld-card"
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ld-title"
      >
        <div className="ld-eyebrow">Before this goes live</div>
        <h2 className="ld-title" id="ld-title">
          How are you related to this property?
        </h2>
        <p className="ld-sub">
          Philippine law (RESA RA 9646) requires whoever publishes a listing to state their
          standing. Asked once per listing — you won&apos;t see this again on re-publish.
        </p>
        {listingTitle && <div className="ld-listing">{listingTitle}</div>}

        <fieldset className="ld-fieldset">
          <legend className="ld-legend">Select one</legend>
          {LISTER_RELATIONSHIPS.map((option) => (
            <label
              key={option.value}
              className={`ld-opt${relationship === option.value ? " ld-opt--on" : ""}`}
            >
              <input
                type="radio"
                className="ld-radio"
                name="lister-relationship"
                value={option.value}
                checked={relationship === option.value}
                onChange={() => setRelationship(option.value)}
                disabled={busy}
              />
              <span className="ld-opt__main">
                <span className="ld-opt__label">{option.label}</span>
                <span className="ld-opt__detail">{option.detail}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="ld-disclaimer">
          <div className="ld-disclaimer__head">Owner Sovereignty</div>
          {OWNER_SOVEREIGNTY_DISCLAIMER}
          <div className="ld-version">Disclaimer {DISCLAIMER_VERSION}</div>
        </div>

        <label className="ld-agree">
          <input
            type="checkbox"
            className="ld-agree__box"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked === true)}
            disabled={busy}
          />
          <span className="ld-agree__text">
            I confirm the statement above is true, and I acknowledge the Owner Sovereignty terms.
          </span>
        </label>

        {touched && !ready && !error && (
          <div className="ld-hint">
            {!relationship
              ? "Choose how you are related to this property."
              : "Tick the acknowledgement to publish."}
          </div>
        )}
        {error && <div className="ld-error" role="alert">{error}</div>}

        <div className="ld-actions">
          <button
            type="button"
            className="ld-btn ld-btn--gold"
            onClick={submit}
            disabled={busy || !ready}
          >
            {busy ? "Publishing…" : "Declare & publish"}
          </button>
          <button
            type="button"
            className="ld-btn ld-btn--ghost"
            onClick={() => onCancel?.()}
            disabled={busy}
          >
            Cancel — keep as draft
          </button>
        </div>
      </div>
    </div>
  );
}
