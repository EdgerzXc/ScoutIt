"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDashboard } from "../../context/DashboardContext";

const MOCK_PROJECTS = [
  { 
    id: 'p1', 
    title: "Ayala Corporate Shoot", 
    type: "Commercial", 
    status: "active", 
    client: "Julian de Ayala", 
    date: "June 2026", 
    cover: "📸",
    scope: "Full-day interior and exterior editorial shoot for upcoming high-yield commercial listing.",
    deliverables: "35 High-Res Edited Images, 1 Drone Reel",
    isPublic: true
  },
  { 
    id: 'p2', 
    title: "BGC High Street Floorplan", 
    type: "Retail", 
    status: "archived", 
    client: "Maria Clara", 
    date: "May 2026", 
    cover: "📐",
    scope: "Precise laser-measured floorplan for a 120sqm retail cutout.",
    deliverables: "PDF Floorplan, CAD File",
    isPublic: true
  }
];

const MOCK_INQUIRIES = [
  { id: 1, client: "Enrique Zobel", loc: "Makati CBD", budget: "₱25,000", type: "Editorial Video", date: "Today" }
];

export default function ProviderMode({ type }) {
  const { addToast } = useDashboard();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [completeness, setCompleteness] = useState(20);
  const [notified, setNotified] = useState(false);
  
  // Workspace State
  const [activeProjectId, setActiveProjectId] = useState(null);

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
          We are currently onboarding top-tier {providerLabel}s before opening the marketplace. Build your project dossiers now to get priority placement when we launch.
        </p>

        <div className="bg-surface border border-surface-variant rounded-lg p-8 w-full max-w-sm mb-8 flex flex-col items-center gap-2">
          <span className="font-display-md text-6xl text-gold-accent mb-2">142</span>
          <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Listings waiting for {providerLabel.toLowerCase()} dossiers</span>
        </div>

        {/* Profile completeness meter */}
        <div className="w-full max-w-sm mb-12 text-left">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">Dossier Completeness</span>
            <span className="font-data-tabular text-sm text-gold-accent font-bold">{completeness}%</span>
          </div>
          <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-gold-accent rounded-full transition-all duration-700" style={{ width: `${completeness}%` }}></div>
          </div>
          <p className="text-xs text-text-secondary mt-2 italic">Dossiers 100% complete get first placement at launch.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <button 
            className="flex-1 bg-gold-accent text-background font-working-title text-base font-bold py-4 px-6 rounded hover:opacity-90 transition-all"
            onClick={() => setIsUnlocked(true)}
          >
            Build Dossier
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

  // --- VIEW: LAYER 2 - PROJECT DOSSIER WORKSPACE ---
  if (activeProjectId) {
    const project = MOCK_PROJECTS.find(p => p.id === activeProjectId);
    if (!project) {
      setActiveProjectId(null);
      return null;
    }

    return (
      <div className="max-w-[1200px] mx-auto py-4 animate-[fadeIn_0.3s_ease]">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-surface-variant pb-6 mb-8 gap-4">
          <div>
            <button 
              className="text-text-secondary hover:text-gold-accent text-sm font-working-title flex items-center gap-2 mb-4 transition-colors"
              onClick={() => setActiveProjectId(null)}
            >
              ← Back to Project Files
            </button>
            <span className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-1 block">Project Dossier</span>
            <h1 className="font-display-md text-3xl md:text-5xl text-on-surface">{project.title}</h1>
          </div>
          <div className="flex gap-3 items-center">
            <span className={`px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase border ${project.status === 'active' ? 'bg-gold-accent/10 text-gold-accent border-gold-accent/30' : 'bg-surface-alt text-text-secondary border-surface-variant'}`}>
              {project.status === 'active' ? 'Active Project' : 'Archived'}
            </span>
            <button 
              className="bg-surface border border-surface-variant text-on-surface font-working-title font-bold px-4 py-2 rounded hover:bg-surface-container transition-colors text-sm"
              onClick={() => addToast("Project dossier updated.", "💾")}
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Col: Workspace Details */}
          <div className="md:col-span-4 flex flex-col gap-6">
            <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
               <h3 className="font-label-caps text-xs tracking-widest text-text-secondary mb-4 uppercase border-b border-surface-variant pb-2">Client Intelligence</h3>
               <div className="flex flex-col gap-4">
                 <div>
                   <span className="text-[10px] text-text-secondary uppercase tracking-widest block mb-1">Client Name</span>
                   <span className="font-working-title text-on-surface">{project.client}</span>
                 </div>
                 <div>
                   <span className="text-[10px] text-text-secondary uppercase tracking-widest block mb-1">Project Date</span>
                   <span className="font-working-title text-on-surface">{project.date}</span>
                 </div>
               </div>
            </div>

            <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
               <div className="flex justify-between items-center mb-4 border-b border-surface-variant pb-2">
                 <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Public Showcase</h3>
               </div>
               <p className="text-xs text-text-secondary mb-4 leading-relaxed">
                 When enabled, this project dossier will be visible on your public ScoutIT profile to attract new clients.
               </p>
               <div className="flex items-center justify-between p-3 bg-surface border border-surface-variant rounded">
                 <span className="font-working-title text-sm text-on-surface">Show in Portfolio</span>
                 <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${project.isPublic ? 'bg-gold-accent' : 'bg-surface-variant'}`}>
                    <div className={`w-4 h-4 bg-background rounded-full transition-transform ${project.isPublic ? 'translate-x-4' : 'translate-x-0'}`}></div>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Col: Scope & Deliverables Gallery */}
          <div className="md:col-span-8 flex flex-col gap-6">
            
            <div className="bg-[#121110] border border-surface-variant rounded-lg overflow-hidden flex flex-col">
              <div className="bg-surface-alt border-b border-surface-variant p-4">
                <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Project Scope & Deliverables</h3>
              </div>
              <div className="p-6 flex flex-col gap-6">
                <div>
                  <span className="text-[10px] text-gold-accent uppercase tracking-widest block mb-2 font-label-caps">Approved Scope</span>
                  <p className="font-body-md text-base text-on-surface leading-relaxed">
                    {project.scope}
                  </p>
                </div>
                <div className="pt-4 border-t border-surface-variant/50">
                  <span className="text-[10px] text-gold-accent uppercase tracking-widest block mb-2 font-label-caps">Final Deliverables</span>
                  <p className="font-body-md text-sm text-text-secondary">
                    {project.deliverables}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden flex flex-col">
              <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
                <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Dossier Media Hub</h3>
                <button className="text-[10px] tracking-widest uppercase font-label-caps text-gold-accent hover:underline">Upload Drive Link</button>
              </div>
              <div className="p-6">
                 <div className="aspect-video bg-surface-alt rounded border border-dashed border-surface-variant flex flex-col items-center justify-center text-center hover:border-gold-accent transition-colors cursor-pointer group">
                   <span className="text-4xl mb-2 opacity-50 group-hover:scale-110 transition-transform">🔗</span>
                   <span className="font-working-title text-on-surface">Connect Google Drive / Dropbox</span>
                   <span className="text-xs text-text-secondary mt-1 max-w-xs">We sync directly from your cloud storage to present a cinematic gallery.</span>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LAYER 1 - COMMAND CENTER ---
  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-variant pb-6">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Provider Workspace</span>
          <h1 className="font-display-md text-3xl md:text-5xl text-on-surface mb-2">{providerLabel} Command Center</h1>
        </div>
        <div className="flex gap-4">
          <button 
            className="font-working-title text-sm text-text-secondary hover:text-on-surface border border-surface-variant px-4 py-2 rounded transition-colors" 
            onClick={() => setIsUnlocked(false)}
          >
            Lock View (Test)
          </button>
          <button 
            className="bg-gold-accent text-background font-working-title font-bold px-6 py-2 rounded shadow-lg hover:opacity-90 transition-opacity"
            onClick={() => addToast("New project created.", "📝")}
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Active Project Dossiers & Archives */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div>
            <div className="flex justify-between items-end border-b border-surface-variant pb-2 mb-4">
              <h3 className="font-working-title text-xl text-on-surface">Active Project Dossiers</h3>
              <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">{MOCK_PROJECTS.filter(p => p.status === 'active').length} Ongoing</span>
            </div>
            <div className="flex flex-col gap-4">
              {MOCK_PROJECTS.filter(p => p.status === 'active').map(project => (
                <div 
                  key={project.id} 
                  className="bg-[#121110] border border-gold-accent/30 rounded-lg p-5 flex flex-col md:flex-row gap-6 cursor-pointer hover:border-gold-accent transition-all group shadow-[0_0_15px_rgba(212,175,55,0.05)]"
                  onClick={() => setActiveProjectId(project.id)}
                >
                  <div className="w-24 h-24 bg-surface-alt rounded border border-surface-variant flex items-center justify-center text-4xl shrink-0 group-hover:scale-105 transition-transform">
                    {project.cover}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-label-caps text-[9px] tracking-widest uppercase text-gold-accent bg-gold-accent/10 px-2 py-0.5 rounded">{project.type}</span>
                      <span className="text-[10px] text-text-muted font-data-tabular">{project.date}</span>
                    </div>
                    <h4 className="font-working-title text-xl text-on-surface group-hover:underline mb-1">{project.title}</h4>
                    <p className="text-xs text-text-secondary mb-3">Client: {project.client}</p>
                    <div className="text-[10px] font-label-caps uppercase tracking-widest text-gold-accent flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open Workspace <span>→</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-end border-b border-surface-variant pb-2 mb-4 mt-4">
              <h3 className="font-working-title text-xl text-text-secondary">Public Showcase Archive</h3>
              <span className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase">{MOCK_PROJECTS.filter(p => p.status === 'archived').length} Completed</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MOCK_PROJECTS.filter(p => p.status === 'archived').map(project => (
                <div 
                  key={project.id} 
                  className="bg-surface border border-surface-variant rounded-lg p-4 flex items-center gap-4 cursor-pointer hover:border-text-secondary transition-colors group opacity-80 hover:opacity-100"
                  onClick={() => setActiveProjectId(project.id)}
                >
                  <div className="w-12 h-12 bg-surface-alt rounded border border-surface-variant flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform">
                    {project.cover}
                  </div>
                  <div>
                    <h4 className="font-working-title text-sm text-on-surface line-clamp-1">{project.title}</h4>
                    <p className="text-[10px] text-text-secondary">{project.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Inquiry Inbox */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex justify-between items-end border-b border-surface-variant pb-2 mb-2">
            <span className="font-working-title text-xl text-on-surface">Inquiries</span>
            <span className="bg-gold-accent/10 text-gold-accent font-data-tabular text-xs px-2 py-0.5 rounded">{MOCK_INQUIRIES.length} NEW</span>
          </div>
          
          <div className="flex flex-col gap-4">
            {MOCK_INQUIRIES.map(inq => (
              <div key={inq.id} className="bg-[#121110] border border-surface-variant rounded-lg p-5 flex flex-col gap-4 hover:border-text-secondary transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gold-accent"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-label-caps text-[9px] tracking-widest text-text-secondary uppercase mb-1 block">{inq.date}</span>
                    <div className="font-working-title text-lg text-on-surface mb-0.5">{inq.client}</div>
                    <div className="text-xs text-text-secondary">{inq.loc} • {inq.type}</div>
                  </div>
                  <div className="text-gold-accent font-data-tabular font-bold bg-gold-accent/5 px-2 py-1 rounded border border-gold-accent/20">{inq.budget}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button 
                    className="flex-1 bg-transparent border border-surface-variant text-text-primary hover:bg-error/10 hover:text-error hover:border-error font-working-title text-xs font-bold py-2 rounded transition-all"
                    onClick={() => addToast("Inquiry declined.", "🚫")}
                  >
                    Decline
                  </button>
                  <button 
                    className="flex-1 bg-gold-accent text-background font-working-title text-xs font-bold py-2 rounded hover:opacity-90 transition-all shadow-md"
                    onClick={() => addToast("Inquiry accepted. Converted to Active Dossier.", "🤝")}
                  >
                    Accept & Convert
                  </button>
                </div>
              </div>
            ))}
            
            {MOCK_INQUIRIES.length === 0 && (
              <div className="bg-surface border border-dashed border-surface-variant rounded-lg p-8 text-center text-text-secondary text-sm">
                No active inquiries. Keep your showcase updated to attract premium clients.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
