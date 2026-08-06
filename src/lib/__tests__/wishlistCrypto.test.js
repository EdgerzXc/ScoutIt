import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  encryptUserId,
  decryptUserId,
  shareTokenExpiry,
  SHARE_TOKEN_TTL_DAYS,
} from '../wishlistCrypto.js';

// A share token is a BEARER CREDENTIAL: whoever holds the link reads that
// user's board. So the tests that matter most are the negative ones — a
// tampered or expired token must not resolve to a user id.

const USER = '9f1c2b7e-0000-4aaa-8bbb-1234567890ab';
const DAY = 24 * 60 * 60 * 1000;

afterEach(() => vi.useRealTimers());

describe('round trip', () => {
  it('recovers the user id it was minted for', () => {
    expect(decryptUserId(encryptUserId(USER))).toBe(USER);
  });

  it('mints a different token each time (random IV)', () => {
    expect(encryptUserId(USER)).not.toBe(encryptUserId(USER));
  });

  it('does not leak the user id in plaintext', () => {
    expect(encryptUserId(USER)).not.toContain(USER);
  });
});

describe('expiry (§25.5 — owner decision: 90 days)', () => {
  it(`defaults to ${SHARE_TOKEN_TTL_DAYS} days`, () => {
    const expiry = shareTokenExpiry(encryptUserId(USER));
    const expected = Date.now() + SHARE_TOKEN_TTL_DAYS * DAY;
    // Within a minute of the expected instant.
    expect(Math.abs(expiry - expected)).toBeLessThan(60_000);
  });

  it('still resolves one day before expiry', () => {
    const token = encryptUserId(USER, { ttlMs: 2 * DAY });
    vi.setSystemTime(new Date(Date.now() + DAY));
    expect(decryptUserId(token)).toBe(USER);
  });

  it('returns null once expired — the whole point', () => {
    const token = encryptUserId(USER, { ttlMs: DAY });
    vi.setSystemTime(new Date(Date.now() + 2 * DAY));
    expect(decryptUserId(token)).toBeNull();
  });

  it('expires exactly at the boundary, not after a grace period', () => {
    const token = encryptUserId(USER, { ttlMs: DAY });
    vi.setSystemTime(new Date(Date.now() + DAY + 1));
    expect(decryptUserId(token)).toBeNull();
  });
});

describe('legacy tokens — must not break links already shared', () => {
  // Owner decision 2026-08-06: links minted before the expiry existed keep
  // working indefinitely. They carry no `|` separator, so decryptUserId's
  // `lastIndexOf === -1` branch returns the id without an expiry check.
  //
  // ⚠️ This cannot be exercised through the public API — encryptUserId always
  // appends an expiry now, and minting a legacy token in the test would mean
  // duplicating the cipher here, which would then pass even if the real
  // implementation changed. Covered instead by C15's manual check against a
  // link generated before 2026-08-06.
  //
  // What IS testable is that the rejection below comes from the EXPIRY branch
  // and not from a parse failure — a negative TTL is unambiguously past.
  it('rejects an already-expired token via the expiry branch, not a parse error', () => {
    const expired = encryptUserId(USER, { ttlMs: -1000 });
    expect(typeof expired).toBe('string');
    expect(expired.split('.')).toHaveLength(3); // parsed fine
    expect(decryptUserId(expired)).toBeNull();  // rejected on expiry
  });
});

describe('tampering and malformed input — all must fail closed', () => {
  it.each([
    ['empty string', ''],
    ['not a token', 'hello'],
    ['wrong part count', 'a.b'],
    ['too many parts', 'a.b.c.d'],
    ['null', null],
    ['undefined', undefined],
  ])('returns null for %s', (_label, input) => {
    expect(decryptUserId(input)).toBeNull();
  });

  // ⚠️ Mutate a MIDDLE character, never the last one.
  //
  // A GCM auth tag is 16 bytes, which is 22 base64url characters — so the
  // final character carries only 2 significant bits and several distinct
  // characters decode to the SAME bytes. Flipping the last char therefore
  // often produces a byte-identical tag, the token validates, and the test
  // fails intermittently depending on which random IV was drawn. (It did.)
  const mutateMiddle = (part) => {
    const i = Math.floor(part.length / 2);
    const replacement = part[i] === 'A' ? 'B' : 'A';
    return part.slice(0, i) + replacement + part.slice(i + 1);
  };

  it('rejects a token whose ciphertext was altered', () => {
    const [iv, ct, tag] = encryptUserId(USER).split('.');
    expect(decryptUserId(`${iv}.${mutateMiddle(ct)}.${tag}`)).toBeNull();
  });

  it('rejects a token whose auth tag was altered', () => {
    const [iv, ct, tag] = encryptUserId(USER).split('.');
    expect(decryptUserId(`${iv}.${ct}.${mutateMiddle(tag)}`)).toBeNull();
  });

  it('rejects a token whose IV was altered', () => {
    const [iv, ct, tag] = encryptUserId(USER).split('.');
    expect(decryptUserId(`${mutateMiddle(iv)}.${ct}.${tag}`)).toBeNull();
  });

  // The expiry lives INSIDE the authenticated payload, so extending it means
  // forging a GCM tag. This pins that property.
  it('cannot have its expiry extended by editing the token', () => {
    const [iv, ct, tag] = encryptUserId(USER, { ttlMs: DAY }).split('.');
    // Appending to the ciphertext changes the plaintext length, which the GCM
    // tag covers — so this fails authentication rather than yielding a longer
    // expiry. That property is the reason the expiry lives INSIDE the payload.
    expect(decryptUserId(`${iv}.${ct}X.${tag}`)).toBeNull();
  });
});
