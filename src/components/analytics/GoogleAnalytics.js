"use client";

import Script from "next/script";

export default function GoogleAnalytics() {
  // Env only — no hardcoded fallback (§25.5).
  //
  // GA measurement ids are public, so the old hardcoded `G-36WQZF409S` leaked
  // nothing. The problem was silent misattribution: with the env var unset,
  // every environment — local dev, preview deploys, production — quietly
  // reported into that one property. Analytics that are confidently wrong are
  // worse than analytics that are visibly absent, because nobody goes looking.
  //
  // The `if (!gaId)` guard below was already correct; the fallback made it
  // unreachable.
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  if (!gaId) return null;

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
