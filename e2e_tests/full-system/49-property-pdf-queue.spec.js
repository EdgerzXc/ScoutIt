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

test('staff must reopen a changed draft before confirming and can retry PDF deletion', async ({ context, page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);
  await page.route('**/api/admin/access', (route) => route.fulfill({ json: { allowed: true } }));

  const reviewedDraft = { title: 'Staff Review Fixture', floor_sqm: 42, listing_details: { building_grade: 'Grade A' } };
  const revisedDraft = { ...reviewedDraft, listing_details: { building_grade: 'Grade B' } };
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
      if (attestations.length === 1) return route.fulfill({ status: 409, json: { error: 'The draft changed. Reload it and compare it with the source again.' } });
      return route.fulfill({ json: { success: true, cleanupPending: attestations.length === 2 } });
    }
    if (new URL(request.url()).searchParams.has('propertyId')) {
      return route.fulfill({ json: { sourceUrl, sourceVersion: 'fixture-source', reviewedDraft: attestations.length ? revisedDraft : reviewedDraft } });
    }
    return route.fulfill({ json: {
      drafts: attestations.length > 2 ? [] : [{ id: propertyId, title: reviewedDraft.title, sourceAttached: true, cleanupPending: attestations.length === 2 }],
    } });
  });

  await gotoAndSettle(page, '/admin');
  await page.getByRole('button', { name: /PDF Drafts/ }).click();
  await page.getByRole('button', { name: 'Review draft and PDF' }).click();
  const confirm = page.getByRole('button', { name: 'Confirm review and delete PDF' });
  await expect(confirm).toBeDisabled();
  await expect(page.getByText('42', { exact: true })).toBeVisible();
  await expect(page.getByText('Grade A', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Download source PDF' }).click();
  await confirm.click();
  await expect(confirm).toHaveCount(0);
  await page.getByRole('button', { name: 'Review draft and PDF' }).click();
  await expect(page.getByText('Grade B', { exact: true })).toBeVisible();
  await expect(confirm).toBeDisabled();
  await page.getByRole('link', { name: 'Download source PDF' }).click();
  await confirm.click();
  await page.getByRole('button', { name: 'Retry PDF deletion' }).click();
  await expect(page.getByText('No PDF-assisted drafts awaiting verification.', { exact: false })).toBeVisible();
  expect(attestations).toEqual([
    { propertyId, sourceReviewed: true, sourceVersion: 'fixture-source', reviewedDraft },
    { propertyId, sourceReviewed: true, sourceVersion: 'fixture-source', reviewedDraft: revisedDraft },
    { propertyId },
  ]);
});

test('large property PDFs go directly to private storage', async ({ page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);

  const uploadId = '87998441-6c10-4a24-ac27-5614c6867355';
  const propertyId = 'e32a7c21-a388-498a-84f0-3fc62bec83c0';
  const path = `source_queue_docs/${MOCK_OWNER_EMPTY.id}/${uploadId}.pdf`;
  const pdf = Buffer.alloc(7 * 1024 * 1024);
  pdf.write('%PDF-1.4 large browser fixture');
  const requests = [];

  await page.route('**/api/dashboard/inventory**', (route) => route.fulfill({ json: {
    properties: [{ id: 'large-pdf-test-listing', owner_id: MOCK_OWNER_EMPTY.id, title: 'Property for Upload', location: 'BGC', space_category: 'commercial', pipeline_status: 'approved', lifecycle_state: 'live', details: {} }],
    units: [],
  } }));
  await page.route('**/api/properties/queue/intake', (route) => {
    requests.push('relayed');
    return route.abort();
  });
  await page.route('**/api/properties/queue/upload', (route) => {
    const request = route.request();
    requests.push(request.method());
    expect(request.postDataBuffer().length).toBeLessThan(1024);
    if (request.method() === 'POST') {
      expect(request.postDataJSON()).toEqual({ filename: 'brochure.pdf', size: pdf.length });
      return route.fulfill({ json: { uploadId, path, token: 'fixture-token' } });
    }
    expect(request.postDataJSON()).toEqual({ uploadId });
    return route.fulfill({ json: { success: true, propertyId } });
  });
  await page.route('**/storage/v1/object/upload/sign/**', (route) => {
    const request = route.request();
    const headers = {
      'access-control-allow-origin': new URL(baseURL).origin,
      'access-control-allow-methods': 'PUT, OPTIONS',
      'access-control-allow-headers': '*',
    };
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
    requests.push(request.method());
    expect(new URL(request.url()).pathname.endsWith(`/property-documents-temp/${path}`)).toBe(true);
    expect(request.postDataBuffer().length).toBeGreaterThanOrEqual(pdf.length);
    return route.fulfill({ headers, json: { Key: path } });
  });
  await page.route('**/api/properties/queue/process', (route) => {
    expect(route.request().postDataJSON()).toEqual({ propertyId });
    requests.push('process');
    return route.fulfill({ json: { success: true, done: true, propertyId } });
  });

  await gotoAndSettle(page, '/dashboard');
  await page.getByRole('button', { name: 'Drop PDF' }).click();
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Upload a PDF brochure' }).click(),
  ]);
  await chooser.setFiles({ name: 'brochure.pdf', mimeType: 'application/octet-stream', buffer: pdf });
  await expect(page.getByText('Draft created. Staff verification is required before publication.')).toBeVisible();
  expect(requests).toEqual(['POST', 'PUT', 'PATCH', 'process']);
});
