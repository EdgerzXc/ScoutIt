import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '@/app/api/user/privacy-settings/route';
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

describe('/api/user/privacy-settings API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated GET requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/user/privacy-settings');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('returns privacy settings for authenticated user', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');

    supabaseAdmin.from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: {
              is_profile_public: true,
              telemetry_opt_out: false,
              marketing_opt_out: true,
              adult_eligibility_status: 'declared_adult',
            },
            error: null,
          }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/user/privacy-settings');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.settings.isProfilePublic).toBe(true);
    expect(json.settings.marketingOptOut).toBe(true);
  });

  it('updates privacy settings via POST', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');

    supabaseAdmin.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                is_profile_public: false,
                telemetry_opt_out: true,
                marketing_opt_out: true,
              },
              error: null,
            }),
          }),
        }),
      }),
    });

    const req = new Request('https://www.scoutit.space/api/user/privacy-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isProfilePublic: false, telemetryOptOut: true }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.settings.isProfilePublic).toBe(false);
    expect(json.settings.telemetryOptOut).toBe(true);
  });
});
