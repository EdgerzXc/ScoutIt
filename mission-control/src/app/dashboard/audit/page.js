import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIERS, TIER_LABELS } from "@/lib/rbac";
import { verificationDecisionForRevert } from "@/lib/auditRevertPolicy.mjs";
import { ScrollText } from "lucide-react";
import { AuditRevertForm } from "./AuditRevertForm";

export default async function AuditLogPage() {
  const staff = await getCurrentStaff();

  if (staff.tier < TIERS.OPS_MANAGER) {
    redirect("/dashboard?error=InsufficientTier");
  }

  const admin = createAdminClient();
  const { data: actions, error } = await admin
    .from("mission_control_actions")
    .select("id, actor_id, actor_tier, action, target_table, target_id, reason, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const actorIds = [...new Set((actions ?? []).map((a) => a.actor_id))];
  let actorsById = {};
  if (actorIds.length > 0) {
    const { data: actors } = await admin
      .from("admin_users")
      .select("id, email, display_name")
      .in("id", actorIds);
    actorsById = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Audit Log &amp; Revert Engine</h1>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-4">
          Failed to load audit log: {error.message}
        </div>
      )}

      <div className="bg-[#121212] border border-white/5 rounded-xl overflow-x-auto">
        {(actions ?? []).length === 0 ? (
          <div className="text-sm text-white/70 p-8 text-center flex flex-col items-center gap-2">
            <ScrollText className="w-5 h-5 text-white/70" />
            No actions logged yet. Every approve/reject/block/archive from this app writes here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/70 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="px-5 py-3 font-medium">When</th>
                <th className="px-5 py-3 font-medium">Staff</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Target</th>
                <th className="px-5 py-3 font-medium">Reason</th>
                <th className="px-5 py-3 font-medium text-right">Revert</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((a) => {
                const actor = actorsById[a.actor_id];
                const canRevert = Boolean(verificationDecisionForRevert(a));

                return (
                  <tr key={a.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-white/70 whitespace-nowrap">
                      {new Date(a.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-white/80 whitespace-nowrap">
                      {actor?.display_name || actor?.email || a.actor_id}
                      <span className="text-white/70 text-xs ml-1">
                        ({TIER_LABELS[a.actor_tier] ?? a.actor_tier})
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#E8AE3C] font-mono text-xs whitespace-nowrap">
                      {a.action}
                    </td>
                    <td className="px-5 py-3 text-white/70 whitespace-nowrap">
                      {a.target_table}#{a.target_id}
                    </td>
                    <td className="px-5 py-3 text-white/60">{a.reason || "—"}</td>
                    <td className="px-5 py-3 text-right">
                      {canRevert && <AuditRevertForm id={a.id} />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
