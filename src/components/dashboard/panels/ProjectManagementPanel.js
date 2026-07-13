"use client";

import { useState, useEffect } from "react";
import GlassPanel from "../../ui/GlassPanel";

const MILESTONES = [
  { id: "m1", label: "Pre-Selling", status: "completed" },
  { id: "m2", label: "Groundbreaking", status: "completed" },
  { id: "m3", label: "Excavation", status: "completed" },
  { id: "m4", label: "Structural Works", status: "in-progress", progress: 65 },
  { id: "m5", label: "Topping Off", status: "pending" },
  { id: "m6", label: "Turnover", status: "pending" }
];

const DAILY_UPDATES = [
  {
    id: "u1",
    author: "Engr. Marco Reyes",
    role: "Site Manager",
    date: "Today, 10:30 AM",
    tag: "Construction",
    tagColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    content: "Poured concrete for the 14th floor slab. Rebar installations for 15th floor starting this afternoon. Weather is holding up.",
    media: true
  },
  {
    id: "u2",
    author: "Sarah Gomez",
    role: "Marketing Dir.",
    date: "Yesterday, 4:15 PM",
    tag: "Sales & Mktg",
    tagColor: "bg-green-500/20 text-green-400 border-green-500/30",
    content: "Closed 3 units in the South Tower today. Re-allocating ad spend towards Facebook lead gen for the remaining 2BR inventory.",
    media: false
  },
  {
    id: "u3",
    author: "Atty. Cruz",
    role: "Legal",
    date: "Yesterday, 1:00 PM",
    tag: "Legal/Permits",
    tagColor: "bg-red-500/20 text-red-400 border-red-500/30",
    content: "Clubhouse permits delayed by 1 week due to zoning clarification at the LGU. Filed the supplementary documents this morning.",
    media: false
  }
];

export default function ProjectManagementPanel({ properties = [] }) {
  const estates = properties.length > 0 ? properties : [
    { id: "e1", title: "Acqua Private Residences", location: "Mandaluyong City", status: "Active" },
    { id: "e2", title: "Century City", location: "Makati City", status: "Active" }
  ];

  const [activeEstate, setActiveEstate] = useState(estates[0].id);

  // If properties prop updates, ensure activeEstate is still valid
  useEffect(() => {
    if (properties.length > 0 && !properties.find(p => p.id === activeEstate)) {
      setActiveEstate(properties[0].id);
    }
  }, [properties, activeEstate]);

  const currentEstate = estates.find(e => e.id === activeEstate) || estates[0];

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
            value={activeEstate}
            onChange={(e) => setActiveEstate(e.target.value)}
            className="w-full bg-surface-alt border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-gold-accent transition-colors truncate"
          >
            {estates.map(est => (
              <option key={est.id} value={est.id}>{est.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Milestone Tracker */}
      <GlassPanel className="p-6">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <h3 className="text-lg font-medium text-white">Development Milestones</h3>
          <span className="text-sm text-gold-accent font-mono bg-gold-accent/10 px-3 py-1 rounded-full border border-gold-accent/20">Target Turnover: Q4 2028</span>
        </div>
        
        <div className="relative pt-4 pb-8">
          {/* Progress Bar Background */}
          <div className="absolute top-8 left-0 w-full h-1 bg-white/10 rounded-full"></div>
          {/* Active Progress Bar */}
          <div className="absolute top-8 left-0 w-[55%] h-1 bg-gold-accent rounded-full shadow-[0_0_10px_rgba(232,174,60,0.5)]"></div>

          <div className="relative flex justify-between">
            {MILESTONES.map((milestone, idx) => (
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
            <div className="flex flex-col divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
              {DAILY_UPDATES.map((update) => (
                <div key={update.id} className="p-6 hover:bg-white/[0.02] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-alt border border-white/10 flex items-center justify-center text-white font-medium">
                        {update.author.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{update.author}</div>
                        <div className="text-xs text-text-secondary">{update.role} • {update.date}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded border uppercase tracking-wider font-medium ${update.tagColor}`}>
                      {update.tag}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed pl-13 ml-13">
                    {update.content}
                  </p>
                  {update.media && (
                    <div className="mt-4 ml-13 h-32 w-48 bg-black/50 border border-white/10 rounded-lg flex items-center justify-center text-text-muted text-xs">
                      [Attached Photo: Slab Pouring]
                    </div>
                  )}
                </div>
              ))}
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
              <p className="text-xs text-text-secondary">Synthesized from team updates • Generated 8:00 AM</p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-white leading-relaxed">
                <span className="font-medium">{currentEstate.title}</span> is currently making good progress on structural works (14th floor), weather permitting.
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="text-xs font-medium text-red-400 mb-1">⚠️ Risk Identified</div>
                <div className="text-xs text-white/80 leading-relaxed">Clubhouse construction may be delayed by 1 week due to pending permits. Legal has filed supplementary docs.</div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-xs font-medium text-green-400 mb-1">📈 Marketing Momentum</div>
                <div className="text-xs text-white/80 leading-relaxed">South Tower sales are performing above target. Marketing is re-allocating budget to push 2BR inventory.</div>
              </div>
            </div>
          </GlassPanel>
        </div>

      </div>
    </div>
  );
}
