import { describe, it, expect, vi } from 'vitest';
import { looksLikeUuid, findProperty, PROPERTY_PUBLIC_COLUMNS } from '@/lib/propertyLookup';

/**
 * Minimal supabase-shaped stub. Records every '.eq()' it was given so the tests
 * can assert WHICH COLUMN was queried — the whole point of this module is that
 * a slug never reaches the uuid column.
 */
function stubDb(rowsByColumn = {}, { error = null } = {}) {
  const calls = [];
  const builder = (column, value) => ({
    maybeSingle: async () => {
      calls.push({ column, value });
      if (error) return { data: null, error };
      const match = rowsByColumn[column];
      const hit = match && match.value === value ? match.row : null;
      return { data: hit, error: null };
    },
  });
  return {
    calls,
    from() {
      return {
        select() {
          return { eq: (column, value) => builder(column, value) };
        },
      };
    },
  };
}

describe('looksLikeUuid', () => {
  it('accepts a real uuid, in either case', () => {
    expect(looksLikeUuid('3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe(true);
    expect(looksLikeUuid('3F2504E0-4F89-11D3-9A0C-0305E82C3301')).toBe(true);
  });

  it('rejects slugs, empty values and near-misses', () => {
    expect(looksLikeUuid('bgc-luxury-suite-1')).toBe(false);
    expect(looksLikeUuid('makati-penthouse')).toBe(false);
    expect(looksLikeUuid('')).toBe(false);
    expect(looksLikeUuid(null)).toBe(false);
    expect(looksLikeUuid(undefined)).toBe(false);
    expect(looksLikeUuid(12345)).toBe(false);
    // One character short — must not pass.
    expect(looksLikeUuid('3f2504e0-4f89-11d3-9a0c-0305e82c330')).toBe(false);
  });
});

describe('findProperty — the bug this module exists to fix', () => {
  const UUID = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

  // THE ORIGINAL BUG: `.or('id.eq.<slug>,slug.eq.<slug>')` made Postgres try to
  // cast a slug to uuid. The query errored, and callers reported "Property not
  // found" for a property that exists.
  it('queries `slug` — never `id` — when given a slug', async () => {
    const db = stubDb({ slug: { value: 'bgc-luxury-suite-1', row: { id: UUID } } });
    const { property, error } = await findProperty(db, 'bgc-luxury-suite-1');

    expect(error).toBeNull();
    expect(property).toEqual({ id: UUID });
    expect(db.calls.map((c) => c.column)).not.toContain('id');
  });

  it('queries `id` when given a uuid', async () => {
    const db = stubDb({ id: { value: UUID, row: { id: UUID } } });
    const { property } = await findProperty(db, UUID);

    expect(property).toEqual({ id: UUID });
    expect(db.calls[0].column).toBe('id');
  });

  // A live listing can be reachable by either slug column — publish reconciles
  // the app-generated `slug` with Airtable's computed `canonical_slug`.
  it('falls back to canonical_slug when slug misses', async () => {
    const db = stubDb({ canonical_slug: { value: 'e-com-center', row: { id: UUID } } });
    const { property } = await findProperty(db, 'e-com-center');

    expect(property).toEqual({ id: UUID });
    expect(db.calls.map((c) => c.column)).toEqual(['slug', 'canonical_slug']);
  });

  it('does NOT try canonical_slug after a uuid miss — a uuid has one home', async () => {
    const db = stubDb({});
    const { property } = await findProperty(db, UUID);

    expect(property).toBeNull();
    expect(db.calls.map((c) => c.column)).toEqual(['id']);
  });

  // "Query failed" and "no such row" must stay distinguishable. Collapsing them
  // into one 404 is exactly what hid the broken filter for weeks.
  it('reports a query failure as an error, not as a missing row', async () => {
    const boom = new Error('column properties.status does not exist');
    const db = stubDb({}, { error: boom });
    const { property, error } = await findProperty(db, 'anything');

    expect(property).toBeNull();
    expect(error).toBe(boom);
  });

  it('reports a genuine miss as null property AND null error', async () => {
    const db = stubDb({});
    const { property, error } = await findProperty(db, 'no-such-listing');

    expect(property).toBeNull();
    expect(error).toBeNull();
  });

  it('handles blank, whitespace and non-string input without querying', async () => {
    const db = stubDb({});
    for (const bad of ['', '   ', null, undefined, 42, {}]) {
      const { property, error } = await findProperty(db, bad);
      expect(property).toBeNull();
      expect(error).toBeNull();
    }
    expect(db.calls).toHaveLength(0);
  });

  it('returns an error rather than throwing when there is no db client', async () => {
    const { property, error } = await findProperty(null, 'x');
    expect(property).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('trims the key before deciding uuid-vs-slug', async () => {
    const db = stubDb({ id: { value: UUID, row: { id: UUID } } });
    const { property } = await findProperty(db, `  ${UUID}  `);
    expect(property).toEqual({ id: UUID });
    expect(db.calls[0].column).toBe('id');
  });
});

describe('PROPERTY_PUBLIC_COLUMNS', () => {
  // Verified against the live database 2026-08-06. The old readiness route read
  // six columns that do not exist; this list is the antidote, so it must not
  // quietly regain one.
  const NOT_REAL = ['address', 'photos', 'category', 'property_type', 'metadata', 'status', 'lat', 'lng'];

  it('contains no column that does not exist on public.properties', () => {
    for (const ghost of NOT_REAL) {
      expect(PROPERTY_PUBLIC_COLUMNS).not.toContain(ghost);
    }
  });

  // Internal-only columns (§50, W16) must never ride along in a default select.
  it('excludes the internal-only declaration columns', () => {
    expect(PROPERTY_PUBLIC_COLUMNS).not.toContain('lister_relationship');
    expect(PROPERTY_PUBLIC_COLUMNS).not.toContain('owner_claim_agreed');
  });

  it('includes the columns the readiness audit actually needs', () => {
    for (const needed of ['title', 'description', 'location', 'details', 'coordinates', 'media_link', 'lifecycle_state']) {
      expect(PROPERTY_PUBLIC_COLUMNS).toContain(needed);
    }
  });
});
