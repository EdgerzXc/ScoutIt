"use client";

import { useState, useEffect, useMemo } from "react";
import GlassPanel from "../../ui/GlassPanel";
import { Building2, ClipboardList, Sparkles, RotateCcw } from "lucide-react";

// Illustrative vertical milestone templates — clearly labeled as a sample
// preview in the UI until real project milestone data exists on the estate
// (`estate.project_milestones` or `estate.details.project_milestones`).
const VERTICAL_PRESETS = [
  {
    id: "development",
    label: "Real Estate Development",
    milestones: [
      { id: "m1", label: "Pre-Selling", status: "completed" },
      { id: "m2", label: "Groundbreaking", status: "completed" },
      { id: "m3", label: "Excavation", status: "completed" },
      { id: "m4", label: "Structural Works", status: "in-progress", progress: 65 },
      { id: "m5", label: "Topping Off", status: "pending" },
      { id: "m6", label: "Turnover", status: "pending" },
    ],
  },
  {
    id: "restaurant",
    label: "Restaurant / F&B Launch",
    milestones: [
      { id: "r1", label: "Lease Signed", status: "completed" },
      { id: "r2", label: "MEP & Exhaust", status: "completed" },
      { id: "r3", label: "Kitchen Fit-Out", status: "in-progress", progress: 55 },
      { id: "r4", label: "Acoustic & Zones", status: "pending" },
      { id: "r5", label: "Sanitary & LGU", status: "pending" },
      { id: "r6", label: "Soft Opening", status: "pending" },
    ],
  },
  {
    id: "hospitality",
    label: "Hospitality / Hotel Opening",
    milestones: [
      { id: "h1", label: "Key Hierarchy", status: "completed" },
      { id: "h2", label: "Suite Mockups", status: "completed" },
      { id: "h3", label: "Amenity Layers", status: "in-progress", progress: 60 },
      { id: "h4", label: "Rate Matrix", status: "pending" },
      { id: "h5", label: "VIP Gate Test", status: "pending" },
      { id: "h6", label: "Grand Opening", status: "pending" },
    ],
  },
  {
    id: "brokerage",
    label: "Brokerage Mandate Rollout",
    milestones: [
      { id: "b1", label: "Mandate Signed", status: "completed" },
      { id: "b2", label: "Dossier Audit", status: "completed" },
      { id: "b3", label: "Deal Room Live", status: "in-progress", progress: 70 },
      { id: "b4", label: "Unit Delegation", status: "pending" },
      { id: "b5", label: "Buyer Screening", status: "pending" },
      { id: "b6", label: "Closing", status: "pending" },
    ],
  },
  {
    id: "venue",
    label: "Event Venue Commissioning",
    milestones: [
      { id: "v1", label: "Floorplan CAD", status: "completed" },
      { id: "v2", label: "Layout Matrix", status: "completed" },
      { id: "v3", label: "AV & Rigging", status: "in-progress", progress: 50 },
      { id: "v4", label: "Load-In Rules", status: "pending" },
      { id: "v5", label: "Charter Rates", status: "pending" },
      { id: "v6", label: "Live Booking", status: "pending" },
    ],
  },
  {
    id: "str",
    label: "STR Portfolio Onboarding",
    milestones: [
      { id: "s1", label: "Unit Catalog", status: "completed" },
      { id: "s2", label: "iCal Sync", status: "completed" },
      { id: "s3", label: "Pricing Tiers", status: "in-progress", progress: 75 },
      { id: "s4", label: "Instant Verify", status: "pending" },
      { id: "s5", label: "Check-In Guide", status: "pending" },
      { id: "s6", label: "Go-Live", status: "pending" },
    ],
  },
];

export default function ProjectManagementPanel({ properties = [] }) {
  const estates = properties;

  const [activeEstate, setActiveEstate] = useState(estates[0]?.id || null);
  const [selectedPresetId, setSelectedPresetId] = useState(VERTICAL_PRESETS[0].id);
  const [presetOverridesByEstate, setPresetOverridesByEstate] = useState({});

  // If properties prop updates, ensure activeEstate is still valid
  useEffect(() => {
    if (properties.length > 0 && !properties.find(p => p.id === activeEstate)) {
      setActiveEstate(properties[0].id);
    }
  }, [properties, activeEstate]);

  const currentEstate = estates.find(e => e.id === activeEstate) || estates[0];
  const savedCustomMilestones = useMemo(() => {
    const raw = currentEstate?.project_milestones ?? currentEstate?.details?.project_milestones;
    return Array.isArray(raw) && raw.length > 0 ? raw : null;
  }, [currentEstate]);

  const activePreset = useMemo(
    () => VERTICAL_PRESETS.find((p) => p.id === selectedPresetId) || VERTICAL_PRESETS[0],
    [selectedPresetId],
  );

  const overridePresetId = currentEstate?.id ? presetOverridesByEstate[currentEstate.id] : null;
  const activeMilestones = useMemo(() => {
    if (overridePresetId) {
      const overridden = VERTICAL_PRESETS.find((p) => p.id === overridePresetId);
      if (overridden) return overridden.milestones;
    }
    if (savedCustomMilestones) return savedCustomMilestones;
    return activePreset.milestones;
  }, [overridePresetId, savedCustomMilestones, activePreset]);

  const progressPct = useMemo(() => {
    if (!activeMilestones.length) return 0;
    const score = activeMilestones.reduce((acc, m) => {
      if (m.status === "completed") return acc + 1;
      if (m.status === "in-progress") return acc + 0.5;
      return acc;
    }, 0);
    return Math.round((score / activeMilestones.length) * 100);
  }, [activeMilestones]);

  const handleApplyPreset = () => {
    if (!currentEstate?.id) return;
    setPresetOverridesByEstate((prev) => ({
      ...prev,
      [currentEstate.id]: selectedPresetId,
    }));
  };

  const handlePresetChange = (nextId) => {
    setSelectedPresetId(nextId);
    if (currentEstate?.id && overridePresetId) {
      setPresetOverridesByEstate((prev) => ({
        ...prev,
        [currentEstate.id]: nextId,
      }));
    }
  };

  if (estates.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-slide-up-fade pb-12">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-white mb-1">Project Tracker & Feed</h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Monitor construction milestones and daily on-the-ground updates from your team.
          </p>
        </div>
        <GlassPanel className="p-8 md:p-12 flex flex-col items-center justify-center text-center gap-3 break-words">
          <Building2 size={36} className="text-gold-accent/60 mb-1" />
          <h3 className="text-white font-medium">No projects yet</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Add a property to your portfolio and it becomes a project you can track here: milestones, team updates, and briefings in one feed.
          </p>
        </GlassPanel>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-slide-up-fade pb-12">
      {/* Header & Estate Selector */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-white mb-1">Project Tracker & Feed</h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Monitor construction milestones and track daily on-the-ground updates from your team.
          </p>
        </div>
        <div className="w-full md:w-64">
          <label className="block text-[12px] tracking-widest text-gold-accent uppercase mb-2">Select Active Project</label>
          <select
            value={activeEstate || ""}
            onChange={(e) => setActiveEstate(e.target.value)}
            className="w-full min-h-11 bg-surface-alt border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-gold-accent transition truncate"
          >
            {estates.map(est => (
              <option key={est.id} value={est.id}>{est.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestone Tracker — illustrative until real milestone data exists */}
      <GlassPanel className="p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-lg font-medium text-white flex flex-wrap items-center gap-2">
              Project Milestones
              <span className="text-[12px] font-mono uppercase tracking-widest text-gold-accent border border-gold-accent/30 bg-gold-accent/10 rounded px-1.5 py-0.5">
                {savedCustomMilestones && !overridePresetId ? "Saved dossier" : "Preset template"}
              </span>
            </h3>
            <span className="text-xs text-text-secondary font-mono mt-1 block">
              {savedCustomMilestones && !overridePresetId
                ? "Showing saved milestones for this estate — select a vertical preset to reset"
                : "Milestone tracking connects to your project data at launch"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="project-vertical-preset" className="sr-only">
              Vertical milestone preset
            </label>
            <select
              id="project-vertical-preset"
              value={selectedPresetId}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="min-h-11 bg-surface-alt border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-gold-accent transition"
            >
              {VERTICAL_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleApplyPreset}
              className="min-h-11 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gold-accent/40 bg-gold-accent/10 text-gold-accent text-xs font-mono uppercase tracking-wider hover:bg-gold-accent/20 transition"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Load Preset</span>
            </button>
          </div>
        </div>
        
        {/* Horizontal scroll on mobile — the timeline needs ~560px for six
            labelled nodes; the old fixed-width row collapsed them into an
            overlapping, unreadable mess on phones. Bleeds to the panel edges on
            mobile, reverts to the full-width static layout from md up. */}
        <div className="-mx-6 px-6 overflow-x-auto scrollbar-none md:mx-0 md:px-0 md:overflow-x-visible" style={{ scrollbarWidth: "none" }}>
          <div className="relative pt-4 pb-8 min-w-[560px] md:min-w-0">
            {/* Progress Bar Background */}
            <div className="absolute top-8 left-0 w-full h-1 bg-white/10 rounded-full"></div>
            {/* Active Progress Bar */}
            <div
              className="absolute top-8 left-0 h-1 bg-gold-accent rounded-full shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            ></div>

            <div className="relative flex justify-between">
              {activeMilestones.map((milestone) => (
              <div key={milestone.id} className="flex flex-col items-center gap-3 w-24 relative -ml-12 first:ml-0 last:-mr-12">
                <div className={`w-4 h-4 rounded-full z-10 border-2 ${
                  milestone.status === 'completed' ? 'bg-gold-accent border-gold-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]' : 
                  milestone.status === 'in-progress' ? 'bg-black border-gold-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.8)]' :
                  'bg-black border-white/20'
                }`}></div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${milestone.status === 'pending' ? 'text-text-secondary' : 'text-white'}`}>
                    {milestone.label}
                  </div>
                  {milestone.status === 'in-progress' && (
                    <div className="text-[12px] text-gold-accent mt-1 font-mono">{milestone.progress}%</div>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: The Daily Feed */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <GlassPanel className="p-0 overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Daily Team Updates</h3>
              <button
                type="button"
                disabled
                title="Daily team updates open in Phase 2"
                className="min-h-11 border border-gold-accent/40 bg-gold-accent/10 text-gold-accent px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                + Post Update · Phase 2
              </button>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-14 px-6 gap-3">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-gold-accent">
                <ClipboardList size={22} />
              </div>
              <p className="text-sm text-white font-medium">No updates posted yet</p>
              <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
                When your site managers, marketing, and legal team post daily updates for {currentEstate?.title || "this project"}, they land here as a running feed.
              </p>
            </div>
          </GlassPanel>
        </div>

        {/* Right Col: AI Briefing */}
        <div className="flex flex-col gap-6">
          <GlassPanel className="p-0 border border-gold-accent/20 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold-accent to-transparent"></div>
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" aria-hidden="true" />
                <h3 className="text-sm font-medium tracking-widest text-gold-accent uppercase">Executive Briefing</h3>
              </div>
              <p className="text-xs text-text-secondary">Synthesized from team dispatches</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Once your team posts daily updates for <span className="text-white font-medium">{currentEstate?.title || "this project"}</span>, this console synthesizes them into an executive morning briefing: progress, risks, and momentum in three structured lines.
              </p>
              <div className="text-[12px] font-mono uppercase tracking-widest text-text-secondary border border-white/10 bg-white/[0.02] rounded px-2 py-1.5 inline-block">
                Waiting for first updates
              </div>
            </div>
          </GlassPanel>
        </div>

      </div>
    </div>
  );
}
