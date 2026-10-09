import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Activity, AlertTriangle, CircleAlert, Cpu, ExternalLink, ShieldAlert, Zap } from "lucide-react";
import { extractIncidentSignal } from "@/lib/incidentSignals.mjs";

// A-063 — System Activity.
// A-185 Phase 3 — Master Mission Control Topological Incident Signal Dispatcher.
//
// Deliberately NOT a tab on the Audit Log. That page is a human accountability
// trail: every row is a named person who pressed a button, and each one can be
// reverted. These rows have no actor and nothing to undo. Interleaving them
// would make the audit log stop reading as a list of decisions somebody is
// answerable for, and bury the machine events among them.

export const dynamic = "force-dynamic";

const SEVERITY_STYLE = {
  error: {
    row: "border-l-2 border-l-red-400/70",
    chip: "text-red-300 border-red-400/30 bg-red-400/10",
    Icon: CircleAlert,
  },
  warning: {
    row: "border-l-2 border-l-[#E8AE3C]/70",
    chip: "text-[#F7C64E] border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.08)]",
    Icon: AlertTriangle,
  },
  info: {
    row: "border-l-2 border-l-white/10",
    chip: "text-white/70 border-white/10 bg-white/5",
    Icon: Activity,
  },
};

function timeAgo(iso) {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

export default async function SystemActivityPage({ searchParams }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login");
  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const params = await searchParams;
  const onlyProblems = params?.filter === "problems";
  const onlyIncidents = params?.filter === "incidents";

  const admin = createAdminClient();
  let query = admin
    .from("system_events")
    .select("id, event, source, severity, subject_table, subject_id, summary, detail, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (onlyProblems || onlyIncidents) query = query.in("severity", ["warning", "error"]);

  const { data: rawEvents, error } = await query;

  // Counted separately from the (filtered, capped) list so the header is a fact
  // about the log rather than about this page of it.
  const { count: problemCount } = await admin
    .from("system_events")
    .select("id", { count: "exact", head: true })
    .in("severity", ["warning", "error"]);

  const allEvents = rawEvents ?? [];
  const incidentSignalsList = allEvents.map((e) => ({ event: e, signal: extractIncidentSignal(e) }));
  const totalIncidentsInBatch = incidentSignalsList.filter((item) => Boolean(item.signal)).length;

  const displayItems = onlyIncidents
    ? incidentSignalsList.filter((item) => Boolean(item.signal))
    : incidentSignalsList;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#E8AE3C]" />
            System Activity
          </h1>
          <p className="text-sm text-white/60 mt-1 max-w-2xl">
            What ran on its own: scheduled jobs, catalogue rebuilds, cache purges and syncs to the
            public site. Decisions a person made are in the Audit Log — this is only the machinery,
            so a job that quietly stopped shows up as a gap rather than as silence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/dashboard/system"
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              !onlyProblems && !onlyIncidents
                ? "border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.10)] text-[#F7C64E]"
                : "border-white/10 text-white/70 hover:text-white"
            }`}
          >
            Everything
          </a>
          <a
            href="/dashboard/system?filter=problems"
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              onlyProblems
                ? "border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.10)] text-[#F7C64E]"
                : "border-white/10 text-white/70 hover:text-white"
            }`}
          >
            Only problems{typeof problemCount === "number" ? ` (${problemCount})` : ""}
          </a>
          <a
            href="/dashboard/system?filter=incidents"
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors flex items-center gap-1.5 ${
              onlyIncidents
                ? "border-red-500/40 bg-red-950/40 text-red-300 font-semibold"
                : "border-white/10 text-white/70 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Incident signals{totalIncidentsInBatch > 0 ? ` (${totalIncidentsInBatch})` : ""}</span>
          </a>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Could not read the system log: {error.message}
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
        {displayItems.length === 0 ? (
          <div className="text-sm text-white/70 p-8 text-center flex flex-col items-center gap-2">
            <Activity className="w-5 h-5 text-white/70" />
            {onlyIncidents
              ? "No topological incident signals detected in current window."
              : onlyProblems
              ? "Nothing has gone wrong that the system noticed."
              : "Nothing recorded yet. Crons, catalogue rebuilds and public-site syncs write here as they run."}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {displayItems.map(({ event: e, signal }) => {
              const style = SEVERITY_STYLE[e.severity] || SEVERITY_STYLE.info;
              const { Icon } = style;
              return (
                <li key={e.id} className={`p-4 ${style.row}`}>
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <Icon className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white/90">
                        {e.summary || e.event}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/60">
                        <span className="font-mono uppercase tracking-wide">{e.event}</span>
                        <span className="font-mono">{e.source}</span>
                        {e.subject_table && (
                          <span className="font-mono">
                            {e.subject_table}
                            {e.subject_id ? ` · ${e.subject_id}` : ""}
                          </span>
                        )}
                        <span title={new Date(e.occurred_at).toISOString()}>
                          {timeAgo(e.occurred_at)}
                        </span>
                      </div>

                      {/* A-185 Phase 3: Interactive Topological Incident Signal Card */}
                      {signal && (
                        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-950/20 p-3.5 space-y-2.5 backdrop-blur-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-500/20 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                              <span className="font-mono text-xs font-bold tracking-wider uppercase text-red-400 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                Topological Incident Provenance
                              </span>
                            </div>
                            <a
                              href={signal.triageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E8AE3C]/10 border border-[#E8AE3C]/40 text-[#F7C64E] hover:bg-[#E8AE3C]/20 text-xs font-mono tracking-wider uppercase font-semibold transition-colors"
                            >
                              <span>Open in Flow Graph</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                            <div className="bg-black/40 border border-white/5 rounded p-2">
                              <div className="text-white/60 uppercase tracking-widest text-[12px]">Node ID</div>
                              <div className="text-[#F7C64E] font-bold truncate mt-0.5">{signal.nodeId}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded p-2">
                              <div className="text-white/60 uppercase tracking-widest text-[12px]">Domain</div>
                              <div className="text-white/90 truncate mt-0.5 capitalize">{signal.domain}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded p-2">
                              <div className="text-white/60 uppercase tracking-widest text-[12px]">Affected Role</div>
                              <div className="text-white/90 truncate mt-0.5 uppercase">{signal.role}</div>
                            </div>
                            <div className="bg-black/40 border border-white/5 rounded p-2">
                              <div className="text-white/60 uppercase tracking-widest text-[12px]">Blast Radius</div>
                              <div className="text-red-400 font-bold truncate mt-0.5">{signal.blastRadius}</div>
                            </div>
                          </div>

                          {signal.recoveryPlaybook && (
                            <div className="bg-black/50 border border-amber-500/20 rounded p-2.5 flex items-start gap-2 text-[12px]">
                              <Zap className="w-3.5 h-3.5 text-[#F7C64E] shrink-0 mt-0.5" />
                              <div className="text-white/80">
                                <strong className="text-[#F7C64E] font-mono uppercase tracking-wider text-[12px] block">
                                  Declared Recovery Playbook
                                </strong>
                                {signal.recoveryPlaybook}
                              </div>
                            </div>
                          )}

                          {signal.evidencePath && (
                            <div className="text-[12px] font-mono text-white/60 flex items-center gap-1.5 truncate">
                              <span>Triage Path:</span>
                              <span className="text-white/70">{signal.evidencePath}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {e.detail && Object.keys(e.detail).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-[12px] text-white/60 hover:text-white/80 cursor-pointer select-none">
                            Detail
                          </summary>
                          <pre className="mt-2 text-[12px] text-white/70 bg-black/40 border border-white/10 rounded-lg p-3 overflow-x-auto">
                            {JSON.stringify(e.detail, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <span
                      className={`text-[12px] uppercase tracking-wide border rounded-full px-2 py-0.5 ${style.chip}`}
                    >
                      {e.severity}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
