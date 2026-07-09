"use client";

import { useState, useEffect, useCallback } from "react";
import { crmFetch } from "../../../lib/crmClient";

// Per-deal / per-property Timeline backed by crm_activity_log. Pass exactly
// one of dealId / propertyId; with neither it renders the caller's merged
// feed (all their deals + owned properties). Read-only — writes happen in
// the lifecycle API routes via lib/crmActivity.js.

const TYPE_LABELS = {
  inquiry: { icon: "💬", label: "New inquiry" },
  operator_request: { icon: "🏢", label: "Operator request" },
  deal_created: { icon: "📂", label: "Deal created" },
  status_change: { icon: "🔁", label: "Status changed" },
  note_added: { icon: "📝", label: "Notes updated" },
  viewing_scheduled: { icon: "📅", label: "Viewing scheduled" },
  viewing_confirmed: { icon: "✅", label: "Viewing confirmed" },
  viewing_cancelled: { icon: "🚫", label: "Viewing cancelled" },
  viewing_completed: { icon: "🏁", label: "Viewing completed" },
  delegation_accepted: { icon: "🤝", label: "Units delegated" },
  delegation_declined: { icon: "🚫", label: "Delegation declined" },
};

function describe(item) {
  const meta = item.metadata || {};
  switch (item.activityType) {
    case "status_change":
      return meta.from && meta.to ? `${meta.from} → ${meta.to}` : null;
    case "viewing_scheduled":
      return meta.scheduledAt ? `For ${new Date(meta.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : null;
    case "inquiry":
      if (meta.source === "public_form") {
        const who = meta.name || meta.email || "A visitor";
        return `${who}${meta.message ? `: "${meta.message.slice(0, 120)}"` : " reached out via the property page"}`;
      }
      return null;
    case "delegation_accepted":
      return meta.unitCount ? `${meta.unitCount} unit${meta.unitCount === 1 ? "" : "s"} handed to the operator` : null;
    default:
      return null;
  }
}

export default function DealTimeline({ dealId = null, propertyId = null, mockUserId, showPropertyTitles = false, limit = 25 }) {
  const [items, setItems] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (dealId) params.set("dealId", dealId);
      else if (propertyId) params.set("propertyId", propertyId);
      const qs = params.toString();
      const data = await crmFetch(`/api/crm/activity${qs ? `?${qs}` : ""}`, { mockUserId });
      setItems((data.activity || []).slice(0, limit));
    } catch (e) {
      console.error("Failed to load timeline", e);
      setItems([]);
      setFailed(true);
    }
  }, [dealId, propertyId, mockUserId, limit]);

  useEffect(() => { load(); }, [load]);

  if (items === null) {
    return <p className="text-text-muted text-sm py-4 text-center animate-pulse">Loading timeline…</p>;
  }
  if (failed) {
    return <p className="text-text-secondary text-sm py-4 text-center">Couldn&apos;t load the timeline.</p>;
  }
  if (items.length === 0) {
    return (
      <p className="text-text-secondary text-sm py-4 text-center">
        No activity recorded yet. Inquiries, status changes, notes, and viewings will appear here as they happen.
      </p>
    );
  }

  return (
    <div className="border-l border-surface-variant ml-2 pl-4 flex flex-col gap-4">
      {items.map((item, idx) => {
        const type = TYPE_LABELS[item.activityType] || { icon: "•", label: item.activityType.replace(/_/g, " ") };
        const detail = describe(item);
        return (
          <div key={item.id} className="relative">
            <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${idx === 0 ? "bg-gold-accent" : "bg-surface-variant"}`}></div>
            <p className="text-[11px] text-text-muted font-data-tabular mb-0.5">
              {new Date(item.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="text-sm text-on-surface flex items-center gap-1.5">
              <span aria-hidden="true">{type.icon}</span> {type.label}
              {showPropertyTitles && item.propertyTitle && (
                <span className="text-text-secondary">— {item.propertyTitle}</span>
              )}
            </p>
            {detail && <p className="text-xs text-text-secondary mt-0.5">{detail}</p>}
          </div>
        );
      })}
    </div>
  );
}
