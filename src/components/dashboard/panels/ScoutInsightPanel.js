import React, { useMemo } from 'react';
import { computeListingStrength } from '../../../lib/listingStrength';
import GlassPanel from '../../ui/GlassPanel';

export default function ScoutInsightPanel({ pitches, listings, taskSummary }) {
  // Scout Insight (Layer 3, DASHBOARD_ATMOSPHERE_FRAMEWORK.md): rule-based
  // only, per the Honest Blank Rule — every line below is a fact the broker
  // can verify themselves (counts and field-completeness checks), never a
  // fabricated probability. When there's nothing to say, it says so.
  const insights = useMemo(() => {
    const list = [];
    const incoming = pitches.filter(p => p.isCurrentUserBroker && p.status === 'invited');
    if (incoming.length > 0) {
      list.push({
        icon: "🤝",
        text: `${incoming.length} incoming handshake${incoming.length === 1 ? '' : 's'} awaiting your response — accepting unlocks owner contact details.`,
        rule: "Deals with status 'invited'",
      });
    }
    if (taskSummary?.overdue > 0) {
      list.push({
        icon: "⏰",
        text: `${taskSummary.overdue} task${taskSummary.overdue === 1 ? ' is' : 's are'} overdue — check your task list below.`,
        rule: "Open tasks past their due date",
      });
    }
    // Weakest listing in the verified portfolio, with what's missing.
    const acceptedDeals = pitches.filter(p => p.isCurrentUserBroker && p.status === 'accepted');
    let weakest = null;
    for (const deal of acceptedDeals) {
      const prop = listings.find(l => l.id === deal.listingId);
      if (!prop) continue;
      const strength = computeListingStrength(prop);
      if (strength.score < 100 && (!weakest || strength.score < weakest.strength.score)) {
        weakest = { prop, strength };
      }
    }
    if (weakest) {
      list.push({
        icon: "📋",
        text: `"${weakest.prop.title}" is ${weakest.strength.score}% complete — missing ${weakest.strength.missing.slice(0, 2).join(" and ").toLowerCase()}.`,
        rule: "Field-completeness check on your verified portfolio",
      });
    }
    return list;
  }, [pitches, listings, taskSummary]);

  return (
    <GlassPanel className="rounded-2xl p-6 mb-10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent opacity-5 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <h3 className="font-label-caps text-[10px] tracking-widest text-gold-accent uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse shadow-[0_0_10px_rgba(247,198,78,0.8)]"></span> Scout Insight
        </h3>
        <span className="font-label-caps text-[10px] tracking-widest text-text-muted uppercase hidden sm:block">Rule-based · computed from your live pipeline</span>
      </div>
      {insights.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-[-1px]" aria-hidden="true">{insight.icon}</span>
              <div>
                <p className="text-sm text-on-surface leading-snug">{insight.text}</p>
                <p className="text-[10px] text-text-muted mt-0.5">Rule: {insight.rule}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-text-secondary italic">Your portfolio is perfectly balanced. No new insights to surface today.</p>
        </div>
      )}
    </GlassPanel>
  );
}
