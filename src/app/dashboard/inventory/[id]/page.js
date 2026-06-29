"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { DashboardProvider, useDashboard } from "../../../../context/DashboardContext";
import InventoryGridManager from "../../../../components/dashboard/InventoryGridManager";
import { getCurrentTier } from "../../../../lib/entitlements";

function InventoryInner({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { listings, updateListing, currentUser, addToast, getCurrentTier } = useDashboard();
  
  useEffect(() => {
    if (listings.length > 0 && !listings.find(l => String(l.id) === String(id))) {
      router.push("/dashboard");
    }
  }, [listings, id, router]);

  const listing = listings.find(l => String(l.id) === String(id));
  const isPro = getCurrentTier ? getCurrentTier() !== "starry" : true;

  // State must be above early return
  const [localUnits, setLocalUnits] = useState([]);
  // Save lifecycle for the button animation: idle → saving → saved → idle (or error)
  const [saveState, setSaveState] = useState("idle");
  const autoSaveTimeout = useRef(null);
  const savedResetTimeout = useRef(null);

  // Track which listing ID we've already seeded localUnits for.
  // Using the ID (not a boolean) means navigating to a different listing
  // re-seeds correctly without an extra reset effect.
  const initializedForId = useRef(null);

  // Keep a live ref to listing so the auto-save timeout never reads a stale closure.
  const listingRef = useRef(listing);
  useEffect(() => {
    listingRef.current = listing;
  });

  // Seed localUnits exactly once per listing ID, and only when listing data is present.
  useEffect(() => {
    if (listing && initializedForId.current !== id) {
      setLocalUnits(listing.details?.units_inventory || []);
      initializedForId.current = id;
    }
  }, [listing, id]);

  // Clear pending timers on unmount so we never set state on a dead component.
  useEffect(() => {
    return () => {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      if (savedResetTimeout.current) clearTimeout(savedResetTimeout.current);
    };
  }, []);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <span className="text-text-muted font-working-title animate-pulse">Loading Inventory...</span>
      </div>
    );
  }

  // Single persistence path for both auto-save and manual save.
  // Drives the button animation and returns once the server confirms.
  const persist = async (units) => {
    if (savedResetTimeout.current) {
      clearTimeout(savedResetTimeout.current);
    }
    setSaveState("saving");

    // Read listing from ref so we always use the latest details, not a stale closure.
    const updatedDetails = { ...listingRef.current.details, units_inventory: units };

    let ok = false;
    try {
      // silent: the button + status line provide the feedback, so suppress context toasts.
      ok = await updateListing(listingRef.current.id, { details: updatedDetails }, { silent: true });
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

        {/* Grid Manager */}
        <InventoryGridManager 
          units={localUnits} 
          onChange={(newUnits) => setLocalUnits(newUnits)}
          onAutoSave={handleAutoSave}
          isPro={isPro}
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
