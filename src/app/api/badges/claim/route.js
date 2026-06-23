import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { badgeId, userId } = await request.json();

    if (!badgeId || !userId) {
      return NextResponse.json({ error: "Missing badgeId or userId" }, { status: 400 });
    }

    // 1. Fetch the user's current badges array
    const { data: userProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('badges')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error("[CLAIM API] Failed to fetch user profile:", fetchError);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const currentBadges = userProfile.badges || [];

    // 2. Verify the user hasn't already claimed the badge
    const hasBadge = currentBadges.some(b => b.id === badgeId);
    if (hasBadge) {
      return NextResponse.json({ error: "Badge already claimed" }, { status: 400 });
    }

    // 3. Append the new badge
    const newBadge = {
      id: badgeId,
      minted_at: new Date().toISOString()
    };
    
    const updatedBadges = [...currentBadges, newBadge];

    // 4. Update the user profile in Supabase
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ badges: updatedBadges })
      .eq('id', userId);

    if (updateError) {
      console.error("[CLAIM API] Failed to update badges:", updateError);
      return NextResponse.json({ error: "Failed to mint badge" }, { status: 500 });
    }

    return NextResponse.json({ success: true, badge: newBadge, badges: updatedBadges });

  } catch (err) {
    console.error("[CLAIM API] Error during badge claim process:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
