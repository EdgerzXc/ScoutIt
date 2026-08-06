import { describe, it, expect } from 'vitest';
import {
  LISTER_RELATIONSHIPS,
  LISTER_RELATIONSHIP_VALUES,
  DISCLAIMER_VERSION,
  OWNER_SOVEREIGNTY_DISCLAIMER,
  validateDeclaration,
  isClaimable,
  relationshipLabel,
  hasValidAgreement,
} from '../listerRelationship.js';

// RESA RA 9646. The whole point is that a broker's listing is PROVISIONAL
// until the title holder asserts — so the tests that matter are the ones
// proving an undeclared listing stays claimable and an agreement record is
// real evidence rather than a bare flag.

describe('the three tiers', () => {
  it('has exactly the three §34.3 values', () => {
    expect(LISTER_RELATIONSHIP_VALUES).toEqual([
      'owner',
      'property_manager',
      'authorized_broker',
    ]);
  });

  it('descends by authority — owner outranks manager outranks broker', () => {
    const auth = LISTER_RELATIONSHIPS.map((r) => r.authority);
    expect(auth).toEqual([...auth].sort((a, b) => b - a));
  });

  it('every tier has label and detail text for the UI', () => {
    for (const r of LISTER_RELATIONSHIPS) {
      expect(r.label).toBeTruthy();
      expect(r.detail).toBeTruthy();
    }
  });
});

describe('validateDeclaration', () => {
  it('accepts a valid declaration and returns a timestamped record', () => {
    const r = validateDeclaration('authorized_broker', true);
    expect(r.ok).toBe(true);
    expect(r.relationship).toBe('authorized_broker');
    expect(r.agreementRecord.agreed).toBe(true);
    expect(r.agreementRecord.disclaimer_version).toBe(DISCLAIMER_VERSION);
    expect(Number.isNaN(new Date(r.agreementRecord.timestamp).getTime())).toBe(false);
  });

  // §34.3 is explicit that this must not be a bare boolean.
  it('records WHEN and WHICH VERSION, not just that they agreed', () => {
    const { agreementRecord } = validateDeclaration('owner', true);
    expect(Object.keys(agreementRecord).sort()).toEqual([
      'agreed', 'disclaimer_version', 'timestamp',
    ]);
  });

  it('rejects publication when the disclaimer is not acknowledged', () => {
    const r = validateDeclaration('owner', false);
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/acknowledge/i);
  });

  it.each([[null], [undefined], [''], ['landlord'], ['OWNER'], [123]])(
    'rejects an invalid relationship (%s)',
    (input) => {
      expect(validateDeclaration(input, true).ok).toBe(false);
    },
  );

  // A truthy-but-not-true value must not pass a legal acknowledgment.
  it.each([['yes'], [1], ['true'], [{}]])(
    'requires agreed === true, not merely truthy (%s)',
    (input) => {
      expect(validateDeclaration('owner', input).ok).toBe(false);
    },
  );
});

describe('isClaimable — who gets the "Claim This Property" CTA (§37.2)', () => {
  it('is false for an owner-declared listing', () => {
    expect(isClaimable({ lister_relationship: 'owner' })).toBe(false);
  });

  it('is true for broker and manager listings — they are provisional', () => {
    expect(isClaimable({ lister_relationship: 'authorized_broker' })).toBe(true);
    expect(isClaimable({ lister_relationship: 'property_manager' })).toBe(true);
  });

  // The important one: every listing created before 2026-08-06 is NULL, and
  // those are the likeliest to need claiming since nobody was ever asked.
  it('is TRUE for an undeclared listing — silence is not ownership', () => {
    expect(isClaimable({ lister_relationship: null })).toBe(true);
    expect(isClaimable({})).toBe(true);
  });

  it('is false once an owner is verified — that needs the dispute path', () => {
    expect(isClaimable({ lister_relationship: 'authorized_broker', owner_verified: true })).toBe(false);
  });

  it('is false for a missing property rather than throwing', () => {
    expect(isClaimable(null)).toBe(false);
  });
});

describe('hasValidAgreement — a record must be usable evidence', () => {
  const good = { agreed: true, timestamp: '2026-08-06T00:00:00.000Z', disclaimer_version: 'v1' };

  it('accepts a complete record', () => {
    expect(hasValidAgreement(good)).toBe(true);
  });

  it.each([
    ['not agreed', { ...good, agreed: false }],
    ['missing timestamp', { agreed: true, disclaimer_version: 'v1' }],
    ['invalid timestamp', { ...good, timestamp: 'garbage' }],
    ['missing version', { agreed: true, timestamp: good.timestamp }],
    ['a bare boolean', true],
    ['null', null],
  ])('rejects %s', (_label, input) => {
    expect(hasValidAgreement(input)).toBe(false);
  });
});

describe('relationshipLabel', () => {
  it('returns the human label', () => {
    expect(relationshipLabel('owner')).toBe('Direct Property Owner');
  });

  it('returns null for unknown — an undeclared listing reads as undeclared', () => {
    expect(relationshipLabel(null)).toBeNull();
    expect(relationshipLabel('wibble')).toBeNull();
  });
});

describe('the disclaimer text', () => {
  it('is versioned, so edits are traceable', () => {
    expect(DISCLAIMER_VERSION).toMatch(/^v\d+$/);
  });

  // If this text changes without the version changing, every stored record
  // becomes a claim that someone agreed to wording they never saw.
  it('still states the owner reclaim right', () => {
    expect(OWNER_SOVEREIGNTY_DISCLAIMER).toMatch(/Owner Sovereignty/);
    expect(OWNER_SOVEREIGNTY_DISCLAIMER).toMatch(/claim, re-assign, or manage/);
  });
});
