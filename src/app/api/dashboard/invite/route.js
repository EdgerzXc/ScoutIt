import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request) {
  try {
    const { listingId, brokerName, userId } = await request.json();

    if (!listingId || !brokerName || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the user's connect balances
    const { data: balanceData, error: balanceError } = await supabase
      .from('connect_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If no row exists, we assume they have 0 connects (or we can fallback to user_profiles)
    let currentBalance = 0;
    if (balanceData) {
      currentBalance = balanceData.granted_balance || 0;
    } else {
      // Try to get from user_profiles as fallback
      const { data: profileData } = await supabase.from('user_profiles').select('connects_balance').eq('id', userId).single();
      if (profileData) currentBalance = profileData.connects_balance || 0;
    }

    if (currentBalance < 1) {
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

    // 3. Atomically debit Connects via ledger transaction
    const newBalance = currentBalance - 1;
    
    // Insert the transaction record
    const { error: txError } = await supabase.from('connect_transactions').insert([{
      user_id: userId,
      kind: 'spend',
      bucket: 'granted',
      amount: -1,
      reason: 'Owner invited a broker (handshake)',
      ref_type: 'handshake',
      ref_id: listingId
    }]);

    if (txError) {
      console.error("[INVITE API] Failed to record transaction:", txError);
      // Rollback deal if transaction failed (simple compensation)
      await supabase.from('deals').delete().eq('id', dealData[0].id);
      return NextResponse.json({ error: "Transaction failed. No Connects spent." }, { status: 500 });
    }

    // Update the balances table
    if (balanceData) {
      await supabase.from('connect_balances')
        .update({ granted_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
    }

    // Also update the simple cache in user_profiles
    await supabase.from('user_profiles')
      .update({ connects_balance: newBalance })
      .eq('id', userId);

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance });

  } catch (err) {
    console.error("[INVITE API] Error during invite process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
