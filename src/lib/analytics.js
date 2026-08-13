"use client";

// GA4 outcome events.
//
// GA4 was already recording that people arrive (page_view, session_start) and
// nothing about whether the product works: in the 7 days to 2026-08-13, across
// ~1.15K sessions, form_start fired 2 times and click 1 time. These five events
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
  SIGNUP_COMPLETED: "signup_completed",
  PROPERTY_PUBLISHED: "property_published",
};

/**
 * Emit a GA4 event. Returns true only if it was actually handed to gtag, so
 * callers and tests can tell "sent" from "no-op" without reading globals.
 * Never throws: a broken analytics call must not break a user action.
 */
export function trackEvent(name, params = {}) {
  if (!name) return false;
  if (!process.env.NEXT_PUBLIC_GA_ID) return false;
  if (typeof window === "undefined") return false;
  if (typeof window.gtag !== "function") return false;
  try {
    window.gtag("event", name, params);
    return true;
  } catch (err) {
    // Swallow: instrumentation must never take a user flow down with it.
    return false;
  }
}
