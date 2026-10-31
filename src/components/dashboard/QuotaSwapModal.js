"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeftRight, Sparkles, X, ShieldAlert } from "lucide-react";
import { useModalDialog } from "@/components/ui/useModalDialog";

const UPGRADE_TARGETS = {
  starry: { name: "Solar", price: "₱149/mo", limit: "5 Live Listings" },
  solar: { name: "Cluster", price: "₱499/mo", limit: "20 Live Listings" },
  cluster: { name: "Universe", price: "₱2,499/mo", limit: "Unlimited Live Listings" },
};

export default function QuotaSwapModal({
  open,
  tier = "starry",
  limit = 1,
  currentActiveCount = 1,
  liveProperties = [],
  listingTitle = null,
  busy = false,
  error = null,
  onSwap,
  onCancel,
}) {
  const [selectedSwapId, setSelectedSwapId] = useState(liveProperties[0]?.id || "");
  const cardRef = useRef(null);

  useEffect(() => {
    if (open && liveProperties.length > 0) {
      setSelectedSwapId(liveProperties[0]?.id || "");
    }
  }, [open, liveProperties]);

  useModalDialog(cardRef, { active: open, onClose: busy ? undefined : onCancel });

  if (!open) return null;

  const normalizedTier = String(tier || "starry").toLowerCase();
  const upgrade = UPGRADE_TARGETS[normalizedTier] || UPGRADE_TARGETS.starry;

  const handleConfirmSwap = () => {
    if (!selectedSwapId || busy) return;
    onSwap?.(selectedSwapId);
  };

  return (
    <div className="fixed inset-0 z-[950] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quota-swap-title"
        className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[rgba(232,174,60,0.35)] bg-gradient-to-b from-[#161616] to-[#0d0d0d] p-6 sm:p-7 shadow-[0_24px_70px_rgba(0,0,0,0.9)] max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-bright)] text-xs font-mono uppercase tracking-widest mb-2">
              <ShieldAlert size={13} aria-hidden="true" />
              <span>Active Listing Limit ({currentActiveCount}/{limit})</span>
            </div>
            <h2 id="quota-swap-title" className="text-xl sm:text-2xl font-display text-white tracking-wide">
              Listing Cap Reached
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label="Close dialog"
            className="p-2 -mr-1 -mt-1 text-white/60 hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-5">
          Your <strong className="text-white uppercase font-mono">{tier}</strong> plan includes{" "}
          <strong className="text-[var(--accent-bright)]">{limit} active live {limit === 1 ? "listing" : "listings"}</strong>. To publish{" "}
          <strong className="text-white">&ldquo;{listingTitle || "this property"}&rdquo;</strong>, choose an existing live property to move into your private Off-Market cloud, or upgrade your plan.
        </p>

        {error && (
          <div className="p-3 mb-4 rounded-xl border border-red-500/30 bg-red-950/20 text-red-200 text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Option 1: Swap with live property */}
        <div className="p-4 rounded-xl border border-[var(--accent-muted)]/50 bg-white/[0.02] mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight size={15} className="text-[var(--accent-bright)]" aria-hidden="true" />
            <h3 className="text-xs font-mono uppercase tracking-wider text-white">
              Option 1: Move an asset Off-Market (Free)
            </h3>
          </div>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            The selected property will be moved into your private Off-Market cloud at zero cost. It remains safe, accessible only to you, and frees up your live slot immediately.
          </p>

          <div className="space-y-2 mb-4">
            {liveProperties.map((prop) => (
              <label
                key={prop.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-xs ${
                  selectedSwapId === prop.id
                    ? "border-[var(--accent)] bg-[rgba(232,174,60,0.08)] text-white"
                    : "border-white/10 bg-white/[0.01] text-text-secondary hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="swapProperty"
                  value={prop.id}
                  checked={selectedSwapId === prop.id}
                  onChange={() => setSelectedSwapId(prop.id)}
                  className="accent-[var(--accent-bright)] w-4 h-4"
                />
                <span className="flex-1 font-medium truncate">{prop.title}</span>
                <span className="text-[var(--accent-bright)] font-mono text-xs uppercase">Live</span>
              </label>
            ))}
          </div>

          <button
            type="button"
            onClick={handleConfirmSwap}
            disabled={!selectedSwapId || busy}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[var(--accent-bright)] text-black font-semibold text-xs tracking-wider uppercase transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(247,198,78,0.25)] flex items-center justify-center gap-2"
          >
            {busy ? (
              <span>Swapping & Publishing...</span>
            ) : (
              <>
                <span>Swap to Off-Market & Publish</span>
                <ArrowRight size={14} aria-hidden="true" />
              </>
            )}
          </button>
        </div>

        {/* Option 2: Upgrade Tier */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.01] mb-5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--accent-bright)]" aria-hidden="true" />
              <h3 className="text-xs font-mono uppercase tracking-wider text-white">
                Option 2: Upgrade to {upgrade.name}
              </h3>
            </div>
            <span className="text-xs font-mono text-[var(--accent-bright)]">{upgrade.price}</span>
          </div>
          <p className="text-xs text-text-secondary mb-3 leading-relaxed">
            Expand your active portfolio to {upgrade.limit} without taking any property off-market.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-bright)] font-mono tracking-wider uppercase hover:underline min-h-[44px]"
          >
            <span>View {upgrade.name} Plans</span>
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {/* Cancel Action */}
        <div className="text-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-white min-h-[44px] px-4"
          >
            Cancel and Keep as Draft
          </button>
        </div>
      </div>
    </div>
  );
}
