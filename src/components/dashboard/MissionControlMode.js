"use client";

import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";

// Mission Control -- ONE dashboard, two lenses, per SCOUTIT_MASTER_BUILD_SPEC.md §3:
// "staff" = internal team, near-global property access to edit anything.
// "enterprise" = an external client company, scoped to only their own portfolio.
//
// ⚠️ DEV-TOOLBOX PREVIEW ONLY. Not production-safe. Real Enterprise account isolation
// needs a real `organizations` table + enforced RLS (both explicitly parked behind the
// RLS security reset per PLAN_STAFF_ENTERPRISE_ANALYTICS_NOTIFICATIONS.md Track 4). This
// component fakes "your company's portfolio" as "properties you happen to own" (ownerId
// match) purely so the UI shape can be reviewed now -- it is not the real access model.
// Real Mission Control is also spec'd as its own standalone app/deployment, not a mode
// inside the main site; this lets you preview the shape without building that yet.

const STATUS_STYLES = {
  approved: { label: "Approved", color: "#4caf7d" },
  pending: { label: "Pending", color: "#E8AE3C" },
  draft: { label: "Draft", color: "#8f8c87" },
  ai_drafting: { label: "AI Drafting", color: "#5a8ce8" },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { label: status || "Unknown", color: "#5a5a5a" };
}

export default function MissionControlMode({ variant = "staff" }) {
  const { listings, currentUser } = useDashboard();

  const scoped =
    variant === "enterprise"
      ? listings.filter((l) => l.ownerId === currentUser?.id)
      : listings;

  const kpis = {
    total: scoped.length,
    approved: scoped.filter((l) => l.pipelineStatus === "approved").length,
    pending: scoped.filter((l) => l.pipelineStatus === "pending" || l.pipelineStatus === "draft").length,
    owners: new Set(scoped.map((l) => l.ownerId).filter(Boolean)).size,
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      <div className="bg-gold-accent/10 border border-gold-accent/30 rounded-lg px-4 py-3 flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="text-gold-accent font-bold uppercase tracking-wider">Dev preview only.</span>{" "}
          {variant === "enterprise"
            ? "Real Enterprise account isolation isn't built yet — this filters by \"properties you own\" as a stand-in for a real company scope, which doesn't exist as a concept yet."
            : "This reads through the platform's current permissive dev access, not a real admin_users/permission_grants system."}{" "}
          Not safe to expose to real users until the RLS security reset happens.
        </div>
      </div>

      <div>
        <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
          Mission Control · {variant === "enterprise" ? "Enterprise" : "Staff"}
        </span>
        <h1 className="font-display-md text-2xl md:text-3xl text-on-surface mt-1">
          {variant === "enterprise" ? "Your Company's Portfolio" : "Platform Overview"}
        </h1>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Properties", value: kpis.total },
          { label: "Approved", value: kpis.approved },
          { label: "Pending / Draft", value: kpis.pending },
          { label: variant === "enterprise" ? "Team Members" : "Distinct Owners", value: variant === "enterprise" ? "—" : kpis.owners },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface border border-surface-variant rounded-lg p-4">
            <div className="font-mono text-2xl text-gold-accent">{kpi.value}</div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-1">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Property table */}
      <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
          <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">
            {variant === "enterprise" ? "Your Properties" : "All Properties"}
          </span>
          <span className="text-xs text-text-secondary">{scoped.length} {scoped.length === 1 ? "listing" : "listings"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-text-secondary border-b border-surface-variant">
                <th className="px-4 py-2 font-normal">Title</th>
                <th className="px-4 py-2 font-normal">Category</th>
                {variant === "staff" && <th className="px-4 py-2 font-normal">Owner</th>}
                <th className="px-4 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal">Completeness</th>
                <th className="px-4 py-2 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {scoped.length === 0 ? (
                <tr>
                  <td colSpan={variant === "staff" ? 6 : 5} className="px-4 py-8 text-center text-text-secondary text-xs">
                    No properties {variant === "enterprise" ? "in your portfolio" : "on the platform"} yet.
                  </td>
                </tr>
              ) : (
                scoped.map((l) => {
                  const status = statusStyle(l.pipelineStatus);
                  return (
                    <tr key={l.id} className="border-b border-surface-variant/50 hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-2.5 text-on-surface">{l.title}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{l.spaceCategory || "—"}</td>
                      {variant === "staff" && (
                        <td className="px-4 py-2.5 text-text-secondary font-mono text-xs">{l.ownerId || "—"}</td>
                      )}
                      <td className="px-4 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium"
                          style={{ color: status.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{l.completenessScore ?? 0}%</td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/dashboard/inventory/${l.id}`}
                          className="text-gold-accent hover:underline text-xs"
                        >
                          Manage →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
