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
    return NextResponse.json({ ok: true, saved: false });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
