import { contentSecurityPolicy, previewContentSecurityPolicy } from "./src/lib/siteContentSecurityPolicy.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['127.0.0.1', '192.168.100.42'],
  // OWASP ZAP baseline, 2026-09-29 (Low: `Server Leaks Information via
  // "X-Powered-By"` on every dynamically rendered route — `/discover` and the
  // API routes answered `X-Powered-By: Next.js`). Prerendered pages never
  // carried it, which is why only some URLs were flagged.
  //
  // The header advertises the framework and its version shape to anyone
  // probing the site, and nothing in ScoutIt reads it. Vercel strips nothing
  // on its own, so the opt-out has to live here.
  poweredByHeader: false,

  // A-123: was `true`, which emitted 178 `.js.map` files — **44 MB of a 57 MB
  // build**, against only ~13 MB of actual JavaScript. They were deployed on
  // every release and addressable by anyone who guessed the path.
  //
  // Turning this off does NOT cost Sentry its readable stack traces. The Sentry
  // build plugin generates its own source maps, uploads them, and does not rely
  // on Next's browser-facing copies — that upload is gated on SENTRY_AUTH_TOKEN,
  // not on this flag. `hideSourceMaps` below only stripped the
  // `sourceMappingURL` comment so browsers stopped auto-fetching them; the files
  // still shipped. This is the setting that stops them being built at all.
  //
  // If a browser-debuggable build is ever wanted, set it per-deploy rather than
  // committing `true` — a debug aid is not a default.
  productionBrowserSourceMaps: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'v5.airtableusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/the-board',
        destination: '/wishlist',
        permanent: true,
      },
      {
        source: '/manifesto',
        destination: '/about',
        permanent: true,
      },
      {
        source: '/whereto',
        destination: '/discover',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'preview'
              ? previewContentSecurityPolicy : contentSecurityPolicy,
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          // HSTS (§25.5). Tells browsers to reach ScoutIt over HTTPS only,
          // closing the http:// first-request window an attacker on a café or
          // airport network can hijack — a realistic vector for Philippine
          // brokers working from public Wi-Fi.
          //
          // ⚠️ DELIBERATELY CONSERVATIVE, and the ramp matters:
          //   · max-age is 1 DAY, not the usual year. HSTS is a one-way
          //     promise a browser caches and will not let you take back — if
          //     HTTPS breaks on a host, that host is unreachable for the whole
          //     max-age. Starting at a day means a mistake costs a day.
          //   · NO includeSubDomains. It would cover mc.scoutit.space and any
          //     future subdomain that does not have a certificate yet, taking
          //     them offline before they exist.
          //   · NO preload. Preload is effectively permanent and requires
          //     includeSubDomains plus a long max-age.
          //
          // RAMP COMPLETED 2026-08-30. HTTPS has been stable on the custom
          // domain through the Seoul region move and repeated production
          // verification, so the documented step from one day to one year is
          // taken. At 86400 the header was close to decorative: a visitor who
          // had not returned within a day was unprotected again, which is the
          // window a downgrade attack wants.
          //
          // includeSubDomains commits EVERY *.scoutit.space name to valid
          // HTTPS for a year in any browser that has seen this header. That is
          // safe here — Vercel issues certificates automatically for every
          // domain attached to the project, and Mission Control lives on a
          // vercel.app host rather than a subdomain of this one.
          //
          // STILL NO PRELOAD. Preload is a submission to a browser-vendor list
          // and is effectively permanent; it deserves its own decision, not a
          // side effect of this change.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      {
        source: '/reset-password',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ]
  },
};

import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  silent: true,
  // Read from env rather than hardcoding. These only affect SOURCE MAP
  // UPLOAD (which additionally needs SENTRY_AUTH_TOKEN) — error capture
  // itself works off NEXT_PUBLIC_SENTRY_DSN alone and doesn't need either.
  //
  // Hardcoding them meant a mismatch with the real Sentry project would
  // silently skip source-map upload with `silent: true` swallowing the
  // warning: stack traces would arrive minified with no clue why.
  org: process.env.SENTRY_ORG || "scoutit",
  project: process.env.SENTRY_PROJECT || "scoutit-web",
}, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  widenClientFileUpload: true,
  transpileClientSDK: false,
  // A-123: kept, but it is no longer what protects the source. It only removes
  // the `sourceMappingURL` comment; with productionBrowserSourceMaps now false
  // there is no browser map to point at in the first place. Left in place so a
  // future re-enable of that flag does not silently re-expose them.
  hideSourceMaps: true,
  disableLogger: true,
  // A-123: belt and braces. If a map is ever generated again — by this config or
  // by the Sentry plugin itself — delete it from the client output after upload
  // so it cannot be served. Sentry keeps its own copy for de-minification.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
});
