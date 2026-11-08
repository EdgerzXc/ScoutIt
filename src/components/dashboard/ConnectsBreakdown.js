"use client";

import { useEffect, useRef, useState } from "react";
import InfoTip from "@/components/ui/InfoTip";
import { X } from "lucide-react";
import {
  CONNECT_ROLE_PURPOSES,
  getUniversalWalletOverview,
  getWallet,
  resolveWalletRoleForMode,
} from "@/lib/connectsWallet";

export default function ConnectsBreakdown({
  open,
  onClose,
  mode,
  providerType,
  tier,
  heldRoles = [],
}) {
  const ref = useRef(null);
  const [wallet, setWallet] = useState({ granted: 0, purchased: 0, earned: 0 });
  const [overview, setOverview] = useState({
    purchased: 0,
    earned: 0,
    totalGranted: 0,
    universalTotal: 0,
    roleBuckets: [],
  });

  const activeWalletRole = resolveWalletRoleForMode(mode, providerType, heldRoles);
  const activePurpose =
    CONNECT_ROLE_PURPOSES[activeWalletRole] || CONNECT_ROLE_PURPOSES.seeker;

  useEffect(() => {
    if (!open) return;
    setWallet(getWallet(activeWalletRole, tier));
    setOverview(getUniversalWalletOverview(heldRoles, tier));
  }, [open, activeWalletRole, tier, heldRoles]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Single account connects logic:
  // An account has ONE connects wallet. In 'all' or single-role mode,
  // the balance reflects the account's single monthly allowance + purchased + earned.
  const total =
    mode === "all"
      ? overview.universalTotal
      : wallet.granted + wallet.purchased + wallet.earned;

  const monthlyVal =
    mode === "all" ? overview.totalGranted : (wallet.granted ?? 0);
  const purchasedVal =
    mode === "all" ? overview.purchased : (wallet.purchased ?? 0);
  const earnedVal =
    mode === "all" ? overview.earned : (wallet.earned ?? 0);

  return (
    <>
      {/* Mobile Backdrop Overlay for Clean Centering & Dismissal */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={ref}
        role="dialog"
        aria-label="Connects wallet breakdown"
        className="fixed inset-x-4 top-20 sm:inset-x-auto sm:top-full sm:mt-2 sm:right-0 sm:absolute w-auto sm:w-[370px] max-w-[calc(100vw-2rem)] bg-surface border border-gold-accent/35 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.7)] overflow-hidden z-50 text-left transition-all duration-200"
      >
        {/* Subtle Fading Gold Accent Line at Top */}
        <div
          className="h-[2px] w-full bg-gradient-to-r from-transparent via-gold-accent to-transparent opacity-80"
          aria-hidden="true"
        />

        {/* Dialog Header */}
        <div className="p-4 border-b border-surface-variant/80 bg-surface-alt/70 flex justify-between items-center gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[12px] font-bold uppercase tracking-widest text-text-secondary">
                Connects Wallet
              </span>
              <InfoTip tipId="connectsSingleAccountLogic" label="About single-account wallet" />
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-xs text-gold-accent truncate">
                {mode === "all"
                  ? "Unified Account Pool (All Lenses)"
                  : `${activePurpose.roleLabel} · 1 to initiate`}
              </span>
              <InfoTip tipId="connectsRoleRules" label="About spend & receive rules" />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 font-working-title text-xl font-bold text-gold-bright bg-gold-accent/15 border border-gold-accent/40 px-3 py-1 rounded-full shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)]">
              <span className="text-sm">◈</span>
              {total}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-gold-accent hover:bg-surface-variant transition"
              aria-label="Close Connects Breakdown"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="max-h-[75vh] sm:max-h-[420px] overflow-y-auto divide-y divide-surface-variant/50">
          {/* 3 Buckets Breakdown: Centered Symmetric Metric Grid */}
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2.5">
              {/* Monthly Allowance */}
              <div className="p-2.5 rounded-xl border border-surface-variant/70 bg-surface-alt/40 flex flex-col items-center text-center justify-between min-h-[92px] transition hover:border-gold-accent/40">
                <div className="flex items-center justify-center gap-1 w-full text-gold-accent">
                  <span className="text-sm">↻</span>
                  <InfoTip tipId="connectsBucketMonthly" label="Monthly allowance details" />
                </div>
                <div className="font-mono text-lg font-bold text-gold-bright my-0.5">
                  {monthlyVal}
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Monthly
                </span>
              </div>

              {/* Purchased (Universal) */}
              <div className="p-2.5 rounded-xl border border-surface-variant/70 bg-surface-alt/40 flex flex-col items-center text-center justify-between min-h-[92px] transition hover:border-gold-accent/40">
                <div className="flex items-center justify-center gap-1 w-full text-gold-accent">
                  <span className="text-sm">◈</span>
                  <InfoTip tipId="connectsBucketPurchased" label="Purchased Connects details" />
                </div>
                <div className="font-mono text-lg font-bold text-gold-bright my-0.5">
                  {purchasedVal}
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Purchased
                </span>
              </div>

              {/* Earned (Universal) */}
              <div className="p-2.5 rounded-xl border border-surface-variant/70 bg-surface-alt/40 flex flex-col items-center text-center justify-between min-h-[92px] transition hover:border-gold-accent/40">
                <div className="flex items-center justify-center gap-1 w-full text-gold-accent">
                  <span className="text-sm">★</span>
                  <InfoTip tipId="connectsBucketEarned" label="Earned Connects details" />
                </div>
                <div className="font-mono text-lg font-bold text-gold-bright my-0.5">
                  {earnedVal}
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">
                  Earned
                </span>
              </div>
            </div>
          </div>

          {/* Shared Across Active Lenses Note (One account = one connects logic) */}
          {overview.roleBuckets.length > 1 && (
            <div className="p-3.5 bg-surface-alt/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[12px] uppercase tracking-widest text-text-secondary">
                  Shared Across Active Lenses
                </span>
                <InfoTip tipId="connectsSingleAccountLogic" label="About shared wallet" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {overview.roleBuckets.map((rb) => {
                  const isCurrent = rb.role === activeWalletRole && mode !== "all";
                  return (
                    <span
                      key={rb.role}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono uppercase tracking-wider border ${
                        isCurrent
                          ? "border-gold-accent/50 bg-gold-accent/15 text-gold-bright font-semibold"
                          : "border-surface-variant bg-surface text-text-secondary"
                      }`}
                    >
                      {rb.shortLabel} {isCurrent && "●"}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Spend Priority Footer with ? Mark */}
          <div className="p-3.5 bg-surface-alt/20 flex items-center justify-between gap-3 text-xs text-text-secondary">
            <span className="font-mono text-xs uppercase tracking-wider truncate">
              Spend: Monthly 1st → Purchased → Earned
            </span>
            <InfoTip tipId="connectsSpendOrder" label="About spend priority order" />
          </div>
        </div>

        {/* Fading Gold Drag / Scroll Affordance Line at Bottom */}
        <div
          className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-gold-accent/50 to-transparent"
          aria-hidden="true"
        />
      </div>
    </>
  );
}
