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
