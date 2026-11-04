"use client";

import { useState, useEffect } from "react";
import { Palette, Compass, Check, Sparkles, ExternalLink } from "lucide-react";

const ToggleSwitch = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-surface-variant/50 last:border-0">
    <span className="font-working-title text-sm text-on-surface pr-3">{label}</span>
    <button type="button"
      className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center -mr-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent rounded-lg"
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors duration-200 ${checked ? 'bg-gold-accent' : 'bg-surface-variant'}`}>
        <span className={`w-4 h-4 bg-background rounded-full transition-transform duration-200 block ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </span>
    </button>
  </div>
);

export default function DesignerHUD({ projects, activeProjectId, setActiveProjectId }) {
  const [activeTab, setActiveTab] = useState("projects"); // 'projects' | 'studio'

  // Studio State
  const [acceptingCommissions, setAcceptingCommissions] = useState(true);
  const [aesthetic, setAesthetic] = useState("Biophilic Corporate & Industrial");
  const [baseRate, setBaseRate] = useState("50"); // connects
  const [externalLink, setExternalLink] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Service Capacity
  const [capacityDigital, setCapacityDigital] = useState(true);
  const [capacityPhysical, setCapacityPhysical] = useState(false);

  // Software Stack
  const [softAutoCAD, setSoftAutoCAD] = useState(true);
  const [softSketchUp, setSoftSketchUp] = useState(true);
  const [softBlender, setSoftBlender] = useState(false);
  const [softRevit, setSoftRevit] = useState(false);

  const safePortfolioUrl = (url) => {
    if (!url || typeof url !== "string") return "";
    const trimmed = url.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  // Load saved studio preferences from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("scoutit_designer_studio");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.aesthetic) setAesthetic(parsed.aesthetic);
        if (parsed.baseRate) setBaseRate(parsed.baseRate);
        if (parsed.portfolioUrl) setExternalLink(parsed.portfolioUrl);
        if (typeof parsed.acceptingCommissions === "boolean") setAcceptingCommissions(parsed.acceptingCommissions);
        if (typeof parsed.capacityDigital === "boolean") setCapacityDigital(parsed.capacityDigital);
        if (typeof parsed.capacityPhysical === "boolean") setCapacityPhysical(parsed.capacityPhysical);
        if (typeof parsed.softAutoCAD === "boolean") setSoftAutoCAD(parsed.softAutoCAD);
        if (typeof parsed.softSketchUp === "boolean") setSoftSketchUp(parsed.softSketchUp);
        if (typeof parsed.softBlender === "boolean") setSoftBlender(parsed.softBlender);
        if (typeof parsed.softRevit === "boolean") setSoftRevit(parsed.softRevit);
      }
    } catch {}
  }, []);

  // Primary action button listener (Studio FAB in Dashboard)
  useEffect(() => {
    const onPrimary = (e) => {
      if (!e?.detail?.mode || e.detail?.mode === "provider" || e.detail?.mode === "designer" || e.detail?.providerType === "designer") {
        setActiveTab((prev) => (prev === "projects" ? "studio" : "projects"));
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("scoutit:primary-action", onPrimary);
    return () => window.removeEventListener("scoutit:primary-action", onPrimary);
  }, []);

  const handleSaveStudio = () => {
    try {
      const payload = {
        acceptingCommissions,
        aesthetic,
        baseRate,
        capacityDigital,
        capacityPhysical,
        softAutoCAD,
        softSketchUp,
        softBlender,
        softRevit,
        portfolioUrl: safePortfolioUrl(externalLink),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem("scoutit_designer_studio", JSON.stringify(payload));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {}
  };

  // Reusable custom toggle component (Creative/Pink accent for Designer vibe)

  useEffect(() => {
    if (activeProjectId && !(projects || []).some(p => p.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [activeProjectId, projects, setActiveProjectId]);

  if (activeProjectId) {
    const project = (projects || []).find(p => p.id === activeProjectId);
    if (!project) {
      return null;
    }
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-end border-b border-surface-variant pb-4">
          <div>
            <button className="min-h-11 inline-flex items-center text-text-secondary hover:text-gold-accent text-sm mb-2" onClick={() => setActiveProjectId(null)}>← Back to Workspace</button>
            <h2 className="font-display-md text-3xl text-on-surface">Space Staging: {project.title}</h2>
          </div>
          <button
            disabled
            title="Submissions open in Phase 2: previews only today."
            className="bg-gold-accent text-background font-working-title font-bold px-4 py-2 rounded text-sm opacity-60 cursor-not-allowed"
          >
            Submit Concepts · Phase 2
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
                <button
                  type="button"
                  disabled
                  title="CAD file downloads open in Phase 2"
                  className="min-h-11 text-gold-accent font-working-title flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>↓</span> Download Base .DWG Files · Phase 2
                </button>
              </div>
            </div>
          </div>

          <div className="card-atmosphere rounded-lg overflow-hidden flex flex-col">
            <div className="bg-surface-alt border-b border-surface-variant p-4 flex justify-between items-center">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase">Asset Drop</h3>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-background rounded border border-dashed border-surface-variant flex flex-col items-center justify-center text-center hover:border-gold-accent transition cursor-pointer group mb-4">
                <Palette size={36} className="mb-2 text-gold-accent opacity-70 group-hover:scale-110 transition-transform" />
                <span className="font-working-title text-on-surface">Drop .OBJ, .SKP, or Rendered Images</span>
                <span className="text-xs text-text-muted mt-2">Max file size: 500MB</span>
              </div>
              <input
                type="text"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="Or paste external portfolio/drive link (e.g. behance.net/studio)..."
                className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-base md:text-sm focus:outline-none focus:border-gold-accent transition text-on-surface"
              />
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
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition whitespace-nowrap min-h-[44px] ${activeTab === 'projects' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("projects")}
        >
          Project Board
        </button>
        <button 
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition whitespace-nowrap min-h-[44px] ${activeTab === 'studio' ? 'border-gold-accent text-gold-accent' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("studio")}
        >
          Design Studio (Profile)
        </button>
      </div>

      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeIn_0.2s_ease]">
          {projects.map(project => (
            <button type="button"
              key={project.id} 
              className="card-atmosphere hov-card rounded-lg overflow-hidden cursor-pointer group hover:border-gold-accent transition text-left block w-full"
              onClick={() => setActiveProjectId(project.id)}
            >
              <div className="aspect-video bg-surface-alt flex items-center justify-center text-5xl relative">
                <Compass size={40} className="text-gold-accent opacity-70 group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <span className="bg-background/80 backdrop-blur text-text-primary text-[12px] font-label-caps tracking-widest uppercase px-2 py-1 rounded">
                    {project.type || "Design"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-working-title text-lg text-on-surface line-clamp-1 mb-1 group-hover:text-gold-accent transition">{project.title}</h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-secondary">{project.date}</span>
                  <span className="text-gold-accent font-data-tabular">Bounty: {project.bounty_connects || 5} ◈</span>
                </div>
              </div>
            </button>
          ))}
          
          {projects.length === 0 && (
            <div className="col-span-full p-8 md:p-12 text-center border border-dashed border-surface-variant rounded-lg">
              <Compass size={36} className="mx-auto mb-2 text-text-muted opacity-50" />
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
                <h3 className="font-label-caps text-[12px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Studio Identity</h3>
                
                <div className="flex justify-between items-center mb-5 bg-surface-alt p-4 rounded border border-surface-variant">
                  <div>
                    <h4 className="font-working-title text-on-surface">Accepting Commissions</h4>
                    <p className="text-xs text-text-secondary mt-1">Toggle off if your studio is currently fully booked.</p>
                  </div>
                  <button type="button"
                    className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center -mr-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent rounded-lg"
                    onClick={() => setAcceptingCommissions(!acceptingCommissions)}
                    role="switch"
                    aria-checked={acceptingCommissions}
                    aria-label="Accepting commissions"
                  >
                    <span className={`w-12 h-6 rounded-full flex items-center p-1 transition cursor-pointer ${acceptingCommissions ? 'bg-gold-accent' : 'bg-surface-variant'}`}>
                      <span className={`w-4 h-4 bg-background rounded-full transition-transform ${acceptingCommissions ? 'translate-x-6' : 'translate-x-0'}`}></span>
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Aesthetic Identity</h4>
                    <input 
                      type="text" 
                      value={aesthetic}
                      onChange={(e) => setAesthetic(e.target.value)}
                      placeholder="e.g. Minimalist Corporate, Biophilic"
                      className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent text-on-surface" 
                    />
                  </div>
                  <div>
                    <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Base Design Fee</h4>
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

                <div className="mt-4">
                  <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Portfolio &amp; Showcase URL</h4>
                  <input
                    type="url"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://behance.net/yourstudio or portfolio link"
                    className="w-full bg-surface-alt border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-gold-accent text-on-surface"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-surface-variant/50 pt-6">
                <div>
                  <h3 className="font-label-caps text-[12px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Service Capacity</h3>
                  <ToggleSwitch label="Digital 3D Rendering Only" checked={capacityDigital} onChange={setCapacityDigital} primary={true} />
                  <ToggleSwitch label="Physical Furniture Staging" checked={capacityPhysical} onChange={setCapacityPhysical} primary={true} />
                  <p className="text-xs text-text-muted mt-3 leading-relaxed">Let owners know if you handle physical logistics (renting couches) or purely digital vision.</p>
                </div>

                <div>
                  <h3 className="font-label-caps text-[12px] tracking-widest text-gold-accent uppercase mb-4 border-b border-surface-variant/50 pb-2">Software Stack Deliverables</h3>
                  <ToggleSwitch label="AutoCAD (.dwg)" checked={softAutoCAD} onChange={setSoftAutoCAD} />
                  <ToggleSwitch label="SketchUp (.skp)" checked={softSketchUp} onChange={setSoftSketchUp} />
                  <ToggleSwitch label="Blender / Maya" checked={softBlender} onChange={setSoftBlender} />
                  <ToggleSwitch label="Autodesk Revit" checked={softRevit} onChange={setSoftRevit} />
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleSaveStudio}
                className="w-full mt-4 bg-gold-accent text-background font-working-title font-bold px-4 py-4 rounded uppercase tracking-wider text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)] active:scale-[0.98]"
              >
                {saveSuccess ? (
                  <>
                    <Check size={16} /> Studio Profile Saved ✓
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Save Studio Profile
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preview Card (Right Column) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <h3 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              Studio Preview <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-gold-accent"></span></span>
            </h3>
            
            <div id="designer-studio-preview" className="card-atmosphere rounded-lg p-6 relative overflow-hidden shadow-2xl sticky top-24">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent opacity-[0.04] blur-[60px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-alt border border-gold-accent/30 rounded-lg flex items-center justify-center text-2xl relative shadow-[0_0_10px_rgba(var(--accent-rgb),0.1)] text-gold-accent">
                    <Palette size={28} />
                    {acceptingCommissions && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-surface rounded-full" title="Accepting Commissions"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-working-title text-xl text-on-surface">ScoutIt Studio</h4>
                      <span className="bg-gold-accent/10 text-gold-accent font-label-caps text-[12px] uppercase tracking-widest px-2 py-0.5 rounded border border-gold-accent/20">Verified</span>
                    </div>
                    <p className="text-sm text-text-secondary mt-0.5">{aesthetic}</p>
                  </div>
                </div>
              </div>
              
              {/* Capacity Row */}
              <div className="flex flex-col gap-2 mb-6 bg-surface-alt p-3 rounded border border-surface-variant/50">
                <span className="text-[12px] text-text-secondary uppercase tracking-widest font-label-caps mb-1 block">Service Capacity</span>
                {capacityDigital && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-gold-accent">✦</span> Digital 3D Rendering &amp; Concepts
                  </div>
                )}
                {capacityPhysical && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-gold-accent">✦</span> Full Physical Logistics &amp; Furniture Staging
                  </div>
                )}
                {!capacityDigital && !capacityPhysical && (
                  <span className="text-xs text-text-muted italic">No service capacity declared.</span>
                )}
              </div>
              
              <div className="space-y-4 border-t border-surface-variant pt-4">
                <div>
                  <span className="text-[12px] text-text-secondary uppercase tracking-widest font-label-caps mb-2 block">Software Stack</span>
                  <div className="flex flex-wrap gap-2">
                    {softAutoCAD && <span className="bg-surface text-text-secondary border border-surface-variant font-label-caps text-[12px] uppercase tracking-widest px-2 py-1 rounded">AutoCAD</span>}
                    {softSketchUp && <span className="bg-surface text-text-secondary border border-surface-variant font-label-caps text-[12px] uppercase tracking-widest px-2 py-1 rounded">SketchUp</span>}
                    {softBlender && <span className="bg-surface text-text-secondary border border-surface-variant font-label-caps text-[12px] uppercase tracking-widest px-2 py-1 rounded">Blender</span>}
                    {softRevit && <span className="bg-surface text-text-secondary border border-surface-variant font-label-caps text-[12px] uppercase tracking-widest px-2 py-1 rounded">Revit</span>}
                    {!softAutoCAD && !softSketchUp && !softBlender && !softRevit && (
                      <span className="text-xs text-text-muted italic">No specific software stack listed.</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-surface-variant">
                  <div>
                    <span className="text-[12px] text-text-secondary uppercase tracking-widest font-label-caps block mb-1">Base Design Fee</span>
                    <span className="text-lg text-gold-accent font-data-tabular font-bold">◈ {baseRate}</span>
                  </div>

                  {externalLink ? (
                    <a
                      href={safePortfolioUrl(externalLink)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-accent/15 border border-gold-accent/40 text-gold-accent font-mono text-xs uppercase tracking-wider hover:bg-gold-accent hover:text-black transition"
                    >
                      <span>Portfolio</span>
                      <ExternalLink size={12} />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
