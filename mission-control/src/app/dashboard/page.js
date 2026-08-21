import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaff, TIER_LABELS } from "@/lib/rbac";
import {
  Activity,
  ShieldAlert,
  FileEdit,
  Zap,
  ScrollText,
  ClipboardCheck,
  Flag,
  Users,
  ShieldBan,
  Wrench,
} from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;

// Wrap every query so a missing table / schema drift degrades to a dash
// instead of crashing the whole overview. Same philosophy as metrics/page.js.
async function safe(promise) {
  try {
    const result = await promise;
    if (result.error) throw new Error(result.error.message);
    return { data: result.data, count: result.count, error: null };
  } catch (err) {
    return { data: null, count: null, error: err.message || String(err) };
  }
}

export default async function DashboardOverview() {
  const staff = await getCurrentStaff();
  const admin = createAdminClient();
  const since24h = new Date(new Date().getTime() - DAY_MS).toISOString();

  const [
    totalProps,
    pendingProps,
    auditCount24h,
    activeFlags,
    blockedCount,
    recentActions,
  ] = await Promise.all([
    safe(admin.from("properties").select("id", { count: "exact", head: true })),
    safe(
      admin
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("moderation_status", "pending")
    ),
    safe(
      admin
        .from("mission_control_actions")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since24h)
    ),
    safe(
      admin
        .from("feature_flags")
        .select("id", { count: "exact", head: true })
        .eq("is_enabled", true)
    ),
    safe(admin.from("blocked_access").select("id", { count: "exact", head: true })),
    safe(
      admin
        .from("mission_control_actions")
        .select("id, actor_id, actor_tier, action, target_table, target_id, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(8)
    ),
  ]);

  // Resolve actor names for the recent-actions stream.
  const actorIds = [...new Set((recentActions.data ?? []).map((a) => a.actor_id))];
  let actorsById = {};
  if (actorIds.length > 0) {
    const { data: actors } = await admin
      .from("admin_users")
      .select("id, email, display_name")
      .in("id", actorIds);
    actorsById = Object.fromEntries((actors ?? []).map((a) => [a.id, a]));
  }

  const fmt = (r) => (r.error ? "—" : (r.count ?? 0).toLocaleString());

  const stats = [
    {
      name: "Total Properties",
      value: fmt(totalProps),
      icon: Activity,
      sub: totalProps.error ? "unavailable" : "in Supabase",
    },
    {
      name: "Pending Approvals",
      value: fmt(pendingProps),
      icon: ShieldAlert,
      sub: pendingProps.error ? "unavailable" : "awaiting review",
      accent: (pendingProps.count ?? 0) > 0,
    },
    {
      name: "Audit Events (24h)",
      value: fmt(auditCount24h),
      icon: FileEdit,
      sub: auditCount24h.error ? "unavailable" : "staff actions",
    },
    {
      name: "Active Feature Flags",
      value: fmt(activeFlags),
      icon: Zap,
      sub: activeFlags.error ? "unavailable" : "enabled",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">System Overview</h1>
        <span className="text-xs text-white/70">
          {TIER_LABELS[staff.tier]} · live data
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-[#121212] border border-white/5 rounded-xl p-5">
              <div className="flex items-center gap-3 text-white/70 mb-3">
                <Icon className="w-4 h-4" />
                <h3 className="text-sm font-medium">{stat.name}</h3>
              </div>
              <div
                className={`text-3xl font-semibold mb-1 ${
                  stat.accent ? "text-[#E8AE3C]" : "text-white"
                }`}
              >
                {stat.value}
              </div>
              <div className="text-xs text-white/70">{stat.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent audit stream */}
        <div className="xl:col-span-2 bg-[#121212] border border-white/5 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Staff Actions</h2>
            <Link href="/dashboard/audit" className="text-xs text-[#E8AE3C] hover:underline">
              View full log
            </Link>
          </div>

          {recentActions.error ? (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-4">
              Failed to load audit stream: {recentActions.error}
            </div>
          ) : (recentActions.data ?? []).length === 0 ? (
            <div className="text-sm text-white/70 bg-black/40 border border-white/5 rounded-lg p-8 text-center flex flex-col items-center gap-2">
              <ScrollText className="w-5 h-5 text-white/70" />
              No staff actions yet. Every approve, reject, block, and edit will stream here.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recentActions.data.map((a) => {
                const actor = actorsById[a.actor_id];
                return (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="text-[#E8AE3C] font-mono text-xs whitespace-nowrap">
                      {a.action}
                    </span>
                    <span className="text-white/70 text-xs truncate">
                      {a.target_table}#{a.target_id}
                    </span>
                    <span className="ml-auto text-white/70 text-xs whitespace-nowrap">
                      {actor?.display_name || actor?.email || "system"} ·{" "}
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions — real links to real routes */}
        <div className="bg-[#121212] border border-white/5 rounded-xl p-6">
          <h2 className="text-lg font-medium mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickLink href="/dashboard/cms" icon={ClipboardCheck} label="Review pending properties" />
            <QuickLink href="/dashboard/crm" icon={Users} label="Open User CRM" />
            <QuickLink href="/dashboard/features" icon={Flag} label="Feature flags & banners" />
            <QuickLink href="/dashboard/audit" icon={ScrollText} label="Audit log" />
            {staff.tier >= 3 && (
              <QuickLink href="/dashboard/operations" icon={Wrench} label="System operations" />
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <ShieldBan className="w-3.5 h-3.5" />
              <span>
                Blocked entries:{" "}
                <span className="text-white/70">
                  {blockedCount.error ? "—" : (blockedCount.count ?? 0)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg text-sm text-white/80 transition-colors"
    >
      <Icon className="w-4 h-4 text-white/70" />
      {label}
    </Link>
  );
}
