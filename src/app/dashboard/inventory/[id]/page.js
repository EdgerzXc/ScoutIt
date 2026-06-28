"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardProvider, useDashboard } from "../../../../context/DashboardContext";
import InventoryGridManager from "../../../../components/dashboard/InventoryGridManager";
import { getCurrentTier } from "../../../../lib/entitlements";

function InventoryInner({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const { listings, updateListing, currentUser } = useDashboard();
  useEffect(() => {
    if (listings.length > 0 && !listings.find(l => String(l.id) === String(id))) {
      router.push("/dashboard");
    }
  }, [listings, id, router]);

  const listing = listings.find(l => String(l.id) === String(id));

  // State must be above early return
  const [localUnits, setLocalUnits] = useState([]);

  // Keep localUnits in sync when data loads or updates remotely
  useEffect(() => {
    if (listing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalUnits(listing.details?.units_inventory || listing.units_inventory || []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.details?.units_inventory, listing?.units_inventory]);

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center font-working-title text-text-secondary">
        Loading inventory manager...
      </div>
    );
  }

  const isPro = getCurrentTier() !== "starry";

  const handleAutoSave = async (newUnits) => {
    setLocalUnits(newUnits);
    
    // Create a deep copy of the listing details to update
    const updatedDetails = { ...listing.details, units_inventory: newUnits };
    
    // Auto-save silently
    try {
      await updateListing(listing.id, { details: updatedDetails });
    } catch (e) {
      console.error("Failed to auto-save inventory", e);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease]">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
          <div>
            <Link 
              href={`/dashboard?edit=${listing.id}`}
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
            >
              ← Back to Property Dossier
            </Link>
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">
              Inventory Manager
            </span>
            <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">
              {listing.title || 'Untitled Property'}
            </h1>
          </div>
          <div className="text-sm text-text-secondary font-working-title bg-surface-alt px-4 py-2 rounded-full border border-surface-variant">
            Changes auto-save automatically
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
