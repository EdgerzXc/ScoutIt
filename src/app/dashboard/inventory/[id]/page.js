"use client";

import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { DashboardProvider, useDashboard } from "../../../../context/DashboardContext";
import InventoryGridManager from "../../../../components/dashboard/InventoryGridManager";
import DelegationRequests from "../../../../components/dashboard/DelegationRequests";
import { getCurrentTier } from "../../../../lib/entitlements";
import { getSession } from "../../../../lib/authClient";

function InventoryInner({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { listings, currentUser, addToast, getCurrentTier } = useDashboard();
  
  useEffect(() => {
    if (listings.length > 0 && !listings.find(l => String(l.id) === String(id))) {
      router.push("/dashboard");
    }
  }, [listings, id, router]);

  const listing = listings.find(l => String(l.id) === String(id));
  const isPro = getCurrentTier ? getCurrentTier() !== "starry" : true;

  // State must be above early return
  const [localUnits, setLocalUnits] = useState([]);
  const [unitsLoaded, setUnitsLoaded] = useState(false);
  // Save lifecycle for the button animation: idle → saving → saved → idle (or error)
  const [saveState, setSaveState] = useState("idle");
  const autoSaveTimeout = useRef(null);
  const savedResetTimeout = useRef(null);

  // Track which listing ID we've already loaded units for.
  // Using the ID (not a boolean) means navigating to a different listing
  // re-loads correctly without an extra reset effect.
  const initializedForId = useRef(null);

  // Keep a live ref to listing so the auto-save timeout never reads a stale closure.
  const listingRef = useRef(listing);
  useEffect(() => {
    listingRef.current = listing;
  });

  // Live ref to the latest localUnits + in-flight guard. Newly-added units get
  // client-side temp ids until the server assigns real ones; if a second save
  // fires while one is still in flight, we must NOT resend the old temp ids
  // after reconciliation (that would insert the same unit twice). Instead we
  // queue a flag and, once the in-flight save settles, re-run persist against
  // whatever localUnits looks like *then* (via the ref, never a stale closure).
  const localUnitsRef = useRef(localUnits);
  useEffect(() => {
    localUnitsRef.current = localUnits;
  }, [localUnits]);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  // Load real property_units rows (not details.units_inventory). Exposed as a
  // stable function so DelegationRequests can trigger a reload after an
  // accept stamps operator_id on units this page is currently showing.
  const fetchUnits = useCallback(async ({ silent = false } = {}) => {
    if (!listingRef.current) return;
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const params = new URLSearchParams({ propertyId: listingRef.current.id });
      if (currentUser?.id) params.set("mockOwnerId", currentUser.id);

      const res = await fetch(`/api/dashboard/units?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      const data = await res.json();
      if (res.ok) {
        setLocalUnits(data.units || []);
      } else if (!silent) {
        console.error("Failed to load units", data.error);
        addToast("Couldn't load units — check your connection.", "❌");
      }
    } catch (e) {
      if (!silent) console.error("Failed to load units", e);
    } finally {
      setUnitsLoaded(true);
    }
  }, [currentUser, addToast]);

  useEffect(() => {
    if (!listing || initializedForId.current === id) return;
    initializedForId.current = id;
    fetchUnits();
  }, [listing, id, fetchUnits]);

  // Clear pending timers on unmount so we never set state on a dead component.
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      if (savedResetTimeout.current) clearTimeout(savedResetTimeout.current);
    };
  }, []);

  if (!listing || !unitsLoaded) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <span className="text-text-muted font-working-title animate-pulse">Loading Inventory...</span>
      </div>
    );
  }

  // Single persistence path for both auto-save and manual save.
  // Drives the button animation and returns once the server confirms.
  // Writes to the real property_units table via /api/dashboard/units, not the
  // legacy details.units_inventory blob — see SCOUTIT_MASTER_BUILD_SPEC.md §9.
  const persist = async (units) => {
    // A save is already in flight: don't fire a concurrent request (it could
    // resend not-yet-reconciled temp ids and insert duplicate rows). Record
    // that another save is wanted; the in-flight one will pick up the latest
    // state via localUnitsRef once it settles.
    if (isSavingRef.current) {
      pendingSaveRef.current = true;
      return true;
    }
    isSavingRef.current = true;

    if (savedResetTimeout.current) {
      clearTimeout(savedResetTimeout.current);
    }
    setSaveState("saving");

    let ok = false;
    try {
      const { data: { session } } = await getSession();
      const token = session?.access_token;
      const res = await fetch("/api/dashboard/units", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          propertyId: listingRef.current.id,
          units,
          mockOwnerId: currentUser?.id,
        }),
      });
      const data = await res.json();
      ok = res.ok && data.success;
      if (ok) {
        // Reconcile: server-assigned real ids replace client temp ids so the
        // next save updates rather than re-inserting these rows.
        setLocalUnits(data.units || units);
        if (data.warning) addToast(data.warning, "⚠️");
      }
    } catch (e) {
      console.error("Failed to save inventory", e);
      ok = false;
    }

    setSaveState(ok ? "saved" : "error");
    if (!ok) {
      addToast("Couldn't save your changes — check your connection.", "❌");
    }

    // Settle the button back to idle after the confirmation has been seen.
    savedResetTimeout.current = setTimeout(() => setSaveState("idle"), ok ? 1800 : 2800);

    isSavingRef.current = false;
    if (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      // Re-run against the freshest state, not the (possibly stale) `units`
      // this call closed over.
      persist(localUnitsRef.current);
    }
    return ok;
  };

  const handleAutoSave = (newUnits) => {
    setLocalUnits(newUnits);

    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    autoSaveTimeout.current = setTimeout(() => persist(newUnits), 1000);
  };

  const manualSave = () => {
    if (saveState === "saving") return;
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    persist(localUnits);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
          <div>
            <Link 
              href="/dashboard"
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
            >
              ← Back to Dashboard
            </Link>
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">
              Inventory Manager
            </span>
            <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">
              {listing.title || 'Untitled Property'}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={manualSave}
              disabled={saveState === 'saving'}
              className={`min-w-[150px] text-sm font-working-title font-bold px-6 py-2 rounded-full border transition-all duration-300 flex items-center justify-center gap-2 ${
                saveState === 'saving'
                  ? 'bg-surface-variant text-text-muted border-surface-variant cursor-wait'
                  : saveState === 'saved'
                  ? 'bg-success/15 text-success border-success'
                  : saveState === 'error'
                  ? 'bg-error/15 text-error border-error hover:bg-error/25'
                  : 'bg-gold-accent text-background border-gold-accent hover:bg-gold-accent-hover'
              }`}
            >
              {saveState === 'saving' && (
                <><Loader2 size={15} className="animate-spin" /> Saving…</>
              )}
              {saveState === 'saved' && (
                <span className="flex items-center gap-2 animate-[fadeIn_0.25s_ease]">
                  <Check size={15} strokeWidth={3} /> Saved
                </span>
              )}
              {saveState === 'error' && (
                <><AlertTriangle size={15} /> Retry Save</>
              )}
              {saveState === 'idle' && 'Save Changes'}
            </button>
            <span className={`text-[10px] font-working-title uppercase tracking-wider transition-colors ${
              saveState === 'saved' ? 'text-success' : saveState === 'error' ? 'text-error' : 'text-text-secondary'
            }`}>
              {saveState === 'saving' && 'Saving your changes…'}
              {saveState === 'saved' && 'All changes saved'}
              {saveState === 'error' && "Couldn't save — tap Retry"}
              {saveState === 'idle' && 'Auto-saves as you edit'}
            </span>
          </div>
        </div>

        {/* Pending operator delegation requests (§9.2) — review above the grid */}
        <DelegationRequests
          propertyId={listing.id}
          units={localUnits}
          onDelegated={() => fetchUnits({ silent: true })}
        />

        {/* Grid Manager */}
        <InventoryGridManager
          units={localUnits}
          onChange={(newUnits) => setLocalUnits(newUnits)}
          onAutoSave={handleAutoSave}
          isPro={isPro}
          propertyId={listing.slug || listing.id}
          property={listing}
        />

      </div>
    </div>
  );
}

export default function InventoryPage({ params }) {
  return (
    <DashboardProvider>
      <InventoryInner params={params} />
    </DashboardProvider>
  );
}
