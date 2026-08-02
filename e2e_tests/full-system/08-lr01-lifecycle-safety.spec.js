import { test, expect } from '@playwright/test';
import { gotoAndSettle, expectRealContent, signInAsMock, MOCK_OWNER_EMPTY, trackErrors } from './helpers';

test.describe('LR-01 public safety surfaces', () => {
  test('off-market inventory is not available to anonymous visitors', async ({ page }) => {
    await gotoAndSettle(page, '/off-market');
    await expectRealContent(page);
    await expect(page.getByText(/Sign in with an entitled account/i)).toBeVisible();
    await expect(page.getByText(/CONTACT DISABLED/i)).toHaveCount(0);
  });
});

test.describe('LR-01 mobile owner controls', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('renders a collapsed danger zone with exact-title confirmation', async ({ page }) => {
    const errors = trackErrors(page);
    await signInAsMock(page, MOCK_OWNER_EMPTY);

    // Read-only fixture: the browser never submits a lifecycle mutation.
    await page.route('**/rest/v1/properties*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: [{
          id: 'lr01-mobile-fixture',
          owner_id: MOCK_OWNER_EMPTY.id,
          title: 'LR-01 Mobile Property',
          slug: 'lr-01-mobile-property',
          canonical_slug: 'lr-01-mobile-property',
          lifecycle_state: 'live',
          pipeline_status: 'approved',
          type: 'Commercial',
          space_category: 'Commercial',
          location: 'BGC, Taguig',
          details: {},
          created_at: '2026-08-01T00:00:00.000Z',
        }],
      });
    });
    await page.route('**/api/crm/activity**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', json: { activity: [] } });
    });
    await page.route('**/api/cms**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', json: { properties: [], intel: [], brokers: [] } });
    });

    await gotoAndSettle(page, '/dashboard');
    await expect(page.getByText('LR-01 Mobile Property')).toBeVisible({ timeout: 25000 });
    const dangerToggle = page.getByRole('button', { name: /OPEN DANGER ZONE/i });
    await expect(dangerToggle).toBeVisible();
    await expect(page.getByRole('button', { name: /PERMANENTLY REMOVE LISTING/i })).toHaveCount(0);
    await dangerToggle.click();
    await expect(page.getByLabel(/Type the exact property title/i)).toBeVisible();
    const removeButton = page.getByRole('button', { name: /PERMANENTLY REMOVE LISTING/i });
    await expect(removeButton).toBeDisabled();
    await page.getByLabel(/Type the exact property title/i).fill('LR-01 Mobile Property');
    await page.getByLabel(/Confirm your account password/i).fill('TestPassword123!');
    await expect(removeButton).toBeEnabled();
    expect(errors, errors.join('\n')).toEqual([]);
  });
});
