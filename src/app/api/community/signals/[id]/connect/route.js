import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { validateIntroMessage, INTRO_MAX } from "@/lib/connectIntro";
import { anyBlocked } from "@/lib/connectBlocks";
import { normalizeConnectSource, connectSourceMetadata } from "@/lib/connectSource";
import { freshnessFor } from "@/lib/communityPosting";
import { isMissingTable } from "@/lib/communityStore";

// ─────────────────────────────────────────────────────────────────────────
// COMMUNITY SIGNAL CONNECT (A-145 P1)
//
// The only path from a public signal to a private relationship (spec §16):
// SIGNAL → CONNECT REQUEST (1, sender) → ACCEPTED → INBOX/CRM.
// No property exists here, so this route does NOT use the property-routed
// RPC — it addresses the persisted author directly from the signal row. The
// recipient is always server-resolved; a browser-sent recipient id is never
// trusted (Rule 5: the client evaluates nothing).
//
// Guards, in order: auth → adult → live+unexpired signal → not self →
// double-tap dedupe → block check → spend (atomic RPC) → stamp + notify +
// activity. Any failure after the insert rolls the deal back and refunds the
// spend as a platform error — a refusal costs 0 Connects and leaves no
// phantom request (A-144 invariant).
// ─────────────────────────────────────────────────────────────────────────

const checkRate = createRateLimiter({ limit: 10, windowMs: 60_000, maxKeys: 10_000 });
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request, { params }) {
  const rate = checkRate(`sigcon:${clientIp(request)}`);
  if (!rate.allowed) {
    return NextResponse.json({ ok: false, error: "Slow down — try again in a minute." }, { status: 429 });
  }
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Sign in to your ScoutIt account to initiate a Connect." },
        { status: 401 }
      );
    }
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { ok: false, error: "You must confirm you are 18 or older before contacting a member." },
        { status: 403 }
      );
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ ok: false, error: "Server error: missing service role configuration" }, { status: 500 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }
    const { id } = await params;

    let introMessage = null;
    if (typeof body?.message === "string" && body.message.trim() !== "") {
      const intro = validateIntroMessage(body.message);
      if (!intro.ok) {
        return NextResponse.json({ ok: false, error: intro.error, maxLength: INTRO_MAX }, { status: 400 });
      }
      introMessage = intro.value;
    }
    const connectSource = normalizeConnectSource({
      source_type: "stratosphere_signal",
      source_id: id,
      reason_tag: "SIGNAL_CONNECT",
      sender_identity_mode: "public",
    });

    const { data: signal, error: signalError } = await supabaseAdmin
      .from("stratosphere_signals")
      .select("id, author_account_id, scout_id_snapshot, title, status, last_confirmed_at")
      .eq("id", id)
      .maybeSingle();
    if (signalError) throw signalError;
    if (!signal || (signal.status !== "live" && signal.status !== "limited")) {
      return NextResponse.json({ ok: false, error: "That signal is no longer active. No Connect was spent." }, { status: 404 });
    }
    if (freshnessFor(signal.last_confirmed_at) === "expired") {
      return NextResponse.json({ ok: false, error: "That signal expired. No Connect was spent." }, { status: 410 });
    }
    const recipientId = signal.author_account_id;
    if (!recipientId) {
      return NextResponse.json({ ok: false, error: "That signal has no reachable author. No Connect was spent." }, { status: 503 });
    }
    if (recipientId === userId) {
      return NextResponse.json({ ok: false, error: "That is your own signal — no Connect needed." }, { status: 400 });
    }

    // Double-tap guard: a pending request to the same author for the same
    // signal inside 10 minutes is reused, never re-spent.
    const { data: recent } = await supabaseAdmin
      .from("deals")
      .select("id, created_at")
      .eq("buyer_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    const dupe = (recent || []).find((d) => {
      const age = Date.now() - new Date(d.created_at).getTime();
      return age >= 0 && age <= DEDUPE_WINDOW_MS;
    });
    if (dupe) {
      const { data: dupeSnap } = await supabaseAdmin
        .from("deals")
        .select("routing_snapshot")
        .eq("id", dupe.id)
        .maybeSingle();
      if (dupeSnap?.routing_snapshot?.signal_id === id) {
        return NextResponse.json({
          ok: true,
          success: true,
          dealId: dupe.id,
          connects_spent: 0,
          deduped: true,
          status: "pending",
        });
      }
    }

    if (await anyBlocked(supabaseAdmin, userId, [recipientId])) {
      return NextResponse.json(
        { ok: false, error: "This request can't be sent. No Connect was spent." },
        { status: 403 }
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);
    const snapshot = {
      recipient_ids: [recipientId],
      recipient_type: "community_signal",
      signal_id: id,
      signal_title: signal.title,
      captured_at: new Date().toISOString(),
    };
    const { data: deal, error: dealError } = await supabaseAdmin
      .from("deals")
      .insert({
        property_id: null,
        buyer_id: userId,
        broker_id: recipientId,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        pitch_message: introMessage || `Interested in "${signal.title}".`,
        routing_snapshot: snapshot,
      })
      .select("id")
      .single();
    if (dealError || !deal) {
      return NextResponse.json({ ok: false, error: "Could not start this request. No Connect was spent." }, { status: 503 });
    }
    const dealId = deal.id;

    const { error: spendError, data: spendData } = await supabaseAdmin.rpc("spend_connects", {
      p_user_id: userId,
      p_amount: 1,
      p_reason: "Community signal connect",
      p_ref_type: "initiate_chat",
      p_ref_id: dealId,
    });
    if (spendError) {
      await supabaseAdmin.from("deals").delete().eq("id", dealId);
      const insufficient =
        spendError.message?.includes("insufficient balance") ||
        spendError.message?.includes("no wallet found");
      return NextResponse.json(
        { ok: false, error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const { error: stampError } = await supabaseAdmin
      .from("deals")
      .update({ connects_spent: 1 })
      .eq("id", dealId);
    if (stampError) {
      await supabaseAdmin.from("deals").delete().eq("id", dealId);
      await supabaseAdmin.rpc("refund_connects_system_error", {
        p_user_id: userId,
        p_amount: 1,
        p_reason: "Signal connect stamp failed",
        p_staff_id: "system",
        p_ref_id: dealId,
      });
      return NextResponse.json({ ok: false, error: "Could not complete this request. No Connect was spent." }, { status: 503 });
    }

    await notifyUser(supabaseAdmin, {
      userId: recipientId,
      title: "New signal inquiry",
      desc: `Someone answered your signal "${signal.title}".`,
      propertyId: null,
      notificationType: "new_inquiry",
    });
    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: null,
      activityType: "inquiry",
      actorId: userId,
      metadata: {
        recipientIds: [recipientId],
        routedToRoster: false,
        ...connectSourceMetadata(connectSource, { spent: spendData?.[0] || null }),
      },
    });

    return NextResponse.json({
      ok: true,
      success: true,
      dealId,
      connects_spent: 1,
      connects_remaining: spendData?.[0]?.total_balance ?? null,
      status: "pending",
      source_context: connectSource,
    });
  } catch (err) {
    if (isMissingTable(err)) {
      return NextResponse.json({ ok: false, error: "Community signals are opening soon. No Connect was spent." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: sanitizeError(err) }, { status: 500 });
  }
}
