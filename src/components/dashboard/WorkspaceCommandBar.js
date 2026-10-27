import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, LayoutGrid, MessageSquareText } from "lucide-react";

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
 * A-205 (Workspace Deck): the bar is the deck's tab strip — the same four
 * destinations the swipe gesture moves between, in the same order. `badges`
 * carries unread counts keyed by destination id (e.g. { inbox: 3 }); unknown
 * or zero counts render nothing, never a guessed zero.
 */
export default function WorkspaceCommandBar({ active, badges = {}, className = "" }) {
  return (
    <nav
      aria-label="Deal workspace"
      className={`grid grid-cols-4 gap-1 rounded-lg border border-gold-accent/20 bg-surface/75 p-1.5 backdrop-blur-xl ${className}`}
    >
      {DESTINATIONS.map(({ id, href, label, detail, Icon }) => {
        const selected = active === id;
        const badge = Number.isFinite(badges[id]) && badges[id] > 0 ? badges[id] : null;
        return (
          <Link
            key={id}
            href={href}
            aria-current={selected ? "page" : undefined}
            aria-label={badge ? `${label}, ${badge} unread` : label}
            className={`group relative flex min-h-11 flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 rounded-md border px-1 sm:px-2.5 py-1.5 sm:py-2 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/70 active:scale-[0.98] touch-manipulation ${
              selected
                ? "border-gold-accent/50 bg-gold-accent text-background shadow-[0_0_18px_rgba(var(--accent-rgb),0.18)]"
                : "border-transparent text-text-secondary hover:border-gold-accent/25 hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
          >
            <Icon size={16} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
            <span className="min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left leading-none">
              <span className="block font-mono text-[10px] sm:text-[12px] font-bold uppercase tracking-wider sm:tracking-[0.12em] truncate max-w-full">
                {label}
              </span>
              <span
                className={`hidden text-[11px] sm:block mt-0.5 ${selected ? "text-background/80" : "text-text-muted"}`}
              >
                {detail}
              </span>
            </span>
            {badge && (
              <span
                aria-hidden="true"
                className={`absolute top-0.5 right-1 sm:-top-1 sm:-right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] sm:text-[11px] font-bold ${
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
