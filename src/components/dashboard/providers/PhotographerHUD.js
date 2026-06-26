"use client";

import { useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";

export default function PhotographerHUD({ projects, activeProjectId, setActiveProjectId, setActiveProjectDetails }) {
  const { addToast } = useDashboard();
  const [activeTab, setActiveTab] = useState("bounties"); // 'bounties' | 'showcase'
  
  // Showcase State (Core)
  const [gear, setGear] = useState("Sony A7S III, DJI Mavic 3 Pro, 16-35mm G Master");
  const [portfolio, setPortfolio] = useState("https://behance.net/scoutit-photog");
  const [baseRate, setBaseRate] = useState("15"); // in connects
  const [specialty, setSpecialty] = useState("Twilight Exteriors & Drone Aerials");

  // Showcase State (Deep Council Metrics)
  const [acceptingProjects, setAcceptingProjects] = useState(true);
  const [turnaroundTime, setTurnaroundTime] = useState("24-48 Hours");
  
  // Certifications
  const [certCaaDrone, setCertCaaDrone] = useState(false);
  const [certInsurance, setCertInsurance] = useState(false);
  
  // Premium Add-ons
  const [addonMatterport, setAddonMatterport] = useState(false);
  const [addonTwilight, setAddonTwilight] = useState(false);
  const [addonFloorplan, setAddonFloorplan] = useState(false);

  // Reusable custom toggle component
  const ToggleSwitch = ({ label, checked, onChange, gold = false }) => (
    <div className="flex items-center justify-between py-2 border-b border-surface-variant/50 last:border-0">
      <span className="font-working-title text-sm text-on-surface">{label}</span>
      <div 
        className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${checked ? (gold ? 'bg-gold-accent' : 'bg-on-surface') : 'bg-surface-variant'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`w-4 h-4 bg-background rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );

  if (activeProjectId) {
    const project = projects.find(p => p.id === activeProjectId);
    if (!project) {
      setActiveProjectId(null);
      return null;
    }
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-end border-b border-surface-variant pb-4">
          <div>
            <button className="text-text-secondary hover:text-gold-accent text-sm mb-2" onClick={() => setActiveProjectId(null)}>← Back to Gallery</button>
            <h2 className="font-display-md text-3xl text-on-surface">{project.title}</h2>
          </div>
          <button 
            className="bg-gold-accent text-background font-working-title font-bold px-4 py-2 rounded text-sm hover:opacity-90 transition-all"
            onClick={() => addToast("Final Gallery Submitted.", "📸")}
          >
            Submit Final Gallery
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-4">Shot List Requirements</h3>
            <p className="font-body-md text-sm text-on-surface mb-4">{project.scope || "Capture full interior, drone aerials, and twilight exterior."}</p>
            <div className="p-3 bg-surface border border-dashed border-surface-variant rounded flex justify-between items-center text-sm">
              <span className="text-text-secondary">Expected Media:</span>
              <span className="font-data-tabular font-bold text-on-surface">35 High-Res, 1 Reel</span>
            </div>
          </div>

          <div className="bg-surface border border-surface-variant rounded-lg overflow-hidden flex flex-col">
            <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Media Drop</h3>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-[#0a0a0a] rounded border border-dashed border-surface-variant flex flex-col items-center justify-center text-center hover:border-gold-accent transition-colors cursor-pointer group mb-4">
                <span className="text-4xl mb-2 opacity-50 group-hover:scale-110 transition-transform">📸</span>
                <span className="font-working-title text-on-surface">Paste Drive/Dropbox Link</span>
              </div>
              <input type="text" placeholder="https://drive.google.com/..." className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent transition-colors" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease]">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-surface-variant overflow-x-auto">
        <button 
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'bounties' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("bounties")}
        >
          Bounty Board
        </button>
        <button 
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'showcase' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("showcase")}
        >
          My Showcase (Promotion)
        </button>
      </div>

      {activeTab === 'bounties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease]">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="bg-surface border border-surface-variant rounded-lg overflow-hidden cursor-pointer group hover:border-gold-accent transition-all"
              onClick={() => setActiveProjectId(project.id)}
            >
              <div className="aspect-video bg-surface-alt flex items-center justify-center text-5xl relative">
                <span className="group-hover:scale-110 transition-transform">{project.cover || "🏙️"}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-background/80 backdrop-blur text-text-primary text-[10px] font-label-caps tracking-widest uppercase px-2 py-1 rounded">
                    {project.type || "Shoot"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-working-title text-lg text-on-surface line-clamp-1 mb-1 group-hover:text-gold-accent transition-colors">{project.title}</h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">{project.date}</span>
                  <span className="text-gold-accent font-data-tabular">Bounty: {project.bounty_connects || 5} ◈</span>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-surface-variant rounded-lg">
              <span className="text-3xl mb-2 block opacity-50">📷</span>
              <p className="text-text-secondary text-sm">No active photography bounties available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'showcase' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-[fadeIn_0.2s_ease]">
          
          {/* Promotion Form (Left Column, larger) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="bg-[#121110] border border-surface-variant rounded-lg p-6 flex flex-col gap-6">
              
              {/* Core Profile */}
              <div>
                <h3 className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Core Profile</h3>
                
                <div className="flex justify-between items-center mb-5 bg-surface-alt p-4 rounded border border-surface-variant">
                  <div>
                    <h4 className="font-working-title text-on-surface">Accepting New Projects</h4>
                    <p className="text-xs text-text-secondary mt-1">Toggle off to create artificial scarcity if fully booked.</p>
                  </div>
                  <div 
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${acceptingProjects ? 'bg-gold-accent' : 'bg-surface-variant'}`}
                    onClick={() => setAcceptingProjects(!acceptingProjects)}
                  >
                    <div className={`w-4 h-4 bg-background rounded-full transition-transform ${acceptingProjects ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Aesthetic Specialty</h4>
                    <input 
                      type="text" 
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent text-on-surface" 
                    />
                  </div>
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Base Day-Rate</h4>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={baseRate}
                        onChange={(e) => setBaseRate(e.target.value)}
                        className="w-full bg-surface-alt border border-surface-variant rounded p-3 pl-8 text-sm focus:outline-none focus:border-gold-accent text-gold-accent font-data-tabular font-bold" 
                      />
                      <span className="absolute left-3 top-3 text-gold-accent">◈</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Cinematic Portfolio Link</h4>
                  <input 
                    type="text" 
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                    className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent text-on-surface" 
                  />
                </div>

                <div>
                  <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Gear Loadout</h4>
                  <textarea 
                    value={gear}
                    onChange={(e) => setGear(e.target.value)}
                    className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent text-on-surface min-h-[60px]" 
                  />
                </div>
              </div>

              {/* Council Metrics: Certifications & Add-ons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-surface-variant/50 pt-6">
                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Compliance & Certs</h3>
                  <ToggleSwitch label="CAA Drone License" checked={certCaaDrone} onChange={setCertCaaDrone} gold={true} />
                  <ToggleSwitch label="Liability Insurance" checked={certInsurance} onChange={setCertInsurance} gold={true} />
                  
                  <div className="mt-4">
                    <h4 className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase mb-2">Guaranteed Turnaround</h4>
                    <select 
                      value={turnaroundTime}
                      onChange={(e) => setTurnaroundTime(e.target.value)}
                      className="w-full bg-surface-alt border border-surface-variant p-3 rounded text-sm focus:outline-none focus:border-gold-accent text-on-surface"
                    >
                      <option value="Next-Day Delivery">Next-Day Delivery</option>
                      <option value="24-48 Hours">24-48 Hours</option>
                      <option value="3-5 Business Days">3-5 Business Days</option>
                      <option value="1 Week">1 Week</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Premium Add-ons</h3>
                  <ToggleSwitch label="Matterport 3D Tours" checked={addonMatterport} onChange={setAddonMatterport} />
                  <ToggleSwitch label="Virtual Twilight Rendering" checked={addonTwilight} onChange={setAddonTwilight} />
                  <ToggleSwitch label="Laser Floorplan Drafting" checked={addonFloorplan} onChange={setAddonFloorplan} />
                </div>
              </div>
              
              <button 
                className="w-full mt-4 bg-surface border border-gold-accent/50 text-gold-accent font-working-title font-bold px-4 py-4 rounded hover:bg-gold-accent/10 transition-all uppercase tracking-wider text-sm"
                onClick={() => addToast("Elite Roster Profile Updated.", "✨")}
              >
                Save Showcase Profile
              </button>
            </div>
          </div>

          {/* Preview Card (Right Column) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <h3 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              How Owners See You <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-gold-accent"></span></span>
            </h3>
            
            <div className="bg-surface border border-surface-variant rounded-lg p-6 relative overflow-hidden shadow-2xl sticky top-24">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gold-accent opacity-[0.03] blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-alt border border-surface-variant rounded-full flex items-center justify-center text-2xl relative">
                    📸
                    {acceptingProjects && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full" title="Accepting New Projects"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-working-title text-xl text-on-surface">ScoutIt Pro</h4>
                      <span className="bg-gold-accent/10 text-gold-accent font-label-caps text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-gold-accent/20">Verified</span>
                    </div>
                    <p className="text-sm text-gold-accent mt-0.5">{specialty}</p>
                    <p className="text-[10px] text-text-muted mt-1 uppercase tracking-widest font-label-caps">{turnaroundTime}</p>
                  </div>
                </div>
              </div>
              
              {/* Certifications Row */}
              <div className="flex flex-wrap gap-2 mb-6">
                {certCaaDrone && (
                  <span className="bg-[#1a1814] text-gold-accent border border-gold-accent/40 font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 shadow-[0_0_8px_rgba(232, 174, 60,0.1)]">
                    <span className="text-[10px]">🚁</span> CAA Certified
                  </span>
                )}
                {certInsurance && (
                  <span className="bg-[#1a1814] text-gold-accent border border-gold-accent/40 font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded flex items-center gap-1 shadow-[0_0_8px_rgba(232, 174, 60,0.1)]">
                    <span className="text-[10px]">🛡️</span> Insured
                  </span>
                )}
                {!certCaaDrone && !certInsurance && (
                  <span className="text-xs text-text-muted italic">No formal certifications listed.</span>
                )}
              </div>
              
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps mb-1 block">Gear List</span>
                  <p className="text-sm text-on-surface font-body-md leading-relaxed">{gear}</p>
                </div>

                {/* Add-ons List */}
                {(addonMatterport || addonTwilight || addonFloorplan) && (
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps mb-2 block">Premium Add-ons Available</span>
                    <ul className="text-xs text-on-surface space-y-1">
                      {addonMatterport && <li><span className="text-gold-accent mr-1">✦</span> Matterport 3D Tours</li>}
                      {addonTwilight && <li><span className="text-gold-accent mr-1">✦</span> Virtual Twilight Rendering</li>}
                      {addonFloorplan && <li><span className="text-gold-accent mr-1">✦</span> Laser Floorplan Drafting</li>}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-6 pt-4 border-t border-surface-variant">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps block mb-1">Base Rate</span>
                    <span className="text-lg text-gold-accent font-data-tabular font-bold">◈ {baseRate}</span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps block mb-1">Portfolio</span>
                    <a href={portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-on-surface underline hover:text-gold-accent block truncate">{portfolio}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
