"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";
import FreshnessBadge from "@/components/ui/FreshnessBadge";

// ─────────────────────────────────────────────────────────────────────────
// MONTHLY RE-VERIFICATION GATE  (NEW_IDEAS.md §21.2)
//
// The daily cron has been telling owners "Re-confirm its details" with
// nowhere to do it. This is the somewhere.
//
// ── NON-BLOCKING, DELIBERATELY ──────────────────────────────────────
// The spec calls it a "gate" and describes a blackout overlay. It's built
// as dismissible instead. A modal that traps an owner out of their own
// dashboard on the 1st of the month trains them to resent the product, and
// they'll click whatever clears it fastest — which is exactly the failure
// mode here, because the fast click is "confirm" and confirming is a CLAIM
// ABOUT ACCURACY. Coercing that button is how a directory fills with
// confidently-wrong data that carries an owner's name.
//
// Dismissal is remembered for the calendar month via localStorage, so it
// asks once and then leaves them alone.
//
// ── CONFIRM IS AN ASSERTION, NOT A SCORE BUTTON ─────────────────────
// The copy says so plainly, and "Update Specs" sits next to it with equal
// weight. An owner whose price changed must not feel that confirming is the
// path of least resistance.
//
// Mobile first: full-screen sheet on a phone, centred card on desktop.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

function dismissKey() {
  const now = new Date();
  return `scoutit_freshness_dismissed_${now.getFullYear()}_${now.getMonth()}`;
}

export default function MonthlyFreshnessModal({ onOpenEditor }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [done, setDone] = useState(null);

  const load = useCallback(async () => {
    try {
      // Already dismissed this month — don't even fetch.
      if (typeof window !== "undefined" && window.localStorage.getItem(dismissKey())) return;

      const { data: { session } } = await getSession();
      if (!session?.access_token) return;

      const res = await fetch("/api/dashboard/verify-freshness", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok || !json.success) return;

      const stale = json.items.filter((i) => i.freshness.id !== "fresh");
      if (stale.length === 0) return;

      setItems(stale);
      setSelected(new Set(stale.map((i) => i.id)));
      setOpen(true);
    } catch {
      /* the audit prompt is a nudge — never surface a failure for it */
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dismiss = () => {
    try { window.localStorage.setItem(dismissKey(), "1"); } catch { /* private mode */ }
    setOpen(false);
  };

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const confirmSelected = async () => {
    if (busy || selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/dashboard/verify-freshness", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ propertyIds: [...selected] }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || "Couldn't confirm those listings.");
        return;
      }
      setDone({
        count: json.verifiedCount,
        // Surfaced rather than swallowed — a failed CMS sync means the
        // PUBLIC badge is still stale even though the owner's action saved.
        cmsSyncPending: json.cmsSyncPending || [],
      });
      try { window.localStorage.setItem(dismissKey(), "1"); } catch { /* ignore */ }
    } catch (e) {
      setError(sanitizeError(e, "Couldn't confirm those listings."));
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="mf-overlay" role="dialog" aria-modal="true" aria-label="Monthly portfolio audit">
      <style jsx global>{`
        /* ── MOBILE FIRST: full-screen sheet ──────────────────────────── */
        .mf-overlay {
          position: fixed;
          inset: 0;
          z-index: 900;
          background: rgba(8, 8, 8, 0.86);
          backdrop-filter: blur(7px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
        }
        .mf-card {
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          background: var(--surface);
          border: 0.5px solid var(--border-solid);
          border-bottom: none;
          border-radius: 10px 10px 0 0;
          padding: 22px 18px 18px;
        }
        .mf-eyebrow {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--accent, var(--accent));
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .mf-title {
          font-family: var(--font-display);
          font-size: 20px;
          line-height: 1.3;
          color: var(--text-primary);
          margin: 0 0 8px;
          font-weight: 400;
        }
        .mf-sub {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 18px;
        }
        .mf-row {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          padding: 13px 0;
          border-bottom: 1px solid var(--border-solid);
        }
        .mf-check {
          flex: 0 0 auto;
          width: 20px;
          height: 20px;
          margin-top: 2px;
          accent-color: var(--accent);
          cursor: pointer;
        }
        .mf-row__main { min-width: 0; flex: 1; }
        .mf-row__title {
          font-family: var(--font-display);
          font-size: 14.5px;
          color: var(--text-primary);
          line-height: 1.35;
          overflow-wrap: anywhere;
          margin-bottom: 5px;
        }
        .mf-row__loc {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .mf-row__edit {
          background: none;
          border: none;
          padding: 8px 0 0;
          color: var(--text-secondary);
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: underline;
          min-height: 36px;
        }
        .mf-row__edit:hover { color: var(--accent, var(--accent)); }

        .mf-warn {
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid var(--accent-muted, var(--accent-muted));
          padding: 11px 13px;
          margin: 16px 0;
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.65;
          color: var(--text-secondary);
        }
        .mf-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 18px;
          position: sticky;
          bottom: 0;
          background: var(--surface);
          padding-top: 12px;
        }
        .mf-btn {
          min-height: 48px;
          width: 100%;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }
        .mf-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .mf-btn--gold  { background: var(--accent-fill); border: none; color: var(--on-accent); font-weight: bold; }
        .mf-btn--ghost { background: transparent; border: 0.5px solid var(--border-solid); color: var(--text-secondary); }
        .mf-error {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--red);
          letter-spacing: 0.05em;
          line-height: 1.6;
          margin-top: 10px;
        }
        .mf-done {
          text-align: center;
          padding: 12px 0 4px;
          font-family: var(--font-display);
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-primary);
        }

        /* ── DESKTOP: centred card ────────────────────────────────────── */
        @media (min-width: 700px) {
          .mf-overlay { align-items: center; padding: 28px; }
          .mf-card {
            max-width: 560px;
            border-radius: 6px;
            border-bottom: 0.5px solid var(--border-solid);
            padding: 28px 30px 24px;
          }
          .mf-title { font-size: 23px; }
          .mf-actions { flex-direction: row-reverse; }
          .mf-btn { width: auto; flex: 1; }
        }
      `}</style>

      <div className="mf-card">
        {done ? (
          <>
            <div className="mf-eyebrow">Portfolio Audit</div>
            <h2 className="mf-title">
              {done.count} listing{done.count === 1 ? "" : "s"} confirmed
            </h2>
            <div className="mf-done">
              Marked verified as of today. They&apos;ll show a{" "}
              <span style={{ color: "var(--green)" }}>🥇 Verified Fresh</span> badge and return to top
              placement in discovery.
            </div>
            {done.cmsSyncPending.length > 0 && (
              <div className="mf-warn">
                Saved, but {done.cmsSyncPending.length} listing
                {done.cmsSyncPending.length === 1 ? "" : "s"} couldn&apos;t sync to the public CMS
                just now. Your confirmation is recorded — the public badge will catch up on the next
                sync.
              </div>
            )}
            <div className="mf-actions">
              <button className="mf-btn mf-btn--gold" onClick={() => setOpen(false)}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div className="mf-eyebrow">Monthly Portfolio Audit ✦</div>
            <h2 className="mf-title">Keep your inventory honest</h2>
            <p className="mf-sub">
              {items.length} listing{items.length === 1 ? "" : "s"} haven&apos;t been verified in
              over 30 days. Confirming means you&apos;re asserting the details are{" "}
              <strong style={{ color: "var(--text-secondary)" }}>still accurate</strong> — if anything changed,
              update it instead.
            </p>

            {items.map((item) => (
              <div className="mf-row" key={item.id}>
                <input
                  type="checkbox"
                  className="mf-check"
                  checked={selected.has(item.id)}
                  onChange={() => toggle(item.id)}
                  aria-label={`Confirm ${item.title}`}
                />
                <div className="mf-row__main">
                  <div className="mf-row__title">{item.title}</div>
                  {item.location && <div className="mf-row__loc">{item.location}</div>}
                  <FreshnessBadge lastVerifiedDate={item.lastVerifiedDate} variant="owner" />
                  {onOpenEditor && (
                    <button
                      className="mf-row__edit"
                      onClick={() => { setOpen(false); onOpenEditor(item); }}
                    >
                      ✏️ Something changed — update it
                    </button>
                  )}
                </div>
              </div>
            ))}

            <div className="mf-warn">
              Only confirm what you know is current. A listing carrying your name with a stale price
              costs more trust than one that&apos;s honestly marked unverified.
            </div>

            {error && <div className="mf-error">{error}</div>}

            <div className="mf-actions">
              <button
                className="mf-btn mf-btn--gold"
                onClick={confirmSelected}
                disabled={busy || selected.size === 0}
              >
                {busy ? "Confirming…" : `⚡ Confirm ${selected.size} as accurate`}
              </button>
              <button className="mf-btn mf-btn--ghost" onClick={dismiss} disabled={busy}>
                Not now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
