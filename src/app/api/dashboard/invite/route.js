import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { isBlocked } from "@/lib/connectBlocks";
import { normalizeConnectSource, connectSourceMetadata } from "@/lib/connectSource";
import { checkReceiverGate, IDEMPOTENCY_WINDOW_MINUTES } from "@/lib/connectGates";
import { logActivity } from "@/lib/crmActivity";

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header to prevent identity spoofing
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

    // Remove userId from the body destructuring, trust the token
    const { listingId, brokerName, source_type, source_id, reason_tag, sender_identity_mode } = await request.json();
    const connectSource = normalizeConnectSource({ source_type, source_id, reason_tag, sender_identity_mode });

    if (!listingId || !brokerName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select("id, owner_id")
      .eq("id", listingId)
      .single();
    if (propertyError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.owner_id !== userId) return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    // Resolve the typed name to a real broker's user id — `deals.broker_id`
    // must be a UUID for GET /api/deals's `.eq("broker_id", userId)` to ever
    // find this deal. Storing the raw typed string here (the previous
    // behavior) permanently orphaned the invite: no broker account could
    // ever see it in their Inbox, since their real user id never matched.
    const { data: brokerMatches, error: brokerLookupError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name')
      .ilike('display_name', brokerName.trim())
      .contains('active_roles', ['broker']);

    if (brokerLookupError) {
      console.error("[INVITE API] Broker lookup failed:", brokerLookupError);
      return NextResponse.json({ error: "Failed to look up broker" }, { status: 500 });
    }
    if (!brokerMatches || brokerMatches.length === 0) {
      return NextResponse.json({ error: `No broker named "${brokerName}" found. Check the spelling or PRC number.` }, { status: 404 });
    }
    if (brokerMatches.length > 1) {
      return NextResponse.json({ error: `Multiple brokers named "${brokerName}" found — ask them for their PRC number to disambiguate.` }, { status: 409 });
    }
    const resolvedBrokerId = brokerMatches[0].id;
    // A-144 invariant #6 FIRST (before any write): a broker who blocked the
    // owner fails with 0 spend and no representation phantom.
    if (await isBlocked(supabaseAdmin, userId, resolvedBrokerId)) {
      return NextResponse.json(
        { error: "This request can't be sent. No Connect was spent." },
        { status: 403 },
      );
    }

    // A-144 §10.10 invite dedup: a recent identical invite is reused, never
    // re-spent. Invite rows carry the recipient in broker_id (no buyer_id),
    // so the generic buyer/broker dedup cannot see them — this query can.
    try {
      const inviteWindowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000).toISOString();
      const { data: recentInvites } = await supabaseAdmin
        .from("deals")
        .select("id, created_at")
        .eq("property_id", listingId)
        .eq("broker_id", resolvedBrokerId)
        .eq("status", "invited")
        .gte("created_at", inviteWindowStart)
        .order("created_at", { ascending: true })
        .limit(1);
      if (Array.isArray(recentInvites) && recentInvites.length > 0) {
        return NextResponse.json({ success: true, dealId: recentInvites[0].id, connects_spent: 0, deduped: true, source_context: connectSource });
      }
    } catch {
      // Dedup is best-effort — a lookup failure never blocks a first send.
    }

    // A-144 §8 receiver gate for the invited broker.
    const brokerGate = await checkReceiverGate(supabaseAdmin, resolvedBrokerId, listingId);
    if (!brokerGate.ok) {
      return NextResponse.json(
        { error: brokerGate.message || "This broker isn't accepting new Connects right now. No Connect was spent." },
        { status: 403 },
      );
    }

    const { data: existingRepresentation, error: representationLookupError } = await supabaseAdmin
      .from('property_broker_representations')
      .select("id, status")
      .eq("property_id", listingId)
      .eq("broker_id", resolvedBrokerId)
      .maybeSingle();
    if (representationLookupError) return NextResponse.json({ error: "Representation service unavailable" }, { status: 503 });
    if (existingRepresentation?.status === "active") return NextResponse.json({ error: "This broker already represents the property" }, { status: 409 });
    if (existingRepresentation?.status === "locked" || existingRepresentation?.status === "suspended") return NextResponse.json({ error: "This broker is not currently eligible for a new representation request" }, { status: 409 });
    let createdRepresentationId = null;
    if (!existingRepresentation) {
      const { data: createdRepresentation, error: representationError } = await supabaseAdmin.from("property_broker_representations").insert({
        property_id: listingId,
        broker_id: resolvedBrokerId,
        status: "pending",
        source: "owner_invite",
      }).select("id").maybeSingle();
      if (representationError) return NextResponse.json({ error: "Failed to create representation request" }, { status: 503 });
      createdRepresentationId = createdRepresentation?.id || null;
    }
    // A-144 §10.10: a failed invite leaves no phantom representation.
    const rollbackInviteSideEffects = async (dealId) => {
      if (dealId) await supabaseAdmin.from('deals').delete().eq('id', dealId);
      if (createdRepresentationId) await supabaseAdmin.from('property_broker_representations').delete().eq('id', createdRepresentationId);
    };

    // 1. Insert the handshake deal first — rolled back below if the Connect spend fails
    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: listingId,
      broker_id: resolvedBrokerId,
      status: 'invited',
      pitch_message: `Owner invited ${brokerMatches[0].display_name} to represent this property.`
    }]).select();

    if (dealError || !dealData) {
      console.error("[INVITE API] Failed to insert deal:", dealError);
      return NextResponse.json({ error: "Failed to create handshake" }, { status: 500 });
    }

    // 2. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
    // NOTE: connect_balances/connect_transactions have no `role` column in the live schema
    // (per-role wallets are a documented but unbuilt design) — the wallet is per user_id only.
    const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: 'Owner invited a broker (handshake)',
      p_ref_type: 'handshake',
      p_ref_id: listingId,
    });

    if (spendError) {
      console.error("[INVITE API] Connect spend failed:", spendError);
      await rollbackInviteSideEffects(dealData[0].id);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;

    // Keep the user_profiles cache in sync (best-effort display cache; not the source of truth)
    if (newBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', userId);
    }

    // A-144 audit: source context on the handshake activity row (no schema change).
    await logActivity(supabaseAdmin, {
      dealId: dealData[0].id,
      propertyId: listingId,
      activityType: 'deal_created',
      actorId: userId,
      metadata: { source: 'owner_invite', ...connectSourceMetadata(connectSource, { reason_tag: 'REPRESENTATION_REQUEST' }) },
    });

    return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance, source_context: connectSource });

  } catch (err) {
    console.error("[INVITE API] Error during invite process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
