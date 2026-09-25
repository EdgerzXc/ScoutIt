"use client";

import { useState } from "react";
import { Camera } from "lucide-react";

// Hardcoded logic rules per Section 8
const NUDGE_CONTENT = {
  owner: {
    icon: "📈",
    title: "Boost Your Listing",
    desc: "Your listing is live. Featured placement puts it in front of top-tier brokers.",
    action: "Upgrade Now"
  },
  broker: {
    icon: "⚡",
    title: "Get Featured Placement",
    desc: "Featured placement and the Top Broker badge mark advisors with proven response records.",
    action: "Unlock Badge"
  },
  buyer: {
    icon: "🕵️",
    title: "Unlock Market Intel",
    desc: "Saved listings live on your board. The full Intel Dashboard adds historical yields.",
    action: "Get Intel"
  },
  provider: {
    icon: <Camera strokeWidth={1.5} size="1em" />,
    title: "Expand Your Portfolio",
    desc: "The free portfolio has a media limit. Upgrade to add unlimited media.",
    action: "Upgrade Plan"
  }
};

export default function Nudge({ mode }) {
  // Decided synchronously at mount (not 1.5s after paint): a banner that
  // slides in late shoves every workspace card down mid-scroll on a phone.
  // The enter animation still plays on mount, so the pop survives without
  // the layout jump.
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (localStorage.getItem(`nudge_dismissed_${mode}`)) {
        const daysSinceDismissal =
          (Date.now() - parseInt(localStorage.getItem(`nudge_dismissed_${mode}`), 10)) /
          (1000 * 60 * 60 * 24);
        if (daysSinceDismissal < 7) return false;
      }
      const user = JSON.parse(localStorage.getItem("scoutit_user") || "null");
      if (user?.created_at) {
        const daysSinceSignup =
          (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceSignup < 7) return false;
      } else {
        return false;
      }
    } catch {
      return false;
    }
    return Boolean(NUDGE_CONTENT[mode]);
  });

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
          <button className="flex-1 md:flex-none min-h-11 inline-flex items-center justify-center bg-gold-accent text-background font-working-title text-sm font-bold py-2 px-6 rounded hover:opacity-90 transition-all whitespace-nowrap">
            {content.action}
          </button>
          <button 
            className="min-h-11 min-w-11 flex items-center justify-center rounded border border-surface-variant text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" 
            onClick={handleDismiss} 
            title="Dismiss for 7 days"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
