import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";

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

    // No inactivity write-back here, deliberately. `deals` has NO `updated_at`
    // column (verified against the live database 2026-08-06, §58/C28), so the
    // statement this replaced failed on every scheduled viewing, and nothing
    // checked its error — the "reset chat inactivity timer" it claimed to do
    // has never once happened.
    //
    // The same bug was already found and fixed in /api/deals/[id]/messages,
    // which documents the resolution: "most recent conversation" is derived
    // from `deal_messages.created_at`, so no write-back is needed. This route
    // inserts a [SYSTEM] deal_message just above, which is exactly that
    // signal — the timer is already reset by the message itself.
    //
    // `pending_clock_reset_at` is deliberately NOT touched: it drives the
    // pending-request archive/delete sweep for requests nobody has answered,
    // and a scheduling action is not an answer. Repurposing it here would
    // change a lifecycle rule, which is an owner decision, not a bug fix.

    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: deal.property_id,
      activityType: "viewing_scheduled",
      actorId: user.id,
      metadata: { scheduledAt: scheduled_at, appointmentId: appointment.id },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
