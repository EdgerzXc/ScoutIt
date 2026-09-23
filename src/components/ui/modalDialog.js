// A-153 — shared dialog keyboard helpers. Pure DOM, no React, so the trap
// itself is unit-testable in jsdom without rendering a component.
//
// Scope note: queries run WITHIN the dialog container, so background content
// can never be reached by construction — the trap only has to wrap the
// dialog's own edges.

export const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== "function") return [];
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((el) => {
    if (el.hasAttribute("hidden")) return false;
    if (el.getAttribute("aria-hidden") === "true") return false;
    if (el.tagName === "INPUT" && el.type === "hidden") return false;
    return true;
  });
}

/**
 * Wrap Tab around the dialog's edges. Returns true when the key was handled
 * (caller must preventDefault — done here via event.preventDefault()).
 * Anything that is not a boundary Tab returns false and is left alone.
 */
export function trapTabKey(event, container) {
  if (!event || event.key !== "Tab") return false;
  const items = getFocusableElements(container);
  if (items.length === 0) {
    event.preventDefault?.();
    return true;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = event.target || document.activeElement;
  if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault?.();
    first.focus?.();
    return true;
  }
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault?.();
    last.focus?.();
    return true;
  }
  return false;
}
