import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { decryptToken } from "@/lib/calendar/tokenCrypto";

// POST /api/oauth/google/disconnect
// Best-effort revoke at Google, then remove the stored connection. Idempotent.
export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: conn } = await supabaseAdmin
      .from("calendar_connections")
      .select("access_token_enc, refresh_token_enc")
      .eq("owner_user_id", userId)
      .eq("provider", "google")
      .single();

    // Revoke at Google if we can (don't fail the disconnect if this errors).
    if (conn) {
      try {
        const token = conn.refresh_token_enc
          ? decryptToken(conn.refresh_token_enc)
          : conn.access_token_enc
          ? decryptToken(conn.access_token_enc)
          : null;
        if (token) {
          await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          });
        }
      } catch (revokeErr) {
        console.warn("[OAUTH google/disconnect] revoke skipped:", revokeErr?.message);
      }
    }

    await supabaseAdmin
      .from("calendar_connections")
      .delete()
      .eq("owner_user_id", userId)
      .eq("provider", "google");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[OAUTH google/disconnect] error:", err);
    return NextResponse.json({ error: "Could not disconnect" }, { status: 500 });
  }
}
