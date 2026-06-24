import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(request) {
  try {
    // 1. Authenticate API Key
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const apiKeyHash = authHeader.split(" ")[1];
    
    const { data: keyData, error: keyError } = await supabase
      .from('questit_api_keys')
      .select('user_id, is_active')
      .eq('api_key_hash', apiKeyHash)
      .single();

    if (keyError || !keyData || !keyData.is_active) {
      return NextResponse.json({ error: "Invalid or inactive API Key" }, { status: 401 });
    }

    const companyId = keyData.user_id;

    // 2. Fetch quests for this company
    // Optionally handle query params like ?status=open or ?propertyId=xxx
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const propertyIdParam = searchParams.get('propertyId');

    let query = supabase
      .from('company_quests')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (statusParam) {
      query = query.eq('status', statusParam);
    }
    if (propertyIdParam) {
      query = query.eq('property_id', propertyIdParam);
    }

    const { data: quests, error: fetchError } = await query;

    if (fetchError) {
      console.error("[QuestIT API] Failed to fetch quests:", fetchError);
      return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: quests.length, data: quests });

  } catch (err) {
    console.error("[QuestIT API] Fetch Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
