"use client";

import Link from "next/link";
import {
  Building2,
  Briefcase,
  Search,
  Cog,
  Camera,
  Kanban,
  MessageSquare,
  Calendar,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import { useDashboard } from "../../context/DashboardContext";
import { canAccessDashboardWorkspace } from "../../lib/dashboardModes";

export default function UnifiedOverviewMode({ onSelectLens, heldRoles = [] }) {
  const { listings = [], pitches = [], savedIds = [], catalogue = [] } = useDashboard();

  const publishedListings = listings.filter(
    (item) => item.pipelineStatus === "published" || item.lifecycleState === "published"
  );
  const draftListings = listings.filter(
    (item) => item.pipelineStatus !== "published" && item.lifecycleState !== "published"
  );
  const activePitches = pitches.filter((p) => p.status !== "closed" && p.status !== "declined");
  const savedSpaces = catalogue.filter((item) => savedIds.includes(item.id));

  const lensCards = [
    {
      id: "owner",
      badge: "OWNER LENS",
      title: "Property Inventory & Assets",
      metricValue: listings.length,
      metricLabel: `${publishedListings.length} live · ${draftListings.length} in draft`,
      summary:
        listings.length > 0
          ? `Latest space: ${listings[0]?.title || "Untitled property"} (${listings[0]?.location || "Metro Manila"})`
          : "No properties submitted yet. Open the Owner lens to list a space or share your Open Gate link.",
      icon: Building2,
      actionLabel: "Focus Owner Lens",
      secondaryHref: "/dashboard/open-gate",
      secondaryLabel: "Open Gate ↗",
    },
    {
      id: "broker",
      badge: "BROKER LENS",
      title: "Deal Representation & Pitches",
      metricValue: activePitches.length,
      metricLabel: `${pitches.length} total pitches tracked`,
      summary:
        activePitches.length > 0
          ? `Active pitch on ${activePitches[0]?.propertyTitle || "listed asset"}`
          : "Filter to the Broker lens to represent inventory, send pitches, and track mandates.",
      icon: Briefcase,
      actionLabel: "Focus Broker Lens",
      secondaryHref: "/dashboard/crm",
      secondaryLabel: "Open Pipeline ↗",
    },
    {
      id: "buyer",
      badge: "SEEKER LENS",
      title: "Saved Board & Space Radar",
      metricValue: savedIds.length,
      metricLabel: `${savedSpaces.length} matched in active catalogue`,
      summary:
        savedSpaces.length > 0
          ? `Tracking ${savedSpaces[0]?.title || "saved space"} and ${Math.max(0, savedSpaces.length - 1)} more on your board.`
          : "Filter to the Seeker lens to search commercial and residential spaces across Metro Manila.",
      icon: Search,
      actionLabel: "Focus Seeker Lens",
      secondaryHref: "/property",
      secondaryLabel: "Directory ↗",
    },
    {
      id: "operator",
      badge: "OPERATOR LENS",
      title: "Co-Operator & Facilities",
      metricValue: publishedListings.length,
      metricLabel: "Active spaces ready for operations",
      summary:
        "Manage unit readiness, tenant turnover logs, and on-site facility schedules from one workspace.",
      icon: Cog,
      actionLabel: "Focus Operator Lens",
    },
    {
      id: "photographer",
      badge: "CREATOR LENS",
      title: "Spatial Photography, Design & Audits",
      metricValue: 3,
      metricLabel: "Photo · Concept Design · Land Research",
      summary:
        "Switch into your Creator lens to manage QuestIT bounties, staging portfolios, and zoning verification.",
      icon: Camera,
      actionLabel: "Focus Creator Lens",
    },
  ].filter((card) => canAccessDashboardWorkspace(card.id, heldRoles));

  return (
    <section aria-label="Unified workspace overview" className="space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl border border-surface-variant bg-surface/90 p-5 md:p-6 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-gold-accent block mb-1">
              UNIFIED COMMAND · ALL LENSES COMBINED
            </span>
            <h1 className="font-headline-editorial text-2xl md:text-3xl text-on-surface">
              All Workspaces in One View
            </h1>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl">
              Your account holds multiple roles. Use the lens bar above as a filter at any time, or jump straight into your unified pipeline, deal rooms, and schedule below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href="/dashboard/crm"
              className="min-h-11 px-3.5 py-2 rounded-xl border border-gold-accent/40 bg-gold-accent/15 hover:bg-gold-accent/25 text-gold-bright font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
            >
              <Kanban size={14} aria-hidden="true" />
              <span>Unified CRM</span>
            </Link>
            <Link
              href="/dashboard/inbox"
              className="min-h-11 px-3.5 py-2 rounded-xl border border-surface-variant bg-surface-alt hover:border-gold-accent/40 text-on-surface font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
            >
              <MessageSquare size={14} aria-hidden="true" />
              <span>Deal Inbox</span>
            </Link>
            <Link
              href="/dashboard/calendar"
              className="min-h-11 px-3.5 py-2 rounded-xl border border-surface-variant bg-surface-alt hover:border-gold-accent/40 text-on-surface font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
            >
              <Calendar size={14} aria-hidden="true" />
              <span>Viewings</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Domain Lens Filter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lensCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.id}
              className="rounded-2xl border border-surface-variant bg-surface/85 p-5 flex flex-col justify-between gap-4 hover:border-gold-accent/40 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs uppercase tracking-widest text-gold-accent px-2.5 py-1 rounded-md bg-gold-accent/10 border border-gold-accent/25">
                    {card.badge}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-surface-alt border border-surface-variant flex items-center justify-center text-gold-accent">
                    <Icon size={18} aria-hidden="true" />
                  </div>
                </div>

                <div>
                  <h2 className="font-working-title text-lg font-semibold text-on-surface">
                    {card.title}
                  </h2>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-on-surface tabular-nums">
                      {card.metricValue}
                    </span>
                    <span className="font-mono text-xs text-text-secondary">
                      {card.metricLabel}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-text-secondary leading-relaxed">
                  {card.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-surface-variant/60 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectLens?.(card.id)}
                  className="min-h-11 px-3.5 py-2 rounded-xl bg-gold-accent text-background font-mono text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:opacity-95 transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
                >
                  <span>{card.actionLabel}</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>

                {card.secondaryHref && (
                  <Link
                    href={card.secondaryHref}
                    className="min-h-11 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-wider text-text-secondary hover:text-gold-accent inline-flex items-center gap-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
                  >
                    <span>{card.secondaryLabel}</span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
