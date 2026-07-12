import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";

// Same dev-mock convention as /api/notifications and /api/dashboard/units --
// ?mockOwnerId=master-dev only takes effect when no real Bearer token was
// sent, so real user sessions are unaffected.


export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    try {
      const body = await request.json();
      } catch { /* no body sent -- fine, real sessions don't need one */ }

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Validate access
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId;

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
