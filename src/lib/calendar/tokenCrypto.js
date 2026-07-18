// AES-256-GCM encryption for OAuth tokens at rest.
//
// The plaintext access/refresh tokens are NEVER stored or logged — only the
// ciphertext produced here lands in calendar_connections. The key comes from
// CALENDAR_TOKEN_KEY (64 hex chars = 32 bytes); generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const KEY_HEX_LEN = 64; // 32 bytes

function getKey() {
  const hex = process.env.CALENDAR_TOKEN_KEY;
  if (!hex || hex.length !== KEY_HEX_LEN || !/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(
      "CALENDAR_TOKEN_KEY missing or invalid — expected 64 hex chars (32 bytes)."
    );
  }
  return Buffer.from(hex, "hex");
}

/** True when a valid encryption key is configured (used to gate the feature). */
export function isTokenCryptoConfigured() {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypt a plaintext token. Output layout (base64): iv | authTag | ciphertext.
 * @param {string} plaintext
 * @returns {string} base64 ciphertext bundle
 */
export function encryptToken(plaintext) {
  if (plaintext == null) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/**
 * Decrypt a bundle produced by encryptToken. Throws if the key is wrong or the
 * data was tampered with (GCM auth failure).
 * @param {string} bundleB64
 * @returns {string} plaintext
 */
export function decryptToken(bundleB64) {
  if (bundleB64 == null) return null;
  const key = getKey();
  const raw = Buffer.from(bundleB64, "base64");
  const iv = raw.subarray(0, IV_BYTES);
  const tag = raw.subarray(IV_BYTES, IV_BYTES + 16);
  const enc = raw.subarray(IV_BYTES + 16);
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}
