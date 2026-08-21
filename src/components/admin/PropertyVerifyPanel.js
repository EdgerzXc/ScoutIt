"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { sanitizeError } from "@/lib/sanitizeError";
import { getFreshness } from "@/lib/freshness";

// ─────────────────────────────────────────────────────────────────────────
// STAFF PROPERTY VERIFICATION — ACQ-01 · WORK ORDER W12
//
// `/api/property/verify` has existed since 2026-08-05 with ZERO callers
// (§51). This is the caller: the staff surface for re-verifying a listing's
// freshness when the owner won't or can't.
//
// ⚠️ THE ENDPOINT WAS BROKEN WHEN THIS PANEL WAS BUILT (§55). It selected a
// `status` column that does not exist, and looked properties up with
// `.or('id.eq.<slug>')` against a uuid column — so every slug-based call
// errored and was reported as "Property not found". Fixed first; see
// src/lib/propertyLookup.js.
//
// ── VERIFYING IS AN ASSERTION, NOT A BUTTON ─────────────────────────
// Same principle as §21.2's MonthlyFreshnessModal: pressing this says "a human
// checked these details and they are still true today". It is not a way to
// make a badge go green. So the copy says that, the confirm is two-step, and
// there is no "verify all" — a bulk button here would produce a directory full
// of confidently-wrong data carrying ScoutIt's name rather than an owner's.
//
// Mobile first: cards, never a table (02_FRONTEND_STANDARD §1).
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

/** How stale before a listing shows up in this queue, in days. */
const STALE_AFTER_DAYS = 30;

function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.floor((Date.now() - then) / 86400000);
}

export default function PropertyVerifyPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("properties")
        .select("id, slug, canonical_slug, title, location, last_verified_date, lifecycle_state, pipeline_status")
        .order("last_verified_date", { ascending: true, nullsFirst: true })
        .limit(100);

      if (qErr) {
        setError("Couldn't load the verification queue. Check your staff access and try again.");
        return;
      }

      // NULL last_verified_date means NEVER VERIFIED, and it sorts first.
      // It is deliberately not treated as "verified today" — the same refusal
      // as §50's NULL lister_relationship. Absence of a record is not a record.
      const stale = (data || []).filter((p) => {
        const age = daysSince(p.last_verified_date);
        return age === null || age >= STALE_AFTER_DAYS;
      });
      setRows(stale);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load the verification queue."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const verify = async (row) => {
    setBusyId(row.id);
    setNotice(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setNotice({ type: "error", text: "Your session expired. Sign in again." });
        return;
      }
      const res = await fetch("/api/property/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          propertyId: row.id,
          verificationType: "staff_attestation",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setNotice({ type: "error", text: json.error || "Could not verify that listing." });
        return;
      }
      setRows((prev) => prev.filter((p) => p.id !== row.id));
      setNotice({ type: "success", text: `"${row.title}" marked verified as of today.` });
      setConfirmId(null);
    } catch (e) {
      setNotice({ type: "error", text: sanitizeError(e, "Could not verify that listing.") });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pv-root">
      <style jsx global>{`
        .pv-root { padding: 4px 0; }
        .pv-intro {
          font-family: var(--font-display);
          font-size: 13.5px;
          line-height: 1.7;
          color: #8a8a8a;
          margin: 0 0 18px;
          max-width: 62ch;
        }
        .pv-warn {
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid #6E531A;
          padding: 12px 14px;
          margin: 0 0 20px;
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.7;
          color: #c8c8c8;
          max-width: 62ch;
        }
        .pv-notice {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.06em;
          line-height: 1.7;
          padding: 10px 12px;
          border-radius: 3px;
          margin-bottom: 16px;
        }
        .pv-notice--success { color: #4caf7d; background: rgba(76, 175, 125, 0.08); }
        .pv-notice--error   { color: #e8644a; background: rgba(232, 100, 74, 0.08); }

        .pv-skel {
          height: 82px;
          border-radius: 4px;
          margin-bottom: 10px;
          background: linear-gradient(90deg, #141414 0%, #1a1a1a 50%, #141414 100%);
          background-size: 200% 100%;
          animation: pvShimmer 1.4s ease-in-out infinite;
        }
        @keyframes pvShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Cards at every width. A horizontally-scrolling data table on a phone
           is a data table nobody reads (02_FRONTEND_STANDARD §1). */
        .pv-list { list-style: none; margin: 0; padding: 0; }
        .pv-card {
          background: #151515;
          border: 0.5px solid #262626;
          border-radius: 4px;
          padding: 15px 14px;
          margin-bottom: 10px;
        }
        .pv-title {
          font-family: var(--font-display);
          font-size: 15.5px;
          line-height: 1.35;
          color: #f0ede8;
          overflow-wrap: anywhere;
          margin-bottom: 5px;
        }
        .pv-loc {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6a6a6a;
          margin-bottom: 9px;
        }
        .pv-age {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .pv-age--never { color: #e8644a; }
        .pv-age--stale { color: #e8c84a; }

        .pv-actions { display: flex; flex-direction: column; gap: 8px; }
        .pv-btn {
          min-height: 44px;
          width: 100%;
          border-radius: 3px;
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 140ms ease-out, opacity 140ms ease-out;
        }
        .pv-btn:active { transform: scale(0.97); }
        .pv-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pv-btn:disabled:active { transform: none; }
        .pv-btn:focus-visible { outline: 2px solid #E8AE3C; outline-offset: 2px; }
        .pv-btn--gold  { background: #F7C64E; border: none; color: #0d0d0d; font-weight: bold; }
        .pv-btn--ghost { background: transparent; border: 0.5px solid #262626; color: #c8c8c8; }

        .pv-confirm {
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.65;
          color: #c8c8c8;
          background: rgba(232, 174, 60, 0.06);
          border-left: 2px solid #6E531A;
          padding: 11px 12px;
          margin-bottom: 10px;
        }

        .pv-empty {
          background: #131313;
          border: 0.5px solid #262626;
          border-radius: 4px;
          padding: 22px 18px;
        }
        .pv-empty__t {
          font-family: var(--font-display);
          font-size: 16px;
          color: #f0ede8;
          margin: 0 0 8px;
        }
        .pv-empty__b {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: #8a8a8a;
          margin: 0;
          max-width: 56ch;
        }

        @media (min-width: 700px) {
          .pv-actions { flex-direction: row; }
          .pv-btn { width: auto; min-width: 190px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pv-skel { animation: none; }
          .pv-btn { transition: none; }
          .pv-btn:active { transform: none; }
        }
      `}</style>

      <p className="pv-intro">
        Listings never verified, or not verified in the last {STALE_AFTER_DAYS} days.
        Oldest first; never-verified listings come first of all.
      </p>

      <div className="pv-warn">
        Verifying here records that <strong style={{ color: "#f0ede8" }}>a member of
        staff checked these details and they are still accurate today</strong>. It is
        not a way to clear the queue. A stale listing is honest; a wrongly-verified one
        carries our name.
      </div>

      {notice && (
        <div className={`pv-notice pv-notice--${notice.type}`} role="status">
          {notice.text}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div aria-busy="true">
          <div className="pv-skel" />
          <div className="pv-skel" />
          <div className="pv-skel" />
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="pv-empty">
          <p className="pv-empty__t">Couldn&apos;t load the queue</p>
          <p className="pv-empty__b">{error}</p>
          <div className="pv-actions" style={{ marginTop: 16 }}>
            <button type="button" className="pv-btn pv-btn--ghost" onClick={load}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* EMPTY — says what it means, not "no data found". */}
      {!loading && !error && rows.length === 0 && (
        <div className="pv-empty">
          <p className="pv-empty__t">Nothing needs re-verifying</p>
          <p className="pv-empty__b">
            Every listing has been verified within the last {STALE_AFTER_DAYS} days.
            This queue refills on its own as listings age.
          </p>
        </div>
      )}

      {/* SUCCESS */}
      {!loading && !error && rows.length > 0 && (
        <ul className="pv-list">
          {rows.map((row) => {
            const age = daysSince(row.last_verified_date);
            const never = age === null;
            const freshness = row.last_verified_date ? getFreshness(row.last_verified_date) : null;
            return (
              <li className="pv-card" key={row.id}>
                <div className="pv-title">{row.title || "Untitled listing"}</div>
                {row.location && <div className="pv-loc">{row.location}</div>}
                <div className={`pv-age ${never ? "pv-age--never" : "pv-age--stale"}`}>
                  {never
                    ? "Never verified"
                    : `Last verified ${age} day${age === 1 ? "" : "s"} ago${
                        freshness?.label ? ` · ${freshness.label}` : ""
                      }`}
                </div>

                {confirmId === row.id ? (
                  <>
                    <div className="pv-confirm">
                      Confirm that you have checked this listing&apos;s details — price,
                      availability, specs — and they are accurate as of today.
                    </div>
                    <div className="pv-actions">
                      <button
                        type="button"
                        className="pv-btn pv-btn--gold"
                        onClick={() => verify(row)}
                        disabled={busyId === row.id}
                      >
                        {busyId === row.id ? "Recording…" : "Yes — I checked it"}
                      </button>
                      <button
                        type="button"
                        className="pv-btn pv-btn--ghost"
                        onClick={() => setConfirmId(null)}
                        disabled={busyId === row.id}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="pv-actions">
                    <button
                      type="button"
                      className="pv-btn pv-btn--ghost"
                      onClick={() => { setConfirmId(row.id); setNotice(null); }}
                    >
                      Mark verified
                    </button>
                    {(row.canonical_slug || row.slug) && (
                      <a
                        className="pv-btn pv-btn--ghost"
                        href={`/property/${row.canonical_slug || row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
                      >
                        Open listing ↗
                      </a>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
