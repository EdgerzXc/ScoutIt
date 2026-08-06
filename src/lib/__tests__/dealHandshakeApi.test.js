import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/deals/handshake/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// assertAdultEligibility joined this module in §48 — the handshake exchanges
// real contact details, so it is age-gated. Mocking it eligible by default
// keeps these tests about the handshake; the gate has its own test below.
vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
  assertAdultEligibility: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe('/api/deals/handshake API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/deals/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: 'deal-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('calls complete_transaction_handshake RPC on sign action', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-buyer');
    vi.spyOn(serverAuth, 'assertAdultEligibility').mockResolvedValue(true);

    supabaseAdmin.rpc = vi.fn().mockResolvedValue({
      data: [{ success: true, rating_updated: true, handshake_status: 'completed' }],
      error: null,
    });

    const req = new Request('https://www.scoutit.space/api/deals/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: 'deal-100', action: 'sign' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.status).toBe('completed');
    expect(json.ratingUpdated).toBe(true);
  });

  // §48 — a handshake exchanges phone numbers and emails between two people.
  // Of everything ScoutIt does this most needs a capacitated adult on both
  // ends, so the gate must hold here even for a fully authenticated caller.
  it('rejects an age-ineligible user with 403 and never calls the RPC', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-underage');
    vi.spyOn(serverAuth, 'assertAdultEligibility').mockResolvedValue(false);

    supabaseAdmin.rpc = vi.fn();

    const req = new Request('https://www.scoutit.space/api/deals/handshake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dealId: 'deal-101', action: 'sign' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    // The contact reveal must not happen as a side effect before the check.
    expect(supabaseAdmin.rpc).not.toHaveBeenCalled();
  });
});
