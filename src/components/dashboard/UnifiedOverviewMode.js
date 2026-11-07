"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Briefcase,
  Search,
  ArrowUpRight,
  ArrowRight,
  Coins,
} from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { getUniversalWalletOverview } from "../../lib/connectsWallet";
import { loadDeals } from "../../lib/deals/dealsClient";
import { bucketOfDeal, isDeletedDeal } from "../../lib/deals/dealStatus";

function resolveDealLensBadge(myRole) {
  const r = String(myRole || "owner").trim().toLowerCase();
  if (r === "photographer") return { label: "FOR YOUR PHOTOGRAPHER LENS", filterKey: "provider" };
  if (r === "designer") return { label: "FOR YOUR DESIGNER LENS", filterKey: "provider" };
  if (r === "researcher") return { label: "FOR YOUR RESEARCHER LENS", filterKey: "provider" };
  if (r === "provider") return { label: "FOR YOUR CREATOR LENS", filterKey: "provider" };
  if (r === "broker" || r === "salesperson") return { label: "FOR YOUR BROKER LENS", filterKey: "broker" };
  if (r === "buyer" || r === "seeker") return { label: "YOUR SEEKER INQUIRY", filterKey: "buyer" };
  return { label: "FOR YOUR OWNER LENS", filterKey: "owner" };
}

export default function UnifiedOverviewMode({ onSelectLens, heldRoles = [] }) {
  const { listings = [], pitches = [], savedIds = [], catalogue = [], currentUser } = useDashboard();
  const [deals, setDeals] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealLensFilter, setDealLensFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await loadDeals({ mockUserId: currentUser?.id || null });
        if (!cancelled && Array.isArray(rows)) {
          setDeals(rows.filter((d) => !isDeletedDeal(d?.status)));
        }
      } catch {
        // Non-blocking: pipeline summary falls back cleanly if deals fail to load
      } finally {
        if (!cancelled) setDealsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const safeListings = Array.isArray(listings) ? listings : [];
  const safePitches = Array.isArray(pitches) ? pitches : [];
  const safeSavedIds = Array.isArray(savedIds) ? savedIds : [];
  const safeCatalogue = Array.isArray(catalogue) ? catalogue : [];
  const safeDeals = Array.isArray(deals) ? deals : [];

  const publishedListings = safeListings.filter(
    (item) => item?.pipelineStatus === "published" || item?.lifecycleState === "published"
  );
  const draftListings = safeListings.filter(
    (item) => item?.pipelineStatus !== "published" && item?.lifecycleState !== "published"
  );
  const activePitches = safePitches.filter((p) => p?.status !== "closed" && p?.status !== "declined");
  const savedSpaces = safeCatalogue.filter((item) => safeSavedIds.includes(item?.id));
  const tier = String(currentUser?.subscription_tier || currentUser?.tier || "starry").toLowerCase();
  const walletOverview = getUniversalWalletOverview(heldRoles, tier) || {
    purchased: 0,
    earned: 0,
    totalGranted: 0,
    universalTotal: 0,
    roleBuckets: [],
  };

  const filteredDeals = safeDeals.filter((deal) => {
    if (dealLensFilter === "all") return true;
    const meta = resolveDealLensBadge(deal?.myRole);
    return meta.filterKey === dealLensFilter;
  });

  const waitingCount = safeDeals.filter((d) => bucketOfDeal(d) === "waiting").length;
  const activeDealCount = safeDeals.filter((d) => bucketOfDeal(d) === "active").length;

  return (
    <section aria-label="Unified workspace overview" className="space-y-6">
      {/* Header banner: explains why Unified View focuses on Master CRM & Cross-Lens Pulse */}
      <div className="rounded-2xl border border-surface-variant bg-surface/90 p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-gold-accent block mb-1">
                UNIFIED COMMAND · CRM &amp; CROSS-ROLE PIPELINE
              </span>
              <h1 className="font-headline-editorial text-2xl md:text-3xl text-on-surface">
                All Lenses Connected in One Pipeline
              </h1>
              <p className="text-sm text-text-secondary mt-1 max-w-2xl">
                Review every incoming inquiry, pitch, viewing, and Connect balance across all your roles in one unified pipeline. Use the Workspace switcher in the header when you want a specific role&apos;s tools.
              </p>
            </div>
          </div>
        </div>

        {/* 4-Tile Executive KPI & Universal Connects Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-5 border-t border-surface-variant/60">
          <button
            type="button"
            onClick={() => onSelectLens?.("owner")}
            className="text-left rounded-xl border border-surface-variant bg-surface-alt/60 hover:border-gold-accent/40 p-3.5 transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Owner Inventory</span>
              <Building2 size={15} className="text-gold-accent" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface tabular-nums mt-1">
              {safeListings.length}
            </div>
            <div className="font-mono text-xs text-gold-accent mt-1 group-hover:underline">
              {publishedListings.length} live · {draftListings.length} draft →
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectLens?.("broker")}
            className="text-left rounded-xl border border-surface-variant bg-surface-alt/60 hover:border-gold-accent/40 p-3.5 transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Broker Pipeline</span>
              <Briefcase size={15} className="text-gold-accent" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface tabular-nums mt-1">
              {activePitches.length}
            </div>
            <div className="font-mono text-xs text-gold-accent mt-1 group-hover:underline">
              {safePitches.length} total mandates →
            </div>
          </button>

          <button
            type="button"
            onClick={() => onSelectLens?.("buyer")}
            className="text-left rounded-xl border border-surface-variant bg-surface-alt/60 hover:border-gold-accent/40 p-3.5 transition group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-text-secondary">Seeker Board</span>
              <Search size={15} className="text-gold-accent" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold text-on-surface tabular-nums mt-1">
              {safeSavedIds.length}
            </div>
            <div className="font-mono text-xs text-gold-accent mt-1 group-hover:underline">
              {savedSpaces.length} matched in catalogue →
            </div>
          </button>

          <div className="rounded-xl border border-gold-accent/30 bg-gold-accent/10 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-gold-accent">Universal Wallet</span>
              <Coins size={15} className="text-gold-accent" aria-hidden="true" />
            </div>
            <div className="font-mono text-2xl font-bold text-gold-bright tabular-nums mt-1">
              ◈ {walletOverview.universalTotal ?? 0}
            </div>
            <div className="font-mono text-xs text-text-secondary mt-1">
              {(walletOverview.purchased || 0) + (walletOverview.earned || 0)} universal · {walletOverview.totalGranted || 0} monthly
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Master CRM & Cross-Lens Deal Feed */}
      <div className="rounded-2xl border border-surface-variant bg-surface/90 p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-surface-variant">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-gold-accent">
                MASTER CRM · UNIFIED DEAL FEED
              </span>
              {waitingCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-gold-accent/20 border border-gold-accent/40 font-mono text-xs font-bold text-gold-bright">
                  {waitingCount} WAITING
                </span>
              )}
            </div>
            <h2 className="font-working-title text-lg md:text-xl font-semibold text-on-surface mt-0.5">
              Active Inquiries, Pitches &amp; Bookings ({activeDealCount + waitingCount})
            </h2>
          </div>

          {/* 1-Tap Lens Filter Pills for the Master CRM Feed */}
          <div
            role="group"
            aria-label="Filter unified deals by lens"
            className="flex items-center gap-1 overflow-x-auto no-scrollbar"
          >
            {[
              { id: "all", label: "All Lenses" },
              { id: "owner", label: "Owner" },
              { id: "broker", label: "Broker" },
              { id: "provider", label: "Creator" },
              { id: "buyer", label: "Seeker" },
            ].map((pill) => {
              const active = dealLensFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setDealLensFilter(pill.id)}
                  aria-pressed={active}
                  className={`min-h-11 px-3 py-1.5 rounded-lg font-mono text-xs uppercase tracking-wider shrink-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent ${
                    active
                      ? "bg-gold-accent text-background font-bold"
                      : "bg-surface-alt text-text-secondary hover:text-on-surface border border-surface-variant"
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          {dealsLoading ? (
            <div className="space-y-2.5" aria-busy="true">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-16 rounded-xl bg-surface-alt/60 border border-surface-variant animate-pulse" />
              ))}
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-surface-variant bg-surface-alt/30 p-6 text-center">
              <p className="font-working-title text-sm text-on-surface font-semibold">
                No deals in this lens filter yet
              </p>
              <p className="text-xs text-text-secondary mt-1 max-w-md mx-auto">
                Incoming property inquiries (Owner), representation pitches (Broker), creative bookings (Creator), and space inquiries (Seeker) appear here automatically with their role badge.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/dashboard/crm"
                  className="min-h-11 px-4 py-2 rounded-xl border border-gold-accent/40 bg-gold-accent/15 hover:bg-gold-accent/25 text-gold-bright font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition"
                >
                  <span>Open CRM Pipeline</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
                <Link
                  href="/settings#open-gate"
                  className="min-h-11 px-4 py-2 rounded-xl border border-surface-variant bg-surface-alt hover:border-gold-accent/40 text-on-surface font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition"
                >
                  <span>Open Gate in Settings</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-surface-variant/60">
              {filteredDeals.slice(0, 6).map((deal) => {
                const lensMeta = resolveDealLensBadge(deal.myRole);
                const bucket = bucketOfDeal(deal);
                const statusLabel =
                  bucket === "waiting"
                    ? "WAITING GATE"
                    : bucket === "active"
                      ? "ACTIVE DEAL ROOM"
                      : "CLOSED";
                return (
                  <div
                    key={deal.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-gold-accent/15 border border-gold-accent/35 font-mono text-xs font-semibold uppercase tracking-wider text-gold-accent">
                          {deal.intentBadge || lensMeta.label}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-alt border border-surface-variant font-mono text-xs uppercase tracking-wider text-text-secondary">
                          {statusLabel}
                        </span>
                        {deal.open_gate_inbound && (
                          <span className="px-2 py-0.5 rounded bg-gold-accent/10 border border-gold-accent/30 font-mono text-xs uppercase tracking-wider text-gold-bright">
                            OPEN GATE
                          </span>
                        )}
                      </div>
                      <div className="font-working-title text-base font-semibold text-on-surface truncate">
                        {deal.propertyTitle || "Untitled Space Inquiry"}
                      </div>
                      {deal.intentSummary && (
                        <div className="text-xs font-semibold text-gold-accent/90 truncate">
                          {deal.intentSummary}
                        </div>
                      )}
                      <div className="text-xs text-text-secondary truncate">
                        Counterparty: <span className="text-on-surface">{deal.otherParty || deal.otherPartyRole || "Verified Party"}</span>
                        {deal.lastMessage ? ` · "${deal.lastMessage}"` : ""}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/dashboard/inbox?dealId=${encodeURIComponent(deal.id)}`}
                        className="min-h-11 px-3.5 py-2 rounded-xl bg-surface-alt hover:bg-gold-accent hover:text-background border border-surface-variant hover:border-gold-accent font-mono text-xs font-semibold uppercase tracking-wider text-on-surface inline-flex items-center gap-1.5 transition"
                      >
                        <span>Open Thread</span>
                        <ArrowRight size={13} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
