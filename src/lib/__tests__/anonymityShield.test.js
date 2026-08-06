import { describe, it, expect } from 'vitest';
import {
  FEATURE_MIN_TIER,
  TIERS,
  canSee,
  canUseAnonymityShield,
  anonymityShieldDefaultsOn,
  ANONYMITY_SHIELD_ROLES,
} from '../entitlements.js';

// Owner ruling 2026-08-06 (§46.8):
//   "it's free for everyone. only if they know it. with cluster this will
//    immediately turn on."
//
// The capability is free; the paid part is the DEFAULT. These tests exist
// because the tempting "optimisation" — folding it back into FEATURE_MIN_TIER
// as a cluster gate — would look tidier and would be selling privacy.

describe('the shield is NOT a tier gate', () => {
  it('is absent from FEATURE_MIN_TIER entirely', () => {
    expect(FEATURE_MIN_TIER.anonymityShield).toBeUndefined();
    // And the misleading old name must never come back.
    expect(FEATURE_MIN_TIER.identityReveal).toBeUndefined();
  });

  it('canSee() treats it as ungated at every tier, including anonymous', () => {
    for (const tier of [...TIERS, null, undefined, 'garbage']) {
      expect(canSee('anonymityShield', tier)).toBe(true);
    }
  });

  it.each(ANONYMITY_SHIELD_ROLES)('is usable by %s at any tier', (role) => {
    for (const tier of TIERS) {
      expect(canUseAnonymityShield(role)).toBe(true);
      void tier; // usability does not depend on tier — that is the point
    }
  });
});

describe('the DEFAULT is what Cluster buys', () => {
  it('is off by default for free and Solar seekers — they must find it', () => {
    expect(anonymityShieldDefaultsOn('starry', 'seeker')).toBe(false);
    expect(anonymityShieldDefaultsOn('solar', 'seeker')).toBe(false);
  });

  it('is on by default from Cluster up', () => {
    expect(anonymityShieldDefaultsOn('cluster', 'seeker')).toBe(true);
    expect(anonymityShieldDefaultsOn('universe', 'seeker')).toBe(true);
  });

  it('applies to owners too, not just seekers', () => {
    expect(anonymityShieldDefaultsOn('cluster', 'owner')).toBe(true);
    expect(anonymityShieldDefaultsOn('starry', 'owner')).toBe(false);
  });

  // The whole point of §46.4: a broker's value is being FOUND.
  it.each(['broker', 'photographer', 'researcher'])(
    'never defaults on for %s, even at Universe',
    (role) => {
      expect(anonymityShieldDefaultsOn('universe', role)).toBe(false);
      expect(canUseAnonymityShield(role)).toBe(false);
    },
  );

  it('treats an unknown tier as the lowest — defaults off, never on', () => {
    for (const tier of [null, undefined, '', 'garbage']) {
      expect(anonymityShieldDefaultsOn(tier, 'seeker')).toBe(false);
    }
  });

  it('defaults to the seeker role when none is given', () => {
    expect(anonymityShieldDefaultsOn('cluster', null)).toBe(true);
    expect(anonymityShieldDefaultsOn('starry', undefined)).toBe(false);
  });
});
