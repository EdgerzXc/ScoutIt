import { test, expect } from '@playwright/test';
import { expectRealContent, gotoAndSettle, trackErrors } from './helpers';

const EXPECTED_PROPERTIES = [
  'corner-unit-poblacion-strip',
  'cyber-sigma-tower-3',
  'one-ecom-center',
  'sea-breeze-loft-boracay-station-2',
  'the-foundry-warehouse-district-bgc',
  'the-meridian-hotel-cebu-it-park',
  'the-ridgeline-at-capitol-commons',
];

const EXPECTED_CATEGORIES = [
  'Commercial',
  'Hospitality',
  'Residential',
  'Restaurants',
  'STR',
  'Venues',
];

const EXPECTED_BROKERS = [
  'Daniel Ocampo',
  'Isabella Reyes',
  'Marco Villanueva',
];

test.describe('@P1 @CMS Airtable starter catalog', () => {
  test('serves the original category properties and broker roster without local fixtures', async ({ page, request }) => {
    const errors = trackErrors(page);

    await test.step('Verify the CMS API is Airtable-backed', async () => {
      const response = await request.get('/api/cms');
      expect(response.ok()).toBe(true);
      const body = await response.json();

      expect(body.source).toMatch(/^(airtable|upstash_redis)/);
      expect(body.properties.map((property) => property.slug).sort()).toEqual(EXPECTED_PROPERTIES);
      expect([...new Set(body.properties.map((property) => property.spaceCategory))].sort()).toEqual(EXPECTED_CATEGORIES);
      expect(body.brokers.map((broker) => broker.name).sort()).toEqual(EXPECTED_BROKERS);
      expect(body.properties.some((property) => property.slug === 'sky-pavilion-makati')).toBe(false);
      expect(body.properties.some((property) => property.slug === 'batasan-hills')).toBe(false);
      expect(body.brokers.some((broker) => /^br-\d+$/.test(broker.id))).toBe(false);
    });

    await test.step('Open a starter property from the live catalog', async () => {
      await gotoAndSettle(page, '/property/cyber-sigma-tower-3');
      await expectRealContent(page, 100);
      await expect(page.getByRole('heading', { name: 'Cyber Sigma Tower 3' }).first()).toBeVisible({ timeout: 20000 });
    });

    await test.step('Open the Airtable broker directory', async () => {
      await gotoAndSettle(page, '/brokers');
      await expectRealContent(page, 100);
      const directory = page.getByRole('region', { name: 'Verified Advisors directory' });
      await expect(directory).toBeVisible({ timeout: 20000 });
      await expect(directory.getByRole('article')).toHaveCount(3, { timeout: 20000 });
      for (const brokerName of EXPECTED_BROKERS) {
        await expect(page.getByText(brokerName, { exact: true }).first()).toBeVisible();
      }
    });

    const unexpectedErrors = errors.filter((error) => !/\[CMS\] Airtable fetch failed/.test(error));
    expect(unexpectedErrors, unexpectedErrors.join('\n')).toEqual([]);
  });
});
