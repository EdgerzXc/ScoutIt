import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/property/verify/route';
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

describe('/api/property/verify API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/property/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: 'prop-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 404 when property does not exist', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-owner');

    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/property/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: 'non-existent-prop' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('updates lastVerifiedDate and returns fresh status for owner', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-owner');

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === 'properties') {
        return {
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'prop-uuid-1', slug: 'bgc-condo', owner_id: 'user-owner', status: 'LIVE' },
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'supabase_audit_logs') {
        return {
          insert: vi.fn().mockReturnValue({
            catch: vi.fn().mockReturnValue(null),
          }),
        };
      }
      return {};
    });

    const req = new Request('https://www.scoutit.space/api/property/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: 'bgc-condo', verificationType: 'owner_attestation' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.freshness.id).toBe('fresh');
    expect(json.freshness.rankModifier).toBe(0);
  });
});
