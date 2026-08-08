"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../../context/DashboardContext";
import PhotographerHUD from "./providers/PhotographerHUD";
import ResearcherHUD from "./providers/ResearcherHUD";
import DesignerHUD from "./providers/DesignerHUD";
import { MOCK_QUESTS, USE_MOCK_DATA } from "@/data/mock";

export default function ProviderMode({ type }) {
  const { addToast } = useDashboard();
  
  // Define which services are currently active for the MVP
  const ACTIVE_SERVICES = ["photographer", "researcher", "designer"];
  const isActiveService = ACTIVE_SERVICES.includes(type?.toLowerCase());

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch live bounties from the QuestIT API we built
  useEffect(() => {
    async function fetchQuests() {
      try {
        const res = await fetch("/api/v1/questit/quests");
        if (res.ok) {
          const data = await res.json();
          setQuests(data.quests || (USE_MOCK_DATA ? MOCK_QUESTS : []));
        } else {
          setQuests(USE_MOCK_DATA ? MOCK_QUESTS : []);
        }
      } catch (err) {
        setQuests(USE_MOCK_DATA ? MOCK_QUESTS : []);
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  const providerLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Provider";

  if (!isActiveService) {
    return (
      <div className="w-full max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up-fade py-12">
        <div className="md:col-span-3 card-atmosphere p-12 md:p-24 rounded-3xl flex flex-col items-center text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent/5 rounded-full blur-3xl group-hover:bg-gold-accent/10 transition duration-500 -translate-y-1/2 translate-x-1/3" />
          <div className="w-20 h-20 bg-surface/50 border border-white/[0.04] rounded-full flex items-center justify-center mb-8 relative">
             <div className="absolute inset-0 bg-gold-accent blur-xl opacity-20 rounded-full group-hover:opacity-40 transition-opacity duration-300" />
             <span className="text-3xl relative z-10">🔒</span>
          </div>
          <h1 className="font-display-md text-4xl md:text-5xl text-on-surface mb-6 relative z-10">The Roster is Curation-Only.</h1>
          <p className="text-text-secondary font-body-md max-w-xl mb-10 leading-relaxed relative z-10">
            The <strong>{providerLabel}</strong> ecosystem is currently in Phase 2 development. We are allowing top-tier professionals to create their accounts and establish their verified identities now, ahead of the official marketplace launch.
          </p>
          <div className="flex gap-4 relative z-10">
            <button 
              className="bg-gold-accent text-black font-working-title font-bold py-4 px-10 rounded-full shadow-[0_0_20px_rgba(232,174,60,0.3)] hover:shadow-[0_0_30px_rgba(247,198,78,0.5)] hover:-translate-y-1 transition-all duration-300 ease-out active:scale-95"
              onClick={() => addToast("Your account is secured in the waitlist database.", "✅")}
            >
              Secure Your Position
            </button>
          </div>
        </div>

        <div className="md:col-span-1 card-atmosphere p-8 rounded-2xl flex flex-col justify-center hov-card cursor-pointer" onClick={() => addToast("Join the exclusive Slack channel", "💬")}>
          <span className="text-2xl mb-4 opacity-70">💬</span>
          <h3 className="text-white font-medium mb-2">Provider Community</h3>
          <p className="text-xs text-text-secondary leading-relaxed">Connect with other top-tier operators while you wait.</p>
        </div>

        <div className="md:col-span-1 card-atmosphere p-8 rounded-2xl flex flex-col justify-center hov-card cursor-pointer" onClick={() => addToast("Downloading quality standards...", "📥")}>
          <span className="text-2xl mb-4 opacity-70">📑</span>
          <h3 className="text-white font-medium mb-2">Quality Standards</h3>
          <p className="text-xs text-text-secondary leading-relaxed">Review the minimum requirements for the ScoutIt roster.</p>
        </div>

        <div className="md:col-span-1 card-atmosphere p-8 rounded-2xl flex flex-col justify-center hov-card cursor-pointer" onClick={() => addToast("Checking vetting status...", "⏳")}>
          <span className="text-2xl mb-4 opacity-70">🛡️</span>
          <h3 className="text-white font-medium mb-2">Vetting Status</h3>
          <p className="text-xs text-text-secondary leading-relaxed">Track your application through the curation pipeline.</p>
        </div>
      </div>
    );
  }

  // Determine which curated HUD to render based on provider type
  const renderCuratedHUD = () => {
    if (loading) {
      return <div className="p-12 text-center text-text-secondary animate-pulse">Syncing QuestIT Bounties...</div>;
    }

    switch (type) {
      case "photographer":
        return <PhotographerHUD projects={quests} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} />;
      case "researcher":
        return <ResearcherHUD quests={quests} activeQuestId={activeProjectId} setActiveQuestId={setActiveProjectId} />;
      case "designer":
        return <DesignerHUD projects={quests} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} />;
      default:
        // Generic fallback or default to Photographer
        return <PhotographerHUD projects={quests} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId} />;
    }
  };

  // --- MASTER CONTROL PAGE ---
  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-8 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-surface-variant pb-6">
        <div>
          <span className="font-label-caps text-gold-accent tracking-widest uppercase mb-2 block">Provider Workspace</span>
          <h1 className="font-display-md text-3xl md:text-5xl text-on-surface mb-2">{providerLabel} Command Center</h1>
        </div>
        <div className="flex gap-4">
          <button 
            className="bg-gold-accent text-background font-working-title font-bold px-6 py-2 rounded shadow-lg hover:opacity-90 transition-opacity"
            onClick={() => addToast("Bounty refresh complete.", "🔄")}
          >
            Refresh Board
          </button>
        </div>
      </div>

      {/* Render the specific HUD injected into the master layout */}
      <div className="w-full">
        {USE_MOCK_DATA && quests === MOCK_QUESTS && (
          <div className="text-sm text-[#e8c84a] bg-[rgba(232,200,74,0.1)] p-3 rounded-md mb-4 border border-[rgba(232,200,74,0.2)]">
            Showing sample bounties — live feed unavailable.
          </div>
        )}
        {renderCuratedHUD()}
      </div>
    </div>
  );
}

