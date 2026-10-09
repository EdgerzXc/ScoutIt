"use client";

import { useEffect, useRef } from "react";
import { TELEMETRY_THRESHOLDS } from "@/lib/viaTelemetry";

/**
 * ViaTelemetryTracker (A-186 Phase 3)
 *
 * Invisible client-side component mounted on VIA-enabled property pages.
 * Monitors engagement signals (dwell time, scroll depth, unit inspection, media engagement)
 * and beacons qualified visit telemetry back to /api/property/[id]/via/telemetry.
 *
 * Adheres strictly to Section 31 & 32 of VIA specification:
 * Raw clicks are filtered; only substantive, qualified demand generation is recorded.
 */
export default function ViaTelemetryTracker({ propertySlug, promoterSlug = null }) {
  const isSentRef = useRef(false);
  const startTimeRef = useRef(null);
  const maxScrollRef = useRef(0);
  const unitsClickedRef = useRef(false);
  const mediaEngagedRef = useRef(false);
  const toolsUsedRef = useRef(false);
  const inquiryOpenedRef = useRef(false);

  useEffect(() => {
    if (!propertySlug || typeof window === "undefined") return;

    startTimeRef.current = Date.now();

    // 1. Scroll depth observer
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const currentDepth = Math.round((window.scrollY / scrollHeight) * 100);
        if (currentDepth > maxScrollRef.current) {
          maxScrollRef.current = currentDepth;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // 2. Click interaction observer for units, floor plans, 3D, and tools
    const handleClick = (e) => {
      const target = e.target;
      if (!target || !(target instanceof Element)) return;

      if (target.closest("[data-unit-id], .unit-card, [href*='unit']")) {
        unitsClickedRef.current = true;
      }
      if (target.closest("[data-gallery-trigger], [data-media-modal], [data-virtual-tour], .photo-stage")) {
        mediaEngagedRef.current = true;
      }
      if (target.closest("[data-calc-tool], [data-mortgage-calc], [data-valuation]")) {
        toolsUsedRef.current = true;
      }
      if (target.closest("[data-inquiry-trigger], [data-deal-initiate], [href*='contact']")) {
        inquiryOpenedRef.current = true;
        sendBeacon();
      }
    };
    document.addEventListener("click", handleClick, { passive: true });

    // 3. Custom event listener for inquiries
    const handleInquiryEvent = () => {
      inquiryOpenedRef.current = true;
      sendBeacon();
    };
    window.addEventListener("scoutit:inquiry_initiated", handleInquiryEvent);

    // 4. Evaluation beacon sender
    const sendBeacon = () => {
      if (isSentRef.current && !inquiryOpenedRef.current) return;

      const dwellSeconds = startTimeRef.current
        ? Math.round((Date.now() - startTimeRef.current) / 1000)
        : 0;

      const payload = {
        promoterSlug,
        dwellTimeSeconds: dwellSeconds,
        scrollDepthPercent: maxScrollRef.current,
        interactedWithUnits: unitsClickedRef.current,
        interactedWithMedia: mediaEngagedRef.current,
        usedTools: toolsUsedRef.current,
        openedInquiry: inquiryOpenedRef.current,
      };

      // Only beacon once we meet at least the minimum engagement threshold or inquiry opened
      const meetsBasicThreshold =
        inquiryOpenedRef.current ||
        (dwellSeconds >= TELEMETRY_THRESHOLDS.MIN_QUALIFIED_DWELL_SECONDS &&
          (maxScrollRef.current >= TELEMETRY_THRESHOLDS.MIN_QUALIFIED_SCROLL_DEPTH_PERCENT ||
            unitsClickedRef.current ||
            mediaEngagedRef.current ||
            toolsUsedRef.current));

      if (!meetsBasicThreshold) return;

      isSentRef.current = true;

      try {
        fetch(`/api/property/${encodeURIComponent(propertySlug)}/via/telemetry`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    // 5. Periodic check to qualify active engaged visitors
    const intervalId = setInterval(() => {
      if (!isSentRef.current) {
        sendBeacon();
      }
    }, 5000);

    // 6. Page exit handler
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendBeacon();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleClick);
      window.removeEventListener("scoutit:inquiry_initiated", handleInquiryEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (!isSentRef.current) {
        sendBeacon();
      }
    };
  }, [propertySlug, promoterSlug]);

  return null;
}
