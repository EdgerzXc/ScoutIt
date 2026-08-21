import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { canTransitionWorkflow } from "@/lib/workflowStateMachines";

// 'withdrawn' = the SENDER took their own pending request back (§40.15).
// Kept distinct from 'declined' on purpose: declined means the recipient said
// no, withdrawn means the sender changed their mind. Collapsing them would
// show an owner a "declined" badge for a decision they never made.
const schema = z.object({
  status: z.enum(["connected", "pending", "accepted", "closed", "declined", "reported", "withdrawn"]),
  });

// Statuses that end a conversation and therefore stamp closed_at.
const TERMINAL_STATUSES = ["closed", "declined", "reported", "withdrawn"];

export async function PATCH(request, { params }) {
  try {
    const { id: dealId } = await params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { status  } = parsed.data;

    const authHeader = request.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : null;
    let userId = null;
    if (token && token.trim() !== "") {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (!error && user) userId = user.id;
    }
    // Dev-only fallback -- rejected in production (same gate as /api/dashboard/publish).
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .select("status, property_id, buyer_id, broker_id, properties(owner_id)")
      .eq("id", dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Only the SENDER may withdraw, and only while the request is still
    // pending. Without this, a recipient could call PATCH {status:'withdrawn'}
    // and make it look as though the seeker walked away from their own
    // request — rewriting who ended the conversation. `isParty` above is not
    // enough here, because both sides are parties.
    if (status === "withdrawn") {
      if (deal.buyer_id !== userId) {
        return NextResponse.json(
          { error: "Only the person who sent this request can withdraw it." },
          { status: 403 },
        );
      }
      if (deal.status !== "pending") {
        return NextResponse.json(
          { error: "This request has already been answered and can no longer be withdrawn." },
          { status: 409 },
        );
      }
    }

    if (!canTransitionWorkflow("inquiry", deal.status, status)) {
      return NextResponse.json(
        { error: "Inquiry cannot move from " + deal.status + " to " + status },
        { status: 409 },
      );
    }

    const updateData = { status };
    if (TERMINAL_STATUSES.includes(status)) {
       updateData.closed_at = new Date().toISOString();
    } else {
       updateData.closed_at = null;
    }

    const { error: updateError } = await supabaseAdmin
      .from("deals")
      .update(updateData)
      .eq("id", dealId);

    if (updateError) {
      console.error("[DEALS API] Failed to update status:", updateError);
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: deal.property_id,
      activityType: "status_change",
      actorId: userId,
      metadata: { from: deal.status, to: status },
    });

    return NextResponse.json({ success: true, status: updateData.status });
  } catch (err) {
    console.error("[DEALS API] Error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
