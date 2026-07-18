"use client";

import { useState, useEffect, useCallback } from "react";
import { crmFetch } from "@/lib/crmClient";

const ERROR_COPY = {
  denied: "Google connection was cancelled.",
  invalid_state: "That connect link expired — please try again.",
  store_failed: "Connected, but we couldn't save it. Try again.",
  exchange_failed: "Google sign-in failed. Please try again.",
  not_configured: "Calendar sync isn't switched on yet.",
};

/**
 * Connect / disconnect Google Calendar. Renders nothing until the server
 * reports the feature is configured (creds + encryption key present), so it
 * stays invisible on environments without OAuth set up.
 * @param {{ userId: string, addToast?: (msg, icon)=>void }} props
 */
export default function ConnectCalendarPanel({ userId, addToast }) {
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [google, setGoogle] = useState(null); // connection object or null
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmFetch("/api/calendar/connection", { mockUserId: userId });
      setConfigured(Boolean(res.googleConfigured));
      setGoogle((res.connections || []).find((c) => c.provider === "google") || null);
    } catch {
      setConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Surface the outcome of a just-completed OAuth redirect, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("calendar_connected");
    const error = params.get("calendar_error");
    if (!connected && !error) return;
    if (connected) addToast?.("Google Calendar connected", "✅");
    if (error) addToast?.(ERROR_COPY[error] || "Calendar connection failed.", "❌");
    params.delete("calendar_connected");
    params.delete("calendar_error");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [addToast]);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const res = await crmFetch("/api/oauth/google/start", { mockUserId: userId });
      if (res.url) window.location.href = res.url;
    } catch (e) {
      addToast?.(e.message || "Couldn't start Google connect.", "❌");
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await crmFetch("/api/oauth/google/disconnect", { method: "POST", mockUserId: userId });
      setGoogle(null);
      addToast?.("Google Calendar disconnected", "🔌");
    } catch {
      addToast?.("Couldn't disconnect.", "❌");
    } finally {
      setBusy(false);
    }
  };

  // Invisible until the server says the feature is on.
  if (loading || !configured) return null;

  return (
    <section className="bg-[#121212] border border-surface-variant rounded-lg p-4 sm:p-6">
      <h2 className="font-working-title text-xl text-on-surface mb-2">Connected Calendars</h2>
      <p className="text-sm text-text-secondary mb-5">
        Sync your ScoutIt events with Google Calendar so viewings and blocks stay in one place.
      </p>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-surface-variant/60 rounded bg-background/60">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xl">📅</span>
          <div className="min-w-0">
            <div className="text-on-surface font-medium">Google Calendar</div>
            <div className="text-xs text-text-muted truncate">
              {google ? `Connected${google.accountEmail ? ` · ${google.accountEmail}` : ""}` : "Not connected"}
            </div>
          </div>
        </div>

        {google ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={busy}
            className="text-xs text-error border border-error/30 px-4 py-2 rounded hover:bg-error/10
              uppercase tracking-wider font-mono disabled:opacity-50 shrink-0"
          >
            Disconnect
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={busy}
            className="text-sm text-background bg-gold-accent hover:bg-gold-bright px-4 py-2 rounded
              font-working-title disabled:opacity-50 shrink-0"
          >
            {busy ? "Connecting…" : "Connect"}
          </button>
        )}
      </div>
    </section>
  );
}
