import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { scoutIdFor } from "@/lib/communityPosting";
import { resolveTrustTier } from "@/lib/scoring/behavioralScoring";

// Who am I on Community: persistent Scout ID + public display name for the
// composer's identity preview + behavioral trust standing. Signed-in only; the
// ID derives from the account, so it is stable without a user-table column.
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    let displayName = null;
    let isPublic = false;
    let trustTier = "[First-Time Verified Seeker]";
    let compositeScore = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("display_name, is_profile_public")
        .eq("id", userId)
        .maybeSingle();
      displayName = data?.display_name || null;
      isPublic = data?.is_profile_public === true;

      try {
        const { data: metrics } = await supabaseAdmin
          .from("user_behavioral_metrics")
          .select("tier, display_badge, composite_score")
          .eq("user_id", userId)
          .maybeSingle();
        if (metrics) {
          compositeScore = metrics.composite_score != null ? Number(metrics.composite_score) : null;
          trustTier = metrics.display_badge || (compositeScore != null ? resolveTrustTier(compositeScore).displayBadge : "[First-Time Verified Seeker]");
        }
      } catch {
        // Table fallback
      }
    }
    return NextResponse.json({
      ok: true,
      scoutId: scoutIdFor(userId),
      displayName,
      isPublic,
      trustTier,
      compositeScore,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
