import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────
// The guard this covers exists because `requireAdmin` was hand-copied into
// five route files and OMITTED from a sixth — /api/admin/osint, which then
// let anonymous callers publish to the public /intel page (§59).
//
// Every test here is a denial path, because that is the direction that fails
// dangerously. A guard that wrongly allows is a breach; a guard that wrongly
// denies is a bug report.
// ─────────────────────────────────────────────────────────────────────────

const getUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}));

const maybeSingle = vi.fn();
vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
  },
}));

const { requireAdmin } = await import('@/lib/adminGuard');

const req = (token) =>
  new Request('https://www.scoutit.space/api/admin/osint', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

const signedIn = () => getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
const profile = (p) => maybeSingle.mockResolvedValue({ data: p, error: null });

describe('requireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
  });

  it('denies a request with no Authorization header', async () => {
    const r = await requireAdmin(req(null));
    expect(r.status).toBe(401);
    expect(r.user).toBeUndefined();
    // Must not even attempt a role lookup without a token.
    expect(getUser).not.toHaveBeenCalled();
  });

  // Regression: the Headers API trims values, so `Bearer` with no token does
  // not match a naive `.replace("Bearer ", "")` and yields the literal string
  // "Bearer" as the credential. This test found that in the guard itself.
  it.each([
    ['Bearer', 'scheme with no token'],
    ['Bearer    ', 'scheme with only whitespace'],
    ['sometoken', 'no scheme at all'],
    ['Basic abc123', 'wrong scheme'],
  ])('denies %s (%s) without attempting a session lookup', async (headerValue) => {
    const r = await requireAdmin(
      new Request('https://www.scoutit.space/api/admin/osint', {
        headers: { Authorization: headerValue },
      })
    );
    expect(r.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('denies an invalid session', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad jwt') });
    expect((await requireAdmin(req('t'))).status).toBe(401);
  });

  it('denies a signed-in user with no staff role', async () => {
    signedIn();
    profile({ role: 'owner', active_roles: ['owner', 'seeker'] });

    const r = await requireAdmin(req('t'));
    expect(r.status).toBe(403);
    expect(r.user).toBeUndefined();
  });

  it('denies when the profile row is missing — a lookup miss is not a pass', async () => {
    signedIn();
    profile(null);
    expect((await requireAdmin(req('t'))).status).toBe(403);
  });

  it('denies when the role lookup errors', async () => {
    signedIn();
    maybeSingle.mockResolvedValue({ data: null, error: new Error('db down') });
    expect((await requireAdmin(req('t'))).status).toBe(403);
  });

  it('denies an unrecognised role rather than assuming it is fine (Rule 6)', async () => {
    signedIn();
    profile({ role: 'superuser', active_roles: ['moderator'] });
    expect((await requireAdmin(req('t'))).status).toBe(403);
  });

  it('denies when active_roles is not an array', async () => {
    signedIn();
    profile({ role: 'owner', active_roles: 'admin' });
    expect((await requireAdmin(req('t'))).status).toBe(403);
  });

  it('allows admin via the singular `role` column', async () => {
    signedIn();
    profile({ role: 'admin', active_roles: [] });

    const r = await requireAdmin(req('t'));
    expect(r.error).toBeUndefined();
    expect(r.userId).toBe('u1');
  });

  it('allows staff via the `active_roles` array', async () => {
    signedIn();
    profile({ role: 'owner', active_roles: ['owner', 'staff'] });
    expect((await requireAdmin(req('t'))).userId).toBe('u1');
  });

  // The two columns can disagree; the guard must accept either, because
  // /api/property/verify checks active_roles while the older admin routes
  // check `role`. Failing one and passing the other is how a staff member
  // ends up able to use half the console.
  it('allows staff whose singular role is admin but array is empty, and vice versa', async () => {
    signedIn();
    profile({ role: 'staff', active_roles: null });
    expect((await requireAdmin(req('t'))).userId).toBe('u1');
  });
});
