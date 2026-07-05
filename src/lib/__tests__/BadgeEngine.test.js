import { describe, it, expect } from 'vitest';
import { hasBadge } from '../BadgeEngine.js';

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
