"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// FAQ REVIEW QUEUE  (NEW_IDEAS.md §4, final piece)
//
// Advisors and residents can answer questions on any listing. Their answers
// go public immediately at silver/bronze tier — that's deliberate, it keeps
// the wall alive — but they carry no "✓ Confirmed" stamp until the owner
// says so. This is where the owner says so.
//
// THREE ACTIONS, not two. Confirm and Hide are obvious; the third is
// OVERRIDE — the owner answers in their own voice at gold tier, which
// outranks the silver/bronze answer without deleting it. Both stay visible.
// That matters: "the advisor said X, the owner says Y" is more useful to a
// buyer than a silently-vanished answer, and it's the honest record.
//
// MOBILE FIRST: stacked cards, full-width 44px+ actions, no hover states.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

const TIER = {
  silver: { medal: "🥈", label: "Advisor Spec",      color: "#c8ccd2" },
  bronze: { medal: "🥉", label: "Resident Verified", color: "#c98a5b" },
};

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function FAQReviewQueue({ onPendingCount }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [overrideFor, setOverrideFor] = useState(null);
  const [overrideText, setOverrideText] = useState("");

  const authHeaders = async () => {
    const { data: { session } } = await getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faqs/review", { headers: await authHeaders() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't load the review queue.");
        return;
      }
      setItems(json.items);
      onPendingCount?.(json.pendingCount);
      setError(null);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load the review queue."));
    } finally {
      setLoading(false);
    }
  }, [onPendingCount]);

  useEffect(() => { load(); }, [load]);

  const act = async (answerId, action) => {
    if (busyId) return;
    setBusyId(answerId);
    setError(null);
    try {
      const res = await fetch("/api/faqs/review", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ answerId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't apply that action.");
        return;
      }
      await load();
    } catch (e) {
      setError(sanitizeError(e, "Couldn't apply that action."));
    } finally {
      setBusyId(null);
    }
  };

  // Override = post a gold answer to the same question via the normal FAQ
  // endpoint. Server derives gold from ownership, so no tier is sent.
  const submitOverride = async () => {
    const text = overrideText.trim();
    if (!overrideFor || text.length < 2 || busyId) return;

    setBusyId(overrideFor.answerId);
    setError(null);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ faqId: overrideFor.faqId, answer: text }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't post your answer.");
        return;
      }
      setOverrideFor(null);
      setOverrideText("");
      await load();
    } catch (e) {
      setError(sanitizeError(e, "Couldn't post your answer."));
    } finally {
      setBusyId(null);
    }
  };

  const visible = items.filter((i) =>
    filter === "pending"   ? !i.isVerified && !i.isHidden
    : filter === "confirmed" ? i.isVerified && !i.isHidden
    : filter === "hidden"    ? i.isHidden
    : true,
  );

  const counts = {
    pending: items.filter((i) => !i.isVerified && !i.isHidden).length,
    confirmed: items.filter((i) => i.isVerified && !i.isHidden).length,
    hidden: items.filter((i) => i.isHidden).length,
  };

  return (
    <section className="fq-root">
      <style jsx global>{`
        /* ── MOBILE FIRST ─────────────────────────────────────────────── */
        .fq-root { display: flex; flex-direction: column; gap: 16px; }
        .fq-intro {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0;
        }
        .fq-tabs {
          display: flex;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .fq-tabs::-webkit-scrollbar { display: none; }
        .fq-tab {
          flex: 0 0 auto;
          min-height: 38px;
          padding: 0 14px;
          background: transparent;
          border: 0.5px solid var(--border-solid);
          border-radius: 999px;
          color: var(--text-secondary);
          font-family: ${MONO};
          font-size: 9.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
        }
        .fq-tab.active {
          border-color: rgba(232, 174, 60, 0.4);
          color: var(--accent);
          background: rgba(232, 174, 60, 0.08);
        }

        .fq-card {
          background: var(--surface);
          border: 0.5px solid var(--border-solid);
          border-radius: 4px;
          padding: 16px;
        }
        .fq-card__prop {
          font-family: ${MONO};
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 9px;
          overflow-wrap: anywhere;
        }
        .fq-card__q {
          font-family: var(--font-display);
          font-size: 14.5px;
          line-height: 1.45;
          color: var(--text-primary);
          margin-bottom: 12px;
        }
        .fq-ans {
          padding: 12px;
          border-radius: 0 3px 3px 0;
          background: rgba(255,255,255,0.02);
          margin-bottom: 12px;
        }
        .fq-ans__badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 8px;
        }
        .fq-badge {
          font-family: ${MONO};
          font-size: 8px;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 2px;
          white-space: nowrap;
        }
        .fq-badge--ok     { color: var(--green); border: 0.5px solid rgba(127,191,127,0.3); }
        .fq-badge--hidden { color: var(--red); border: 0.5px solid rgba(224,108,108,0.3); }
        .fq-badge--prc    { color: var(--accent); border: 0.5px solid rgba(232,174,60,0.3); }
        .fq-ans__text {
          font-family: var(--font-display);
          font-size: 13.5px;
          line-height: 1.65;
          color: var(--text-primary);
          overflow-wrap: anywhere;
          margin-bottom: 8px;
        }
        .fq-ans__meta {
          font-family: ${MONO};
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          line-height: 1.6;
        }

        .fq-actions { display: flex; flex-direction: column; gap: 7px; }
        .fq-btn {
          min-height: 44px;
          width: 100%;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s ease;
        }
        .fq-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .fq-btn--confirm { background: var(--accent-fill); border: none; color: var(--on-accent); font-weight: bold; }
        .fq-btn--ghost   { background: transparent; border: 0.5px solid var(--border-solid); color: var(--text-secondary); }
        .fq-btn--danger  { background: transparent; border: 0.5px solid rgba(224,108,108,0.35); color: var(--red); }

        .fq-override { margin-top: 10px; }
        .fq-override__input {
          width: 100%;
          box-sizing: border-box;
          background: var(--bg);
          border: 0.5px solid var(--border-solid);
          border-radius: 2px;
          padding: 11px;
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 16px; /* no iOS zoom */
          line-height: 1.55;
          resize: vertical;
        }
        .fq-override__input:focus { outline: none; border-color: var(--accent-muted); }
        .fq-override__hint {
          font-family: ${MONO};
          font-size: 8.5px;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          line-height: 1.6;
          margin: 7px 0 9px;
        }

        .fq-blank {
          padding: 26px 16px;
          background: var(--surface);
          border: 0.5px dashed var(--border-solid);
          border-radius: 3px;
          text-align: center;
          font-family: ${MONO};
          font-size: 10px;
          color: var(--text-secondary);
          letter-spacing: 0.12em;
          line-height: 1.9;
        }
        .fq-error {
          font-family: ${MONO};
          font-size: 10px;
          color: var(--red);
          letter-spacing: 0.05em;
          line-height: 1.6;
        }

        /* ── DESKTOP ──────────────────────────────────────────────────── */
        @media (min-width: 700px) {
          .fq-card { padding: 20px 22px; }
          .fq-actions { flex-direction: row; }
          .fq-btn { width: auto; flex: 1; }
        }
      `}</style>

      <p className="fq-intro">
        Advisors and residents can answer questions on your listings. Their answers go live
        immediately, but only carry a <strong style={{ color: "var(--green)" }}>✓ Confirmed</strong> stamp
        once you say so. Confirming doesn&apos;t make it your claim — it means you&apos;ve read it and
        it&apos;s accurate.
      </p>

      <div className="fq-tabs">
        {[
          ["pending", `Needs review (${counts.pending})`],
          ["confirmed", `Confirmed (${counts.confirmed})`],
          ["hidden", `Hidden (${counts.hidden})`],
          ["all", `All (${items.length})`],
        ].map(([id, label]) => (
          <button
            key={id}
            className={`fq-tab ${filter === id ? "active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="fq-error">{error}</div>}

      {loading ? (
        <div className="fq-blank">Loading review queue…</div>
      ) : visible.length === 0 ? (
        <div className="fq-blank">
          {filter === "pending"
            ? "Nothing waiting on you. Every advisor and resident answer has been reviewed."
            : "Nothing here yet."}
        </div>
      ) : (
        visible.map((item) => {
          const tier = TIER[item.tier] || TIER.bronze;
          const isBusy = busyId === item.answerId;
          const isOverriding = overrideFor?.answerId === item.answerId;

          return (
            <div className="fq-card" key={item.answerId}>
              <div className="fq-card__prop">{item.propertyTitle}</div>
              <div className="fq-card__q">{item.question}</div>

              <div className="fq-ans" style={{ borderLeft: `2px solid ${tier.color}` }}>
                <div className="fq-ans__badges">
                  <span className="fq-badge" style={{ color: tier.color, border: `0.5px solid ${tier.color}44` }}>
                    {tier.medal} {tier.label}
                  </span>
                  {item.author.prcVerified && <span className="fq-badge fq-badge--prc">PRC Verified</span>}
                  {item.isVerified && <span className="fq-badge fq-badge--ok">✓ Confirmed</span>}
                  {item.isHidden && <span className="fq-badge fq-badge--hidden">Hidden</span>}
                </div>

                <div className="fq-ans__text">{item.answer}</div>

                <div className="fq-ans__meta">
                  {item.author.name}
                  {item.author.firm ? ` · ${item.author.firm}` : ""} · {timeAgo(item.answeredAt)}
                </div>
              </div>

              {isOverriding ? (
                <div className="fq-override">
                  <textarea
                    className="fq-override__input"
                    rows={3}
                    maxLength={2000}
                    value={overrideText}
                    onChange={(e) => setOverrideText(e.target.value)}
                    placeholder="Answer in your own words…"
                    aria-label="Your answer"
                  />
                  <div className="fq-override__hint">
                    Posts as 🥇 Owner Verified. Both answers stay visible — yours ranks above theirs.
                    No contact details.
                  </div>
                  <div className="fq-actions">
                    <button
                      className="fq-btn fq-btn--ghost"
                      onClick={() => { setOverrideFor(null); setOverrideText(""); }}
                      disabled={isBusy}
                    >
                      Cancel
                    </button>
                    <button
                      className="fq-btn fq-btn--confirm"
                      onClick={submitOverride}
                      disabled={isBusy || overrideText.trim().length < 2}
                    >
                      {isBusy ? "Posting…" : "Post My Answer"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="fq-actions">
                  {item.isHidden ? (
                    <button
                      className="fq-btn fq-btn--ghost"
                      onClick={() => act(item.answerId, "unhide")}
                      disabled={isBusy}
                    >
                      {isBusy ? "…" : "Restore"}
                    </button>
                  ) : (
                    <>
                      {item.isVerified ? (
                        <button
                          className="fq-btn fq-btn--ghost"
                          onClick={() => act(item.answerId, "unconfirm")}
                          disabled={isBusy}
                        >
                          {isBusy ? "…" : "Remove Confirmation"}
                        </button>
                      ) : (
                        <button
                          className="fq-btn fq-btn--confirm"
                          onClick={() => act(item.answerId, "confirm")}
                          disabled={isBusy}
                        >
                          {isBusy ? "…" : "✓ Confirm"}
                        </button>
                      )}

                      <button
                        className="fq-btn fq-btn--ghost"
                        onClick={() => { setOverrideFor(item); setOverrideText(""); }}
                        disabled={isBusy}
                      >
                        Answer Myself
                      </button>

                      <button
                        className="fq-btn fq-btn--danger"
                        onClick={() => act(item.answerId, "hide")}
                        disabled={isBusy}
                      >
                        Hide
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </section>
  );
}
