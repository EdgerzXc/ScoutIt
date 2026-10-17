import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { isMissingTable } from "@/lib/communityStore";

// Relevant-to-Me: one tap per account (UNIQUE), so 150 confirmations read as
// one strong signal + 150 — never 150 feed rows. POST adds (idempotent),
// DELETE removes. Account required: relevance is a counted vote, and votes
// need an accountable voter (spec §4/§7).
const checkRate = createRateLimiter({ limit: 30, windowMs: 60_000, maxKeys: 10_000 });

async function loadLiveSignal(id) {
  const { data, error } = await supabaseAdmin
    .from("stratosphere_signals")
    .select("id, status, last_confirmed_at, relevant_count")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || (data.status !== "live" && data.status !== "limited")) return null;
  return data;
}

// GAP-77: Derive relevant_count from authoritative signal_relevance row count
// to eliminate race-condition counter drift under concurrent requests.
async function syncExactRelevantCount(signalId, fallbackCount) {
  let exactCount = fallbackCount;
  try {
    const { count, error: countErr } = await supabaseAdmin
      .from("signal_relevance")
      .select("signal_id", { count: "exact", head: true })
      .eq("signal_id", signalId);
    if (!countErr && typeof count === "number") {
      exactCount = count;
    }
  } catch {
    // Fallback to computed count if mock does not support head count
  }
  const safeCount = Math.max(0, exactCount);
  await supabaseAdmin
    .from("stratosphere_signals")
    .update({ relevant_count: safeCount, updated_at: new Date().toISOString() })
    .eq("id", signalId);
  return safeCount;
}

export async function POST(request, { params }) {
  const rate = checkRate(`rel:${clientIp(request)}`);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Too many taps — try again in a minute." }, { status: 429 });
  }
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Sign in to mark a signal relevant." }, { status: 401 });
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
      .from("signal_relevance")
      .insert({ signal_id: id, account_id: userId });
    if (insertError) {
      // Already counted — idempotent success, never a double count.
      if (insertError.code === "23505") {
        return NextResponse.json({ ok: true, relevant: true, deduped: true });
      }
      throw insertError;
    }
    const syncedCount = await syncExactRelevantCount(id, (signal.relevant_count || 0) + 1);
    const { data: fresh } = await supabaseAdmin
      .from("stratosphere_signals")
      .select("relevant_count")
      .eq("id", id)
      .maybeSingle();
    return NextResponse.json({ ok: true, relevant: true, relevantCount: fresh?.relevant_count ?? syncedCount });
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
    const { data: existing } = await supabaseAdmin
      .from("signal_relevance")
      .select("signal_id")
      .eq("signal_id", id)
      .eq("account_id", userId)
      .maybeSingle();
    if (!existing) return NextResponse.json({ ok: true, relevant: false, deduped: true });
    await supabaseAdmin
      .from("signal_relevance")
      .delete()
      .eq("signal_id", id)
      .eq("account_id", userId);
    const { data: row } = await supabaseAdmin
      .from("stratosphere_signals")
      .select("relevant_count")
      .eq("id", id)
      .maybeSingle();
    const syncedCount = await syncExactRelevantCount(id, Math.max(0, (row?.relevant_count || 1) - 1));
    return NextResponse.json({ ok: true, relevant: false, relevantCount: syncedCount });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
