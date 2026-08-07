import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { writeAuditLog } from "@/lib/auditTrail";

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

    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

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

    // Write audit log event. This omitted `table_name` and `record_id` — both
    // NOT NULL — so it threw on every close, and the bare `catch {}` ate it.
    // Still non-blocking, but now it logs when it fails. See lib/auditTrail.js.
    await writeAuditLog(supabaseAdmin, {
      action: 'deal_close',
      tableName: 'deals',
      recordId: dealId,
      userId,
      resourceType: 'deal',
      metadata: { closed_at: new Date().toISOString(), retention_days: 7 },
    });

    return NextResponse.json({ success: true, message: "Deal closed and marked read-only with 7-day retention policy." });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
