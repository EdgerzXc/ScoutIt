import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/property/claim/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe('/api/property/claim endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/property/claim', {
      method: 'POST',
      body: JSON.stringify({ propertyId: 'prop-1', claimedRelationship: 'direct_owner' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid relationship with 400', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    const req = new Request('https://www.scoutit.space/api/property/claim', {
      method: 'POST',
      body: JSON.stringify({ propertyId: 'prop-1', claimedRelationship: 'invalid_type' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('inserts valid claim and logs event', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    const mockInsertClaim = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'claim-123', status: 'submitted' },
          error: null,
        }),
      }),
    });

    const mockInsertEvent = vi.fn().mockResolvedValue({ data: null, error: null });

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === 'property_claims') {
        return { select: mockSelect, insert: mockInsertClaim };
      }
      if (table === 'property_claim_events') {
        return { insert: mockInsertEvent };
      }
      return {};
    });

    const req = new Request('https://www.scoutit.space/api/property/claim', {
      method: 'POST',
      body: JSON.stringify({ propertyId: 'prop-101', claimedRelationship: 'direct_owner' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.claimId).toBe('claim-123');
  });
});
