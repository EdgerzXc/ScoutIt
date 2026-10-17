"use client";

import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  classifySwipeIntent,
  shouldCommitSwipe,
  isSwipeLocked,
  ancestorConsumesHorizontalPan,
  resistDeadEnd,
  setDeckDirection,
  SWIPE_FOLLOW_MAX,
} from "@/lib/workspaceDeck";
import { getStoredLiteMode } from "@/lib/liteMode";

// useSwipeDeck — 1:1 finger-follow deck navigation for touch screens.
//
// Route-synced by design: on a committed swipe it records the direction and
// router.push()es the neighbouring panel, so every existing data boundary,
// auth guard and deep link keeps working. The arriving panel slides in from
// the correct side by consuming the recorded direction (see DeckPanel).
//
// Motion contract (motionmaxxing: physical, interruptible, honest):
// - Content follows the finger 1:1 up to SWIPE_FOLLOW_MAX, then clamps —
//   without a neighbour preview, large travel would look broken.
// - Dead ends rubber-band (resistDeadEnd) and spring back; they never navigate.
// - Release commits on distance (¼ panel) OR fling velocity, never on hope.
// - No preventDefault: vertical scroll is never stolen. Intent must declare
//   horizontal early or the gesture belongs to the page.
// - Lite Mode / prefers-reduced-motion: navigation still works, all transform
//   tracking and entry animation are skipped.
export default function useSwipeDeck({ leftHref, rightHref }) {
  const router = useRouter();
  const trackRef = useRef(null);
  const gestureRef = useRef(null);

  const reducedMotion = useCallback(() => {
    if (typeof window === "undefined") return false;
    try {
      if (getStoredLiteMode()) return true;
    } catch {
      /* lite-mode read is best-effort */
    }
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const applyOffset = useCallback((dx) => {
    const node = trackRef.current;
    if (!node) return;
    node.style.transition = "none";
    node.style.transform = dx === 0 ? "" : `translate3d(${dx}px, 0, 0)`;
  }, []);

  const snapBack = useCallback(() => {
    const node = trackRef.current;
    if (!node) return;
    node.style.transition = "transform 180ms ease-out";
    node.style.transform = "";
  }, []);

  const go = useCallback(
    (direction, href) => {
      if (!href) {
        snapBack();
        return;
      }
      setDeckDirection(direction);
      router.push(href);
    },
    [router, snapBack],
  );

  const onTouchStart = useCallback(
    (event) => {
      if (event.touches.length !== 1) {
        gestureRef.current = null;
        return;
      }
      const touch = event.touches[0];
      gestureRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        intent: null,
        claimed: false,
        targetHref: null,
        lastX: touch.clientX,
        lastTime: event.timeStamp,
        velocityX: 0,
      };
    },
    [],
  );

  const onTouchMove = useCallback(
    (event) => {
      const gesture = gestureRef.current;
      if (!gesture || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;

      if (!gesture.intent) {
        gesture.intent = classifySwipeIntent(dx, dy);
        if (gesture.intent !== "horizontal") return;
        // Claim checks run ONCE, at intent time — never mid-drag, so the
        // decision cannot flip halfway through a gesture.
        const origin = event.target;
        if (isSwipeLocked(origin)) {
          gesture.intent = "vertical";
          return;
        }
        if (ancestorConsumesHorizontalPan(origin, trackRef.current, dx)) {
          gesture.intent = "vertical";
          return;
        }
        gesture.claimed = true;
      }
      if (!gesture.claimed) return;

      const direction = dx < 0 ? "left" : "right";
      const targetHref = direction === "left" ? leftHref : rightHref;
      gesture.targetHref = targetHref;

      // Velocity over the trailing segment, for fling detection.
      const dt = Math.max(1, event.timeStamp - gesture.lastTime);
      gesture.velocityX = (touch.clientX - gesture.lastX) / dt;
      gesture.lastX = touch.clientX;
      gesture.lastTime = event.timeStamp;

      if (reducedMotion()) return;
      const follow = targetHref
        ? Math.max(-SWIPE_FOLLOW_MAX, Math.min(SWIPE_FOLLOW_MAX, dx))
        : resistDeadEnd(dx);
      applyOffset(follow);
    },
    [leftHref, rightHref, applyOffset, reducedMotion],
  );

  const onTouchEnd = useCallback(() => {
    const gesture = gestureRef.current;
    gestureRef.current = null;
    if (!gesture || !gesture.claimed) return;
    const node = trackRef.current;
    const panelWidth = node ? node.clientWidth || window.innerWidth : window.innerWidth;
    const dx = gesture.lastX - gesture.startX;
    if (dx === 0) {
      snapBack();
      return;
    }
    const direction = dx < 0 ? "left" : "right";
    const targetHref = direction === "left" ? leftHref : rightHref;
    if (targetHref && shouldCommitSwipe(dx, panelWidth, gesture.velocityX)) {
      go(direction, targetHref);
    } else {
      snapBack();
    }
  }, [leftHref, rightHref, go, snapBack]);

  return { trackRef, onTouchStart, onTouchMove, onTouchEnd };
}
