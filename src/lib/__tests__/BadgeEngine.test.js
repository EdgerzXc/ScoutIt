import { describe, it, expect } from 'vitest';
import { hasBadge, getBadgeDetails, TRUST_BADGES } from '../BadgeEngine.js';

describe('BadgeEngine - hasBadge', () => {
  describe('Happy Paths', () => {
    it('should return true if the user has the specified badge', () => {
      const userBadges = [{ id: 'PIONEER_BROKER' }, { id: 'OTHER_BADGE' }];
      expect(hasBadge(userBadges, 'PIONEER_BROKER')).toBe(true);
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

describe('BadgeEngine - getBadgeDetails & TRUST_BADGES', () => {
  it('resolves system badge definitions', () => {
    const details = getBadgeDetails('PIONEER_BROKER');
    expect(details).toBeDefined();
    expect(details.name).toBe('Pioneer Advisor');
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
