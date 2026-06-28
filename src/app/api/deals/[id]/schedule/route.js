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

    const { scheduled_at, notes } = await request.json();
    if (!scheduled_at) {
      return NextResponse.json({ error: "Missing scheduled_at" }, { status: 400 });
    }

    // Validate access to the deal and fetch host_id (the broker/owner)
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, buyer_id, broker_id, property_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (deal.status === 'closed') {
      return NextResponse.json({ error: "Cannot schedule a viewing for a closed chat." }, { status: 403 });
    }

    if (deal.buyer_id !== user.id) {
      return NextResponse.json({ error: "Only the buyer can request a schedule" }, { status: 403 });
    }

    const hostId = deal.broker_id || deal.properties?.owner_id;

    if (!hostId) {
      return NextResponse.json({ error: "Could not determine host" }, { status: 500 });
    }

    // Insert the pending appointment
    const { data: appointment, error: insertError } = await supabaseAdmin
      .from('viewing_appointments')
      .insert([{
        deal_id: dealId,
        host_id: hostId,
        guest_id: user.id,
        property_id: deal.property_id,
        scheduled_at: scheduled_at,
        notes: notes || '',
        status: 'pending'
      }])
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to save appointment" }, { status: 500 });
    }

    // Optionally: Automatically insert a system message into the chat 
    // to notify the host that a schedule was requested.
    await supabaseAdmin.from('deal_messages').insert([{
      deal_id: dealId,
      sender_id: user.id,
      sender_role: 'buyer',
      body: `[SYSTEM] The buyer has requested a live viewing for: ${new Date(scheduled_at).toLocaleString()}`
    }]);

    // Reset chat inactivity timer
    await supabaseAdmin.from('deals').update({ updated_at: new Date().toISOString() }).eq('id', dealId);

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
