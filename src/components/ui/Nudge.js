"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, Compass, TrendingUp, Zap, X } from "lucide-react";
import { readUser } from "@/lib/entitlements";
import { logPaywallConversionIntent } from "@/lib/monetizationGate";

// Hardcoded logic rules per Section 8
const NUDGE_CONTENT = {
  owner: {
    icon: <TrendingUp strokeWidth={1.5} size="1em" />,
    title: "Boost Your Listing",
    desc: "Your listing is live. Featured placement puts it in front of top-tier brokers.",
    action: "Upgrade Now",
    href: "/pricing/owner"
  },
  broker: {
    icon: <Zap strokeWidth={1.5} size="1em" />,
    title: "Get Featured Placement",
    desc: "Featured placement and the Top Broker badge mark advisors with proven response records.",
    action: "Unlock Badge",
    href: "/pricing/broker"
  },
  buyer: {
    icon: <Compass strokeWidth={1.5} size="1em" />,
    title: "Unlock Market Intel",
    desc: "Saved listings live on your board. The full Intel Dashboard adds historical yields.",
    action: "Get Intel",
    href: "/pricing/seeker"
  },
  provider: {
    icon: <Camera strokeWidth={1.5} size="1em" />,
    title: "Expand Your Portfolio",
    desc: "The free portfolio has a media limit. Upgrade to add unlimited media.",
    action: "Upgrade Plan",
    href: "/pricing/creator"
  }
};

function isEligibleForNudge(mode, createdAt) {
  if (!NUDGE_CONTENT[mode] || !createdAt) return false;
  try {
    const dismissedAt = localStorage.getItem(`nudge_dismissed_${mode}`);
    if (dismissedAt) {
      const daysSinceDismissal = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissal < 7) return false;
    }
    const daysSinceSignup = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceSignup >= 7;
  } catch {
    return false;
  }
}

export default function Nudge({ mode }) {
  const router = useRouter();
  // Decided synchronously at mount when cached user is present, with a fallback
  // check against Supabase Auth session when `scoutit_user` is absent (GAP-47 / GAP-83).
  const [isVisible, setIsVisible] = useState(() => {
    const user = readUser();
    return isEligibleForNudge(mode, user?.created_at);
  });

  useEffect(() => {
    if (isVisible || !NUDGE_CONTENT[mode]) return;
    let active = true;
    (async () => {
      try {
        const { supabase } = await import("@/lib/supabaseClient");
        if (supabase?.auth?.getSession) {
          const { data } = await supabase.auth.getSession();
          const createdAt = data?.session?.user?.created_at;
          if (active && isEligibleForNudge(mode, createdAt)) {
            setIsVisible(true);
          }
        }
      } catch {}
    })();
    return () => { active = false; };
  }, [isVisible, mode]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`nudge_dismissed_${mode}`, Date.now().toString());
  };

  if (!isVisible || !NUDGE_CONTENT[mode]) return null;

  const content = NUDGE_CONTENT[mode];

  const handleAction = () => {
    logPaywallConversionIntent({
      feature: `nudge_${mode}`,
      tier: mode,
      metadata: { target: content.href }
    });
    if (router?.push) {
      router.push(content.href);
    } else if (typeof window !== "undefined") {
      window.location.assign(content.href);
    }
  };

  return (
    <div className="relative mb-6 rounded-lg overflow-hidden border border-gold-accent bg-surface animate-[slideDown_0.6s_ease-out_forwards]">
      <div className="absolute inset-0 bg-gold-accent opacity-5"></div>
      <div className="absolute -left-12 -top-12 w-32 h-32 bg-gold-accent opacity-20 blur-[40px] pointer-events-none"></div>
      
      <div className="relative p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-4">
          <div className="text-3xl bg-surface-alt p-3 rounded-md shrink-0 text-gold-accent">
            {content.icon}
          </div>
          <div>
            <h4 className="font-working-title text-gold-accent text-base mb-1">{content.title}</h4>
            <p className="text-sm text-text-secondary">{content.desc}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
          <button
            type="button"
            onClick={handleAction}
            className="flex-1 md:flex-none min-h-11 inline-flex items-center justify-center bg-gold-accent text-background font-working-title text-sm font-bold py-2 px-6 rounded hover:opacity-90 transition-[transform,opacity,background-color] duration-150 ease-out active:scale-[0.98] touch-manipulation whitespace-nowrap"
          >
            {content.action}
          </button>
          <button 
            type="button"
            className="min-h-11 min-w-11 flex items-center justify-center rounded border border-surface-variant text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" 
            onClick={handleDismiss} 
            title="Dismiss for 7 days"
            aria-label="Dismiss"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
