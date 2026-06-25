import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { listingId, brokerName, userId, role = 'owner' } = await request.json();

    if (!listingId || !brokerName || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the user's connect balances (3-bucket: granted, purchased, earned)
    // Query by (user_id, role) — one wallet row per role per user
    const { data: balanceData } = await supabase
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
      const { data: profileData } = await supabase
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

    // 2. Insert into deals (handshake)
    const { data: dealData, error: dealError } = await supabase.from('deals').insert([{
      property_id: listingId,
      broker_id: brokerName,
      status: 'invited',
      pitch_message: `Owner invited ${brokerName} to represent this property.`
    }]).select();

    if (dealError || !dealData) {
      console.error("[INVITE API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to create handshake" }, { status: 500 });
    }

    // 3. Debit 1 Connect — spend granted first, then purchased, then earned
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
    const { error: txError } = await supabase.from('connect_transactions').insert([{
      user_id: userId,
      role,
      kind: 'spend',
      bucket: spentBucket,
      amount: -1,
      reason: 'Owner invited a broker (handshake)',
      ref_type: 'handshake',
      ref_id: listingId
    }]);

    if (txError) {
      console.error("[INVITE API] Failed to record transaction:", txError);
      await supabase.from('deals').delete().eq('id', dealData[0].id);
      return NextResponse.json({ error: "Transaction failed. No Connects spent." }, { status: 500 });
    }

    // Update the balances table (scoped to this role's wallet row)
    if (balanceData) {
      await supabase.from('connect_balances')
        .update(updates)
        .eq('user_id', userId)
        .eq('role', role);
    }

    const newBalance = totalBalance - toDeduct;

    // Keep user_profiles cache in sync
    await supabase.from('user_profiles')
      .update({ connects_balance: newBalance })
      .eq('id', userId);

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance });

  } catch (err) {
    console.error("[INVITE API] Error during invite process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
