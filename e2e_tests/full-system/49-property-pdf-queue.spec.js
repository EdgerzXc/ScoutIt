import { expect, test } from '@playwright/test';
import { gotoAndSettle, MOCK_OWNER_EMPTY, signInAsMock } from './helpers';

test('owner can submit a PDF, retry the same draft and see when review is needed', async ({ page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);

  const propertyId = '87998441-6c10-4a24-ac27-5614c6867355';
  await page.route('**/api/dashboard/inventory**', (route) => route.fulfill({ json: {
    properties: [{ id: 'pdf-test-listing', owner_id: MOCK_OWNER_EMPTY.id, title: 'PDF Queue Test Listing', location: 'BGC', space_category: 'commercial', pipeline_status: 'approved', lifecycle_state: 'live', details: {} }],
    units: [],
  } }));

  let intakeIdentity;
  await page.route('**/api/properties/queue/intake', (route) => {
    intakeIdentity = route.request().headers()['x-mock-user-id'];
    return route.fulfill({ json: { success: true, propertyId, queueNumber: 2 } });
  });

  const attempts = [];
  await page.route('**/api/properties/queue/process', (route) => {
    const request = route.request();
    attempts.push({ identity: request.headers()['x-mock-user-id'], body: request.postDataJSON() });
    if (attempts.length === 1) return route.fulfill({ status: 503, json: { error: 'Service unavailable' } });
    return route.fulfill({ json: { success: true, done: true, propertyId } });
  });
  await page.route('**/api/properties/queue/status?*', (route) => {
    expect(new URL(route.request().url()).searchParams.get('propertyId')).toBe(propertyId);
    return route.fulfill({ json: { isDone: false, pipelineStatus: 'ai_drafting', queueNumber: 2 } });
  });

  await gotoAndSettle(page, '/dashboard');
  await page.getByRole('button', { name: 'Drop PDF' }).click();
  const upload = page.getByRole('button', { name: 'Upload a PDF brochure' });
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    upload.press('Enter'),
  ]);
  const filename = `${'commercial-brochure'.repeat(12)}.pdf`;
  await chooser.setFiles({ name: filename, mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 browser fixture') });

  await expect(page.getByText('Still queued. You can retry processing.')).toBeVisible();
  await page.getByRole('button', { name: 'Retry processing' }).click();
  const status = page.getByRole('status').filter({ hasText: 'Draft created.' });
  await expect(status).toContainText('Staff verification is required before publication.');
  expect(intakeIdentity).toBe(MOCK_OWNER_EMPTY.id);
  expect(attempts).toEqual(Array(2).fill({ identity: MOCK_OWNER_EMPTY.id, body: { propertyId } }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('staff download the source before confirming and can retry PDF deletion', async ({ context, page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);

  const reviewedDraft = { title: 'Staff Review Fixture', floor_sqm: 42 };
  const propertyId = '87998441-6c10-4a24-ac27-5614c6867355';
  const sourceUrl = new URL('/review-fixture.pdf', baseURL).href;
  const attestations = [];

  await context.route('**/review-fixture.pdf', (route) => route.fulfill({
    headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="review.pdf"' },
    body: '%PDF-1.4 browser fixture',
  }));
  await page.route('**/api/admin/pdf-verify**', (route) => {
    const request = route.request();
    if (request.method() === 'POST') {
      attestations.push(request.postDataJSON());
      return route.fulfill({ json: { success: true, cleanupPending: attestations.length === 1 } });
    }
    if (new URL(request.url()).searchParams.has('propertyId')) {
      return route.fulfill({ json: { sourceUrl, reviewedDraft } });
    }
    return route.fulfill({ json: {
      drafts: attestations.length > 1 ? [] : [{ id: propertyId, title: reviewedDraft.title, sourceAttached: true, cleanupPending: attestations.length === 1 }],
    } });
  });

  await gotoAndSettle(page, '/admin');
  await page.getByRole('button', { name: /PDF Drafts/ }).click();
  await page.getByRole('button', { name: 'Review draft and PDF' }).click();
  const confirm = page.getByRole('button', { name: 'Confirm review and delete PDF' });
  await expect(confirm).toBeDisabled();
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Download source PDF' }).click();
  await confirm.click();
  await page.getByRole('button', { name: 'Retry PDF deletion' }).click();
  await expect(page.getByText('No PDF-assisted drafts awaiting verification.', { exact: false })).toBeVisible();
  expect(attestations).toEqual([{ propertyId, sourceReviewed: true, reviewedDraft }, { propertyId }]);
});
