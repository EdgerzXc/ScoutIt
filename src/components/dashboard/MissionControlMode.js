"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";
import GlassPanel from "../ui/GlassPanel";

// Enterprise Mission Control 
// ⚠️ DEV-TOOLBOX PREVIEW ONLY. Real Enterprise account isolation
// needs a real `organizations` table + enforced RLS. This
// component fakes "your company's portfolio" as "properties you happen to own".

const STATUS_STYLES = {
  approved: { label: "Approved", textClass: "text-success", bgClass: "bg-success" },
  pending: { label: "Pending", textClass: "text-gold-accent", bgClass: "bg-gold-accent" },
  draft: { label: "Draft", textClass: "text-text-secondary", bgClass: "bg-surface-variant" },
  ai_drafting: { label: "AI Drafting", textClass: "text-tertiary", bgClass: "bg-tertiary" },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { label: status || "Unknown", textClass: "text-text-muted", bgClass: "bg-surface-variant" };
}

export default function MissionControlMode() {
  const { listings, currentUser, addToast, closeListing } = useDashboard();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Hard-scoped to only the Enterprise's own properties
  const scoped = listings.filter((l) => l.ownerId === currentUser?.id);

  const kpis = {
    total: scoped.length,
    approved: scoped.filter((l) => l.pipelineStatus === "approved").length,
    pending: scoped.filter((l) => l.pipelineStatus === "pending" || l.pipelineStatus === "draft").length,
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(scoped.map(l => l.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleMassDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.size} properties?`)) return;
    setIsDeleting(true);
    
    const idsToDelete = Array.from(selectedIds);
    setSelectedIds(new Set());

    try {
      await Promise.all(idsToDelete.map(id => closeListing(id)));
      addToast(`Successfully deleted ${idsToDelete.length} properties.`, "✅");
    } catch (e) {
      addToast("Error deleting some properties.", "❌");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-col gap-6">
      <div className="bg-gold-accent/10 border border-gold-accent/30 rounded-lg px-4 py-3 flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <div className="text-xs text-text-secondary leading-relaxed">
          <span className="text-gold-accent font-bold uppercase tracking-wider">Dev preview only.</span>{" "}
          Real Enterprise account isolation isn&apos;t built yet — this filters by &quot;properties you own&quot; as a stand-in for a real company scope, which doesn&apos;t exist as a concept yet. Not safe to expose to real users until the RLS security reset happens.
        </div>
      </div>

      <div>
        <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase drop-shadow-[0_0_10px_rgba(247,198,78,0.5)]">
          Mission Control · Enterprise
        </span>
        <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-gradient-sapphire">
          Your Company&apos;s Portfolio
        </h1>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: kpis.total, glow: "rgba(59,130,246,0.15)" },
          { label: "Approved", value: kpis.approved, glow: "rgba(16,185,129,0.15)" },
          { label: "Pending / Draft", value: kpis.pending, glow: "rgba(247,198,78,0.15)" },
          { label: "Team Members", value: "—", glow: "rgba(255,255,255,0.05)" },
        ].map((kpi) => (
          <GlassPanel key={kpi.label} className="rounded-xl p-5 hover:-translate-y-1 transition-transform duration-300" glowColor={kpi.glow}>
            <div className="font-mono text-3xl text-white font-bold">{kpi.value}</div>
            <div className="text-[10px] text-text-secondary uppercase tracking-wider mt-2">{kpi.label}</div>
          </GlassPanel>
        ))}
      </div>

      {/* Property table */}
      <GlassPanel className="rounded-xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.1)]">
        <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">
              Your Properties
            </span>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gold-accent bg-gold-accent/10 px-2 py-0.5 rounded">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={handleMassDelete}
                  disabled={isDeleting}
                  className="text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 hover:text-red-300 px-3 py-1 rounded transition-colors disabled:opacity-50 active:scale-[0.98]"
                >
                  {isDeleting ? "Deleting..." : "Delete Selected"}
                </button>
              </div>
            )}
          </div>
          <span className="text-xs text-text-secondary">{scoped.length} {scoped.length === 1 ? "listing" : "listings"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-text-secondary border-b border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.2)]">
                <th className="px-4 py-2 font-normal w-10">
                  <input
                    type="checkbox"
                    className="rounded border-surface-variant bg-transparent text-gold-accent focus:ring-gold-accent focus:ring-offset-surface"
                    checked={scoped.length > 0 && selectedIds.size === scoped.length}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-4 py-2 font-normal">Title</th>
                <th className="px-4 py-2 font-normal">Category</th>
                <th className="px-4 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal">Completeness</th>
                <th className="px-4 py-2 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {scoped.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-secondary text-xs">
                    No properties in your portfolio yet.
                  </td>
                </tr>
              ) : (
                scoped.map((l) => {
                  const status = statusStyle(l.pipelineStatus);
                  const isSelected = selectedIds.has(l.id);
                  return (
                    <tr key={l.id} className={`border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.02)] transition-colors ${isSelected ? "bg-[rgba(247,198,78,0.05)]" : ""}`}>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          className="rounded border-surface-variant bg-transparent text-gold-accent focus:ring-gold-accent focus:ring-offset-surface"
                          checked={isSelected}
                          onChange={() => handleSelectOne(l.id)}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-on-surface max-w-[200px] truncate" title={l.title}>{l.title}</td>
                      <td className="px-4 py-2.5 text-text-secondary max-w-[150px] truncate" title={l.spaceCategory || ""}>{l.spaceCategory || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${status.textClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${status.bgClass}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-text-secondary">{l.completenessScore ?? 0}%</td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/dashboard/inventory/${l.id}`}
                          className="text-gold-accent hover:underline text-xs"
                        >
                          Manage
                        </Link>
                        <span className="text-surface-variant mx-2">|</span>
                        <button
                          onClick={() => {
                            if(window.confirm("Are you sure you want to delete this property?")) {
                              closeListing(l.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}
