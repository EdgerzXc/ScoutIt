import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { isMissingTable } from "@/lib/communityStore";

// Save: a private bookmark, one row per account. Never a public counter —
// interest never becomes popularity (USER_FLOWS Flow D §8 for the same rule
// on directories).
const checkRate = createRateLimiter({ limit: 30, windowMs: 60_000, maxKeys: 10_000 });

async function loadLiveSignal(id) {
  const { data, error } = await supabaseAdmin
    .from("stratosphere_signals")
    .select("id, status")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || (data.status !== "live" && data.status !== "limited")) return null;
  return data;
}

/**
 * A-237 (GAP-106): the public saved count is shown on the card, so it has to
 * be kept in step with the rows that actually exist. The counter used to be
 * written only when a signal was created, so a card's saved number froze at
 * zero no matter how many people bookmarked it.
 *
 * The count is READ from the rows and then written, so a missed update
 * self-corrects on the next save instead of drifting forever.
 */
async function syncSavedCount(signalId) {
  try {
    const { count, error } = await supabaseAdmin
      .from("signal_saves")
      .select("id", { count: "exact", head: true })
      .eq("signal_id", signalId);
    if (error) {
      console.error("[community save] saved_count read failed:", error);
      return;
    }
    await supabaseAdmin
      .from("stratosphere_signals")
      .update({ saved_count: count ?? 0 })
      .eq("id", signalId);
  } catch (err) {
    // The bookmark itself succeeded. A stale counter is a smaller wrongness
    // than a failed save, so the error is logged, not thrown.
    console.error("[community save] saved_count sync failed:", err);
  }
}

export async function POST(request, { params }) {
  const rate = checkRate(`save:${clientIp(request)}`);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Too many taps — try again in a minute." }, { status: 429 });
  }
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to save a signal." }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server error: missing service role configuration" }, { status: 500 });
    }
    const { id } = await params;
    const signal = await loadLiveSignal(id);
    if (!signal) {
      return NextResponse.json({ ok: false, error: "That signal is no longer active." }, { status: 404 });
    }
    const { error: insertError } = await supabaseAdmin
      .from("signal_saves")
      .insert({ signal_id: id, account_id: userId });
    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, saved: true, deduped: true });
      }
      throw insertError;
    }
    await syncSavedCount(id);
    return NextResponse.json({ ok: true, saved: true });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Not signed in" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server error: missing service role configuration" }, { status: 500 });
    }
    const { id } = await params;
    await supabaseAdmin
      .from("signal_saves")
      .delete()
      .eq("signal_id", id)
      .eq("account_id", userId);
    await syncSavedCount(id);
    return NextResponse.json({ ok: true, saved: false });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
