"use client";

/* ════════════════════════════════════════════════════════════════
   SCOUTIT — CINEMATIC JOURNEY (overlay on the homepage)
   A golden light "channeled" down the LEFT of the page. The line is
   anchored to the PAGE CONTENT (it scrolls with the page, not the
   screen) and weaves down through each layer, pooling into a loop at
   each section. Activated by the UFO click (`scoutit:cinematic`).

   BUILD STATUS: Checkpoint 1b
   - Line travels WITH the page content (not a fixed scrollbar)
   - Weaves down the left, with a pool/loop at each of the 6 layers
   - Draws progressively as you scroll; glowing head rides the tip
   - Pure-black + vignette cinematic veil (content still visible)
   Missions + particles arrive next.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import "./cinematic.css";

// The 6 layers, matched to the homepage's real sections.
export const CINEMATIC_LAYERS = [
  { sel: ".section-board", label: "01 — THE BOARD", mission: "We raise the ceiling of what Philippine real estate can be. Every player ranked, every listing set to a new standard. The market will never be stale again." },
  { sel: ".section-property", label: "02 — PROPERTY INTELLIGENCE", mission: "Every detail, every signal, every data point — so any user can walk into a decision with full confidence. No guesswork. No gatekeeping. Ever." },
  { sel: ".section-discover", label: "03 — DISCOVERY", mission: "Not just headlines. Real insights, real data, real location intelligence — for users, investors, and researchers who need to understand the market, not just follow it." },
  { sel: ".section-services", label: "04 — THE ECOSYSTEM", mission: "The first of its kind in the Philippines. A platform that connects buyers, owners, brokers, photographers, researchers — everyone the market needs, in one place." },
  { sel: ".section-wishlist", label: "05 — THE LEDGER", mission: "For the dreamers. A living wishlist that keeps your goals in view, your options tracked, and your ceiling moving — because wanting more is where it all starts." },
  { sel: ".section-about", label: "06 — ABOUT US", mission: "This was never about us. It was always about you." },
];

// Build the line's path (in page-content pixel coordinates) from the
// measured section positions: weave down the left, pool into a loop at
// each section, with a tail to the bottom.
function buildPath(pts, contentH, W) {
  if (!pts.length) return { d: `M ${W * 0.42} 0 L ${W * 0.42} ${contentH}`, loops: [] };
  const x0 = W * 0.42;
  const loops = [];
  let d = `M ${x0.toFixed(1)} ${Math.max(0, pts[0].top - 60).toFixed(1)}`;
  let prevY = Math.max(0, pts[0].top - 60);

  pts.forEach((p, i) => {
    const entryY = p.top + p.height * 0.12;
    const weaveX = x0 + (i % 2 === 0 ? -W * 0.14 : W * 0.14);
    // gentle weave down into this layer
    d += ` C ${weaveX.toFixed(1)} ${((prevY + entryY) / 2).toFixed(1)}, ${x0.toFixed(1)} ${(entryY - 50).toFixed(1)}, ${x0.toFixed(1)} ${entryY.toFixed(1)}`;
    // pool loop in the lower-left of the section
    const cy = p.top + p.height * 0.62;
    const rx = W * 0.36;
    const ry = Math.min(95, p.height * 0.13);
    loops.push({ x: x0 - rx * 0.7, y: cy });
    d += ` C ${(x0 - rx).toFixed(1)} ${(cy - ry).toFixed(1)}, ${(x0 - rx).toFixed(1)} ${(cy + ry).toFixed(1)}, ${x0.toFixed(1)} ${(cy + ry).toFixed(1)}`;
    prevY = cy + ry;
  });
  // tail to the bottom of the page
  d += ` C ${(x0 + W * 0.1).toFixed(1)} ${(prevY + 140).toFixed(1)}, ${x0.toFixed(1)} ${(contentH - 80).toFixed(1)}, ${x0.toFixed(1)} ${(contentH - 24).toFixed(1)}`;
  return { d, loops };
}

export default function CinematicJourney() {
  const [active, setActive] = useState(false);
  const [path, setPath] = useState(null); // { d, contentH, W }

  const groupRef = useRef(null); // translated by -scrollTop (anchors line to page)
  const drawRef = useRef(null); // bright, scroll-drawn path
  const headRef = useRef(null); // glowing head of light
  const lenRef = useRef(0);
  const rafScheduled = useRef(false);

  useEffect(() => {
    const on = () => setActive(true);
    window.addEventListener("scoutit:cinematic", on);
    return () => window.removeEventListener("scoutit:cinematic", on);
  }, []);

  // Measure the page + sections and build the path once active (and on resize).
  useEffect(() => {
    if (!active) return;
    const container = document.querySelector(".cinematic-container");
    if (!container) return;

    const measure = () => {
      const cRect = container.getBoundingClientRect();
      const pts = CINEMATIC_LAYERS.map((L) => document.querySelector(L.sel))
        .filter(Boolean)
        .map((s) => {
          const r = s.getBoundingClientRect();
          return { top: r.top - cRect.top + container.scrollTop, height: r.height };
        });
      const contentH = container.scrollHeight;
      const W = Math.min(window.innerWidth * 0.34, 460);
      const built = buildPath(pts, contentH, W);
      setPath({ d: built.d, contentH, W });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active]);

  // Scroll-driven update: anchor the line to content + progressive draw + head.
  useEffect(() => {
    if (!active || !path) return;
    const container = document.querySelector(".cinematic-container");
    if (!container || !drawRef.current) return;
    lenRef.current = drawRef.current.getTotalLength();

    const apply = () => {
      rafScheduled.current = false;
      const scrollTop = container.scrollTop;
      const vh = container.clientHeight;

      // anchor the whole line to the page content
      if (groupRef.current) {
        groupRef.current.style.transform = `translateY(${-scrollTop}px)`;
      }

      // progressive draw: light reaches a little ahead of the viewport center
      const tipDocY = scrollTop + vh * 0.5;
      const drawP = Math.min(1, Math.max(0, tipDocY / path.contentH));
      const len = lenRef.current;
      if (drawRef.current) {
        drawRef.current.style.strokeDasharray = `${len}`;
        drawRef.current.style.strokeDashoffset = `${len * (1 - drawP)}`;
      }
      if (headRef.current && drawRef.current) {
        const pt = drawRef.current.getPointAtLength(len * drawP);
        headRef.current.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
        headRef.current.style.opacity = drawP > 0.001 ? "1" : "0";
      }
    };

    const onScroll = () => {
      if (!rafScheduled.current) {
        rafScheduled.current = true;
        requestAnimationFrame(apply);
      }
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    apply();
    return () => container.removeEventListener("scroll", onScroll);
  }, [active, path]);

  if (!active) return null;

  return (
    <div className="cinematic-journey" aria-hidden="true">
      {/* pure-black + vignette cinematic veil (content stays visible) */}
      <div className="cinematic-veil" />

      {/* the golden light channel — anchored to the page content */}
      {path && (
        <svg
          className="cinematic-line"
          width={path.W}
          height="100%"
          style={{ overflow: "visible" }}
        >
          <g ref={groupRef}>
            <path className="cinematic-line-track" d={path.d} />
            <path className="cinematic-line-draw" ref={drawRef} d={path.d} />
            <g ref={headRef} className="cinematic-head">
              <circle r="11" className="cinematic-head-glow" />
              <circle r="3.5" className="cinematic-head-core" />
            </g>
          </g>
        </svg>
      )}
    </div>
  );
}
