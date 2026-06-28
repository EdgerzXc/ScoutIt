import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header to prevent identity spoofing
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

    const { listingId, message, role = 'buyer' } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // 1. Fetch the user's connect balances using the Admin client
    const { data: balanceData } = await supabaseAdmin
      .from('connect_balances')
      .select('granted_balance, purchased_balance, earned_balance')
      .eq('user_id', userId)
      .eq('role', role)
      .single();

    // Fall back to user_profiles cache if no wallet row exists yet
    let granted = 0, purchased = 0, earned = 0;
    if (balanceData) {
      granted   = balanceData.granted_balance   || 0;
      purchased = balanceData.purchased_balance || 0;
      earned    = balanceData.earned_balance    || 0;
    } else {
      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('connects_balance')
        .eq('id', userId)
        .single();
      if (profileData) granted = profileData.connects_balance || 0;
    }

    const totalBalance = granted + purchased + earned;
    if (totalBalance < 1) {
      return NextResponse.json({ error: "Insufficient Connects balance." }, { status: 403 });
    }

    // 2. Insert into deals
    // Expire 14 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: listingId,
      buyer_id: userId,
      status: 'connected',
      expires_at: expiresAt.toISOString(),
      pitch_message: message || `Buyer initiated contact.`
    }]).select();

    if (dealError || !dealData) {
      console.error("[INITIATE API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to initiate chat." }, { status: 500 });
    }

    // 3. Debit 1 Connect
    let toDeduct = 1;
    const updates = {};
    let spentBucket = 'granted';

    if (granted > 0) {
      updates.granted_balance = granted - 1;
      spentBucket = 'granted';
    } else if (purchased > 0) {
      updates.purchased_balance = purchased - 1;
      spentBucket = 'purchased';
    } else {
      updates.earned_balance = earned - 1;
      spentBucket = 'earned';
    }
    updates.updated_at = new Date().toISOString();

    // Insert the immutable transaction record
    const { error: txError } = await supabaseAdmin.from('connect_transactions').insert([{
      user_id: userId,
      role,
      kind: 'spend',
      bucket: spentBucket,
      amount: -1,
      reason: 'Buyer contacted owner',
      ref_type: 'initiate_chat',
      ref_id: listingId
    }]);

    if (txError) {
      console.error("[INITIATE API] Failed to record transaction:", txError);
      await supabaseAdmin.from('deals').delete().eq('id', dealData[0].id);
      return NextResponse.json({ error: "Transaction failed. No Connects spent." }, { status: 500 });
    }

    // Update the balances table
    if (balanceData) {
      await supabaseAdmin.from('connect_balances')
        .update(updates)
        .eq('user_id', userId)
        .eq('role', role);
    }

    const newBalance = totalBalance - toDeduct;

    // Keep user_profiles cache in sync
    await supabaseAdmin.from('user_profiles')
      .update({ connects_balance: newBalance })
      .eq('id', userId);

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance });

  } catch (err) {
    console.error("[INITIATE API] Error during initiate process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
