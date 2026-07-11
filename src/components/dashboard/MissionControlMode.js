"use client";

import { useState } from "react";
import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";

// Enterprise Mission Control 
// ⚠️ DEV-TOOLBOX PREVIEW ONLY. Real Enterprise account isolation
// needs a real `organizations` table + enforced RLS. This
// component fakes "your company's portfolio" as "properties you happen to own".

const STATUS_STYLES = {
  approved: { label: "Approved", color: "#4caf7d" },
  pending: { label: "Pending", color: "var(--accent)" },
  draft: { label: "Draft", color: "#8f8c87" },
  ai_drafting: { label: "AI Drafting", color: "#5a8ce8" },
};

function statusStyle(status) {
  return STATUS_STYLES[status] || { label: status || "Unknown", color: "#5a5a5a" };
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
        <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase">
          Mission Control · Enterprise
        </span>
        <h1 className="font-display-md text-2xl md:text-3xl text-on-surface mt-1">
          Your Company&apos;s Portfolio
        </h1>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Properties", value: kpis.total },
          { label: "Approved", value: kpis.approved },
          { label: "Pending / Draft", value: kpis.pending },
          { label: "Team Members", value: "—" },
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
                  className="text-xs bg-red-900/40 text-red-400 hover:bg-red-900/60 hover:text-red-300 px-3 py-1 rounded transition-colors disabled:opacity-50"
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
              <tr className="text-left text-[10px] uppercase tracking-wider text-text-secondary border-b border-surface-variant">
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
                    <tr key={l.id} className={`border-b border-surface-variant/50 hover:bg-surface-container-low transition-colors ${isSelected ? "bg-gold-accent/5" : ""}`}>
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          className="rounded border-surface-variant bg-transparent text-gold-accent focus:ring-gold-accent focus:ring-offset-surface"
                          checked={isSelected}
                          onChange={() => handleSelectOne(l.id)}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-on-surface">{l.title}</td>
                      <td className="px-4 py-2.5 text-text-secondary">{l.spaceCategory || "—"}</td>
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
      </div>
    </div>
  );
}
