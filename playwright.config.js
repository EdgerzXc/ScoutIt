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
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
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
