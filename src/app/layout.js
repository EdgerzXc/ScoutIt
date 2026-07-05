import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import BottomNav from "@/components/layout/BottomNav";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import DynamicOverlays from "@/components/layout/DynamicOverlays";

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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://scoutit.vercel.app"
  ),
  title: {
    default: "ScoutIt — Space Intelligence",
    template: "%s · ScoutIt",
  },
  description:
    "ScoutIt transforms Philippine real estate into intelligent property briefings. Scout smarter, move faster.",
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
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0e0e0e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Lite Mode no-flash: apply the class before paint so low-end phones
            never render the heavy cosmic layers. Defaults on for users who ask
            for reduced motion; otherwise reads the stored preference. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var v=localStorage.getItem('scoutit_lite_mode');var on=(v===null)?window.matchMedia('(prefers-reduced-motion: reduce)').matches:(v==='1');if(on)document.documentElement.classList.add('lite-mode');}catch(e){}})();",
          }}
        />
        <div className="atmosphere-bg">
          <div className="atmosphere-glow" aria-hidden="true" />
          <div className="atmosphere-grain" aria-hidden="true" />
          <div className="atmosphere-vignette" aria-hidden="true" />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <BottomNav />
          <DynamicOverlays />
        </div>
      </body>
    </html>
  );
}
