// Google Calendar OAuth helper — plain fetch, zero SDK dependency.
//
// Phase 2 scope: run the consent flow, exchange the code, read the account
// email, and (for Phase 3) refresh the access token. Actual event sync lives in
// a later phase.
import { SITE_URL } from "@/lib/siteUrl";
import { isTokenCryptoConfigured } from "./tokenCrypto";

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
];

/** The feature is usable only when creds AND the encryption key are present. */
export function isGoogleConfigured() {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
      process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
      isTokenCryptoConfigured()
  );
}

export function getRedirectUri() {
  return `${SITE_URL}/api/oauth/google/callback`;
}

/** Build the Google consent URL. access_type=offline + prompt=consent so we
 *  reliably receive a refresh token on first connect. */
export function buildConsentUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state,
  });
  return `${AUTH_ENDPOINT}?${params}`;
}

async function postForm(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error_description || data.error || `Google token request failed (${res.status})`);
  }
  return data;
}

/** Exchange an auth code for tokens. Returns { access_token, refresh_token,
 *  expires_in, scope }. */
export function exchangeCodeForTokens(code) {
  return postForm(TOKEN_ENDPOINT, {
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
  });
}

/** Refresh an access token (Phase 3). Returns { access_token, expires_in }. */
export function refreshAccessToken(refreshToken) {
  return postForm(TOKEN_ENDPOINT, {
    refresh_token: refreshToken,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    grant_type: "refresh_token",
  });
}

/** Read the connected account's email for display. */
export async function fetchAccountEmail(accessToken) {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return data.email || null;
}
