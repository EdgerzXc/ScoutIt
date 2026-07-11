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

    // Remove userId from the body destructuring, trust the token
    const { listingId, brokerName } = await request.json();

    if (!listingId || !brokerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Resolve the typed name to a real broker's user id — `deals.broker_id`
    // must be a UUID for GET /api/deals's `.eq("broker_id", userId)` to ever
    // find this deal. Storing the raw typed string here (the previous
    // behavior) permanently orphaned the invite: no broker account could
    // ever see it in their Inbox, since their real user id never matched.
    const { data: brokerMatches, error: brokerLookupError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name')
      .ilike('display_name', brokerName.trim())
      .contains('active_roles', ['broker']);

    if (brokerLookupError) {
      console.error("[INVITE API] Broker lookup failed:", brokerLookupError);
      return NextResponse.json({ error: "Failed to look up broker" }, { status: 500 });
    }
    if (!brokerMatches || brokerMatches.length === 0) {
      return NextResponse.json({ error: `No broker named "${brokerName}" found. Check the spelling or PRC number.` }, { status: 404 });
    }
    if (brokerMatches.length > 1) {
      return NextResponse.json({ error: `Multiple brokers named "${brokerName}" found — ask them for their PRC number to disambiguate.` }, { status: 409 });
    }
    const resolvedBrokerId = brokerMatches[0].id;

    // 1. Insert the handshake deal first — rolled back below if the Connect spend fails
    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: listingId,
      broker_id: resolvedBrokerId,
      status: 'invited',
      pitch_message: `Owner invited ${brokerMatches[0].display_name} to represent this property.`
    }]).select();

    if (dealError || !dealData) {
      console.error("[INVITE API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to create handshake" }, { status: 500 });
    }

    // 2. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
    // NOTE: connect_balances/connect_transactions have no `role` column in the live schema
    // (per-role wallets are a documented but unbuilt design) — the wallet is per user_id only.
    const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: 'Owner invited a broker (handshake)',
      p_ref_type: 'handshake',
      p_ref_id: listingId,
    });

    if (spendError) {
      console.error("[INVITE API] Connect spend failed:", spendError);
      await supabaseAdmin.from('deals').delete().eq('id', dealData[0].id);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;

    // Keep the user_profiles cache in sync (best-effort display cache; not the source of truth)
    if (newBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', userId);
    }

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance });

  } catch (err) {
    console.error("[INVITE API] Error during invite process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
