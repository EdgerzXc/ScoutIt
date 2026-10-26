/**
 * Pure policy rules for Read-Only Staff Impersonation ("View As User") (A-265).
 * Zero I/O, no server-only imports, 100% testable.
 */

import crypto from "node:crypto";

export const ALLOWED_DURATIONS_MINUTES = Object.freeze([5, 15, 30, 60]);
export const DEFAULT_DURATION_MINUTES = 15;
export const MAX_DURATION_MINUTES = 60;

/**
 * Validates an impersonation session creation request.
 * - Target user ID required.
 * - Reason must be >= 10 characters.
 * - Duration must be positive integer <= 60.
 */
export function validateImpersonationRequest({ targetUserId, reason, durationMinutes = DEFAULT_DURATION_MINUTES }) {
  if (!targetUserId || typeof targetUserId !== "string" || !targetUserId.trim()) {
    return { valid: false, error: "Target user ID is required." };
  }
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return { valid: false, error: "A detailed justification of at least 10 characters documenting support ticket or issue reference is required." };
  }
  if (typeof durationMinutes !== "number" || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    return { valid: false, error: "Duration must be a positive integer in minutes." };
  }
  if (durationMinutes > MAX_DURATION_MINUTES) {
    return { valid: false, error: `Impersonation duration cannot exceed ${MAX_DURATION_MINUTES} minutes.` };
  }
  return { valid: true, error: null };
}

/**
 * Generates an HMAC-SHA256 signed time-boxed read-only impersonation token.
 */
export function generateImpersonationToken({
  staffId,
  staffEmail,
  staffTier,
  targetUserId,
  reason,
  durationMinutes = DEFAULT_DURATION_MINUTES,
  secret = "scoutit_impersonation_fallback_secret",
}) {
  const now = Date.now();
  const exp = now + durationMinutes * 60 * 1000;

  const payload = {
    staffId,
    staffEmail,
    staffTier,
    targetUserId,
    reason,
    readOnly: true,
    iat: now,
    exp,
  };

  const serialized = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(serialized)
    .digest("base64url");

  return {
    token: `${serialized}.${signature}`,
    exp,
    durationMinutes,
  };
}

/**
 * Verifies an impersonation token signature and expiration.
 */
export function verifyImpersonationToken({ token, secret = "scoutit_impersonation_fallback_secret" }) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return { valid: false, error: "Malformed token." };
  }

  const [serialized, signature] = token.split(".");
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(serialized)
    .digest("base64url");

  if (signature !== expectedSig) {
    return { valid: false, error: "Invalid cryptographic signature." };
  }

  try {
    const payload = JSON.parse(Buffer.from(serialized, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) {
      return { valid: false, error: "Impersonation session has expired." };
    }
    return { valid: true, payload };
  } catch (_e) {
    return { valid: false, error: "Token payload could not be parsed." };
  }
}
