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
  const sectionRef = useRef(null);

  useEffect(() => {
    const container = document.querySelector('.cinematic-container');
    if (!container) return;
    
    const section = sectionRef.current;
    if (!section) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      section.style.setProperty("--sp", 1);
      return;
    }

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      
      // How far into the section we've scrolled (0 = just entered, 1 = leaving)
      const progress = Math.max(0, Math.min(1,
        1 - (sectionRect.bottom - containerRect.top) / containerRect.height
      ));
      
      section.style.setProperty('--sp', progress.toFixed(4));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // run once on mount
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return sectionRef;
}
