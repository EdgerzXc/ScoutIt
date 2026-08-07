import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import sitemap from '@/app/sitemap';
import { LOCATION_HUB_SLUGS } from '@/lib/locationHubs';

vi.mock('@/lib/airtable', () => ({
  fetchProperties: vi.fn().mockResolvedValue([
    { slug: 'bgc-luxury-suite-1' },
    { slug: 'makati-penthouse-2' },
  ]),
}));

describe('sitemap generator', () => {
  it('generates static and property routes with canonical base URL', async () => {
    process.env.AIRTABLE_API_KEY = 'test-key';
    process.env.AIRTABLE_BASE_ID = 'test-base';

    const routes = await sitemap();
    expect(Array.isArray(routes)).toBe(true);

    const urls = routes.map((r) => r.url);
    expect(urls).toContain('https://www.scoutit.space');
    expect(urls).toContain('https://www.scoutit.space/discover');
    expect(urls).toContain('https://www.scoutit.space/property/bgc-luxury-suite-1');
  });

  // W1 → W7, and this test moved with them (Standing Rule 14).
  //
  // 2026-08-05: the three /hubs/* slugs were hardcoded in the sitemap with no
  //   route behind them — three soft-404s eating crawl budget from the pages
  //   that do work.
  // 2026-08-06 W1: withheld from the sitemap; this test asserted the ABSENCE.
  // 2026-08-06 W7: `src/app/hubs/[slug]/page.js` shipped, so they are true
  //   again — and the assertion inverted in the same commit as the page.
  //
  // It now reads the slugs from LOCATION_HUBS rather than repeating them. The
  // original mismatch was only possible because a hardcoded literal list has no
  // way to disagree out loud with the routes that actually exist.
  it('advertises every hub in LOCATION_HUBS, and only those (W7)', async () => {
    process.env.AIRTABLE_API_KEY = 'test-key';
    process.env.AIRTABLE_BASE_ID = 'test-base';

    const urls = (await sitemap()).map((r) => r.url);
    const hubUrls = urls.filter((u) => u.includes('/hubs/')).sort();
    const expected = LOCATION_HUB_SLUGS
      .map((slug) => `https://www.scoutit.space/hubs/${slug}`)
      .sort();

    expect(hubUrls.length).toBeGreaterThan(0);
    expect(hubUrls).toEqual(expected);
  });

  // The guard that would have caught the 2026-08-05 bug on day one: the
  // sitemap advertises /hubs/* URLs, so a route must exist to answer them.
  //
  // Asserted by reading the file rather than importing it — vitest can't parse
  // JSX out of a `.js` file under this config, and adding a JSX transform just
  // to run one assertion would be a large change for a small check. Reading the
  // source still catches the actual failure: sitemap says /hubs/*, filesystem
  // says no page.
  it('a route exists to answer the /hubs/* URLs the sitemap advertises', () => {
    const pagePath = path.join(process.cwd(), 'src/app/hubs/[slug]/page.js');
    expect(fs.existsSync(pagePath)).toBe(true);

    // …and it pre-renders from the same array the sitemap reads, so the two
    // lists cannot drift apart the way the old hardcoded literals did.
    const source = fs.readFileSync(pagePath, 'utf8');
    expect(source).toContain('generateStaticParams');
    expect(source).toContain('LOCATION_HUBS');
    expect(LOCATION_HUB_SLUGS.length).toBeGreaterThan(0);
  });
});
