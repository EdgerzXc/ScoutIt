"use client";

import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  getCookieConsent,
  setCookieConsent,
} from "@/lib/cookieConsent";

// A-151 — dark-luxury, non-intrusive cookie consent for Google Consent Mode
// v2. Silent by design when GA4 is not configured (no GA ID → nothing to
// consent to, so no banner). Google Analytics itself boots default-denied
// (see GoogleAnalytics.js); this banner is the only path to granted.

function pushConsentUpdate(granted) {
  try {
    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      function gtag() {
        window.dataLayer.push(arguments);
      };
    window.gtag("consent", "update", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: granted ? "granted" : "denied",
    });
  } catch {
    // Consent state is persisted regardless; the update replays on next load.
  }
}

export default function CookieConsent() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    // A previous grant must reach gtag even though GA boots denied-first.
    if (getCookieConsent() === "granted") {
      pushConsentUpdate(true);
      return;
    }
    // No stored choice yet — but only ask once the key is truly absent, so a
    // stored denial never re-prompts.
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) === null) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [gaId]);

  if (!gaId || !visible) return null;

  const choose = (granted) => {
    setCookieConsent(granted ? "granted" : "denied");
    pushConsentUpdate(granted);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="cookie-lens"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: "calc(var(--mobile-nav-height, 0px) + env(safe-area-inset-bottom, 0px) + 16px)",
        zIndex: 9500,
        maxWidth: 520,
        margin: "0 auto",
        background: "#0d0d0d",
        border: "1px solid var(--accent-muted, #6E531A)",
        borderRadius: 8,
        padding: "16px 18px",
        boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent, var(--accent))",
        }}
      >
        Cookies
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.6, color: "#c8c8c8" }}>
        ScoutIt keeps a device identifier on this browser and, when enabled,
        measures visits with Google Analytics. Details in our{" "}
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent)", textDecoration: "underline" }}
        >
          Privacy Policy
        </a>
        .
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button
          type="button"
          onClick={() => choose(false)}
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid #3a3a3a",
            color: "#c8c8c8",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 12,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.06em",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          DECLINE
        </button>
        <button
          type="button"
          onClick={() => choose(true)}
          style={{
            flex: 1,
            background: "var(--accent, var(--accent))",
            border: "none",
            color: "#0d0d0d",
            borderRadius: 6,
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.06em",
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          ACCEPT
        </button>
      </div>
    </div>
  );
}
