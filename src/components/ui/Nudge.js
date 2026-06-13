"use client";

import { useState, useEffect } from "react";
import { Camera } from "lucide-react";

// Hardcoded logic rules per Section 8
const NUDGE_CONTENT = {
  owner: {
    icon: "📈",
    title: "Boost Your Listing",
    desc: "You have 50+ views but 0 pitches. Upgrade to featured placement to reach top-tier brokers.",
    action: "Upgrade Now"
  },
  broker: {
    icon: "⚡",
    title: "Get Featured Placement",
    desc: "Your response rate is top 10%, but your rank is low. Unlock the 'Top Broker' badge.",
    action: "Unlock Badge"
  },
  buyer: {
    icon: "🕵️",
    title: "Unlock Market Intel",
    desc: "You have 10 saved listings. Unlock the full Intel Dashboard to see historical yields.",
    action: "Get Intel"
  },
  provider: {
    icon: <Camera strokeWidth={1.5} size="1em" />,
    title: "Expand Your Portfolio",
    desc: "You've hit the free portfolio limit. Upgrade to add unlimited media.",
    action: "Upgrade Plan"
  }
};

export default function Nudge({ mode }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // 1. Check if this specific nudge was dismissed recently (max 1 per week rule)
    const dismissedAt = localStorage.getItem(`nudge_dismissed_${mode}`);
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) {
        return; // Don't show, dismissed within the last 7 days
      }
    }

    // 2. Hard rule: NO nudges during a user's first 7 days
    let isAccountMature = false;
    try {
      const user = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (user?.created_at) {
        const daysSinceSignup = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        isAccountMature = daysSinceSignup >= 7;
      }
    } catch (e) { /* no user, no nudge */ }


    // 3. Mock logic triggers (Assume all thresholds are met for the sake of UI demo)
    if (isAccountMature && NUDGE_CONTENT[mode]) {
      // Small delay to let the dashboard render first, making the slide-down animation pop
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`nudge_dismissed_${mode}`, Date.now().toString());
  };

  if (!isVisible || !NUDGE_CONTENT[mode]) return null;

  const content = NUDGE_CONTENT[mode];

  return (
    <div className="relative mb-6 rounded-lg overflow-hidden border border-gold-accent bg-surface animate-[slideDown_0.6s_ease-out_forwards]">
      <div className="absolute inset-0 bg-gold-accent opacity-5"></div>
      <div className="absolute -left-12 -top-12 w-32 h-32 bg-gold-accent opacity-20 blur-[40px] pointer-events-none"></div>
      
      <div className="relative p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="text-3xl bg-surface-alt p-3 rounded-md shrink-0">
            {content.icon}
          </div>
          <div>
            <h4 className="font-working-title text-gold-accent text-base mb-1">{content.title}</h4>
            <p className="text-sm text-text-secondary">{content.desc}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button className="flex-1 md:flex-none bg-gold-accent text-background font-working-title text-sm font-bold py-2 px-6 rounded hover:opacity-90 transition-all whitespace-nowrap">
            {content.action}
          </button>
          <button 
            className="w-10 h-10 flex items-center justify-center rounded border border-surface-variant text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" 
            onClick={handleDismiss} 
            title="Dismiss for 7 days"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
