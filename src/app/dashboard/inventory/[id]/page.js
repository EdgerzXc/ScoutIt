"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeout = useRef(null);

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

  if (!listing) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-12 flex items-center justify-center">
        <span className="text-text-muted font-working-title animate-pulse">Loading Inventory...</span>
      </div>
    );
  }

  const handleAutoSave = (newUnits) => {
    setLocalUnits(newUnits);
    
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    autoSaveTimeout.current = setTimeout(async () => {
      // Read listing from ref so we always get the current details, not a stale closure.
      const updatedDetails = { ...listingRef.current.details, units_inventory: newUnits };
      
      // Auto-save silently
      setIsSaving(true);
      try {
        const success = await updateListing(listing.id, { details: updatedDetails });
        if (success === false) {
          console.error("Auto-save returned false");
        }
      } catch (e) {
        console.error("Failed to auto-save inventory", e);
      }
      setIsSaving(false);
    }, 1000);
  };

  const manualSave = async () => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }
    
    setIsSaving(true);
    try {
      const updatedDetails = { ...listing.details, units_inventory: localUnits };
      const success = await updateListing(listing.id, { details: updatedDetails });
      if (success !== false) {
         addToast("Changes saved successfully.", "✅");
      }
    } catch (e) {
      console.error("Failed manual save", e);
      addToast("Failed to save changes", "❌");
    }
    setIsSaving(false);
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
              disabled={isSaving}
              className={`text-sm font-working-title font-bold px-6 py-2 rounded-full border transition-colors ${
                isSaving 
                  ? 'bg-surface-variant text-text-muted border-surface-variant cursor-not-allowed'
                  : 'bg-gold-accent text-background border-gold-accent hover:bg-gold-accent-hover'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <span className="text-[10px] text-text-secondary font-working-title uppercase tracking-wider">
              Also auto-saves on edits
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
