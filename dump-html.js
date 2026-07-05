const { chromium, devices } = require('playwright');
const fs = require('fs');

(async () => {
  // Setup mobile device
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 13'], // Same screen size as Mobile Safari
    baseURL: 'http://localhost:3000'
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  // Mock user
  await page.addInitScript(() => {
    window.localStorage.setItem('scoutit_user', JSON.stringify({
      id: 'master-dev',
      role: 'owner',
      tags: ['owner', 'broker'],
      primaryMode: 'owner'
    }));
  });

  await page.goto('/dashboard');
  
  // Wait for loading to finish
  const loadingText = page.locator('text="Loading your dashboard..."');
  await loadingText.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  
  await page.waitForTimeout(3000); // Wait for animations
  
  // Dump HTML
  const html = await page.content();
  fs.writeFileSync('C:\\Users\\jerze\\.gemini\\antigravity-ide\\brain\\d59432cb-95c8-464b-a9f1-497416c9d694\\scratch\\dashboard-dump.html', html);
  
  console.log("HTML dumped!");
  await browser.close();
})();
