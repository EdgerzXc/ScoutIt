"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isLiteMode } from "@/lib/liteMode";
import {
  FIRST_VISIT_MARKER_KEY,
  FIRST_VISIT_MARKER_TTL_MS,
  MAX_PUBLIC_DATA_BYTES,
  canWarmFirstVisit,
  isFreshWarmMarker,
  nextGuideRouteHint,
  selectWarmRoutes,
} from "@/lib/firstVisitWarmPolicy";

let warmedThisDocument = false;

function readJson(storage, key) {
  try { return JSON.parse(storage.getItem(key) || "null"); } catch { return null; }
}

export default function FirstVisitWarmer() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (warmedThisDocument) return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const capability = () => canWarmFirstVisit({
      online: navigator.onLine,
      saveData: connection?.saveData,
      effectiveType: connection?.effectiveType,
      deviceMemory: navigator.deviceMemory,
      hardwareConcurrency: navigator.hardwareConcurrency,
      liteMode: isLiteMode(),
      reducedMotion,
    });
    if (!capability()) return;

    const marker = readJson(sessionStorage, FIRST_VISIT_MARKER_KEY);
    if (isFreshWarmMarker(marker)) return;

    const guideProgress = readJson(localStorage, "scoutit_journey_guide_v1");
    const guideHint = nextGuideRouteHint(guideProgress);
    const candidates = selectWarmRoutes(pathname, guideHint ? [guideHint] : []);
    const prefetched = new Set();
    const controller = new AbortController();
    let idleId = null;
    let fallbackId = null;
    let started = false;

    const prefetch = (route) => {
      if (!route || prefetched.has(route) || prefetched.size >= 2 || !capability()) return;
      prefetched.add(route);
      router.prefetch(route);
    };

    const remember = () => {
      try {
        sessionStorage.setItem(FIRST_VISIT_MARKER_KEY, JSON.stringify({
          version: 1,
          expiresAt: Date.now() + FIRST_VISIT_MARKER_TTL_MS,
        }));
      } catch { /* private browsing can deny storage; the in-document guard remains */ }
    };

    const warm = async () => {
      if (started || !capability()) return;
      started = true;
      warmedThisDocument = true;
      prefetch(candidates[0]);
      try {
        const result = await fetch("/api/preload/public", {
          cache: "force-cache",
          credentials: "omit",
          signal: controller.signal,
        });
        const advertisedBytes = Number(result.headers.get("content-length") || 0);
        if (!result.ok || advertisedBytes > MAX_PUBLIC_DATA_BYTES) return;
        const bytes = await result.arrayBuffer();
        if (bytes.byteLength > MAX_PUBLIC_DATA_BYTES) return;
        remember();
      } catch (error) {
        if (error?.name !== "AbortError") return;
      }
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(warm, { timeout: 1800 });
      } else {
        fallbackId = window.setTimeout(warm, 900);
      }
    };

    const onIntent = (event) => {
      const anchor = event.target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (candidates.includes(href)) prefetch(href);
    };
    const cancelIfConstrained = () => {
      if (!capability()) controller.abort();
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    document.addEventListener("pointerover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    window.addEventListener("offline", cancelIfConstrained);
    connection?.addEventListener?.("change", cancelIfConstrained);

    return () => {
      controller.abort();
      window.removeEventListener("load", schedule);
      document.removeEventListener("pointerover", onIntent);
      document.removeEventListener("focusin", onIntent);
      window.removeEventListener("offline", cancelIfConstrained);
      connection?.removeEventListener?.("change", cancelIfConstrained);
      if (idleId !== null) window.cancelIdleCallback(idleId);
      if (fallbackId !== null) window.clearTimeout(fallbackId);
    };
  }, [pathname, router]);

  return null;
}
