import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/seo/readiness/route';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe('/api/seo/readiness API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing propertyId with 400', async () => {
    const req = new Request('https://www.scoutit.space/api/seo/readiness');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when property is not found', async () => {
    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/seo/readiness?propertyId=missing-slug');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns readiness score and index eligibility for valid property', async () => {
    const mockProp = {
      id: 'prop-uuid-1',
      slug: 'bgc-luxury-office-space',
      title: 'Luxury BGC Office Space with Panoramic View',
      city: 'Taguig',
      address: '7th Ave, BGC, Taguig',
      price: 150000,
      description: 'This is a premium commercial office space located in the heart of Bonifacio Global City, Taguig with 24/7 security and high speed internet.',
      photos: ['https://img.scoutit.space/1.jpg', 'https://img.scoutit.space/2.jpg', 'https://img.scoutit.space/3.jpg'],
      lat: 14.5494,
      lng: 121.0480,
      category: 'Commercial',
      status: 'LIVE',
      metadata: { floor: '12th', area_sqm: 250, fitout: 'Fitted' },
    };

    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: mockProp, error: null }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/seo/readiness?propertyId=bgc-luxury-office-space');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.readinessScore).toBe(100);
    expect(json.indexEligible).toBe(true);
    expect(json.seoChecks.minPhotosPassed).toBe(true);
  });
});
