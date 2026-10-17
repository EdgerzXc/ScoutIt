// ═══════════════════════════════════════════════════════════════════════
// Workspace Deck (A-205) — the swipeable dashboard navigation model.
//
// One linear deck per role. Workspace is always the default panel; Inbox is
// always one swipe away. The deck is SPATIAL, not hierarchical: neighbours
// are resolved here so every page (Workspace, Inbox, CRM, Calendar) shares
// one definition of "what is left/right of me" instead of each hardcoding
// its own back-links (which is how Inbox and CRM drifted apart before).
//
// Deck orders:
//   owner / broker : [ crm | workspace | inbox | calendar ]
//   everyone else  : [ workspace | inbox ]
//
// Swipe semantics: a finger moving LEFT reveals the panel on the RIGHT.
// So from Workspace, swipe-left → Inbox and swipe-right → CRM — the mapping
// the owner asked for. CRM/Calendar stay reachable for roles that hold them;
// buyers never see a CRM panel they cannot open.
//
// This module is deliberately UI-free and dependency-free so the contract
// test can pin it without mounting React.
// ═══════════════════════════════════════════════════════════════════════

// Panel ids. Hrefs are the real routes — swiping navigates, it never swaps
// local state, so deep links, the back button and per-page data loading keep
// working exactly as before.
export const DECK_PANELS = Object.freeze({
  workspace: { id: "workspace", href: "/dashboard", label: "Workspace" },
  crm: { id: "crm", href: "/dashboard/crm", label: "CRM" },
  inbox: { id: "inbox", href: "/dashboard/inbox", label: "Inbox" },
  calendar: { id: "calendar", href: "/dashboard/calendar", label: "Calendar" },
});

// Roles whose workspace owns a pipeline (and therefore a CRM panel).
const PIPELINE_ROLES = new Set(["owner", "broker"]);

// True when the account holds a pipeline lens. Accepts the raw
// `active_roles` array (any casing); unknown or missing roles fail closed
// to the two-panel deck rather than offering a CRM that cannot open.
export function isPipelineRole(activeRoles) {
  if (!Array.isArray(activeRoles)) return false;
  return activeRoles.some((role) => PIPELINE_ROLES.has(String(role || "").toLowerCase()));
}

export function deckOrderForRole(mode) {
  if (PIPELINE_ROLES.has(mode)) return ["crm", "workspace", "inbox", "calendar"];
  return ["workspace", "inbox"];
}

// Neighbours of one panel: { leftHref, rightHref } where "left" is the panel
// revealed by swiping LEFT (finger travels left, content follows left).
// Null at a deck end — the UI rubber-bands instead of navigating.
export function deckNeighbors(panelId, mode) {
  const order = deckOrderForRole(mode);
  const at = order.indexOf(panelId);
  if (at === -1) return { leftHref: null, rightHref: null };
  const left = at + 1 < order.length ? DECK_PANELS[order[at + 1]].href : null;
  const right = at - 1 >= 0 ? DECK_PANELS[order[at - 1]].href : null;
  return { leftHref: left, rightHref: right };
}

// ── Cross-route entry direction ─────────────────────────────────────────
// The deck is route-synced (each panel is its own page), so the arriving
// page cannot see the gesture. The leaving panel records which way the deck
// moved; the arriving panel reads and clears it to slide in from the correct
// side. Module-level on purpose: it lives exactly as long as the SPA session.
let pendingDirection = null;

export function setDeckDirection(direction) {
  pendingDirection = direction === "left" || direction === "right" ? direction : null;
}

// Consumes the pending direction exactly once — a stale direction must never
// animate a later, unrelated navigation.
export function consumeDeckDirection() {
  const direction = pendingDirection;
  pendingDirection = null;
  return direction;
}

// ── Gesture math (pure, tested) ─────────────────────────────────────────
// Intent thresholds: a deck swipe must declare itself EARLY (within the
// first millimetres of travel) or the page's vertical scroll owns the
// gesture and the content visibly drifts diagonally.
export const SWIPE_INTENT_MIN_DX = 12;
export const SWIPE_INTENT_RATIO = 1.4;
export const SWIPE_COMMIT_FRACTION = 0.25;
export const SWIPE_FLING_VELOCITY = 0.5; // px per ms
export const SWIPE_FOLLOW_MAX = 72; // px of 1:1 finger follow before clamp
export const SWIPE_RESISTANCE = 0.18; // rubber-band factor at a dead end

// "horizontal" claims the gesture, "vertical" yields to scroll, null means
// not enough travel yet to decide.
export function classifySwipeIntent(dx, dy) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (ax < SWIPE_INTENT_MIN_DX && ay < SWIPE_INTENT_MIN_DX) return null;
  if (ax > ay * SWIPE_INTENT_RATIO) return "horizontal";
  if (ay > ax * SWIPE_INTENT_RATIO) return "vertical";
  // Diagonal limbo: whoever is further along wins once past the minimum.
  if (ax >= SWIPE_INTENT_MIN_DX || ay >= SWIPE_INTENT_MIN_DX) return ax >= ay ? "horizontal" : "vertical";
  return null;
}

// Rubber-band a dead-end drag so the edge feels physical, not broken.
export function resistDeadEnd(dx) {
  return dx * SWIPE_RESISTANCE;
}

// Release decision: committed when dragged past a quarter of the panel width
// or flung fast in the swipe direction.
export function shouldCommitSwipe(dx, panelWidth, velocityX) {
  if (Math.abs(velocityX) >= SWIPE_FLING_VELOCITY) return true;
  return Math.abs(dx) >= panelWidth * SWIPE_COMMIT_FRACTION;
}

// Selectors that must NEVER start a deck swipe. Maps consume their own touch
// stream (a deck swipe over a map would fight the pan/zoom recogniser), and
// form fields need their gestures for caret/selection handling.
// `data-swipe-lock` is the escape hatch for future interactive surfaces
// (kanban drag lanes, carousels, story studio) — one attribute, zero hook edits.
export const SWIPE_LOCK_SELECTORS = [
  "canvas",
  ".maplibregl-canvas",
  ".maplibregl-map",
  "input",
  "textarea",
  "select",
  "[contenteditable]",
  "[data-swipe-lock]",
];

export function isSwipeLocked(target) {
  if (!target || typeof target.closest !== "function") return false;
  return SWIPE_LOCK_SELECTORS.some((selector) => {
    try {
      return target.closest(selector) !== null;
    } catch {
      return false;
    }
  });
}

// True when a horizontal ancestor can still consume the pan (carousels,
// chip rails, wide tables). The deck must not steal a scroll that belongs
// to inner content — that theft is the #1 cause of "swipe feels broken".
export function ancestorConsumesHorizontalPan(target, container, dx) {
  let node = target;
  while (node && node !== container && node instanceof Element) {
    const canScroll = node.scrollWidth - node.clientWidth > 8;
    if (canScroll) {
      const remaining = dx < 0
        ? node.scrollWidth - node.clientWidth - node.scrollLeft
        : node.scrollLeft;
      if (remaining > 8) return true;
    }
    node = node.parentElement;
  }
  return false;
}
