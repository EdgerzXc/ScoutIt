import { describe, it, expect, vi } from 'vitest';
import sitemap from '@/app/sitemap';

vi.mock('@/lib/airtable', () => ({
  fetchProperties: vi.fn().mockResolvedValue([
    { slug: 'bgc-luxury-suite-1' },
    { slug: 'makati-penthouse-2' },
  ]),
}));

describe('sitemap generator', () => {
  it('generates static, hub, and property routes with canonical base URL', async () => {
    process.env.AIRTABLE_API_KEY = 'test-key';
    process.env.AIRTABLE_BASE_ID = 'test-base';

    const routes = await sitemap();
    expect(Array.isArray(routes)).toBe(true);

    const urls = routes.map((r) => r.url);
    expect(urls).toContain('https://www.scoutit.space');
    expect(urls).toContain('https://www.scoutit.space/discover');
    expect(urls).toContain('https://www.scoutit.space/hubs/bgc-taguig');
    expect(urls).toContain('https://www.scoutit.space/hubs/makati-cbd');
    expect(urls).toContain('https://www.scoutit.space/property/bgc-luxury-suite-1');
  });
});
