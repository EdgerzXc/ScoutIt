/**
 * mobileBackStack.js — Mobile Hardware & Gesture Back Button Undo Coordinator
 *
 * Solves the critical mobile PWA problem:
 * When users press the physical Android back button or perform an edge-swipe back,
 * browsers normally pop the entire route back to "/" (Home), destroying active drafts,
 * wizard steps, previews, and open drawers.
 *
 * This coordinator maintains a reversible action stack backed by synthetic history states:
 * - Entering Wizard -> pushes state
 * - Advancing Wizard Step -> pushes state
 * - Switching to Preview -> pushes state
 * - Opening Quick Settings / Command Drawer -> pushes state
 * - Opening Role Switcher Sheet / Modals -> pushes state
 *
 * When the mobile back button is pressed, the latest action is undone in reverse order
 * without kicking the user out of the dashboard or destroying their inputs.
 */

let backStack = [];
let isPopProcessing = false;
let isProgrammaticRevert = false;

function ensurePopstateListener() {
  if (typeof window === "undefined" || window.__scoutitBackListenerAttached) return;
  window.__scoutitBackListenerAttached = true;

  window.addEventListener("popstate", (e) => {
    if (isProgrammaticRevert) {
      isProgrammaticRevert = false;
      return;
    }

    if (backStack.length > 0) {
      const entry = backStack.pop();
      isPopProcessing = true;
      try {
        if (typeof entry.onBack === "function") {
          entry.onBack();
        }
      } catch (err) {
        console.error("[mobileBackStack] Error executing back handler:", err);
      } finally {
        isPopProcessing = false;
      }
    }
  });
}

/**
 * Register a reversible user action on the mobile back stack.
 *
 * @param {Function} onBack Callback executed when user presses the back button to undo this action.
 * @param {Object} metadata Optional descriptive action metadata (e.g. { action: "preview", step: 2 }).
 * @returns {Function} Cleanup function to call when the action is completed/dismissed via in-app UI.
 */
export function registerMobileBackAction(onBack, metadata = {}) {
  if (typeof window === "undefined") {
    return () => {};
  }

  ensurePopstateListener();

  const id = Math.random().toString(36).slice(2, 9);
  const entry = { id, onBack, metadata };
  backStack.push(entry);

  try {
    window.history.pushState(
      { scoutitBackId: id, action: metadata.action || "sub_action" },
      ""
    );
  } catch (err) {
    // Gracefully handle sandboxed iframes or history quota limits
  }

  // Cleanup handler when the UI dismisses this state normally
  return () => {
    const idx = backStack.findIndex((item) => item.id === id);
    if (idx !== -1) {
      backStack.splice(idx, 1);
      // If the browser history state is currently pointing to this entry and we're not inside a popstate,
      // pop it so the browser history doesn't retain dead synthetic steps.
      if (!isPopProcessing && window.history?.state?.scoutitBackId === id) {
        isProgrammaticRevert = true;
        try {
          window.history.back();
        } catch {
          isProgrammaticRevert = false;
        }
      }
    }
  };
}

/**
 * Helper to programmatically trigger the latest mobile back action (e.g. for an in-app "← Back" button).
 * If a reversible action exists on the stack, it uses window.history.back() to pop the synthetic state
 * and trigger the registered onBack handler.
 */
export function triggerMobileBack() {
  if (typeof window === "undefined") return false;
  if (backStack.length > 0) {
    window.history.back();
    return true;
  }
  return false;
}

/**
 * Inspect the current depth of reversible mobile actions.
 */
export function getMobileBackStackDepth() {
  return backStack.length;
}

/**
 * Reset back stack (useful for testing and major route transitions).
 */
export function resetMobileBackStack() {
  backStack = [];
  isPopProcessing = false;
  isProgrammaticRevert = false;
}
