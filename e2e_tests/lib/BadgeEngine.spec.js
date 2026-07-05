import { test, expect } from '@playwright/test';
import { applyBadgeDiscounts } from '../../src/lib/BadgeEngine.js';

test.describe('BadgeEngine - applyBadgeDiscounts', () => {
  const basePrice = 5000;

  test('applies discount for CLUSTER_STRATEGIST with PIONEER_BROKER badge', () => {
    const userBadges = [{ id: 'PIONEER_BROKER' }];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', basePrice);
    expect(price).toBe(1999);
  });

  test('applies discount for CLUSTER_DEVELOPER with PIONEER_OWNER badge', () => {
    const userBadges = [{ id: 'PIONEER_OWNER' }];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_DEVELOPER', basePrice);
    expect(price).toBe(2499);
  });

  test('returns base price if user has correct tier but no badges', () => {
    const userBadges = [];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', basePrice);
    expect(price).toBe(basePrice);
  });

  test('returns base price if user has correct tier but wrong badge', () => {
    const userBadges = [{ id: 'PIONEER_CREATOR' }];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', basePrice);
    expect(price).toBe(basePrice);
  });

  test('returns base price if user has correct badge but wrong tier', () => {
    const userBadges = [{ id: 'PIONEER_BROKER' }];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_DEVELOPER', basePrice);
    expect(price).toBe(basePrice);
  });

  test('applies discount when user has multiple badges including the correct one', () => {
    const userBadges = [{ id: 'PIONEER_CREATOR' }, { id: 'PIONEER_BROKER' }];
    const price = applyBadgeDiscounts(userBadges, 'CLUSTER_STRATEGIST', basePrice);
    expect(price).toBe(1999);
  });

  test('handles null or undefined userBadges safely', () => {
    expect(applyBadgeDiscounts(null, 'CLUSTER_STRATEGIST', basePrice)).toBe(basePrice);
    expect(applyBadgeDiscounts(undefined, 'CLUSTER_STRATEGIST', basePrice)).toBe(basePrice);
  });
});
