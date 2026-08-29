import Link from "next/link";
import { CalendarClock, CalendarDays, Check, ExternalLink, RotateCcw, X } from "lucide-react";

function formatViewingRange(appointment) {
  const start = new Date(appointment.scheduledAt);
  const end = appointment.endsAt ? new Date(appointment.endsAt) : null;
  const date = start.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startTime = start.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const endTime = end?.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${date} · ${startTime}${endTime ? `–${endTime}` : ""}`;
}

const STATUS_STYLES = {
  pending: "border-gold-accent/30 bg-gold-accent/10 text-gold-accent",
  confirmed: "border-success/30 bg-success/10 text-success",
  completed: "border-success/30 bg-success/10 text-success",
  cancelled: "border-error/30 bg-error/10 text-error",
};

/** Live appointment state shared by the conversation, CRM, and Calendar. */
export default function ViewingWorkspaceCard({
  appointment,
  busy = false,
  onConfirm,
  onReschedule,
  onCancel,
}) {
  if (!appointment) return null;

  const open = ["pending", "confirmed"].includes(appointment.status);
  const canConfirm = appointment.isHost && appointment.status === "pending";

  return (
    <section className="border-b border-gold-accent/15 bg-surface/70 px-4 py-3 backdrop-blur-xl" aria-label="Current viewing">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-lg border border-gold-accent/20 bg-background/55 p-3 shadow-[0_12px_32px_rgba(0,0,0,0.28)] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gold-accent/25 bg-gold-accent/10 text-gold-accent">
            <CalendarClock size={18} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[12px] font-bold uppercase tracking-[0.12em] text-on-surface">
                Live viewing
              </span>
              <span className={`rounded border px-1.5 py-0.5 font-mono text-[12px] font-bold uppercase tracking-wider ${STATUS_STYLES[appointment.status] || "border-surface-variant text-text-secondary"}`}>
                {appointment.status}
              </span>
            </div>
            <p className="mt-1 font-data-tabular text-sm text-on-surface">{formatViewingRange(appointment)}</p>
            <p className="truncate text-[12px] text-text-secondary">
              {appointment.propertyTitle || "Property viewing"}
              {appointment.status === "pending" ? (appointment.isHost ? " · Your confirmation is required" : " · Awaiting host confirmation") : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {appointment.meetLink && appointment.status === "confirmed" && (
            <a
              href={appointment.meetLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-success/30 bg-success/10 px-3 font-mono text-[12px] font-bold uppercase tracking-wider text-success transition-all duration-300 ease-out hover:bg-success/15"
            >
              Join <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
          {canConfirm && (
            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="inline-flex min-h-10 items-center gap-1.5 rounded bg-gold-accent px-3 font-mono text-[12px] font-bold uppercase tracking-wider text-background transition-all duration-300 ease-out hover:bg-gold-bright disabled:opacity-40"
            >
              <Check size={13} aria-hidden="true" /> Confirm
            </button>
          )}
          {open && (
            <button
              type="button"
              disabled={busy}
              onClick={onReschedule}
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-surface-variant bg-surface-variant/40 px-3 font-mono text-[12px] uppercase tracking-wider text-text-secondary transition-all duration-300 ease-out hover:border-gold-accent/35 hover:text-on-surface disabled:opacity-40"
            >
              <RotateCcw size={13} aria-hidden="true" /> Move
            </button>
          )}
          {open && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-error/25 px-3 font-mono text-[12px] uppercase tracking-wider text-error transition-all duration-300 ease-out hover:bg-error/10 disabled:opacity-40"
            >
              <X size={13} aria-hidden="true" /> Cancel
            </button>
          )}
          <Link
            href="/dashboard/calendar"
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-surface-variant px-3 font-mono text-[12px] uppercase tracking-wider text-text-secondary transition-all duration-300 ease-out hover:border-gold-accent/35 hover:text-on-surface"
          >
            <CalendarDays size={13} aria-hidden="true" /> Calendar
          </Link>
        </div>
      </div>
    </section>
  );
}
