import { test, expect } from '@playwright/test';
import { hasBadge, applyBadgeDiscounts, getAllBadges, getRemainingSlots, BADGE_DEFINITIONS } from '../src/lib/BadgeEngine';

test.describe('BadgeEngine', () => {
  test.describe('hasBadge', () => {
    test('returns false when userBadges is null', () => {
      expect(hasBadge(null, 'PIONEER_BROKER')).toBe(false);
    });

    test('returns false when userBadges is undefined', () => {
      expect(hasBadge(undefined, 'PIONEER_BROKER')).toBe(false);
    });

    test('returns false when userBadges is not an array', () => {
      expect(hasBadge('not an array', 'PIONEER_BROKER')).toBe(false);
      expect(hasBadge({}, 'PIONEER_BROKER')).toBe(false);
    });

    test('returns false when user has no badges', () => {
      expect(hasBadge([], 'PIONEER_BROKER')).toBe(false);
    });

    test('returns false when user has different badges', () => {
      const userBadges = [{ id: 'PIONEER_OWNER' }, { id: 'PIONEER_CREATOR' }];
      expect(hasBadge(userBadges, 'PIONEER_BROKER')).toBe(false);
    });

    test('returns true when user has the specific badge', () => {
      const userBadges = [{ id: 'PIONEER_OWNER' }, { id: 'PIONEER_BROKER' }];
      expect(hasBadge(userBadges, 'PIONEER_BROKER')).toBe(true);
    });

    test('returns true when checking for a different valid badge the user has', () => {
      const userBadges = [{ id: 'PIONEER_OWNER' }];
      expect(hasBadge(userBadges, 'PIONEER_OWNER')).toBe(true);
    });
  });

  test.describe('applyBadgeDiscounts', () => {
    test('returns discounted price for CLUSTER_STRATEGIST if user has PIONEER_BROKER badge', () => {
      const userBadges = [{ id: 'PIONEER_BROKER' }];
      expect(applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', 2500)).toBe(1999);
    });

    test('returns base price for CLUSTER_STRATEGIST if user does not have PIONEER_BROKER badge', () => {
      const userBadges = [{ id: 'PIONEER_OWNER' }];
      expect(applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', 2500)).toBe(2500);
    });

    test('returns discounted price for CLUSTER_DEVELOPER if user has PIONEER_OWNER badge', () => {
      const userBadges = [{ id: 'PIONEER_OWNER' }];
      expect(applyBadgeDiscounts(userBadges, 'CLUSTER_DEVELOPER', 3000)).toBe(2499);
    });

    test('returns base price for CLUSTER_DEVELOPER if user does not have PIONEER_OWNER badge', () => {
      const userBadges = [{ id: 'PIONEER_BROKER' }];
      expect(applyBadgeDiscounts(userBadges, 'CLUSTER_DEVELOPER', 3000)).toBe(3000);
    });

    test('returns base price for unknown tier', () => {
      const userBadges = [{ id: 'PIONEER_BROKER' }];
      expect(applyBadgeDiscounts(userBadges, 'UNKNOWN_TIER', 1000)).toBe(1000);
    });

    test('returns base price when user has no badges', () => {
      expect(applyBadgeDiscounts([], 'CLUSTER_STRATEGIST', 2500)).toBe(2500);
    });

    test('returns base price when userBadges is null', () => {
      expect(applyBadgeDiscounts(null, 'CLUSTER_STRATEGIST', 2500)).toBe(2500);
    });
  });

  test.describe('getAllBadges', () => {
    test('returns all badges when no status filter is provided', () => {
      const allBadges = getAllBadges();
      expect(allBadges.length).toBe(Object.keys(BADGE_DEFINITIONS).length);
      expect(allBadges[0]).toHaveProperty('id');
      expect(allBadges[0]).toHaveProperty('name');
    });

    test('returns only ACTIVE badges when statusFilter is ACTIVE', () => {
      const activeBadges = getAllBadges('ACTIVE');
      expect(activeBadges.length).toBeGreaterThan(0);
      activeBadges.forEach(badge => {
        expect(badge.status).toBe('ACTIVE');
      });
    });

    test('returns only SOLD_OUT badges when statusFilter is SOLD_OUT', () => {
      const soldOutBadges = getAllBadges('SOLD_OUT');
      expect(soldOutBadges.length).toBeGreaterThan(0);
      soldOutBadges.forEach(badge => {
        expect(badge.status).toBe('SOLD_OUT');
      });
    });

    test('returns empty array when statusFilter matches no badges', () => {
      const noneBadges = getAllBadges('NON_EXISTENT_STATUS');
      expect(noneBadges).toEqual([]);
    });
  });

  test.describe('getRemainingSlots', () => {
    test('returns correct remaining slots for existing badge', () => {
      // PIONEER_BROKER has max_slots: 20, claimed: 14 => expected 6
      expect(getRemainingSlots('PIONEER_BROKER')).toBe(6);
    });

    test('returns 0 for non-existent badge', () => {
      expect(getRemainingSlots('UNKNOWN_BADGE')).toBe(0);
    });

    test('returns 0 when claimed equals or exceeds max_slots', () => {
      // FOUNDING_SEEKER has max_slots: 100, claimed: 100 => expected 0
      expect(getRemainingSlots('FOUNDING_SEEKER')).toBe(0);
    });
  });
});
