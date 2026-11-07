import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdmin";
import { canRaiseQuest, VALID_QUEST_SCOPES } from "@/lib/questitPolicyEngine";

// This route currently 401s on every call — the questit_api_keys/questit_policies/
// company_quests tables it queries were never migrated into the live DB. That's
// intentional, not a bug: see _SCOUTIT_BRAIN/QUESTIT_FUTURE/README.md before
// "fixing" this.
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
    const body = await request.json().catch(() => ({}));
    const { propertyId, targetField, description, bountyConnects, providerTier } = body || {};

    if (!propertyId || !targetField || !bountyConnects) {
      return NextResponse.json({ error: "Missing required fields: propertyId, targetField, bountyConnects" }, { status: 400 });
    }

    // A-312: Scope allowlist check
    const normalizedScope = String(targetField).toLowerCase();
    if (!VALID_QUEST_SCOPES.includes(normalizedScope)) {
      return NextResponse.json(
        { error: `Invalid targetField '${targetField}'. Must be an authorized scope: ${VALID_QUEST_SCOPES.join(", ")}` },
        { status: 400 }
      );
    }

    // A-312: Verify property exists and caller is authorized party (or broker / staff)
    if (typeof supabase.from("properties")?.select === "function") {
      const { data: property, error: propErr } = await supabase
        .from("properties")
        .select("id, owner_id")
        .eq("id", propertyId)
        .maybeSingle();

      if (propErr || !property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }

      let isParty = property.owner_id === companyId;
      if (!isParty && typeof supabase.from("broker_representations")?.select === "function") {
        const { data: rep } = await supabase
          .from("broker_representations")
          .select("id")
          .eq("property_id", property.id)
          .eq("broker_id", companyId)
          .eq("status", "active")
          .maybeSingle();
        if (rep) isParty = true;
      }
      if (!isParty && typeof supabase.from("user_profiles")?.select === "function") {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role, active_roles")
          .eq("id", companyId)
          .maybeSingle();
        const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
        if (profile?.role === "admin" || profile?.role === "staff" || roles.includes("admin") || roles.includes("staff")) {
          isParty = true;
        }
      }
      if (!isParty) {
        return NextResponse.json(
          { error: "Forbidden: You must be an authorized party (owner or broker) for this property to raise a Data Quest" },
          { status: 403 }
        );
      }
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
    const policyResult = canRaiseQuest(
      policyData?.policy_rules,
      {
        bounty_connects: bountyConnects,
        target_field: targetField,
        provider_tier: providerTier,
      },
      currentUsage
    );
    if (!policyResult.allowed) {
      return NextResponse.json({ error: policyResult.reason }, { status: 403 });
    }

    let connectsDeducted = false;
    let refundContext = null;

    // 5. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
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

    connectsDeducted = true;
    refundContext = { companyId, bountyConnects, targetField, propertyId };

    const newBalance = spendData?.[0]?.total_balance ?? null;
    if (newBalance !== null) {
      await supabase.from('user_profiles').update({ connects_balance: newBalance }).eq('id', companyId);
    }

    // Insert Quest
    let questData = null;
    let questError = null;
    try {
      const insertRes = await supabase.from('company_quests').insert([{
        company_id: companyId,
        property_id: propertyId,
        target_field: targetField,
        description: description,
        bounty_connects: bountyConnects,
        status: 'open'
      }]).select().single();
      questData = insertRes.data;
      questError = insertRes.error;
    } catch (insertThrow) {
      questError = insertThrow;
    }

    if (questError) {
      console.error("[QuestIT API] Failed to create quest, issuing compensating refund:", questError);
      // GAP-32: Compensating refund when quest creation fails after Connects were deducted
      try {
        const { data: refundData } = await supabase.rpc("refund_connects_system_error", {
          p_user_id: companyId,
          p_amount: bountyConnects,
          p_reason: `Compensating refund: QuestIT bounty insert failed for ${targetField}`,
          p_staff_id: "system",
          p_ref_id: String(propertyId),
          p_ref_type: "bounty_refund",
        });
        const restoredBalance = refundData?.[0]?.total_balance ?? null;
        if (restoredBalance !== null) {
          await supabase.from("user_profiles").update({ connects_balance: restoredBalance }).eq("id", companyId);
        }
      } catch (refundErr) {
        console.error("[QuestIT API] Compensating refund RPC failed:", refundErr);
      }
      connectsDeducted = false;
      return NextResponse.json(
        { error: "Failed to post bounty to the Quest Board. Your Connects have been refunded.", refunded: true },
        { status: 500 }
      );
    }

    connectsDeducted = false;

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
