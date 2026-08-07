import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/seo/readiness/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ REWRITTEN 2026-08-06 (§56). The previous version of this file PASSED,
// asserting `readinessScore === 100` — while the route was reading six columns
// that do not exist on `public.properties`.
//
// It passed because its fixture supplied `address`, `photos`, `lat`, `lng`,
// `category`, `status` and `metadata`: the same imaginary schema the route
// assumed. The test and the code shared one wrong mental model, so the test
// could only ever confirm it.
//
// Every fixture below now uses REAL column names, verified against the live
// database. If this file ever starts failing because a field "isn't there",
// check the database before changing the test.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

/** A property row as `public.properties` actually stores one. */
const REAL_ROW = {
  id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  slug: 'bgc-luxury-office-space',
  canonical_slug: 'bgc-luxury-office-space',
  title: 'Luxury BGC Office Space with Panoramic View',
  location: '7th Ave, BGC, Taguig',
  price: 150000,
  description:
    'This is a premium commercial office space located in the heart of Bonifacio Global City, Taguig with 24/7 security and high speed internet.',
  media_link: 'https://img.scoutit.space/1.jpg',
  space_category: 'Commercial',
  type: 'office',
  coordinates: 'POINT(121.048 14.5494)',
  lifecycle_state: 'live',
  pipeline_status: 'approved',
  owner_id: 'user-owner',
  details: {
    photos: [
      'https://img.scoutit.space/1.jpg',
      'https://img.scoutit.space/2.jpg',
      'https://img.scoutit.space/3.jpg',
    ],
    floor: '12th',
    area_sqm: 250,
    fitout: 'Fitted',
  },
};

/**
 * Mocks the `.select().eq().maybeSingle()` chain findProperty now uses.
 * `.or()` is deliberately NOT provided — if the route regresses to it, these
 * tests fail loudly instead of quietly matching a mock that shouldn't exist.
 */
function mockProperties(row, { error = null } = {}) {
  supabaseAdmin.from = vi.fn().mockImplementation((table) => {
    if (table === 'properties') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: row, error }),
          }),
        }),
      };
    }
    if (table === 'user_profiles') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { active_roles: [] }, error: null }),
          }),
        }),
      };
    }
    return {};
  });
}

function req(propertyId) {
  const qs = propertyId ? `?propertyId=${encodeURIComponent(propertyId)}` : '';
  return new Request(`https://www.scoutit.space/api/seo/readiness${qs}`);
}

describe('/api/seo/readiness API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-owner');
  });

  it('rejects missing propertyId with 400', async () => {
    expect((await GET(req())).status).toBe(400);
  });

  // ADDED 2026-08-06. The route was fully public: it enumerates exactly what is
  // missing from a listing, which is a map of that listing's weaknesses handed
  // to anyone who asks for it by slug.
  it('rejects anonymous callers with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await GET(req('bgc-luxury-office-space'))).status).toBe(401);
  });

  it('rejects a signed-in stranger with 403', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('somebody-else');
    mockProperties(REAL_ROW);
    expect((await GET(req('bgc-luxury-office-space'))).status).toBe(403);
  });

  it('returns 404 when the property is not found', async () => {
    mockProperties(null);
    expect((await GET(req('missing-slug'))).status).toBe(404);
  });

  // The distinction that hid the bug: a FAILED QUERY used to be reported as a
  // missing row, so a broken filter looked exactly like a nonexistent listing.
  it('returns 500 — not 404 — when the query itself fails', async () => {
    mockProperties(null, { error: new Error('column properties.status does not exist') });
    expect((await GET(req('bgc-luxury-office-space'))).status).toBe(500);
  });

  it('scores a complete live listing and marks it index eligible', async () => {
    mockProperties(REAL_ROW);
    const res = await GET(req('bgc-luxury-office-space'));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.readinessScore).toBe(100);
    expect(json.indexEligible).toBe(true);
    expect(json.seoChecks.minPhotosPassed).toBe(true);
    expect(json.seoChecks.photosCount).toBe(3);
    expect(json.seoChecks.geocoded).toBe(true);
    expect(json.blockers).toEqual([]);
  });

  // THE CASE THE OLD ROUTE GOT WRONG FOR EVERY LISTING IN THE DATABASE.
  // It compared `prop.status === 'LIVE'` — a column that does not exist,
  // against a value that isn't even the right case.
  it('a complete DRAFT scores well but is NOT index eligible', async () => {
    mockProperties({ ...REAL_ROW, lifecycle_state: 'draft', pipeline_status: 'pending' });
    const json = await (await GET(req('bgc-luxury-office-space'))).json();

    expect(json.readinessScore).toBe(100);
    expect(json.indexEligible).toBe(false);
    expect(json.lifecycleState).toBe('draft');
    expect(json.blockers[0]).toMatch(/Publish this listing/i);
  });

  // Photos live in `details`, not in a `photos` column. The old fixture put
  // them at the top level, which is why the photo check appeared to work.
  it('counts photos from details, not from a top-level photos field', async () => {
    mockProperties({ ...REAL_ROW, details: { ...REAL_ROW.details, photos: ['one.jpg'] } });
    const json = await (await GET(req('bgc-luxury-office-space'))).json();

    expect(json.seoChecks.photosCount).toBe(1);
    expect(json.seoChecks.minPhotosPassed).toBe(false);
    expect(json.indexEligible).toBe(false);
  });

  it('every blocker reads as an instruction, not a field name', async () => {
    mockProperties({ id: REAL_ROW.id, owner_id: 'user-owner', lifecycle_state: 'draft' });
    const json = await (await GET(req('bare-listing'))).json();

    expect(json.blockers.length).toBeGreaterThan(2);
    for (const blocker of json.blockers) {
      expect(blocker).not.toMatch(/undefined|null|false/);
    }
  });
});
