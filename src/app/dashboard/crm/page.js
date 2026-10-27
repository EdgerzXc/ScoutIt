"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardProvider, useDashboard } from "../../../context/DashboardContext";
import VerifiedWorkspaceBoundary from "@/components/auth/VerifiedWorkspaceBoundary";
import AtmosphereBackground from "../../../components/ui/AtmosphereBackground";
import DeckPanel from "../../../components/dashboard/DeckPanel";
import { deckNeighbors } from "../../../lib/workspaceDeck";
import KanbanBoard from "../../../components/dashboard/crm/KanbanBoard";
import AppointmentsSheet from "../../../components/dashboard/crm/AppointmentsSheet";
import DealFileSlideOver from "../../../components/dashboard/crm/DealFileSlideOver";
import NewDealModal from "../../../components/dashboard/crm/NewDealModal";
import ImportLeadsModal from "../../../components/dashboard/crm/ImportLeadsModal";
import TaskRail from "../../../components/dashboard/crm/TaskRail";
import WorkspaceCommandBar from "@/components/dashboard/WorkspaceCommandBar";
import { crmFetch } from "../../../lib/crmClient";
import { loadDeals } from "../../../lib/deals/dealsClient";
import { normalizeDashboardMode } from "../../../lib/dashboardModes";
import { leadsToCsv, exportFilename } from "../../../lib/leadExport";
import { contactToPipelineCard } from "../../../lib/crmContactMerge";
import { Briefcase, Calendar, ListChecks, Mail, Zap, ChevronDown, Check, ArrowLeft, LockKeyhole, Upload, Download } from "lucide-react";
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
  const [toastTone, setToastTone] = useState("locked"); // "locked" | "error" | "success"
  const [isNewDealModalOpen, setIsNewDealModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  // A-146: the lens used to default from localStorage (client display hint
  // as identity) and the menu always offered owner+broker. Both now derive
  // from the server profile: only held lenses are offered, defaulting to the
  // dashboard's last mode when held, else owner.
  const heldLenses = (Array.isArray(currentUser?.active_roles) ? currentUser.active_roles : [])
    .map(normalizeDashboardMode)
    .filter((role) => role === "owner" || role === "broker");
  const lensOptions = heldLenses.length > 0 ? [...new Set(heldLenses)] : ["owner", "broker"];

  // Default the lens to the mode the dashboard was last in.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("scoutit_user") || "{}");
      const lastMode = normalizeDashboardMode(saved.primaryMode);
      if (lastMode === "broker" && lensOptions.includes("broker")) setViewingAs("broker");
      else if (lensOptions.includes("owner")) setViewingAs("owner");
      else setViewingAs(lensOptions[0]);
    } catch (e) {
      if (lensOptions.includes("owner")) setViewingAs("owner");
      else setViewingAs(lensOptions[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identityResolved]);

  const mockUserId = currentUser?.id;

  // The pipeline lens changes what a card is called, not what it is. The
  // loader below is memoised on the identity, so it reads the lens from a
  // ref instead of re-fetching the pipeline every time the lens changes.
  const viewingAsRef = useRef(viewingAs);
  useEffect(() => {
    viewingAsRef.current = viewingAs;
  }, [viewingAs]);

  const flashToast = useCallback((message, tone = "error") => {
    setToastTone(tone);
    setShowToast(message);
    setTimeout(() => setShowToast(""), 4000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser?.id) return;
    // allSettled so one failing feed doesn't blank the other (e.g. an
    // appointments error must not hide the deal pipeline).
    const [dealsRes, apptsRes, contactsRes] = await Promise.allSettled([
      loadDeals({ mockUserId: currentUser.id }),
      crmFetch("/api/viewing-appointments", { mockUserId: currentUser.id }),
      crmFetch("/api/crm/contacts", { mockUserId: currentUser.id }),
    ]);
    if (dealsRes.status === "fulfilled") setDeals(dealsRes.value);
    // A-234: imported leads live in the account's CRM contact records. They
    // are loaded from the server on every visit, so an import survives a
    // refresh, a sign-out and a second device instead of living in the tab.
    if (contactsRes.status === "fulfilled") {
      const imported = (contactsRes.value?.contacts || [])
        .filter((c) => c?.source === "csv_import")
        .map((c) => contactToPipelineCard(c, viewingAsRef.current));
      setDeals((prev) => [...prev.filter((d) => !d.isImportedContact), ...imported]);
    }
    if (apptsRes.status === "fulfilled") setAppointments(apptsRes.value.appointments || []);
    if (dealsRes.status === "rejected" || apptsRes.status === "rejected") {
      console.error("CRM fetch failed", dealsRes.reason || apptsRes.reason);
      flashToast("Some of your pipeline data couldn't load. Check your connection.");
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
      setSelectedDeal((prev) => (prev && prev.id === dealId ? { ...prev, status: newStatus } : prev));
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

  const handleImportLeads = async (newLeads) => {
    if (!Array.isArray(newLeads) || newLeads.length === 0) return;
    try {
      const res = await crmFetch("/api/crm/contacts", {
        method: "POST",
        body: {
          contacts: newLeads.map((item) => ({
            fullName: item.name || item.otherParty || item.email,
            email: item.email || item.otherPartyEmail,
            phone: item.phone || item.otherPartyPhone,
            companyName: item.company || null,
            contactType: viewingAs === "broker" ? "buyer" : "prospective_tenant",
            source: "csv_import",
            requirements: {
              budget: item.budget ? Number(item.budget) || null : null,
              propertyTitle: item.propertyTitle || null,
              notes: item.notes || null,
              // The pipeline stage the spreadsheet carried. It used to be
              // dropped on import, which put every lead in New Inquiry.
              stage: item.status || "",
            },
          })),
        },
      });

      const saved = res?.contacts || [];
      // Only server-committed rows enter the board. A lead that exists only in
      // this tab is a lead the owner loses on the next refresh — the import
      // used to do exactly that and still report success.
      const incoming = saved.map((c) => contactToPipelineCard(c, viewingAs));
      const incomingIds = new Set(incoming.map((c) => c.id));
      setDeals((prev) => [
        ...incoming,
        ...prev.filter((d) => !d.isImportedContact || !incomingIds.has(d.id)),
      ]);

      const failed = res?.failed?.length || 0;
      if (failed > 0) {
        flashToast(
          `Saved ${res?.count ?? 0} of ${newLeads.length} leads. ${failed} could not be saved.`,
          "error"
        );
      } else {
        flashToast(
          `Saved ${res?.count ?? 0} lead${(res?.count ?? 0) === 1 ? "" : "s"} to your pipeline.`,
          "success"
        );
      }
    } catch (err) {
      console.error("[CRM] Failed to import leads:", err);
      flashToast("No leads were saved. Check your connection and try again.", "error");
    }
  };

  const handleExportPipelineCsv = () => {
    if (deals.length === 0) {
      flashToast("No deals in pipeline to export.");
      return;
    }
    const csvContent = leadsToCsv(deals);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename("scoutit-pipeline", "csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Only an unknown identity justifies covering the whole page. Waiting for
  // the pipeline itself no longer hides the header, the workspace nav and the
  // tabs — those are ready immediately, and blanking them made the CRM feel
  // slow even when the data arrived at the same time as everywhere else.
  if (userLoading) {
    return (
      <div role="main" className="relative min-h-screen bg-background px-6 py-12" aria-busy="true">
        <AtmosphereBackground variant="dashboard" />
        <div className="relative z-10 max-w-6xl mx-auto space-y-6 animate-pulse" aria-hidden="true">
          <div className="h-8 w-48 rounded bg-surface-variant/60" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-surface-variant bg-surface/40 p-5 h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser?.id) {
    return (
      <div role="main" className="flex-1 flex flex-col gap-4 justify-center items-center text-center h-screen h-dvh px-6 relative">
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
  // An imported lead is an active pipeline entry and counts as one, but it is
  // never allowed to move a ScoutIt-earned number: a "closed" row in a
  // spreadsheet is not a win ScoutIt recorded, so imported records stay out of
  // the win-rate denominators.
  const platformDeals = deals.filter((d) => !d.isImportedContact);
  const activeDealsList = deals.filter((d) => d.status === "connected" || d.status === "pending" || d.status === "accepted");
  const activeDeals = activeDealsList.length;
  const closedDeals = platformDeals.filter((d) => d.status === "closed").length;
  const declinedDeals = platformDeals.filter((d) => d.status === "declined").length;
  const totalDecided = closedDeals + declinedDeals;
  const winRate = totalDecided > 0 ? Math.round((closedDeals / totalDecided) * 100) : null;
  const upcomingViewings = appointments.filter((a) => a.status === "pending" || a.status === "confirmed").length;
  // Honest Blank Rule: pipeline value is the sum of real listed prices on
  // active deals' properties — never an invented per-deal figure. If nothing
  // in the pipeline carries a price yet, say so.
  const pricedDeals = activeDealsList.filter((d) => d.propertyPrice != null && Number(d.propertyPrice) > 0);
  const pipelineValue = pricedDeals.reduce((sum, d) => sum + Number(d.propertyPrice), 0);

  return (
    // A-205 Workspace Deck: CRM sits left of Workspace — swipe-left returns
    // home, swipe-right rubber-bands at the deck end. Lens is always a
    // pipeline role here, so the full owner mapping applies.
    <DeckPanel {...deckNeighbors("crm", viewingAs)}>
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
            className="min-h-11 min-w-11 inline-flex items-center justify-center p-2 border border-surface-variant rounded-full text-text-secondary hover:text-on-surface hover:border-gold-accent/50 transition shrink-0"
            title="Back to Workspace"
            aria-label="Back to Workspace"
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
                {lensOptions.map(role => (
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
            onClick={() => setIsImportModalOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded border border-surface-variant bg-surface-alt px-3.5 py-2 font-label-caps text-label-caps uppercase text-on-surface transition-colors duration-200 ease-out hover:border-gold-accent/50"
          >
            <Upload size={14} className="text-gold-accent" /> Import Leads
          </button>
          <button
            onClick={handleExportPipelineCsv}
            className="flex min-h-11 items-center gap-2 rounded border border-surface-variant bg-surface-alt px-3.5 py-2 font-label-caps text-label-caps uppercase text-on-surface transition-colors duration-200 ease-out hover:border-gold-accent/50"
          >
            <Download size={14} className="text-gold-accent" /> Export .csv
          </button>
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
        <div className="min-w-0 bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-3.5 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary truncate">Active Deals</div>
          <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums break-words">{loading ? <span className="text-text-muted" aria-label="Loading">-</span> : activeDeals}</div>
        </div>
        <div className="min-w-0 card-atmosphere-gold rounded-lg p-3.5 sm:p-4 md:p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-gold-accent truncate">Pipeline Value</div>
          {loading ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-text-muted" aria-label="Loading">-</div>
          ) : pricedDeals.length > 0 ? (
            <div>
              <div className="font-body text-2xl font-semibold tracking-tight text-on-surface text-glow tabular-nums break-words">₱{pipelineValue.toLocaleString()}</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">Listed prices on {pricedDeals.length} of {activeDeals} active deals</div>
            </div>
          ) : (
            <div>
              <div className="font-body text-2xl font-semibold tracking-tight text-text-secondary">-</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">No priced listings in your active pipeline yet</div>
            </div>
          )}
        </div>
        <div className="min-w-0 bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-3.5 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary truncate">Win Rate</div>
          {loading ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-text-muted" aria-label="Loading">-</div>
          ) : winRate !== null ? (
            <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums break-words">{winRate}%</div>
          ) : (
            <div>
              <div className="font-body text-2xl font-semibold tracking-tight text-text-secondary">-</div>
              <div className="mt-1 font-body text-base leading-snug text-text-muted">No closed deals yet</div>
            </div>
          )}
        </div>
        <div className="min-w-0 bg-gradient-to-br from-surface-alt to-surface border border-white/10 rounded-lg p-3.5 sm:p-4 md:p-5 flex flex-col justify-between">
          <div className="mb-1 font-label-caps text-label-caps uppercase text-text-secondary truncate">Upcoming Viewings</div>
          <div className="font-body text-2xl font-semibold tracking-tight text-on-surface tabular-nums break-words">{loading ? <span className="text-text-muted" aria-label="Loading">-</span> : upcomingViewings}</div>
        </div>
      </div>

      {/* Tabs and Toolbar */}
      <div className="flex items-center justify-between border-b border-surface-variant mb-6 relative z-10 overflow-x-auto pr-6">
        <div className="flex gap-4 md:gap-6">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "pipeline" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Briefcase size={16} /> Pipeline
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "appointments" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
          >
            <Calendar size={16} /> Appointments
          </button>
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 pb-3 font-label-caps text-label-caps uppercase transition-colors duration-200 ease-out ${activeTab === "tasks" ? "border-gold-accent text-gold-accent" : "border-transparent text-text-secondary hover:text-on-surface"}`}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6" aria-busy="true" aria-label="Loading pipeline">
            {[1, 2, 3, 4].map((col) => (
              <div key={col} aria-hidden="true" className="rounded-xl border border-surface-variant bg-surface/40 p-4 space-y-3 animate-pulse min-h-[260px]">
                <div className="h-3.5 w-24 rounded bg-gold-accent/25 mb-4" />
                <div className="h-20 w-full rounded-lg bg-surface-variant/40" />
                <div className="h-20 w-full rounded-lg bg-surface-variant/30" />
              </div>
            ))}
          </div>
        )}
        {activeTab === "pipeline" && !loading && (
          <KanbanBoard
            deals={deals}
            viewingAs={viewingAs}
            onStatusChange={handleStatusChange}
            onDealClick={setSelectedDeal}
            appointments={appointments}
          />
        )}
        {activeTab === "appointments" && loading && (
          <div className="space-y-3 py-6" aria-busy="true" aria-label="Loading viewings">
            {[1, 2, 3].map((row) => (
              <div key={row} aria-hidden="true" className="rounded-xl border border-surface-variant bg-surface/40 p-5 animate-pulse flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded bg-surface-variant/60" />
                  <div className="h-3 w-32 rounded bg-surface-variant/40" />
                </div>
                <div className="h-8 w-24 rounded bg-gold-accent/20" />
              </div>
            ))}
          </div>
        )}
        {activeTab === "appointments" && !loading && (
          <AppointmentsSheet
            appointments={appointments}
            onStatusUpdate={handleAppointmentUpdate}
            onRefresh={fetchData}
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
        onStatusChange={handleStatusChange}
        mockUserId={mockUserId}
      />

      <NewDealModal
        isOpen={isNewDealModalOpen}
        onClose={() => setIsNewDealModalOpen(false)}
        onDealCreated={(newDeal) => setDeals((prev) => [...prev, newDeal])}
        mockUserId={mockUserId}
      />

      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportLeads}
        existingDeals={deals}
      />

      {/* Toast Notification */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-[calc(90px+env(safe-area-inset-bottom))] md:bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] px-6 py-3 rounded shadow-2xl z-[70] animate-[slideUp_0.2s_ease-out] border bg-surface-alt ${
            toastTone === "error"
              ? "border-error/40 text-error"
              : toastTone === "success"
                ? "border-success/40 text-success"
                : "border-gold-accent/30 text-gold-accent"
          }`}
        >
          <p className="flex items-center gap-2 font-body text-base break-words">
            {toastTone === "locked" && <LockKeyhole size={18} aria-hidden="true" className="shrink-0" />}
            {showToast}
          </p>
        </div>
      )}
    </div>
    </DeckPanel>
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
