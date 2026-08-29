"use client";

import { useState, useEffect, useCallback } from "react";
import * as Icons from "lucide-react";
import { crmFetch } from "../../../lib/crmClient";
import { describeActivity } from "@/lib/crm/activityRegistry";

// Per-deal / per-property Timeline backed by crm_activity_log. Pass exactly
// one of dealId / propertyId; with neither it renders the caller's merged
// feed (all their deals + owned properties). Read-only — writes happen in
// the lifecycle API routes via lib/crmActivity.js.
//
// Labels, icons, and metadata rendering all come from lib/crm/activityRegistry.js,
// which the API also validates against. This component used to carry its own
// label map and its own metadata reader, so a type registered in one place
// rendered as a raw snake_case string in the other.

const TONE_CLASSES = {
  accent: "text-gold-accent",
  success: "text-success",
  error: "text-error",
  neutral: "text-text-secondary",
};

/** Lucide component by registry name, with a safe fallback. */
function ActivityIcon({ name, className }) {
  const Component = Icons[name] || Icons.Dot;
  // lucide-react drops className on some builds, so the wrapper carries the
  // colour and the icon only carries geometry.
  return (
    <span className={className} aria-hidden="true">
      <Component size={14} />
    </span>
  );
}

export default function DealTimeline({
  dealId = null,
  propertyId = null,
  mockUserId,
  showPropertyTitles = false,
  limit = 25,
}) {
  const [items, setItems] = useState(null); // null = loading
  const [cursor, setCursor] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const buildUrl = useCallback((nextCursor) => {
    const params = new URLSearchParams();
    if (dealId) params.set("dealId", dealId);
    else if (propertyId) params.set("propertyId", propertyId);
    params.set("limit", String(limit));
    if (nextCursor) params.set("cursor", nextCursor);
    return `/api/crm/activity?${params.toString()}`;
  }, [dealId, propertyId, limit]);

  const load = useCallback(async () => {
    try {
      if (!mockUserId && process.env.NODE_ENV === "development") return;
      const data = await crmFetch(buildUrl(null), { mockUserId });
      setItems(data.activity || []);
      setCursor(data.nextCursor || null);
    } catch (e) {
      console.error("Failed to load timeline", e);
      setItems([]);
      setFailed(true);
    }
  }, [buildUrl, mockUserId]);

  useEffect(() => { load(); }, [load]);

  // "Load more" walks a keyset cursor. The old component sliced a fixed
  // response client-side, so anything past the first page was unreachable.
  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await crmFetch(buildUrl(cursor), { mockUserId });
      setItems((prev) => [...(prev || []), ...(data.activity || [])]);
      setCursor(data.nextCursor || null);
    } catch (e) {
      console.error("Failed to load more timeline", e);
    } finally {
      setLoadingMore(false);
    }
  };

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
    <div className="flex flex-col gap-3">
      <div className="border-l border-surface-variant ml-2 pl-4 flex flex-col gap-4">
        {items.map((item, idx) => {
          const { label, icon, tone, detail } = describeActivity(item);
          return (
            <div key={item.id} className="relative">
              <div
                className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${idx === 0 ? "bg-gold-accent" : "bg-surface-variant"}`}
              />
              <p className="text-[12px] text-text-muted font-data-tabular mb-0.5">
                {new Date(item.createdAt).toLocaleString(undefined, {
                  month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-on-surface flex items-center gap-1.5">
                <ActivityIcon name={icon} className={TONE_CLASSES[tone] || TONE_CLASSES.neutral} />
                {label}
                {showPropertyTitles && item.propertyTitle && (
                  <span className="text-text-secondary">— {item.propertyTitle}</span>
                )}
              </p>
              {detail && <p className="text-xs text-text-secondary mt-0.5">{detail}</p>}
            </div>
          );
        })}
      </div>

      {cursor && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="self-start ml-2 text-[12px] font-label-caps tracking-widest uppercase text-text-secondary hover:text-on-surface transition disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
