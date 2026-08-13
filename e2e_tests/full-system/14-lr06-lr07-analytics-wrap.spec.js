import { test, expect } from '@playwright/test';

test.describe('LR-06 and LR-07 Analytics foundation and Monthly Scout Wrap', () => {
  test('verifies analytics endpoint returns success for valid property view events', async ({ request }) => {
    const response = await request.post('/api/analytics', {
      data: {
        eventType: 'property_view',
        propertySlug: 'one-ecom-center',
        dwellSeconds: 15
      }
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, recorded: true });
  });
});
