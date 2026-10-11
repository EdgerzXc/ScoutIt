"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";
import { canUseAnonymityShield, anonymityShieldDefaultsOn } from "@/lib/entitlements";
import { PUBLIC_ROLE_CHOICES, PUBLIC_ROLE_LABELS } from "@/lib/publicRoles";

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

export default function PrivacyShieldPanel({ role, tier, activeRoles = [] }) {
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

  const [blocks, setBlocks] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [blockInput, setBlockInput] = useState("");
  const [blockActionBusy, setBlockActionBusy] = useState(false);

  const loadBlocks = useCallback(async () => {
    try {
      setLoadingBlocks(true);
      const { data: { session } } = await getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/user/blocks", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.blocks)) {
        setBlocks(data.blocks);
      }
    } catch {
      // Non-fatal
    } finally {
      setLoadingBlocks(false);
    }
  }, []);

  useEffect(() => { loadBlocks(); }, [loadBlocks]);

  const handleUnblock = async (blockedId) => {
    if (!blockedId || blockActionBusy) return;
    setBlockActionBusy(true);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch(`/api/user/blocks?blockedId=${encodeURIComponent(blockedId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session?.access_token || ""}` },
      });
      if (res.ok) {
        setBlocks((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      }
    } catch {
      // Non-fatal
    } finally {
      setBlockActionBusy(false);
    }
  };

  const handleBlockManual = async (e) => {
    e?.preventDefault();
    const idToBlock = blockInput.trim();
    if (!idToBlock || blockActionBusy) return;
    setBlockActionBusy(true);
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/user/blocks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ blockedId: idToBlock }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setBlockInput("");
        await loadBlocks();
      } else {
        setError(json.error || "Failed to block account.");
      }
    } catch {
      setError("Failed to block account.");
    } finally {
      setBlockActionBusy(false);
    }
  };

  const shieldApplies = canUseAnonymityShield(role);
  // A-135: which of this person's roles may appear on their public profile.
  // Moved here from /profile so privacy has one home and one writer.
  const roleChoices = PUBLIC_ROLE_CHOICES.filter((r) => activeRoles.includes(r));
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
      key: "acceptingConnects",
      title: "Accept incoming Connect requests",
      body: "When turned off, new incoming inquiries and pitches are paused. Senders receive an honest notice with zero Connects debited.",
      defaultValue: true,
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
          border: 1px solid var(--border-solid);
          border-radius: 12px;
          background: var(--surface);
        }
        .ps-h {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 400;
          color: var(--text-primary);
          margin: 0 0 6px;
        }
        .ps-intro {
          font-family: var(--font-display);
          font-size: 13px;
          line-height: 1.7;
          color: var(--text-secondary);
          margin: 0 0 6px;
          max-width: 58ch;
        }
        .ps-free {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--green);
          margin: 0 0 18px;
        }
        .ps-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 15px 0;
          border-top: 1px solid var(--border-solid);
        }
        .ps-row__main { min-width: 0; flex: 1; }
        .ps-row__t {
          font-family: var(--font-display);
          font-size: 14.5px;
          line-height: 1.35;
          color: var(--text-primary);
          margin-bottom: 4px;
        }
        .ps-row__b {
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text-secondary);
          max-width: 52ch;
        }
        .ps-row__saved {
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--green);
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
          border: 0.5px solid var(--border-solid);
          background: var(--bg);
          cursor: pointer;
          transition: background-color 180ms ease-out, border-color 180ms ease-out;
        }
        .ps-toggle::after {
          content: "";
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: transform 180ms ease-out, background-color 180ms ease-out;
        }
        .ps-toggle[aria-checked="true"] {
          background: rgba(var(--accent-rgb), 0.16);
          border-color: var(--accent-muted);
        }
        .ps-toggle[aria-checked="true"]::after {
          transform: translateX(22px);
          background: var(--accent-fill);
        }
        .ps-toggle:disabled { opacity: 0.45; cursor: not-allowed; }
        .ps-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }

        .ps-err {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--red);
          line-height: 1.7;
          margin-top: 14px;
        }
        .ps-skel {
          height: 64px;
          border-radius: 4px;
          margin-top: 10px;
          background: linear-gradient(90deg, var(--surface) 0%, var(--surface2) 50%, var(--surface) 100%);
          background-size: 200% 100%;
          animation: psShimmer 1.4s ease-in-out infinite;
        }
        @keyframes psShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ps-select-wrap {
          flex: 0 0 auto;
          margin-top: 2px;
        }
        .ps-select {
          min-height: 44px;
          padding: 8px 12px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border-solid);
          color: var(--text-primary);
          font-family: var(--font-display);
          font-size: 13px;
          cursor: pointer;
        }
        .ps-select:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .ps-blocks-section {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid var(--border-solid);
        }
        .ps-blocks-h {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
          margin: 0 0 6px;
        }
        .ps-blocks-intro {
          font-family: var(--font-display);
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0 0 16px;
          max-width: 54ch;
        }
        .ps-block-form {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .ps-block-input {
          flex: 1;
          min-width: 220px;
          min-height: 44px;
          padding: 8px 14px;
          border-radius: 8px;
          background: var(--bg);
          border: 1px solid var(--border-solid);
          color: var(--text-primary);
          font-family: ${MONO};
          font-size: 13px;
        }
        .ps-block-input:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
        .ps-block-submit {
          min-height: 44px;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(var(--accent-rgb), 0.12);
          border: 1px solid var(--accent-muted);
          color: var(--accent-bright);
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background-color 150ms ease-out;
        }
        .ps-block-submit:hover:not(:disabled) {
          background: rgba(var(--accent-rgb), 0.22);
        }
        .ps-block-submit:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .ps-blocks-empty {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--text-muted);
          padding: 12px 0;
        }
        .ps-blocks-loading {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--text-muted);
          padding: 12px 0;
        }
        .ps-blocks-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ps-block-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--surface2, rgba(255, 255, 255, 0.03));
          border: 1px solid var(--border-solid);
        }
        .ps-block-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .ps-block-name {
          font-family: var(--font-display);
          font-size: 13.5px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .ps-block-id {
          font-family: ${MONO};
          font-size: 12px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ps-unblock-btn {
          min-height: 44px;
          padding: 6px 14px;
          border-radius: 6px;
          background: transparent;
          border: 1px solid var(--border-solid);
          color: var(--text-secondary);
          font-family: ${MONO};
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 150ms ease-out, color 150ms ease-out;
        }
        .ps-unblock-btn:hover:not(:disabled) {
          border-color: var(--accent-muted);
          color: var(--accent-bright);
        }
        @media (min-width: 700px) { .ps-root { padding: 24px 26px; } }
        @media (prefers-reduced-motion: reduce) {
          .ps-skel { animation: none; }
          .ps-toggle, .ps-toggle::after, .ps-unblock-btn { transition: none; }
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
          {settings.isProfilePublic === true && roleChoices.length > 0 && (
            <>
              <div className="ps-row">
                <div className="ps-row__main">
                  <div className="ps-row__t">Roles shown on your public profile</div>
                  <div className="ps-row__b">Your owner role is never shown publicly.</div>
                  {saved === "publicRoles" && <div className="ps-row__saved">Saved</div>}
                </div>
              </div>
              {roleChoices.map((r) => {
                const current = Array.isArray(settings.publicRoles) ? settings.publicRoles : [];
                const on = current.includes(r);
                const label = `Show my ${PUBLIC_ROLE_LABELS[r]} role`;
                return (
                  <div className="ps-row" key={r}>
                    <div className="ps-row__main">
                      <div className="ps-row__t">{label}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${label} publicly`}
                      className="ps-toggle"
                      disabled={savingKey === "publicRoles"}
                      onClick={() => update("publicRoles", on ? current.filter((x) => x !== r) : [...current, r])}
                    />
                  </div>
                );
              })}
            </>
          )}
          <div className="ps-row">
            <div className="ps-row__main">
              <div className="ps-row__t">Maximum pending incoming requests</div>
              <div className="ps-row__b">
                Set a safety cap on active pending Connect requests awaiting your response. Once reached, new requests pause until you accept or decline.
              </div>
              {saved === "maxPendingConnects" && <div className="ps-row__saved">Saved</div>}
            </div>
            <div className="ps-select-wrap">
              <select
                className="ps-select"
                value={settings.maxPendingConnects === null ? "unlimited" : String(settings.maxPendingConnects)}
                disabled={savingKey === "maxPendingConnects"}
                aria-label="Maximum pending incoming requests"
                onChange={(e) => {
                  const val = e.target.value === "unlimited" ? null : parseInt(e.target.value, 10);
                  update("maxPendingConnects", val);
                }}
              >
                <option value="unlimited">Unlimited</option>
                <option value="3">3 pending</option>
                <option value="5">5 pending</option>
                <option value="10">10 pending</option>
                <option value="20">20 pending</option>
              </select>
            </div>
          </div>

          <div className="ps-blocks-section">
            <h4 className="ps-blocks-h">Blocked Counterparties</h4>
            <p className="ps-blocks-intro">
              Blocked accounts cannot initiate deals, pitches, or messages with you. Your profile and listings remain invisible to them.
            </p>

            <form className="ps-block-form" onSubmit={handleBlockManual}>
              <input
                type="text"
                className="ps-block-input"
                placeholder="Enter Account ID to block..."
                value={blockInput}
                onChange={(e) => setBlockInput(e.target.value)}
                disabled={blockActionBusy}
                aria-label="Account ID to block"
              />
              <button
                type="submit"
                className="ps-block-submit"
                disabled={!blockInput.trim() || blockActionBusy}
              >
                Block Account
              </button>
            </form>

            {loadingBlocks && <div className="ps-blocks-loading">Loading blocked accounts...</div>}

            {!loadingBlocks && blocks.length === 0 && (
              <div className="ps-blocks-empty">No accounts blocked.</div>
            )}

            {!loadingBlocks && blocks.length > 0 && (
              <div className="ps-blocks-list">
                {blocks.map((b) => (
                  <div className="ps-block-item" key={b.blocked_id}>
                    <div className="ps-block-info">
                      <span className="ps-block-name">{b.display_name || "Unknown Account"}</span>
                      <span className="ps-block-id">{b.blocked_id}</span>
                    </div>
                    <button
                      type="button"
                      className="ps-unblock-btn"
                      disabled={blockActionBusy}
                      onClick={() => handleUnblock(b.blocked_id)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {error && <p className="ps-err" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
}
