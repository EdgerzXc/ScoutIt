"use client";

import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────────
// usePremiumFields — fetch tier-gated property fields after mount
// NEW_IDEAS.md §25.1 / §45
//
// The property page is ISR, so its payload is identical for every visitor and
// carries NO premium values. Entitled users pull the real ones from
// /api/property/premium, which resolves the tier from the session server-side.
//
// Replaces `canSee(feature, getCurrentTier())`, which read localStorage — a
// value the user controls.
//
// ── FAILS LOCKED ──
// Any error, empty response or missing slug leaves `fields` empty and
// `unlocked` false. The page then renders exactly what it renders for an
// anonymous visitor: the teaser. A network blip must never fall open, and it
// must never blank out a page either — which is why the caller keeps using the
// stripped property object as its base and merges these on top.
// ─────────────────────────────────────────────────────────────────────────

export function usePremiumFields(slug) {
  const [fields, setFields] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/property/premium?slug=${encodeURIComponent(slug)}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("premium fetch failed");
        const data = await res.json();
        if (!cancelled) setFields(data?.fields || {});
      } catch {
        // Deliberately silent: for anonymous visitors — the majority — this is
        // the expected path, and a console error on every property view would
        // train everyone to ignore the console.
        if (!cancelled) setFields({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  return {
    fields: fields || {},
    loading,
    /** True only once the SERVER has returned something for this feature. */
    has: (field) => {
      const v = fields?.[field];
      if (v == null) return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === "object") return Object.keys(v).length > 0;
      return String(v).trim() !== "";
    },
  };
}

export default usePremiumFields;
