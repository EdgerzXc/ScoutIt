"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/authClient";

// ─────────────────────────────────────────────────────────────────────────
// PER-PROPERTY 3-TIER FAQ  (NEW_IDEAS.md §4)
//
// MOBILE-FIRST: every dimension below is the phone layout. The single
// `@media (min-width: 700px)` block in the injected stylesheet is the only
// place desktop diverges. Tap targets are >=44px, the composer is a full
// -width stacked block, and tier badges wrap rather than truncate.
//
// Tier is displayed, never chosen -- the server derives authority from the
// listing's owner_id and the caller's PRC/role state. See /api/faqs.
// ─────────────────────────────────────────────────────────────────────────

const TIERS = {
  gold: {
    medal: "🥇",
    label: "Owner Verified",
    color: "#E8AE3C",
    border: "rgba(232, 174, 60, 0.42)",
    bg: "rgba(232, 174, 60, 0.07)",
    glow: "0 0 18px rgba(232, 174, 60, 0.14)",
    blurb: "Canonical truth — house rules, lease terms, legal status.",
  },
  silver: {
    medal: "🥈",
    label: "Advisor Spec",
    color: "#c8ccd2",
    border: "rgba(200, 204, 210, 0.30)",
    bg: "rgba(200, 204, 210, 0.05)",
    glow: "0 0 14px rgba(200, 204, 210, 0.08)",
    blurb: "Measured specs, floor logistics, availability.",
  },
  bronze: {
    medal: "🥉",
    label: "Resident Verified",
    color: "#c98a5b",
    border: "rgba(201, 138, 91, 0.30)",
    bg: "rgba(201, 138, 91, 0.05)",
    glow: "none",
    blurb: "Lived reality — cell signal, elevator wait, noise stack.",
  },
};

const MONO = "var(--font-mono)";

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", year: "numeric" });
}

// ── Sub-component: one tier-badged answer ────────────────────────────────
function AnswerCard({ answer }) {
  const tier = TIERS[answer.tier] || TIERS.bronze;

  return (
    <div
      className="faq-answer"
      style={{ background: tier.bg, borderLeft: `2px solid ${tier.color}`, boxShadow: tier.glow }}
    >
      <div className="faq-answer__head">
        <span className="faq-badge" style={{ color: tier.color, border: `0.5px solid ${tier.border}` }}>
          {tier.medal} {tier.label}
        </span>
        {answer.isVerified && (
          <span className="faq-badge faq-badge--confirmed">✓ Confirmed</span>
        )}
      </div>

      <p className="faq-answer__text">{answer.text}</p>

      <div className="faq-answer__meta">
        {answer.author}
        {answer.firm ? ` · ${answer.firm}` : ""} · {timeAgo(answer.answeredAt)}
      </div>
    </div>
  );
}

// ── Sub-component: one question + its stacked answers ────────────────────
function QuestionThread({ faq, onAnswered, canAnswer }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    const text = draft.trim();
    if (text.length < 2 || busy) return;

    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ faqId: faq.id, answer: text }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't post that answer.");
        return;
      }
      setDraft("");
      setOpen(false);
      onAnswered();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="faq-thread">
      <h3 className="faq-thread__q">{faq.question}</h3>
      <div className="faq-thread__asked">
        {faq.askedBy
          ? `Asked by ${faq.askedBy} · ${timeAgo(faq.askedAt)}`
          : "Standard question for this space type"}
      </div>

      {faq.answers.length > 0 ? (
        <div className="faq-thread__answers">
          {faq.answers.map((a) => <AnswerCard key={a.id} answer={a} />)}
        </div>
      ) : (
        // Honest Blank Rule — never fabricate an answer.
        <div className="faq-thread__empty">Awaiting a verified answer.</div>
      )}

      {canAnswer && (
        open ? (
          <div className="faq-composer">
            <textarea
              className="faq-composer__input"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Answer from what you actually know. No contact details."
              maxLength={2000}
              rows={3}
            />
            {error && <div className="faq-error">{error}</div>}
            <div className="faq-composer__actions">
              <button className="faq-btn faq-btn--ghost" onClick={() => { setOpen(false); setError(null); }} disabled={busy}>
                Cancel
              </button>
              <button className="faq-btn faq-btn--gold" onClick={submit} disabled={busy || draft.trim().length < 2}>
                {busy ? "Posting…" : "Post Answer"}
              </button>
            </div>
          </div>
        ) : (
          <button className="faq-btn faq-btn--ghost faq-btn--block" onClick={() => setOpen(true)}>
            + Add your answer
          </button>
        )
      )}
    </article>
  );
}

// ── Main section ─────────────────────────────────────────────────────────
export default function PropertyFAQSection({ propertySlug, propertyTitle }) {
  const [faqs, setFaqs] = useState([]);
  const [archivedFaqs, setArchivedFaqs] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState(null);

  const load = useCallback(async () => {
    if (!propertySlug) return;
    try {
      const res = await fetch(`/api/faqs?propertyId=${encodeURIComponent(propertySlug)}`);
      const json = await res.json();
      setFaqs(json.success ? (json.faqs || []) : []);
      setArchivedFaqs(json.success ? (json.archivedFaqs || []) : []);
    } catch {
      setFaqs([]);
      setArchivedFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [propertySlug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let alive = true;
    getSession()
      .then(({ data: { session } }) => { if (alive) setSignedIn(!!session?.access_token); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const ask = async () => {
    const text = question.trim();
    if (text.length < 5 || asking) return;

    setAsking(true);
    setAskError(null);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ propertyId: propertySlug, question: text }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setAskError(json.message || "Couldn't post that question.");
        return;
      }
      setQuestion("");
      await load();
    } catch {
      setAskError("Network error. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  if (!propertySlug) return null;

  return (
    <section className="faq-section" id="property-faqs" aria-label="Questions and answers">
      <style jsx global>{`
        /* ── MOBILE FIRST (phone is the base layout) ─────────────────── */
        .faq-section {
          margin: 32px 0 0;
          padding: 24px 16px 32px;
          background: var(--surface2, #121212);
          border-top: 0.5px solid var(--border, #262626);
        }
        .faq-section__eyebrow {
          font-family: ${MONO};
          font-size: var(--type-micro);
          color: var(--text-secondary);
          letter-spacing: var(--track-label);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .faq-section__title {
          font-family: var(--font-display);
          font-size: 22px;
          line-height: 1.25;
          color: var(--text-primary, #f0ede8);
          margin: 0 0 6px;
          font-weight: 400;
        }
        .faq-section__sub {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary, #8a8a8a);
          margin: 0 0 20px;
        }

        /* Tier legend — horizontal scroll on phone, no squeeze */
        .faq-legend {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          margin-bottom: 22px;
          padding-bottom: 2px;
        }
        .faq-legend::-webkit-scrollbar { display: none; }
        .faq-legend__item {
          flex: 0 0 auto;
          padding: 8px 12px;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: var(--type-floor);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        /* Ask composer */
        .faq-ask {
          background: var(--surface, #161616);
          border: 0.5px solid var(--border, #262626);
          border-radius: 4px;
          padding: 16px;
          margin-bottom: 24px;
        }
        .faq-ask__label {
          font-family: ${MONO};
          font-size: var(--type-floor);
          color: #E8AE3C;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          display: block;
          margin-bottom: 10px;
        }
        .faq-input,
        .faq-composer__input {
          width: 100%;
          box-sizing: border-box;
          background: var(--surface2, #0e0e0e);
          border: 0.5px solid var(--border, #262626);
          border-radius: 2px;
          padding: 12px;
          color: var(--text-primary, #f0ede8);
          font-family: var(--font-display);
          /* 16px prevents iOS Safari auto-zoom on focus */
          font-size: 16px;
          line-height: 1.5;
          resize: vertical;
        }
        .faq-input:focus,
        .faq-composer__input:focus {
          outline: none;
          border-color: #6E531A;
        }
        .faq-hint {
          font-family: ${MONO};
          font-size: var(--type-floor);
          color: var(--text-muted, #6a6a6a);
          letter-spacing: 0.08em;
          margin-top: 8px;
        }

        /* Buttons — 44px min tap target */
        .faq-btn {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: var(--type-micro);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s ease, border-color 0.15s ease;
        }
        .faq-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .faq-btn--block { width: 100%; margin-top: 12px; }
        .faq-btn--gold {
          background: #F7C64E;
          border: none;
          color: #0d0d0d;
          font-weight: bold;
        }
        .faq-btn--ghost {
          background: transparent;
          border: 0.5px solid var(--border, #262626);
          color: var(--text-primary, #c8c8c8);
        }
        .faq-btn--ghost:hover { border-color: #6E531A; color: #E8AE3C; }

        /* Threads */
        .faq-thread {
          padding: 20px 0;
          border-bottom: 1px solid var(--border, #1e1e1e);
        }
        .faq-thread:last-child { border-bottom: none; }
        .faq-thread__q {
          font-family: var(--font-display);
          font-size: 16px;
          line-height: 1.45;
          color: var(--text-primary, #f0ede8);
          margin: 0 0 6px;
          font-weight: 400;
        }
        .faq-thread__asked {
          font-family: ${MONO};
          font-size: var(--type-floor);
          color: var(--text-secondary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .faq-thread__answers { display: flex; flex-direction: column; gap: 10px; }
        .faq-thread__empty {
          font-family: ${MONO};
          font-size: var(--type-micro);
          color: var(--text-secondary);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px;
          border: 0.5px dashed #262626;
          border-radius: 3px;
        }

        .faq-answer { padding: 14px; border-radius: 0 3px 3px 0; }
        .faq-answer__head {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }
        .faq-badge {
          font-family: ${MONO};
          font-size: var(--type-floor);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 2px;
          white-space: nowrap;
        }
        .faq-badge--confirmed {
          color: #7fbf7f;
          border: 0.5px solid rgba(127, 191, 127, 0.3);
        }
        .faq-answer__text {
          font-family: var(--font-display);
          font-size: 14px;
          line-height: 1.65;
          color: #d8d5d0;
          margin: 0 0 10px;
          overflow-wrap: anywhere;
        }
        .faq-answer__meta {
          font-family: ${MONO};
          font-size: var(--type-floor);
          color: var(--text-secondary);
          letter-spacing: 0.08em;
        }

        .faq-composer { margin-top: 12px; }
        .faq-composer__actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }
        .faq-composer__actions .faq-btn { flex: 1; }

        .faq-error {
          font-family: ${MONO};
          font-size: var(--type-micro);
          color: #e06c6c;
          letter-spacing: 0.06em;
          margin-top: 8px;
          line-height: 1.5;
        }

        .faq-signin {
          font-family: ${MONO};
          font-size: var(--type-micro);
          color: #8a8a8a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          padding: 16px;
          text-align: center;
          border: 0.5px dashed #262626;
          border-radius: 3px;
          margin-bottom: 24px;
          line-height: 1.7;
        }
        .faq-signin a { color: var(--accent); text-decoration: underline; text-underline-offset: 0.2em; }

        /* ── DESKTOP ENHANCEMENT (only divergence from mobile) ────────── */
        @media (min-width: 700px) {
          .faq-section { padding: 40px 48px 48px; }
          .faq-section__title { font-size: 28px; }
          .faq-legend { overflow-x: visible; flex-wrap: wrap; }
          .faq-ask { padding: 22px 24px; }
          .faq-thread__q { font-size: 18px; }
          .faq-answer { padding: 16px 18px; }
          .faq-composer__actions .faq-btn { flex: 0 0 auto; }
          .faq-btn--block { width: auto; }
        }
      `}</style>

      <div className="faq-section__eyebrow">Questions & Answers</div>
      <h2 className="faq-section__title">
        What people actually asked{propertyTitle ? ` about ${propertyTitle}` : ""}
      </h2>
      <p className="faq-section__sub">
        Answers are ranked by verified authority, not by popularity. Nothing here is generated —
        if no one has answered, the space stays blank.
      </p>

      <div className="faq-legend" tabIndex={0} aria-label="Answer authority legend">
        {Object.entries(TIERS).map(([key, t]) => (
          <div
            key={key}
            className="faq-legend__item"
            style={{ color: t.color, background: t.bg, border: `0.5px solid ${t.border}` }}
          >
            {t.medal} {t.label}
          </div>
        ))}
      </div>

      {signedIn ? (
        <div className="faq-ask">
          <label className="faq-ask__label" htmlFor="faq-question-input">
            Ask about this space
          </label>
          <textarea
            id="faq-question-input"
            className="faq-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Is there a dedicated fibre riser on this floor?"
            maxLength={500}
            rows={3}
          />
          {askError && <div className="faq-error">{askError}</div>}
          <div className="faq-hint">
            Phone numbers, emails and external links are blocked — keep the deal on ScoutIt.
          </div>
          <button
            className="faq-btn faq-btn--gold faq-btn--block"
            onClick={ask}
            disabled={asking || question.trim().length < 5}
          >
            {asking ? "Posting…" : "Post Question"}
          </button>
        </div>
      ) : (
        <div className="faq-signin">
          <Link href="/onboarding">Sign in</Link> to ask a question or add a verified answer.
        </div>
      )}

      {loading ? (
        <div className="faq-thread__empty">Loading questions…</div>
      ) : faqs.length === 0 && archivedFaqs.length === 0 ? (
        <div className="faq-thread__empty">
          No questions yet — be the first to ask.
        </div>
      ) : (
        <>
          {faqs.map((faq) => (
            <QuestionThread key={faq.id} faq={faq} onAnswered={load} canAnswer={signedIn} />
          ))}

          {archivedFaqs.length > 0 && (
            <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px dashed rgba(110, 83, 26, 0.4)" }}>
              <button
                className="faq-btn faq-btn--ghost faq-btn--block"
                style={{
                  transition: "transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 160ms ease, color 160ms ease",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.06em",
                }}
                onClick={() => setShowArchive(!showArchive)}
              >
                {showArchive
                  ? `HIDE UNANSWERED ARCHIVE (${archivedFaqs.length}) ▲`
                  : `SHOW UNANSWERED ARCHIVE (>90D) (${archivedFaqs.length}) ▼`}
              </button>
              {showArchive && (
                <div
                  style={{
                    marginTop: "16px",
                    animation: "faqArchiveFadeIn 200ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                >
                  {archivedFaqs.map((faq) => (
                    <QuestionThread key={faq.id} faq={faq} onAnswered={load} canAnswer={signedIn} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
