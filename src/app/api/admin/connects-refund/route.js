import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { z } from "zod";
import { sanitizeError } from "@/lib/sanitizeError";

// ═══════════════════════════════════════════════════════════════
// SYSTEM-ERROR CONNECT REFUND — staff only
// NEW_IDEAS.md §38.3 / §40.16
// ═══════════════════════════════════════════════════════════════
//
// §38.3's refund policy is locked: no refunds on decline, non-response or
// withdrawal. The ONE exception is a verifiable ScoutIt system error — a
// failed write that never delivered the request, a double charge, a deduction
// with no conversation created.
//
// That exception was policy with no mechanism. Until this route existed,
// honouring it meant hand-writing an UPDATE against connect_balances, which
// moves a balance and records nothing: no who, no why, no incident. A refund
// path with no audit trail is worse than no refund path, because it is
// indistinguishable from someone quietly topping up a friend's wallet.
//
// Deliberately NOT automated anywhere. No cron, no error handler, no retry
// path calls this. A human decides that ScoutIt was at fault, and their name
// goes on the ledger row.

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive().max(100),
  reason: z.string().trim().min(10).max(500),
  refId: z.string().optional().nullable(),
});

// ── GET /api/admin/connects-refund?userId=… ─────────────────────
// The wallet and its recent ledger, so staff can see what actually happened
// before crediting anything. Refunding blind is how a "double charge" that
// was really one charge becomes two Connects out of pocket.
export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "CONNECTS REFUND" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const [{ data: balance }, { data: ledger }] = await Promise.all([
      supabaseAdmin
        .from("connect_balances")
        .select("user_id, granted_balance, earned_balance, purchased_balance, total_balance, updated_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("connect_transactions")
        .select("id, kind, bucket, amount, reason, ref_type, ref_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25),
    ]);

    if (!balance) {
      return NextResponse.json({ error: "No wallet found for that user." }, { status: 404 });
    }

    return NextResponse.json({
      balance,
      ledger: ledger || [],
      // Surfaced so staff can spot a user who has been refunded repeatedly —
      // a pattern that usually means an unfixed bug, not bad luck.
      priorRefunds: (ledger || []).filter((t) => t.ref_type === "system_error_refund").length,
    });
  } catch (err) {
    console.error("[CONNECTS REFUND] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// ── POST /api/admin/connects-refund ─────────────────────────────
export async function POST(request) {
  try {
    const gate = await requireAdmin(request, { label: "CONNECTS REFUND" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      // The 10-character minimum on `reason` is enforced, not advisory. "fix"
      // or "refund" tells a future auditor nothing about which incident this
      // was, which defeats the audit row's only purpose.
      return NextResponse.json(
        { error: "A userId, a positive amount, and a reason of at least 10 characters are required." },
        { status: 400 },
      );
    }
    const { userId, amount, reason, refId } = parsed.data;

    // The RPC is the atomic part: balance credit + ledger row in one block,
    // so a credit can never exist without its audit entry.
    const { data, error } = await supabaseAdmin.rpc("refund_connects_system_error", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_staff_id: gate.userId,
      p_ref_id: refId || null,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("WALLET_NOT_FOUND")) {
        return NextResponse.json({ error: "No wallet found for that user." }, { status: 404 });
      }
      console.error("[CONNECTS REFUND] RPC failed:", error);
      return NextResponse.json({ error: "Refund failed. No Connects were credited." }, { status: 500 });
    }

    const result = Array.isArray(data) ? data[0] : data;
    console.warn(
      `[CONNECTS REFUND] ${amount} Connects credited to ${userId} by admin ${gate.userId}. Reason: ${reason}`,
    );

    return NextResponse.json({
      success: true,
      newBalance: result?.total_balance ?? null,
      transactionId: result?.transaction_id ?? null,
    });
  } catch (err) {
    console.error("[CONNECTS REFUND] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
