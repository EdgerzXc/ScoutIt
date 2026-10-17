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
            className={`group relative flex min-h-11 items-center justify-center gap-1.5 rounded-md border px-1 py-2 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent/70 active:scale-[0.98] touch-manipulation ${
              selected
                ? "border-gold-accent/50 bg-gold-accent text-background shadow-[0_0_18px_rgba(var(--accent-rgb),0.18)]"
                : "border-transparent text-text-secondary hover:border-gold-accent/25 hover:bg-surface-variant/50 hover:text-on-surface"
            }`}
          >
            <Icon size={15} strokeWidth={1.7} aria-hidden="true" />
            <span className="min-w-0">
              <span className="block font-mono text-[12px] font-bold uppercase tracking-[0.12em]">
                {label}
              </span>
              <span
                className={`hidden text-[12px] sm:block ${selected ? "text-background/70" : "text-text-muted"}`}
              >
                {detail}
              </span>
            </span>
            {badge && (
              <span
                aria-hidden="true"
                className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[12px] font-bold ${
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
