// API-level contracts: the CMS proxy serves data, health reports honestly,
// and every sensitive mutation route refuses anonymous requests.
// All checks are non-mutating: unauthenticated probes must be REJECTED, so
// nothing is ever written.
import { test, expect } from '@playwright/test';

test.describe('Public read APIs', () => {
  test('/api/cms serves the live Airtable property feed', async ({ request }) => {
    const res = await request.get('/api/cms?type=properties');
    expect(res.status()).toBe(200);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.properties || data.records || data.data;
    expect(Array.isArray(list), `unexpected /api/cms shape: ${JSON.stringify(data).slice(0, 300)}`).toBe(true);
    expect(list.length).toBeGreaterThan(0);

    // Dual-CMS golden rule: public payloads must never leak private state.
    const sample = JSON.stringify(list[0] || {});
    expect(sample).not.toMatch(/service_role|supabase_service|access_token/i);
  });

  test('/api/health reports service status in the expected shape', async ({ request }) => {
    const res = await request.get('/api/health');
    expect([200, 503]).toContain(res.status());
    const body = await res.json();
    expect(body.services).toBeTruthy();
    expect(body.services.api).toBe('healthy');
    // Surface degraded services in the report without failing the suite run —
    // a dead upstream is a finding, not a test bug. But Supabase and Airtable
    // are both configured locally, so they must at least respond.
    expect(['healthy', 'unhealthy', 'unconfigured']).toContain(body.services.supabase);
    expect(['healthy', 'unhealthy', 'unconfigured']).toContain(body.services.airtable);
  });
});

test.describe('Auth walls on mutation routes', () => {
  // Every one of these must reject an anonymous request. 2xx here would mean
  // an open write path into live data.
  const PROTECTED_MUTATIONS = [
    { method: 'POST', path: '/api/dashboard/publish', body: { submissionId: 'e2e-void' } },
    { method: 'POST', path: '/api/dashboard/delete', body: { submissionId: 'e2e-void' } },
    { method: 'POST', path: '/api/dashboard/update', body: { submissionId: 'e2e-void', data: {} } },
    { method: 'POST', path: '/api/dashboard/archive', body: { submissionId: 'e2e-void' } },
    { method: 'POST', path: '/api/dashboard/invite', body: { listingId: 'e2e-void' } },
    { method: 'POST', path: '/api/deals/initiate', body: { propertyId: 'e2e-void' } },
    { method: 'POST', path: '/api/crm/tasks', body: { title: 'e2e-void' } },
    { method: 'POST', path: '/api/admin/approve', body: { recordId: 'e2e-void' } },
    { method: 'POST', path: '/api/badges/claim', body: { badgeId: 'e2e-void' } },
    { method: 'POST', path: '/api/storage/upload', body: {} },
    {
      method: 'POST',
      path: '/api/viewing-appointments',
      body: { dealId: 'e2e-void', scheduledAt: new Date().toISOString() },
    },
    {
      method: 'PATCH',
      path: '/api/viewing-appointments/e2e-void',
      body: { status: 'confirmed' },
    },
  ];

  for (const { method, path, body } of PROTECTED_MUTATIONS) {
    test(`${method} ${path} rejects anonymous requests`, async ({ request }) => {
      const res = await request.fetch(path, { method, data: body });
      expect(
        res.status(),
        `${path} answered ${res.status()} to an unauthenticated ${method} — expected a 4xx auth rejection`
      ).toBeGreaterThanOrEqual(400);
      expect(res.status()).toBeLessThan(500);
    });
  }

  test('GET /api/notifications rejects anonymous requests', async ({ request }) => {
    const res = await request.get('/api/notifications');
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  const ADMIN_ENDPOINTS = [
    { method: 'GET', path: '/api/admin/connects-refund' },
    { method: 'POST', path: '/api/admin/connects-refund', body: { userId: 'e2e-void', amount: 1 } },
    { method: 'GET', path: '/api/admin/feature-flags' },
    { method: 'POST', path: '/api/admin/feature-flags', body: { id: 'e2e-void', is_enabled: false } },
    { method: 'POST', path: '/api/admin/generate-seo', body: { propertyId: 'e2e-void' } },
    { method: 'GET', path: '/api/admin/osint' },
    { method: 'POST', path: '/api/admin/osint', body: { action: 'e2e-void' } },
    { method: 'GET', path: '/api/admin/prc' },
    { method: 'POST', path: '/api/admin/prc', body: { action: 'e2e-void' } },
    { method: 'GET', path: '/api/admin/property?id=e2e-void' },
    { method: 'PATCH', path: '/api/admin/property', body: { id: 'e2e-void' } },
  ];

  for (const { method, path, body } of ADMIN_ENDPOINTS) {
    test(`${method} ${path} uses the shared anonymous-denial gate`, async ({ request }) => {
      const options = body ? { method, data: body } : { method };
      const res = await request.fetch(path, options);
      expect(res.status(), `${path} did not reject an anonymous ${method}`).toBe(401);
    });
  }
});
