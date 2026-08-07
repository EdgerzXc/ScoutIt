import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '@/app/api/property/claim/route';
import * as serverAuth from '@/lib/serverAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// ─────────────────────────────────────────────────────────────────────────
// ⚠️ REWRITTEN 2026-08-06 (§55, §56).
//
// The old file asserted that `claimedRelationship: 'direct_owner'` was valid.
// It was — to this route, and to nothing else. `properties.lister_relationship`
// and `src/lib/listerRelationship.js` spell the same concept 'owner'. The test
// locked in the WRONG HALF of a two-vocabulary bug, so it would have blocked
// the fix rather than caught the problem.
//
// Migration 20260806000006 unifies the database on the canonical values; the
// legacy spellings are still ACCEPTED as input (so a stale client can't 400)
// but are always STORED canonically. Both halves are asserted below.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/serverAuth', () => ({
  resolveUserId: vi.fn(),
}));

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: { from: vi.fn() },
}));

const PROP = {
  id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  slug: 'prop-101',
  canonical_slug: 'prop-101',
  title: 'Broker-listed Tower',
  owner_id: 'someone-else',
  verified: false,
  // NULL — "never asked". Every listing in the database is in this state, and
  // it is CLAIMABLE. Silence is not ownership (§50).
  lister_relationship: null,
};

function mockDb({ property = PROP, existingClaim = null, insertError = null } = {}) {
  const inserted = [];
  supabaseAdmin.from = vi.fn().mockImplementation((table) => {
    if (table === 'properties') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: property, error: null }),
          }),
        }),
      };
    }
    if (table === 'property_claims') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existingClaim, error: null }),
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: existingClaim, error: null }),
                  }),
                }),
              }),
            }),
          }),
        }),
        insert: vi.fn().mockImplementation((row) => {
          inserted.push(row);
          return {
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: insertError ? null : { id: 'claim-123', status: 'submitted', ...row },
                error: insertError,
              }),
            }),
          };
        }),
      };
    }
    if (table === 'property_claim_events') {
      return {
        insert: vi.fn().mockImplementation((row) => {
          inserted.push(row);
          return Promise.resolve({ error: null });
        }),
      };
    }
    return {};
  });
  return inserted;
}

function post(body) {
  return new Request('https://www.scoutit.space/api/property/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID = { propertyId: 'prop-101', claimedRelationship: 'owner', agreed: true };

describe('/api/property/claim — POST', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    expect((await POST(post(VALID))).status).toBe(401);
  });

  it('rejects an invalid relationship with 400', async () => {
    expect((await POST(post({ ...VALID, claimedRelationship: 'invalid_type' }))).status).toBe(400);
  });

  // Never defaulted. A default here would manufacture the strongest possible
  // claim — ownership — out of a typo (§47.2, §50).
  it('rejects a missing relationship rather than defaulting to owner', async () => {
    expect((await POST(post({ propertyId: 'prop-101', agreed: true }))).status).toBe(400);
  });

  // `=== true` only, matching the publish gate exactly. A truthy value is not
  // an acknowledgement of a legal disclaimer.
  it('rejects a truthy-but-not-true acknowledgement', async () => {
    mockDb();
    for (const agreed of ['yes', 1, {}, 'true']) {
      expect((await POST(post({ ...VALID, agreed }))).status).toBe(400);
    }
  });

  it('accepts a canonical relationship and stores it verbatim', async () => {
    const inserted = mockDb();
    const res = await POST(post(VALID));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.claimId).toBe('claim-123');
    expect(inserted[0].claimed_relationship).toBe('owner');
    // The resolved uuid, not the caller's slug — the column is TEXT, so a slug
    // would insert happily and then join to nothing.
    expect(inserted[0].property_id).toBe(PROP.id);
  });

  // THE VOCABULARY BUG, both directions asserted.
  it('accepts the legacy spellings but never STORES them', async () => {
    for (const [legacy, canonical] of [
      ['direct_owner', 'owner'],
      ['authorized_manager', 'property_manager'],
      ['authorized_broker', 'authorized_broker'],
    ]) {
      const inserted = mockDb();
      const res = await POST(post({ ...VALID, claimedRelationship: legacy }));
      expect(res.status).toBe(200);
      expect(inserted[0].claimed_relationship).toBe(canonical);
    }
  });

  it('writes an audit event carrying what the listing claimed at the time', async () => {
    const inserted = mockDb();
    await POST(post(VALID));
    const event = inserted.find((r) => r.event_type === 'CLAIM_SUBMITTED');
    expect(event).toBeTruthy();
    expect(event.payload.relationship).toBe('owner');
    expect(event.payload).toHaveProperty('property_lister_relationship');
  });

  it('404s when the property does not exist', async () => {
    mockDb({ property: null });
    expect((await POST(post(VALID))).status).toBe(404);
  });

  it('409s when the claimant already owns the listing', async () => {
    mockDb({ property: { ...PROP, owner_id: 'user-123' } });
    expect((await POST(post(VALID))).status).toBe(409);
  });

  // An owner-declared or owner-verified listing goes through disputes, not
  // through the claim flow.
  it('409s when the listing is already owner-verified', async () => {
    mockDb({ property: { ...PROP, verified: true } });
    expect((await POST(post(VALID))).status).toBe(409);
  });

  it('409s when the listing is already owner-declared', async () => {
    mockDb({ property: { ...PROP, lister_relationship: 'owner' } });
    expect((await POST(post(VALID))).status).toBe(409);
  });

  it('409s on a duplicate active claim by the same user', async () => {
    mockDb({ existingClaim: { id: 'claim-existing', status: 'submitted' } });
    expect((await POST(post(VALID))).status).toBe(409);
  });

  it('surfaces an insert failure as a 500', async () => {
    mockDb({ insertError: new Error('constraint violation') });
    expect((await POST(post(VALID))).status).toBe(500);
  });
});

describe('/api/property/claim — GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function get(id = 'prop-101') {
    return new Request(
      `https://www.scoutit.space/api/property/claim?propertyId=${encodeURIComponent(id)}`
    );
  }

  it('400s without a propertyId', async () => {
    const res = await GET(new Request('https://www.scoutit.space/api/property/claim'));
    expect(res.status).toBe(400);
  });

  // NULL lister_relationship means "never asked", and that is CLAIMABLE.
  it('reports a NULL-declaration listing as claimable', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    mockDb();
    const json = await (await GET(get())).json();
    expect(json.claimable).toBe(true);
    expect(json.isOwnListing).toBe(false);
  });

  it('reports an owner-declared listing as not claimable', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    mockDb({ property: { ...PROP, lister_relationship: 'owner' } });
    const json = await (await GET(get())).json();
    expect(json.claimable).toBe(false);
  });

  // Whether SOMEBODY ELSE has a claim open is not public — it would leak
  // "this property is contested" to anyone who asks.
  it('tells an anonymous caller nothing about any person', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue(null);
    mockDb({ existingClaim: { id: 'claim-x', status: 'submitted' } });
    const json = await (await GET(get())).json();

    expect(json.signedIn).toBe(false);
    expect(json.myClaim).toBeNull();
    expect(json.isOwnListing).toBe(false);
    expect(json).not.toHaveProperty('propertyTitle');
  });

  it('404s when the property does not exist', async () => {
    vi.spyOn(serverAuth, 'resolveUserId').mockResolvedValue('user-123');
    mockDb({ property: null });
    expect((await GET(get('nope'))).status).toBe(404);
  });
});
