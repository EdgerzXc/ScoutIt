"use client";

import { useState, useEffect } from "react";
import GlassPanel from "../../ui/GlassPanel";

// Illustrative development stages — clearly labeled as a sample preview in the
// UI until real project milestone data exists (Honest Blank Rule: no invented
// people, dates, or progress presented as real).
const SAMPLE_MILESTONES = [
  { id: "m1", label: "Pre-Selling", status: "completed" },
  { id: "m2", label: "Groundbreaking", status: "completed" },
  { id: "m3", label: "Excavation", status: "completed" },
  { id: "m4", label: "Structural Works", status: "in-progress", progress: 65 },
  { id: "m5", label: "Topping Off", status: "pending" },
  { id: "m6", label: "Turnover", status: "pending" }
];

export default function ProjectManagementPanel({ properties = [] }) {
  const estates = properties;

  const [activeEstate, setActiveEstate] = useState(estates[0]?.id || null);

  // If properties prop updates, ensure activeEstate is still valid
  useEffect(() => {
    if (properties.length > 0 && !properties.find(p => p.id === activeEstate)) {
      setActiveEstate(properties[0].id);
    }
  }, [properties, activeEstate]);

  const currentEstate = estates.find(e => e.id === activeEstate) || estates[0];

  if (estates.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-slide-up-fade pb-12">
        <div>
          <h2 className="text-2xl font-light tracking-wide text-white mb-1">Project Tracker & Feed</h2>
          <p className="text-sm text-text-secondary max-w-xl">
            Monitor construction milestones and daily on-the-ground updates from your team.
          </p>
        </div>
        <GlassPanel className="p-12 flex flex-col items-center justify-center text-center gap-3">
          <span className="text-3xl">🏗️</span>
          <h3 className="text-white font-medium">No projects yet</h3>
          <p className="text-sm text-text-secondary max-w-sm">
            Add a property to your portfolio and it becomes a project you can track here — milestones, team updates, and briefings in one feed.
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
          <label className="block text-[10px] tracking-widest text-gold-accent uppercase mb-2">Select Active Project</label>
          <select
            value={activeEstate || ""}
            onChange={(e) => setActiveEstate(e.target.value)}
            className="w-full bg-surface-alt border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-gold-accent transition-colors truncate"
          >
            {estates.map(est => (
              <option key={est.id} value={est.id}>{est.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestone Tracker — illustrative until real milestone data exists */}
      <GlassPanel className="p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="text-lg font-medium text-white flex flex-wrap items-center gap-2">
            Development Milestones
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-accent border border-gold-accent/30 bg-gold-accent/10 rounded px-1.5 py-0.5">Sample preview</span>
          </h3>
          <span className="text-xs text-text-secondary font-mono">Milestone tracking connects to your project data at launch</span>
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
            <div className="absolute top-8 left-0 w-[55%] h-1 bg-gold-accent rounded-full shadow-[0_0_10px_rgba(232,174,60,0.5)]"></div>

            <div className="relative flex justify-between">
              {SAMPLE_MILESTONES.map((milestone, idx) => (
              <div key={milestone.id} className="flex flex-col items-center gap-3 w-24 relative -ml-12 first:ml-0 last:-mr-12">
                <div className={`w-4 h-4 rounded-full z-10 border-2 ${
                  milestone.status === 'completed' ? 'bg-gold-accent border-gold-accent shadow-[0_0_8px_rgba(232,174,60,0.8)]' : 
                  milestone.status === 'in-progress' ? 'bg-black border-gold-accent shadow-[0_0_8px_rgba(232,174,60,0.8)]' :
                  'bg-black border-white/20'
                }`}></div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${milestone.status === 'pending' ? 'text-text-secondary' : 'text-white'}`}>
                    {milestone.label}
                  </div>
                  {milestone.status === 'in-progress' && (
                    <div className="text-[10px] text-gold-accent mt-1 font-mono">{milestone.progress}%</div>
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
              <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors">
                + Post Update
              </button>
            </div>
            <div className="flex flex-col items-center justify-center text-center py-14 px-6 gap-3">
              <div className="w-12 h-12 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-xl">📋</div>
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
                <span className="text-gold-accent">✨</span>
                <h3 className="text-sm font-medium tracking-widest text-gold-accent uppercase">AI Executive Briefing</h3>
              </div>
              <p className="text-xs text-text-secondary">Synthesized from your team&apos;s updates</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-secondary leading-relaxed">
                Once your team posts daily updates for <span className="text-white font-medium">{currentEstate?.title || "this project"}</span>, the AI distills them into a morning briefing — progress, risks, and momentum in three lines instead of thirty posts.
              </p>
              <div className="text-[10px] font-mono uppercase tracking-widest text-text-secondary border border-white/10 bg-white/[0.02] rounded px-2 py-1.5 inline-block">
                Waiting for first updates
              </div>
            </div>
          </GlassPanel>
        </div>

      </div>
    </div>
  );
}
