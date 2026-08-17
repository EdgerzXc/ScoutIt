"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// OWNER FAQ PRE-FLIGHT CHECKLIST PANEL
//
// The owner answers the standard buyer questions for their space category
// before the listing goes public, so it launches with real gold-tier answers
// instead of a blank Q&A wall.
//
// OPTIONAL, SCORED. Nothing here blocks publishing -- answering 5+ questions
// raises Listing Strength, which drives search placement. Carrot, not stick.
//
// MOBILE FIRST: single-column stacked cards, 16px inputs (no iOS zoom),
// 44px+ tap targets, sticky save bar pinned to the bottom of the viewport.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

export default function FAQPreflightPanel({ propertySlug, onProgressChange }) {
  const [questions, setQuestions] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [appeal, setAppeal] = useState(null);
  const [appealExplanation, setAppealExplanation] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);

  const authHeaders = async () => {
    const { data: { session } } = await getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  };

  const load = useCallback(async () => {
    if (!propertySlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/faqs/preflight?propertyId=${encodeURIComponent(propertySlug)}`, {
        headers: await authHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't load the checklist.");
        return;
      }
      setQuestions(json.questions);
      setDrafts(Object.fromEntries(json.questions.map((q) => [q.key, q.answer])));
      setProgress(json.progress);
      onProgressChange?.(json.progress);
      setError(null);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load the checklist."));
    } finally {
      setLoading(false);
    }
  }, [propertySlug, onProgressChange]);

  useEffect(() => { load(); }, [load]);

  const dirty = questions.some((q) => (drafts[q.key] ?? "") !== q.answer);
  const answeredNow = Object.values(drafts).filter((v) => (v || "").trim().length > 0).length;

  const save = async () => {
    if (saving || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      // Only send what actually changed -- keeps the payload small and makes
      // a partial edit safe to retry.
      const changed = questions
        .filter((q) => (drafts[q.key] ?? "") !== q.answer)
        .map((q) => ({ key: q.key, answer: drafts[q.key] ?? "" }));

      const res = await fetch("/api/faqs/preflight", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ propertyId: propertySlug, answers: changed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't save your answers.");
        setAppeal(json.appealAvailable && json.evidenceId ? { evidenceId: json.evidenceId, status: "ready" } : null);
        return;
      }
      setProgress(json.progress);
      onProgressChange?.(json.progress);
      setSavedAt(new Date());
      await load();
    } catch (e) {
      setError(sanitizeError(e, "Couldn't save your answers."));
    } finally {
      setSaving(false);
    }
  };

  const submitAppeal = async () => {
    if (!appeal?.evidenceId || appealBusy || appealExplanation.trim().length < 10) return;
    setAppealBusy(true);
    try {
      const res = await fetch("/api/faqs/appeal", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ evidenceId: appeal.evidenceId, explanation: appealExplanation.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setAppeal((current) => ({ ...current, status: "error", message: json.message || "Appeal could not be submitted." }));
        return;
      }
      setAppeal((current) => ({ ...current, status: "pending", message: "Appeal submitted for review." }));
    } catch {
      setAppeal((current) => ({ ...current, status: "error", message: "Network error. Try again." }));
    } finally {
      setAppealBusy(false);
    }
  };
  if (!propertySlug) return null;

  const target = progress?.target ?? 5;
  const pct = Math.min(100, Math.round((answeredNow / target) * 100));

  return (
    <section className="pf-root">
      <style jsx global>{`
        /* ── MOBILE FIRST ─────────────────────────────────────────────── */
        .pf-root {
          background: var(--surface);
          border: 0.5px solid var(--border-solid);
          border-radius: 4px;
          padding: 20px 16px 16px;
          margin-top: 20px;
        }
        .pf-eyebrow {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--accent, var(--accent));
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .pf-title {
          font-family: var(--font-display);
          font-size: 19px;
          line-height: 1.3;
          color: var(--text-primary);
          margin: 0 0 8px;
          font-weight: 400;
        }
        .pf-sub {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.65;
          color: var(--text-secondary);
          margin: 0 0 18px;
        }

        .pf-meter { margin-bottom: 20px; }
        .pf-meter__row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 7px;
        }
        .pf-meter__bar {
          height: 3px;
          background: var(--surface2);
          border-radius: 2px;
          overflow: hidden;
        }
        .pf-meter__fill {
          height: 100%;
          background: var(--accent, var(--accent-fill));
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .pf-meter__note {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-top: 8px;
          line-height: 1.6;
        }

        .pf-q {
          padding: 16px 0;
          border-bottom: 1px solid var(--border-solid);
        }
        .pf-q:last-of-type { border-bottom: none; }
        .pf-q__head {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-bottom: 6px;
        }
        .pf-q__dot {
          flex: 0 0 auto;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          margin-top: 7px;
          background: #2e2e2e;
        }
        .pf-q__dot--done { background: var(--accent, var(--accent-fill)); }
        .pf-q__text {
          font-family: var(--font-display);
          font-size: 15px;
          line-height: 1.45;
          color: var(--text-primary);
        }
        .pf-q__hint {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          line-height: 1.6;
          margin: 0 0 10px 14px;
        }
        .pf-q__input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg);
          border: 0.5px solid var(--border-solid);
          border-radius: 2px;
          padding: 11px 12px;
          color: var(--text-primary);
          font-family: var(--font-display);
          /* 16px prevents iOS Safari auto-zoom on focus */
          font-size: 16px;
          line-height: 1.55;
          resize: vertical;
        }
        .pf-q__input:focus {
          outline: none;
          border-color: var(--accent-muted, var(--accent-muted));
        }
        .pf-q__skip {
          font-family: ${MONO};
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .pf-bar {
          position: sticky;
          bottom: 0;
          background: var(--surface);
          border-top: 0.5px solid var(--border-solid);
          padding: 14px 0 4px;
          margin-top: 8px;
        }
        .pf-btn {
          width: 100%;
          min-height: 48px;
          border-radius: 3px;
          border: none;
          background: var(--accent-bright, var(--accent-fill));
          color: var(--on-accent);
          font-family: ${MONO};
          font-size: 11px;
          font-weight: bold;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .pf-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pf-status {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-align: center;
          margin-top: 9px;
          line-height: 1.6;
        }
        .pf-error {
          font-family: ${MONO};
          font-size: 10px;
          color: var(--red);
          letter-spacing: 0.05em;
          line-height: 1.6;
          margin-top: 10px;
        }

        /* ── DESKTOP ──────────────────────────────────────────────────── */
        @media (min-width: 700px) {
          .pf-root { padding: 26px 26px 18px; }
          .pf-title { font-size: 22px; }
          .pf-btn { width: auto; min-width: 220px; padding: 0 32px; }
          .pf-bar { display: flex; align-items: center; gap: 16px; }
          .pf-status { margin-top: 0; text-align: left; }
        }
      `}</style>

      <div className="pf-eyebrow">Pre-Flight · Buyer Questions</div>
      <h3 className="pf-title">Answer what buyers always ask</h3>
      <p className="pf-sub">
        These publish as <strong style={{ color: "var(--accent)" }}>Owner Verified</strong> answers on your
        listing. ScoutIt never writes them for you — an unanswered question stays blank rather than
        guessed. Skip anything that doesn&apos;t apply.
      </p>

      <div className="pf-meter">
        <div className="pf-meter__row">
          <span>{answeredNow} of {questions.length} answered</span>
          <span style={{ color: answeredNow >= target ? "var(--accent)" : "var(--text-muted)" }}>
            {answeredNow >= target ? "✓ Strength bonus earned" : `${target} to earn bonus`}
          </span>
        </div>
        <div className="pf-meter__bar">
          <div className="pf-meter__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="pf-meter__note">
          Answering {target}+ raises your Listing Strength score, which lifts your placement in
          search. Publishing is never blocked.
        </div>
      </div>

      {loading ? (
        <div className="pf-status">Loading checklist…</div>
      ) : (
        questions.map((q) => {
          const value = drafts[q.key] ?? "";
          const done = value.trim().length > 0;
          return (
            <div className="pf-q" key={q.key}>
              <div className="pf-q__head">
                <span className={`pf-q__dot ${done ? "pf-q__dot--done" : ""}`} />
                <span className="pf-q__text">{q.question}</span>
              </div>
              <div className="pf-q__hint">{q.hint}</div>
              <textarea
                className="pf-q__input"
                rows={2}
                maxLength={2000}
                value={value}
                onChange={(e) => setDrafts((d) => ({ ...d, [q.key]: e.target.value }))}
                placeholder="Leave blank if it doesn't apply"
                aria-label={q.question}
              />
              {!done && <div className="pf-q__skip">Blank — will not appear on the listing</div>}
            </div>
          );
        })
      )}

      {error && <div className="pf-error">{error}</div>}
      {appeal && (
        <div className="pf-error" role="status" aria-live="polite">
          {appeal.status === "ready" || appeal.status === "error" ? (
            <>
              <label htmlFor="faq-appeal-explanation">Think this was blocked by mistake?</label>
              <textarea id="faq-appeal-explanation" className="pf-q__input" value={appealExplanation}
                onChange={(event) => setAppealExplanation(event.target.value)} maxLength={500} disabled={appealBusy}
                placeholder="Explain why the answer is legitimate without repeating contact details." />
              <button className="pf-btn" onClick={submitAppeal} disabled={appealBusy || appealExplanation.trim().length < 10}>
                {appealBusy ? "Submitting..." : "Request review"}
              </button>
              {appeal.message && <div>{appeal.message}</div>}
            </>
          ) : <div>{appeal.message}</div>}
        </div>
      )}

      <div className="pf-bar">
        <button className="pf-btn" onClick={save} disabled={saving || !dirty}>
          {saving ? "Saving…" : dirty ? "Save Answers" : "Saved"}
        </button>
        <div className="pf-status">
          {dirty
            ? "Unsaved changes"
            : savedAt
              ? `Saved ${savedAt.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })}`
              : "No contact details — they're blocked automatically"}
        </div>
      </div>
    </section>
  );
}
