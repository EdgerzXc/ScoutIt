"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ShieldAlert, Unlock, Bot, Brain, AlertTriangle, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { sanitizeError } from "@/lib/sanitizeError";

export default function FeatureConsolePanel() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState(null);

  // Caution modal state for global_read_only switch
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingFlagToggle, setPendingFlagToggle] = useState(null);

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return { "Content-Type": "application/json", "Authorization": token ? `Bearer ${token}` : "" };
  }, []);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feature-flags", { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load feature flags.");
      setFlags(data.flags || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: sanitizeError(err, "Could not load feature flags.") });
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggleClick = (flag) => {
    const nextState = !flag.is_enabled;
    // If activating global_read_only, trigger confirmation modal first
    if (flag.id === "global_read_only" && nextState === true) {
      setPendingFlagToggle({ flagId: flag.id, isEnabled: true });
      setConfirmModalOpen(true);
    } else {
      executeToggle(flag.id, nextState);
    }
  };

  const executeToggle = async (flagId, isEnabled) => {
    setUpdatingId(flagId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ flagId, isEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update feature flag.");
      
      setFlags((prev) =>
        prev.map((f) => (f.id === flagId ? { ...f, is_enabled: isEnabled, updated_at: new Date().toISOString() } : f))
      );
      setMessage({
        type: "success",
        text: `Flag "${flagId}" toggled ${isEnabled ? "ON" : "OFF"} successfully.`,
      });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: sanitizeError(err, "Failed to toggle switch.") });
    } finally {
      setUpdatingId(null);
      setConfirmModalOpen(false);
      setPendingFlagToggle(null);
    }
  };

  const getFlagIcon = (id) => {
    switch (id) {
      case "global_read_only":
        return <ShieldAlert size={20} className="text-red-400" />;
      case "pre_launch_free_mode":
        return <Unlock size={20} className="text-[#E8AE3C]" />;
      case "ai_search":
        return <Bot size={20} className="text-[#4caf7d]" />;
      case "deep_intel":
        return <Brain size={20} className="text-purple-400" />;
      default:
        return <RefreshCw size={20} className="text-gray-400" />;
    }
  };

  return (
    <div className="feature-console-panel space-y-6">
      {/* Header info */}
      <div className="flex items-center justify-between p-4 bg-[#121212] border border-[#E8AE3C]/20 rounded-xl">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E8AE3C] animate-pulse" />
            Live Feature & Kill-Switch Console
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Real-time system controls. Toggles update site behavior across database endpoints immediately.
          </p>
        </div>
        <button
          onClick={fetchFlags}
          disabled={loading}
          className="px-3 py-1.5 bg-[#1e1e1e] hover:bg-[#282828] text-xs text-gray-300 rounded border border-[#333] transition-all flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Status
        </button>
      </div>

      {/* Alert toast */}
      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Flag Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-gray-500 bg-[#121212] border border-[#222] rounded-xl">
          Scanning system kill-switches...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flags.map((flag) => {
            const isDanger = flag.id === "global_read_only";
            const isActive = flag.is_enabled;

            return (
              <div
                key={flag.id}
                className={`p-5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isDanger && isActive
                    ? "bg-red-950/20 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]"
                    : isActive
                    ? "bg-[#121212] border-[#E8AE3C]/40 shadow-[0_0_15px_rgba(232,174,60,0.08)]"
                    : "bg-[#0d0d0d] border-[#222] opacity-75"
                }`}
              >
                {/* Top Row: Icon + Title + Switch */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-lg border ${
                          isDanger && isActive
                            ? "bg-red-500/10 border-red-500/30"
                            : isActive
                            ? "bg-[#E8AE3C]/10 border-[#E8AE3C]/30"
                            : "bg-[#1a1a1a] border-[#333]"
                        }`}
                      >
                        {getFlagIcon(flag.id)}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          {flag.name}
                          {isDanger && (
                            <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              SAFETY CRITICAL
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                          ID: {flag.id}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Toggle Switch */}
                    <button
                      onClick={() => handleToggleClick(flag)}
                      disabled={updatingId === flag.id}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isActive
                          ? isDanger
                            ? "bg-red-600"
                            : "bg-[#E8AE3C]"
                          : "bg-gray-800"
                      }`}
                      role="switch"
                      aria-checked={isActive}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    {flag.description}
                  </p>
                </div>

                {/* Bottom Row: Status Badge */}
                <div className="pt-3 border-t border-[#1e1e1e] flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 font-mono">
                    State:{" "}
                    <strong
                      className={`font-semibold ${
                        isActive
                          ? isDanger
                            ? "text-red-400"
                            : "text-[#E8AE3C]"
                          : "text-gray-500"
                      }`}
                    >
                      {isActive ? (isDanger ? "EMERGENCY FROZEN" : "ACTIVE / ON") : "OFF / DISABLED"}
                    </strong>
                  </span>
                  {flag.updated_at && (
                    <span className="text-[10px] text-gray-600 font-mono">
                      Updated {new Date(flag.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Caution Confirmation Modal for Emergency Read-Only Mode */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="max-w-md w-full bg-[#121212] border-2 border-red-500/80 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.3)] space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                ENABLE EMERGENCY READ-ONLY MODE?
              </h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Enabling <strong className="text-red-400">global_read_only</strong> will freeze all site-wide database writes (publishing properties, deal updates, archiving listings) with HTTP 423 Locked. Public browsing remains active.
              </p>
            </div>

            <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg text-[11px] text-red-300 font-mono text-center">
              ⚠️ Use only during database maintenance or emergency outages.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setPendingFlagToggle(null);
                }}
                className="flex-1 py-2.5 bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 font-semibold text-xs rounded-xl border border-[#333] transition-all"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  if (pendingFlagToggle) {
                    executeToggle(pendingFlagToggle.flagId, pendingFlagToggle.isEnabled);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                CONFIRM FREEZE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
