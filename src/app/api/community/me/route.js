import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { scoutIdFor } from "@/lib/communityPosting";

// Who am I on Community: persistent Scout ID + public display name for the
// composer's identity preview. Signed-in only; the ID derives from the
// account, so it is stable without a user-table column.
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    let displayName = null;
    let isPublic = false;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("user_profiles")
        .select("display_name, is_profile_public")
        .eq("id", userId)
        .maybeSingle();
      displayName = data?.display_name || null;
      isPublic = data?.is_profile_public === true;
    }
    return NextResponse.json({
      ok: true,
      scoutId: scoutIdFor(userId),
      displayName,
      isPublic,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
