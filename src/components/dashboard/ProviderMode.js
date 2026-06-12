"use client";

import { useState, useEffect } from "react";

const MOCK_INQUIRIES = [
  { id: 1, client: "Julian de Ayala", loc: "Dasmariñas Village", budget: "₱15,000", type: "Shoot" },
  { id: 2, client: "Maria Clara", loc: "BGC High Street", budget: "₱8,000", type: "Floorplan" }
];

export default function ProviderMode({ type }) {
  // Toggle this to test both states. In reality, this comes from User.tags or a specific 'is_verified' flag.
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [completeness, setCompleteness] = useState(20);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (user?.profile_completeness !== undefined) setCompleteness(user.profile_completeness);
    } catch (e) {}
  }, []);

  const providerLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Provider";

  if (!isUnlocked) {
    return (
      <div className="w-full flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-out] py-12 md:py-24 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gold-accent opacity-5 blur-[100px] pointer-events-none"></div>
        
        <span className="inline-block bg-gold-accent/10 text-gold-accent font-label-caps text-xs tracking-widest uppercase px-3 py-1.5 rounded-full mb-6 border border-gold-accent/20">
          🏅 Pioneer {providerLabel} #7 of 50
        </span>
        
        <h1 className="font-headline-editorial text-5xl md:text-6xl text-on-surface mb-4">The gates are closed.</h1>
        <p className="text-text-secondary font-body-md max-w-lg mb-12">
          We are currently onboarding top-tier {providerLabel}s before opening the marketplace. Build your portfolio now to get priority placement when we launch.
        </p>

        <div className="bg-surface border border-surface-variant rounded-lg p-8 w-full max-w-sm mb-8 flex flex-col items-center gap-2">
          <span className="font-display-md text-6xl text-gold-accent mb-2">142</span>
          <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Listings waiting for {providerLabel.toLowerCase()} services</span>
        </div>

        {/* Profile completeness meter — first placement incentive */}
        <div className="w-full max-w-sm mb-12 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Profile Completeness</span>
            <span className="font-data-tabular text-sm text-gold-accent font-bold">{completeness}%</span>
          </div>
          <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-gold-accent rounded-full transition-all duration-700" style={{ width: `${completeness}%` }}></div>
          </div>
          <p className="text-xs text-text-secondary mt-2 italic">Profiles 100% complete get first placement at launch.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all"
            onClick={() => setIsUnlocked(true)}
          >
            Build Portfolio
          </button>
          <button
            className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-base font-bold py-4 px-6 rounded hover:bg-surface-container transition-colors disabled:opacity-60"
            onClick={() => setNotified(true)}
            disabled={notified}
          >
            {notified ? "✓ You're on the list" : "Notify Me"}
          </button>
        </div>
        
        {/* Toggle just for testing the UI */}
        <button 
          onClick={() => setIsUnlocked(true)} 
          className="absolute bottom-0 text-xs text-text-muted hover:text-on-surface underline transition-colors"
        >
          Simulate Unlock
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-variant pb-6">
        <div>
          <h1 className="font-headline-editorial text-3xl md:text-4xl text-on-surface mb-2">{providerLabel} Workspace</h1>
          <p className="text-sm text-text-secondary">Your portfolio is 100% complete and visible to Brokers & Owners.</p>
        </div>
        <button 
          className="font-working-title text-sm text-text-secondary hover:text-on-surface border border-surface-variant px-4 py-2 rounded transition-colors" 
          onClick={() => setIsUnlocked(false)}
        >
          Lock View (Test)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Inquiry Inbox - Takes up 5 cols on lg screens */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="font-working-title text-lg text-on-surface">Inquiry Inbox</span>
          
          <div className="flex flex-col gap-4">
            {MOCK_INQUIRIES.map(inq => (
              <div key={inq.id} className="bg-surface border border-surface-variant rounded-lg p-5 flex flex-col gap-4 hover:border-text-secondary transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-working-title text-on-surface mb-1">{inq.client}</div>
                    <div className="text-xs text-text-secondary">{inq.loc} • {inq.type}</div>
                  </div>
                  <div className="text-gold-accent font-working-title text-sm">{inq.budget}</div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button className="flex-1 bg-gold-accent text-background font-working-title text-sm font-bold py-2 rounded hover:opacity-90 transition-all">Accept</button>
                  <button className="flex-1 bg-surface border border-surface-variant text-on-surface font-working-title text-sm py-2 rounded hover:bg-surface-container transition-colors">Decline</button>
                </div>
              </div>
            ))}
            
            {MOCK_INQUIRIES.length === 0 && (
              <div className="bg-surface-alt border border-dashed border-surface-variant rounded-lg p-8 text-center text-text-secondary text-sm">
                No inquiries yet. Keep updating your portfolio to stay relevant.
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Manager - Takes up 7 cols on lg screens */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="font-working-title text-lg text-on-surface">Portfolio</span>
            <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">4 ITEMS</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="aspect-square bg-surface-alt rounded-lg border border-surface-variant flex items-center justify-center text-4xl hover:border-gold-accent transition-colors cursor-pointer relative group overflow-hidden">
              📸
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="font-working-title text-sm text-white">Edit</span>
              </div>
            </div>
            <div className="aspect-square bg-surface-alt rounded-lg border border-surface-variant flex items-center justify-center text-4xl hover:border-gold-accent transition-colors cursor-pointer relative group overflow-hidden">
              📐
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="font-working-title text-sm text-white">Edit</span>
              </div>
            </div>
            <div className="aspect-square bg-surface-alt rounded-lg border border-surface-variant flex items-center justify-center text-4xl hover:border-gold-accent transition-colors cursor-pointer relative group overflow-hidden">
              🏢
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="font-working-title text-sm text-white">Edit</span>
              </div>
            </div>
            <div className="aspect-square bg-surface-alt rounded-lg border border-surface-variant flex items-center justify-center text-4xl hover:border-gold-accent transition-colors cursor-pointer relative group overflow-hidden">
              🌇
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="font-working-title text-sm text-white">Edit</span>
              </div>
            </div>
            
            {/* Add New Item */}
            <div className="aspect-square bg-surface-container-low rounded-lg border border-dashed border-text-secondary flex flex-col items-center justify-center text-text-secondary hover:text-gold-accent hover:border-gold-accent transition-colors cursor-pointer gap-2">
              <span className="text-3xl">+</span>
              <span className="font-working-title text-xs">Add Media</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
