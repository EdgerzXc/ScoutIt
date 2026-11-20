"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { COOKIE_CONSENT_KEY, getCookieConsent } from "@/lib/cookieConsent";

const AD_CONSENT = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

function GaRouteTracker({ gaId }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || getCookieConsent() !== "granted" || typeof window.gtag !== "function") return;
    const pagePath = pathname.replace(/^\/(claim|wishlist\/shared)\/.*$/, "/$1");
    window.gtag("config", gaId, {
      page_path: pagePath,
      page_location: window.location.origin + pagePath,
    });
  }, [pathname, gaId]);

  return null;
}

export default function GoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const [enabled, setEnabled] = useState(false);
  const previousConsent = useRef(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!gaId) return;

    function syncConsent() {
      const granted = getCookieConsent() === "granted";
      if (previousConsent.current === granted) return;
      previousConsent.current = granted;
      window[`ga-disable-${gaId}`] = !granted;

      if (granted && !initialized.current) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
        window.gtag("consent", "default", { ...AD_CONSENT, analytics_storage: "denied" });
        window.gtag("js", new Date());
        initialized.current = true;
      }
      if (initialized.current) {
        window.gtag("consent", "update", { ...AD_CONSENT, analytics_storage: granted ? "granted" : "denied" });
      }
      setEnabled(granted);
    }

    const handleStorage = (event) => {
      if (event.key === COOKIE_CONSENT_KEY || event.key === null) syncConsent();
    };
    window.addEventListener("scoutit:cookie-consent-chosen", syncConsent);
    window.addEventListener("storage", handleStorage);
    syncConsent();
    return () => {
      window.removeEventListener("scoutit:cookie-consent-chosen", syncConsent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [gaId]);

  if (!gaId || !enabled) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
      />
      <Suspense fallback={null}>
        <GaRouteTracker gaId={gaId} />
      </Suspense>
    </>
  );
}
