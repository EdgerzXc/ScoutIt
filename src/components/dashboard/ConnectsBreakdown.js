"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONNECT_ROLE_PURPOSES,
  getUniversalWalletOverview,
  getWallet,
  resolveWalletRoleForMode,
} from "@/lib/connectsWallet";

const BUCKETS = [
  {
    key: "granted",
    label: "Monthly Allowance",
    icon: "↻",
    description:
      "Your tier's free monthly Connects for this lens. Refreshes on the 1st of each month; spend it before it resets, since it never rolls over.",
  },
  {
    key: "purchased",
    label: "Purchased (Universal)",
    icon: "◈",
    description:
      "Connect packs you've bought. Shared across all your roles and never expire.",
  },
  {
    key: "earned",
    label: "Earned (Universal)",
    icon: "★",
    description:
      "Earned by completing QuestIT bounties and verified briefs. Shared across all your roles and never expire.",
  },
];

// Spend order note shown once, since it's the one non-obvious mechanic.
const SPEND_ORDER_NOTE =
  "When you spend a Connect, it's drawn from Monthly first, then Purchased, then Earned; so the ones that expire go before the ones that don't.";

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

  const total =
    mode === "all" && overview.roleBuckets.length > 1
      ? overview.universalTotal
      : wallet.granted + wallet.purchased + wallet.earned;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Connects wallet breakdown"
      className="absolute right-0 mt-2 w-[340px] sm:w-96 max-w-[calc(100vw-1.5rem)] bg-surface border border-gold-accent/25 rounded-xl shadow-2xl overflow-hidden z-50"
    >
      <div className="p-3.5 border-b border-surface-variant bg-surface-alt flex justify-between items-center gap-2">
        <div>
          <span className="font-label-caps text-[12px] tracking-widest uppercase text-text-secondary block">
            Your Connects Wallet
          </span>
          <span className="font-mono text-xs text-gold-accent">
            {mode === "all" && overview.roleBuckets.length > 1
              ? "Universal Balance (All Lenses)"
              : `Active Lens: ${activePurpose.roleLabel}`}
          </span>
        </div>
        <span className="flex items-center gap-1.5 font-working-title text-lg font-bold text-gold-accent shrink-0">
          <span className="text-sm">◈</span>
          {total}
        </span>
      </div>

      <div className="max-h-[420px] overflow-y-auto divide-y divide-surface-variant/50">
        {/* What Connects Are Used For in This Role */}
        <div className="p-3.5 bg-gold-accent/5 space-y-2">
          <div className="font-mono text-xs uppercase tracking-widest text-gold-accent font-semibold">
            What Connects Do ({activePurpose.shortLabel} Lens)
          </div>
          <div className="space-y-1.5 text-xs text-text-secondary leading-relaxed">
            <p>
              <strong className="text-on-surface font-semibold">Outbound:</strong>{" "}
              {activePurpose.spendRule}.
            </p>
            <p>
              <strong className="text-on-surface font-semibold">Inbound / Earn:</strong>{" "}
              {activePurpose.receiveRule}.
            </p>
          </div>
        </div>

        {/* 3 Buckets Breakdown */}
        <div className="p-4 flex flex-col gap-3">
          {BUCKETS.map(({ key, label, icon, description }) => {
            const value =
              key === "granted" && mode === "all" && overview.roleBuckets.length > 1
                ? overview.totalGranted
                : (wallet[key] ?? 0);
            return (
              <div key={key} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gold-accent/10 flex items-center justify-center text-gold-accent text-sm shrink-0 mt-0.5">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-working-title text-on-surface">{label}</span>
                    <span className="font-mono text-sm font-semibold text-gold-accent shrink-0">
                      {value}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed mt-0.5">
                    {description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Per-Lens Monthly Allowances (shown when user holds > 1 role) */}
        {overview.roleBuckets.length > 1 && (
          <div className="p-3.5 space-y-2 bg-surface-alt/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-text-secondary">
                Monthly Allowance by Lens
              </span>
              <span className="font-mono text-xs text-gold-accent">
                {overview.totalGranted} Total
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {overview.roleBuckets.map((rb) => {
                const isCurrent = rb.role === activeWalletRole && mode !== "all";
                return (
                  <div
                    key={rb.role}
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center justify-between gap-2 ${
                      isCurrent
                        ? "border-gold-accent/40 bg-gold-accent/10 text-on-surface"
                        : "border-surface-variant/60 bg-surface text-text-secondary"
                    }`}
                  >
                    <span className="font-mono text-xs truncate">{rb.shortLabel}</span>
                    <span className="font-mono text-xs font-bold text-gold-accent shrink-0">
                      ◈ {rb.granted}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-3.5">
          <p className="text-[12px] text-text-secondary leading-relaxed italic">
            {SPEND_ORDER_NOTE}
          </p>
        </div>
      </div>
    </div>
  );
}
