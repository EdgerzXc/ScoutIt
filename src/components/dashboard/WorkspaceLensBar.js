"use client";

import Link from "next/link";
import {
  LayoutGrid,
  Search,
  Building2,
  Briefcase,
  Cog,
  Camera,
  Palette,
  FileCheck,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { canAccessDashboardWorkspace } from "../../lib/dashboardModes";
import { isPipelineRole } from "../../lib/workspaceDeck";

const DOMAIN_LENSES = [
  {
    id: "all",
    mode: "all",
    shortLabel: "All",
    fullLabel: "All Lenses",
    icon: LayoutGrid,
    roles: ["all"],
  },
  {
    id: "buyer",
    mode: "buyer",
    shortLabel: "Seeker",
    fullLabel: "Buyer & Seeker",
    icon: Search,
    roles: ["buyer", "seeker", "exploring"],
  },
  {
    id: "owner",
    mode: "owner",
    shortLabel: "Owner",
    fullLabel: "Owner & Developer",
    icon: Building2,
    roles: ["owner"],
  },
  {
    id: "broker",
    mode: "broker",
    shortLabel: "Broker",
    fullLabel: "Broker & Sales",
    icon: Briefcase,
    roles: ["broker", "salesperson"],
  },
  {
    id: "operator",
    mode: "operator",
    shortLabel: "Operator",
    fullLabel: "Co-Operator",
    icon: Cog,
    roles: ["operator"],
  },
  {
    id: "photographer",
    mode: "provider",
    shortLabel: "Creator",
    fullLabel: "Creator Studio",
    icon: Camera,
    roles: ["photographer", "designer", "researcher", "provider"],
  },
];

const CREATOR_SUB_LENSES = [
  { id: "photographer", label: "Photo", icon: Camera },
  { id: "designer", label: "Design", icon: Palette },
  { id: "researcher", label: "Research", icon: FileCheck },
];

const BROKER_SUB_LENSES = [
  { id: "broker", label: "Broker (PRC)", icon: Briefcase },
  { id: "salesperson", label: "Salesperson", icon: ShieldCheck },
];

export default function WorkspaceLensBar({
  mode,
  activeRoleKey,
  providerType,
  heldRoles = [],
  onSelectLens,
  showOpenGate = true,
  className = "",
}) {
  const unlockedDomains = DOMAIN_LENSES.filter((domain) => {
    if (domain.id === "all") return true;
    return domain.roles.some((r) => canAccessDashboardWorkspace(r, heldRoles));
  });

  // Single-role accounts do not need a multi-lens filter bar
  const nonAllDomains = unlockedDomains.filter((d) => d.id !== "all");
  if (nonAllDomains.length <= 1) {
    return null;
  }

  const unlockedCreatorSubLenses = CREATOR_SUB_LENSES.filter((sub) =>
    canAccessDashboardWorkspace(sub.id, heldRoles)
  );
  const unlockedBrokerSubLenses = BROKER_SUB_LENSES.filter((sub) =>
    canAccessDashboardWorkspace(sub.id, heldRoles)
  );

  const isDomainActive = (domain) => {
    if (domain.id === "all") return mode === "all";
    if (domain.mode === "buyer") return mode === "buyer" || mode === "exploring";
    return mode === domain.mode;
  };

  const resolveDomainTargetRole = (domain) => {
    if (domain.id === "all") return "all";
    if (domain.mode === "provider") {
      if (providerType && canAccessDashboardWorkspace(providerType, heldRoles)) {
        return providerType;
      }
      return unlockedCreatorSubLenses[0]?.id || "photographer";
    }
    if (domain.mode === "broker") {
      if (activeRoleKey === "salesperson" && canAccessDashboardWorkspace("salesperson", heldRoles)) {
        return "salesperson";
      }
      return unlockedBrokerSubLenses[0]?.id || "broker";
    }
    return domain.id;
  };

  const showCreatorSubBar = mode === "provider" && unlockedCreatorSubLenses.length > 1;
  const showBrokerSubBar = mode === "broker" && unlockedBrokerSubLenses.length > 1;
  const canUseOpenGate = showOpenGate && isPipelineRole(heldRoles);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div
        role="toolbar"
        aria-label="Workspace lens filter"
        className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-0.5"
      >
        <div className="inline-flex items-center gap-1 rounded-xl border border-surface-variant bg-surface/90 backdrop-blur-md p-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)] shrink-0">
          <span className="hidden xl:inline-flex items-center px-2.5 font-mono text-xs uppercase tracking-widest text-text-muted select-none">
            Lens
          </span>
          {unlockedDomains.map((domain) => {
            const active = isDomainActive(domain);
            const Icon = domain.icon;
            const targetRole = resolveDomainTargetRole(domain);
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => onSelectLens?.(targetRole)}
                aria-pressed={active}
                title={domain.fullLabel}
                className={`min-h-11 px-3 py-2 rounded-lg font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent ${
                  active
                    ? "bg-gold-accent text-background font-bold shadow-[0_2px_10px_rgba(var(--accent-rgb),0.3)]"
                    : "text-text-secondary hover:text-on-surface hover:bg-surface-alt/70"
                }`}
              >
                <Icon
                  size={14}
                  className={active ? "text-background shrink-0" : "text-gold-accent/80 shrink-0"}
                  aria-hidden="true"
                />
                <span>{domain.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {canUseOpenGate && (
          <Link
            href="/dashboard/open-gate"
            className="min-h-11 px-3 py-2 rounded-xl border border-gold-accent/30 bg-gold-accent/10 hover:bg-gold-accent/20 text-gold-accent font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
            title="Shareable external property intake link"
          >
            <span>Open Gate</span>
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        )}
      </div>

      {showCreatorSubBar && (
        <div
          role="group"
          aria-label="Creator specialty lens"
          className="inline-flex items-center gap-1 self-start rounded-lg border border-surface-variant/80 bg-surface-alt/70 p-1 overflow-x-auto no-scrollbar max-w-full"
        >
          <span className="px-2 font-mono text-xs uppercase tracking-widest text-text-muted shrink-0">
            Specialty
          </span>
          {unlockedCreatorSubLenses.map((sub) => {
            const active =
              providerType === sub.id || (!providerType && sub.id === "photographer");
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectLens?.(sub.id)}
                aria-pressed={active}
                className={`min-h-11 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent ${
                  active
                    ? "bg-gold-accent/20 text-gold-bright border border-gold-accent/40 font-semibold"
                    : "text-text-secondary hover:text-on-surface"
                }`}
              >
                <SubIcon size={13} aria-hidden="true" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {showBrokerSubBar && (
        <div
          role="group"
          aria-label="Broker license lens"
          className="inline-flex items-center gap-1 self-start rounded-lg border border-surface-variant/80 bg-surface-alt/70 p-1 overflow-x-auto no-scrollbar max-w-full"
        >
          <span className="px-2 font-mono text-xs uppercase tracking-widest text-text-muted shrink-0">
            Capacity
          </span>
          {unlockedBrokerSubLenses.map((sub) => {
            const active =
              sub.id === "salesperson"
                ? activeRoleKey === "salesperson"
                : activeRoleKey !== "salesperson";
            const SubIcon = sub.icon;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelectLens?.(sub.id)}
                aria-pressed={active}
                className={`min-h-11 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0 transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent ${
                  active
                    ? "bg-gold-accent/20 text-gold-bright border border-gold-accent/40 font-semibold"
                    : "text-text-secondary hover:text-on-surface"
                }`}
              >
                <SubIcon size={13} aria-hidden="true" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
