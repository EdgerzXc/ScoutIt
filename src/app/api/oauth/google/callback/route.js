import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { siteUrl } from "@/lib/siteUrl";
import { isGoogleConfigured, exchangeCodeForTokens, fetchAccountEmail, GOOGLE_SCOPES } from "@/lib/calendar/googleOAuth";
import { verifyState } from "@/lib/calendar/oauthState";
import { encryptToken } from "@/lib/calendar/tokenCrypto";

// GET /api/oauth/google/callback?code=...&state=...
// Top-level browser redirect from Google (no auth header). We recover the user
// from the signed state, exchange the code, and store ENCRYPTED tokens. On any
// failure we redirect back to the calendar with a friendly ?error flag rather
// than dumping a raw error page.
function backToCalendar(flag) {
  return NextResponse.redirect(siteUrl(`/dashboard/calendar?${flag}`));
}

export async function GET(request) {
  try {
    if (!isGoogleConfigured() || !supabaseAdmin) {
      return backToCalendar("calendar_error=not_configured");
    }

    const { searchParams } = new URL(request.url);
    const error = searchParams.get("error");
    if (error) return backToCalendar("calendar_error=denied");

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const verified = verifyState(state);
    if (!code || !verified) return backToCalendar("calendar_error=invalid_state");

    const userId = verified.userId;

    // Exchange the auth code for tokens.
    const tokens = await exchangeCodeForTokens(code);
    const accountEmail = tokens.access_token ? await fetchAccountEmail(tokens.access_token) : null;

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Upsert the connection with encrypted tokens. Keep an existing refresh
    // token if Google didn't return a new one (it only sends it on first grant).
    const row = {
      owner_user_id: userId,
      provider: "google",
      account_email: accountEmail,
      access_token_enc: encryptToken(tokens.access_token),
      token_expires_at: expiresAt,
      scope: tokens.scope || GOOGLE_SCOPES.join(" "),
      status: "active",
    };
    if (tokens.refresh_token) row.refresh_token_enc = encryptToken(tokens.refresh_token);

    const { error: upsertError } = await supabaseAdmin
      .from("calendar_connections")
      .upsert(row, { onConflict: "owner_user_id,provider" });

    if (upsertError) {
      console.error("[OAUTH google/callback] upsert error:", upsertError);
      return backToCalendar("calendar_error=store_failed");
    }

    return backToCalendar("calendar_connected=google");
  } catch (err) {
    console.error("[OAUTH google/callback] error:", err);
    return backToCalendar("calendar_error=exchange_failed");
  }
}
