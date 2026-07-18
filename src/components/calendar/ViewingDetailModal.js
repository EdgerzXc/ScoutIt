"use client";

import { useEffect } from "react";
import { formatDayHeading, formatShortRange } from "@/lib/calendar/calendarDates";

/**
 * Read-only detail for a viewing appointment. Viewings aren't free-form
 * editable — the host can only accept/decline a pending request here.
 * @param {{ viewing: object|null, onRespond, respondingId, onClose }} props
 */
export default function ViewingDetailModal({ viewing, onRespond, respondingId, onClose }) {
  useEffect(() => {
    if (!viewing) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing, onClose]);

  if (!viewing) return null;

  const canRespond = viewing.status === "pending" && viewing.isHost;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#121212] border border-surface-variant rounded-t-2xl sm:rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-variant">
          <span className="text-[11px] uppercase tracking-wider font-mono text-sky-300">👁 Property Viewing</span>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted hover:text-on-surface text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <h2 className="font-working-title text-lg text-on-surface">{viewing.title}</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-text-muted w-20 shrink-0">When</dt>
              <dd className="text-text-secondary">
                {formatDayHeading(viewing.startsAt)} • {formatShortRange(viewing.startsAt, viewing.endsAt, false)}
              </dd>
            </div>
            {viewing.contactName && (
              <div className="flex gap-2">
                <dt className="text-text-muted w-20 shrink-0">With</dt>
                <dd className="text-text-secondary">{viewing.contactName}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-text-muted w-20 shrink-0">Status</dt>
              <dd className="text-text-secondary capitalize">
                {viewing.status === "pending" ? "Awaiting host" : viewing.status}
              </dd>
            </div>
          </dl>

          {canRespond && (
            <div className="flex items-center gap-2 pt-3 border-t border-surface-variant">
              <button
                type="button"
                onClick={() => onRespond(viewing.id, "cancelled")}
                disabled={respondingId === viewing.id}
                className="flex-1 text-xs text-error border border-error/30 py-2 rounded hover:bg-error/10
                  uppercase tracking-wider font-mono disabled:opacity-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => onRespond(viewing.id, "confirmed")}
                disabled={respondingId === viewing.id}
                className="flex-1 text-xs text-background bg-gold-accent py-2 rounded hover:bg-gold-bright
                  uppercase tracking-wider font-mono disabled:opacity-50"
              >
                Accept
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
