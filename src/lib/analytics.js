"use client";

// GA4 outcome events.
//
// GA4 was already recording that people arrive (page_view, session_start) and
// nothing about whether the product works: in the 7 days to 2026-08-13, across
// ~1.15K sessions, form_start fired 2 times and click 1 time. These six events
// are the outcomes worth counting.
//
// Guard, deliberately identical to src/components/analytics/GoogleAnalytics.js
// (§25.5): with NEXT_PUBLIC_GA_ID unset, GoogleAnalytics renders nothing, no
// gtag ever exists, and every call here is a silent no-op. Nothing in this file
// invents a measurement id or falls back to a default — analytics that are
// confidently wrong are worse than analytics that are visibly absent.
//
// Emitting an event is all code can do. Promoting these to *key events* is a
// Google Analytics dashboard action (Admin -> Events -> Mark as key event) and
// is an owner task.

export const GA_EVENTS = {
  BOARD_SAVE: "board_save",
  INQUIRY_SENT: "inquiry_sent",
  CONNECT_SPENT: "connect_spent",
  // A-144 §16: distinguish spend from outcome. Spend is money; accept/decline/
  // block is marketplace quality. Never conflate them in dashboards.
  CONNECT_ACCEPTED: "connect_accepted",
  CONNECT_DECLINED: "connect_declined",
  CONNECT_BLOCKED: "connect_blocked",
  ENTERPRISE_INQUIRY_SUBMITTED: "enterprise_inquiry_submitted",
  IDENTITY_REVEALED: "identity_revealed",
  SIGNUP_COMPLETED: "signup_completed",
  PROPERTY_PUBLISHED: "property_published",
  // A-146 (H batch, measurement before human testing). Blind spots the deep
  // dive found: reaction taps, appeal submits, inquiry starts, onboarding
  // step drops, and display-mode switches emitted nothing. Appended below the
  // A-144 block without touching it.
  REACTION_TAPPED: "reaction_tapped",
  APPEAL_SUBMITTED: "appeal_submitted",
  INQUIRY_STARTED: "inquiry_started",
  ONBOARDING_STEP: "onboarding_step",
  DISPLAY_MODE_SWITCHED: "display_mode_switched",
  // Fired when a share actually LEAVES the app — the clipboard write resolved,
  // the OS share sheet resolved, or the platform window was opened. Never on
  // the mere click of a Share button, matching the outcomes-not-intent
  // convention above. Params: { channel, property_slug, ref }.
  SHARE_COMPLETED: "share_completed",
};

const EVENT_PARAM_ALLOWLIST = {
  [GA_EVENTS.BOARD_SAVE]: new Set(["property_id", "signed_in"]),
  [GA_EVENTS.INQUIRY_SENT]: new Set(["channel", "property_slug", "connects_spent", "routed_to", "source_context"]),
  [GA_EVENTS.CONNECT_SPENT]: new Set(["spend_reason", "property_id", "role", "tier", "amount", "source_context", "identity_mode"]),
  [GA_EVENTS.CONNECT_ACCEPTED]: new Set(["property_id", "source_context"]),
  [GA_EVENTS.CONNECT_DECLINED]: new Set(["property_id", "source_context"]),
  [GA_EVENTS.CONNECT_BLOCKED]: new Set(["property_id", "source_context"]),
  [GA_EVENTS.ENTERPRISE_INQUIRY_SUBMITTED]: new Set(["property_id", "form_id", "source_context"]),
  [GA_EVENTS.IDENTITY_REVEALED]: new Set(["reveal_type"]),
  [GA_EVENTS.SIGNUP_COMPLETED]: new Set(["role", "opened_owner_wizard"]),
  [GA_EVENTS.PROPERTY_PUBLISHED]: new Set(["property_id", "with_declaration"]),
  [GA_EVENTS.SHARE_COMPLETED]: new Set(["channel", "property_slug", "ref"]),
  [GA_EVENTS.REACTION_TAPPED]: new Set(["property_id"]),
  [GA_EVENTS.APPEAL_SUBMITTED]: new Set(["evidence_id"]),
  [GA_EVENTS.INQUIRY_STARTED]: new Set(["property_slug"]),
  [GA_EVENTS.ONBOARDING_STEP]: new Set(["step"]),
  [GA_EVENTS.DISPLAY_MODE_SWITCHED]: new Set(["axis", "mode"]),
};

const SAFE_TOKEN = /^[a-z0-9][a-z0-9_-]{0,99}$/i;
const SAFE_PROPERTY_ID = /^[a-z0-9][a-z0-9_-]{0,99}$/i;

function safeScalar(key, value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string" || value.length === 0 || value.length > 100) return undefined;
  if (/https?:\/\/|www\.|[?&][^\s=]+=|%3f|%26/i.test(value)) return undefined;
  if (key === "property_id" || key === "property_slug") return SAFE_PROPERTY_ID.test(value) ? value : undefined;
  // A uuid trips the phone-number heuristic below (digits split by dashes),
  // so evidence ids are validated as uuids before that check can see them.
  if (key === "evidence_id") {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
      ? value
      : undefined;
  }
  if (/@|(?:\+?\d[\s().-]*){7,}/.test(value)) return undefined;
  return SAFE_TOKEN.test(value) ? value : undefined;
}

export function sanitizeAnalyticsParams(eventName, params = {}) {
  const allowed = EVENT_PARAM_ALLOWLIST[eventName];
  if (!allowed || !params || typeof params !== "object" || Array.isArray(params)) return {};
  const clean = {};
  for (const [key, value] of Object.entries(params)) {
    if (!allowed.has(key)) continue;
    const sanitized = safeScalar(key, value);
    if (sanitized !== undefined) clean[key] = sanitized;
  }
  return clean;
}
/**
 * Emit a GA4 event. Returns true only if it was actually handed to gtag, so
 * callers and tests can tell "sent" from "no-op" without reading globals.
 * Never throws: a broken analytics call must not break a user action.
 */
export function trackEvent(name, params = {}) {
  if (!EVENT_PARAM_ALLOWLIST[name]) return false;
  if (!process.env.NEXT_PUBLIC_GA_ID) return false;
  if (typeof window === "undefined") return false;
  if (typeof window.gtag !== "function") return false;
  try {
    const sanitized = sanitizeAnalyticsParams(name, params);
    window.gtag("event", name, sanitized);
    return true;
  } catch (err) {
    // Swallow: instrumentation must never take a user flow down with it.
    return false;
  }
}
