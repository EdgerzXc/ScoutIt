"use client";

import { useState, useEffect } from "react";
import GuidedWizard from "./GuidedWizard";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";

export default function OwnerMode() {
  const { listings, pitches, updatePitchStatus, addListing, updateListing, closeListing, currentUser } = useDashboard();
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "";
  const [showWizard, setShowWizard] = useState(false); // false | true | 'edit'
  
  // Check if current user has any listings
  const myListings = listings.filter(l => l.ownerId === 'current_user');
  const hasListing = myListings.length > 0;

  // New Dossier State
  const [viewingDossierId, setViewingDossierId] = useState(null);

  // If they only have 1 listing, jump straight to its dossier
  useEffect(() => {
    if (hasListing && myListings.length === 1 && !viewingDossierId) {
      setViewingDossierId(myListings[0].id);
    }
  }, [hasListing, myListings, viewingDossierId]);

  // Handle cleanup if the active dossier is deleted
  useEffect(() => {
    if (viewingDossierId && !myListings.find(l => l.id === viewingDossierId)) {
      setViewingDossierId(null);
    }
  }, [myListings, viewingDossierId]);

  const activeListing = myListings.find(l => l.id === viewingDossierId);

  // Mobile bottom-bar primary action (+ List) opens the wizard
  useEffect(() => {
    const onPrimary = (e) => {
      if (e.detail?.mode === "owner") setShowWizard(true);
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  // "List Property Now" from onboarding
  useEffect(() => {
    if (localStorage.getItem("scoutit_open_wizard") === "1") {
      localStorage.removeItem("scoutit_open_wizard");
      setShowWizard(true);
    }
  }, []);

  const incomingPitches = activeListing 
    ? pitches.filter(p => p.isCurrentUserOwner && p.listingId === activeListing.id)
    : [];

  const handlePublish = (listingData) => {
    if (showWizard === 'edit') {
      updateListing(viewingDossierId, listingData);
    } else {
      addListing(listingData);
    }
    setShowWizard(false);
  };

  if (showWizard) {
    return <GuidedWizard 
      onPublish={handlePublish} 
      onClose={() => setShowWizard(false)} 
      isEditing={showWizard === 'edit'} 
      initialData={showWizard === 'edit' ? activeListing : null} 
    />;
  }

  // --- VIEW: ZERO LISTINGS ---
  if (!hasListing) {
    return (
      <div className="max-w-[1200px] mx-auto py-lg animate-[fadeIn_0.4s_ease]">
        <div className="mb-sm">
          <h1 className="font-display-md text-display-md text-text-primary">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="text-text-secondary font-body-md text-body-md">Your workspace is empty.</p>
        </div>
        <div className="bg-[#0a0a0a] rounded border border-surface-variant p-lg flex flex-col gap-md relative overflow-hidden items-center justify-center text-center py-32">
          <h3 className="font-display-md text-3xl mb-2 text-on-surface">Create your first Property File</h3>
          <p className="text-text-secondary mb-8 max-w-md">Our wizard helps you build a high-trust, premium dossier for your asset in under 10 minutes.</p>
          <button className="bg-gold-accent text-background font-working-title px-8 py-4 rounded hover:bg-surface-tint transition-colors text-lg font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)]" onClick={() => setShowWizard(true)}>
            Initialize Workspace
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 1 - ACTIVE PROPERTY FILES (PORTFOLIO VIEW) ---
  if (!viewingDossierId && myListings.length > 1) {
    return (
      <div className="max-w-[1200px] mx-auto py-lg animate-[fadeIn_0.4s_ease]">
        <div className="flex justify-between items-end mb-8 border-b border-surface-variant pb-6">
          <div>
            <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Command Center</span>
            <h1 className="font-display-md text-4xl text-text-primary">Active Property Files</h1>
          </div>
          <button 
            className="border border-gold-accent text-gold-accent hover:bg-gold-accent hover:text-background font-working-title font-bold px-6 py-3 rounded transition-all"
            onClick={() => setShowWizard(true)}
          >
            + New Property File
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myListings.map(listing => {
            const listPitches = pitches.filter(p => p.isCurrentUserOwner && p.listingId === listing.id);
            const pendingPitches = listPitches.filter(p => p.status === 'pending');
            return (
              <div 
                key={listing.id}
                className="bg-[#121110] border border-surface-variant hover:border-gold-accent rounded-lg p-6 flex flex-col cursor-pointer transition-all group relative overflow-hidden h-64"
                onClick={() => setViewingDossierId(listing.id)}
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-gold-accent transition-colors"></div>
                <div className="flex justify-between items-start mb-auto">
                  <div className="pr-4">
                    <h3 className="font-working-title text-xl text-on-surface mb-1 group-hover:underline">{listing.title || 'Untitled Property'}</h3>
                    <p className="text-xs text-text-secondary">{listing.location || 'Location missing'}</p>
                  </div>
                  <div className="relative w-10 h-10 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                      <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${listing.signals?.completeness?.replace('%','') || 100}, 100`} strokeWidth="3"></path>
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t border-surface-variant pt-4 mt-4">
                  <div>
                    <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Active Inquiries</span>
                    <span className={`font-data-tabular text-lg ${pendingPitches.length > 0 ? 'text-gold-accent font-bold' : 'text-text-secondary'}`}>
                      {pendingPitches.length}
                    </span>
                  </div>
                  <div>
                    <span className="block font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">Profile Views</span>
                    <span className="font-data-tabular text-lg text-text-primary">New</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 2 - PROPERTY DOSSIER WORKSPACE ---
  return (
    <div className="max-w-[1200px] mx-auto py-4 animate-[fadeIn_0.3s_ease]">
      
      {/* Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
        <div>
          {myListings.length > 1 && (
            <button 
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
              onClick={() => setViewingDossierId(null)}
            >
              ← Back to Active Files
            </button>
          )}
          <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">Property Dossier</span>
          <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">{activeListing.title || 'Untitled Property'}</h1>
        </div>
        <div className="flex gap-3">
           <button 
             className="border border-surface-variant text-text-secondary hover:text-on-surface hover:border-text-secondary font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
             onClick={() => {
               if(window.confirm("Withdraw this property dossier from the market? Brokers will no longer see it.")) {
                 closeListing(activeListing.id);
               }
             }}
           >
             Withdraw
           </button>
           <button 
             className="border border-gold-accent text-gold-accent hover:bg-gold-accent/10 font-working-title font-bold px-4 py-2 rounded transition-all text-sm"
             onClick={() => setShowWizard('edit')}
           >
             Edit Workspace
           </button>
           <Link href={`/property/${activeListing.id}`} className="bg-gold-accent text-background font-working-title font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm">
             View Public File
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Col: Workspace Intelligence */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Listing Health</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path className="text-surface-variant" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                  <path className="text-gold-accent" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${activeListing.signals?.completeness?.replace('%','') || 100}, 100`} strokeWidth="4"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-data-tabular font-bold text-sm text-text-primary">{activeListing.signals?.completeness || '100%'}</span>
                </div>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                A completeness score of 85%+ guarantees Priority Ranking in Broker feeds.
              </p>
            </div>
          </div>

          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Engagement Analytics</h3>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-text-primary">Profile Views</span>
                <span className="font-data-tabular text-lg font-bold text-on-surface">New</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-md text-text-primary">Saved to Archives</span>
                <span className="font-data-tabular text-lg font-bold text-on-surface">—</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-md text-text-primary">Total Inquiries</span>
                <span className="font-data-tabular text-lg font-bold text-gold-accent">{incomingPitches.length}</span>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-4 text-center">Analytics update every 12 hours.</p>
          </div>
        </div>

        {/* Right Col: Active Inquiries (Pitches) */}
        <div className="md:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              Active Inquiries
            </h2>
            {incomingPitches.filter(p => p.status === 'pending').length > 0 && (
              <span className="bg-gold-accent/10 text-gold-accent font-label-caps text-[10px] px-2 py-1 rounded-sm tracking-wider">
                {incomingPitches.filter(p => p.status === 'pending').length} PENDING
              </span>
            )}
          </div>

          {incomingPitches.length === 0 ? (
             <div className="bg-[#121110] border border-surface-variant rounded-lg p-12 text-center flex flex-col items-center">
               <span className="text-4xl mb-4 opacity-50">📡</span>
               <p className="font-working-title text-lg text-on-surface mb-2">No inquiries yet.</p>
               <p className="text-sm text-text-secondary max-w-sm">
                 Brokers are reviewing your dossier. Listings with extensive media galleries receive inquiries 4× faster.
               </p>
               {!activeListing?.hasMedia && (
                 <button className="mt-6 border border-gold-accent text-gold-accent font-working-title px-6 py-2 rounded hover:bg-gold-accent/10 transition-colors" onClick={() => setShowWizard('edit')}>
                   Add Media Gallery
                 </button>
               )}
             </div>
          ) : (
            <div className="flex flex-col gap-4">
              {incomingPitches.map(pitch => (
                <div key={pitch.id} className="bg-[#121110] border border-surface-variant rounded-lg p-6 shadow-xl relative">
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${pitch.status === 'accepted' ? 'bg-success' : pitch.status === 'declined' ? 'bg-error' : 'bg-gold-accent'}`}></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-alt border border-surface-variant flex items-center justify-center font-bold text-lg text-on-surface">
                        {pitch.brokerName.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-working-title text-lg text-on-surface flex items-center gap-2">
                          {pitch.brokerName}
                          <span className="bg-gold-accent/10 text-gold-accent text-[9px] font-label-caps px-1.5 py-0.5 rounded tracking-widest">PRC VERIFIED</span>
                        </h4>
                        <span className="text-xs text-text-secondary">{pitch.brokerFirm}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-label-caps text-[10px] tracking-widest text-text-muted uppercase block">{pitch.timeRemaining}</span>
                      {pitch.status === 'pending' && <span className="text-[9px] text-gold-accent">AWAITING RESPONSE</span>}
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] p-4 rounded border border-surface-alt relative mb-4">
                    <p className="font-body-md text-sm text-text-secondary italic leading-relaxed">
                      {pitch.message}
                    </p>
                  </div>
                  
                  {pitch.status === 'pending' && (
                    <div className="flex gap-3">
                      <button 
                        className="flex-1 bg-surface border border-surface-variant hover:border-error hover:text-error text-text-primary font-working-title text-sm font-bold py-3 rounded transition-colors" 
                        onClick={() => updatePitchStatus(pitch.id, 'declined')}
                      >
                        Decline
                      </button>
                      <button 
                        className="flex-1 bg-gold-accent text-background font-working-title text-sm font-bold py-3 rounded hover:opacity-90 transition-opacity shadow-lg" 
                        onClick={() => updatePitchStatus(pitch.id, 'accepted')}
                      >
                        Accept Inquiry
                      </button>
                    </div>
                  )}
      
                  {pitch.status === 'accepted' && pitch.brokerContact && (
                    <div className="mt-2 p-4 bg-success/5 border border-success/20 rounded">
                      <div className="font-label-caps text-[10px] tracking-widest text-success uppercase mb-3">Intelligence Unlocked</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[10px] text-text-secondary mb-1">Direct Phone</span>
                          <span className="font-working-title text-on-surface text-sm">{pitch.brokerContact.phone}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] text-text-secondary mb-1">Direct Email</span>
                          <span className="font-working-title text-on-surface text-sm">{pitch.brokerContact.email}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {pitch.status === 'declined' && (
                    <div className="mt-2 p-3 bg-surface-alt border border-surface-variant rounded text-center">
                      <span className="text-xs text-text-secondary font-working-title uppercase tracking-wider">Inquiry Declined</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
