import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;
    
    // Auth check
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate access (buyer, broker, or owner)
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const isParty = 
      deal.buyer_id === user.id || 
      deal.broker_id === user.id || 
      deal.properties?.owner_id === user.id;

    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('deal_messages')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const { body, role } = await request.json();

    if (!body || !role) {
      return NextResponse.json({ error: "Missing body or role" }, { status: 400 });
    }

    // Validate access & check if deal is active
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (deal.status === 'closed') {
      return NextResponse.json({ error: "This conversation has been closed and is read-only." }, { status: 403 });
    }

    const isParty = 
      deal.buyer_id === user.id || 
      deal.broker_id === user.id || 
      deal.properties?.owner_id === user.id;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Insert message
    const { data: message, error: insertError } = await supabaseAdmin
      .from('deal_messages')
      .insert([{
        deal_id: dealId,
        sender_id: user.id,
        sender_role: role,
        body
      }])
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });

    // Reset 72-hour inactivity timer (updated_at)
    await supabaseAdmin
      .from('deals')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', dealId);

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
