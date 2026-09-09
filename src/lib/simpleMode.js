// ═══════════════════════════════════════════════════════════════
// SIMPLE MODE — PHASE 0: the switch and the transform
// A-083 · specification: _SCOUTIT_BRAIN/.../A-083_SIMPLE_MODE.md
//
// Simple is the same product with fewer words. Same layout, same components,
// same 95/5 dark and gold — a reading level, not a second skin and not a
// reduced feature set.
//
// ── THE TWO HARD RULES THIS FILE ENFORCES ────────────────────────────
//
// RULE A — Pro is frozen. Nothing here can remove anything from Pro. Every
//   function below is a no-op unless Simple is actually on.
//
// RULE B — Simple is DERIVED, never authored. There is no file of Simple
//   strings and no component branches on mode to render different words.
//   Simple only ever *omits* Pro's own structure; it never writes its own.
//
// ── THE ALLOWLIST, AND WHY IT IS AN ALLOWLIST ────────────────────────
// Exactly two roles are removable: `description` and `detail`. Everything
// else in the entire product is untouched automatically, because it was never
// on the list — provenance labels, suppression notices, verification
// qualifiers, consent text, legal copy, empty states, entitlement boundaries,
// every label, every value, every number.
//
// The polarity is the whole safety argument. A denylist ("mark what Simple
// must keep") fails the day someone forgets a mark, and what it loses is a
// disclosure — a trust incident. An allowlist ("mark what Simple may drop")
// fails the day someone forgets a mark, and what it loses is a few extra
// words in Simple mode — a slightly wordy screen.
//
// So the default is SHOW. An element nobody has classified renders in full,
// in both modes, forever. That is the fail-open property, and `shouldRender`
// is written so that the only way to hide something is to name it explicitly.
//
// SSR-safe: every reader guards `typeof document`, exactly like liteMode.js.
// The no-flash class is applied by an inline <head> script in layout.js.
// ═══════════════════════════════════════════════════════════════

export const SIMPLE_MODE_KEY = "scoutit_simple_mode";
export const SIMPLE_MODE_EVENT = "scoutit:simplemode";
export const SIMPLE_MODE_CLASS = "simple-mode";

/**
 * The complete set of roles Simple may remove. Frozen, and asserted by test 2.
 *
 * `description` — explanatory prose attached to a named thing: a chapter
 *   subtitle, helper text under a control, the sentence beneath a metric.
 *   Not rendered in Simple.
 *
 * `detail` — a whole secondary block: a chapter, a panel, a sidebar group.
 *   Collapsed behind one honest expander in Simple, never deleted, so
 *   nothing hidden is unreachable.
 */
export const REMOVABLE_ROLES = Object.freeze(["description", "detail"]);

/** How a removable role behaves when Simple is on. */
export const ROLE_BEHAVIOUR = Object.freeze({
  description: "omit",
  detail: "collapse",
});

/** True if Simple mode is currently active. */
export function isSimpleMode() {
  if (typeof document !== "undefined") {
    return document.documentElement.classList.contains(SIMPLE_MODE_CLASS);
  }
  return false;
}

/** Read the stored preference only (ignores the live DOM class). SSR-safe. */
export function getStoredSimpleMode() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIMPLE_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Turn Simple on/off: persist, toggle the class, notify live components. */
export function setSimpleMode(on) {
  if (typeof document === "undefined") return;
  try {
    localStorage.setItem(SIMPLE_MODE_KEY, on ? "1" : "0");
  } catch {}
  document.documentElement.classList.toggle(SIMPLE_MODE_CLASS, !!on);
  window.dispatchEvent(new CustomEvent(SIMPLE_MODE_EVENT, { detail: { on: !!on } }));
}

/** Is this role one Simple is allowed to remove at all? */
export function isRemovableRole(role) {
  return REMOVABLE_ROLES.includes(role);
}

/**
 * THE TRANSFORM. Should an element render right now?
 *
 * This is the fail-open default, and it is written to make hiding the
 * explicit case rather than the implicit one:
 *
 *   · Pro (simple === false) always renders everything. Rule A.
 *   · An element with no role renders. An element with an unrecognised role
 *     renders. `undefined`, `null`, `""`, a typo, a role someone invents in
 *     2027 — all render.
 *   · Only `description` is omitted, and only when Simple is on.
 *   · `detail` still renders: it is COLLAPSED, not removed, so it needs to be
 *     in the tree behind its expander. `simpleCollapsed()` answers that.
 *
 * @param {{role?: string, simple?: boolean}} options
 * @returns {boolean}
 */
export function shouldRender({ role, simple = isSimpleMode() } = {}) {
  if (!simple) return true;
  return ROLE_BEHAVIOUR[role] !== "omit";
}

/**
 * Should this element start collapsed behind an expander?
 *
 * Only `detail`, only in Simple. Everything hidden this way must have a
 * visible control that reveals it — acceptance test 5 — which is why this is
 * separate from `shouldRender` rather than folded into it.
 */
export function simpleCollapsed({ role, simple = isSimpleMode() } = {}) {
  if (!simple) return false;
  return ROLE_BEHAVIOUR[role] === "collapse";
}

/**
 * Derive a role from structures that already exist, per specification §3
 * Layer 3. Nothing here invents metadata; it reads what the codebase already
 * declares.
 *
 *   · a subtitle or helper string attached to a named element -> description
 *   · already `defaultCollapsed`, or gated above the base tier   -> detail
 *   · everything else, and anything ambiguous                     -> core
 *
 * Returns `undefined` for core, so an unclassified element flows through
 * `shouldRender` on the fail-open path rather than a special case.
 *
 * @param {{isSubtitle?: boolean, isHelperText?: boolean,
 *          defaultCollapsed?: boolean, aboveBaseTier?: boolean,
 *          role?: string}} element
 */
export function deriveRole(element = {}) {
  // An explicit tag always wins, but only if it is one of the two. A typo or
  // an invented role falls through to core rather than removing anything.
  if (isRemovableRole(element.role)) return element.role;
  if (element.isSubtitle || element.isHelperText) return "description";
  if (element.defaultCollapsed || element.aboveBaseTier) return "detail";
  return undefined;
}
