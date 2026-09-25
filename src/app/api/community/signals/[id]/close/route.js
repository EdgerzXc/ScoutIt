import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isMissingTable } from "@/lib/communityStore";

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
    if (signal.status === "closed") {
      return NextResponse.json({ ok: true, status: "closed", deduped: true });
    }
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("stratosphere_signals")
      .update({ status: "closed", closed_at: now, updated_at: now })
      .eq("id", id);
    if (updateError) throw updateError;
    return NextResponse.json({ ok: true, status: "closed" });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
