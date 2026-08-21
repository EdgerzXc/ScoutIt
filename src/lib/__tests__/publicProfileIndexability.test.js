import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─────────────────────────────────────────────────────────────────────────
// Owner ruling 2026-08-16: index ONLY profiles that are real and explicitly
// made public by the person. Samples, private profiles and pilot identities
// stay out of the index.
//
// Every test here asserts a DENIAL, because that is the direction that fails
// dangerously — a profile wrongly indexed is a privacy incident that Google
// caches, while a profile wrongly excluded is a support ticket.
//
// The specific bug this locks down: before 2026-08-20 an unresolved username
// returned metadata with NO robots directive at all, and "no directive" means
// indexable. The gate is therefore written as an allowlist, and the test that
// matters most is the one where the profile does not exist.
// ─────────────────────────────────────────────────────────────────────────

const maybeSingle = vi.fn();
const eq = vi.fn(() => ({ maybeSingle, is: () => ({ maybeSingle }) }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));

vi.mock('@/lib/supabaseAdmin', () => ({ supabaseAdmin: { from: (...a) => from(...a) } }));
vi.mock('@/lib/siteUrl', () => ({ siteUrl: (p) => `https://www.scoutit.space${p || ''}` }));

const { generateMetadata } = await import('@/app/profile/[username]/layout');

/**
 * The layout queries `public_profiles` first, then `pilot_participants`.
 * Resolve them in that order.
 *
 * ⚠️ `mockReset`, not `mockClear`. When the profile query returns nothing the
 * layout returns early and NEVER calls the second query, leaving its queued
 * value unconsumed. `vi.clearAllMocks()` clears call history but not queued
 * `mockResolvedValueOnce` values, so that orphan was being handed to the next
 * test as its profile row. Three tests passed for the wrong reason before this
 * was caught by the one test that could not pass accidentally — the positive
 * case. A queued mock that survives its test is a shared fixture nobody
 * declared.
 */
const scenario = ({ profile, pilot = null }) => {
  maybeSingle.mockReset();
  maybeSingle
    .mockResolvedValueOnce({ data: profile, error: profile ? null : { message: 'not found' } })
    .mockResolvedValueOnce({ data: pilot, error: null });
};

const meta = (username = 'Jane Reyes') =>
  generateMetadata({ params: Promise.resolve({ username: encodeURIComponent(username) }) });

const realPublicProfile = {
  id: 'u1',
  display_name: 'Jane Reyes',
  headline: 'Commercial leasing, BGC',
  is_example_account: false,
};

describe('public profile indexability', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not index a username that resolves to no profile', async () => {
    scenario({ profile: null });
    const m = await meta('does-not-exist');
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('does not index a sample/example account', async () => {
    scenario({ profile: { ...realPublicProfile, is_example_account: true } });
    const m = await meta();
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('does not index a pilot participant', async () => {
    scenario({ profile: realPublicProfile, pilot: { user_id: 'u1' } });
    const m = await meta();
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('fails closed when is_example_account is missing or a surprise value', async () => {
    // A negative check (`!== true`) is what keeps this safe, but the reason the
    // whole gate is an allowlist is that unexpected values must not sneak past
    // the OTHER conditions either. An undefined flag on a row the view returned
    // still has to clear every affirmative test.
    scenario({ profile: { id: 'u1', display_name: 'Jane Reyes' }, pilot: { user_id: 'u1' } });
    const m = await meta();
    expect(m.robots).toEqual({ index: false, follow: true });
  });

  it('indexes a real, explicitly public, non-pilot profile', async () => {
    scenario({ profile: realPublicProfile });
    const m = await meta();
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it('always emits an explicit robots directive, never an absent one', async () => {
    // "No directive" is the failure this whole file exists to prevent.
    for (const profile of [null, realPublicProfile, { ...realPublicProfile, is_example_account: true }]) {
      vi.clearAllMocks();
      scenario({ profile });
      const m = await meta();
      expect(m.robots).toBeDefined();
      expect(typeof m.robots.index).toBe('boolean');
    }
  });

  it('canonicalises to /profile/[username] in every case', async () => {
    scenario({ profile: null });
    const m = await meta('does-not-exist');
    expect(m.alternates.canonical).toBe('https://www.scoutit.space/profile/does-not-exist');
  });
});
