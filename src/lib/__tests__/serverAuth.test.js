import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveServerTier, resolveUserId } from '../serverAuth.js';
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

describe('serverAuth local E2E identity boundary', () => {
  it('accepts a mock identity only on the flagged localhost server', async () => {
    process.env.SCOUTIT_E2E = '1';
    const request = new Request('http://localhost:3000/api/crm/deals', {
      headers: { 'x-mock-user-id': 'master-dev' },
    });

    await expect(resolveUserId(request)).resolves.toBe('master-dev');
    delete process.env.SCOUTIT_E2E;
  });

  it('never accepts the E2E mock identity on the public host', async () => {
    process.env.SCOUTIT_E2E = '1';
    const request = new Request('https://www.scoutit.space/api/crm/deals', {
      headers: { 'x-mock-user-id': 'master-dev' },
    });

    await expect(resolveUserId(request)).resolves.toBeNull();
    delete process.env.SCOUTIT_E2E;
  });
});
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
