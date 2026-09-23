"use client";

import { useEffect } from "react";
import { getFocusableElements, trapTabKey } from "./modalDialog";

// A-153 — one hook for every modal dialog: Tab stays inside, Escape
// dismisses, focus enters on open and returns on close.
//
// - active: whether the dialog is currently shown.
// - onClose: the same close the X button calls — Escape must never do less
//   (or more) than the visible control.
// - initialFocusRef (optional): focus this instead of the first control
//   (e.g. a modal whose first control is a destructive action).
export function useModalDialog(
  containerRef,
  { active, onClose, initialFocusRef = null },
) {
  useEffect(() => {
    if (!active) return;
    const node = containerRef?.current;
    if (!node || typeof document === "undefined") return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Move focus inside on open: the named control, else the first
    // focusable, else the container itself (made focusable silently).
    const target =
      initialFocusRef?.current ||
      getFocusableElements(node)[0] ||
      null;
    if (target) {
      target.focus?.();
    } else {
      if (!node.hasAttribute("tabindex")) node.setAttribute("tabindex", "-1");
      node.focus?.();
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }
      trapTabKey(event, node);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Hand focus back where it was — a dialog that strands focus in the
      // void breaks keyboard users on every open.
      previouslyFocused?.focus?.();
    };
  }, [active, containerRef, onClose, initialFocusRef]);
}

export default useModalDialog;
