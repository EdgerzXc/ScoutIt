import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";
import dynamic from "next/dynamic";
import BottomNav from "@/components/layout/BottomNav";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import DynamicOverlays from "@/components/layout/DynamicOverlays";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import JsonLd from "@/components/seo/JsonLd";
import DeviceTracker from "@/components/layout/DeviceTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  // Pin all absolute URLs (OG tags, canonical, etc.) to the production domain.
  // Without this, Next.js falls back to VERCEL_URL which is the per-commit
  // preview URL (e.g. scoutit-nyjlszg3k-…vercel.app) — not publicly accessible.
  //
  // This MUST come from SITE_URL. It previously had its own fallback chain
  // ending in "https://scoutit.vercel.app" — a different host from siteUrl.js's
  // "https://scout-it.vercel.app" (note the hyphen). With NEXT_PUBLIC_SITE_URL
  // unset in production the two disagreed, so every page emitted a canonical on
  // one domain and og:url on another. siteUrl.js is the single source of truth.
  metadataBase: new URL(SITE_URL),
  // ⚠️ SEO TITLE, not brand language. Changed 2026-08-08.
  //
  // "Space Intelligence" stays everywhere in the copy — it is the brand. But as
  // a TITLE it competes with aerospace, satellite and geospatial companies that
  // own the phrase, and "ScoutIt" alone is contested by a longer-established
  // Scoutit in India, an EV-battery ScoutIt, and older Scout/ScoutIt entities.
  //
  // "Property & Space Intelligence Philippines" disambiguates on both axes at
  // once. "Philippines" is doing more work here than "ScoutIt" is: it separates
  // this entity from India, from the battery, and from outer space in one word.
  title: {
    default: "ScoutIt — Property & Space Intelligence Philippines",
    template: "%s · ScoutIt",
  },
  description:
    "Property and space intelligence platform for the Philippines. ScoutIt decodes homes, offices, venues, and commercial spaces into clear, structured facts and spatial signals.",
  keywords: [
    "real estate",
    "Philippines",
    "property",
    "space intelligence",
    "ScoutIt",
  ],
  authors: [{ name: "ScoutIt" }],
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "ScoutIt",
  },
  twitter: {
    card: "summary_large_image",
    title: "ScoutIt — Property & Space Intelligence Philippines",
    description: "Property and space intelligence platform for the Philippines. ScoutIt decodes homes, offices, venues, and commercial spaces into clear, structured facts and spatial signals.",
  },

  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e0e0e",
};

export default function RootLayout({ children }) {
  return (
    // The no-flash scripts below add `lite-mode` / `interactive-mode` /
    // `simple-mode` to documentElement.classList before React hydrates, so the
    // client <html> legitimately differs from the server's. This suppresses the
    // warning for THIS element's attributes only.
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Lite Mode no-flash: apply the class before paint so low-end phones
            never render the heavy cosmic layers. Defaults on for users who ask
            for reduced motion; otherwise reads the stored preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var v=localStorage.getItem('scoutit_lite_mode');var on;if(v===null){var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var mem=navigator.deviceMemory||8;var cores=navigator.hardwareConcurrency||8;var conn=(navigator.connection||{}).effectiveType||'4g';var weakPhone=window.matchMedia('(pointer: coarse)').matches&&(mem<=4||cores<=4||conn==='2g'||conn==='slow-2g'||conn==='3g');on=reduced||weakPhone;}else{on=(v==='1');}if(on)document.documentElement.classList.add('lite-mode');}catch(e){}})();",
          }}
        />

        {/* A-083 phase 0. Simple Mode's no-flash class, beside Lite's and for
            the same reason: reloading in Simple must never paint Pro first.
            Unlike Lite there is NO device heuristic and no reduced-motion
            inference — Simple is a reading preference, so it is off unless the
            person turned it on. A user who never opens the toggle sees today's
            product, unchanged, forever. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('scoutit_simple_mode')==='1')document.documentElement.classList.add('simple-mode');}catch(e){}})();",
          }}
        />
      </head>
      <body>
        <GoogleAnalytics />
        <JsonLd />
        <DeviceTracker />
        {/* Cinematic film grain texture overlay */}
        <div className="grain" aria-hidden="true" />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <BottomNav />
        <DynamicOverlays />
        <SpeedInsights />
      </body>
    </html>
  );
}

