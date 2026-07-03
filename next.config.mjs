/** @type {import('next').NextConfig} */
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://unpkg.com;
    style-src 'self' 'unsafe-inline' https://unpkg.com;
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    worker-src 'self' blob:;
    child-src 'self' blob:;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://my.matterport.com https://*.matterport.com;
    connect-src 'self' https://*.supabase.co https://*.mapbox.com https://events.mapbox.com https://unpkg.com https://*.cartocdn.com https://huggingface.co https://*.hf.co;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
`;

const nextConfig = {
  productionBrowserSourceMaps: true,
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
  org: "scoutit",
  project: "scoutit-web",
}, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
  widenClientFileUpload: true,
  transpileClientSDK: false,
  hideSourceMaps: true,
  disableLogger: true,
});
