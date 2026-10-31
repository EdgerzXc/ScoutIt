"use client";

import { useId } from "react";
import {
  MONETIZATION_PHASES,
  PIONEER_ACCESS_BADGE_TEXT,
  resolveMonetizationPhase,
  logPaywallConversionIntent,
} from "@/lib/monetizationGate";

export function PilotPaymentNotice() {
  const phase = resolveMonetizationPhase();
  const isPilotZeroPaywall = phase === MONETIZATION_PHASES.PILOT_ZERO_PAYWALL;

  return (
    <aside className="mx-auto mb-8 max-w-3xl rounded-xl border border-gold-accent/30 bg-gold-accent/5 px-5 py-4 text-center shadow-[var(--shadow-glow-soft)]" aria-label="Human-testing payment status">
      {isPilotZeroPaywall && (
        <div
          data-testid="pioneer-access-badge"
          className="mb-2 inline-flex items-center gap-2 rounded-full border border-gold-accent/40 bg-gold-accent/10 px-3 py-1 font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-gold-accent"
        >
          <span>◈</span>
          <span>{PIONEER_ACCESS_BADGE_TEXT}</span>
        </div>
      )}
      <p className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-gold-accent">Invited human-testing pilot</p>
      <p className="mt-2 text-sm leading-6 text-text-secondary">
        Plan concepts and prices are visible for evaluation. Payments, upgrades,
        subscriptions, and Connect purchases are not active during human testing.
      </p>
    </aside>
  );
}

export default function PilotPaymentControls({ role = null, tier, source }) {
  const statusId = useId();
  const openWaitlist = () => {
    logPaywallConversionIntent({
      role: role || "seeker",
      tier: tier || "universe",
      feature: "plan_upgrade",
      source: source || "/pricing",
    });
    window.dispatchEvent(new CustomEvent("scoutit:open-waitlist", {
      detail: { role, tier, source },
    }));
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled
        aria-describedby={statusId}
        className="min-h-11 w-full cursor-not-allowed rounded border border-surface-variant bg-surface/70 px-3 py-3 text-center font-mono text-[12px] font-bold uppercase tracking-widest text-text-muted opacity-75"
      >
        Payments unavailable during pilot
      </button>
      <span id={statusId} className="sr-only">
        This control cannot charge, subscribe, upgrade, or purchase Connects.
      </span>
      <button
        type="button"
        onClick={openWaitlist}
        className="min-h-11 w-full rounded border border-gold-accent/40 bg-transparent px-3 py-3 text-center font-working-title text-xs font-bold uppercase tracking-widest text-gold-accent transition-all hover:bg-gold-accent/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-accent"
      >
        Join the waitlist
      </button>
    </div>
  );
}
