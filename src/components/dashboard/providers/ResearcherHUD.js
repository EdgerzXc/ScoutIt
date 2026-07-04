"use client";

import { useState } from "react";
import { useDashboard } from "../../../context/DashboardContext";

export default function ResearcherHUD({ quests, activeQuestId, setActiveQuestId }) {
  const { addToast } = useDashboard();
  const [activeTab, setActiveTab] = useState("audits"); // 'audits' | 'credentials'

  // Credentials State
  const [acceptingAudits, setAcceptingAudits] = useState(true);
  const [specialty, setSpecialty] = useState("Commercial Due Diligence");
  const [rateOcular, setRateOcular] = useState("10"); // connects
  const [rateTrace, setRateTrace] = useState("35"); // connects

  // Legal & Operational Access
  const [certPRC, setCertPRC] = useState(false);
  const [certLRA, setCertLRA] = useState(false);
  const [certLGU, setCertLGU] = useState(false);

  // Reusable custom toggle component (Steely/Blue for Researcher vibe)
  const ToggleSwitch = ({ label, checked, onChange, primary = false }) => (
    <div className="flex items-center justify-between py-2 border-b border-surface-variant/50 last:border-0">
      <span className="font-working-title text-sm text-on-surface">{label}</span>
      <div 
        className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${checked ? (primary ? 'bg-[#00f2fe]' : 'bg-on-surface') : 'bg-surface-variant'}`}
        onClick={() => onChange(!checked)}
      >
        <div className={`w-4 h-4 bg-background rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );

  if (activeQuestId) {
    const quest = quests.find(q => q.id === activeQuestId);
    if (!quest) {
      setActiveQuestId(null);
      return null;
    }
    return (
      <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease]">
        <div className="flex justify-between items-end border-b border-surface-variant pb-4">
          <div>
            <button className="text-text-secondary hover:text-[#00f2fe] text-sm mb-2" onClick={() => setActiveQuestId(null)}>← Back to Audit List</button>
            <h2 className="font-display-md text-3xl text-on-surface">Data Audit: {quest.title}</h2>
          </div>
          <button 
            className="bg-[#00f2fe] text-background font-working-title font-bold px-4 py-2 rounded text-sm hover:opacity-90 transition-all"
            onClick={() => addToast("Verification Report Submitted.", "✅")}
          >
            Submit Audit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-4">Target Field Verification</h3>
              <p className="text-sm text-text-secondary mb-4">The owner has raised a bounty to verify the following fields.</p>
              
              <div className="space-y-4">
                <div className="bg-surface p-4 rounded border border-surface-variant">
                  <div className="flex justify-between mb-2">
                    <span className="font-working-title text-sm text-[#00f2fe]">PEZA Certification Status</span>
                    <span className="text-xs text-text-muted">Target: peza_status</span>
                  </div>
                  <select className="w-full bg-surface-alt border border-surface-variant p-2 rounded text-sm focus:outline-none focus:border-[#00f2fe] text-on-surface">
                    <option value="">Select verified status...</option>
                    <option value="certified">PEZA Certified</option>
                    <option value="in_process">In Process</option>
                    <option value="not_peza">Not PEZA</option>
                  </select>
                </div>
                
                <div className="bg-surface p-4 rounded border border-surface-variant">
                  <div className="flex justify-between mb-2">
                    <span className="font-working-title text-sm text-[#00f2fe]">Exact Floor Area (Sqm)</span>
                    <span className="text-xs text-text-muted">Target: floor_sqm</span>
                  </div>
                  <input type="number" className="w-full bg-surface-alt border border-surface-variant p-2 rounded text-sm focus:outline-none focus:border-[#00f2fe] text-on-surface" placeholder="e.g. 1200" />
                </div>
              </div>
            </div>
            
            <div className="card-atmosphere rounded-lg p-6">
              <h3 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-4">Audit Notes</h3>
              <textarea 
                className="w-full bg-surface border border-surface-variant rounded p-3 text-sm focus:outline-none focus:border-[#00f2fe] text-on-surface min-h-[100px]"
                placeholder="Include link to LRA records, assessor's office documents, or physical inspection notes..."
              ></textarea>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface border border-[#00f2fe]/30 rounded-lg p-6 shadow-lg sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💰</span>
                <h3 className="font-working-title text-lg text-on-surface">Bounty Reward</h3>
              </div>
              <div className="text-4xl font-display-md text-[#00f2fe] mb-2">{quest.bounty_connects || 5} <span className="text-lg">◈</span></div>
              <p className="text-xs text-text-secondary mb-6 leading-relaxed">This Connect reward will be credited to your ledger immediately upon Owner or Admin approval of this audit.</p>
              
              <div className="border-t border-surface-variant pt-4">
                <div className="text-[10px] uppercase tracking-widest font-label-caps text-text-secondary mb-1">Audit Trail</div>
                <div className="text-xs text-on-surface">Quest Opened: {quest.date}</div>
              </div>
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
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'audits' ? 'border-[#00f2fe] text-[#00f2fe]' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("audits")}
        >
          Audit Board
        </button>
        <button 
          className={`px-6 py-3 font-working-title text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'credentials' ? 'border-[#00f2fe] text-[#00f2fe]' : 'border-transparent text-text-secondary hover:text-on-surface'}`}
          onClick={() => setActiveTab("credentials")}
        >
          My Credentials (Dossier)
        </button>
      </div>

      {activeTab === 'audits' && (
        <div className="flex flex-col gap-4 animate-[fadeIn_0.2s_ease]">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 font-label-caps text-[10px] tracking-widest text-text-secondary uppercase border-b border-surface-variant">
            <div className="col-span-5">Property Target</div>
            <div className="col-span-3">Audit Scope</div>
            <div className="col-span-2">Date Raised</div>
            <div className="col-span-2 text-right">Reward</div>
          </div>

          {quests.map(quest => (
            <div 
              key={quest.id} 
              className="card-atmosphere hov-card rounded-lg p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center cursor-pointer hover:border-[#00f2fe] transition-colors group"
              onClick={() => setActiveQuestId(quest.id)}
            >
              <div className="md:col-span-5">
                <h3 className="font-working-title text-base text-on-surface group-hover:text-[#00f2fe] transition-colors">{quest.title}</h3>
                <span className="text-xs text-text-secondary">{quest.client || "Owner"}</span>
              </div>
              <div className="md:col-span-3">
                <span className="inline-block bg-surface-alt border border-surface-variant text-text-secondary text-[10px] px-2 py-1 rounded">
                  {quest.targetField || "Document Verification"}
                </span>
              </div>
              <div className="md:col-span-2 text-xs text-text-secondary">
                {quest.date}
              </div>
              <div className="md:col-span-2 text-right">
                <span className="font-data-tabular text-[#00f2fe] font-bold">{quest.bounty_connects || 5} ◈</span>
              </div>
            </div>
          ))}

          {quests.length === 0 && (
            <div className="p-12 text-center border border-dashed border-surface-variant rounded-lg">
              <span className="text-3xl mb-2 block opacity-50">📋</span>
              <p className="text-text-secondary text-sm">No active research audits available.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-[fadeIn_0.2s_ease]">
          
          {/* Form (Left Column) */}
          <div className="xl:col-span-7 flex flex-col gap-6">
            <div className="card-atmosphere rounded-lg p-6 flex flex-col gap-6">

              <div>
                <h3 className="font-label-caps text-[10px] tracking-widest text-[#00f2fe] uppercase mb-4 border-b border-surface-variant/50 pb-2">Operational Status</h3>
                
                <div className="flex justify-between items-center mb-5 bg-surface-alt p-4 rounded border border-surface-variant">
                  <div>
                    <h4 className="font-working-title text-on-surface">Accepting New Audits</h4>
                    <p className="text-xs text-text-secondary mt-1">Toggle off if you do not have bandwidth for title tracing.</p>
                  </div>
                  <div 
                    className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors cursor-pointer ${acceptingAudits ? 'bg-[#00f2fe]' : 'bg-surface-variant'}`}
                    onClick={() => setAcceptingAudits(!acceptingAudits)}
                  >
                    <div className={`w-4 h-4 bg-background rounded-full transition-transform ${acceptingAudits ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-label-caps text-xs tracking-widest text-text-secondary uppercase mb-1">Diligence Specialty</h4>
                  <select 
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full bg-surface-alt border border-surface-variant p-3 rounded text-sm focus:outline-none focus:border-[#00f2fe] text-on-surface"
                  >
                    <option value="Commercial Due Diligence">Commercial Due Diligence</option>
                    <option value="Residential Title Tracing">Residential Title Tracing</option>
                    <option value="PEZA & IT-Park Verification">PEZA & IT-Park Verification</option>
                    <option value="Zoning & Compliance Audits">Zoning & Compliance Audits</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-surface-variant/50 pt-6">
                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-[#00f2fe] uppercase mb-4 border-b border-surface-variant/50 pb-2">Legal & Access Credentials</h3>
                  <ToggleSwitch label="PRC Licensed Appraiser" checked={certPRC} onChange={setCertPRC} primary={true} />
                  <ToggleSwitch label="LRA Direct Access (Title Tracing)" checked={certLRA} onChange={setCertLRA} primary={true} />
                  <ToggleSwitch label="LGU Zoning Expediter" checked={certLGU} onChange={setCertLGU} primary={true} />
                </div>

                <div>
                  <h3 className="font-label-caps text-[10px] tracking-widest text-[#00f2fe] uppercase mb-4 border-b border-surface-variant/50 pb-2">Base Rates (Connects)</h3>
                  
                  <div className="mb-4">
                    <h4 className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase mb-1">Physical Ocular Inspection</h4>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={rateOcular}
                        onChange={(e) => setRateOcular(e.target.value)}
                        className="w-full bg-surface-alt border border-surface-variant rounded p-3 pl-8 text-sm focus:outline-none focus:border-[#00f2fe] text-[#00f2fe] font-data-tabular font-bold" 
                      />
                      <span className="absolute left-3 top-3 text-[#00f2fe]">◈</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-label-caps text-[10px] tracking-widest text-text-secondary uppercase mb-1">Full Title & Lien Trace</h4>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={rateTrace}
                        onChange={(e) => setRateTrace(e.target.value)}
                        className="w-full bg-surface-alt border border-surface-variant rounded p-3 pl-8 text-sm focus:outline-none focus:border-[#00f2fe] text-[#00f2fe] font-data-tabular font-bold" 
                      />
                      <span className="absolute left-3 top-3 text-[#00f2fe]">◈</span>
                    </div>
                  </div>

                </div>
              </div>
              
              <button 
                className="w-full mt-4 bg-surface border border-[#00f2fe]/50 text-[#00f2fe] font-working-title font-bold px-4 py-4 rounded hover:bg-[#00f2fe]/10 transition-all uppercase tracking-wider text-sm"
                onClick={() => addToast("Investigator Dossier Updated.", "🔐")}
              >
                Save Dossier Security Profile
              </button>
            </div>
          </div>

          {/* Preview Card (Right Column) */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <h3 className="font-working-title text-xl text-on-surface flex items-center gap-2">
              Investigator Dossier <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f2fe] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f2fe]"></span></span>
            </h3>
            
            <div className="card-atmosphere rounded-lg p-6 relative overflow-hidden shadow-2xl sticky top-24 font-mono">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#00f2fe] opacity-[0.03] blur-[50px] rounded-full pointer-events-none"></div>
              
              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-surface-alt border border-surface-variant rounded flex items-center justify-center text-2xl relative">
                    📋
                    {acceptingAudits && (
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[#0a0a0a] rounded-full" title="Accepting Audits"></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-working-title text-xl text-on-surface font-sans">ScoutIt Inspector</h4>
                      <span className="bg-[#00f2fe]/10 text-[#00f2fe] font-label-caps text-[8px] uppercase tracking-widest px-2 py-0.5 rounded border border-[#00f2fe]/20">Cleared</span>
                    </div>
                    <p className="text-sm text-[#00f2fe] mt-0.5">{specialty}</p>
                  </div>
                </div>
              </div>
              
              {/* Certifications Row */}
              <div className="flex flex-col gap-2 mb-6 border-y border-surface-variant py-4">
                <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps mb-1 block font-sans">Verified Credentials</span>
                {certPRC && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-[#00f2fe]">✓</span> PRC Licensed Real Estate Appraiser
                  </div>
                )}
                {certLRA && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-[#00f2fe]">✓</span> LRA Direct Access (Title/Lien Tracing)
                  </div>
                )}
                {certLGU && (
                  <div className="flex items-center gap-2 text-sm text-on-surface">
                    <span className="text-[#00f2fe]">✓</span> LGU Zoning & Compliance Expediter
                  </div>
                )}
                {!certPRC && !certLRA && !certLGU && (
                  <span className="text-xs text-text-muted italic">No verified legal access credentials.</span>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-surface p-3 rounded border border-surface-variant/50">
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps font-sans">Ocular Inspection</span>
                  <span className="text-sm text-[#00f2fe] font-bold">◈ {rateOcular}</span>
                </div>
                <div className="flex justify-between items-center bg-surface p-3 rounded border border-surface-variant/50">
                  <span className="text-[10px] text-text-secondary uppercase tracking-widest font-label-caps font-sans">Full Title Trace</span>
                  <span className="text-sm text-[#00f2fe] font-bold">◈ {rateTrace}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
