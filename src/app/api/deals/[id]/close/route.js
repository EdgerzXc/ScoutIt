import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Same dev-mock convention as /api/notifications and /api/dashboard/units --
// ?mockOwnerId=master-dev only takes effect when no real Bearer token was
// sent, so real user sessions are unaffected.
async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  if (mockOwnerId) return mockOwnerId;
  return null;
}

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    let mockOwnerId = null;
    try {
      const body = await request.json();
      mockOwnerId = body?.mockOwnerId || null;
    } catch { /* no body sent -- fine, real sessions don't need one */ }

    const userId = await resolveUserId(request, mockOwnerId);
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
