import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    const { badgeId } = await request.json();

    if (!badgeId || !userId) {
      return NextResponse.json({ error: "Missing badgeId or userId" }, { status: 400 });
    }

    // 1. Fetch the user's current badges array
    const { data: userProfile, error: fetchError } = await supabaseAdmin
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
    const { error: updateError } = await supabaseAdmin
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
