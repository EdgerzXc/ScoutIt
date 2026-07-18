import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { isGoogleConfigured } from "@/lib/calendar/googleOAuth";

// Never cache: the configured flag + per-user connection must be read live, or
// a stale "Setup pending" can stick in the client after creds go active.
export const dynamic = "force-dynamic";

// GET /api/calendar/connection
// Reports whether calendar sync is configured on the server and, if so, the
// caller's current connection (provider + account email + status). NEVER
// returns token columns.
export async function GET(request) {
  try {
    const googleConfigured = isGoogleConfigured();

    if (!supabaseAdmin) {
      return NextResponse.json({ googleConfigured, connections: [] });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("calendar_connections")
      .select("provider, account_email, status, token_expires_at, updated_at")
      .eq("owner_user_id", userId);

    if (error) {
      console.error("[CALENDAR connection] error:", error);
      return NextResponse.json({ googleConfigured, connections: [] });
    }

    const connections = (data || []).map((c) => ({
      provider: c.provider,
      accountEmail: c.account_email,
      status: c.status,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({ googleConfigured, connections });
  } catch (err) {
    console.error("[CALENDAR connection] exception:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
