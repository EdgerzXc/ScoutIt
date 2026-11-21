import { expect, test } from '@playwright/test';
import { MASTER_FLOW_EDGES, MASTER_FLOW_NODES } from '../../src/data/masterFlowGraphData.js';
import { gotoAndSettle, MOCK_OWNER_EMPTY, signInAsMock } from './helpers';

test('an ordinary signed-in account cannot open staff tools or flow details', async ({ page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);
  await page.route('**/api/admin/**', (route) => route.fulfill({ status: 403, json: { error: 'Staff access required' } }));

  await gotoAndSettle(page, '/admin');
  await expect(page.getByRole('heading', { name: 'Staff access required' })).toBeVisible();
  await expect(page.getByRole('button', { name: /PDF Drafts/ })).toHaveCount(0);
  await gotoAndSettle(page, '/admin/flow');
  await expect(page.getByRole('heading', { name: 'Staff access required' })).toBeVisible();
  await expect(page.getByText(/Master Graph \(/)).toHaveCount(0);
});

test('a staff flow read can recover from an outage and load the graph', async ({ page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);
  let requests = 0;
  await page.route('**/api/admin/flow', (route) => {
    requests += 1;
    if (requests === 1) return route.fulfill({ status: 503, json: { error: 'Service unavailable' } });
    return route.fulfill({ json: { nodes: MASTER_FLOW_NODES, edges: MASTER_FLOW_EDGES } });
  });

  await gotoAndSettle(page, '/admin/flow');
  await expect(page.getByRole('alert').filter({ hasText: 'Could not load the staff workspace' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText(`Master Graph (${MASTER_FLOW_NODES.length})`)).toBeVisible();
  expect(requests).toBe(2);
});

test('staff approval retains failed drafts and announces an unconfirmed public refresh', async ({ page, baseURL }) => {
  test.skip(!['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname), 'Uses local mocked routes');
  await signInAsMock(page, MOCK_OWNER_EMPTY);
  const draft = { id: '87998441-6c10-4a24-ac27-5614c6867355', title: 'Harbour Workspaces', location: 'Pasay', type: 'Commercial' };
  const secondDraft = { ...draft, id: 'f81d4fae-7dec-41d0-a765-00a0c91e6bf6', title: 'Makati Studio' };
  const attempts = [];
  let finishRetry;
  const retryResponse = new Promise((resolve) => { finishRetry = resolve; });

  await page.route('**/api/admin/access', (route) => route.fulfill({ json: { allowed: true } }));
  await page.route('**/api/admin/pending', (route) => route.fulfill({ json: { properties: [draft, secondDraft] } }));
  await page.route('**/api/admin/approve', async (route) => {
    attempts.push(route.request().postDataJSON());
    if (attempts.length === 1) return route.fulfill({ status: 502, json: { error: 'Approval could not be confirmed.' } });
    await retryResponse;
    return route.fulfill({ json: { success: true, publicCachePending: true, airtableId: 'recHarbour' } });
  });

  await gotoAndSettle(page, '/admin');
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
