import { Geist, Geist_Mono } from "next/font/google";
import { connection } from "next/server";
import { useConsoleScriptNonce } from "@/lib/contentSecurityPolicy.mjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "ScoutIt Mission Control",
  description: "Private ScoutIt operations workspace",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

export default async function RootLayout({ children }) {
  if (useConsoleScriptNonce) await connection();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
