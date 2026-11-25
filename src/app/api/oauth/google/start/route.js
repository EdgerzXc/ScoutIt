import crypto from "crypto";
import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { isGoogleConfigured, buildConsentUrl } from "@/lib/calendar/googleOAuth";
import { signState } from "@/lib/calendar/oauthState";

export const OAUTH_NONCE_COOKIE = "scoutit_google_oauth_nonce";

// GET /api/oauth/google/start
// Authenticated (bearer, called via crmFetch). Returns the Google consent URL
// with a signed state + HttpOnly CSRF nonce cookie binding the browser flow to
// this user.
export async function GET(request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar sync isn't configured yet." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } }
      );
    }
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    const csrfNonce = crypto.randomBytes(24).toString("hex");
    const nonceHash = crypto.createHash("sha256").update(csrfNonce).digest("hex");
    const state = signState({ userId, provider: "google", nonceHash });

    const res = NextResponse.json(
      { url: buildConsentUrl(state) },
      { headers: { "Cache-Control": "private, no-store" } }
    );
    res.cookies.set(OAUTH_NONCE_COOKIE, csrfNonce, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/oauth/google/callback",
      maxAge: 600,
    });
    return res;
  } catch (err) {
    console.error("[OAUTH google/start] error:", err);
    return NextResponse.json(
      { error: "Could not start Google connect" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}
