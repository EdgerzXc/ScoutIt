import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
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

    // 5. Check Connects Ledger
    const { data: balanceData } = await supabase
      .from('connect_balances')
      .select('granted_balance')
      .eq('user_id', companyId)
      .single();

    const currentBalance = balanceData?.granted_balance || 0;
    if (currentBalance < bountyConnects) {
      return NextResponse.json({ error: "Insufficient Connects to fund this bounty." }, { status: 402 });
    }

    // 6. Transact: Deduct Connects & Insert Quest
    const newBalance = currentBalance - bountyConnects;

    // Insert Transaction
    await supabase.from('connect_transactions').insert([{
      user_id: companyId,
      kind: 'spend',
      bucket: 'granted',
      amount: -bountyConnects,
      reason: `API Quest Raised for ${targetField}`,
      ref_type: 'bounty',
      ref_id: propertyId
    }]);

    // Update Balance
    await supabase.from('connect_balances')
      .update({ granted_balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', companyId);
    
    await supabase.from('user_profiles')
      .update({ connects_balance: newBalance })
      .eq('id', companyId);

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
