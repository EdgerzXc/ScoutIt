"use client";

import { useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";

const ToggleSwitch = ({ label, checked, onChange, primary = false }) => (
  <div className="flex items-center justify-between py-2 border-b border-surface-variant/50 last:border-0">
    <span className="font-working-title text-sm text-on-surface">{label}</span>
    <div 
      className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${checked ? (primary ? 'bg-[#ff75c3]' : 'bg-on-surface') : 'bg-surface-variant'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 bg-background rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
    </div>
  </div>
);

export default function DesignerHUD({ projects, activeProjectId, setActiveProjectId }) {
  const { addToast } = useDashboard();
  const [activeTab, setActiveTab] = useState("projects"); // 'projects' | 'studio'

  // Studio State
  const [acceptingCommissions, setAcceptingCommissions] = useState(true);
  const [aesthetic, setAesthetic] = useState("Biophilic Corporate & Industrial");
  const [baseRate, setBaseRate] = useState("50"); // connects

  // Service Capacity
  const [capacityDigital, setCapacityDigital] = useState(true);
  const [capacityPhysical, setCapacityPhysical] = useState(false);

  // Software Stack
  const [softAutoCAD, setSoftAutoCAD] = useState(true);
  const [softSketchUp, setSoftSketchUp] = useState(true);
  const [softBlender, setSoftBlender] = useState(false);
  const [softRevit, setSoftRevit] = useState(false);

  // Reusable custom toggle component (Creative/Pink accent for Designer vibe)

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
            <button className="text-text-secondary hover:text-[#ff75c3] text-sm mb-2" onClick={() => setActiveProjectId(null)}>← Back to Workspace</button>
            <h2 className="font-display-md text-3xl text-on-surface">Space Staging: {project.title}</h2>
          </div>
          <button 
            className="bg-[#ff75c3] text-[#0a0a0a] font-working-title font-bold px-4 py-2 rounded text-sm hover:opacity-90 transition-all"
            onClick={() => addToast("Design Concepts Submitted.", "🎨")}
          >
            Submit Concepts
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card-atmosphere rounded-lg p-6">
            <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-4">Design Brief</h3>
            <p className="font-body-md text-sm text-on-surface mb-6 leading-relaxed">{project.scope || "Develop a modern, high-yield retail staging concept for this 120sqm bare shell unit."}</p>
            
            <div className="space-y-3">
              <div className="p-3 bg-surface border border-surface-variant rounded flex justify-between items-center text-sm">
                <span className="text-text-secondary">Expected Deliverables:</span>
                <span className="font-working-title text-on-surface">3D Renderings, Floorplan, Itemized BoQ</span>
              </div>
              <div className="p-3 bg-surface border border-surface-variant rounded flex justify-between items-center text-sm">
                <span className="text-text-secondary">Raw Assets Provided:</span>
                <button className="text-[#ff75c3] hover:underline font-working-title flex items-center gap-2">
                  <span>↓</span> Download Base .DWG Files
                </button>
              </div>
            </div>
          </div>

          <div className="card-atmosphere rounded-lg overflow-hidden flex flex-col">
            <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Asset Drop</h3>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-[#0a0a0a] rounded border border-dashed border-surface-variant flex flex-col items-center justify-center text-center hover:border-[#ff75c3] transition-colors cursor-pointer group mb-4">
                <span className="text-4xl mb-2 opacity-50 group-hover:scale-110 transition-transform">🎨</span>
                <span className="font-working-title text-on-surface">Drop .OBJ, .SKP, or Rendered Images</span>
                <span className="text-xs text-text-muted mt-2">Max file size: 500MB</span>
              </div>
              <input type="text" placeholder="Or paste external portfolio/drive link..." className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-[#ff75c3] transition-colors text-on-surface" />
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
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'projects' ? 'border-[#ff75c3] text-[#ff75c3]' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("projects")}
        >
          Project Board
        </button>
        <button 
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'studio' ? 'border-[#ff75c3] text-[#ff75c3]' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("studio")}
        >
          Design Studio (Profile)
        </button>
      </div>

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease]">
          {projects.map(project => (
            <div 
              key={project.id} 
              className="card-atmosphere hov-card rounded-lg overflow-hidden cursor-pointer group hover:border-[#ff75c3] transition-all"
              onClick={() => setActiveProjectId(project.id)}
            >
              <div className="aspect-video bg-surface-alt flex items-center justify-center text-5xl relative">
                <span className="group-hover:scale-110 transition-transform">{project.cover || "📐"}</span>
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-background/80 backdrop-blur text-text-primary text-[10px] font-label-caps tracking-widest uppercase px-2 py-1 rounded">
                    {project.type || "Design"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-working-title text-lg text-on-surface line-clamp-1 mb-1 group-hover:text-[#ff75c3] transition-colors">{project.title}</h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">{project.date}</span>
                  <span className="text-[#ff75c3] font-data-tabular">Bounty: {project.bounty_connects || 5} ◈</span>
                </div>
              </div>
            </div>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full p-12 text-center border border-dashed border-surface-variant rounded-lg">
              <span className="text-3xl mb-2 block opacity-50">📐</span>
              <p className="text-text-secondary text-sm">No active design staging bounties available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'studio' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-[fadeIn_0.2s_ease]">
          
          {/* Studio Form (Left Column) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="card-atmosphere rounded-lg p-6 flex flex-col gap-6">

              <div>
                <h3 className="font-label-caps text-[10px] tracking-widest text-[#ff75c3] uppercase mb-4 border-b border-surface-variant/50 pb-2">Studio Identity</h3>
                
                <div className="flex justify-between items-center mb-5 bg-surface-alt p-4 rounded border border-surface-variant">
                  <div>
                    <h4 className="font-working-title text-on-surface">Accepting Commissions</h4>
                    <p className="text-xs text-text-secondary mt-1">Toggle off if your studio is currently fully booked.</p>
                  </div>
                  <div 
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${acceptingCommissions ? 'bg-[#ff75c3]' : 'bg-surface-variant'}`}
                    onClick={() => setAcceptingCommissions(!acceptingCommissions)}
                  >
                    <div className={`w-4 h-4 bg-background rounded-full transition-transform ${acceptingCommissions ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Aesthetic Identity</h4>
                    <input 
                      type="text" 
                      value={aesthetic}
                      onChange={(e) => setAesthetic(e.target.value)}
                      placeholder="e.g. Minimalist Corporate, Biophilic"
                      className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-[#ff75c3] text-on-surface" 
                    />
                  </div>
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Base Design Fee</h4>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={baseRate}
                        onChange={(e) => setBaseRate(e.target.value)}
                        className="w-full bg-surface-alt border border-surface-variant rounded p-3 pl-8 text-sm focus:outline-none focus:border-[#ff75c3] text-[#ff75c3] font-data-tabular font-bold" 
                      />
                      <span className="absolute left-3 top-3 text-[#ff75c3]">◈</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-surface-variant/50 pt-6">
                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-[#ff75c3] uppercase mb-4 border-b border-surface-variant/50 pb-2">Service Capacity</h3>
                  <ToggleSwitch label="Digital 3D Rendering Only" checked={capacityDigital} onChange={setCapacityDigital} primary={true} />
                  <ToggleSwitch label="Physical Furniture Staging" checked={capacityPhysical} onChange={setCapacityPhysical} primary={true} />
                  <p className="text-xs text-text-muted mt-3 leading-relaxed">Let owners know if you handle physical logistics (renting couches) or purely digital vision.</p>
                </div>

                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-[#ff75c3] uppercase mb-4 border-b border-surface-variant/50 pb-2">Software Stack Deliverables</h3>
                  <ToggleSwitch label="AutoCAD (.dwg)" checked={softAutoCAD} onChange={setSoftAutoCAD} />
                  <ToggleSwitch label="SketchUp (.skp)" checked={softSketchUp} onChange={setSoftSketchUp} />
                  <ToggleSwitch label="Blender / Maya" checked={softBlender} onChange={setSoftBlender} />
                  <ToggleSwitch label="Autodesk Revit" checked={softRevit} onChange={setSoftRevit} />
                </div>
              </div>
              
              <button 
                className="w-full mt-4 bg-[#ff75c3] text-[#0a0a0a] font-working-title font-bold px-4 py-4 rounded hover:opacity-90 transition-all uppercase tracking-wider text-sm shadow-[0_0_15px_rgba(255,117,195,0.3)]"
                onClick={() => addToast("Design Studio Profile Updated.", "🎨")}
              >
                Save Studio Profile
              </button>
            </div>
          </div>

          {/* Preview Card (Right Column) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <h3 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              Studio Preview <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff75c3] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff75c3]"></span></span>
            </h3>
            
            <div className="card-atmosphere rounded-lg p-6 relative overflow-hidden shadow-2xl sticky top-24">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff75c3] opacity-[0.04] blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-[#1a1518] border border-[#ff75c3]/30 rounded-lg flex items-center justify-center text-2xl relative shadow-[0_0_10px_rgba(255,117,195,0.1)]">
                    🎨
                    {acceptingCommissions && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full" title="Accepting Commissions"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-working-title text-xl text-on-surface">ScoutIt Studio</h4>
                      <span className="bg-[#ff75c3]/10 text-[#ff75c3] font-label-caps text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#ff75c3]/20">Verified</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{aesthetic}</p>
                  </div>
                </div>
              </div>
              
              {/* Capacity Row */}
              <div className="flex flex-col gap-2 mb-6 bg-surface-alt p-3 rounded border border-surface-variant/50">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps mb-1 block">Service Capacity</span>
                {capacityDigital && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-[#ff75c3]">✦</span> Digital 3D Rendering & Concepts
                  </div>
                )}
                {capacityPhysical && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-[#ff75c3]">✦</span> Full Physical Logistics & Furniture Staging
                  </div>
                )}
                {!capacityDigital && !capacityPhysical && (
                  <span className="text-xs text-text-muted italic">No service capacity declared.</span>
                )}
              </div>
              
              <div className="space-y-4 border-t border-surface-variant pt-4">
                <div>
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps mb-2 block">Software Stack</span>
                  <div className="flex flex-wrap gap-2">
                    {softAutoCAD && <span className="bg-[#121110] text-text-secondary border border-surface-variant font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded">AutoCAD</span>}
                    {softSketchUp && <span className="bg-[#121110] text-text-secondary border border-surface-variant font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded">SketchUp</span>}
                    {softBlender && <span className="bg-[#121110] text-text-secondary border border-surface-variant font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded">Blender</span>}
                    {softRevit && <span className="bg-[#121110] text-text-secondary border border-surface-variant font-label-caps text-[9px] uppercase tracking-widest px-2 py-1 rounded">Revit</span>}
                    {!softAutoCAD && !softSketchUp && !softBlender && !softRevit && (
                      <span className="text-xs text-text-muted italic">No specific software stack listed.</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-6 pt-4 border-t border-surface-variant">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps block mb-1">Base Design Fee</span>
                    <span className="text-lg text-[#ff75c3] font-data-tabular font-bold">◈ {baseRate}</span>
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
