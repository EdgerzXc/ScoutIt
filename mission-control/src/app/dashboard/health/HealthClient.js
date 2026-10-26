"use client";

import { useState, useTransition } from "react";
import { runDiagnosticHealthCheck } from "./actions";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Cloud,
  Layers,
  MapPin,
  Clock,
  Zap,
} from "lucide-react";

const SERVICE_ICONS = {
  supabase: Database,
  airtable: Cloud,
  upstash: Layers,
  mapbox: MapPin,
};

export default function HealthClient({ initialReport, staffTier }) {
  const [report, setReport] = useState(initialReport);
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await runDiagnosticHealthCheck();
      setReport(res);
    } catch (err) {
      console.error("Health refresh failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const { composite, probes, cronTelemetry } = report;
  const isHealthy = composite.overall === "operational";
  const isDegraded = composite.overall === "degraded";

  return (
    <div className="space-y-6">
      {/* Top Composite Posture Banner */}
      <div
        className={`p-6 rounded-xl border ${
          isHealthy
            ? "border-emerald-500/30 bg-emerald-500/5"
            : isDegraded
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-red-500/30 bg-red-500/5"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-lg border ${
                isHealthy
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : isDegraded
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              {isHealthy ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isDegraded ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <XCircle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                  Global System Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider font-semibold ${
                    isHealthy
                      ? "bg-emerald-500/20 text-emerald-300"
                      : isDegraded
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {composite.overall}
                </span>
              </div>
              <h2 className="text-xl font-medium tracking-tight text-white mt-1">
                {composite.summary}
              </h2>
              <div className="text-xs font-mono text-white/60 mt-1 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Last verified: {new Date(report.checkedAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2 self-start md:self-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Probing..." : "Run Diagnostics"}
          </button>
        </div>
      </div>

      {/* Subsystems Health Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono uppercase tracking-wider text-white/60">
            External Dependencies &amp; Latency Probes
          </span>
          <span className="text-xs font-mono text-white/60">{probes.length} Services Monitored</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {probes.map((probe) => {
            const Icon = SERVICE_ICONS[probe.key] || Activity;
            const isOp = probe.status === "operational";
            const isMissing = probe.status === "config_missing";

            return (
              <div
                key={probe.key}
                className="p-5 rounded-xl border border-line bg-surface flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg border border-line bg-black/40 text-gold">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white">{probe.name}</h4>
                        <div className="text-xs text-white/60">{probe.role}</div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wider ${
                        isOp
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : isMissing
                          ? "bg-white/5 text-white/60 border border-white/10"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      }`}
                    >
                      {probe.status.replace("_", " ")}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-line/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 font-mono text-xs">Round-Trip:</span>
                      <span className="font-mono text-white font-medium">
                        {probe.latencyMs > 0 ? `${probe.latencyMs}ms` : "—"}
                      </span>
                      {probe.grade && (
                        <span className="text-xs font-mono uppercase text-gold/80 px-1.5 py-0.2 rounded bg-gold/10">
                          {probe.grade}
                        </span>
                      )}
                    </div>

                    {probe.rateLimitRemaining != null && (
                      <span className="text-xs font-mono text-white/60">
                        Quota: {probe.rateLimitRemaining} req left
                      </span>
                    )}
                  </div>

                  {probe.error && (
                    <div className="mt-2 text-xs font-mono text-amber-400/90 truncate">
                      {probe.error}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cron Telemetry Section */}
      <div className="p-6 rounded-xl border border-line bg-surface">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-gold" />
              <span className="text-xs font-mono uppercase tracking-wider text-white/60">
                Scheduled Engine &amp; Background Workers
              </span>
            </div>
            <h3 className="text-base font-medium text-white mt-0.5">
              Automated Cron Telemetry (Past 24 Hours)
            </h3>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-mono uppercase tracking-wider text-white/60">Executed Runs</div>
              <div className="text-lg font-mono text-white font-medium">{cronTelemetry.runs24h}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono uppercase tracking-wider text-white/60">Failures</div>
              <div className={`text-lg font-mono font-medium ${cronTelemetry.failures24h > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                {cronTelemetry.failures24h}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line text-white/60 font-mono text-xs uppercase tracking-wider">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Cron Job / Event</th>
                <th className="pb-2">Severity</th>
                <th className="pb-2">Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {cronTelemetry.recentCrons?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-white/60 font-mono">
                    No recent cron run events recorded in system log.
                  </td>
                </tr>
              ) : (
                cronTelemetry.recentCrons.map((cron) => (
                  <tr key={cron.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-mono text-white/60">
                      {new Date(cron.occurred_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 font-mono text-gold font-medium">{cron.event}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-mono uppercase ${
                          cron.severity === "error"
                            ? "bg-rose-500/10 text-rose-400"
                            : cron.severity === "warning"
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-emerald-500/10 text-emerald-400"
                        }`}
                      >
                        {cron.severity}
                      </span>
                    </td>
                    <td className="py-2.5 text-white/80 max-w-sm truncate">{cron.summary}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
