"use client";

import { useEffect, useRef } from "react";

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/**
 * useDescentProgress
 * 
 * Injects a local `--sp` CSS variable (0.0 to 1.0) onto the component's root node
 * representing its descent progress through the viewport.
 * 
 * --sp = 0 (Element is just entering the bottom of the viewport)
 * --sp = 1 (Element is fully scrolled past the top)
 */
export default function useDescentProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.style.setProperty("--sp", 1);
      return;
    }

    let rafId = 0;
    let isIntersecting = false;

    const compute = () => {
      rafId = 0;
      if (!isIntersecting) return;

      const vh = window.innerHeight || 1;
      const rect = el.getBoundingClientRect();
      
      // Calculate progress:
      // When rect.top == vh, progress is 0.
      // When rect.top == -rect.height, progress is 1.
      const rawProgress = (vh - rect.top) / (vh + rect.height);
      const clampedProgress = clamp(rawProgress, 0, 1);
      
      el.style.setProperty("--sp", clampedProgress.toFixed(4));
    };

    const onScroll = () => {
      if (!rafId && isIntersecting) {
        rafId = requestAnimationFrame(compute);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting;
      if (isIntersecting) {
        // Trigger an immediate compute when it becomes visible
        compute();
      }
    }, {
      // Observe slightly outside the viewport to ensure smooth handoffs
      rootMargin: "10% 0px 10% 0px"
    });

    const container = el.closest('.cinematic-container') || window;
    observer.observe(el);
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    // Initial compute
    compute();

    return () => {
      observer.disconnect();
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return ref;
}
