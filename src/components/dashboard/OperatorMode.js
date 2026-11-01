"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Building2, Cog, X, DoorOpen, MessageSquare, Compass, ChevronRight, SlidersHorizontal } from "lucide-react";
import InventoryGridManager from "./InventoryGridManager";
import { getSession } from "../../lib/authClient";
import { useDashboard } from "../../context/DashboardContext";

// Operator's "Operated Spaces" dashboard (SCOUTIT_MASTER_BUILD_SPEC.md §9.2/§9.6):
// a filtered view showing only units delegated to this user, grouped by
// building, never the rest of any building they don't own. Reuses
// InventoryGridManager in its restricted "operator" mode rather than forking
// a second grid component.
export default function OperatorMode() {
  const { addToast, authedFetch } = useDashboard();
  const [buildings, setBuildings] = useState(null); // null = loading
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const buildingsRef = useRef(buildings);
  useEffect(() => { buildingsRef.current = buildings; }, [buildings]);

  const load = useCallback(async () => {
    try {
      const res = await authedFetch("/api/dashboard/operator/units");
      const data = await res.json();
      if (res.ok) {
        setBuildings(data.buildings || []);
      } else {
        console.error("Failed to load operated spaces", data.error);
        setBuildings([]);
      }
    } catch (e) {
      console.error("Failed to load operated spaces", e);
      setBuildings([]);
    }
  }, [authedFetch]);

  useEffect(() => { load(); }, [load]);

  // Primary action button listener (Units FAB in Dashboard)
  useEffect(() => {
    const onPrimary = (e) => {
      if (!e?.detail?.mode || e.detail?.mode === "operator") {
        setActionModalOpen(true);
        const el = document.getElementById("operated-buildings-list");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  const saveBuildingUnits = async (propertyId, units) => {
    try {
      const res = await authedFetch("/api/dashboard/operator/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, units }),
      });
      const data = await res.json();
      if (!res.ok) {
        addToast("Couldn't save your changes: check your connection.", "❌");
        return;
      }
      if (data.warning) addToast(data.warning, "⚠️");
      // Reconcile this one building's slice with the server's authoritative state.
      setBuildings((prev) =>
        (prev || []).map((b) => (b.propertyId === propertyId ? { ...b, units: data.units } : b))
      );
    } catch (e) {
      console.error("Failed to save operated unit changes", e);
      addToast("Couldn't save your changes: check your connection.", "❌");
    }
  };

  const updateBuildingLocal = (propertyId, newUnits) => {
    setBuildings((prev) =>
      (prev || []).map((b) => (b.propertyId === propertyId ? { ...b, units: newUnits } : b))
    );
  };

  if (buildings === null) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <span className="text-text-muted font-working-title animate-pulse">Loading operated spaces…</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="border-b border-surface-variant pb-6">
        <span className="font-label-caps text-gold-accent tracking-widest uppercase text-xs mb-1 block">
          Command Center
        </span>
        <h1 className="font-headline-editorial text-3xl md:text-5xl text-gradient-gold">Operated Spaces</h1>
        <p className="text-sm text-text-secondary mt-2 max-w-2xl">
          Units delegated to you across every building you operate (commercial, restaurant, retail, flex spaces).
          You can rename units, manage photos, and set availability here; everything else about the building stays with its owner.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface/50 border border-white/[0.06] backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center text-gold-accent shrink-0 mt-0.5">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-sm font-medium text-on-surface">Branch Operations Center</div>
            <div className="text-xs text-text-muted mt-0.5">Inbound tenant inquiries and callback requests route directly to your Deal Room Inbox.</div>
          </div>
        </div>
        <Link
          href="/dashboard/inbox"
          className="w-full sm:w-auto min-h-11 justify-center px-4 py-2 rounded-lg bg-white/[0.04] hover:bg-gold-accent hover:text-black border border-white/[0.08] hover:border-gold-accent text-xs font-mono tracking-wider uppercase text-text-primary transition-all flex items-center gap-2"
        >
          <span>Open Operations Inbox →</span>
        </Link>
      </div>

      <div id="operated-buildings-list" className="flex flex-col gap-6">
      {buildings.length === 0 ? (
        <div className="bg-surface/40 backdrop-blur-xl border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(var(--text-primary-rgb),0.05)] rounded-2xl p-8 md:p-16 flex flex-col items-center text-center gap-2 relative overflow-hidden transition-all duration-300 mx-auto w-full max-w-xl break-words">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-gold-accent/5 rounded-full blur-[60px]" />
          <div className="w-14 h-14 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center text-gold-accent mb-4 relative z-10 shadow-md">
            <Cog size={28} className="animate-spin-slow" />
          </div>
          <p className="text-on-surface font-working-title text-xl mb-2 relative z-10 tracking-tight">
            No units have been delegated to you yet.
          </p>
          <p className="text-xs text-text-secondary max-w-md relative z-10">
            Find a commercial building or unit you would like to operate, open its property or unit master page, and use{" "}
            <span className="text-gold-accent">Apply to Operate This Space</span> to reach out to the owner or property management.
          </p>
        </div>
      ) : (
        buildings.map((b) => (
          <div key={b.propertyId} className="card-atmosphere hov-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-working-title text-lg text-on-surface">{b.propertyTitle || "Untitled Building"}</h2>
              {b.propertySlug && (
                <Link
                  href={`/property/${b.propertySlug}`}
                  className="text-xs text-text-secondary hover:text-gold-accent transition"
                >
                  View property page →
                </Link>
              )}
            </div>
            <InventoryGridManager
              mode="operator"
              isPro={true}
              units={b.units}
              onChange={(newUnits) => updateBuildingLocal(b.propertyId, newUnits)}
              onAutoSave={(newUnits) => saveBuildingUnits(b.propertyId, newUnits)}
            />
          </div>
        ))
      )}
      </div>

      {/* Operator Quick Actions Modal (Triggered by mobile "Units" FAB) */}
      {actionModalOpen && (
        <div
          className="fixed inset-0 z-[100002] bg-background/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 motion-safe:animate-[fadeIn_0.2s_ease-out]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="operator-modal-title"
        >
          <div
            className="w-full sm:max-w-md bg-surface border border-surface-variant rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl relative motion-safe:animate-[slideUp_0.25s_ease-out] flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-surface-variant">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-gold-accent font-semibold block mb-0.5">
                  Operator Command
                </span>
                <h3 id="operator-modal-title" className="font-headline-editorial text-xl text-on-surface">
                  Unit & Space Operations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActionModalOpen(false)}
                className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-text-secondary hover:text-on-surface hover:bg-surface-alt transition active:scale-95 touch-manipulation"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <Link
                href="/property?type=commercial"
                onClick={() => setActionModalOpen(false)}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gold-accent/40 bg-gold-accent/10 hover:bg-gold-accent/20 transition-all text-left group min-h-[56px] active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gold-accent text-background flex items-center justify-center shrink-0 font-bold">
                    <Compass size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-working-title text-sm text-gold-bright font-semibold group-hover:underline">
                      Find Spaces to Operate
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      Browse commercial buildings & apply for unit delegation
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gold-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard/inbox"
                onClick={() => setActionModalOpen(false)}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-surface-variant/80 bg-surface-alt/40 hover:border-gold-accent/40 hover:bg-surface-alt transition-all text-left group min-h-[56px] active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface border border-surface-variant flex items-center justify-center text-gold-accent shrink-0">
                    <MessageSquare size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-working-title text-sm text-on-surface font-semibold group-hover:text-gold-accent transition-colors">
                      Deal Room Inbox
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      Manage prospective tenant chats & tour requests
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard/open-gate"
                onClick={() => setActionModalOpen(false)}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-surface-variant/80 bg-surface-alt/40 hover:border-gold-accent/40 hover:bg-surface-alt transition-all text-left group min-h-[56px] active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface border border-surface-variant flex items-center justify-center text-gold-accent shrink-0">
                    <DoorOpen size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-working-title text-sm text-on-surface font-semibold group-hover:text-gold-accent transition-colors">
                      Enterprise Open Gate
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      Toggle free inbound tenant contacts on delegated units
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setActionModalOpen(false);
                  const el = document.getElementById("operated-buildings-list");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-surface-variant/80 bg-surface-alt/40 hover:border-gold-accent/40 hover:bg-surface-alt transition-all text-left group min-h-[56px] active:scale-[0.99] touch-manipulation"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-surface border border-surface-variant flex items-center justify-center text-gold-accent shrink-0">
                    <SlidersHorizontal size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-working-title text-sm text-on-surface font-semibold group-hover:text-gold-accent transition-colors">
                      Unit Inventory & Pricing
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      Scroll to building inventory manager
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

