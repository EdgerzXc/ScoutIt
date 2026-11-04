import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, LayoutGrid, MessageSquareText } from "lucide-react";
import { isPipelineRole } from "@/lib/workspaceDeck";

const DESTINATIONS = [
  {
    id: "workspace",
    href: "/dashboard",
    label: "Workspace",
    detail: "Home",
    Icon: LayoutGrid,
  },
  {
    id: "inbox",
    href: "/dashboard/inbox",
    label: "Inbox",
    detail: "Deal rooms",
    Icon: MessageSquareText,
  },
  {
    id: "crm",
    href: "/dashboard/crm",
    label: "CRM",
    detail: "Pipeline",
    Icon: BriefcaseBusiness,
  },
  {
    id: "calendar",
    href: "/dashboard/calendar",
    label: "Calendar",
    detail: "Viewings",
    Icon: CalendarDays,
  },
];

/**
 * The shared navigation language for ScoutIt's connected deal workspace.
 * Keeping this in one component makes Workspace, Inbox, CRM and Calendar
 * feel like views of the same system instead of unrelated tools.
 *
 * A-205 (Workspace Deck) & A-295: the bar is the deck's tab strip.
 * For non-pipeline roles (buyer / seeker / exploring), CRM and Calendar
 * are omitted so seekers only see their relevant deal deck (Workspace & Inbox).
 * Pipeline roles (owner / broker / salesperson) receive all four tools.
 */
export default function WorkspaceCommandBar({
  active,
  badges = {},
  roleLabel = null,
  className = "",
  mode = "owner",
}) {
  const isPipeline = Array.isArray(mode)
    ? isPipelineRole(mode)
    : (mode ? isPipelineRole([mode]) : true);

  const visibleDestinations = DESTINATIONS.filter((d) => {
    if (d.id === "crm") {
      return isPipeline;
    }
    return true;
  });

  const gridClass = visibleDestinations.length === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <nav
      aria-label="Deal workspace"
      className={`grid ${gridClass} gap-1 rounded-lg border border-gold-accent/20 bg-surface/75 p-1.5 backdrop-blur-xl ${className}`}
    >
      {visibleDestinations.map(({ id, href, label, detail, Icon }) => {
        const selected = active === id;
        const displayLabel = id === "workspace" && roleLabel ? roleLabel : label;
        const displayDetail = id === "workspace" && roleLabel ? "Workspace" : detail;
        const badge = Number.isFinite(badges[id]) && badges[id] > 0 ? badges[id] : null;
        return (
          <Link
            key={id}
            href={href}
            aria-current={selected ? "page" : undefined}
            aria-label={badge ? `${displayLabel}, ${badge} unread` : displayLabel}
            className={`group relative flex min-h-11 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md border px-1 sm:px-2.5 py-1.5 sm:py-2 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/70 active:scale-[0.98] touch-manipulation ${
              selected
                ? "border-gold-accent/50 bg-gold-accent text-background shadow-[0_0_18px_rgba(var(--accent-rgb),0.18)]"
                : "border-transparent text-text-secondary hover:border-gold-accent/25 hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
          >
            <Icon size={16} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left leading-none">
              <span className="block font-mono text-xs font-bold uppercase tracking-wider sm:tracking-[0.12em] truncate max-w-full">
                {displayLabel}
              </span>
              <span
                className={`hidden text-xs sm:block mt-0.5 ${selected ? "text-background/80" : "text-text-muted"}`}
              >
                {displayDetail}
              </span>
            </span>
            {badge && (
              <span
                aria-hidden="true"
                className={`absolute top-0.5 right-1 sm:-top-1 sm:-right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs font-bold ${
                  selected ? "bg-background text-gold-accent" : "bg-gold-accent text-background"
                }`}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
