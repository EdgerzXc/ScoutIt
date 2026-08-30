import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS } from "@/lib/rbac";
import { Activity, AlertTriangle, CircleAlert, Cpu } from "lucide-react";

// A-063 — System Activity.
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

  const admin = createAdminClient();
  let query = admin
    .from("system_events")
    .select("id, event, source, severity, subject_table, subject_id, summary, detail, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(200);

  if (onlyProblems) query = query.in("severity", ["warning", "error"]);

  const { data: events, error } = await query;

  // Counted separately from the (filtered, capped) list so the header is a fact
  // about the log rather than about this page of it.
  const { count: problemCount } = await admin
    .from("system_events")
    .select("id", { count: "exact", head: true })
    .in("severity", ["warning", "error"]);

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
        <div className="flex items-center gap-2">
          <a
            href="/dashboard/system"
            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
              onlyProblems
                ? "border-white/10 text-white/70 hover:text-white"
                : "border-[rgba(232,174,60,0.3)] bg-[rgba(232,174,60,0.10)] text-[#F7C64E]"
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
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Could not read the system log: {error.message}
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-xl overflow-hidden">
        {(events ?? []).length === 0 ? (
          <div className="text-sm text-white/70 p-8 text-center flex flex-col items-center gap-2">
            <Activity className="w-5 h-5 text-white/70" />
            {onlyProblems
              ? "Nothing has gone wrong that the system noticed."
              : "Nothing recorded yet. Crons, catalogue rebuilds and public-site syncs write here as they run."}
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {events.map((e) => {
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
