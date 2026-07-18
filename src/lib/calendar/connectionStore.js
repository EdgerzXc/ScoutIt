// Loads a user's calendar connection and hands back a VALID access token,
// refreshing (and re-persisting) it when it's expired or about to expire.
// Token plaintext lives only in memory here; the DB only ever holds ciphertext.
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { decryptToken, encryptToken } from "./tokenCrypto";
import { refreshAccessToken } from "./googleOAuth";

const REFRESH_SKEW_MS = 60 * 1000; // refresh if it expires within a minute

/** The raw connection row (or null). Token columns stay encrypted here. */
export async function getConnectionRow(userId, provider = "google") {
  if (!supabaseAdmin) return null;
  const { data } = await supabaseAdmin
    .from("calendar_connections")
    .select("*")
    .eq("owner_user_id", userId)
    .eq("provider", provider)
    .eq("status", "active")
    .maybeSingle();
  return data || null;
}

export async function hasActiveConnection(userId, provider = "google") {
  return Boolean(await getConnectionRow(userId, provider));
}

/**
 * Return a usable Google access token for the user, refreshing if needed.
 * @returns {Promise<string|null>} access token, or null if not connected.
 * @throws if the refresh fails (caller should mark the connection in error).
 */
export async function getValidGoogleAccessToken(userId) {
  const row = await getConnectionRow(userId, "google");
  if (!row) return null;

  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const stillValid = row.access_token_enc && expiresAt - Date.now() > REFRESH_SKEW_MS;
  if (stillValid) return decryptToken(row.access_token_enc);

  // Need to refresh. Google only issues a refresh token on first consent, so a
  // missing one means the user must reconnect.
  if (!row.refresh_token_enc) {
    await markConnectionStatus(userId, "google", "error");
    throw new Error("No refresh token — reconnect required");
  }

  const refreshToken = decryptToken(row.refresh_token_enc);
  let refreshed;
  try {
    refreshed = await refreshAccessToken(refreshToken);
  } catch (err) {
    await markConnectionStatus(userId, "google", "error");
    throw err;
  }

  const newExpiry = refreshed.expires_in
    ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    : null;

  await supabaseAdmin
    .from("calendar_connections")
    .update({
      access_token_enc: encryptToken(refreshed.access_token),
      token_expires_at: newExpiry,
      status: "active",
    })
    .eq("owner_user_id", userId)
    .eq("provider", "google");

  return refreshed.access_token;
}

export async function markConnectionStatus(userId, provider, status) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("calendar_connections")
    .update({ status })
    .eq("owner_user_id", userId)
    .eq("provider", provider);
}
