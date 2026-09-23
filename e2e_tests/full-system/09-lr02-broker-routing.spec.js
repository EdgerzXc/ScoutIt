import { test, expect } from '@playwright/test';
import { gotoAndSettle, expectRealContent, trackErrors } from './helpers';

test.describe('LR-02 property-scoped broker roster', () => {
  test('shows the current roster and requires sign-in before a paid contact', async ({ page }) => {
    const errors = trackErrors(page);
    const slug = 'lr02-property';
    await page.route(`**/api/property/${slug}/brokers`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          property: { id: slug, title: 'LR-02 Property', slug },
          represented: true,
          contactable: true,
          brokers: [{ id: 'broker-active', name: 'Active Broker', headline: 'Property Specialist', specializations: ['Commercial'] }],
        },
      });
    });
    const submitted = [];
    await page.route('**/api/deals/initiate', async (route) => {
      submitted.push(route.request().postDataJSON());
      await route.fulfill({ status: 401, json: { error: 'Unauthorized' } });
    });

    await gotoAndSettle(page, `/property/${slug}/brokers`);
    await expectRealContent(page);
    await expect(page.getByRole('heading', { name: /Authorized Broker Roster/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Broker' }).first()).toBeVisible();
    await expect(page.getByText(/current visible, contactable representation/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Active Broker' })).toHaveCount(1);
    await expect(page.getByText(/Building record/i)).toBeVisible();
    await page.getByRole('button', { name: /Contact Broker/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Contact broker · 1 Connect' })).toBeVisible();
    await page.getByRole('textbox', { name: 'Introduction message' }).fill('Please share the current viewing terms.');
    await page.getByRole('button', { name: /Spend 1 Connect/i }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Sign in' })).toContainText('Sign in');
    expect(submitted).toEqual([]);
    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('shows the ordinary uploader/lister path when no broker qualifies', async ({ page }) => {
    const errors = trackErrors(page);
    const slug = 'lr02-unrepresented';
    await page.route(`**/api/property/${slug}/brokers`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { property: { id: slug, title: 'Unrepresented Property', slug }, represented: false, contactable: true, brokers: [] },
      });
    });
    await gotoAndSettle(page, `/property/${slug}/brokers`);
    await expectRealContent(page);
    await expect(page.getByText(/No active broker representation/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Contact lister · 1 Connect/i })).toBeVisible();
    await expect(page.getByText(/Top Rated Brokers/i)).toHaveCount(0);
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
