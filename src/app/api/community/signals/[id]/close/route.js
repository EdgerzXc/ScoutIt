import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isMissingTable } from "@/lib/communityStore";
import { SIGNAL_STATUSES } from "@/lib/communityPosting";

// Close: the author marks the need finished. Retained as history, out of
// the feed (spec §10/§18). Only the author — closing someone else's signal
// is refused, not reinterpreted.
export async function POST(request, { params }) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server error: missing service role configuration" }, { status: 500 });
    }
    const { id } = await params;
    const { data: signal, error: loadError } = await supabaseAdmin
      .from("stratosphere_signals")
      .select("id, author_account_id, status")
      .eq("id", id)
      .maybeSingle();
    if (loadError) throw loadError;
    if (!signal) {
      return NextResponse.json({ ok: false, error: "Signal not found." }, { status: 404 });
    }
    if (signal.author_account_id !== userId) {
      return NextResponse.json({ ok: false, error: "Only the author can close this signal." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const isDeleted = body?.outcome === "deleted";
    const isFulfilled = body?.outcome === "fulfilled";

    if (isDeleted) {
      // Check if an active or accepted conversation depends on this signal
      const { data: activeDeals } = await supabaseAdmin
        .from("deals")
        .select("id, status, routing_snapshot")
        .is("property_id", null)
        .in("status", ["accepted", "active", "closed"])
        .limit(100)
        .catch(() => ({ data: [] }));
      const hasCommittedDeal = (activeDeals || []).some(
        (d) => d.routing_snapshot?.signal_id === id
      );
      if (!hasCommittedDeal) {
        await supabaseAdmin.from("signal_locations").delete().eq("signal_id", id).catch(() => {});
        await supabaseAdmin.from("signal_requirements").delete().eq("signal_id", id).catch(() => {});
        const { error: delError } = await supabaseAdmin
          .from("stratosphere_signals")
          .delete()
          .eq("id", id);
        if (!delError) {
          return NextResponse.json({ ok: true, status: "deleted", deleted: true });
        }
      }
    }

    const nextStatus = isFulfilled ? SIGNAL_STATUSES.FULFILLED : SIGNAL_STATUSES.CLOSED;

    if (signal.status === nextStatus) {
      return NextResponse.json({ ok: true, status: nextStatus, deduped: true });
    }
    const now = new Date().toISOString();
    const updatePayload = {
      status: nextStatus,
      updated_at: now,
    };
    if (isFulfilled) {
      updatePayload.fulfilled_at = now;
      if (body?.servingDealId && typeof body.servingDealId === "string") {
        updatePayload.serving_deal_id = body.servingDealId;
      }
    } else {
      updatePayload.closed_at = now;
    }
    const { error: updateError } = await supabaseAdmin
      .from("stratosphere_signals")
      .update(updatePayload)
      .eq("id", id);
    if (updateError) {
      // If fulfilled is unmigrated, fall back gracefully to closed
      if (isFulfilled) {
        await supabaseAdmin
          .from("stratosphere_signals")
          .update({ status: "closed", closed_at: now, updated_at: now })
          .eq("id", id);
        return NextResponse.json({ ok: true, status: "fulfilled", fallback: "closed" });
      }
      throw updateError;
    }
    return NextResponse.json({ ok: true, status: nextStatus });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
