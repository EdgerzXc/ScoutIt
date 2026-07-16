"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, Building2, Users, ClipboardList, 
  UsersRound, Box, BadgeDollarSign, LineChart, 
  Bot, Settings, AlertTriangle, ArrowRight, Activity,
  CalendarDays, HardHat, Warehouse, BellRing
} from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { computeListingStrength } from "../../lib/listingStrength";
import GlassPanel from "../ui/GlassPanel";
import TeamManagementPanel from "./panels/TeamManagementPanel";
import ProjectManagementPanel from "./panels/ProjectManagementPanel";
import TaskRail from "./crm/TaskRail";
import InventoryGridManager from "./InventoryGridManager";
import DelegationRequests from "./DelegationRequests";

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
  const { listings, pitches, connects, currentUser, addToast, closeListing } = useDashboard();
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminActiveTab, setAdminActiveTab] = useState('Organization Profile');
  const [orgName, setOrgName] = useState("Acme Holdings");
  const [orgDomain, setOrgDomain] = useState("acme-holdings.com");
  const [is2FAEnforced, setIs2FAEnforced] = useState(true);

  const [inventoryStats, setInventoryStats] = useState({ total: 0, occupied: 0, vacant: 0, maintenance: 0 });
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [activeEstateId, setActiveEstateId] = useState(null);
  const [enterpriseUnits, setEnterpriseUnits] = useState([]);

  useEffect(() => {
    if (currentUser?.user_metadata?.full_name) {
      setOrgName(currentUser.user_metadata.full_name);
    }
  }, [currentUser]);


  // Real unit inventory stats feed the Dashboard hero, Inventory tab, and
  // Analytics intel line — fetch once when the sandbox unlocks.
  useEffect(() => {
    if (!isEnterprise) return;
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/inventory');
        if (res.ok) {
          const data = await res.json();
          if (data.stats) setInventoryStats(data.stats);
        }
      } catch (e) {
        console.error("Failed to fetch inventory stats", e);
      }
    };
    fetchStats();
  }, [isEnterprise]);

  // Hard-scoped to only the Enterprise's own properties
  const scoped = listings.filter((l) => l.ownerId === currentUser?.id);
  const scopedPitches = (pitches || []).filter((p) => p.isCurrentUserOwner);

  // Sync active estate when scoped changes
  useEffect(() => {
    if (scoped.length > 0 && !activeEstateId) {
      setActiveEstateId(scoped[0].id);
    }
  }, [scoped, activeEstateId]);

  const kpis = {
    total: scoped.length,
    approved: scoped.filter((l) => l.pipelineStatus === "approved").length,
    pending: scoped.filter((l) => l.pipelineStatus === "pending" || l.pipelineStatus === "draft").length,
    newLeads: scopedPitches.filter((p) => p.status === "pending").length || scopedPitches.length,
    drafting: scoped.filter((l) => l.pipelineStatus === "draft" || l.pipelineStatus === "ai_drafting").length,
  };

  // ── Honest, derived signals (no invented numbers — Honest Blank Rule) ──

  // Same strength engine OwnerMode uses (live field checklist, not the stale
  // DB completeness_score column), so scores match across dashboards.
  const strengthOf = (l) => computeListingStrength(l).score;

  // Portfolio health = average listing completeness across the company scope.
  const healthScore = scoped.length > 0
    ? Math.round(scoped.reduce((sum, l) => sum + strengthOf(l), 0) / scoped.length)
    : null;

  // Listings whose dossier is thin enough to hurt conversion.
  const weakListings = scoped.filter((l) => strengthOf(l) < 50);

  // Real alert feed: incomplete dossiers + unanswered broker pitches.
  const alerts = [
    ...weakListings.slice(0, 2).map((l) => ({
      tone: "warn",
      label: "Incomplete dossier",
      detail: l.title,
    })),
    ...(kpis.newLeads > 0
      ? [{ tone: "info", label: "Awaiting reply", detail: `${kpis.newLeads} broker ${kpis.newLeads === 1 ? "pitch" : "pitches"}` }]
      : []),
  ];

  // Plain-language portfolio digest built from live counts only.
  const portfolioSignal = scoped.length === 0
    ? "No properties in your company scope yet. Add or import your first asset from the Portfolio module."
    : [
        `Your portfolio holds ${kpis.total} ${kpis.total === 1 ? "listing" : "listings"} — ${kpis.approved} live, ${kpis.pending} in the pipeline.`,
        inventoryStats.total > 0
          ? `${inventoryStats.total} units tracked: ${inventoryStats.occupied} occupied, ${inventoryStats.vacant} vacant${inventoryStats.maintenance ? `, ${inventoryStats.maintenance} in maintenance` : ""}.`
          : null,
        weakListings.length > 0
          ? `${weakListings.length} ${weakListings.length === 1 ? "dossier needs" : "dossiers need"} more detail to hit full strength.`
          : null,
        kpis.newLeads > 0 ? `${kpis.newLeads} broker ${kpis.newLeads === 1 ? "pitch is" : "pitches are"} waiting on your review.` : null,
      ].filter(Boolean).join(" ");

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

  const NavButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 text-left w-full relative overflow-hidden group ${
          isActive 
            ? 'text-gold-accent bg-gold-accent/5' 
            : 'text-text-secondary hover:text-white hover:bg-white/5'
        }`}
      >
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold-accent shadow-[0_0_8px_rgba(232,174,60,0.8)]" />
        )}
        <Icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_5px_rgba(232,174,60,0.5)]' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`} />
        <span className={`font-mono uppercase tracking-wider text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
      </button>
    );
  };

  const NavGroup = ({ label, children }) => (
    <div className="mb-5">
      <div className="text-[10px] tracking-widest text-gold-accent uppercase mb-1.5 px-3 opacity-70 font-label-caps">{label}</div>
      <div className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-full animate-slide-up-fade relative">
      {!isEnterprise ? (
        <div className="flex-1 w-full min-h-[calc(100vh-100px)] z-50 flex flex-col items-center justify-center p-6 bg-[#0d0d0d] overflow-y-auto">
          <div className="max-w-4xl w-full flex flex-col items-center text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
            <div className="w-20 h-20 bg-gold-accent/10 border border-gold-accent/20 rounded-full flex items-center justify-center mb-4 relative">
               <div className="absolute inset-0 bg-gold-accent blur-3xl opacity-20 rounded-full" />
               <Building2 size={32} className="text-gold-accent relative z-10" />
            </div>
            
            <h1 className="font-display-md text-4xl md:text-6xl text-white tracking-tight drop-shadow-md">
              ScoutIt <span className="text-gold-accent">Enterprise OS</span>
            </h1>
            <p className="text-text-secondary max-w-2xl text-lg font-light">
              The ultimate command center for real estate organizations. 10 Core Modules to run your entire portfolio, automate leasing, and gain market intelligence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8 text-left">
               <GlassPanel className="p-6 rounded-2xl border-white/10 hover:border-gold-accent/30 transition-all duration-300">
                 <Bot size={24} className="text-blue-400 mb-4" />
                 <h3 className="text-white font-medium mb-2">Intelligence Center</h3>
                 <p className="text-xs text-text-secondary leading-relaxed">Automate drafting, review pitches, and get real-time AI summaries of your entire portfolio.</p>
               </GlassPanel>
               <GlassPanel className="p-6 rounded-2xl border-gold-accent/20 relative overflow-hidden ring-1 ring-gold-accent/20">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gold-accent/10 blur-2xl rounded-full" />
                 <LineChart size={24} className="text-gold-accent mb-4 relative z-10" />
                 <h3 className="text-white font-medium mb-2 relative z-10">Advanced Analytics</h3>
                 <p className="text-xs text-text-secondary leading-relaxed relative z-10">Historical location graphs, space demand trends, and precise market synergy.</p>
               </GlassPanel>
               <GlassPanel className="p-6 rounded-2xl border-white/10 hover:border-gold-accent/30 transition-all duration-300">
                 <UsersRound size={24} className="text-emerald-400 mb-4" />
                 <h3 className="text-white font-medium mb-2">Team & Permissions</h3>
                 <p className="text-xs text-text-secondary leading-relaxed">Granular control over agents, finance heads, and location managers with full audit logs.</p>
               </GlassPanel>
            </div>

            <div className="pt-10 flex flex-col items-center gap-4">
              <div className="text-3xl text-white font-display-md">₱25,000 <span className="text-sm text-text-secondary font-sans font-normal">/ month</span></div>
              <button onClick={() => setIsEnterprise(true)} className="px-10 py-4 bg-gold-accent hover:bg-gold-accent-bright text-black rounded-full font-medium transition-all shadow-[0_0_20px_rgba(232,174,60,0.3)] hover:shadow-[0_0_30px_rgba(247,198,78,0.5)] hover:-translate-y-1">
                Unlock Enterprise Sandbox
              </button>
              <p className="text-xs text-text-secondary font-mono tracking-widest uppercase mt-4">Dev Mode: Bypass Paywall</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <aside className="w-64 border-r border-white/5 p-4 flex-col overflow-y-auto hidden md:flex min-h-[calc(100vh-80px)] custom-scrollbar">
        
        <div className="mb-5">
          <div className="text-[10px] tracking-widest text-gold-accent uppercase mb-3 px-3 opacity-70 font-label-caps">
            Enterprise Mission Control
          </div>
          <div className="flex flex-col gap-1.5">
            <NavButton id="dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavButton id="portfolio" icon={Building2} label="Portfolio" />
            <NavButton id="crm" icon={Users} label="CRM" />
            <NavButton id="projects" icon={ClipboardList} label="Projects" />
            <NavButton id="team" icon={UsersRound} label="Team" />
            <NavButton id="inventory" icon={Box} label="Inventory" />
            <NavButton id="finance" icon={BadgeDollarSign} label="Finance" />
            <NavButton id="analytics" icon={LineChart} label="Analytics" />
            <NavButton id="ai" icon={Bot} label="AI Center" />
            <NavButton id="administration" icon={Settings} label="Administration" />
          </div>
        </div>

      </aside>

      {/* Main Content */}
      <div className="flex-1 px-4 md:px-8 py-6 flex flex-col gap-6 overflow-y-auto">
        {activeTab === "dashboard" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div className="bg-gold-accent/5 border border-gold-accent/20 rounded-lg px-4 py-3 flex items-start gap-3 mb-6 backdrop-blur-md">
              <AlertTriangle className="text-gold-accent shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-text-secondary leading-relaxed">
                <span className="text-gold-accent font-mono uppercase tracking-widest text-[10px]">Dev preview</span>{" "}
                <span className="ml-2">Real Enterprise account isolation isn&apos;t built yet — this filters by &quot;properties you own&quot; as a stand-in for a real company scope. Not safe to expose to real users until the RLS security reset happens.</span>
              </div>
            </div>

            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase drop-shadow-[0_0_10px_rgba(247,198,78,0.5)]">
                Mission Control • Company Health
              </span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-gradient-sapphire">
                Enterprise Dashboard
              </h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                One view of your whole operation — every number below is read live from your portfolio.
              </p>
            </div>

            {/* Bento Grid Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mt-6 auto-rows-[minmax(160px,auto)]">
              
              {/* Hero Metric: Company Health (2x2) */}
              <GlassPanel className="md:col-span-2 md:row-span-2 rounded-3xl p-8 flex flex-col relative overflow-hidden group border-white/10 hover:border-gold-accent/30 transition-all duration-500 shadow-xl hover:shadow-[0_8px_40px_rgba(232,174,60,0.15)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent/5 rounded-full blur-3xl group-hover:bg-gold-accent/10 transition-colors duration-700 -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                
                <div className="flex items-start justify-between relative z-10 mb-auto">
                  <div>
                    <h3 className="text-white font-display-md text-2xl tracking-wide mb-1">Portfolio Strength</h3>
                    <p className="text-text-secondary text-sm font-mono uppercase tracking-widest">Average dossier completeness</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-surface-alt border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <Activity className="text-gold-accent" size={24} />
                  </div>
                </div>

                <div className="relative z-10 mt-12">
                  {healthScore !== null ? (
                    <div className="flex items-baseline gap-3">
                      <span className="font-display-md text-7xl text-white tracking-tighter drop-shadow-md">{healthScore}</span>
                      <span className="text-gold-accent font-mono text-sm uppercase tracking-widest">/ 100</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="font-display-md text-7xl text-white/30 tracking-tighter">—</span>
                      <span className="text-text-secondary font-mono text-sm uppercase tracking-widest">No assets yet</span>
                    </div>
                  )}
                  <div className="mt-6 flex items-center gap-4 text-xs text-text-secondary">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> {kpis.approved} live {kpis.approved === 1 ? "listing" : "listings"}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gold-accent shadow-[0_0_8px_rgba(232,174,60,0.5)]"></span> {weakListings.length} need{weakListings.length === 1 ? "s" : ""} attention</span>
                  </div>
                </div>
              </GlassPanel>

              {/* Standard KPI Cards (1x1) */}
              {[
                { label: "Active Portfolio", value: kpis.total, glow: "rgba(59,130,246,0.1)", onClick: () => setActiveTab("portfolio"), icon: Building2 },
                { label: "Broker Pitches", value: kpis.newLeads.toString(), glow: "rgba(16,185,129,0.1)", onClick: () => setActiveTab("crm"), icon: Users },
                { label: "In Pipeline", value: kpis.pending, glow: "rgba(247,198,78,0.1)", onClick: () => setActiveTab("projects"), icon: ClipboardList },
                { label: "Team Seats", value: "—", glow: "rgba(255,255,255,0.05)", onClick: () => setActiveTab("team"), actionText: "Set up", icon: UsersRound },
              ].map((kpi) => (
                <GlassPanel 
                  key={kpi.label} 
                  className={`md:col-span-1 md:row-span-1 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden ${kpi.onClick ? 'cursor-pointer border-white/5 hover:border-white/20 shadow-lg hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]' : 'border-white/5'}`} 
                  glowColor={kpi.glow}
                  onClick={kpi.onClick}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="flex items-center justify-between relative z-10 mb-4">
                    <kpi.icon className="text-text-secondary group-hover:text-gold-accent transition-colors duration-300" size={18} />
                    {kpi.actionText && (
                      <span className="text-gold-accent text-[10px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                        {kpi.actionText} <ArrowRight size={10} />
                      </span>
                    )}
                  </div>
                  <div className="relative z-10">
                    <div className="font-display-md text-4xl text-white tracking-tight mb-2 group-hover:scale-[1.02] origin-left transition-transform duration-300">{kpi.value}</div>
                    <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest line-clamp-1">
                      {kpi.label}
                    </div>
                  </div>
                </GlassPanel>
              ))}

              {/* Wide Card: Recent Activity (2x1) */}
              <GlassPanel className="md:col-span-2 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/10 transition-colors duration-300 flex flex-col justify-center bg-gradient-to-r from-transparent to-blue-900/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center">
                    <Activity className="text-gold-accent" size={14} />
                  </div>
                  <div>
                    <h4 className="text-white font-medium text-sm">Portfolio Signal</h4>
                    <p className="text-text-secondary text-[11px] font-mono tracking-widest uppercase">Live · read from your data</p>
                  </div>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed pl-11">
                  {portfolioSignal}
                </p>
              </GlassPanel>

              {/* Schedule (1x2) */}
              <GlassPanel className="md:col-span-1 md:row-span-2 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <CalendarDays className="text-gold-accent opacity-80" size={18} />
                  <h4 className="text-white font-medium text-sm">Today&apos;s Schedule</h4>
                </div>
                <div className="flex flex-col items-center justify-center text-center py-10 gap-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <CalendarDays className="text-text-secondary" size={20} />
                  </div>
                  <p className="text-text-secondary text-sm">Nothing booked today.</p>
                  <p className="text-text-secondary/60 text-xs leading-relaxed max-w-[180px]">
                    Site visits and client meetings will line up here once your calendar connects.
                  </p>
                  <Link href="/dashboard/calendar" className="text-gold-accent text-[10px] font-mono uppercase tracking-widest hover:underline mt-1">
                    Open Calendar →
                  </Link>
                </div>
              </GlassPanel>

              {/* System Alerts (1x1) */}
              <GlassPanel 
                onClick={() => setActiveTab("projects")}
                className="md:col-span-1 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-red-500/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-colors duration-500 -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <BellRing className={`${alerts.length > 0 ? "text-red-400 group-hover:text-red-300" : "text-emerald-400"} transition-colors duration-300`} size={18} />
                  {alerts.length > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center">{alerts.length}</span>
                  )}
                </div>
                <div className="relative z-10">
                  <h4 className="text-white font-medium text-sm mb-1">Needs Attention</h4>
                  {alerts.length > 0 ? (
                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                      {alerts.slice(0, 2).map((a, i) => (
                        <span key={i} className="block">
                          <span className={`${a.tone === "warn" ? "text-gold-accent" : "text-blue-400"} font-medium`}>{a.label}:</span> {a.detail}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <span className="text-emerald-400 font-medium">All clear.</span> Every dossier is in shape and no pitches are waiting.
                    </p>
                  )}
                </div>
              </GlassPanel>

              {/* Inventory Overview (1x1) */}
              <GlassPanel 
                onClick={() => setActiveTab("inventory")}
                className="md:col-span-1 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <Warehouse className="text-text-secondary group-hover:text-gold-accent transition-colors duration-300" size={18} />
                  {inventoryStats.total > 0 && (
                    <span className="text-emerald-400 text-[10px] font-mono font-bold">{inventoryStats.vacant} vacant</span>
                  )}
                </div>
                <div>
                  <div className="font-display-md text-3xl text-white tracking-tight mb-1 group-hover:scale-[1.02] origin-left transition-transform duration-300">{inventoryStats.total}</div>
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Units Tracked
                  </div>
                </div>
              </GlassPanel>

              {/* Active Projects (1x1) */}
              <GlassPanel
                onClick={() => setActiveTab("projects")}
                className="md:col-span-1 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <HardHat className="text-text-secondary group-hover:text-gold-accent transition-colors duration-300" size={18} />
                </div>
                <div>
                  <div className="font-display-md text-3xl text-white tracking-tight mb-1 group-hover:scale-[1.02] origin-left transition-transform duration-300">{kpis.drafting}</div>
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Drafts in Progress
                  </div>
                </div>
              </GlassPanel>

              {/* Occupancy (1x1) — live unit data */}
              <GlassPanel
                onClick={() => setActiveTab("inventory")}
                className="md:col-span-1 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <Activity className="text-text-secondary group-hover:text-emerald-400 transition-colors duration-300" size={18} />
                </div>
                <div>
                  <div className="font-display-md text-3xl text-white tracking-tight mb-2 group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {inventoryStats.total > 0 ? `${Math.round((inventoryStats.occupied / inventoryStats.total) * 100)}%` : "—"}
                  </div>
                  {inventoryStats.total > 0 && (
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-700" style={{ width: `${Math.round((inventoryStats.occupied / inventoryStats.total) * 100)}%` }} />
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Occupancy Rate
                  </div>
                </div>
              </GlassPanel>

              {/* Connections (1x1) — live deal chatboxes */}
              <GlassPanel
                onClick={() => setActiveTab("crm")}
                className="md:col-span-1 md:row-span-1 rounded-2xl p-6 relative overflow-hidden group border-white/5 hover:border-white/20 transition-all duration-300 shadow-lg cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <Users className="text-text-secondary group-hover:text-blue-400 transition-colors duration-300" size={18} />
                  {(pitches || []).filter((p) => p.status === "pending").length > 0 && (
                    <span className="text-gold-accent text-[10px] font-mono font-bold">
                      {(pitches || []).filter((p) => p.status === "pending").length} sealed
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-display-md text-3xl text-white tracking-tight mb-1 group-hover:scale-[1.02] origin-left transition-transform duration-300">
                    {(pitches || []).filter((p) => p.status === "accepted" || p.status === "pending").length}
                  </div>
                  <div className="text-[10px] font-mono text-text-secondary uppercase tracking-widest">
                    Active Chatboxes
                  </div>
                </div>
              </GlassPanel>
            </div>
          </div>
        ) : activeTab === "portfolio" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase drop-shadow-[0_0_10px_rgba(247,198,78,0.5)]">
                Mission Control • Portfolio
              </span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-gradient-sapphire">
                Manage Assets
              </h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                Every property your company controls — edit, publish, or retire them from one table.
              </p>
            </div>

            {/* Bulk Actions */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  checked={selectedIds.size === scoped.length && scoped.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-white/20 bg-black/50 text-[#E8AE3C] focus:ring-[#E8AE3C] focus:ring-offset-black"
                />
                <span className="text-sm text-text-secondary">
                  {selectedIds.size} selected
                </span>
                {selectedIds.size > 0 && (
                  <button 
                    onClick={handleMassDelete}
                    disabled={isDeleting}
                    className="ml-4 text-xs text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete Selected"}
                  </button>
                )}
              </div>
            </div>

      {/* Property table */}
      <GlassPanel className="rounded-xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.1)] mt-4">
        <div className="px-4 py-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">
              Your Properties
            </span>
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
                      <td className="px-4 py-2.5 text-text-secondary">{strengthOf(l)}%</td>
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
        ) : activeTab === "projects" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
            <ProjectManagementPanel properties={scoped} />
          </div>
        ) : activeTab === "crm" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase drop-shadow-[0_0_10px_rgba(247,198,78,0.5)]">Mission Control • CRM</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Relationship Management</h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                The people around your portfolio — broker pitches, leads, and every conversation in play.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
              {/* Live pipeline — every deal chatbox, double-blind respected */}
              <GlassPanel className="lg:col-span-2 rounded-2xl border-white/5 overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-medium text-sm">Connection Pipeline</h3>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-text-secondary">
                    {(pitches || []).length} {(pitches || []).length === 1 ? "conversation" : "conversations"} on record
                  </span>
                </div>
                {(pitches || []).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center mb-6">
                      <Users className="text-gold-accent" size={28} />
                    </div>
                    <h3 className="text-xl text-white font-medium mb-2">No connections yet</h3>
                    <p className="text-text-secondary text-sm max-w-sm">
                      When buyers or brokers spend a Connect on your properties, every conversation lands here as a live pipeline entry.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
                    {(pitches || []).map((p) => {
                      const revealed = p.status === "accepted";
                      return (
                        <div key={p.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm text-white font-medium truncate">
                              {revealed ? p.brokerName : "Sealed connection"}
                              <span className="text-text-secondary text-[10px] font-normal uppercase tracking-widest ml-2">
                                {revealed ? (p.otherPartyRole || "connected party") : "identity held until both sides connect"}
                              </span>
                            </p>
                            <p className="text-xs text-text-secondary mt-1 truncate">{p.title}</p>
                            {!revealed && p.status === "pending" && (
                              <p className="text-[10px] font-mono uppercase tracking-widest text-gold-accent mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-gold-accent animate-pulse" />
                                Active temporary chatbox
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] font-mono uppercase tracking-widest ${p.status === "accepted" ? "text-success" : p.status === "rejected" ? "text-error" : "text-gold-accent"}`}>
                              {p.statusText}
                            </span>
                            <p className="text-[10px] text-text-secondary mt-1">{p.timeRemaining}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassPanel>

              {/* Editable schedule & tasks — the same crm_tasks engine brokers use */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                <GlassPanel className="flex-1 rounded-2xl border-white/5 p-6 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-medium text-sm">Schedule & Tasks</h4>
                    <Link href="/dashboard/calendar" className="text-[10px] font-mono uppercase tracking-widest text-gold-accent hover:underline">
                      Calendar →
                    </Link>
                  </div>
                  <p className="text-[11px] text-text-secondary mb-4 leading-relaxed">
                    Site visits, follow-ups, document deadlines — add anything with a due date and tick it off when done.
                  </p>
                  <TaskRail mockUserId={currentUser?.id} />
                </GlassPanel>
              </div>
            </div>
          </div>
        ) : activeTab === "team" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full">
            <TeamManagementPanel currentUser={currentUser} properties={scoped} pitches={pitches || []} />
          </div>
        ) : activeTab === "inventory" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase drop-shadow-[0_0_10px_rgba(247,198,78,0.5)]">Mission Control • Inventory</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Asset Inventory</h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                Unit-by-unit control of each estate — occupancy, delegation handshakes, and the floor grid.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: "Total Properties", val: scoped.length },
                { label: "Units Tracked", val: inventoryStats.total },
                { label: "Occupied", val: inventoryStats.occupied },
                { label: "Maintenance", val: inventoryStats.maintenance }
              ].map(stat => (
                <GlassPanel key={stat.label} className="p-6 rounded-2xl border-white/5">
                  <div className="text-3xl text-white font-display-md">{stat.val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">{stat.label}</div>
                </GlassPanel>
              ))}
            </div>
            <GlassPanel className="flex-1 rounded-2xl border-white/5 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-white font-medium text-sm">Enterprise Unit Delegation & Inventory</h3>
                <div className="flex gap-4 items-center">
                  <div className="text-[10px] tracking-widest text-gold-accent uppercase">Active Estate</div>
                  <select 
                    value={activeEstateId || ""}
                    onChange={(e) => setActiveEstateId(e.target.value)}
                    className="bg-black border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-gold-accent"
                  >
                    {scoped.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.title}</option>
                    ))}
                    {scoped.length === 0 && <option value="">No properties available</option>}
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto flex-1 p-6 relative flex flex-col gap-8">
                {activeEstateId ? (
                  <>
                    <DelegationRequests propertyId={activeEstateId} units={[]} />
                    <div className="bg-black/50 border border-white/5 rounded-xl p-4 overflow-hidden">
                      <InventoryGridManager 
                        propertyId={activeEstateId} 
                        isOperatorMode={false} 
                        units={enterpriseUnits}
                        onChange={setEnterpriseUnits}
                        onAutoSave={() => {}}
                      />
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-text-secondary italic">No property selected.</div>
                )}
              </div>
            </GlassPanel>
          </div>
        ) : activeTab === "finance" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-emerald-400 uppercase drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">Mission Control • Finance</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Financial Hub</h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                Your Connects balance and money movement — live once billing is switched on.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <GlassPanel className="col-span-1 rounded-2xl border-white/5 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                <h4 className="text-white font-medium text-sm mb-6 relative z-10">Connects Balance</h4>
                <div className="text-5xl text-emerald-400 font-display-md tracking-tighter mt-auto mb-2 relative z-10 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{connects ?? 0}</div>
                <div className="text-text-secondary text-xs font-mono font-medium relative z-10">Available for operations</div>
              </GlassPanel>
              <GlassPanel className="col-span-1 rounded-2xl border-white/5 p-6 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-accent/10 to-transparent" />
                <h4 className="text-white font-medium text-sm mb-6 relative z-10">Units Ready to Earn</h4>
                <div className="text-4xl text-gold-accent font-display-md tracking-tighter mt-auto mb-2 relative z-10">{inventoryStats.vacant}</div>
                <div className="text-text-secondary text-xs font-mono font-medium relative z-10">Vacant units available for lease</div>
              </GlassPanel>
              <GlassPanel className="col-span-2 rounded-2xl border-white/5 p-6 flex flex-col">
                <h4 className="text-white font-medium text-sm mb-4">Transaction Ledger</h4>
                <div className="flex-1 flex flex-col items-center justify-center text-center py-8 gap-3">
                  <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center">
                    <BadgeDollarSign className="text-text-secondary" size={20} />
                  </div>
                  <p className="text-text-secondary text-sm">No transactions recorded yet.</p>
                  <p className="text-text-secondary/60 text-xs max-w-xs leading-relaxed">
                    Connects top-ups and subscription charges will appear here once billing goes live.
                  </p>
                </div>
              </GlassPanel>
            </div>
          </div>
        ) : activeTab === "analytics" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6 overflow-y-auto pb-6 custom-scrollbar">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-blue-400 uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">Mission Control • Analytics</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Market Intelligence</h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                How the market moves around your assets. Charts below are sample previews until live data connects.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Historical Location Graph */}
              <GlassPanel className="col-span-1 lg:col-span-2 rounded-2xl border-white/5 p-6 h-80 flex flex-col relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-black to-transparent opacity-50" />
                <div className="relative z-10 flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-medium text-sm flex items-center gap-2">
                      Historical Property Yield
                      <span className="text-[9px] font-mono uppercase tracking-widest text-gold-accent border border-gold-accent/30 bg-gold-accent/10 rounded px-1.5 py-0.5">Sample preview</span>
                    </h3>
                    <p className="text-[10px] text-text-secondary font-mono tracking-widest uppercase mt-1">Makati CBD vs BGC · illustrative — live data connects at launch</p>
                  </div>
                  <select className="bg-black/50 border border-white/10 text-xs text-white rounded px-2 py-1 outline-none focus:border-blue-400 transition-colors">
                    <option>Yield (%)</option>
                    <option>Price / sqm</option>
                  </select>
                </div>
                
                {/* SVG Line Chart Mockup */}
                <div className="relative z-10 flex-1 w-full h-full border-b border-l border-white/10 mt-2 pb-6 pl-2">
                   <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible preserve-3d" preserveAspectRatio="none">
                     {/* Grid lines */}
                     <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                     <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                     <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                     
                     {/* BGC Line */}
                     <polyline points="0,35 20,30 40,22 60,15 80,12 100,8" fill="none" stroke="#e8ae3c" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(232,174,60,0.5)]" />
                     <circle cx="100" cy="8" r="1.5" fill="#e8ae3c" />
                     
                     {/* Makati Line */}
                     <polyline points="0,32 20,28 40,26 60,20 80,18 100,16" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                     <circle cx="100" cy="16" r="1.5" fill="#3b82f6" />
                   </svg>
                   <div className="absolute -bottom-1 left-2 right-0 flex justify-between text-[8px] text-text-secondary font-mono">
                     <span>2022</span>
                     <span>2023</span>
                     <span>2024</span>
                     <span>2025</span>
                     <span>2026</span>
                   </div>
                   <div className="absolute top-2 right-4 flex flex-col gap-2 bg-black/40 backdrop-blur border border-white/5 p-2 rounded-lg">
                      <div className="flex items-center gap-2 text-[10px] text-white"><span className="w-2 h-2 rounded-full bg-gold-accent" /> BGC (+14%)</div>
                      <div className="flex items-center gap-2 text-[10px] text-white"><span className="w-2 h-2 rounded-full bg-blue-500" /> Makati (+6%)</div>
                   </div>
                </div>
              </GlassPanel>
              
              {/* Space Demand Trends */}
              <GlassPanel className="col-span-1 rounded-2xl border-white/5 p-6 flex flex-col">
                <h3 className="text-white font-medium text-sm mb-1 flex items-center gap-2">
                  Space Demand Trends
                  <span className="text-[9px] font-mono uppercase tracking-widest text-gold-accent border border-gold-accent/30 bg-gold-accent/10 rounded px-1.5 py-0.5">Sample preview</span>
                </h3>
                <p className="text-[10px] text-text-secondary font-mono tracking-widest uppercase mb-6">Illustrative — live data connects at launch</p>
                
                <div className="space-y-4 flex-1">
                  {[
                    { label: "Co-working Spaces", trend: "+14.5%", up: true, bar: "85%" },
                    { label: "Micro-Studios", trend: "+8.2%", up: true, bar: "65%" },
                    { label: "Standard Retail", trend: "-3.1%", up: false, bar: "30%" },
                    { label: "Ghost Kitchens", trend: "+11.4%", up: true, bar: "70%" },
                  ].map((item, idx) => (
                    <div key={idx} className="group">
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-xs text-white">{item.label}</span>
                        <span className={`text-[10px] font-mono ${item.up ? 'text-emerald-400' : 'text-red-400'}`}>{item.trend}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${item.up ? 'bg-emerald-500/50' : 'bg-red-500/50'}`} style={{ width: item.bar }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            </div>

            {/* Intel Synergy Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
              <GlassPanel className="rounded-2xl border-emerald-500/10 p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full" />
                <div className="flex items-start gap-4 relative z-10">
                   <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                     <Activity size={20} className="text-emerald-400" />
                   </div>
                   <div>
                     <h3 className="text-white font-medium text-sm">Intel Synergy</h3>
                     {inventoryStats.saved_intel_count > 0 ? (
                       <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                         {inventoryStats.saved_intel_count} intel {inventoryStats.saved_intel_count === 1 ? "report is" : "reports are"} saved against your properties. Cross-referencing them against market movement arrives with live analytics.
                       </p>
                     ) : (
                       <p className="text-xs text-text-secondary mt-2 leading-relaxed">
                         No intel saved yet. Save market intel from your Master Property Pages and this panel will surface patterns across your scope.
                       </p>
                     )}
                   </div>
                </div>
              </GlassPanel>

              <GlassPanel className="rounded-2xl border-white/5 p-6 relative overflow-hidden flex items-center justify-between group cursor-pointer hover:border-gold-accent/30 transition-all">
                 <div>
                   <div className="text-3xl font-display-md text-white group-hover:scale-105 origin-left transition-transform">{scopedPitches.length}</div>
                   <div className="text-[10px] text-text-secondary font-mono uppercase tracking-widest mt-1">Active Pipeline</div>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-gold-accent/20 flex items-center justify-center bg-gold-accent/5">
                   <ArrowRight size={20} className="text-gold-accent group-hover:translate-x-1 transition-transform" />
                 </div>
              </GlassPanel>
            </div>
          </div>
        ) : activeTab === "ai" ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-blue-400 uppercase drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">Mission Control • AI</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Intelligence Center</h1>
              <p className="text-sm text-text-secondary mt-2 max-w-xl">
                Where AI works for your portfolio — drafting dossiers now, portfolio Q&amp;A next.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
              <GlassPanel className="col-span-1 lg:col-span-2 rounded-2xl border-blue-500/20 p-8 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-500/20 transition-all duration-700" />
                <div className="relative z-10 flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center animate-pulse">
                    <Bot className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl text-white font-medium">ScoutIt Concierge</h3>
                    <p className="text-xs text-text-secondary font-mono mt-1">Status: Coming online</p>
                  </div>
                </div>
                <div className="relative z-10 bg-black/40 rounded-xl border border-white/5 p-4 flex-1 flex flex-col">
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    <div className="flex gap-3">
                      <Bot className="text-blue-400 shrink-0 mt-1" size={16} />
                      <div className="bg-surface-variant/50 rounded-lg p-3 text-sm text-text-secondary border border-white/5">
                        {scoped.length > 0
                          ? `I can see ${scoped.length} ${scoped.length === 1 ? "listing" : "listings"} in your scope${weakListings.length > 0 ? `, and ${weakListings.length} ${weakListings.length === 1 ? "dossier" : "dossiers"} could use more detail` : ""}. Conversational portfolio analysis unlocks when the Concierge goes live.`
                          : "Once your portfolio has assets, I'll analyze dossiers, spot gaps, and answer questions about your scope — conversational analysis unlocks when the Concierge goes live."}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="text" placeholder="Portfolio Q&A unlocks when the Concierge goes live..." className="w-full bg-surface border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors" disabled />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-text-secondary hover:text-white" disabled>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </GlassPanel>

              <div className="col-span-1 flex flex-col gap-6">
                <GlassPanel className="rounded-2xl border-white/5 p-6 hover:border-blue-500/20 transition-colors">
                  <h4 className="text-white font-medium text-sm mb-4">Automated Drafting Queue</h4>
                  {scoped.filter((l) => l.pipelineStatus === "ai_drafting").length > 0 ? (
                    <div className="space-y-4">
                      {scoped.filter((l) => l.pipelineStatus === "ai_drafting").slice(0, 4).map((l) => (
                        <div key={l.id}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-white truncate pr-2">{l.title}</span>
                            <span className="text-blue-400 font-mono shrink-0">Drafting</span>
                          </div>
                          <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full w-1/2 animate-pulse" />
                          </div>
                          <div className="text-[10px] text-text-secondary mt-1">Council AI is composing this dossier</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary leading-relaxed py-4">
                      Queue is empty. When a listing enters AI drafting, its progress shows here.
                    </p>
                  )}
                </GlassPanel>

                <GlassPanel className="flex-1 rounded-2xl border-white/5 p-6 flex flex-col justify-between group hover:border-gold-accent/20 transition-colors">
                  <div>
                    <h4 className="text-white font-medium text-sm mb-2">Market Reports</h4>
                    <p className="text-xs text-text-secondary">AI comp analysis from real closings in your zones — switches on once enough market data accumulates.</p>
                  </div>
                  <div className="text-text-secondary text-[10px] font-mono uppercase tracking-widest">
                    Coming online
                  </div>
                </GlassPanel>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both h-full flex flex-col gap-6">
            <div>
              <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Mission Control • Settings</span>
              <h1 className="font-display-md text-3xl md:text-4xl mt-1 text-white">Administration</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div className="col-span-1 flex flex-col gap-2">
                {['Organization Profile', 'Security & Access', 'Integrations & API', 'Billing & Subscriptions', 'Audit Logs'].map((item, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setAdminActiveTab(item)}
                    className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${adminActiveTab === item ? 'bg-white/10 text-white font-medium' : 'text-text-secondary hover:bg-white/5 hover:text-white'}`}>
                    {item}
                  </button>
                ))}
              </div>

              <div className="col-span-2 flex flex-col gap-6">
                {adminActiveTab === 'Organization Profile' && (
                  <GlassPanel className="rounded-2xl border-white/5 p-8 animate-in fade-in">
                    <h3 className="text-lg text-white font-medium mb-6 border-b border-white/10 pb-4">Organization Profile</h3>
                    
                    <div className="space-y-6 max-w-lg">
                      <div>
                        <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Enterprise Name</label>
                        <input 
                          type="text" 
                          value={orgName} 
                          onChange={e => setOrgName(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-accent transition-colors" 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-mono text-text-secondary uppercase tracking-widest mb-2">Primary Domain</label>
                        <input 
                          type="text" 
                          value={orgDomain} 
                          onChange={e => setOrgDomain(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-gold-accent transition-colors" 
                        />
                      </div>

                      <div className="pt-4 border-t border-white/10 flex justify-end">
                        <button 
                          onClick={() => addToast("Organization profile updated", "✅")}
                          className="px-6 py-2 bg-gold-accent text-black rounded-lg text-sm font-medium hover:bg-gold-accent-bright transition-colors">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </GlassPanel>
                )}

                {(adminActiveTab === 'Security & Access' || adminActiveTab === 'Organization Profile') && (
                  <div className="grid grid-cols-2 gap-6 animate-in fade-in">
                    <GlassPanel className="rounded-2xl border-white/5 p-6 hover:border-emerald-500/20 transition-colors">
                      <h4 className="text-white font-medium text-sm mb-2">Security</h4>
                      <p className="text-xs text-text-secondary mb-4">Require Two-Factor Authentication for all team members.</p>
                      <div 
                        onClick={() => {
                          setIs2FAEnforced(!is2FAEnforced);
                          addToast(`2FA Enforcement ${!is2FAEnforced ? 'Enabled' : 'Disabled'}`, "🛡️");
                        }}
                        className="flex items-center gap-2 cursor-pointer w-fit"
                      >
                        <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${is2FAEnforced ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
                          <div className={`absolute top-0 bottom-0 w-4 rounded-full shadow-lg transition-all duration-300 ${is2FAEnforced ? 'right-0 bg-emerald-500 scale-110 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'left-0 bg-white/40'}`} />
                        </div>
                        <span className={`text-xs ${is2FAEnforced ? 'text-emerald-400' : 'text-text-secondary'}`}>
                          {is2FAEnforced ? 'Enforced' : 'Optional'}
                        </span>
                      </div>
                    </GlassPanel>

                    <GlassPanel className="rounded-2xl border-white/5 p-6 hover:border-white/20 transition-colors cursor-pointer">
                      <h4 className="text-white font-medium text-sm mb-2 flex justify-between items-center">
                        API Keys
                        <ArrowRight size={14} className="text-text-secondary" />
                      </h4>
                      <p className="text-xs text-text-secondary mb-4">Manage webhooks and external API access tokens.</p>
                      <div className="text-xs font-mono text-text-secondary bg-black/50 px-2 py-1 rounded inline-block">No tokens issued yet</div>
                    </GlassPanel>
                  </div>
                )}

                {adminActiveTab !== 'Organization Profile' && adminActiveTab !== 'Security & Access' && (
                  <GlassPanel className="rounded-2xl border-white/5 p-8 flex flex-col items-center justify-center text-center animate-in fade-in min-h-[300px]">
                    <Settings size={32} className="text-white/20 mb-4" />
                    <h3 className="text-lg text-white font-medium mb-2">{adminActiveTab}</h3>
                    <p className="text-sm text-text-secondary max-w-sm">This settings module is currently locked in the Developer Preview Sandbox.</p>
                  </GlassPanel>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}
