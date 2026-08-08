import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";

// ── RA 9646 PRC verification queue ──────────────────────────────────────────
// GET  → every profile that submitted a PRC license, with verification state.
// POST → { userId, verified } — staff marks a credential checked (or revokes).
// The "PRC Verified" badge renders ONLY from prc_verified, never from the mere
// presence of a license number. Same admin-auth pattern as /api/admin/approve.

export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN PRC" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("id, display_name, firm, prc_license, dhsud_number, prc_expiry, prc_verified, prc_verified_at")
      .not("prc_license", "is", null)
      .neq("prc_license", "")
      .order("prc_verified", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[ADMIN PRC] Fetch failed:", error);
      return NextResponse.json({ error: "Failed to fetch PRC queue" }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: data || [] });
  } catch (err) {
    console.error("[ADMIN PRC] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "ADMIN PRC" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const { userId, verified } = body || {};
    if (!userId || typeof verified !== "boolean") {
      return NextResponse.json({ error: "Missing userId or verified flag" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("user_profiles")
      .update({
        prc_verified: verified,
        prc_verified_at: verified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error("[ADMIN PRC] Update failed:", error);
      return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[ADMIN PRC] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
