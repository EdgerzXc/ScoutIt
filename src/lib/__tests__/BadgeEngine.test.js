import { describe, it, expect } from 'vitest';
import {
  hasBadge,
  getBadgeDetails,
  TRUST_BADGES,
  isPioneerBadge,
  hasAnyPioneerBadge,
  getPioneerBadge,
  formatCharterSeatLabel,
  resolveUserPerks,
  BADGE_DEFINITIONS,
} from '../BadgeEngine.js';

describe('BadgeEngine - hasBadge', () => {
  describe('Happy Paths', () => {
    it('should return true if the user has the specified badge', () => {
      const userBadges = [{ id: 'PIONEER_BROKER' }, { id: 'OTHER_BADGE' }];
      expect(hasBadge(userBadges, 'PIONEER_BROKER')).toBe(true);
    });

    it('supports badge_id property format from database rows', () => {
      const userBadges = [{ badge_id: 'PIONEER_OWNER', seat_number: 7 }];
      expect(hasBadge(userBadges, 'PIONEER_OWNER')).toBe(true);
    });

    it('should return false if the user does not have the specified badge', () => {
      const userBadges = [{ id: 'OTHER_BADGE' }];
      expect(hasBadge(userBadges, 'PIONEER_BROKER')).toBe(false);
    });
  });

  describe('Edge Cases & Error Conditions', () => {
    it('should return false if userBadges is null', () => {
      expect(hasBadge(null, 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is undefined', () => {
      expect(hasBadge(undefined, 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is a string (not an array)', () => {
      expect(hasBadge('PIONEER_BROKER', 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is a number (not an array)', () => {
      expect(hasBadge(123, 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is a boolean (not an array)', () => {
      expect(hasBadge(true, 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is an object (not an array)', () => {
      expect(hasBadge({ id: 'PIONEER_BROKER' }, 'PIONEER_BROKER')).toBe(false);
    });

    it('should return false if userBadges is an empty array', () => {
      expect(hasBadge([], 'PIONEER_BROKER')).toBe(false);
    });
  });
});

describe('BadgeEngine - Pioneer Helpers & Mutual Exclusivity', () => {
  it('identifies pioneer cohort badges accurately', () => {
    expect(isPioneerBadge('PIONEER_BROKER')).toBe(true);
    expect(isPioneerBadge('PIONEER_OWNER')).toBe(true);
    expect(isPioneerBadge('PIONEER_CREATOR')).toBe(true);
    expect(isPioneerBadge('FOUNDING_SEEKER')).toBe(true);
    expect(isPioneerBadge('OWNER_VERIFIED')).toBe(false);
    expect(isPioneerBadge('ALPHA_CARTOGRAPHER')).toBe(false);
    expect(isPioneerBadge(null)).toBe(false);
  });

  it('detects when an account already holds any pioneer badge', () => {
    expect(hasAnyPioneerBadge([{ id: 'PIONEER_BROKER' }])).toBe(true);
    expect(hasAnyPioneerBadge([{ badge_id: 'FOUNDING_SEEKER' }])).toBe(true);
    expect(hasAnyPioneerBadge([{ id: 'OWNER_VERIFIED' }])).toBe(false);
    expect(hasAnyPioneerBadge([])).toBe(false);
    expect(hasAnyPioneerBadge(null)).toBe(false);
  });

  it('retrieves the specific pioneer badge held by a user', () => {
    const pioneerRow = { badge_id: 'PIONEER_BROKER', seat_number: 8 };
    const userBadges = [{ id: 'OWNER_VERIFIED' }, pioneerRow];
    expect(getPioneerBadge(userBadges)).toEqual(pioneerRow);
    expect(getPioneerBadge([{ id: 'OWNER_VERIFIED' }])).toBeNull();
  });

  it('formats sequential charter seat labels with zero-padding', () => {
    expect(formatCharterSeatLabel(1)).toBe('Charter #001');
    expect(formatCharterSeatLabel(7)).toBe('Charter #007');
    expect(formatCharterSeatLabel(25)).toBe('Charter #025');
    expect(formatCharterSeatLabel(null)).toBeNull();
    expect(formatCharterSeatLabel(0)).toBeNull();
    expect(formatCharterSeatLabel(-5)).toBeNull();
  });
});

describe('BadgeEngine - resolveUserPerks', () => {
  it('resolves active account perks from pioneer badges', () => {
    const userBadges = [{ badge_id: 'PIONEER_BROKER', seat_number: 14 }];
    const perks = resolveUserPerks(userBadges);
    expect(perks.queuePriority).toBe(true);
    expect(perks.discountPct).toBe(50);
    expect(perks.monthlyConnects).toBe(50);
    expect(perks.whiteLabelPdf).toBe(true);
    expect(perks.charterSeal).toBe(true);
    expect(perks.prioritySupport).toBe(true);
    expect(perks.alphaNotes).toBe(true);
    expect(perks.isTransferable).toBe(true);
  });

  it('defaults all perks to false/0 for standard users with no pioneer badges', () => {
    const perks = resolveUserPerks([]);
    expect(perks.queuePriority).toBe(false);
    expect(perks.discountPct).toBe(0);
    expect(perks.monthlyConnects).toBe(0);
    expect(perks.whiteLabelPdf).toBe(false);
    expect(perks.charterSeal).toBe(false);
    expect(perks.isTransferable).toBe(false);
  });

  it('handles null and undefined safely without throwing', () => {
    expect(resolveUserPerks(null).queuePriority).toBe(false);
    expect(resolveUserPerks(undefined).discountPct).toBe(0);
  });
});

describe('BadgeEngine - getBadgeDetails & TRUST_BADGES', () => {
  it('resolves system badge definitions', () => {
    const details = getBadgeDetails('PIONEER_BROKER');
    expect(details).toBeDefined();
    expect(details.name).toBe('Pioneer Advisor');
    expect(details.max_slots).toBe(25);
  });

  it('resolves explainable trust badges with criteria and descriptions', () => {
    const details = getBadgeDetails('OWNER_VERIFIED');
    expect(details).toBeDefined();
    expect(details.name).toBe('Owner Verified');
    expect(details.badgeType).toBe('trust');
    expect(details.description).toContain('title records');
    expect(details.criteria).toContain('corporate registration');
  });

  it('returns null for missing or invalid badge IDs', () => {
    expect(getBadgeDetails(null)).toBeNull();
    expect(getBadgeDetails('NONEXISTENT_BADGE')).toBeNull();
  });
});
