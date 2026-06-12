"use client";

import { useState, useEffect } from "react";
import GuidedWizard from "./GuidedWizard";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";

export default function OwnerMode() {
  const { listings, pitches, updatePitchStatus, addListing, currentUser } = useDashboard();
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "";
  const [showWizard, setShowWizard] = useState(false);
  const [activeListingId, setActiveListingId] = useState(null);

  // Check if current user has any listings (ownerId === 'current_user')
  const myListings = listings.filter(l => l.ownerId === 'current_user');
  const hasListing = myListings.length > 0;
  
  // Set the first listing as active by default if none is selected
  useEffect(() => {
    if (hasListing && !activeListingId) {
      setActiveListingId(myListings[0].id);
    }
  }, [hasListing, myListings, activeListingId]);

  const activeListing = myListings.find(l => l.id === activeListingId) || (hasListing ? myListings[0] : null);

  // Mobile bottom-bar primary action (+ List) opens the wizard
  useEffect(() => {
    const onPrimary = (e) => {
      if (e.detail?.mode === "owner") setShowWizard(true);
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  // "List Property Now" from onboarding lands straight in the wizard
  useEffect(() => {
    if (localStorage.getItem("scoutit_open_wizard") === "1") {
      localStorage.removeItem("scoutit_open_wizard");
      setShowWizard(true);
    }
  }, []);

  // Filter pitches that are directed at the owner and specific to the active listing
  const incomingPitches = activeListing 
    ? pitches.filter(p => p.isCurrentUserOwner && p.status === 'pending' && p.listingId === activeListing.id)
    : [];

  const handlePublish = (listingData) => {
    addListing(listingData);
    setShowWizard(false);
  };

  if (showWizard) {
    return <GuidedWizard onPublish={handlePublish} onClose={() => setShowWizard(false)} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter animate-[fadeIn_0.4s_ease]">
      {/* Column 1: Status & Stats */}
      <div className="md:col-span-5 flex flex-col gap-gutter">
        <div className="mb-sm">
          <h1 className="font-display-md text-display-md text-text-primary">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="text-text-secondary font-body-md text-body-md">Manage your property portfolio.</p>
        </div>
        
        {!hasListing ? (
          <div className="bg-surface rounded border border-surface-variant p-lg flex flex-col gap-md relative overflow-hidden items-center justify-center text-center py-24">
            <h3 className="font-display-md text-2xl mb-2">List your property</h3>
            <p className="text-text-secondary mb-6">Takes 10 minutes. Zero friction.</p>
            <button className="bg-gold-accent text-background font-working-title px-6 py-4 w-full rounded hover:bg-surface-tint transition-colors text-base font-bold uppercase tracking-widest shadow-lg" onClick={() => setShowWizard(true)}>
              Start Listing Wizard
            </button>
          </div>
        ) : (
          <>
            {/* Multiple Properties Switcher - Grandma Friendly */}
            {myListings.length > 1 && (
              <div className="mb-6">
                <span className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-2 block">Select Property</span>
                <div className="flex flex-col gap-2">
                  {myListings.map(listing => (
                    <button 
                      key={listing.id}
                      className={`w-full flex items-center justify-between px-4 py-4 rounded border-2 transition-all ${activeListingId === listing.id ? 'bg-surface-container-low border-gold-accent' : 'bg-surface border-surface-variant hover:border-text-secondary'}`}
                      onClick={() => setActiveListingId(listing.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${activeListingId === listing.id ? 'bg-gold-accent' : 'bg-surface-variant'}`}></div>
                        <span className={`font-working-title text-base ${activeListingId === listing.id ? 'text-gold-accent' : 'text-on-surface'}`}>
                          {listing.title || 'Untitled Property'}
                        </span>
                      </div>
                      {activeListingId === listing.id && <span className="text-xl">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* If only 1 property, still give them a huge button to add another */}
            {myListings.length === 1 && (
               <button className="w-full bg-surface border-2 border-dashed border-surface-variant text-text-secondary hover:text-on-surface hover:border-gold-accent/50 font-working-title py-4 rounded mb-6 transition-all" onClick={() => setShowWizard(true)}>
                 + List another property
               </button>
            )}

            {/* Active Property Card */}
            {activeListing && (
              <div className="bg-surface rounded border border-surface-variant p-lg flex flex-col gap-md relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-gold-accent"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-caps text-label-caps text-text-secondary block mb-1">CURRENTLY VIEWING</span>
                    <Link href={`/property/${activeListing.id}`} className="font-working-title text-2xl text-text-primary hover:text-gold-accent hover:underline transition-colors block">
                      {activeListing.title}
                    </Link>
                  </div>
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                      <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${activeListing.signals?.completeness?.replace('%','') || 100}, 100`} strokeWidth="4"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-data-tabular font-bold text-sm text-text-primary">{activeListing.signals?.completeness || '100%'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-sm mt-4 border-t border-surface-variant pt-6">
                  <div>
                    <span className="block font-label-caps text-[10px] tracking-widest text-text-secondary mb-1 uppercase">Days on Market</span>
                    <span className="font-data-tabular text-2xl text-text-primary font-bold">&lt;1</span>
                  </div>
                  <div>
                    <span className="block font-label-caps text-[10px] tracking-widest text-text-secondary mb-1 uppercase">Profile Views</span>
                    <span className="font-data-tabular text-2xl text-text-primary font-bold">New</span>
                    <span className="block text-[10px] text-text-secondary mt-0.5">First numbers within 24 hrs</span>
                  </div>
                </div>
                <Link href={`/property/${activeListing.id}`} className="mt-6 w-full border-2 border-gold-accent text-gold-accent bg-transparent hover:bg-gold-accent/10 font-working-title font-bold py-4 rounded transition-colors text-base text-center block">
                  View My Listing
                </Link>
              </div>
            )}
            
            {hasListing && (
              <div className="bg-surface rounded border border-surface-variant p-md mt-6">
                <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase">Engagement Metrics</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center py-3 border-b border-surface-alt">
                    <span className="font-body-md text-text-primary">Saved to Favorites</span>
                    <span className="font-data-tabular text-lg font-bold text-gold-accent">—</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-surface-alt">
                    <span className="font-body-md text-text-primary">Pitches Received</span>
                    <span className="font-data-tabular text-lg font-bold text-gold-accent">{incomingPitches.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="font-body-md text-text-primary">Broker Interest</span>
                    <span className="font-data-tabular text-lg font-bold text-gold-accent">{incomingPitches.length > 0 ? "Active" : "Building"}</span>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary mt-3">Stats update daily once your listing is live.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Column 2: Pitch Inbox */}
      <div className="md:col-span-7 flex flex-col gap-md">
        <div className="flex justify-between items-center mb-xs mt-lg md:mt-0 bg-surface-alt p-4 rounded border border-surface-variant">
          <h2 className="font-working-title text-xl text-text-primary flex items-center gap-3">
            <span className="text-3xl">📦</span> 
            <div>
              <div className="font-bold">Broker Pitches</div>
              <div className="text-xs text-text-secondary font-normal">Inbox for {activeListing?.title || 'this property'}</div>
            </div>
          </h2>
          {incomingPitches.length > 0 && (
            <span className="bg-error/20 text-error font-working-title font-bold text-sm px-3 py-1 rounded-full">{incomingPitches.length} NEW</span>
          )}
        </div>

        {incomingPitches.length === 0 && hasListing && (
          <div className="bg-surface rounded border border-surface-variant p-8 text-center py-16 text-text-muted flex flex-col items-center">
            <span className="text-6xl mb-4">📭</span>
            <p className="text-lg font-working-title text-on-surface">No pitches yet — brokers are reviewing your property.</p>
            <p className="text-sm mt-2 text-text-secondary max-w-sm">Listings with photos get pitched 4× more often.</p>
            {!activeListing?.hasMedia && (
              <button className="mt-6 bg-gold-accent text-background font-working-title font-bold px-8 py-3 rounded hover:opacity-90 transition-opacity" onClick={() => setShowWizard(true)}>
                Add Photos
              </button>
            )}
          </div>
        )}

        {!hasListing && (
          <div className="bg-surface rounded border border-surface-variant p-8 text-center py-16 text-text-muted flex flex-col items-center">
            <span className="text-6xl mb-4">🏡</span>
            <p className="text-lg font-working-title text-on-surface">Publish your listing to receive pitches.</p>
            <p className="text-sm mt-4 text-text-secondary max-w-sm">Tip: Testing out the system? We have pre-loaded dummy pitches to demonstrate how this looks! Just publish a property and they will appear.</p>
          </div>
        )}

        {hasListing && incomingPitches.map(pitch => (
          <div key={pitch.id} className="bg-surface rounded border border-surface-variant p-6 flex flex-col gap-4 shadow-lg mb-4">
            <div className="flex justify-between items-start mb-2 border-b border-surface-variant pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-surface-variant border-2 border-gold-accent flex items-center justify-center font-bold text-xl overflow-hidden text-on-surface">
                  {pitch.brokerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-body-md text-xl text-text-primary font-bold flex items-center gap-2">
                    {pitch.brokerName}
                    <span className="text-gold-accent text-sm" title="PRC-verified broker">✔ Verified</span>
                  </h4>
                  <span className="font-body-sm text-sm text-gold-accent">{pitch.brokerFirm}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-label-caps text-xs tracking-widest text-text-secondary uppercase bg-surface-alt px-2 py-1 rounded">{pitch.timeRemaining}</span>
                <span className="text-[10px] text-gold-accent">⏱ Respond within 24 hrs to keep your Top Responder status</span>
              </div>
            </div>
            
            <div className="bg-surface-container-low p-5 rounded border border-surface-variant relative">
              <span className="absolute -top-3 left-4 bg-surface-container-low px-2 text-xs text-text-secondary font-bold uppercase tracking-wider">Message</span>
              <p className="font-body-md text-base text-on-surface leading-relaxed">
                {pitch.message}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button 
                className="flex-1 bg-transparent border-2 border-surface-variant text-text-primary hover:bg-error/10 hover:text-error hover:border-error font-working-title text-lg font-bold py-4 rounded transition-all" 
                onClick={() => updatePitchStatus(pitch.id, 'declined')}
              >
                Decline
              </button>
              <button 
                className="flex-1 bg-gold-accent text-background border-2 border-gold-accent font-working-title text-lg font-bold py-4 rounded hover:bg-gold-accent/90 transition-all shadow-lg" 
                onClick={() => updatePitchStatus(pitch.id, 'accepted')}
              >
                Accept Pitch
              </button>
            </div>
            <p className="text-center text-xs text-text-secondary mt-1">Accepting shares your contact info.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
