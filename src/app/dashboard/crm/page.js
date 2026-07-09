"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardProvider, useDashboard } from "../../../context/DashboardContext";
import AtmosphereBackground from "../../../components/ui/AtmosphereBackground";
import KanbanBoard from "../../../components/dashboard/crm/KanbanBoard";
import AppointmentsSheet from "../../../components/dashboard/crm/AppointmentsSheet";
import DealFileSlideOver from "../../../components/dashboard/crm/DealFileSlideOver";
import NewDealModal from "../../../components/dashboard/crm/NewDealModal";
import TaskRail from "../../../components/dashboard/crm/TaskRail";
import { crmFetch } from "../../../lib/crmClient";
import { Briefcase, Calendar, ListChecks, Mail, Zap, ChevronDown, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

function CRMPageInner() {
  // The context exposes currentUser (not `user`/`mode`) — the previous
  // version destructured fields that don't exist and hardcoded
  // mockOwnerId=master-dev into every request, so every visitor was reading
  // and writing the master-dev account's real deals. All requests now carry
  // the real session token; the mock id only applies without one (dev toolbox).
  const { currentUser, isLoading: userLoading } = useDashboard();
  const [deals, setDeals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pipeline"); // pipeline | appointments | tasks
  const [viewingAs, setViewingAs] = useState("owner");
  const [showViewingMenu, setShowViewingMenu] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showToast, setShowToast] = useState("");
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  // Default the lens to the mode the dashboard was last in.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scoutit_user") || "{}");
      if (saved.primaryMode === "broker") setViewingAs("broker");
    } catch (e) { /* default stays owner */ }
  }, []);

  const mockUserId = currentUser?.id;

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;
    // allSettled so one failing feed doesn't blank the other (e.g. an
    // appointments error must not hide the deal pipeline).
    const [dealsRes, apptsRes] = await Promise.allSettled([
      crmFetch("/api/deals", { mockUserId: currentUser.id }),
      crmFetch("/api/viewing-appointments", { mockUserId: currentUser.id }),
    ]);
    if (dealsRes.status === "fulfilled") setDeals(dealsRes.value.deals || []);
    if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.appointments || []);
    if (dealsRes.status === "rejected" || apptsRes.status === "rejected") {
      console.error("CRM fetch failed", dealsRes.reason || apptsRes.reason);
      setShowToast("Some of your pipeline data couldn't load — check your connection.");
      setTimeout(() => setShowToast(""), 4000);
    }
    setLoading(false);
  }, [currentUser?.id]);

  useEffect(() => {
    if (userLoading) return;
    if (!currentUser?.id) { setLoading(false); return; }
    fetchData();
  }, [userLoading, currentUser?.id, fetchData]);

  const handleStatusChange = async (dealId, newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await crmFetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        mockUserId,
        body: { status: newStatus },
      });
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: newStatus } : d)));
    } catch (e) {
      console.error(e);
      setShowToast(e.message || "Couldn't update the deal.");
      setTimeout(() => setShowToast(""), 4000);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDealUpdate = (dealId, updates) => {
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, ...updates } : d)));
  };

  const handleAppointmentUpdate = async (id, status) => {
    try {
      await crmFetch(`/api/viewing-appointments/${id}`, {
        method: "PATCH",
        mockUserId,
        body: { status },
      });
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (e) {
      console.error(e);
      setShowToast(e.message || "Couldn't update the appointment.");
      setTimeout(() => setShowToast(""), 4000);
    }
  };

  const triggerLockedToast = (feature, tier) => {
    setShowToast(`Unlock ${feature} at ${tier} tier.`);
    setTimeout(() => setShowToast(""), 3000);
  };

  if (userLoading || loading) {
    return (
      <div className="flex-1 flex justify-center items-center text-text-secondary h-screen">
        <AtmosphereBackground variant="dashboard" />
        <span className="font-working-title animate-pulse relative z-10">Loading Pipeline...</span>
      </div>
    );
  }

  if (!currentUser?.id) {
    return (
      <div className="flex-1 flex flex-col gap-4 justify-center items-center text-center h-screen px-6 relative">
        <AtmosphereBackground variant="dashboard" />
        <h1 className="font-headline-editorial text-3xl text-on-surface relative z-10">Master CRM</h1>
        <p className="text-text-secondary text-sm max-w-sm relative z-10">Sign in to see your pipeline, appointments, and tasks.</p>
        <Link href="/dashboard" className="relative z-10 border border-gold-accent text-gold-accent font-working-title px-6 py-3 rounded hover:bg-gold-accent hover:text-background transition-colors text-sm font-bold">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  // Derived KPIs — computed from the user's real deals only.
  const activeDealsList = deals.filter((d) => d.status === "connected" || d.status === "pending" || d.status === "accepted");
  const activeDeals = activeDealsList.length;
  const closedDeals = deals.filter((d) => d.status === "closed").length;
  const declinedDeals = deals.filter((d) => d.status === "declined").length;
  const totalDecided = closedDeals + declinedDeals;
  const winRate = totalDecided > 0 ? Math.round((closedDeals / totalDecided) * 100) : null;
  const upcomingViewings = appointments.filter((a) => a.status === "pending" || a.status === "confirmed").length;
  // Honest Blank Rule: pipeline value is the sum of real listed prices on
  // active deals' properties — never an invented per-deal figure. If nothing
  // in the pipeline carries a price yet, say so.
  const pricedDeals = activeDealsList.filter((d) => d.propertyPrice != null && Number(d.propertyPrice) > 0);
  const pipelineValue = pricedDeals.reduce((sum, d) => sum + Number(d.propertyPrice), 0);

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col p-4 md:p-6">
      <AtmosphereBackground variant={viewingAs === "broker" ? "broker" : "dashboard"} />
      {/* Additional Atmosphere Layers for CRM per Handoff */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{
        background: "radial-gradient(circle at 80% 20%, rgba(232, 174, 60, 0.05) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(232, 174, 60, 0.02) 0%, transparent 60%)"
      }}></div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8 relative z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 border border-surface-variant rounded-full text-text-secondary hover:text-on-surface hover:border-gold-accent/50 transition-colors shrink-0"
            title="Go back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-headline-editorial text-3xl md:text-4xl text-on-surface flex items-center gap-3">
              Master CRM
            </h1>
            <p className="text-text-secondary font-working-title mt-1 md:mt-2 text-sm md:text-base">Manage relationships, pipeline, and appointments.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative">
            <button
              onClick={() => setShowViewingMenu(!showViewingMenu)}
              className="flex items-center gap-2 bg-surface-alt border border-surface-variant rounded-full px-4 py-2 text-sm font-working-title text-on-surface hover:border-gold-accent/50 transition-colors"
            >
              <span className="text-text-muted">Viewing as:</span>
              <span className="text-gold-accent capitalize">{viewingAs}</span>
              <ChevronDown size={14} className="text-text-muted ml-1" />
            </button>
            {showViewingMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-variant rounded-lg shadow-2xl py-2 z-50">
                {["owner", "broker"].map(role => (
                  <button
                    key={role}
                    onClick={() => { setViewingAs(role); setShowViewingMenu(false); }}
                    className="w-full text-left px-4 py-2 text-sm font-working-title flex items-center justify-between hover:bg-surface-alt transition-colors"
                  >
                    <span className="capitalize text-on-surface">{role}</span>
                    {viewingAs === role && <Check size={14} className="text-gold-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className="bg-gold-accent text-background font-bold font-working-title px-4 md:px-6 py-2 rounded shadow-[0_0_15px_rgba(247,198,78,0.4)] hover:-translate-y-1 transition-transform"
          >
            + New Deal
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 relative z-10">
        <div className="bg-gradient-to-br from-[#1a1917] to-[#111110] border border-white/10 rounded-lg p-4 md:p-5">
          <div className="text-xs text-text-secondary uppercase tracking-widest font-label-caps mb-1">Active Deals</div>
          <div className="text-2xl font-working-title text-on-surface">{activeDeals}</div>
        </div>
        <div className="bg-gradient-to-br from-[#211a14] to-[#131110] border border-gold-accent/30 shadow-[0_10px_30px_rgba(0,0,0,0.4),0_0_40px_rgba(232,174,60,0.1)] rounded-lg p-4 md:p-5 relative overflow-hidden">
          <div className="text-xs text-gold-accent uppercase tracking-widest font-label-caps mb-1">Pipeline Value</div>
          {pricedDeals.length > 0 ? (
            <>
              <div className="text-2xl font-working-title text-on-surface text-glow">₱{pipelineValue.toLocaleString()}</div>
              <div className="text-[10px] text-text-muted mt-1">Listed prices on {pricedDeals.length} of {activeDeals} active deals</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-working-title text-text-secondary">—</div>
              <div className="text-[10px] text-text-muted mt-1">No priced listings in your active pipeline yet</div>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-[#1a1917] to-[#111110] border border-white/10 rounded-lg p-4 md:p-5">
          <div className="text-xs text-text-secondary uppercase tracking-widest font-label-caps mb-1">Win Rate</div>
          {winRate !== null ? (
            <div className="text-2xl font-working-title text-on-surface">{winRate}%</div>
          ) : (
            <>
              <div className="text-2xl font-working-title text-text-secondary">—</div>
              <div className="text-[10px] text-text-muted mt-1">No closed deals yet</div>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-[#1a1917] to-[#111110] border border-white/10 rounded-lg p-4 md:p-5">
          <div className="text-xs text-text-secondary uppercase tracking-widest font-label-caps mb-1">Upcoming Viewings</div>
          <div className="text-2xl font-working-title text-on-surface">{upcomingViewings}</div>
        </div>
      </div>

      {/* Tabs and Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-variant mb-6 relative z-10 overflow-x-auto">
        <div className="flex gap-4 md:gap-6">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`pb-3 font-working-title text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "pipeline" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Briefcase size={16} /> Pipeline
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 font-working-title text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "appointments" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Calendar size={16} /> Appointments
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 font-working-title text-sm flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "tasks" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <ListChecks size={16} /> Tasks
          </button>
        </div>

        <div className="hidden md:flex gap-3 pb-3">
          <button
            onClick={() => triggerLockedToast("Mass Email", "Cluster")}
            className="border border-dashed border-text-muted text-text-muted hover:text-on-surface hover:border-surface-variant rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-working-title transition-colors"
          >
            <Mail size={12} /> Mass Email <span className="text-[10px] ml-1">🔒</span>
          </button>
          <button
            onClick={() => triggerLockedToast("Automations", "Universe")}
            className="border border-dashed border-text-muted text-text-muted hover:text-on-surface hover:border-surface-variant rounded-full px-3 py-1 flex items-center gap-1.5 text-xs font-working-title transition-colors"
          >
            <Zap size={12} /> Automations <span className="text-[10px] ml-1">🔒</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10">
        {isUpdatingStatus && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <span className="bg-surface px-6 py-3 rounded-full font-working-title text-sm border border-gold-accent/50 text-gold-accent shadow-xl animate-pulse">
              Updating Status...
            </span>
          </div>
        )}

        {activeTab === "pipeline" && (
          <KanbanBoard
            deals={deals}
            viewingAs={viewingAs}
            onStatusChange={handleStatusChange}
            onDealClick={setSelectedDeal}
          />
        )}
        {activeTab === "appointments" && (
          <AppointmentsSheet
            appointments={appointments}
            onStatusUpdate={handleAppointmentUpdate}
          />
        )}
        {activeTab === "tasks" && (
          <div className="max-w-2xl">
            <TaskRail mockUserId={mockUserId} />
          </div>
        )}
      </div>

      <DealFileSlideOver
        isOpen={!!selectedDeal}
        deal={selectedDeal}
        onClose={() => setSelectedDeal(null)}
        onDealUpdate={handleDealUpdate}
        mockUserId={mockUserId}
      />

      <NewDealModal
        isOpen={isNewDealModalOpen}
        onClose={() => setIsNewDealModalOpen(false)}
        onDealCreated={(newDeal) => setDeals((prev) => [...prev, newDeal])}
        mockUserId={mockUserId}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-surface-alt border border-gold-accent/30 text-gold-accent px-6 py-3 rounded shadow-2xl z-50 animate-[slideUp_0.2s_ease-out]">
          <p className="font-working-title text-sm flex items-center gap-2">
            <span className="text-xl">🔒</span> {showToast}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  return (
    <DashboardProvider>
      <CRMPageInner />
    </DashboardProvider>
  );
}
