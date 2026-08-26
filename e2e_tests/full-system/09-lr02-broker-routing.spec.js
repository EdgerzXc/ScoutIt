import { test, expect } from '@playwright/test';
import { getCommercialListing, gotoAndSettle, expectRealContent, trackErrors } from './helpers';

test.describe('LR-02 property-scoped broker roster', () => {
  test('shows only the current property roster and routes selected contact to it', async ({ page, request }) => {
    const errors = trackErrors(page);
    const listing = await getCommercialListing(request);
    await page.route(`**/api/property/${listing.slug}/brokers`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          property: { id: 'lr02-property', title: listing.title, slug: listing.slug },
          represented: true,
          contactable: true,
          brokers: [{ id: 'broker-active', name: 'Active Broker', headline: 'Property Specialist', specializations: ['Commercial'] }],
        },
      });
    });
    await page.route('**/api/inquiries', async (route) => {
      const body = route.request().postDataJSON();
      expect(body.preferredBrokerId).toBe('broker-active');
      await route.fulfill({ status: 200, contentType: 'application/json', json: { success: true, routedToRoster: true, recipientCount: 1 } });
    });

    await gotoAndSettle(page, `/property/${listing.slug}/brokers`);
    await expectRealContent(page);
    await expect(page.getByRole('heading', { name: /Authorized Broker Roster/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Broker' }).first()).toBeVisible();
    await expect(page.getByText(/current visible, contactable representation/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Broker' })).toHaveCount(1);
    await expect(page.getByText(/Building record/i)).toBeVisible();
    await page.getByRole('button', { name: /Contact Broker/i }).first().click();
    await page.getByPlaceholder('Your Full Name').fill('Buyer One');
    await page.getByPlaceholder(/Contact Number/i).fill('+63 917 000 0000');
    await page.getByPlaceholder(/Tell the recipient/i).fill('Please share the current viewing terms.');
    await page.getByRole('button', { name: /Send inquiry/i }).click();
    await expect(page.getByRole('status')).toContainText(/routed/i);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('shows the ordinary uploader/lister path when no broker qualifies', async ({ page, request }) => {
    const errors = trackErrors(page);
    const listing = await getCommercialListing(request);
    await page.route(`**/api/property/${listing.slug}/brokers`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { property: { id: 'lr02-unrepresented', title: listing.title, slug: listing.slug }, represented: false, contactable: true, brokers: [] },
      });
    });
    await gotoAndSettle(page, `/property/${listing.slug}/brokers`);
    await expectRealContent(page);
    await expect(page.getByText(/No active broker representation/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Contact uploader \/ lister/i })).toBeVisible();
    await expect(page.getByText(/Top Rated Brokers/i)).toHaveCount(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
