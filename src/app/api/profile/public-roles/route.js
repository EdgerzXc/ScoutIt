import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Which of a user's roles are publicly displayable (privacy_settings.public_roles).
// The 2026-07-09 RLS reset correctly locked privacy_settings to own-rows-only,
// which broke /profile/[username]: a visitor could no longer read the target
// profile's public_roles, so no role panel (broker stats, researcher stats,
// photographer portfolio) ever rendered on any public profile. public_roles
// exists precisely to control public display, so serving it for a PUBLIC
// profile is by design — this route does that server-side (service role) and
// only for profiles that are is_profile_public.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const { data: profile, error: profError } = await supabaseAdmin
      .from("user_profiles")
      .select("is_profile_public")
      .eq("id", userId)
      .single();
    if (profError || !profile || !profile.is_profile_public) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: privacy } = await supabaseAdmin
      .from("privacy_settings")
      .select("public_roles")
      .eq("user_id", userId)
      .maybeSingle();

    // user_badges is own-rows-only under RLS (same 2026-07-09 reset), so the
    // anon client returns [] for every visitor — public profiles showed zero
    // earned badges. Badges are public-display data by definition (they're
    // rendered on the public profile page), so serve them here the same way
    // as public_roles: service-role, public profiles only.
    const { data: badgeRows } = await supabaseAdmin
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", userId);

    return NextResponse.json({
      publicRoles: privacy?.public_roles || [],
      badges: badgeRows || [],
    });
  } catch (err) {
    console.error("[PUBLIC ROLES API] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
