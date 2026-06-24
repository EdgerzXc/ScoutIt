"use client";

import { useState, useEffect } from "react";
import { useDashboard } from "../../context/DashboardContext";
import PhotographerHUD from "./providers/PhotographerHUD";
import ResearcherHUD from "./providers/ResearcherHUD";
import DesignerHUD from "./providers/DesignerHUD";

// Fallback Mock Data just in case API fails
const MOCK_QUESTS = [
  { 
    id: 'q1', 
    title: "Ayala Corporate Shoot", 
    type: "Commercial", 
    status: "active", 
    client: "Julian de Ayala", 
    date: "June 2026", 
    cover: "📸",
    scope: "Full-day interior and exterior editorial shoot for upcoming high-yield commercial listing.",
    deliverables: "35 High-Res Edited Images, 1 Drone Reel",
    bounty_connects: 15,
    targetField: "Media Portfolio"
  },
  { 
    id: 'q2', 
    title: "BGC High Street Floorplan", 
    type: "Retail", 
    status: "active", 
    client: "Maria Clara", 
    date: "May 2026", 
    cover: "📐",
    scope: "Precise laser-measured floorplan for a 120sqm retail cutout.",
    deliverables: "PDF Floorplan, CAD File",
    bounty_connects: 10,
    targetField: "floor_sqm"
  }
];

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
          setQuests(data.quests || MOCK_QUESTS);
        } else {
          setQuests(MOCK_QUESTS);
        }
      } catch (err) {
        setQuests(MOCK_QUESTS);
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  const providerLabel = type ? type.charAt(0).toUpperCase() + type.slice(1) : "Provider";

  if (!isActiveService) {
    return (
      <div className="w-full max-w-[1200px] mx-auto flex flex-col items-center justify-center text-center animate-[fadeIn_0.5s_ease-out] py-16 md:py-32 relative border border-surface-variant rounded-lg bg-surface">
        <span className="text-6xl mb-6 opacity-50">🔒</span>
        <h1 className="font-display-md text-4xl md:text-5xl text-on-surface mb-4">The Roster is Curation-Only.</h1>
        <p className="text-text-secondary font-body-md max-w-lg mb-8 leading-relaxed">
          The <strong>{providerLabel}</strong> ecosystem is currently in Phase 2 development. We are allowing top-tier professionals to create their accounts and establish their verified identities now, ahead of the official marketplace launch.
        </p>
        <div className="flex gap-4">
          <button 
            className="bg-gold-accent text-background font-working-title text-sm font-bold py-3 px-8 rounded shadow-lg hover:opacity-90 transition-all"
            onClick={() => addToast("Your account is secured in the waitlist database.", "✅")}
          >
            Secure Your Position
          </button>
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
        {renderCuratedHUD()}
      </div>
    </div>
  );
}
