import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/user/delete-account/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: vi.fn(),
    auth: {
      admin: {
        deleteUser: vi.fn(),
      },
    },
  },
}));

describe('/api/user/delete-account endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/user/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('requires exact confirmation text', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    const req = new Request('https://www.scoutit.space/api/user/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'wrong text' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('executes deletion and returns success when confirmed', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });

    supabaseAdmin.from = vi.fn().mockImplementation((table) => {
      if (table === 'user_profiles') return { update: mockUpdate };
      if (table === 'supabase_audit_logs') return { insert: mockInsert };
      return { delete: mockDelete };
    });

    supabaseAdmin.auth.admin.deleteUser = vi.fn().mockResolvedValue({ error: null });

    const req = new Request('https://www.scoutit.space/api/user/delete-account', {
      method: 'POST',
      body: JSON.stringify({ confirm: 'DELETE MY ACCOUNT' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
