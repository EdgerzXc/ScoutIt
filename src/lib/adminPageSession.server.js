import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const ADMIN_PAGE_SESSION_SECONDS = 300;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const MAX_COOKIE_LENGTH = 3800;
const sessionContext = Buffer.from("scoutit:public-admin-page:v1");

function configuredKey(value = process.env.SCOUTIT_ADMIN_SESSION_KEY) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(value)) return null;
  const key = Buffer.from(value, "base64url");
  return key.length === 32 && key.toString("base64url") === value ? key : null;
}

export function adminPageCookieOptions(maxAge = ADMIN_PAGE_SESSION_SECONDS) {
  const secure = process.env.NODE_ENV === "production";
  return {
    name: secure ? "__Secure-scoutit-admin" : "scoutit-admin-dev",
    path: "/admin",
    secure,
    httpOnly: true,
    sameSite: "strict",
    maxAge,
  };
}

export function sealAdminPageSession(token, now = Date.now()) {
  const key = configuredKey();
  if (!key || typeof token !== "string" || !token || token.length > 2700) return null;
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(sessionContext);
  const expires = now + ADMIN_PAGE_SESSION_SECONDS * 1000;
  const payload = Buffer.concat([cipher.update(JSON.stringify({ token, expires }), "utf8"), cipher.final()]);
  const value = Buffer.concat([nonce, cipher.getAuthTag(), payload]).toString("base64url");
  return value.length <= MAX_COOKIE_LENGTH ? value : null;
}

export function readAdminPageSession(value, now = Date.now()) {
  if (typeof value !== "string" || value.length > MAX_COOKIE_LENGTH || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const key = configuredKey();
  if (!key) return null;
  const bytes = Buffer.from(value, "base64url");
  if (bytes.length <= NONCE_BYTES + TAG_BYTES || bytes.toString("base64url") !== value) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, NONCE_BYTES));
    decipher.setAAD(sessionContext);
    decipher.setAuthTag(bytes.subarray(NONCE_BYTES, NONCE_BYTES + TAG_BYTES));
    const plaintext = Buffer.concat([decipher.update(bytes.subarray(NONCE_BYTES + TAG_BYTES)), decipher.final()]);
    const { token, expires } = JSON.parse(plaintext.toString("utf8"));
    return typeof token === "string" && Number.isSafeInteger(expires) && expires > now ? token : null;
  } catch {
    return null;
  }
}
