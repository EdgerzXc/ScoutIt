import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// WISHLIST SHARE TOKENS — the ONE place share links are signed.
//
// A share token encodes a user id so that /wishlist/shared/<token> can render
// that person's saved board to anyone holding the link. It is therefore a
// bearer credential: whoever can mint a valid token can read any user's board.
//
// ── FAIL CLOSED IN PRODUCTION ───────────────────────────────────────
// This module previously fell back to a literal key committed to the repo
// ('default_secret_key_32_chars_long!'), and the reader fell back to a
// different literal. Anyone reading the source could forge a token for any
// user id. A missing secret in production is now a hard failure instead of a
// silent downgrade. Local development still gets a stable dev key so nobody
// needs real credentials to work on the feature.
//
// ── ONE IMPLEMENTATION ──────────────────────────────────────────────
// The reader used to hand-roll its own decrypt with a different key
// derivation, a different separator (':' vs '.'), a different field order and
// a different payload shape — so every link it received failed to decode and
// 404'd. Both sides now go through encryptUserId / decryptUserId here.
// ═══════════════════════════════════════════════════════════════

const DEV_FALLBACK_SECRET = 'scoutit-local-dev-wishlist-secret';
const IV_LENGTH = 12; // standard for GCM

// ── EXPIRY (§25.5, owner decision 2026-08-06: 90 days) ──────────────────
//
// A share token is a bearer credential: whoever holds the
// link can read that board until expiry or the owner's server-side revocation
// watermark. Without an expiry, a link pasted into a group chat
// in 2026 still works in 2030.
//
// 90 days is long enough to cover a real property search — which in PH runs
// months, not weeks — and short enough that a leaked link goes stale on its
// own. The expiry is inside the AUTHENTICATED payload, so it cannot be edited
// without breaking the GCM auth tag.
export const SHARE_TOKEN_TTL_DAYS = 90;
const TTL_MS = SHARE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;

// Payload is `userId|issuedAtMs|expiresAtMs`. Tokens from the earlier
// expiry-only format (`userId|expiresAtMs`) remain readable. The separator is
// '|' because a Supabase
// user id is a UUID and can never contain one — so splitting is unambiguous
// even if an id format changes later.
const PAYLOAD_SEPARATOR = '|';

/**
 * Resolves the signing key, or null when unavailable.
 *
 * Deliberately NOT falling back to SUPABASE_SERVICE_ROLE_KEY: reusing the
 * database master key to sign public share links widens the blast radius of
 * that key for no benefit.
 *
 * @returns {Buffer|null} 32-byte key, or null if production is misconfigured
 */
function resolveKey() {
  const secret = process.env.WISHLIST_SHARE_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProd) {
      console.error(
        '[wishlist] WISHLIST_SHARE_SECRET is not set in production. ' +
        'Refusing to sign or accept share links with a known key.',
      );
      return null;
    }
    return crypto.createHash('sha256').update(DEV_FALLBACK_SECRET).digest();
  }

  // Hashed so any length of secret yields exactly the 32 bytes aes-256 needs.
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Mints a share token for a user id.
 *
 * @param {string} userId
 * @returns {string} token in the form 'iv.ciphertext.authTag' (base64url)
 * @throws {Error} when the signing secret is unavailable
 */
export function encryptUserId(userId, { ttlMs = TTL_MS, issuedAt = Date.now() } = {}) {
  const key = resolveKey();
  if (!key) throw new Error('Share links are not configured on this server.');

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const payload = `${userId}${PAYLOAD_SEPARATOR}${issuedAt}${PAYLOAD_SEPARATOR}${issuedAt + ttlMs}`;
  let encrypted = cipher.update(payload, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');

  const authTag = cipher.getAuthTag().toString('base64url');
  const ivHex = iv.toString('base64url');

  return `${ivHex}.${encrypted}.${authTag}`;
}

/**
 * Recovers the user id from a share token.
 *
 * Returns null for anything that isn't a token this server signed — wrong
 * shape, tampered ciphertext, failed auth tag, or a missing secret. Callers
 * should treat null as "not found" rather than distinguishing the cases.
 *
 * @param {string} token
 * @returns {string|null}
 */
export function decodeWishlistShareToken(token, { allowExpired = false } = {}) {
  try {
    const key = resolveKey();
    if (!key) return null;

    const parts = String(token).split('.');
    if (parts.length !== 3) return null;

    const [ivHex, encrypted, authTag] = parts;
    const iv = Buffer.from(ivHex, 'base64url');
    const tag = Buffer.from(authTag, 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    const segments = decrypted.split(PAYLOAD_SEPARATOR);
    if (segments.length === 1) {
      return { userId: decrypted, issuedAt: null, expiresAt: null, legacy: true };
    }

    let userId;
    let issuedAt;
    let expiresAt;
    if (segments.length === 2) {
      [userId] = segments;
      expiresAt = Number(segments[1]);
      issuedAt = expiresAt - TTL_MS;
    } else if (segments.length === 3) {
      [userId] = segments;
      issuedAt = Number(segments[1]);
      expiresAt = Number(segments[2]);
    } else {
      return null;
    }

    if (!userId || !Number.isFinite(issuedAt) || !Number.isFinite(expiresAt)) return null;
    if (!allowExpired && Date.now() > expiresAt) return null;

    return { userId, issuedAt, expiresAt, legacy: false };
  } catch {
    return null;
  }
}

export function decryptUserId(token) {
  return decodeWishlistShareToken(token)?.userId || null;
}

export function isWishlistShareRevoked(tokenDetails, revokedBefore) {
  if (!tokenDetails || !revokedBefore) return false;
  const revokedAt = new Date(revokedBefore).getTime();
  if (!Number.isFinite(revokedAt)) return true;
  if (!Number.isFinite(tokenDetails.issuedAt)) return true;
  return tokenDetails.issuedAt <= revokedAt;
}
/**
 * Reads a token's expiry WITHOUT asserting it is still valid.
 *
 * For UI that wants to say "this link expires in 12 days" or explain why a
 * link stopped working. Returns null for legacy (never-expiring) tokens and
 * for anything unreadable.
 *
 * @param {string} token
 * @returns {number|null} epoch ms
 */
export function shareTokenExpiry(token) {
  return decodeWishlistShareToken(token, { allowExpired: true })?.expiresAt || null;
}
