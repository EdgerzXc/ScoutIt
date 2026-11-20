import path from "node:path";
import { fileURLToPath } from "node:url";
import { consoleContentSecurityPolicy } from "./src/lib/contentSecurityPolicy.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This repository intentionally contains two lockfiles because Mission
  // Control is a separate deployable app. Pin its Turbopack boundary so Next
  // does not infer the parent ScoutIt app as its workspace root.
  turbopack: {
    root: path.dirname(fileURLToPath(import.meta.url)),
  },
  productionBrowserSourceMaps: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
        { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
        { key: "Pragma", value: "no-cache" },
        { key: "Expires", value: "0" },
        { key: "Permissions-Policy", value: "display-capture=(), camera=(), microphone=(), geolocation=(), usb=(), browsing-topics=()" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: consoleContentSecurityPolicy() },
        // The main app already sent this; the console did not.
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }];
  },
};

export default nextConfig;
