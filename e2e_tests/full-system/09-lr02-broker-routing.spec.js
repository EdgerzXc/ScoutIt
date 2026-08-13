import { test, expect } from '@playwright/test';
import { gotoAndSettle, expectRealContent, trackErrors } from './helpers';

test.describe('LR-02 property-scoped broker roster', () => {
  test('shows only the current property roster and routes selected contact to it', async ({ page }) => {
    const errors = trackErrors(page);
    await page.route('**/api/property/lr02-property/brokers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          property: { id: 'lr02-property', title: 'LR-02 Property', slug: 'lr02-property' },
          represented: true,
          brokers: [{ id: 'broker-active', name: 'Active Broker', headline: 'Property Specialist', rating: 4.8, specializations: ['Commercial'] }],
        },
      });
    });
    await page.route('**/api/inquiries', async (route) => {
      const body = route.request().postDataJSON();
      expect(body.preferredBrokerId).toBe('broker-active');
      await route.fulfill({ status: 200, contentType: 'application/json', json: { success: true, routedToRoster: true, recipientCount: 1 } });
    });

    await gotoAndSettle(page, '/property/lr02-property/brokers');
    await expectRealContent(page);
    await expect(page.getByRole('heading', { name: /Authorized Broker Roster/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Broker' }).first()).toBeVisible();
    await expect(page.getByText(/current visible, contactable representation/i)).toBeVisible();
    // The same broker can be surfaced in the recommended and ranked layers;
    // both must remain honest, and the recommended action routes to that ID.
    await expect(page.getByRole('heading', { name: 'Active Broker' })).toHaveCount(2);
    await page.getByRole('button', { name: /Contact Broker/i }).first().click();
    await page.getByPlaceholder('Your Full Name').fill('Buyer One');
    await page.getByPlaceholder(/Contact Number/i).fill('+63 917 000 0000');
    await page.getByPlaceholder(/Tell the recipient/i).fill('Please share the current viewing terms.');
    await page.getByRole('button', { name: /Send inquiry/i }).click();
    await expect(page.getByRole('status')).toContainText(/routed/i);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('shows the ordinary uploader/lister path when no broker qualifies', async ({ page }) => {
    const errors = trackErrors(page);
    await page.route('**/api/property/lr02-unrepresented/brokers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { property: { id: 'lr02-unrepresented', title: 'Unrepresented Property', slug: 'lr02-unrepresented' }, represented: false, contactable: true, brokers: [] },
      });
    });
    await gotoAndSettle(page, '/property/lr02-unrepresented/brokers');
    await expectRealContent(page);
    await expect(page.getByText(/No active broker representation/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Contact uploader \/ lister/i })).toBeVisible();
    await expect(page.getByText(/Top Rated Brokers/i)).toHaveCount(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
