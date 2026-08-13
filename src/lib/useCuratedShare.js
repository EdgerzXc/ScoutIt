"use client";

// ═══════════════════════════════════════════════════════════════
// useCuratedShare — one curated share path, shared by every property flow.
//
// WHY A HOOK
// The curated share logic used to be an inline onClick duplicated in
// CommercialFlow and ResidentialFlow, and the mobile bottom bar had a third,
// completely different implementation that skipped the curated engine entirely
// (see BottomNav.js). Three copies, two behaviours, one of them invisible on
// the phones most of the audience uses.
//
// This hook is now the only implementation. It:
//   • builds the copy through buildShareText() — never a scraped <h1>
//   • decorates the link with attribution before the text is built, so the URL
//     inside the copy is the URL that gets measured
//   • prefers the OS share sheet on mobile, falls back to ShareModal
//   • answers the global `scoutit:property-share` event so the mobile bottom
//     bar reaches the same path as the desktop button
//
// THE SAMPLE RULE
// Sample listings must never receive curated share copy — fake inventory must
// not be promotable as real. Pass `enabled: !d.is_sample`. When disabled the
// hook registers no listener at all, so BottomNav's `detail.handled` stays
// false and it falls back to copying the bare link. The rule is enforced by
// absence, which is harder to accidentally undo than an `if` inside a handler.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from "react";
import { buildShareText } from "@/lib/shareBriefing";
import { buildShareUrl, cleanPropertyUrl, resolveShareRef } from "@/lib/shareAttribution";
import { trackEvent, GA_EVENTS } from "@/lib/analytics";

const MOBILE_UA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

export default function useCuratedShare(property, { enabled = true } = {}) {
  const [shareTextOpen, setShareTextOpen] = useState(null);

  const openCuratedShare = useCallback(async () => {
    if (typeof window === "undefined" || !enabled || !property) return;

    const base = cleanPropertyUrl(window.location.href);

    // Attribution must never be able to block a share, so a failure here just
    // yields an empty ref and the link still goes out with its UTM params.
    let ref = "";
    try {
      ref = await resolveShareRef(property?.__shareUserId || null);
    } catch {
      ref = "";
    }

    const isMobile = MOBILE_UA.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      // `native` because once the OS sheet takes over we genuinely cannot know
      // which app received it — claiming otherwise would be a fabricated
      // source in GA4.
      const url = buildShareUrl(base, { channel: "native", ref });
      const text = buildShareText(property, url);
      try {
        await navigator.share({
          title: `${property.title || "Premium Space"} - ScoutIt`,
          text,
        });
        // Resolved = the sheet completed. A dismissal rejects with AbortError
        // and is correctly NOT counted — the convention here is that events
        // mean outcomes, not intent.
        trackEvent(GA_EVENTS.SHARE_COMPLETED, {
          channel: "native",
          property_slug: property.slug || property.id || undefined,
          ref: ref || undefined,
        });
      } catch (err) {
        if (err?.name !== "AbortError") {
          setShareTextOpen(buildShareText(property, buildShareUrl(base, { channel: "copy", ref })));
        }
      }
      return;
    }

    // Desktop (and mobile browsers without the Web Share API): open the modal,
    // which owns the per-channel behaviour including copy-then-open.
    setShareTextOpen(buildShareText(property, buildShareUrl(base, { channel: "copy", ref })));
  }, [property, enabled]);

  // The mobile bottom action bar's Share button routes here. `detail.handled`
  // tells BottomNav that a curated path exists so it does not also copy a bare
  // link. Listeners are synchronous, so setting it here is observable there.
  useEffect(() => {
    if (!enabled) return undefined;
    const onShare = (event) => {
      if (event?.detail) event.detail.handled = true;
      openCuratedShare();
    };
    window.addEventListener("scoutit:property-share", onShare);
    return () => window.removeEventListener("scoutit:property-share", onShare);
  }, [enabled, openCuratedShare]);

  return { shareTextOpen, setShareTextOpen, openCuratedShare };
}
