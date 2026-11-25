"use client";

import { useMemo } from "react";
import useSwipeDeck from "@/hooks/useSwipeDeck";
import { consumeDeckDirection } from "@/lib/workspaceDeck";

// DeckPanel — one swipeable deck surface.
//
// Wraps a dashboard page's content: tracks the finger 1:1 via the swipe
// hook and, on a committed swipe, route-pushes the neighbouring panel. The
// arriving panel consumes the recorded direction and slides in from the
// correct side (220ms GPU transform). Pure CSS keyframes eliminate the
// framer-motion runtime cost from every wrapped dashboard route.
//
// Props: leftHref / rightHref (nullable at deck ends), className passthrough.
export default function DeckPanel({ leftHref, rightHref, className = "", children }) {
  const { trackRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDeck({ leftHref, rightHref });

  // Read exactly once per mount. A stale direction must never animate an
  // unrelated navigation, so consumption (not peeking) is the only read.
  const entryDirection = useMemo(() => consumeDeckDirection(), []);
  const animClass =
    entryDirection === "left"
      ? "deck-panel-enter-left"
      : entryDirection === "right"
        ? "deck-panel-enter-right"
        : "";

  return (
    <div
      ref={trackRef}
      className={[animClass, className].filter(Boolean).join(" ")}
      style={{ touchAction: "pan-y" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {children}
    </div>
  );
}
