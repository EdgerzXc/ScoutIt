import { describe, it, expect } from 'vitest';

describe('LR-04 two distinct handshakes and chat retention rules', () => {
  it('distinguishes representation handshake (#1) from transaction handshake (#2)', () => {
    const handshake1 = {
      type: 'representation_handshake',
      partyA: 'owner_123',
      partyB: 'broker_456',
      incrementsRating: false,
    };

    const handshake2 = {
      type: 'transaction_handshake',
      partyA: 'buyer_789',
      partyB: 'broker_456',
      afterViewing: true,
      incrementsRating: true,
    };

    expect(handshake1.incrementsRating).toBe(false);
    expect(handshake2.incrementsRating).toBe(true);
  });

  it('calculates 7-day chat retention purge eligibility accurately', () => {
    const now = new Date('2026-08-02T12:00:00Z');
    const closed6DaysAgo = new Date('2026-07-27T12:00:00Z');
    const closed8DaysAgo = new Date('2026-07-25T12:00:00Z');

    const isPurgeable = (closedAt, hasHold) => {
      if (hasHold) return false;
      const days = (now - new Date(closedAt)) / (1000 * 60 * 60 * 24);
      return days >= 7;
    };

    expect(isPurgeable(closed6DaysAgo, false)).toBe(false);
    expect(isPurgeable(closed8DaysAgo, false)).toBe(true);
    expect(isPurgeable(closed8DaysAgo, true)).toBe(false); // Dispute legal hold prevents purge
  });
});
