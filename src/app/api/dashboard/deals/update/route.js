import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";
import { representationStatusUpdate } from "@/lib/brokerRepresentation";
import {
  isBrokerRepresentationDeal,
  mayAnswerBrokerRequest,
  representationStateForAnswer,
} from "@/lib/deals/delegationDisclosure";

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

    if (deal.status === 'invited' && newStatus === 'accepted' && !isBroker) {
      return NextResponse.json({ error: "Only the broker can accept an invitation" }, { status: 403 });
    }

    // U-032 — the side that started a broker request never answers it. Before
    // this, a broker could POST 'accepted' on their OWN pitch: they are a party
    // to the deal, the only guard above covers invitations, and the block below
    // then switched the representation to active — a broker making themselves
    // an owner's broker without the owner ever agreeing.
    const representationState = isBrokerRepresentationDeal(deal)
      ? representationStateForAnswer(newStatus)
      : null;
    if (representationState && !mayAnswerBrokerRequest(deal, userId)) {
      return NextResponse.json({ error: "Only the other side of this request can answer it." }, { status: 403 });
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


    // Only a broker↔owner request moves a representation. A buyer inquiry that
    // carries the broker it was routed to is not one: before this, a broker
    // declining a single buyer's request declined their whole representation
    // of the property.
    if (representationState) {
      const representationUpdate = representationStatusUpdate({ status: representationState });
      const { error: representationError } = await supabaseAdmin
        .from("property_broker_representations")
        .update(representationUpdate)
        .eq("property_id", deal.property_id)
        .eq("broker_id", deal.broker_id)
        .in("status", ["pending", "active"]);
      if (representationError) {
        console.error("[DEAL UPDATE API] Representation state update failed:", representationError);
        return NextResponse.json({ error: "Deal changed, but representation state needs reconciliation", retryable: true }, { status: 503 });
      }
    }

    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: deal.property_id,
      activityType: "status_change",
      actorId: userId,
      metadata: { from: deal.status, to: newStatus },
    });

    return NextResponse.json({ success: true, dealId, newStatus });

  } catch (err) {
    console.error("[DEAL UPDATE API] Error during deal update:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
