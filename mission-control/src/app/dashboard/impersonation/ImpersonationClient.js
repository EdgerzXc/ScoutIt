"use client";

import { useState, useEffect } from "react";
import {
  createImpersonationSessionAction,
  terminateImpersonationAction,
} from "./actions";
import {
  UserCheck,
  ShieldAlert,
  Clock,
  ExternalLink,
  XCircle,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function ImpersonationClient({ staffTier }) {
  const [targetUserId, setTargetUserId] = useState("");
  const [reason, setReason] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Active session state
  const [activeSession, setActiveSession] = useState(null); // { token, exp, targetUser }
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!activeSession?.exp) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((activeSession.exp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setActiveSession(null);
        setError("Impersonation session expired.");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const handleLaunch = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await createImpersonationSessionAction({
        targetUserId: targetUserId.trim(),
        reason: reason.trim(),
        durationMinutes: Number(durationMinutes),
      });

      if (res.error) {
        setError(res.error);
      } else {
        setActiveSession(res);
        setSuccess(`Read-only session initiated for ${res.targetUser.display_name}. Session is strictly audited.`);
        setReason("");
      }
    } catch (err) {
      setError(err.message || "Failed to initialize impersonation session.");
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!activeSession) return;
    setLoading(true);
    try {
      await terminateImpersonationAction({
        targetUserId: activeSession.targetUser?.id,
        reason: "Early session termination by operator",
      });
      setActiveSession(null);
      setTimeLeft(null);
      setSuccess("Impersonation session terminated and recorded.");
    } catch (err) {
      setError(err.message || "Failed to terminate session.");
    } finally {
      setLoading(false);
    }
  };

  const formatCountdown = (seconds) => {
    if (seconds == null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Security Notice */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-start gap-3 leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white uppercase tracking-wider block mb-0.5">
            Strict Super Admin Governance (Tier 3 Only)
          </span>
          Read-only impersonation provides troubleshooting visibility into user workspaces.
          Mutations are blocked at the proxy layer, and every session initiation is immutably logged to <code className="text-gold">mission_control_actions</code>.
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Active Session HUD */}
      {activeSession && (
        <div className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Active Read-Only Session
                </span>
                <span className="text-xs font-mono text-white/60">
                  Session Token: {activeSession.token.slice(0, 16)}...
                </span>
              </div>
              <h3 className="text-lg font-medium text-white mt-1">
                Viewing as {activeSession.targetUser.display_name}
              </h3>
              <div className="text-xs font-mono text-white/60 mt-0.5">
                {activeSession.targetUser.email} · {activeSession.targetUser.role} · Tier: {activeSession.targetUser.subscription_tier || "free"}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">Time Remaining</div>
                <div className="text-2xl font-mono text-gold font-semibold">
                  {formatCountdown(timeLeft)}
                </div>
              </div>
              <button
                onClick={handleTerminate}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono hover:bg-rose-500/20 transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Terminate
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-white/60">
              Open the target user&apos;s workspace in read-only diagnostic view:
            </span>
            <a
              href={`/?view_as=${activeSession.targetUser.id}&token=${activeSession.token}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-gold text-black text-xs font-medium uppercase tracking-wider hover:bg-gold/90 transition-colors inline-flex items-center gap-2"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Launch Read-Only Workspace
            </a>
          </div>
        </div>
      )}

      {/* Session Initiation Form */}
      {!activeSession && (
        <div className="p-6 rounded-xl border border-line bg-surface space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-gold" />
            <h3 className="text-base font-medium text-white">Initiate Impersonation Session</h3>
          </div>
          <p className="text-xs text-white/60">
            Specify the target user UUID and ticket reference. Sessions automatically expire and cannot perform writes.
          </p>

          <form onSubmit={handleLaunch} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                Target User UUID
              </label>
              <input
                type="text"
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs font-mono text-white placeholder-white/30 focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                Session Duration
              </label>
              <div className="flex gap-2">
                {[5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`px-4 py-2 rounded-lg text-xs font-mono transition-colors ${
                      durationMinutes === mins
                        ? "bg-gold text-black font-medium"
                        : "bg-black/40 text-white/60 border border-line hover:text-white"
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1">
                Investigation Justification / Ticket Reference (Min 10 chars)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Document support ticket ID, user report, or specific debugging inquiry..."
                rows={3}
                className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading || reason.trim().length < 10 || !targetUserId.trim()}
                className="px-6 py-2.5 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                {loading ? "Authorizing..." : "Authorize View-As Session"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
