"use client";

import { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import Link from "next/link";

export default function BrokerMode() {
  const { connects, listings, pitches, sendPitch } = useDashboard();
  
  const [pitchingListing, setPitchingListing] = useState(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [pitchError, setPitchError] = useState("");


  // Mobile pipeline tab state
  const [activeTab, setActiveTab] = useState('pending');

  // Filter pipeline data
  const myPitches = pitches.filter(p => p.isCurrentUserBroker);
  const pending = myPitches.filter(p => p.status === 'pending');
  const accepted = myPitches.filter(p => p.status === 'accepted');
  const declined = myPitches.filter(p => p.status === 'declined');

  // Feed = listings that we haven't pitched to yet
  const pitchedListingIds = myPitches.map(p => p.listingId);
  const feed = listings.filter(l => !pitchedListingIds.includes(l.id));

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

  return (
    <div className="flex-1 flex flex-col w-full max-w-[1200px] mx-auto animate-[fadeIn_0.4s_ease] relative">
      
      {/* Draft Pitch Modal Overlay */}
      {pitchingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md px-4">
          <div className="w-full max-w-lg bg-surface border border-surface-variant rounded-lg shadow-2xl p-6 animate-[slideUp_0.4s_ease-out]">
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

      {/* Action Bar */}
      <header className="py-md lg:py-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-background sticky top-0 lg:top-auto z-10 border-b border-surface-variant mb-6 hidden lg:flex">
        <div>
          <h2 className="font-headline-editorial text-headline-editorial text-on-surface text-3xl">Broker Dashboard</h2>
          <div className="text-text-secondary font-body-sm text-body-sm mt-1">{pending.length} pending · {accepted.length} accepted · ◈ {connects} Connects available</div>
        </div>
        <div className="flex gap-4 w-full sm:w-auto">
          <button 
            className="flex-1 sm:flex-none border border-gold-accent text-gold-accent font-working-title px-4 py-2 rounded text-sm hover:bg-gold-accent/10 transition-colors"
            onClick={() => document.getElementById('broker-feed')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Find Listings to Pitch
          </button>
        </div>
      </header>

      {/* High-Density Grid Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-gutter broker-gutter">
        {/* Left Column: Pipeline Board */}
        <div className="lg:w-7/12 flex flex-col gap-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-working-title text-working-title text-on-surface">Pitch Pipeline</h3>
            <span className="text-text-secondary text-body-sm font-data-tabular">{myPitches.length} total</span>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden flex border-b border-surface-variant mb-2">
            <button 
              className={`flex-1 py-2 font-label-caps text-[10px] tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'pending' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-secondary'}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending ({pending.length})
            </button>
            <button 
              className={`flex-1 py-2 font-label-caps text-[10px] tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'accepted' ? 'border-success text-success' : 'border-transparent text-text-secondary'}`}
              onClick={() => setActiveTab('accepted')}
            >
              Accepted ({accepted.length})
            </button>
            <button 
              className={`flex-1 py-2 font-label-caps text-[10px] tracking-widest uppercase border-b-2 transition-colors ${activeTab === 'archived' ? 'border-text-secondary text-on-surface' : 'border-transparent text-text-secondary'}`}
              onClick={() => setActiveTab('archived')}
            >
              Archived ({declined.length})
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {/* Pending */}
            <div className={`bg-surface border border-surface-variant rounded flex flex-col h-full ${activeTab !== 'pending' ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-surface-variant bg-surface-alt justify-between items-center hidden md:flex">
                <span className="font-label-caps text-label-caps text-text-secondary">PENDING</span>
                <span className="bg-surface-variant text-on-surface text-xs px-2 py-0.5 rounded-full font-data-tabular">{pending.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-full">
                {pending.map((item) => (
                  <div key={item.id} className="bg-surface-container-low border border-surface-variant rounded p-3 hover:border-gold-accent transition-colors cursor-pointer relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gold-muted rounded-l"></div>
                    <div className="text-on-surface font-working-title text-sm truncate">{item.title}</div>
                    <div className="text-text-secondary text-xs mt-1">{item.loc} • {item.type}</div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-text-secondary font-data-tabular">{item.statusText}</span>
                      <span className="text-xs bg-surface-variant px-1.5 py-0.5 rounded text-on-surface">{item.badgeText}</span>
                    </div>
                  </div>
                ))}
                {pending.length === 0 && (
                  <div className="text-center text-xs text-text-muted mt-4">No pending pitches.</div>
                )}
              </div>
            </div>

            {/* Accepted */}
            <div className={`bg-surface border border-surface-variant rounded flex flex-col h-full ${activeTab !== 'accepted' ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-surface-variant bg-surface-alt justify-between items-center hidden md:flex">
                <span className="font-label-caps text-label-caps text-text-secondary text-accent">ACCEPTED</span>
                <span className="bg-surface-variant text-on-surface text-xs px-2 py-0.5 rounded-full font-data-tabular">{accepted.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-full">
                {accepted.map((item) => (
                  <div key={item.id} className="bg-surface-container-low border border-surface-variant rounded p-3 hover:border-gold-accent transition-colors cursor-pointer relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-success rounded-l"></div>
                    <div className="text-on-surface font-working-title text-sm truncate">{item.title}</div>
                    <div className="text-text-secondary text-xs mt-1">{item.loc} • {item.type}</div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-success font-data-tabular">{item.statusText}</span>
                      <span className="material-symbols-outlined text-success text-sm">check_circle</span>
                    </div>
                  </div>
                ))}
                {accepted.length === 0 && (
                  <div className="text-center text-xs text-text-muted mt-4">No accepted pitches yet.</div>
                )}
              </div>
            </div>

            {/* Declined/Archived */}
            <div className={`bg-surface border border-surface-variant rounded flex flex-col h-full opacity-70 ${activeTab !== 'archived' ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-3 border-b border-surface-variant bg-surface-alt justify-between items-center hidden md:flex">
                <span className="font-label-caps text-label-caps text-text-secondary">ARCHIVED</span>
                <span className="bg-surface-variant text-on-surface text-xs px-2 py-0.5 rounded-full font-data-tabular">{declined.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto space-y-2 max-h-[400px] md:max-h-full">
                {declined.map((item) => (
                  <div key={item.id} className="bg-surface-container-low border border-surface-variant rounded p-3 hover:border-gold-accent transition-colors cursor-pointer relative">
                    <div className="text-on-surface font-working-title text-sm truncate line-through text-text-secondary">{item.title}</div>
                    <div className="text-text-secondary text-xs mt-1">{item.loc} • {item.type}</div>
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-error font-data-tabular">{item.statusText}</span>
                    </div>
                  </div>
                ))}
                {declined.length === 0 && (
                  <div className="text-center text-xs text-text-muted mt-4">No declined pitches.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Feed */}
        <div id="broker-feed" className="lg:w-5/12 flex flex-col gap-4 mt-8 lg:mt-0 scroll-mt-20">
          <div className="flex justify-between items-end mb-2">
            <h3 className="font-working-title text-working-title text-on-surface">New Listings Feed</h3>
            <span className="text-text-secondary text-body-sm font-data-tabular">{feed.length} available</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-12 md:pb-0">
            {feed.length === 0 && (
              <div className="text-center p-8 text-text-muted border border-surface-variant rounded">
                You pitched all available properties. Keep checking back.
              </div>
            )}
            {feed.map((item) => (
              <div key={item.id} className="bg-surface border border-surface-variant p-4 rounded hover:border-surface-variant transition-colors group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className={`${item.tagClass} px-2 py-0.5 rounded text-[10px] font-bold`}>{item.tag}</span>
                    <span className="text-text-secondary text-xs font-data-tabular">{item.time}</span>
                  </div>
                  <span className="text-text-secondary group-hover:text-gold-accent cursor-pointer text-sm">🔖</span>
                </div>
                
                <div className="mt-2 font-working-title text-on-surface text-lg">
                  <Link href={`/property/${item.id}`} className="hover:text-gold-accent hover:underline transition-colors block">
                    {item.title}
                  </Link>
                </div>
                <div className="text-text-secondary text-sm line-clamp-2 mt-1">{item.desc}</div>
                
                <div className="grid grid-cols-3 gap-2 mt-3 p-2 bg-surface-alt rounded border border-surface-variant">
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-0.5">Owner Response</div>
                    <div className={`${item.signals.ownerAgeClass} font-data-tabular text-xs font-bold`}>{item.signals.ownerAge}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-0.5">Owner Since</div>
                    <div className="text-on-surface font-data-tabular text-xs">{item.signals.accountAge || '—'}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-text-secondary uppercase tracking-wider mb-0.5">Completeness</div>
                    <div className="text-on-surface font-data-tabular text-xs">{item.signals.completeness}</div>
                  </div>
                </div>
                
                <button 
                  className="mt-3 w-full border border-gold-accent text-gold-accent font-working-title text-sm py-2 rounded hover:bg-gold-accent/10 transition-colors"
                  onClick={() => handleOpenPitchModal(item)}
                >
                  Draft Pitch (1 Connect)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
