import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // The canonical launch suite is deliberately read-only against live data.
  // Keep experimental or destructive journeys out of the default test run.
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
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    // Next.js recommends production code for E2E parity. It also prevents the
    // dev overlay and hot-compiled chunk churn from corrupting launch results.
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 300000,
    env: {
      SCOUTIT_E2E: '1',
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
