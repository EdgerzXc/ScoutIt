"use client";

import { useEffect, useRef, useState } from "react";
import { getWallet } from "@/lib/connectsWallet";

// The dashboard's active "mode" (buyer/owner/broker/provider) and the wallet's
// role key (seeker/owner/broker/photographer/researcher) use different
// vocabularies for the same concept — map one to the other here, in one place.
function walletRoleForMode(mode, providerType) {
  if (mode === "buyer" || mode === "exploring") return "seeker";
  if (mode === "provider") return (providerType || "photographer").toLowerCase();
  return mode || "seeker";
}

const BUCKETS = [
  {
    key: "granted",
    label: "Monthly Allowance",
    icon: "↻",
    description:
      "Your tier's free monthly Connects. Refreshes on the 1st of each month — spend it before it resets, since it never rolls over.",
  },
  {
    key: "purchased",
    label: "Purchased",
    icon: "◈",
    description:
      "Connect packs you've bought. Never expire — they stay in your wallet until you spend them.",
  },
  {
    key: "earned",
    label: "Earned",
    icon: "★",
    description:
      "Earned by completing bounties. Never expire — yours to keep and spend whenever you like.",
  },
];

// Spend order note shown once, since it's the one non-obvious mechanic.
const SPEND_ORDER_NOTE =
  "When you spend a Connect, it's drawn from Monthly first, then Purchased, then Earned — so the ones that expire go before the ones that don't.";

export default function ConnectsBreakdown({ open, onClose, mode, providerType, tier }) {
  const ref = useRef(null);
  const [wallet, setWallet] = useState({ granted: 0, purchased: 0, earned: 0 });

  useEffect(() => {
    if (!open) return;
    const role = walletRoleForMode(mode, providerType);
    setWallet(getWallet(role, tier));
  }, [open, mode, providerType, tier]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) onClose();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  const total = wallet.granted + wallet.purchased + wallet.earned;

  return (
    <div
      ref={ref}
      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-gold-accent/20 rounded-lg shadow-2xl overflow-hidden z-50"
    >
      <div className="p-3 border-b border-surface-variant bg-surface-alt flex justify-between items-center">
        <span className="font-label-caps text-[10px] tracking-widest uppercase text-text-secondary">
          Your Connects
        </span>
        <span className="flex items-center gap-1.5 font-working-title text-base text-gold-accent">
          <span className="text-sm">◈</span>{total}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {BUCKETS.map(({ key, label, icon, description }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-gold-accent/10 flex items-center justify-center text-gold-accent text-sm shrink-0 mt-0.5">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-working-title text-on-surface">{label}</span>
                <span className="font-mono text-sm text-gold-accent shrink-0">{wallet[key] ?? 0}</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4">
        <p className="text-[11px] text-text-secondary leading-relaxed italic border-t border-surface-variant/60 pt-3">
          {SPEND_ORDER_NOTE}
        </p>
      </div>
    </div>
  );
}
