import path from "node:path";
import { fileURLToPath } from "node:url";

// ── A-071: the console had effectively no CSP ────────────────────────────
// The whole policy used to be `frame-ancestors 'none'; object-src 'none';` —
// no `default-src`, no `script-src`. So any origin on the internet could serve
// a script into the surface that renders service-role views of every user,
// deal, dispute and claim, while the public marketing site had a full policy.
//
// `'unsafe-inline'` remains on script-src, and that is a stated limitation
// rather than an oversight: Next injects an inline bootstrap for hydration and
// streaming, and removing it needs nonce propagation through the middleware —
// worth doing, but it is a change that half-works if it is not verified on
// every signed-in console page, which needs a real staff session. The
// improvement here is that script origins are now an allowlist instead of
// unrestricted. The main site's CSP is deliberately untouched; removing its
// 'unsafe-inline'/'unsafe-eval' is A-056 and carries its own risk pass.
//
// `https://unpkg.com` is pinned because the Security Center map loads
// Leaflet 1.9.4 from it (script and stylesheet). That is a deliberate,
// recorded allowance — bundling it or adding SRI is the open half of A-071's
// acceptance test 3, and it is the same decision the main site faces.
const SUPABASE_ORIGIN = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  // Map tiles (Carto), Supabase-hosted property media, and inline data/blob
  // previews. Images cannot execute, so this is the one directive kept broad.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // next/font self-hosts, so the only cross-origin fetch the browser makes is
  // to Supabase for auth and data. Without this the console cannot sign in.
  `connect-src 'self' ${SUPABASE_ORIGIN}`.trim(),
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ") + ";";

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
        { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
        // The main app already sent this; the console did not.
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }];
  },
};

export default nextConfig;
