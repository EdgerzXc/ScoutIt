import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────
// §59 · W18.2. This endpoint was complete and had ZERO callers, so
// `analytics_events` had 0 rows and the Monthly Scout Wrap could only ever
// report zero (Rule 21).
//
// The two tests that matter most here are the opt-out ones. `telemetry_opt_out`
// is a real toggle in PrivacyShieldPanel that, until now, NOTHING read. Giving
// this endpoint a caller without enforcing it would have started collecting
// from people who had explicitly switched it off — worse than never collecting.
// ─────────────────────────────────────────────────────────────────────────

const trackAnalyticsEvent = vi.fn(async () => true);
vi.mock('@/lib/monthlyScoutWrap', () => ({
  trackAnalyticsEvent: (...a) => trackAnalyticsEvent(...a),
}));

const findProperty = vi.fn(async () => ({ property: { id: 'uuid-1' }, error: null }));
vi.mock('@/lib/propertyLookup', () => ({ findProperty: (...a) => findProperty(...a) }));

const resolveUserId = vi.fn(async () => null);
vi.mock('@/lib/serverAuth', () => ({ resolveUserId: (...a) => resolveUserId(...a) }));

const maybeSingle = vi.fn(async () => ({ data: { telemetry_opt_out: false }, error: null }));
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) },
}));

const { POST } = await import('@/app/api/analytics/route');

const req = (body) =>
  new Request('https://www.scoutit.space/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'user-agent': 'jest' },
    body: JSON.stringify(body),
  });

describe('/api/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    trackAnalyticsEvent.mockResolvedValue(true);
    findProperty.mockResolvedValue({ property: { id: 'uuid-1' }, error: null });
    resolveUserId.mockResolvedValue(null);
    maybeSingle.mockResolvedValue({ data: { telemetry_opt_out: false }, error: null });
  });

  it('records an anonymous property view', async () => {
    const res = await POST(req({ eventType: 'property_view', propertySlug: 'bgc-condo' }));

    expect(res.status).toBe(200);
    expect(trackAnalyticsEvent).toHaveBeenCalledTimes(1);
    expect((await res.json()).recorded).toBe(true);
  });

  // The trap: property_id FKs to properties(id) as a uuid, but public pages
  // only ever hold a slug. Passing the slug through fails on every event.
  it('resolves a slug to the real uuid before recording', async () => {
    await POST(req({ eventType: 'property_view', propertySlug: 'bgc-condo' }));

    expect(findProperty).toHaveBeenCalled();
    expect(trackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: 'uuid-1' })
    );
  });

  it('drops the property reference when the slug cannot be resolved, rather than sending a bad FK', async () => {
    findProperty.mockResolvedValue({ property: null, error: null });

    const res = await POST(req({ eventType: 'property_view', propertySlug: 'ghost' }));

    expect(res.status).toBe(200);
    expect(trackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ propertyId: null })
    );
  });

  // ── The privacy promise ────────────────────────────────────────────────

  it('records NOTHING for a signed-in user who opted out of telemetry', async () => {
    resolveUserId.mockResolvedValue('user-1');
    maybeSingle.mockResolvedValue({ data: { telemetry_opt_out: true }, error: null });

    const res = await POST(req({ eventType: 'property_view', propertySlug: 'bgc-condo' }));

    expect(res.status).toBe(200);
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
    expect((await res.json())).toMatchObject({ recorded: false, reason: 'opted_out' });
  });

  it('records nothing when the opt-out preference cannot be read (Rule 14)', async () => {
    resolveUserId.mockResolvedValue('user-1');
    maybeSingle.mockResolvedValue({ data: null, error: new Error('db down') });

    await POST(req({ eventType: 'property_view', propertySlug: 'bgc-condo' }));
    // "We could not read your preference" is not consent.
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('still records for a signed-in user who has NOT opted out', async () => {
    resolveUserId.mockResolvedValue('user-1');

    await POST(req({ eventType: 'property_view', propertySlug: 'bgc-condo' }));

    expect(trackAnalyticsEvent).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' })
    );
  });

  // ── Event vocabulary (Rule 4) ──────────────────────────────────────────

  it('rejects an event type the wrap RPC does not count', async () => {
    const res = await POST(req({ eventType: 'propertyView', propertySlug: 'x' }));

    expect(res.status).toBe(400);
    expect(trackAnalyticsEvent).not.toHaveBeenCalled();
  });

  it('rejects a missing event type', async () => {
    expect((await POST(req({ propertySlug: 'x' }))).status).toBe(400);
  });

  it.each(['property_view', 'property_save'])('accepts %s, which the RPC counts', async (eventType) => {
    const res = await POST(req({ eventType, propertySlug: 'bgc-condo' }));
    expect(res.status).toBe(200);
  });

  // ── Viewer key ─────────────────────────────────────────────────────────

  it('sends a viewer key and never the raw IP', async () => {
    const request = new Request('https://www.scoutit.space/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.9' },
      body: JSON.stringify({ eventType: 'property_view', propertySlug: 'bgc-condo' }),
    });

    await POST(request);

    const arg = trackAnalyticsEvent.mock.calls[0][0];
    expect(arg.viewerKey).toHaveLength(24);
    expect(JSON.stringify(arg)).not.toContain('203.0.113.9');
  });
});
