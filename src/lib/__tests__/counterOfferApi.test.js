import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/ai/counter-offer/route';
import * as serverAuth from '@/lib/serverAuth';

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

describe('/api/ai/counter-offer API endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    const req = new Request('https://www.scoutit.space/api/ai/counter-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyTitle: 'Penthouse' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('generates a Taglish counter-offer for lease requests', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-1');

    const req = new Request('https://www.scoutit.space/api/ai/counter-offer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyTitle: 'One Bonifacio High Street Penthouse',
        askingPrice: '₱ 185,000 / mo',
        offerType: 'lease',
        targetPrice: '₱ 170,000 / mo',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.suggestion).toContain('One Bonifacio High Street Penthouse');
    expect(json.suggestion).toContain('₱ 170,000 / mo');
  });
});
