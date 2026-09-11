"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// A-135 — "Your plan" in Settings.
//
// Everything here comes from /api/user/plan, which reads the account. Nothing
// comes from localStorage or getCurrentTier(), which are tamperable and were
// the only "plan" the product showed before this.
//
// Owner decision 2026-09-11: plan NAME only, no price — "we dont have the
// proper price yet". /pricing covers what each plan includes.
//
// No payment controls: payments are off during the pilot, so the screen says
// so instead of offering a button that cannot work.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

export default function PlanPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setError("Sign in again to see your plan.");
        return;
      }
      const res = await fetch("/api/user/plan", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.success) {
        setError(body.error || "Couldn't load your plan.");
        return;
      }
      setData(body);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load your plan."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const connectsLine = (() => {
    if (!data) return "";
    if (data.connects?.balance === null || data.connects?.balance === undefined) {
      return "Couldn't read your Connects right now.";
    }
    if (!data.connects.hasWallet) return "No Connects on your account yet.";
    return `${data.connects.balance} Connects`;
  })();

  return (
    <div className="pp-root">
      <style jsx global>{`
        .pp-root {
          padding: 22px 18px;
          border: 1px solid var(--border-solid);
          border-radius: 12px;
          background: var(--surface);
        }
        .pp-label {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin: 0 0 6px;
        }
        .pp-value {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text-primary);
          margin: 0 0 16px;
        }
        .pp-note {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 12px;
          max-width: 58ch;
        }
        .pp-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-family: var(--font-display);
          font-size: 14px;
          color: var(--accent);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .pp-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
        .pp-err { font-family: var(--font-display); font-size: 13px; color: var(--red); }
        .pp-retry {
          min-height: 44px;
          background: none;
          border: none;
          color: var(--text-secondary);
          text-decoration: underline;
          cursor: pointer;
          font-size: 13px;
        }
        .pp-skel {
          height: 64px;
          border-radius: 4px;
          background: linear-gradient(90deg, var(--surface) 0%, var(--surface2) 50%, var(--surface) 100%);
          background-size: 200% 100%;
          animation: ppShimmer 1.4s ease-in-out infinite;
        }
        @keyframes ppShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        @media (min-width: 700px) { .pp-root { padding: 24px 26px; } }
        @media (prefers-reduced-motion: reduce) { .pp-skel { animation: none; } }
      `}</style>

      {loading && <div className="pp-skel" aria-busy="true" />}

      {!loading && error && (
        <>
          <p className="pp-err" role="alert">{error}</p>
          <button type="button" className="pp-retry" onClick={load}>Try again</button>
        </>
      )}

      {!loading && data && (
        <>
          <p className="pp-label">Your plan</p>
          <p className="pp-value">{data.plan?.label || "No plan recorded on your account yet"}</p>
          {data.freeMode && (
            <p className="pp-note">
              During the pilot, premium features are unlocked for everyone, so your plan
              doesn&apos;t limit anything yet.
            </p>
          )}

          <p className="pp-label">Connects</p>
          <p className="pp-value">{connectsLine}</p>

          <p className="pp-note">
            Payments aren&apos;t switched on during the pilot, so plans can&apos;t be changed here yet.
          </p>
          <Link href="/pricing" className="pp-link">See what each plan includes</Link>
        </>
      )}
    </div>
  );
}
