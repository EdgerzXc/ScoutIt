import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";

// Broker-initiated pitch (Market Intelligence Feed -> "Open Deal File").
// `deals` has an explicit RLS policy blocking ALL direct client inserts
// ("Users cannot insert deals directly", with_check: false) — DashboardContext's
// old sendPitch() called supabase.from('deals').insert() directly from the
// client, which the RLS hardening pass silently started rejecting on every
// single call. Combined with an unawaited promise in BrokerMode's
// handleSendPitch, the failure was invisible: the modal closed as if the
// pitch succeeded, the Connect was spent (client-side optimistic display),
// and no deal was ever created. This route follows the same
// verified-token + supabaseAdmin + spend_connects pattern already proven in
// /api/dashboard/invite and /api/deals/initiate.


export async function POST(request) {
  try {
    const { listingId, message  } = await request.json();

    const brokerId = await resolveUserId(request);
    if (!brokerId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    if (!listingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // 1. Insert the pitch deal first — rolled back below if the Connect spend fails.
    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: listingId,
      broker_id: brokerId,
      status: 'pending',
      pitch_message: message || 'A broker has expressed interest in representing this property.',
    }]).select();

    if (dealError || !dealData) {
      console.error("[PITCH API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to create pitch" }, { status: 500 });
    }

    // 2. Atomic Connect spend — same spend_connects RPC every other paid
    // action uses (balance check + 3-bucket deduction + ledger insert).
    let spendError = null;
    let spendData = null;

    if (process.env.NODE_ENV !== 'production' && mockOwnerId) {
      spendData = { success: true };
    } else {
      const res = await supabaseAdmin.rpc('spend_connects', {
        p_user_id: brokerId,
        p_amount: 1,
        p_reason: 'Broker pitched an owner (deal file)',
        p_ref_type: 'pitch',
        p_ref_id: listingId,
      });
      spendError = res.error;
      spendData = res.data;
    }

    if (spendError) {
      console.error("[PITCH API] Connect spend failed:", spendError);
      await supabaseAdmin.from('deals').delete().eq('id', dealData[0].id);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;
    if (newBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', brokerId);
    }

    // Notify the owner — the same real-time signal every other deal-creating
    // route sends; a pitch landing with no notification is exactly the kind
    // of silent gap this route exists to close.
    const { data: propertyRow } = await supabaseAdmin
      .from('properties')
      .select('title, owner_id')
      .eq('id', listingId)
      .single();

    if (propertyRow?.owner_id && propertyRow.owner_id !== brokerId) {
      await notifyUser(supabaseAdmin, {
        userId: propertyRow.owner_id,
        title: 'New broker pitch',
        desc: `A broker wants to represent "${propertyRow.title || 'your property'}".`,
        icon: '🤝',
        propertyId: listingId,
        notificationType: 'broker_pitch',
      });
    }

    await logActivity(supabaseAdmin, {
      dealId: dealData[0].id,
      propertyId: listingId,
      activityType: 'deal_created',
      actorId: brokerId,
      metadata: { source: 'broker_pitch' },
    });

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance, propertyTitle: propertyRow?.title });

  } catch (err) {
    console.error("[PITCH API] Error during pitch process:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
