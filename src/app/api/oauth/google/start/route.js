import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { isGoogleConfigured, buildConsentUrl } from "@/lib/calendar/googleOAuth";
import { signState } from "@/lib/calendar/oauthState";

// GET /api/oauth/google/start
// Authenticated (bearer, called via crmFetch). Returns the Google consent URL
// with a signed state binding the flow to this user. The client then does a
// top-level navigation to that URL. Returns 503 (not 500) when unconfigured so
// the UI can show a clean "coming soon" instead of an error.
export async function GET(request) {
  try {
    if (!isGoogleConfigured()) {
      return NextResponse.json(
        { error: "Google Calendar sync isn't configured yet." },
        { status: 503 }
      );
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const state = signState({ userId, provider: "google" });
    return NextResponse.json({ url: buildConsentUrl(state) });
  } catch (err) {
    console.error("[OAUTH google/start] error:", err);
    return NextResponse.json({ error: "Could not start Google connect" }, { status: 500 });
  }
}
