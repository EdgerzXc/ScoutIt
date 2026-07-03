import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { canRaiseQuest } from "@/lib/questitPolicyEngine";

export async function POST(request) {
  try {
    // 1. Authenticate API Key
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const apiKeyHash = authHeader.split(" ")[1];
    
    // In production, we should hash the incoming key and compare it to api_key_hash
    // For this prototype, we'll assume the client is sending the exact hash
    const { data: keyData, error: keyError } = await supabase
      .from('questit_api_keys')
      .select('user_id, is_active')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API Key" }, { status: 401 });
    }

    const companyId = keyData.user_id;

    // 2. Parse Request Payload
    const { propertyId, targetField, description, bountyConnects } = await request.json();

    if (!propertyId || !targetField || !bountyConnects) {
      return NextResponse.json({ error: "Missing required fields: propertyId, targetField, bountyConnects" }, { status: 400 });
    }

    // 3. Fetch Company Policy & Usage
    const { data: policyData } = await supabase
      .from('questit_policies')
      .select('policy_rules')
      .eq('user_id', companyId)
      .single();

    // Simple daily usage check (count today's quests)
    const todayStr = new Date().toISOString().split('T')[0];
    const { count: dailyCount } = await supabase
      .from('company_quests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', todayStr);

    const currentUsage = { dailyBountiesRaised: dailyCount || 0 };

    // 4. Evaluate Side System Policy
    const policyResult = canRaiseQuest(policyData?.policy_rules, { bounty_connects: bountyConnects }, currentUsage);
    if (!policyResult.allowed) {
      return NextResponse.json({ error: policyResult.reason }, { status: 403 });
    }

    // 5. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
    // NOTE: connect_balances/connect_transactions have no `role` column in the live schema
    // (per-role wallets are a documented but unbuilt design) — the wallet is per user_id only.
    const { data: spendData, error: spendError } = await supabase.rpc('spend_connects', {
      p_user_id: companyId,
      p_amount: bountyConnects,
      p_reason: `API Quest Raised for ${targetField}`,
      p_ref_type: 'bounty',
      p_ref_id: propertyId,
    });

    if (spendError) {
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects to fund this bounty." : "Connect spend failed." },
        { status: insufficient ? 402 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;
    if (newBalance !== null) {
      await supabase.from('user_profiles').update({ connects_balance: newBalance }).eq('id', companyId);
    }

    // Insert Quest
    const { data: questData, error: questError } = await supabase.from('company_quests').insert([{
      company_id: companyId,
      property_id: propertyId,
      target_field: targetField,
      description: description,
      bounty_connects: bountyConnects,
      status: 'open'
    }]).select().single();

    if (questError) {
      console.error("[QuestIT API] Failed to create quest:", questError);
      // NOTE: Connects were already spent by this point (the RPC succeeded, same order as
      // before this fix). Refunding on quest-insert failure is a known rare edge case, not
      // auto-handled — flagged rather than silently accepted.
      return NextResponse.json({ error: "Failed to post bounty to the Quest Board" }, { status: 500 });
    }

    // Also update API key last_used_at
    await supabase.from('questit_api_keys').update({ last_used_at: new Date().toISOString() }).eq('user_id', companyId);

    return NextResponse.json({
      success: true,
      message: "Quest successfully raised.",
      quest: questData,
      remaining_connects: newBalance

    });

  } catch (err) {
    console.error("[QuestIT API] Raise Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
