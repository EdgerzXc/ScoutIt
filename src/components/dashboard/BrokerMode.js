"use client";

import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";
import { Lock } from "lucide-react";

export default function BrokerMode() {
  const { connects, listings, pitches, sendPitch, updatePitchStatus } = useDashboard();
  
  const [pitchingListing, setPitchingListing] = useState(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [pitchError, setPitchError] = useState("");
  
  // Notification and ID Card State
  const [showNotification, setShowNotification] = useState(true);
  const [showIdCard, setShowIdCard] = useState(false);
  
  // New Deal File Workspace State
  const [activeDealId, setActiveDealId] = useState(null);
  
  // For the scratchpad notes in the deal file
  const [dealNotes, setDealNotes] = useState({});

  // Filter pipeline data
  const myPitches = pitches.filter(p => p.isCurrentUserBroker);
  const pending = myPitches.filter(p => p.status === 'pending');
  const accepted = myPitches.filter(p => p.status === 'accepted');

  // Feed = listings that we haven't pitched to yet
  const pitchedListingIds = myPitches.map(p => p.listingId);
  const feed = listings.filter(l => !pitchedListingIds.includes(l.id));

  // Some deals (e.g. owner-initiated handshakes) carry no title — never show a raw UUID.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const dealTitle = (deal) => {
    if (deal.title && !UUID_RE.test(deal.title)) return deal.title;
    const prop = listings.find(l => l.id === deal.listingId) || deal.targetListing;
    return prop?.title || 'Unknown Property';
  };

  const handleOpenPitchModal = (listing) => {
    setPitchingListing(listing);
    setPitchError("");
    setPitchMessage("Hi, I have a client looking for this exact profile. I'd love to arrange an exclusive viewing.");
  };

  const handleSendPitch = () => {
    if (!pitchingListing) return;
    const success = sendPitch(pitchingListing.id, pitchMessage);
    if (success) {
      setPitchingListing(null);
    } else {
      setPitchError("Not enough Connects. You need 1 Connect to send this pitch.");
    }
  };

  const handleSaveNote = (dealId, note) => {
    setDealNotes(prev => ({ ...prev, [dealId]: note }));
  };

  // --- VIEW: LAYER 2 - DEAL FILE WORKSPACE ---
  if (activeDealId) {
    const deal = myPitches.find(p => p.id === activeDealId);
    if (!deal) {
      setActiveDealId(null);
      return null;
    }
    const property = listings.find(l => l.id === deal.listingId) || deal.targetListing;
    const notes = dealNotes[deal.id] || "Client requires Vastu compliance. Confirm facing direction with owner before site visit.";

    return (
      <div className="max-w-[1200px] mx-auto py-4 animate-[fadeIn_0.3s_ease]">
        {/* Workspace Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
          <div>
            <button 
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
              onClick={() => setActiveDealId(null)}
            >
              ← Back to Opportunity Files
            </button>
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">Opportunity File</span>
            <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">Deal: {property?.title || 'Unknown Property'}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded text-xs font-bold font-working-title tracking-wider uppercase border
              ${deal.status === 'accepted' ? 'bg-success/10 text-success border-success/30' : 
                deal.status === 'declined' ? 'bg-error/10 text-error border-error/30' : 
                deal.status === 'invited' ? 'bg-[#E8AE3C]/10 text-[#E8AE3C] border-[#E8AE3C]/30' :
                'bg-gold-accent/10 text-gold-accent border-gold-accent/30'}`}
            >
              Status: {deal.status === 'invited' ? 'Incoming Handshake' : deal.status}
            </div>
            {deal.status === 'pending' && (
              <button 
                className="border border-surface-variant text-text-secondary hover:text-error hover:border-error font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                onClick={() => {
                  updatePitchStatus(deal.id, 'declined'); // Brokers can withdraw
                  setActiveDealId(null);
                }}
              >
                Withdraw Pitch
              </button>
            )}
            {deal.status === 'invited' && (
              <div className="flex gap-2">
                <button 
                  className="border border-surface-variant text-text-secondary hover:text-error hover:border-error font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                  onClick={() => {
                    updatePitchStatus(deal.id, 'declined');
                    setActiveDealId(null);
                  }}
                >
                  Decline
                </button>
                <button 
                  className="bg-[#E8AE3C] text-background hover:opacity-90 font-working-title font-bold px-4 py-2 rounded transition-colors text-sm"
                  onClick={() => {
                    updatePitchStatus(deal.id, 'accepted');
                  }}
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Col: Connected Listing & Owner Profile */}
          <div className="md:col-span-4 flex flex-col gap-6">
            {/* Connected Listing */}
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Connected Asset</h3>
              <div className="flex flex-col gap-2">
                <span className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase">{property?.type || 'Property'}</span>
                <Link href={`/property/${deal.listingId}`} className="font-working-title text-xl text-on-surface hover:text-gold-accent hover:underline transition-colors">
                  {property?.title || 'View Listing'}
                </Link>
                <span className="text-sm text-text-secondary">{property?.loc || property?.location || 'Location details restricted'}</span>
              </div>
              <div className="mt-6 pt-4 border-t border-surface-variant">
                <Link href={`/property/${deal.listingId}`} className="text-sm font-working-title text-gold-accent flex items-center gap-2 hover:underline">
                  Open Property Dossier <span>→</span>
                </Link>
              </div>
            </div>

            {/* Owner Intelligence */}
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Owner Intelligence</h3>
              
              {deal.status === 'accepted' ? (
                <div className="flex flex-col gap-4">
                  <div className="p-3 bg-success/5 border border-success/20 rounded">
                    <span className="block text-[10px] tracking-widest text-success uppercase mb-2 font-label-caps">Unlocked Contact Info</span>
                    <div className="mb-2">
                      <span className="text-xs text-text-secondary block">Phone</span>
                      <span className="font-working-title text-on-surface">{deal.ownerContact?.phone || "+63 917 555 1234"}</span>
                    </div>
                    <div>
                      <span className="text-xs text-text-secondary block">Email</span>
                      <span className="font-working-title text-on-surface">{deal.ownerContact?.email || "owner@example.com"}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-text-secondary">Response Speed</span>
                    <span className="text-on-surface font-data-tabular">Fast (&lt; 2 hrs)</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-3 opacity-50"><Lock strokeWidth={1.5} size="1em" /></span>
                  <p className="text-sm text-text-secondary">Owner contact details are locked. They will be revealed immediately if the owner accepts your pitch.</p>
                  <div className="w-full mt-4 bg-surface-alt p-3 rounded text-left">
                     <span className="block text-[10px] text-text-secondary uppercase tracking-widest mb-1">Public Metrics</span>
                     <div className="flex justify-between text-sm">
                       <span className="text-text-primary">Platform Tenure</span>
                       <span className="font-data-tabular">New Owner</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Thread & Intelligence Notes */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            {/* The Pitch Record */}
            <div className="card-atmosphere rounded-lg overflow-hidden flex flex-col">
              <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
                <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">
                  {deal.status === 'invited' ? 'Message from Owner' : 'Initial Pitch Sent'}
                </h3>
                <span className="font-data-tabular text-xs text-text-muted">{deal.timeRemaining || 'Just now'}</span>
              </div>
              <div className="p-6">
                <p className="font-body-md text-base text-on-surface leading-relaxed">
                  {deal.message}
                </p>
                {deal.status === 'invited' && (
                   <p className="text-sm text-gold-accent mt-4 italic font-working-title">
                     The owner has requested your representation. Accepting this handshake will unlock their contact information immediately.
                   </p>
                )}
              </div>
            </div>

            {/* Private Intelligence Scratchpad */}
            <div className="card-atmosphere-gold rounded-lg overflow-hidden flex flex-col shadow-lg">
              <div className="bg-gold-accent/5 border-b border-gold-accent/20 p-4 flex justify-between items-center">
                <h3 className="font-label-caps text-xs tracking-widest text-gold-accent uppercase flex items-center gap-2">
                  <span>📝</span> Private Deal Notes
                </h3>
                <span className="font-label-caps text-[9px] text-text-muted uppercase">Only visible to you</span>
              </div>
              <div className="p-1">
                <textarea 
                  className="w-full bg-transparent p-5 text-on-surface min-h-[200px] focus:outline-none placeholder:text-surface-variant font-body-md leading-relaxed resize-y"
                  placeholder="Capture client requirements, internal tracking IDs, or next action steps here..."
                  value={dealNotes[deal.id] !== undefined ? dealNotes[deal.id] : notes}
                  onChange={(e) => handleSaveNote(deal.id, e.target.value)}
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 1 - COMMAND CENTER (Opportunity Grid & Feed) ---
  return (
    <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease] relative">
      
      {/* Notification Banner */}
      {showNotification && !activeDealId && !showIdCard && (
        <div className="bg-gold-accent/10 border border-gold-accent/30 rounded-lg p-4 mb-6 flex items-start sm:items-center justify-between gap-4 animate-[slideDown_0.4s_ease]">
          <div className="flex gap-4 items-start sm:items-center">
            <div className="w-8 h-8 rounded-full bg-gold-accent flex items-center justify-center text-background text-lg shrink-0">✨</div>
            <div>
              <h4 className="font-working-title text-on-surface text-sm font-bold">New Feature: Official Verified ID Card</h4>
              <p className="text-text-secondary text-xs mt-1">You can now generate and download your official ScoutIt Verified Broker ID card for marketing use.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => { setShowIdCard(true); setShowNotification(false); }}
              className="text-xs font-bold text-background bg-gold-accent px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Generate ID
            </button>
            <button onClick={() => setShowNotification(false)} className="text-text-muted hover:text-on-surface p-2">✕</button>
          </div>
        </div>
      )}

      {/* ID Card Generation Overlay */}
      {showIdCard && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-md px-4 overflow-y-auto pt-20 pb-10">
          <div className="w-full max-w-2xl bg-[#0d0d0d] border border-surface-variant rounded-xl shadow-[0_0_50px_rgba(232,174,60,0.1)] flex flex-col relative animate-[scaleUp_0.4s_ease-out]">
            <button 
              onClick={() => setShowIdCard(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-on-surface text-xl z-20"
            >
              ✕
            </button>
            
            <div className="p-8 pb-0 text-center">
              <h2 className="font-headline-editorial text-3xl text-on-surface">Verified Identity</h2>
              <p className="text-text-secondary text-sm mt-2 mb-8">Download or screenshot this card to verify your status with clients.</p>
            </div>

            {/* The Actual ID Card Design */}
            <div className="mx-auto w-full max-w-[400px] mb-8 bg-[#121110] rounded-2xl border border-[rgba(232,174,60,0.4)] relative overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
              {/* Glass Glare */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent z-10 pointer-events-none"></div>
              
              {/* Header */}
              <div className="bg-[#E8AE3C] p-4 flex justify-between items-center relative z-20">
                <span className="font-display-md text-background text-xl font-bold tracking-tighter">S<span className="font-normal">cout</span>IT</span>
                <span className="font-mono text-[10px] text-background/80 tracking-widest font-bold">VERIFIED ADVISOR</span>
              </div>
              
              {/* Body */}
              <div className="p-6 relative z-20">
                <div className="flex gap-6 items-center mb-6">
                  <div className="w-20 h-20 rounded-full border-2 border-[#E8AE3C] bg-surface-alt overflow-hidden flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80')] bg-cover bg-center"></div>
                  </div>
                  <div>
                    <h3 className="font-headline-editorial text-2xl text-on-surface mb-1">Miguel Torres</h3>
                    <p className="font-working-title text-text-secondary text-xs tracking-wider uppercase">Solar Partner</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-surface-alt p-3 rounded border border-surface-variant">
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">Scout Rating</span>
                    <span className="text-on-surface font-mono font-bold text-lg">94/100</span>
                  </div>
                  <div className="bg-surface-alt p-3 rounded border border-surface-variant">
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">PRC License</span>
                    <span className="text-on-surface font-mono font-bold text-sm">#0019284</span>
                  </div>
                </div>

                <div className="border-t border-surface-variant pt-4 flex justify-between items-end">
                  <div>
                    <span className="block text-[8px] text-text-muted font-mono uppercase tracking-widest mb-1">Valid Until</span>
                    <span className="text-text-secondary font-mono text-xs">DEC 2026</span>
                  </div>
                  {/* Mock QR Code Pattern */}
                  <div className="w-12 h-12 bg-white rounded p-1 opacity-90">
                    <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik00IDRoMTB2MTBINGV6bTEyIDB2MmgtdjJoLXYyaDJoMnYyaDJ2Mmgydi0yaDJ2LThoMnd6IiBmaWxsPSIjMDAwIi8+PC9zdmc+')] bg-cover bg-no-repeat"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-surface-variant bg-surface-alt flex justify-center rounded-b-xl gap-4">
              <button 
                onClick={() => setShowIdCard(false)}
                className="px-6 py-3 border border-surface-variant rounded text-text-secondary font-working-title text-sm hover:text-on-surface transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-6 py-3 bg-[#E8AE3C] text-background rounded font-working-title text-sm font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <span>🖨️</span> Print / Save to PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Draft Pitch Modal Overlay */}
      {pitchingListing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-lg card-atmosphere rounded-lg shadow-2xl p-6 animate-[slideUp_0.4s_ease-out]">
            <h3 className="font-headline-editorial text-2xl text-on-surface mb-2">Draft Pitch</h3>
            <p className="text-sm text-text-secondary mb-6">Pitching <span className="font-bold text-gold-accent">{pitchingListing.title}</span></p>
            
            <textarea 
              className="w-full bg-surface-alt border border-surface-variant rounded p-4 text-on-surface min-h-[160px] focus:outline-none focus:border-gold-accent transition-colors"
              value={pitchMessage}
              onChange={(e) => setPitchMessage(e.target.value)}
            />
            
            {pitchError && (
              <div className="mt-3 text-error text-sm bg-error/10 border border-error/30 rounded px-3 py-2">{pitchError}</div>
            )}
            <div className="flex items-center justify-between mt-6">
              <div className="text-gold-accent font-data-tabular text-sm flex items-center gap-2">
                <span>◈</span> Cost: 1 Connect · You have {connects}
              </div>
              <div className="flex gap-3">
                <button 
                  className="px-4 py-2 border border-surface-variant text-text-secondary rounded hover:text-on-surface hover:bg-surface-container transition-colors"
                  onClick={() => setPitchingListing(null)}
                >
                  Cancel
                </button>
                <button 
                  className="bg-gold-accent text-background font-working-title px-6 py-2 rounded font-bold hover:opacity-90 transition-opacity"
                  onClick={handleSendPitch}
                >
                  Send Pitch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile / tablet header — the desktop action bar below is lg-only, so without this the phone view had no title or pipeline context */}
      <header className="lg:hidden pt-2 pb-5 mb-6 border-b border-surface-variant flex items-end justify-between gap-4">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase text-[10px] mb-1 block">Command Center</span>
          <h2 className="font-headline-editorial text-2xl text-on-surface">Broker Intelligence</h2>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-[9px] font-label-caps uppercase tracking-widest text-text-secondary">Deals Won</span>
          <span className="text-on-surface font-data-tabular text-lg font-bold">{accepted.length}</span>
        </div>
      </header>

      {/* Action Bar */}
      <header className="py-md lg:py-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background sticky top-0 lg:top-auto z-10 border-b border-surface-variant mb-8 hidden lg:flex">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Command Center</span>
          <h2 className="font-headline-editorial text-headline-editorial text-on-surface text-4xl">Broker Intelligence</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="block text-[10px] font-label-caps uppercase tracking-widest text-text-secondary">Pipeline Health</span>
            <span className="text-on-surface font-working-title text-sm">{accepted.length} Deals Won</span>
          </div>
          <button 
            className="border border-gold-accent text-gold-accent font-working-title px-6 py-3 rounded text-sm font-bold hover:bg-gold-accent hover:text-background transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)]"
            onClick={() => document.getElementById('broker-feed')?.scrollIntoView({ behavior: 'smooth' })}
          >
            + Find Opportunities
          </button>
        </div>
      </header>

      {/* High-Density Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-12">
        
        {/* Left Column: Active Opportunities */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <div className="flex justify-between items-end border-b border-surface-variant pb-2">
            <h3 className="font-working-title text-xl text-on-surface">Active Deal Files</h3>
            <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase">{myPitches.length} Total tracked</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myPitches.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-surface-variant rounded-lg flex flex-col items-center">
                <span className="text-3xl mb-4 opacity-50">📂</span>
                <p className="text-on-surface font-working-title mb-2">Your CRM is empty.</p>
                <p className="text-text-secondary text-sm">Find properties in the intelligence feed to initiate a deal file.</p>
              </div>
            )}
            
            {myPitches.map((deal) => {
              const pStatus = deal.status;
              const isAccepted = pStatus === 'accepted';
              const isDeclined = pStatus === 'declined';
              return (
                <div 
                  key={deal.id} 
                  className={`card-atmosphere hov-glow rounded-lg p-5 flex flex-col cursor-pointer transition-all group relative overflow-hidden h-48 ${isDeclined ? 'opacity-60 grayscale' : ''}`}
                  onClick={() => setActiveDealId(deal.id)}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${isAccepted ? 'bg-success' : isDeclined ? 'bg-error' : 'bg-surface-variant group-hover:bg-gold-accent'}`}></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <span className={`font-label-caps text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded ${isAccepted ? 'bg-success/10 text-success' : isDeclined ? 'bg-error/10 text-error' : pStatus === 'invited' ? 'bg-[#E8AE3C]/10 text-[#E8AE3C]' : 'bg-surface-alt text-text-secondary'}`}>
                      {pStatus === 'invited' ? 'Incoming Handshake' : pStatus}
                    </span>
                    <span className="text-[10px] text-text-muted font-data-tabular">{deal.timeRemaining || 'Just now'}</span>
                  </div>
                  
                  <div className="mt-2 mb-auto pr-2">
                    <h4 className="font-working-title text-base text-on-surface group-hover:underline line-clamp-1">{dealTitle(deal)}</h4>
                    <p className="text-xs text-text-secondary mt-1">{deal.loc || 'Location details hidden'}</p>
                  </div>
                  
                  <div className="border-t border-surface-variant pt-3 mt-4 flex justify-between items-center text-xs">
                    <span className="text-gold-accent flex items-center gap-1 group-hover:gap-2 transition-all font-working-title">
                      Open Workspace <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Feed */}
        <div id="broker-feed" className="lg:w-1/3 flex flex-col gap-6 mt-8 lg:mt-0 scroll-mt-20">
          <div className="flex justify-between items-end border-b border-surface-variant pb-2">
            <h3 className="font-working-title text-xl text-on-surface">Market Intelligence Feed</h3>
            <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase">{feed.length} Targets</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-12 md:pb-0 hide-scrollbar">
            {feed.length === 0 && (
              <div className="text-center p-8 text-text-muted border border-surface-variant rounded">
                You have pitched all available properties in the market.
              </div>
            )}
            {feed.map((item) => (
              <div key={item.id} className="card-atmosphere hov-card p-5 rounded-lg transition-colors group relative">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-gold-accent font-label-caps text-[10px] tracking-widest uppercase">{item.type || 'Property'}</span>
                  <span className="text-text-secondary text-[10px] font-data-tabular bg-surface-alt px-1.5 py-0.5 rounded">{item.time || 'New'}</span>
                </div>
                
                <h4 className="font-working-title text-on-surface text-lg mb-1 line-clamp-1">
                  <Link href={`/property/${item.id}`} className="hover:text-gold-accent hover:underline transition-colors block">
                    {item.title}
                  </Link>
                </h4>
                <div className="text-text-secondary text-xs line-clamp-2 leading-relaxed">{item.desc}</div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-[#0a0a0a] rounded border border-surface-variant text-center">
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-1 font-label-caps">Owner Tenure</div>
                    <div className="text-on-surface font-data-tabular text-xs">{item.signals?.accountAge || 'New'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-1 font-label-caps">Completeness</div>
                    <div className="text-on-surface font-data-tabular text-xs">{item.signals?.completeness || '100%'}</div>
                  </div>
                </div>
                
                <button 
                  className="mt-4 w-full border border-gold-accent text-gold-accent font-working-title text-sm py-3 rounded hover:bg-gold-accent hover:text-background transition-colors font-bold shadow-sm"
                  onClick={() => handleOpenPitchModal(item)}
                >
                  Open Deal File (1 Connect)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
