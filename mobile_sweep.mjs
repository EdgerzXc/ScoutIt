import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\jerze\\.gemini\\antigravity-ide\\brain\\2c212f62-b566-42ea-bd51-d0f3fd91d56f';
const BASE_URL = 'http://localhost:3000';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'directory', path: '/property' },
  { name: 'dashboard', path: '/dashboard' },
  { name: 'pricing', path: '/pricing' },
  { name: 'admin', path: '/admin' },
];

async function runSweep() {
  console.log('Starting Playwright Mobile Sweep...');
  const browser = await chromium.launch({ headless: true });
  
  // Poco X3 Viewport (~393x873 logical pixels)
  const context = await browser.newContext({
    viewport: { width: 393, height: 873 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  for (const target of PAGES) {
    console.log(`Navigating to ${target.name}...`);
    try {
      await page.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      // Wait an extra second for any animations to finish
      await page.waitForTimeout(1000);
      
      const screenshotPath = path.join(ARTIFACT_DIR, `mobile_${target.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Saved screenshot to ${screenshotPath}`);
    } catch (e) {
      console.error(`Failed to sweep ${target.name}:`, e.message);
    }
  }

  await browser.close();
  console.log('Sweep completed!');
}

runSweep().catch(console.error);
