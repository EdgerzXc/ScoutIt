import crypto from 'crypto';

// Use an environment variable for the secret, but fall back to a stable key for local dev if not present.
// We hash the base secret to ensure it is exactly 32 bytes for aes-256-gcm.
const SECRET_BASE = process.env.WISHLIST_SHARE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default_secret_key_32_chars_long!';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(SECRET_BASE)).digest(); // exactly 32 bytes
const IV_LENGTH = 12; // Standard for GCM

export function encryptUserId(userId) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(userId, 'utf8', 'base64url');
  encrypted += cipher.final('base64url');

  const authTag = cipher.getAuthTag().toString('base64url');
  const ivHex = iv.toString('base64url');

  return `${ivHex}.${encrypted}.${authTag}`;
}

export function decryptUserId(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [ivHex, encrypted, authTag] = parts;
    const iv = Buffer.from(ivHex, 'base64url');
    const tag = Buffer.from(authTag, 'base64url');

    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64url', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (e) {
    return null;
  }
}
