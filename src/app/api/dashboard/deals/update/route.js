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

    const { dealId, newStatus } = await request.json();

    if (!dealId || !newStatus || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Fetch the deal to verify authorization
    const { data: deal, error: fetchError } = await supabaseAdmin
      .from('deals')
      .select('*, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (fetchError || !deal) {
      console.error("[DEAL UPDATE API] Failed to fetch deal:", fetchError);
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const isBroker = deal.broker_id === userId;
    const isOwner = deal.properties?.owner_id === userId;

    if (!isBroker && !isOwner) {
      return NextResponse.json({ error: "Unauthorized: You are not a party to this deal" }, { status: 403 });
    }

    // Optional: add strict rules about who can accept/decline what.
    // e.g. If status is 'invited', the broker must be the one to accept.
    if (deal.status === 'invited' && newStatus === 'accepted' && !isBroker) {
      return NextResponse.json({ error: "Only the broker can accept an invitation" }, { status: 403 });
    }

    // 2. Update the deal
    const { error: updateError } = await supabaseAdmin
      .from('deals')
      .update({ status: newStatus })
      .eq('id', dealId);

    if (updateError) {
      console.error("[DEAL UPDATE API] Failed to update deal:", updateError);
      return NextResponse.json({ error: "Failed to update deal status" }, { status: 500 });
    }

    return NextResponse.json({ success: true, dealId, newStatus });

  } catch (err) {
    console.error("[DEAL UPDATE API] Error during deal update:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
