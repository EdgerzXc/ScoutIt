"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// SEO READINESS — SEO-01 · WORK ORDER W11
//
// `/api/seo/readiness` had no surface, so an owner could not see why a listing
// was not indexable. This is that surface. It serves the 200-listing north
// star directly: a listing Google won't index is a listing that does not
// really exist.
//
// ⚠️ THE ENDPOINT WAS BROKEN WHEN THIS PANEL WAS BUILT (§55). It read six
// columns that do not exist on `public.properties` and therefore reported
// EVERY listing as un-indexable with a confident-looking score. Shipping this
// panel on top of it would have told all 13 owners their listings were broken.
// The route was rewritten against the real schema first. If this panel ever
// starts reporting that everything is failing, suspect the query before
// believing the verdict.
//
// ── WHY THIS IS NOT THE LISTING STRENGTH CARD ───────────────────────
// Listing Strength answers "is this listing complete?". This answers "can
// Google reach it?" — which is a different question with a different fix.
// A 100%-complete draft scores perfectly on the first and fails the second,
// because a draft has no page. They sit next to each other deliberately.
//
// Mobile first: a stacked block, no tables, 44px targets.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

export default function SeoReadinessPanel({ propertyId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!propertyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setError("Sign in again to check this listing's search readiness.");
        return;
      }
      const res = await fetch(
        `/api/seo/readiness?propertyId=${encodeURIComponent(propertyId)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "Couldn't check search readiness for this listing.");
        return;
      }
      setData(json);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't check search readiness for this listing."));
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  if (!propertyId) return null;

  return (
    <div className="card-atmosphere rounded-lg p-6">
      <style jsx global>{`
        .sr-head {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          border-bottom: 1px solid var(--border-solid);
          padding-bottom: 8px;
          margin-bottom: 16px;
        }
        .sr-h {
          font-family: ${MONO};
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .sr-refresh {
          background: none;
          border: none;
          padding: 8px 0 8px 12px;
          min-height: 36px;
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          cursor: pointer;
          text-decoration: underline;
        }
        .sr-refresh:hover { color: var(--accent); }

        .sr-skel {
          height: 96px;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--surface) 0%, var(--surface2) 50%, var(--surface) 100%);
          background-size: 200% 100%;
          animation: srShimmer 1.4s ease-in-out infinite;
        }
        @keyframes srShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .sr-verdict {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 6px;
        }
        .sr-score {
          font-family: var(--font-display);
          font-size: 30px;
          line-height: 1;
          color: var(--text-primary);
        }
        .sr-of {
          font-family: ${MONO};
          font-size: 9px;
          color: var(--text-muted);
          letter-spacing: 0.1em;
        }
        .sr-state {
          font-family: ${MONO};
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          padding: 5px 10px;
          border-radius: 999px;
          border: 0.5px solid currentColor;
        }
        /* Signal colours, used as status and never as decoration. */
        .sr-state--yes { color: var(--green); }
        .sr-state--no  { color: var(--yellow); }

        .sr-explain {
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 16px;
          max-width: 56ch;
        }

        .sr-list { list-style: none; margin: 0; padding: 0; }
        .sr-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          padding: 11px 0;
          border-bottom: 1px solid #1a1a1a;
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-secondary);
        }
        .sr-item:last-child { border-bottom: none; }
        .sr-dot {
          flex: 0 0 auto;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6E531A;
          margin-top: 7px;
        }
        .sr-clear {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--green);
          margin: 0;
        }
        .sr-err {
          font-family: ${MONO};
          font-size: 10px;
          color: var(--red);
          line-height: 1.7;
          letter-spacing: 0.04em;
        }
        @media (prefers-reduced-motion: reduce) {
          .sr-skel { animation: none; }
        }
      `}</style>

      <div className="sr-head">
        <span className="sr-h">Search Readiness</span>
        {!loading && (
          <button type="button" className="sr-refresh" onClick={load}>
            Re-check
          </button>
        )}
      </div>

      {/* LOADING — skeleton shaped like the real block. */}
      {loading && <div className="sr-skel" aria-busy="true" />}

      {/* ERROR — says what to do, never a status code. */}
      {!loading && error && (
        <div>
          <p className="sr-err" role="alert">{error}</p>
          <button type="button" className="sr-refresh" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div className="sr-verdict">
            <span className="sr-score">{data.readinessScore}</span>
            <span className="sr-of">/100</span>
            <span
              className={`sr-state ${data.indexEligible ? "sr-state--yes" : "sr-state--no"}`}
            >
              {data.indexEligible ? "Google can index this" : "Not ready to index"}
            </span>
          </div>

          <p className="sr-explain">
            {data.indexEligible ? (
              <>
                This listing is live and complete enough to be submitted to search.
                Anything below still helps it rank.
              </>
            ) : (
              <>
                A listing needs to be published and score at least{" "}
                {data.indexEligibleMinScore} before it&apos;s worth asking Google to
                index it. Here&apos;s what&apos;s in the way.
              </>
            )}
          </p>

          {/* EMPTY (of blockers) — the good kind, and it says so plainly. */}
          {data.blockers?.length === 0 ? (
            <p className="sr-clear">Nothing is blocking this listing from search.</p>
          ) : (
            <ul className="sr-list">
              {data.blockers.map((blocker) => (
                <li className="sr-item" key={blocker}>
                  <span className="sr-dot" aria-hidden="true" />
                  <span>{blocker}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
