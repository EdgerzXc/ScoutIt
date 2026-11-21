import { expect, test } from '@playwright/test';
import { MASTER_FLOW_NODES } from '../../src/data/masterFlowGraphData.js';
import { gotoAndSettle } from './helpers';
import { openStaffWorkspace, seedStaffSession } from './staffSessionFixture';

test.describe.configure({ mode: 'parallel' });
test.beforeEach(() => {
  test.skip(process.env.SCOUTIT_RUN_STAFF_E2E !== '1', 'Requires the isolated staff Auth fixture');
});

test('an ordinary signed-in account cannot open staff tools or flow details', async ({ page }) => {
  await seedStaffSession(page, 'ordinary');
  await gotoAndSettle(page, '/admin');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Staff access required' })).toBeVisible();
  await expect(page.getByRole('button', { name: /PDF Drafts/ })).toHaveCount(0);
  await gotoAndSettle(page, '/admin/flow');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Staff access required' })).toBeVisible();
  await expect(page.getByText(/Master Graph \(/)).toHaveCount(0);
});

for (const [kind, heading, link] of [
  ['aal1', 'Verify your authenticator', 'Verify and return'],
  ['unenrolled', 'Set up an authenticator', 'Open security settings'],
]) {
  test(`${kind} staff must satisfy MFA before opening a staff document`, async ({ page }) => {
    await seedStaffSession(page, kind);
    await page.goto('/admin/flow');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.getByRole('link', { name: link })).toBeVisible();
    await expect(page.getByText(/Master Graph \(/)).toHaveCount(0);
    if (kind === 'aal1') {
      const location = await page.getByRole('link', { name: link }).getAttribute('href');
      expect(new URL(location, page.url()).searchParams.get('next')).toBe('/admin/flow');
    }
  });
}

test('the document gate fails closed and its scoped cookie can be cleared', async ({ page, context, baseURL }) => {
  for (const path of ['/admin', '/admin/flow']) {
    const rejected = await page.request.get(path, { maxRedirects: 0 });
    expect(rejected.status()).toBe(307);
    expect(rejected.headers()['cache-control']).toMatch(/private.*no-store/);
    expect(rejected.headers().location).toBe(`/admin/access?next=${encodeURIComponent(path)}`);
    expect(await rejected.text()).not.toContain('rec_manual_approval_queue');
  }
  const unauthorizedFlight = await page.request.get('/admin/flow?_rsc=staff-gate-test', {
    headers: { RSC: '1' }, maxRedirects: 0,
  });
  expect(unauthorizedFlight.headers()['cache-control']).toMatch(/private.*no-store/);
  expect(await unauthorizedFlight.text()).not.toContain('Verify Redis last-good cache fallback.');
  const graphDenied = await page.request.get('/api/admin/flow');
  expect(graphDenied.status()).toBe(401);
  expect(await graphDenied.text()).not.toContain('Verify Redis last-good cache fallback.');
  const { access_token: token } = await seedStaffSession(page);
  const origin = new URL(baseURL).origin;
  const unwanted = await page.request.post('/api/admin/session', {
    headers: { Origin: 'https://other.scoutit.space', Authorization: `Bearer ${token}` },
  });
  expect(unwanted.status()).toBe(403);
  expect(unwanted.headers()['set-cookie']).toBeUndefined();

  await openStaffWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Admin Console', exact: true })).toBeVisible();
  const reissued = await page.request.post('/api/admin/session', {
    headers: { Origin: origin, Authorization: `Bearer ${token}` },
  });
  expect(reissued.status()).toBe(204);
  expect(reissued.headers()['set-cookie']).toMatch(/;\s*SameSite=Strict(?:;|$)/i);
  const [cookie] = (await context.cookies(origin + '/admin')).filter((item) => item.name === '__Secure-scoutit-admin');
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, path: '/admin' });
  expect(cookie.value).not.toContain(token);
  expect((await context.cookies(origin)).some((item) => item.name === cookie.name)).toBe(false);
  expect(await page.evaluate(() => document.cookie.includes('__Secure-scoutit-admin'))).toBe(false);

  const alternateOrigin = new URL(origin);
  alternateOrigin.hostname = alternateOrigin.hostname === 'localhost' ? '127.0.0.1' : 'localhost';
  const crossSite = await context.newPage();
  const linkPage = new URL('/staff-nav-fixture', alternateOrigin).href;
  await crossSite.route(linkPage, (route) => route.fulfill({
    contentType: 'text/html', body: `<a href="${origin}/admin">Staff workspace</a>`,
  }));
  try {
    await crossSite.goto(linkPage);
    await crossSite.getByRole('link', { name: 'Staff workspace' }).click();
    await expect(crossSite).toHaveURL((url) => url.pathname === '/admin/access');
  } finally {
    await crossSite.close();
  }

  const accepted = await page.request.get('/admin', { maxRedirects: 0 });
  expect(accepted.status()).toBe(200);
  expect(accepted.headers()['cache-control']).toMatch(/private.*no-store/);
  const clear = await page.evaluate(async () => (await fetch('/api/admin/session', { method: 'DELETE' })).status);
  expect(clear).toBe(204);
  const afterLogout = await page.request.get('/admin', { maxRedirects: 0 });
  expect(afterLogout.status()).toBe(307);
  await openStaffWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Admin Console', exact: true })).toBeVisible();

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Sign Out of ScoutIt', exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === '/onboarding');
  expect((await context.cookies(origin + '/admin')).some((item) => item.name === cookie.name)).toBe(false);
  expect((await page.request.get('/admin/flow', { maxRedirects: 0 })).status()).toBe(307);
});

test('a staff flow read can recover from an outage and load the graph', async ({ page }) => {
  await seedStaffSession(page);
  let requests = 0;
  await page.route('**/api/admin/flow', (route) => {
    requests += 1;
    if (requests === 1) return route.fulfill({ status: 503, json: { error: 'Service unavailable' } });
    return route.continue();
  });

  await openStaffWorkspace(page, '/admin/flow');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load the staff workspace' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText(`Master Graph (${MASTER_FLOW_NODES.length})`)).toBeVisible();
  expect(requests).toBe(2);
});

test('staff approval retains failed drafts and announces an unconfirmed public refresh', async ({ page }) => {
  await seedStaffSession(page);
  const draft = { id: '87998441-6c10-4a24-ac27-5614c6867355', title: 'Harbour Workspaces', location: 'Pasay', type: 'Commercial' };
  const secondDraft = { ...draft, id: 'f81d4fae-7dec-41d0-a765-00a0c91e6bf6', title: 'Makati Studio' };
  const attempts = [];
  let finishRetry;
  const retryResponse = new Promise((resolve) => { finishRetry = resolve; });

  await page.route('**/api/admin/pending', (route) => route.fulfill({ json: { properties: [draft, secondDraft] } }));
  await page.route('**/api/admin/approve', async (route) => {
    attempts.push(route.request().postDataJSON());
    if (attempts.length === 1) return route.fulfill({ status: 502, json: { error: 'Approval could not be confirmed.' } });
    await retryResponse;
    return route.fulfill({ json: { success: true, publicCachePending: true, airtableId: 'recHarbour' } });
  });

  await openStaffWorkspace(page);
  const queue = page.getByRole('button', { name: /Pending Approvals/ });
  await queue.click();
  const approve = page.getByRole('button', { name: 'Approve to Airtable' });
  await expect(approve).toHaveCount(2);
  await approve.first().press('Enter');
  await expect(page.getByRole('alert').filter({ hasText: 'Approval could not be confirmed.' })).toBeVisible();
  await expect(approve).toHaveCount(2);

  await approve.first().click();
  await expect(approve).toHaveCount(1);
  await expect(approve).toBeDisabled();
  finishRetry();
  await expect(page.getByRole('status').filter({ hasText: 'Listing approved. Check the public page before sharing it.' })).toBeVisible();
  await expect(queue).toContainText('(1)');
  await expect(page.getByText(secondDraft.title)).toBeVisible();
  expect(attempts).toEqual(Array(2).fill({ submissionId: draft.id }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});
