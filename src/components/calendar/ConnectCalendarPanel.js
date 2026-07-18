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
 * Calendar Sync panel — always visible. Google is a real connect/sync flow;
 * Calendly is shown as coming-soon (its API needs a paid Calendly plan and
 * isn't wired yet), so the two tools read as a matched pair like before.
 * @param {{ userId: string, addToast?: (msg, icon)=>void }} props
 */
export default function ConnectCalendarPanel({ userId, addToast }) {
  const [loading, setLoading] = useState(true);
  const [google, setGoogle] = useState(null); // connection object or null
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Cache-bust so a stale connection response can't stick.
      const res = await crmFetch(`/api/calendar/connection?t=${Date.now()}`, { mockUserId: userId });
      setGoogle((res.connections || []).find((c) => c.provider === "google") || null);
    } catch {
      /* config-check failed — still offer Connect below; the start route is the
         real gate and returns a clear message if sync truly isn't configured. */
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

  const handleSync = async () => {
    setBusy(true);
    try {
      const res = await crmFetch("/api/calendar/sync", { method: "POST", mockUserId: userId });
      const changed = (res.created || 0) + (res.updated || 0) + (res.deleted || 0);
      addToast?.(
        changed > 0
          ? `Synced — ${res.created || 0} new, ${res.updated || 0} updated, ${res.deleted || 0} removed`
          : "Already up to date",
        "🔄"
      );
      window.dispatchEvent(new Event("calendar:refresh"));
    } catch (e) {
      addToast?.(e.message || "Sync failed.", "❌");
    } finally {
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

  return (
    <section className="bg-[#121212] border border-gold-accent/20 rounded-lg p-4 sm:p-5">
      <div className="mb-4">
        <h2 className="font-working-title text-lg text-on-surface">Calendar Sync</h2>
        <p className="text-xs text-text-muted mt-1">
          Connect your tools so viewings, events, and availability stay in one place.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        {/* Google — real connect / sync / disconnect */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">G</div>
            <div className="min-w-0">
              <div className="text-sm text-on-surface font-medium">Google Calendar</div>
              <div className={`text-[11px] truncate ${google ? "text-emerald-400" : "text-text-muted"}`}>
                {loading
                  ? "Checking…"
                  : google
                    ? `Connected${google.accountEmail ? ` · ${google.accountEmail}` : ""}`
                    : "Not connected"}
              </div>
            </div>
          </div>

          {!loading && google ? (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSync}
                disabled={busy}
                className="text-[11px] text-background bg-gold-accent hover:bg-gold-bright px-3 py-1.5 rounded uppercase tracking-wider font-mono disabled:opacity-50"
              >
                {busy ? "Syncing…" : "Sync now"}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={busy}
                className="text-[11px] text-error border border-error/30 px-3 py-1.5 rounded hover:bg-error/10 uppercase tracking-wider font-mono disabled:opacity-50"
              >
                Disconnect
              </button>
            </div>
          ) : !loading ? (
            <button
              type="button"
              onClick={handleConnect}
              disabled={busy}
              className="text-xs text-background bg-gold-accent hover:bg-gold-bright px-4 py-2 rounded font-working-title disabled:opacity-50 shrink-0"
            >
              {busy ? "Connecting…" : "Connect"}
            </button>
          ) : null}
        </div>

        {/* Calendly — visible but not yet available (API needs a paid plan) */}
        <div className="flex-1 bg-black/40 border border-white/5 rounded p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">Cal</div>
            <div className="min-w-0">
              <div className="text-sm text-on-surface font-medium">Calendly</div>
              <div className="text-[11px] text-text-muted truncate">Coming soon · needs a Calendly paid plan</div>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-mono text-text-muted border border-white/10 rounded px-2 py-1 shrink-0">
            Soon
          </span>
        </div>
      </div>
    </section>
  );
}
