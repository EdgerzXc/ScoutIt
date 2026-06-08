import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0e0e0e",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {/* Cinematic film grain texture overlay */}
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
