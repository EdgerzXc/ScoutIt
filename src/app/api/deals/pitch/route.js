import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { validateSampleInquiryRecipients } from "@/lib/sampleInventory";

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

    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("id, slug, owner_id, lifecycle_state, pipeline_status")
      .eq("id", listingId)
      .single();
    if (propertyError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.owner_id === brokerId) return NextResponse.json({ error: "Owners cannot pitch their own property" }, { status: 400 });
    const sampleRouting = validateSampleInquiryRecipients({
      slug: property.slug,
      recipientIds: [property.owner_id].filter(Boolean),
      allowlistValue: process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS,
    });
    if (!sampleRouting.ok) {
      return NextResponse.json(
        { error: "Sample broker pitches are unavailable until test routing is configured. No Connect was spent." },
        { status: 503 },
      );
    }

    const { data: existingRepresentation, error: representationLookupError } = await supabaseAdmin
      .from("property_broker_representations")
      .select("id, status")
      .eq("property_id", listingId)
      .eq("broker_id", brokerId)
      .maybeSingle();
    if (representationLookupError) return NextResponse.json({ error: "Representation service unavailable" }, { status: 503 });
    if (existingRepresentation?.status === "active") return NextResponse.json({ error: "You already represent this property" }, { status: 409 });
    if (existingRepresentation?.status === "locked" || existingRepresentation?.status === "suspended") return NextResponse.json({ error: "You are not currently eligible for a new representation request" }, { status: 409 });
    if (!existingRepresentation) {
      const { error: representationError } = await supabaseAdmin.from("property_broker_representations").insert({
        property_id: listingId,
        broker_id: brokerId,
        status: "pending",
        source: "broker_pitch",
      });
      if (representationError) return NextResponse.json({ error: "Failed to create representation request" }, { status: 503 });
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

    if (process.env.NODE_ENV !== 'production' && brokerId === 'master-dev') {
      spendData = [{ success: true, total_balance: 99 }];
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
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
