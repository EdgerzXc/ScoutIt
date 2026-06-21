"use client";

import { useState, useEffect } from "react";
import LiveEditorWorkspace from "./LiveEditorWorkspace";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";

export default function OwnerMode() {
  const { listings, pitches, updatePitchStatus, addListing, addConciergeListing, updateListing, closeListing, currentUser, inviteBroker, connects } = useDashboard();
  const firstName = currentUser?.name ? currentUser.name.split(" ")[0] : "";
  const [showWizard, setShowWizard] = useState(false); // false | 'select_mode' | 'live_editor' | 'concierge' | 'edit'
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Check if current user has any listings (match the logged-in owner's id)
  const myListings = listings.filter(l => currentUser && l.ownerId === currentUser.id);
  const hasListing = myListings.length > 0;

  // New Dossier State
  const [viewingDossierId, setViewingDossierId] = useState(null);
  const [inviteName, setInviteName] = useState("");

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

  const activeListing = myListings.find(l => l.id === viewingDossierId) || myListings[0];

  // Mobile bottom-bar primary action (+ List) opens the wizard
  useEffect(() => {
    const onPrimary = (e) => {
      if (e.detail?.mode === "owner") setShowWizard('select_mode');
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  // "List Property Now" from onboarding
  useEffect(() => {
    if (localStorage.getItem("scoutit_open_wizard") === "1") {
      localStorage.removeItem("scoutit_open_wizard");
      setShowWizard('select_mode');
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

  if (showWizard === 'live_editor' || showWizard === 'edit') {
    return <LiveEditorWorkspace 
      onPublish={handlePublish} 
      onClose={() => setShowWizard(false)} 
      isEditing={showWizard === 'edit'} 
      initialData={showWizard === 'edit' ? activeListing : null} 
    />;
  }

  if (showWizard === 'select_mode') {
    return (
      <div className="max-w-[800px] mx-auto py-lg animate-[fadeIn_0.3s_ease]">
        <button onClick={() => setShowWizard(false)} className="text-text-secondary hover:text-gold-accent mb-8 font-working-title">← Back to Dashboard</button>
        <h1 className="font-display-md text-4xl text-text-primary mb-2">How would you like to create this listing?</h1>
        <p className="text-text-secondary mb-8">Choose your preferred workflow.</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div 
            className="bg-[#121110] border border-surface-variant rounded-lg p-8 hover:border-gold-accent transition-colors cursor-pointer group relative overflow-hidden"
            onClick={() => setShowWizard('concierge')}
          >
             <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-gold-accent transition-colors"></div>
             <h3 className="font-working-title text-2xl text-on-surface mb-2">Concierge AI</h3>
             <p className="text-sm text-text-secondary mb-4 leading-relaxed">Upload your existing pitch deck or PDF flyer. Our Council AI will extract the data and structure the dossier for your review.</p>
             <span className="text-gold-accent font-label-caps text-[10px] tracking-widest border border-gold-accent/30 bg-gold-accent/10 px-2 py-1 rounded">RECOMMENDED FOR PORTFOLIOS</span>
          </div>

          <div 
            className="bg-[#121110] border border-surface-variant rounded-lg p-8 hover:border-text-primary transition-colors cursor-pointer group relative overflow-hidden"
            onClick={() => setShowWizard('live_editor')}
          >
             <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant group-hover:bg-surface-alt transition-colors"></div>
             <h3 className="font-working-title text-2xl text-on-surface mb-2">Live Editor Workspace</h3>
             <p className="text-sm text-text-secondary mb-4 leading-relaxed">Build your listing manually using our step-by-step editor. Best if you don't have a deck and are starting from scratch.</p>
          </div>
        </div>
      </div>
    );
  }

  if (showWizard === 'concierge') {
    return (
      <div className="max-w-[600px] mx-auto py-lg animate-[fadeIn_0.3s_ease]">
        <button onClick={() => setShowWizard('select_mode')} className="text-text-secondary hover:text-gold-accent mb-8 font-working-title">← Back</button>
        <h1 className="font-display-md text-4xl text-text-primary mb-2">Upload Pitch Deck</h1>
        <p className="text-text-secondary mb-8">Drop your PDF here. The Council AI will parse the details and prepare a draft.</p>
        
        <div className="bg-[#121110] border-2 border-dashed border-surface-variant rounded-lg p-12 text-center flex flex-col items-center relative transition-colors hover:border-gold-accent/50">
          <span className="text-4xl mb-4">📄</span>
          {selectedFile ? (
            <div className="mb-6 w-full">
              <div className="bg-surface-alt p-4 rounded border border-surface-variant flex items-center justify-between">
                <span className="text-on-surface font-working-title text-sm truncate">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="text-xs font-bold text-error hover:underline">Remove</button>
              </div>
            </div>
          ) : (
            <div className="mb-6 w-full">
              <p className="text-text-secondary mb-4">Drag and drop your PDF, or click to browse.</p>
              <input type="file" accept=".pdf" className="hidden" id="pdf-upload" onChange={(e) => setSelectedFile(e.target.files[0])} />
              <label htmlFor="pdf-upload" className="cursor-pointer border border-gold-accent text-gold-accent font-working-title px-6 py-2 rounded hover:bg-gold-accent/10 transition-colors inline-block">
                Select File
              </label>
            </div>
          )}

          <button 
            className="w-full bg-gold-accent text-background font-working-title font-bold px-6 py-3 rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mt-4"
            disabled={!selectedFile}
            onClick={async () => {
              if (selectedFile) {
                await addConciergeListing(selectedFile.name);
                setSelectedFile(null);
                setShowWizard(false);
              }
            }}
          >
            Start AI Drafting
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: ZERO LISTINGS ---
  if (!hasListing) {
    return (
      <div className="max-w-[1200px] mx-auto pt-16 md:pt-0 py-lg px-4 md:px-0 animate-[fadeIn_0.4s_ease]">
        <div className="mb-sm">
          <h1 className="font-display-md text-3xl md:text-5xl text-text-primary mb-2">{firstName ? `Welcome back, ${firstName}` : "Welcome back"}</h1>
          <p className="text-text-secondary font-body-md text-sm md:text-base">Your workspace is empty.</p>
        </div>
        <div className="bg-[#0a0a0a] rounded-lg border border-surface-variant p-8 md:p-lg flex flex-col gap-6 relative overflow-hidden items-center justify-center text-center py-20 md:py-32 mt-8">
          <h3 className="font-display-md text-2xl md:text-3xl text-on-surface">Create your first Property File</h3>
          <p className="text-text-secondary max-w-md text-sm md:text-base">Our wizard walks you through building a polished, trustworthy listing in under 10 minutes.</p>
          <button className="bg-gold-accent text-background font-working-title px-6 py-3 md:px-8 md:py-4 rounded hover:bg-surface-tint transition-colors text-base md:text-lg font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(212,175,55,0.2)] mt-2" onClick={() => setShowWizard('select_mode')}>
            Start My First Listing
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
            onClick={() => setShowWizard('select_mode')}
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
                
                
                {listing.pipelineStatus === 'ai_drafting' ? (
                  <div className="border-t border-surface-variant pt-4 mt-4 h-full flex flex-col justify-center">
                    <div className="bg-surface-alt/50 p-2.5 rounded border border-surface-variant flex items-center justify-center gap-2 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gold-accent/5 opacity-50 animate-pulse"></div>
                      <span className="animate-spin text-gold-accent text-xs">⚙️</span>
                      <span className="text-[10px] text-text-secondary font-working-title uppercase tracking-widest z-10">COUNCIL AI IS DRAFTING...</span>
                    </div>
                  </div>
                ) : (
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
                )}
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
             className="border border-gold-accent text-gold-accent hover:bg-gold-accent/10 font-working-title font-bold px-4 py-2 rounded transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
             disabled={activeListing.pipelineStatus === 'ai_drafting'}
             onClick={() => setShowWizard('edit')}
           >
             Edit Workspace
           </button>
           {activeListing.pipelineStatus !== 'ai_drafting' && (
             <Link href={`/property/${activeListing.id}`} className="bg-gold-accent text-background font-working-title font-bold px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm">
               View Public File
             </Link>
           )}
        </div>
      </div>

      {activeListing.pipelineStatus === 'ai_drafting' && (
        <div className="bg-[#1a1814] border border-gold-accent/30 rounded-lg p-5 mb-8 flex items-start gap-4">
           <span className="text-2xl mt-1">🤖</span>
           <div>
             <h4 className="font-working-title text-gold-accent text-lg mb-1">AI Drafting in Progress</h4>
             <p className="text-sm text-text-secondary leading-relaxed">
               Your pitch deck <strong className="text-on-surface">{activeListing.details?.source_pdf}</strong> is currently being analyzed. The Council AI is extracting facts and structuring the dossier. This process usually takes 2-5 minutes. We will notify you when it's ready for your final review.
             </p>
           </div>
        </div>
      )}

      <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 ${activeListing.pipelineStatus === 'ai_drafting' ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Left Col: Workspace Intelligence */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Listing Health</h3>
            {activeListing.pipelineStatus === 'ai_drafting' ? (
               <div className="flex flex-col items-center justify-center py-4 opacity-50">
                 <span className="text-3xl mb-2 animate-pulse">⏳</span>
                 <p className="text-xs text-center font-working-title tracking-widest text-text-muted">AWAITING AI ANALYSIS</p>
               </div>
            ) : (
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
            )}
          </div>

          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Engagement Analytics</h3>
            {activeListing.pipelineStatus === 'ai_drafting' ? (
               <div className="flex flex-col items-center justify-center py-4 opacity-50">
                 <p className="text-xs text-center text-text-secondary">Metrics will activate once the property is published.</p>
               </div>
            ) : (
               <>
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
               </>
            )}
          </div>
        </div>

        {/* Right Col: Active Inquiries (Pitches) */}
        <div className="md:col-span-8 flex flex-col">
          {/* Invite an advisor — owner-initiated handshake, spends 1 Connect */}
          <div className="bg-[#121110] border border-surface-variant rounded-lg p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-working-title text-base text-on-surface">Invite an advisor</h3>
              <span className="font-label-caps text-[10px] tracking-widest text-gold-accent">◈ 1 CONNECT · {connects} LEFT</span>
            </div>
            <p className="text-xs text-text-secondary mb-3">You control who represents this property. Sending a handshake spends 1 Connect — whether or not they accept.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className="flex-1 bg-surface border border-surface-variant rounded px-4 py-3 text-on-surface text-sm focus:outline-none focus:border-gold-accent transition-colors"
                type="text"
                placeholder="Broker name or PRC #"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
              />
              <button
                type="button"
                className="bg-gold-accent text-background font-working-title font-bold px-5 py-3 rounded hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                disabled={!inviteName.trim() || connects < 1}
                onClick={async () => { const ok = await inviteBroker(activeListing.id, inviteName.trim()); if (ok) setInviteName(""); }}
              >
                Send Handshake
              </button>
            </div>
          </div>

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
