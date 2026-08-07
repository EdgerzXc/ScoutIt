"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

// ─────────────────────────────────────────────────────────────────────────
// THE MISSING CALLER
// NEW_IDEAS_2.md §59 · W18.2
//
// `/api/analytics` shipped complete and correct with **zero callers**, so
// `analytics_events` held 0 rows — and that is the table the Monthly Scout Wrap
// reads. "Unique monthly eyes", the number an owner logs in to see, had no
// source. This component is the producer that was missing (Standing Rule 21).
//
// It renders nothing. Mounted on the public property page, it reports one
// `property_view` per visit.
//
// ── WHY IT SENDS A SLUG, NOT AN ID ───────────────────────────────────
// The public property page renders from AIRTABLE and only has a slug.
// `analytics_events.property_id` is a uuid FK to Supabase `properties(id)`.
// Resolving that mapping is a database job, so the slug goes to the server and
// `/api/analytics` resolves it via `findProperty`. Sending the slug as an id
// would fail the uuid cast on every event — silently, because the tracking
// helper returns false rather than throwing.
//
// ── WHY IT ATTACHES A TOKEN ──────────────────────────────────────────
// Not to identify the viewer for its own sake — most are anonymous and stay
// that way. It is so the server can honour `telemetry_opt_out`, which until now
// was a toggle in the privacy panel that nothing read. The check is server-side
// (Rule 5); the token is simply what makes it possible.
// ─────────────────────────────────────────────────────────────────────────

export default function PropertyViewTracker({ propertySlug, propertyId = null }) {
  // React StrictMode double-invokes effects in development, and a re-render
  // must never re-count a view. Keyed by slug so client-side navigation between
  // two properties still records both.
  const reportedFor = useRef(null);

  useEffect(() => {
    const key = propertyId || propertySlug;
    if (!key || reportedFor.current === key) return;
    reportedFor.current = key;

    let cancelled = false;

    (async () => {
      try {
        let token = null;
        try {
          const { data } = await supabase.auth.getSession();
          token = data?.session?.access_token ?? null;
        } catch {
          // Signed out, or auth unavailable. An anonymous view is still a view.
        }
        if (cancelled) return;

        await fetch("/api/analytics", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ eventType: "property_view", propertySlug, propertyId }),
          // Survive the request if the visitor navigates away immediately —
          // otherwise short visits, which are the majority, go uncounted.
          keepalive: true,
        });
      } catch {
        // Analytics must never surface an error to a visitor, and must never
        // break the page it is measuring. A dropped event is the correct
        // failure mode; a broken property page is not.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [propertySlug, propertyId]);

  return null;
}
