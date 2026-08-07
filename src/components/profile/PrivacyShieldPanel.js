"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";
import { canUseAnonymityShield, anonymityShieldDefaultsOn } from "@/lib/entitlements";

// ─────────────────────────────────────────────────────────────────────────
// PRIVACY & ANONYMITY SHIELD — WORK ORDER W13 · C19 · §46.8
//
// The shield was wired at row creation (`privacy_settings.anonymous_browsing`,
// `.anonymous_byline` are set when a profile is made) but had NO user-facing
// toggle. A privacy control nobody can find is not a privacy control.
//
// ── STANDING RULE 10: NEVER GATE A PRIVACY CONTROL BEHIND A TIER ────
// This panel therefore has NO upgrade prompt, no lock icon, no "available on
// Cluster" label, and it never reads `canSee()`. The tier decides the DEFAULT
// only — Cluster+ arrives with the shield already on — and even that is stated
// as a fact about their account rather than as a reason to upgrade.
//
// §46.8's reasoning, kept close to the code it constrains: a buyer hesitating
// over a Connect must never meet the words "upgrade for privacy". That is
// doubt introduced at the exact moment you want action, trading a Connect
// spend for a subscription upsell. ScoutIt does not sell safety; it sells not
// having to think about it.
//
// ── BROKERS SEE NOTHING HERE ────────────────────────────────────────
// Every broker tier benefit is discoverability. Offering a broker a switch
// that makes them harder to find is offering to break their own account.
// `canUseAnonymityShield(role)` decides, and it is a ROLE check — never a tier
// check. If this ever becomes a tier check, the model has been misread.
//
// Mobile first: stacked rows, 44px targets, no hover-only affordance.
// ─────────────────────────────────────────────────────────────────────────

const MONO = "'Courier New',monospace";

export default function PrivacyShieldPanel({ role, tier }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [saved, setSaved] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setError("Sign in again to manage your privacy settings.");
        return;
      }
      const res = await fetch("/api/user/privacy-settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "Couldn't load your privacy settings.");
        return;
      }
      setSettings(json.settings);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load your privacy settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const update = async (key, value) => {
    setSavingKey(key);
    setError(null);
    setSaved(null);
    // Optimistic, because a privacy toggle that lags feels like it failed —
    // and a user who thinks a privacy switch failed will toggle it again.
    const previous = settings;
    setSettings((s) => ({ ...s, [key]: value }));
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/user/privacy-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ [key]: value }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setSettings(previous); // roll back — never leave a false "on"
        setError(json.error || "That change didn't save. Your setting is unchanged.");
        return;
      }
      setSettings(json.settings);
      setSaved(key);
    } catch (e) {
      setSettings(previous);
      setError(sanitizeError(e, "That change didn't save. Your setting is unchanged."));
    } finally {
      setSavingKey(null);
    }
  };

  const shieldApplies = canUseAnonymityShield(role);
  const defaultsOn = anonymityShieldDefaultsOn(tier, role);

  const ROWS = [
    ...(shieldApplies
      ? [
          {
            key: "anonymousBrowsing",
            title: "Anonymous browsing",
            body: "The properties you view aren't logged against your account, so owners and brokers can't see that you looked.",
          },
          {
            key: "anonymousByline",
            title: "Anonymous byline",
            body: "Anything you publish shows as “Verified Researcher” instead of your name.",
          },
        ]
      : []),
    {
      key: "isProfilePublic",
      title: "Public profile",
      body: "Whether your profile page can be found by other people on ScoutIt.",
    },
    {
      key: "telemetryOptOut",
      title: "Opt out of product analytics",
      body: "Stop sending anonymous usage data that helps us find broken screens.",
      invert: true,
    },
    {
      key: "marketingOptOut",
      title: "Opt out of marketing email",
      body: "You'll still get messages about your own listings and inquiries.",
      invert: true,
    },
  ];

  return (
    <div className="ps-root">
      <style jsx global>{`
        .ps-root {
          margin-top: 24px;
          padding: 22px 18px;
          border: 1px solid var(--surface-variant, #262626);
          border-radius: 12px;
          background: var(--surface, #161616);
        }
        .ps-h {
          font-family: Georgia, serif;
          font-size: 18px;
          font-weight: 400;
          color: #f0ede8;
          margin: 0 0 6px;
        }
        .ps-intro {
          font-family: Georgia, serif;
          font-size: 13px;
          line-height: 1.7;
          color: #8a8a8a;
          margin: 0 0 6px;
          max-width: 58ch;
        }
        .ps-free {
          font-family: ${MONO};
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #4caf7d;
          margin: 0 0 18px;
        }
        .ps-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 15px 0;
          border-top: 1px solid #1e1e1e;
        }
        .ps-row__main { min-width: 0; flex: 1; }
        .ps-row__t {
          font-family: Georgia, serif;
          font-size: 14.5px;
          line-height: 1.35;
          color: #f0ede8;
          margin-bottom: 4px;
        }
        .ps-row__b {
          font-family: Georgia, serif;
          font-size: 12.5px;
          line-height: 1.6;
          color: #8a8a8a;
          max-width: 52ch;
        }
        .ps-row__saved {
          font-family: ${MONO};
          font-size: 8.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #4caf7d;
          margin-top: 6px;
        }
        /* 44px minimum, and the whole control is the hit area. */
        .ps-toggle {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          justify-content: flex-start;
          width: 52px;
          height: 30px;
          margin-top: 2px;
          padding: 3px;
          border-radius: 999px;
          border: 0.5px solid #2e2e2e;
          background: #101010;
          cursor: pointer;
          transition: background-color 180ms ease-out, border-color 180ms ease-out;
        }
        .ps-toggle::after {
          content: "";
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #6a6a6a;
          transition: transform 180ms ease-out, background-color 180ms ease-out;
        }
        .ps-toggle[aria-checked="true"] {
          background: rgba(232, 174, 60, 0.16);
          border-color: #6E531A;
        }
        .ps-toggle[aria-checked="true"]::after {
          transform: translateX(22px);
          background: #E8AE3C;
        }
        .ps-toggle:disabled { opacity: 0.45; cursor: not-allowed; }
        .ps-toggle:focus-visible { outline: 2px solid #E8AE3C; outline-offset: 3px; }

        .ps-err {
          font-family: ${MONO};
          font-size: 10px;
          color: #e8644a;
          line-height: 1.7;
          margin-top: 14px;
        }
        .ps-skel {
          height: 64px;
          border-radius: 4px;
          margin-top: 10px;
          background: linear-gradient(90deg, #141414 0%, #1a1a1a 50%, #141414 100%);
          background-size: 200% 100%;
          animation: psShimmer 1.4s ease-in-out infinite;
        }
        @keyframes psShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (min-width: 700px) { .ps-root { padding: 24px 26px; } }
        @media (prefers-reduced-motion: reduce) {
          .ps-skel { animation: none; }
          .ps-toggle, .ps-toggle::after { transition: none; }
        }
      `}</style>

      <h3 className="ps-h">Privacy</h3>
      <p className="ps-intro">
        Your name is hidden until you accept a connection, contact details need the
        two-sided handshake, and there is no public buyer directory. That is on for
        everyone, always. These are the extra controls on top.
      </p>
      {shieldApplies && (
        <p className="ps-free">
          Free on every plan
          {defaultsOn ? " · already on for your account" : ""}
        </p>
      )}

      {loading && (
        <>
          <div className="ps-skel" aria-busy="true" />
          <div className="ps-skel" />
        </>
      )}

      {!loading && error && !settings && (
        <>
          <p className="ps-err" role="alert">{error}</p>
          <div className="ps-row">
            <button type="button" className="ps-row__b" onClick={load} style={{ background: "none", border: "none", textDecoration: "underline", cursor: "pointer", minHeight: 44 }}>
              Try again
            </button>
          </div>
        </>
      )}

      {!loading && settings && (
        <>
          {ROWS.map((row) => {
            const on = settings[row.key] === true;
            return (
              <div className="ps-row" key={row.key}>
                <div className="ps-row__main">
                  <div className="ps-row__t">{row.title}</div>
                  <div className="ps-row__b">{row.body}</div>
                  {saved === row.key && <div className="ps-row__saved">Saved</div>}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={row.title}
                  className="ps-toggle"
                  disabled={savingKey === row.key}
                  onClick={() => update(row.key, !on)}
                />
              </div>
            );
          })}
          {error && <p className="ps-err" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
}
