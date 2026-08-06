/** @type {import('next').NextConfig} */
// Dev-only allowance so impeccable live mode's picker UI (localhost:8400) can load.
// Guarded by NODE_ENV so it never reaches production.
const __impeccableLiveDev =
  process.env.NODE_ENV === "development" ? " http://localhost:8400" : "";

const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com https://www.googletagmanager.com${__impeccableLiveDev};
    style-src 'self' 'unsafe-inline' https://unpkg.com;
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    worker-src 'self' blob:;
    child-src 'self' blob:;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://my.matterport.com https://*.matterport.com https://lumalabs.ai;
    connect-src 'self' https://*.supabase.co https://*.mapbox.com https://events.mapbox.com https://unpkg.com https://*.cartocdn.com https://huggingface.co https://*.hf.co https://www.google-analytics.com https://www.googletagmanager.com https://www.google.com https://*.google.com https://earthquake.usgs.gov${__impeccableLiveDev};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const nextConfig = {
  productionBrowserSourceMaps: true,
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
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
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
            value: 'camera=(), microphone=(), geolocation=()',
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
          // RAMP: once HTTPS is confirmed stable on the custom domain (§27),
          // raise max-age to 31536000 and add includeSubDomains. Only then
          // consider preload.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=86400',
          },
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
  hideSourceMaps: true,
  disableLogger: true,
});
