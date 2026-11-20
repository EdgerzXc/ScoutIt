"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  COOKIE_CONSENT_DENIED,
  COOKIE_CONSENT_GRANTED,
  COOKIE_CONSENT_KEY,
  getCookieConsent,
  setCookieConsent,
} from "@/lib/cookieConsent";

const CONSENT_CHOSEN_EVENT = "scoutit:cookie-consent-chosen";

function saveChoice(value) {
  setCookieConsent(value);
  window.dispatchEvent(new Event(CONSENT_CHOSEN_EVENT));
}

export function CookieSettings() {
  const dialog = useRef(null);
  const dialogId = useId();
  const headingId = useId();
  const descriptionId = useId();
  const [choice, setChoice] = useState(COOKIE_CONSENT_DENIED);

  if (!process.env.NEXT_PUBLIC_GA_ID) return null;

  function openSettings(event) {
    setChoice(getCookieConsent());
    event.currentTarget.focus();
    dialog.current.showModal();
  }

  function applyChoice(event) {
    const { returnValue } = event.currentTarget;
    event.currentTarget.returnValue = "";
    if (returnValue === COOKIE_CONSENT_GRANTED || returnValue === COOKIE_CONSENT_DENIED) {
      saveChoice(returnValue);
    }
  }

  return (
    <>
      <button type="button" className="cookie-settings-trigger" aria-haspopup="dialog" aria-controls={dialogId} onClick={openSettings}>
        Cookie settings
      </button>
      <dialog
        ref={dialog}
        id={dialogId}
        className="cookie-settings-panel"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        onClose={applyChoice}
      >
        <h2 id={headingId}>Cookie settings</h2>
        <p id={descriptionId}>
          Google Analytics is {choice === COOKIE_CONSENT_GRANTED ? "on" : "off"} on this browser.
          Turning it off stops ScoutIt sending future visits to Google Analytics.
        </p>
        <form method="dialog" className="cookie-settings-actions">
          <button type="submit" value={COOKIE_CONSENT_DENIED}>Turn off Analytics</button>
          <button type="submit" value={COOKIE_CONSENT_GRANTED}>Allow Analytics</button>
          <button type="submit" value="" autoFocus>Cancel</button>
        </form>
      </dialog>
    </>
  );
}

export default function CookieConsent() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!gaId) return;
    // No stored choice yet — but only ask once the key is truly absent, so a
    // stored denial never re-prompts.
    try {
      if (localStorage.getItem(COOKIE_CONSENT_KEY) === null) setVisible(true);
    } catch {
      setVisible(true);
    }
    const hideBanner = () => setVisible(false);
    const syncChoice = (event) => {
      if (event.key === COOKIE_CONSENT_KEY && event.newValue) hideBanner();
    };
    window.addEventListener(CONSENT_CHOSEN_EVENT, hideBanner);
    window.addEventListener("storage", syncChoice);
    return () => {
      window.removeEventListener(CONSENT_CHOSEN_EVENT, hideBanner);
      window.removeEventListener("storage", syncChoice);
    };
  }, [gaId]);

  if (!gaId || !visible) return null;

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
        background: "var(--surface)",
        border: "1px solid var(--border-solid, var(--accent-muted))",
        borderRadius: 8,
        padding: "16px 18px",
        boxShadow: "0 18px 50px rgba(var(--bg-rgb),0.6)",
      }}
    >
      <p
        style={{
          margin: "0 0 4px",
          fontFamily: "var(--font-mono, monospace)",
          fontSize: 12,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--accent)",
        }}
      >
        Cookies
      </p>
      <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.6, color: "var(--text-secondary)" }}>
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
          onClick={() => saveChoice(COOKIE_CONSENT_DENIED)}
          style={{
            flex: 1,
            background: "transparent",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
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
          onClick={() => saveChoice(COOKIE_CONSENT_GRANTED)}
          style={{
            flex: 1,
            background: "var(--accent-fill, var(--accent))",
            border: "none",
            color: "var(--on-accent)",
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
