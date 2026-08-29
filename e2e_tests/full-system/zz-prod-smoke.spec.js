import { test, expect } from '@playwright/test';

const BASE = 'https://www.scoutit.space';

const PAGES = [
  ['homepage', '/', /ScoutIt/i],
  ['discover', '/discover', /discover|search|space/i],
  ['intel', '/intel', /intel|briefing|signal/i],
  ['directory', '/property', /propert|space|listing/i],
];

for (const [name, path, expected] of PAGES) {
  test(`production ${name} renders real content`, async ({ page }) => {
    const errors = [];
    const cmsCalls = [];

    page.on('console', (m) => {
      if (m.type() !== 'error') return;
      const t = m.text();
      if (/favicon|sentry|google|analytics|mapbox|maplibre|webgl|net::ERR_|Failed to load resource/i.test(t)) return;
      errors.push(t);
    });
    page.on('response', async (r) => {
      const u = new URL(r.url());
      if (u.pathname === '/api/cms') {
        cmsCalls.push({
          scope: u.searchParams.get('scope'),
          status: r.status(),
          cache: r.headers()['cache-control'] || '(none)',
          vercel: r.headers()['x-vercel-cache'] || '(none)',
        });
      }
    });

    const started = Date.now();
    const res = await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(res.status(), `${path} HTTP status`).toBeLessThan(400);
    await page.waitForTimeout(6000);
    const elapsed = Date.now() - started;

    const body = await page.locator('body').innerText();
    expect(body.length, `${path} rendered almost nothing`).toBeGreaterThan(200);
    expect(body).not.toMatch(/Application error|Internal Server Error|something went wrong/i);
    expect(body).toMatch(expected);

    console.log(`\n>>> ${name} (${path}) — ${elapsed}ms, body ${body.length} chars`);
    for (const c of cmsCalls) {
      console.log(`    /api/cms scope=${c.scope} status=${c.status} vercel=${c.vercel}`);
      console.log(`      cache-control: ${c.cache}`);
    }
    if (!cmsCalls.length) console.log('    (no /api/cms call observed)');
    if (errors.length) {
      console.log('    CONSOLE ERRORS:');
      for (const e of errors.slice(0, 5)) console.log(`      ! ${e.slice(0, 200)}`);
    }
    expect(errors, errors.join('\n')).toEqual([]);
  });
}
