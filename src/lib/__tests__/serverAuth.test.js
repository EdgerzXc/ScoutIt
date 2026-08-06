import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveServerTier } from '../serverAuth.js';
import * as featureFlags from '../featureFlags.js';
import * as supabaseAdminModule from '../supabaseAdmin.js';

vi.mock('../featureFlags.js', () => ({
  isPreLaunchFreeMode: vi.fn(),
}));

vi.mock('../supabaseAdmin.js', () => ({
  supabaseAdmin: {
    from: vi.fn(),
  },
}));

describe('serverAuth — resolveServerTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns universe tier when pre-launch free mode is enabled', async () => {
    vi.spyOn(featureFlags, 'isPreLaunchFreeMode').mockResolvedValue(true);
    const req = new Request('https://www.scoutit.space/api/test');
    
    const result = await resolveServerTier(req);
    expect(result).toEqual({ tier: 'universe', freeMode: true });
  });

  it('returns starry tier for unauthenticated users when free mode is off', async () => {
    vi.spyOn(featureFlags, 'isPreLaunchFreeMode').mockResolvedValue(false);
    const req = new Request('https://www.scoutit.space/api/test');
    
    const result = await resolveServerTier(req);
    expect(result).toEqual({ tier: 'starry', freeMode: false });
  });
});
