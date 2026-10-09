"use client";

import Link from "next/link";
import { VIA_STATUS } from "@/lib/viaRouting";

/**
 * Position Zero Contact Card (A-186)
 *
 * Renders the originating promoter's bespoke concierge card when entering
 * via an authorized VIA share link. Adheres strictly to ScoutIt Design DNA:
 * 95% deep black, 5% glowing gold accents (--accent), monospace uppercase labels,
 * glassmorphism, and zero ranking score pollution.
 *
 * If the representative's authorization was revoked, gracefully renders an
 * informative status notice rather than a 404 or broken state.
 */
export default function PositionZeroContactCard({
  propertySlug,
  promoter,
  viaStatus = VIA_STATUS.VALID,
  onOpenConnect = null,
}) {
  if (!promoter && viaStatus !== VIA_STATUS.INVALID) return null;

  const isInvalid = viaStatus === VIA_STATUS.INVALID;
  const promoterName = promoter?.display_name || promoter?.name || "Authorized Representative";
  const promoterTitle = promoter?.headline || promoter?.firm || "Verified Property Representative";
  const avatarUrl = promoter?.avatar_url || promoter?.image;

  if (isInvalid) {
    return (
      <aside
        className="w-full max-w-4xl mx-auto my-4 p-4 rounded-xl border border-white/10 bg-[var(--bg)]/80 backdrop-blur-md text-left"
        aria-label="Representative status notification"
      >
        <div className="flex items-center gap-3">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500/80 animate-pulse" />
          <p className="font-mono text-xs tracking-widest uppercase text-[var(--accent)] font-semibold">
            Representative Notice
          </p>
        </div>
        <p className="text-sm text-neutral-300 mt-1.5 leading-relaxed">
          The representative originally associated with this link is no longer actively representing this listing.
          ScoutIt has routed you to the currently authorized property contacts below.
        </p>
        <div className="mt-3">
          <Link
            href={`/property/${encodeURIComponent(propertySlug)}/brokers`}
            className="font-mono text-xs uppercase tracking-wider text-[var(--accent-bright)] hover:underline inline-flex items-center gap-1.5"
          >
            View Verified Property Representatives →
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-full max-w-4xl mx-auto my-6 p-5 sm:p-6 rounded-2xl border border-[var(--accent-muted)]/40 bg-[var(--bg)]/90 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 hover:border-[var(--accent)]/60"
      aria-label="Presented via authorized representative"
    >
      {/* Background luxury amber glow */}
      <div
        className="absolute -right-20 -top-20 w-56 h-56 rounded-full pointer-events-none opacity-15 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Promoter info */}
        <div className="flex items-start sm:items-center gap-4">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-[var(--accent-muted)] bg-neutral-900/90 flex-shrink-0 bg-cover bg-center overflow-hidden flex items-center justify-center"
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            aria-hidden="true"
          >
            {!avatarUrl && (
              <span className="font-mono text-base font-bold text-[var(--accent)]">
                {promoterName.charAt(0)}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="inline-block w-2 h-2 rounded-full bg-[var(--accent-bright)] animate-pulse" />
              <span className="font-mono text-xs tracking-widest uppercase text-[var(--accent)] font-semibold">
                Presented via Authorized Partner
              </span>
              <span className="font-mono text-xs uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
                Position Zero
              </span>
            </div>

            <h3 className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
              {promoterName}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              {promoterTitle}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
          {onOpenConnect ? (
            <button
              type="button"
              onClick={onOpenConnect}
              className="px-5 py-2.5 rounded-full bg-[var(--accent-bright)] hover:bg-[var(--accent)] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 shadow-lg text-center"
            >
              Connect with {promoterName.split(" ")[0]}
            </button>
          ) : (
            <Link
              href={`/property/${encodeURIComponent(propertySlug)}/brokers`}
              className="px-5 py-2.5 rounded-full bg-[var(--accent-bright)] hover:bg-[var(--accent)] text-black font-mono text-xs uppercase tracking-wider font-bold transition-all duration-200 shadow-lg text-center"
            >
              Connect with {promoterName.split(" ")[0]}
            </Link>
          )}

          <Link
            href={`/property/${encodeURIComponent(propertySlug)}/brokers`}
            className="px-4 py-2.5 rounded-full border border-white/15 hover:border-[var(--accent-muted)] text-neutral-300 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors duration-200 text-center"
          >
            All Contacts
          </Link>
        </div>
      </div>
    </aside>
  );
}
