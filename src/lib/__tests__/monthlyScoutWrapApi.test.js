import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/wrap/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('/api/wrap API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/wrap?entityType=property&entityId=prop-1');

    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('rejects invalid entityType with 400', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    const req = new Request('https://www.scoutit.space/api/wrap?entityType=invalid_type&entityId=prop-1');

    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns cached report when available', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');

    const mockCachedData = { unique_monthly_eyes: 42, total_property_views: 120 };
    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { report_data: mockCachedData, generated_at: '2026-08-01T00:00:00Z' },
                error: null,
              }),
            }),
          }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/wrap?entityType=property&entityId=prop-1&periodMonth=2026-07');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.source).toBe('cache');
    expect(json.data.unique_monthly_eyes).toBe(42);
  });
});
