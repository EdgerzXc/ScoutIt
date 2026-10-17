"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import useSwipeDeck from "@/hooks/useSwipeDeck";
import { consumeDeckDirection } from "@/lib/workspaceDeck";

// DeckPanel — one swipeable deck surface.
//
// Wraps a dashboard page's content: tracks the finger 1:1 via the swipe
// hook and, on a committed swipe, route-pushes the neighbouring panel. The
// arriving panel consumes the recorded direction and slides in from the
// correct side (220ms spring). Mount-only animation: no AnimatePresence
// across routes, no layout thrash — one transform, compositor-side.
//
// Props: leftHref / rightHref (nullable at deck ends), className passthrough.
export default function DeckPanel({ leftHref, rightHref, className = "", children }) {
  const reduceMotion = useReducedMotion();
  const { trackRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDeck({ leftHref, rightHref });

  // Read exactly once per mount. A stale direction must never animate an
  // unrelated navigation, so consumption (not peeking) is the only read.
  const entryDirection = useMemo(() => consumeDeckDirection(), []);
  const entryX = entryDirection === "left" ? 48 : entryDirection === "right" ? -48 : 0;
  const animateEntry = !reduceMotion && entryX !== 0;

  return (
    <motion.div
      ref={trackRef}
      className={className}
      style={{ touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      initial={animateEntry ? { x: entryX, opacity: 0.4 } : false}
      animate={animateEntry ? { x: 0, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.9 }}
    >
      {children}
    </motion.div>
  );
}
