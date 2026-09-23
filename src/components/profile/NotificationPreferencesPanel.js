"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession } from "@/lib/authClient";
import { sanitizeError } from "@/lib/sanitizeError";

// ─────────────────────────────────────────────────────────────────────────
// A-152 — NOTIFICATION PREFERENCES
//
// The transactional email footer promises "Manage notifications" at
// /settings#notifications. This is that control.
//
// One toggle only: the email fallback for time-sensitive inbox items
// (new inquiries, operator requests, archive/delete notices — sent only
// after 24h away, and only if a mail provider is configured, which today
// it is not). Everything else on this panel is disclosure, not control:
//
// - the dashboard inbox is the system of record and cannot be muted —
//   saying so here is the honest answer to "unsubscribe from everything";
// - marketing email is owned by the Privacy section (#privacy). This panel
//   links there instead of duplicating the toggle, because privacy has one
//   home and one writer (A-135).
//
// Backed by privacy_settings.email_alerts (migration O-004 item 7). Until
// that migration is applied the route reports emailAlertsStored:false and
// the toggle renders disabled with the reason stated — a control that
// cannot persist must say so rather than pretend.
// ─────────────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPanel() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await getSession();
      if (!session?.access_token) {
        setError("Sign in again to manage your notification settings.");
        return;
      }
      const res = await fetch("/api/user/privacy-settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || "Couldn't load your notification settings.");
        return;
      }
      setSettings(json.settings);
    } catch (e) {
      setError(sanitizeError(e, "Couldn't load your notification settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleEmail = async () => {
    if (!settings || saving || settings.emailAlertsStored === false) return;
    const previous = settings;
    const next = !settings.emailAlerts;
    setSaving(true);
    setError(null);
    setSaved(false);
    setSettings((s) => ({ ...s, emailAlerts: next }));
    try {
      const { data: { session } } = await getSession();
      const res = await fetch("/api/user/privacy-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ emailAlerts: next }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setSettings(previous); // roll back — never leave a false "off"
        setError(json.error || "That change didn't save. Your setting is unchanged.");
        return;
      }
      setSettings(json.settings);
      setSaved(true);
    } catch (e) {
      setSettings(previous);
      setError(sanitizeError(e, "That change didn't save. Your setting is unchanged."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="np-root">
      <style jsx global>{`
        .np-root {
          margin-top: 24px;
          padding: 22px 18px;
          border: 1px solid var(--border-solid);
          border-radius: 12px;
          background: var(--surface);
        }
        .np-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 0;
          border-top: 1px solid var(--border-subtle, #222);
        }
        .np-row:first-of-type { border-top: none; padding-top: 0; }
        .np-title { font-size: 14px; color: var(--text-primary); margin: 0 0 4px; }
        .np-body { font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin: 0; max-width: 60ch; }
        .np-link { color: var(--accent, var(--accent)); }
        .np-toggle {
          flex-shrink: 0;
          min-width: 64px;
          min-height: 44px;
          border-radius: 999px;
          border: 1px solid var(--border-solid);
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          cursor: pointer;
        }
        .np-toggle[aria-checked="true"] {
          background: var(--accent, var(--accent));
          border-color: var(--accent, var(--accent));
          color: #0d0d0d;
          font-weight: 700;
        }
        .np-toggle:disabled { opacity: 0.45; cursor: not-allowed; }
        .np-note { font-size: 12px; color: var(--text-muted, #888); margin: 12px 0 0; }
        .np-error { font-size: 13px; color: var(--error, #e8644a); margin: 12px 0 0; }
        .np-saved { font-size: 12px; color: var(--green, #4caf7d); margin: 12px 0 0; }
      `}</style>

      {loading && <p className="np-body">Loading your notification settings…</p>}
      {!loading && error && (
        <p className="np-error" role="alert">
          {error}{" "}
          <button type="button" className="np-link" onClick={load} style={{ background: "none", border: "none", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
            Try again
          </button>
        </p>
      )}
      {!loading && !error && settings && (
        <>
          <div className="np-row">
            <div>
              <p className="np-title">Email me about time-sensitive inbox items</p>
              <p className="np-body">
                When a new inquiry, operator request, or archive notice waits
                while you have been away for over a day, ScoutIt emails you
                once as a fallback. Your dashboard inbox always has everything
                regardless.
              </p>
              {settings.emailAlertsStored === false && (
                <p className="np-note">
                  Preference sync is pending a database update, so this switch
                  is paused — email currently follows the default (on).
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.emailAlerts === true}
              aria-label="Email me about time-sensitive inbox items"
              className="np-toggle"
              disabled={saving || settings.emailAlertsStored === false}
              onClick={toggleEmail}
            >
              {settings.emailAlerts ? "ON" : "OFF"}
            </button>
          </div>

          <div className="np-row">
            <div>
              <p className="np-title">Dashboard inbox — always on</p>
              <p className="np-body">
                The bell is the system of record for everything addressed to
                you. It cannot be muted, because muting the record of your own
                inquiries would lose them, not silence them.
              </p>
            </div>
          </div>

          <div className="np-row">
            <div>
              <p className="np-title">Marketing email</p>
              <p className="np-body">
                Product news and summaries live in{" "}
                <a className="np-link" href="/settings#privacy">
                  Settings → Privacy
                </a>
                , alongside every other data choice. There is one switch, in
                one place.
              </p>
            </div>
          </div>

          {saved && <p className="np-saved" role="status">Saved.</p>}
        </>
      )}
    </div>
  );
}
