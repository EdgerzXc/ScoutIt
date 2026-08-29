"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardProvider, useDashboard } from "../../../context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import AtmosphereBackground from "../../../components/ui/AtmosphereBackground";
import KanbanBoard from "../../../components/dashboard/crm/KanbanBoard";
import AppointmentsSheet from "../../../components/dashboard/crm/AppointmentsSheet";
import DealFileSlideOver from "../../../components/dashboard/crm/DealFileSlideOver";
import NewDealModal from "../../../components/dashboard/crm/NewDealModal";
import TaskRail from "../../../components/dashboard/crm/TaskRail";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";
import { crmFetch } from "../../../lib/crmClient";
import { loadDeals } from "../../../lib/deals/dealsClient";
import { Briefcase, Calendar, ListChecks, Mail, Zap, ChevronDown, Check, ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { sanitizeError } from "@/lib/sanitizeError";

function CRMPageInner() {
  // The context exposes currentUser (not `user`/`mode`) — the previous
  // version destructured fields that don't exist and hardcoded
  // mockOwnerId=master-dev into every request, so every visitor was reading
  // and writing the master-dev account's real deals. All requests now carry
  // the real session token; the mock id only applies without one (dev toolbox).
  // identityResolved, NOT the general isLoading flag. isLoading also covers
  // inventory, the Airtable CMS proxy, deals and saved-intel hydration, which
  // DashboardContext fetches in series and which this page never renders.
  // Gating on it made the CRM wait for all of them: measured 2026-08-29 on an
  // empty local database, 2,217ms to first paint against 546ms for the Inbox
  // and 500ms for the dashboard home, with /api/cms alone costing 2.5s cold in
  // production. The CRM needs one thing before it can fetch — who you are.
  const { currentUser, identityResolved, addToast } = useDashboard();
  const userLoading = !identityResolved;
  const [deals, setDeals] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pipeline"); // pipeline | appointments | tasks
  const [viewingAs, setViewingAs] = useState("owner");
  const [showViewingMenu, setShowViewingMenu] = useState(false);
  const lensMenuRef = useRef(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // The toast carries a tone. Errors used to render with the same padlock as
  // the tier-lock upsells, so "Couldn't update the deal" read as a paywall.
  const [showToast, setShowToast] = useState("");
  const [toastTone, setToastTone] = useState("locked"); // "locked" | "error"
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);

  // The lens menu had no way out but re-clicking its own trigger: clicking the
  // page, or pressing Escape, left it hovering over the pipeline.
  useEffect(() => {
    if (!showViewingMenu) return;
    const onPointerDown = (e) => {
      if (lensMenuRef.current && !lensMenuRef.current.contains(e.target)) setShowViewingMenu(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowViewingMenu(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showViewingMenu]);

  // Default the lens to the mode the dashboard was last in.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scoutit_user") || "{}");
      if (saved.primaryMode === "broker") setViewingAs("broker");
    } catch (e) { /* default stays owner */ }
  }, []);

  const mockUserId = currentUser?.id;

  const flashToast = useCallback((message, tone = "error") => {
    setToastTone(tone);
    setShowToast(message);
    setTimeout(() => setShowToast(""), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;
    // allSettled so one failing feed doesn't blank the other (e.g. an
    // appointments error must not hide the deal pipeline).
    const [dealsRes, apptsRes] = await Promise.allSettled([
      loadDeals({ mockUserId: currentUser.id }),
      crmFetch("/api/viewing-appointments", { mockUserId: currentUser.id }),
    ]);
    if (dealsRes.status === "fulfilled") setDeals(dealsRes.value);
    if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.appointments || []);
    if (dealsRes.status === "rejected" || apptsRes.status === "rejected") {
      console.error("CRM fetch failed", dealsRes.reason || apptsRes.reason);
      flashToast("Some of your pipeline data couldn't load — check your connection.");
    }
    setLoading(false);
  }, [currentUser, flashToast]);

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
      flashToast(sanitizeError(e, "Couldn't update the deal."));
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
      flashToast(sanitizeError(e, "Couldn't update the appointment."));
    }
  };

  const triggerLockedToast = (feature, tier) => {
    flashToast(`Unlock ${feature} at ${tier} tier.`, "locked");
  };

  // Only an unknown identity justifies covering the whole page. Waiting for
  // the pipeline itself no longer hides the header, the workspace nav and the
  // tabs — those are ready immediately, and blanking them made the CRM feel
  // slow even when the data arrived at the same time as everywhere else.
  if (userLoading) {
    return (
      <div role="main" className="flex-1 flex justify-center items-center text-text-secondary h-screen">
        <AtmosphereBackground variant="dashboard" />
        <span className="relative z-10 animate-pulse font-body text-base">Loading pipeline...</span>
      </div>
    );
  }

  if (!currentUser?.id) {
    return (
      <div role="main" className="flex-1 flex flex-col gap-4 justify-center items-center text-center h-screen px-6 relative">
        <AtmosphereBackground variant="dashboard" />
        <h1 className="font-headline-editorial text-3xl text-on-surface relative z-10">Master CRM</h1>
        <p className="relative z-10 max-w-sm font-body text-base leading-relaxed text-text-secondary">Sign in to see your pipeline, appointments, and tasks.</p>
        <Link href="/dashboard" className="relative z-10 min-h-11 rounded border border-gold-accent px-6 py-3 font-label-caps text-label-caps uppercase tracking-widest text-gold-accent transition-colors duration-200 ease-out hover:bg-gold-accent hover:text-background">
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
    <div role="main" className="relative flex min-h-[calc(100dvh-80px)] flex-col p-4 font-body md:p-6">
      <AtmosphereBackground variant={viewingAs === "broker" ? "broker" : "dashboard"} />
      {/* Additional Atmosphere Layers for CRM per Handoff */}
      <div className="fixed inset-0 pointer-events-none z-[-1]" style={{
        background: "radial-gradient(circle at 80% 20%, rgba(var(--accent-rgb), 0.05) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(var(--accent-rgb), 0.02) 0%, transparent 60%)"
      }}></div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-8 relative z-30">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 border border-surface-variant rounded-full text-text-secondary hover:text-on-surface hover:border-gold-accent/50 transition shrink-0"
            title="Go back to Dashboard"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="font-label-caps text-label-caps uppercase text-gold-accent">
              ScoutIt CRM
            </span>
            <h1 className="flex items-center gap-3 font-headline-editorial text-3xl font-semibold leading-tight tracking-tight text-on-surface md:text-4xl">
              Deal Intelligence
            </h1>
            <p className="mt-2 max-w-2xl font-body text-base leading-relaxed text-text-secondary">Keep relationships, viewings, and next actions in one place.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          {/* Availability now lives inside the Appointments tab (unified
              schedule), so the separate top-nav shortcut was removed. */}
          <div className="relative" ref={lensMenuRef}>
            <button
              onClick={() => setShowViewingMenu(!showViewingMenu)}
              aria-haspopup="menu"
              aria-expanded={showViewingMenu}
              aria-label={`Change pipeline lens. Current lens: ${viewingAs}`}
              className="flex min-h-11 items-center gap-2 rounded-full border border-surface-variant bg-surface-alt px-4 py-2 font-label-caps text-label-caps uppercase text-on-surface transition-colors duration-200 ease-out hover:border-gold-accent/50"
            >
              <span className="text-text-muted">Pipeline lens</span>
              <span className="text-gold-accent">{viewingAs}</span>
              <ChevronDown size={14} className="text-text-muted ml-1" />
            </button>
            {showViewingMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-variant rounded-lg shadow-2xl py-2 z-50">
                {["owner", "broker"].map(role => (
                  <button
                    key={role}
                    onClick={() => { setViewingAs(role); setShowViewingMenu(false); }}
                    className="flex min-h-11 w-full items-center justify-between px-4 py-2 text-left font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out hover:bg-surface-alt"
                  >
                    <span className="text-on-surface">{role}</span>
                    {viewingAs === role && <Check size={14} className="text-gold-accent" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsNewDealModalOpen(true)}
            className="min-h-11 rounded bg-gold-accent px-4 py-2 font-label-caps text-label-caps uppercase text-background shadow-[0_0_18px_rgba(var(--accent-bright-rgb),0.25)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-gold-bright active:scale-[0.97] md:px-6"
          >
            + New deal
          </button>
        </div>
      </div>

      <WorkspaceCommandBar active="crm" className="relative z-20 mb-6 w-full md:max-w-xl" />

      {/* KPI Strip.
          While the pipeline is still loading these show a placeholder rather
          than a number. A "0 Active Deals" that is really "we do not know yet"
          is the same lie as an invented figure. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8 relative z-10">
        <div className="bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-4 md:p-5">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary">Active Deals</div>
          <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums">{loading ? <span className="text-text-muted" aria-label="Loading">—</span> : activeDeals}</div>
        </div>
        <div className="card-atmosphere-gold rounded-lg p-4 md:p-5 relative overflow-hidden">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-gold-accent">Pipeline Value</div>
          {loading ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-text-muted" aria-label="Loading">—</div>
          ) : pricedDeals.length > 0 ? (
            <>
              <div className="font-body text-2xl font-semibold tracking-tight text-on-surface text-glow tabular-nums">₱{pipelineValue.toLocaleString()}</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">Listed prices on {pricedDeals.length} of {activeDeals} active deals</div>
            </>
          ) : (
            <>
              <div className="font-body text-2xl font-semibold tracking-tight text-text-secondary">—</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">No priced listings in your active pipeline yet</div>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-4 md:p-5">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary">Win Rate</div>
          {loading ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-text-muted" aria-label="Loading">—</div>
          ) : winRate !== null ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums">{winRate}%</div>
          ) : (
            <>
              <div className="font-body text-2xl font-semibold tracking-tight text-text-secondary">—</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">No closed deals yet</div>
            </>
          )}
        </div>
        <div className="bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-4 md:p-5">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary">Upcoming Viewings</div>
          <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums">{loading ? <span className="text-text-muted" aria-label="Loading">—</span> : upcomingViewings}</div>
        </div>
      </div>

      {/* Tabs and Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-variant mb-6 relative z-10 overflow-x-auto">
        <div className="flex gap-4 md:gap-6">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "pipeline" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Briefcase size={16} /> Pipeline
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "appointments" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Calendar size={16} /> Appointments
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "tasks" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <ListChecks size={16} /> Tasks
          </button>
        </div>

        <div className="hidden md:flex gap-3 pb-3">
          <button
            onClick={() => triggerLockedToast("Mass Email", "Cluster")}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-text-muted px-3 py-2 font-label-caps text-label-caps uppercase text-text-muted transition-colors duration-200 ease-out hover:border-surface-variant hover:text-on-surface"
          >
            <Mail size={12} aria-hidden="true" /> Mass Email <LockKeyhole size={12} className="ml-1" aria-hidden="true" />
          </button>
          <button
            onClick={() => triggerLockedToast("Automations", "Universe")}
            className="flex min-h-11 items-center gap-1.5 rounded-full border border-dashed border-text-muted px-3 py-2 font-label-caps text-label-caps uppercase text-text-muted transition-colors duration-200 ease-out hover:border-surface-variant hover:text-on-surface"
          >
            <Zap size={12} aria-hidden="true" /> Automations <LockKeyhole size={12} className="ml-1" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative z-10">
        {isUpdatingStatus && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <span className="animate-pulse rounded-full border border-gold-accent/50 bg-surface px-6 py-3 font-body text-base text-gold-accent shadow-xl">
              Updating status...
            </span>
          </div>
        )}

        {activeTab === "pipeline" && loading && (
          <p className="animate-pulse py-10 text-center font-body text-base text-text-secondary">
            Loading your pipeline…
          </p>
        )}
        {activeTab === "pipeline" && !loading && (
          <KanbanBoard
            deals={deals}
            viewingAs={viewingAs}
            onStatusChange={handleStatusChange}
            onDealClick={setSelectedDeal}
          />
        )}
        {activeTab === "appointments" && loading && (
          <p className="animate-pulse py-10 text-center font-body text-base text-text-secondary">
            Loading your viewings…
          </p>
        )}
        {activeTab === "appointments" && !loading && (
          <AppointmentsSheet
            appointments={appointments}
            onStatusUpdate={handleAppointmentUpdate}
            userId={mockUserId}
            addToast={addToast}
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
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded shadow-2xl z-50 animate-[slideUp_0.2s_ease-out] border bg-surface-alt ${
            toastTone === "error"
              ? "border-error/40 text-error"
              : "border-gold-accent/30 text-gold-accent"
          }`}
        >
          <p className="flex items-center gap-2 font-body text-base">
            {toastTone === "locked" && <LockKeyhole size={18} aria-hidden="true" />}
            {showToast}
          </p>
        </div>
      )}
    </div>
  );
}

export default function CRMPage() {
  return (
    <DashboardProvider>
      <VerifiedWorkspaceBoundary>
        <CRMPageInner />
      </VerifiedWorkspaceBoundary>
    </DashboardProvider>
  );
}
