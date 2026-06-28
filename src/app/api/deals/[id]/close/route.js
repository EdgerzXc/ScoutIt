import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    
    // Auth check
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate access
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isParty = 
      deal.buyer_id === user.id || 
      deal.broker_id === user.id || 
      deal.properties?.owner_id === user.id;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (deal.status === 'closed') {
      return NextResponse.json({ success: true, message: "Already closed." });
    }

    // Set to closed and start the 7-day archive timer
    const { error: updateError } = await supabaseAdmin
      .from('deals')
      .update({ 
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('id', dealId);

    if (updateError) return NextResponse.json({ error: "Failed to close deal" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
