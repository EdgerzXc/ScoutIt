import { defineConfig, devices } from '@playwright/test';

// Point the suite at a deployment instead of a local build:
//   SCOUTIT_E2E_BASE_URL=https://... npx playwright test
//
// When a target is supplied no local server is started, because building and
// serving a second copy of the app while measuring a remote one is how a run
// ends up reporting on the wrong thing. A protected Vercel preview will fail
// at the render anchor rather than passing vacuously against its login wall
// (see assertScoutItRendered in helpers.js).
const externalTarget = process.env.SCOUTIT_E2E_BASE_URL || '';
const baseURL = externalTarget || 'http://localhost:3000';
// A local production build otherwise loads .env.local, including the live
// Airtable PAT. Browser verification is offline unless the caller deliberately
// opts into the live CMS contract suite.
const useLiveCms = process.env.SCOUTIT_E2E_LIVE_CMS === '1';

export default defineConfig({
  // The launch suite includes read-only live-catalog contracts. Local runs
  // start offline; use test:e2e:live-cms only when spending API calls is intended.
  // Keep experimental or destructive journeys out of the test run.
  testDir: './e2e_tests/full-system',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Unlimited local workers meant every spec's Chromium instance ran at once,
  // including several heavy 5-photo-upload flows in parallel -- real resource
  // contention that showed up as flaky timeouts unrelated to any app bug.
  workers: process.env.CI ? 1 : 2,
  // Keep generated HTML reports out of the repository by default. A one-off
  // report can still be requested with `--reporter=html` when debugging.
  reporter: 'line',
  use: {
    baseURL,
    // Ordinary journeys start after analytics was declined and both first-visit
    // prompts were completed. Dedicated journeys clear their markers.
    storageState: {
      cookies: [],
      origins: [{
        origin: new URL(baseURL).origin,
        localStorage: [
          { name: 'scoutit_cookie_consent', value: 'denied' },
          { name: 'scoutit_help_seen_v1', value: 'true' },
          { name: 'scoutit_presentation_choice_seen_v1', value: '1' },
        ],
      }],
    },
    trace: 'on-first-retry',
  },
  webServer: externalTarget ? undefined : {
    // Next.js recommends production code for E2E parity. It also prevents the
    // dev overlay and hot-compiled chunk churn from corrupting launch results.
    command: process.env.SCOUTIT_E2E_USE_BUILD === '1'
      ? 'npm run start'
      : 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 300000,
    env: {
      SCOUTIT_E2E: '1',
      ...(useLiveCms ? {} : {
        AIRTABLE_API_KEY: '',
        AIRTABLE_BASE_ID: '',
        UPSTASH_REDIS_REST_URL: '',
        UPSTASH_REDIS_REST_TOKEN: '',
      }),
      // Client components need an explicit build-time flag. It exists only in
      // this localhost E2E build and is still rejected on public hostnames.
      NEXT_PUBLIC_SCOUTIT_E2E: '1',
      // Cloudflare's documented always-pass test key; never shipped by the app.
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
