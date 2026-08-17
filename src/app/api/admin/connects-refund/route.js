import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { requireAdmin } from "@/lib/adminGuard";
import { normalizeConnectRole } from "@/lib/connectsWallet";
import { isCanonicalConnectWalletActive } from "@/lib/connectsSchemaGate";
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
// Deliberately NOT automated anywhere. No cron, no error handler, no retry
// path calls this. A human decides that ScoutIt was at fault, and their name
// goes on the ledger row.

const schema = z.object({
  userId: z.string().min(1),
  amount: z.number().int().positive().max(100),
  reason: z.string().trim().min(10).max(500),
  refId: z.string().optional().nullable(),
});

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ── GET /api/admin/connects-refund?userId=… ─────────────────────
export async function GET(request) {
  try {
    const gate = await requireAdmin(request, { label: "CONNECTS REFUND" });
    if (gate.error) return NextResponse.json({ error: gate.error }, { status: gate.status });

    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const isCanonical = isCanonicalConnectWalletActive();

    // ─────────────────────────────────────────────────────────────
    // 1. CANONICAL MODE (Active only when explicitly enabled)
    // ─────────────────────────────────────────────────────────────
    if (isCanonical) {
      const thisMonth = currentYearMonth();

      const [
        { data: canonicalAcct, error: acctErr },
        { data: canonicalWallets, error: walletsErr },
        { data: canonicalLedger, error: ledgerErr },
        { data: userProfile, error: profileErr },
        { data: activeHolds, error: holdsErr },
      ] = await Promise.all([
        supabaseAdmin
          .from("user_connect_accounts")
          .select("user_id, purchased_balance, reward_balance, updated_at")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("user_connect_wallets")
          .select("id, role, granted_balance, granted_month, updated_at")
          .eq("user_id", userId),
        supabaseAdmin
          .from("connect_wallet_ledger")
          .select("id, role, amount, transaction_type, source, reason, reference_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(25),
        supabaseAdmin
          .from("user_profiles")
          .select("id, primary_mode, role, active_roles, subscription_tier")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("connect_backfill_holds")
          .select("id, hold_reason, legacy_data, canonical_data, created_at")
          .eq("user_id", userId)
          .eq("resolved", false),
      ]);

      if (acctErr || walletsErr || ledgerErr || profileErr || holdsErr) {
        console.error("[CONNECTS REFUND] Canonical read error:", {
          acctErr,
          walletsErr,
          ledgerErr,
          profileErr,
          holdsErr,
        });
        return NextResponse.json({ error: "Failed to query canonical wallet state." }, { status: 500 });
      }

      const holdsList = activeHolds || [];
      const hasActiveHold = holdsList.length > 0;

      if (canonicalAcct || (canonicalWallets && canonicalWallets.length > 0) || hasActiveHold) {
        const primaryRole =
          normalizeConnectRole(userProfile?.primary_mode) ||
          normalizeConnectRole(userProfile?.role) ||
          "seeker";

        const primaryRoleWallet = (canonicalWallets || []).find((w) => w.role === primaryRole);
        const isPrimaryCurrent = primaryRoleWallet?.granted_month === thisMonth;
        const primaryGranted = isPrimaryCurrent ? (primaryRoleWallet?.granted_balance || 0) : 0;

        const purchased = canonicalAcct?.purchased_balance || 0;
        const reward = canonicalAcct?.reward_balance || 0;
        const permanentBalance = purchased + reward;
        const primarySpendable = primaryGranted + permanentBalance;

        // Normalized active roles
        const activeRolesSet = new Set(
          (userProfile?.active_roles || []).map((r) => normalizeConnectRole(r)).filter(Boolean),
        );
        if (activeRolesSet.size === 0) activeRolesSet.add(primaryRole);

        // Sum current-month grants for currently active roles
        const activeGrantsTotal = (canonicalWallets || []).reduce((sum, w) => {
          if (w.granted_month === thisMonth && activeRolesSet.has(w.role)) {
            return sum + (w.granted_balance || 0);
          }
          return sum;
        }, 0);
        const portfolioTotal = activeGrantsTotal + permanentBalance;

        const balancePayload = {
          userId,
          authority: "canonical",
          purchasedBalance: purchased,
          rewardBalance: reward,
          accountPermanentBalance: permanentBalance,
          primaryRole,
          primaryRoleGrantedBalance: primaryGranted,
          primaryRoleSpendableBalance: primarySpendable,
          portfolioTotalBalance: portfolioTotal,
          hasActiveHold,
          activeHolds: holdsList,
          activeHold: holdsList[0] || null,
          roleWallets: (canonicalWallets || []).map((w) => ({
            ...w,
            isCurrentMonth: w.granted_month === thisMonth,
            isActiveRole: activeRolesSet.has(w.role),
          })),
          // Legacy flat compatibility fields
          user_id: userId,
          granted_balance: primaryGranted,
          purchased_balance: purchased,
          earned_balance: reward,
          total_balance: primarySpendable,
          updated_at: canonicalAcct?.updated_at || new Date().toISOString(),
        };

        const ledgerPayload = (canonicalLedger || []).map((cl) => ({
          id: cl.id,
          role: cl.role,
          kind: cl.transaction_type,
          bucket: cl.transaction_type === "refund" ? "purchased" : "hybrid",
          amount: cl.amount,
          reason: cl.reason,
          ref_type: cl.source,
          ref_id: cl.reference_id,
          created_at: cl.created_at,
        }));

        return NextResponse.json({
          balance: balancePayload,
          ledger: ledgerPayload,
          priorRefunds: ledgerPayload.filter((t) => t.ref_type === "system_error_refund" || t.kind === "refund").length,
        });
      }

      return NextResponse.json({ error: "No wallet found for that user." }, { status: 404 });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. LEGACY MODE (Pre-migration default: queries only legacy tables)
    // ─────────────────────────────────────────────────────────────
    const [{ data: legacyBalance, error: legBalErr }, { data: legacyLedger, error: legLedgErr }] = await Promise.all([
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

    if (legBalErr || legLedgErr) {
      console.error("[CONNECTS REFUND] Legacy read error:", { legBalErr, legLedgErr });
      return NextResponse.json({ error: "Failed to query wallet state." }, { status: 500 });
    }

    if (!legacyBalance) {
      return NextResponse.json({ error: "No wallet found for that user." }, { status: 404 });
    }

    return NextResponse.json({
      balance: {
        ...legacyBalance,
        authority: "legacy",
        accountPermanentBalance: (legacyBalance.purchased_balance || 0) + (legacyBalance.earned_balance || 0),
        primaryRoleSpendableBalance: legacyBalance.total_balance || 0,
        portfolioTotalBalance: legacyBalance.total_balance || 0,
        hasActiveHold: false,
        activeHolds: [],
        activeHold: null,
      },
      ledger: legacyLedger || [],
      priorRefunds: (legacyLedger || []).filter((t) => t.ref_type === "system_error_refund" || t.kind === "refund").length,
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
      return NextResponse.json(
        { error: "A userId, a positive amount, and a reason of at least 10 characters are required." },
        { status: 400 },
      );
    }
    const { userId, amount, reason, refId } = parsed.data;

    const canonical = isCanonicalConnectWalletActive();
    const refundRpc = canonical ? "refund_connects_system_error_canonical" : "refund_connects_system_error";
    // Separate names keep the inactive legacy runtime from changing semantics when the proposal is applied.
    const { data, error } = await supabaseAdmin.rpc(refundRpc, {
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
      if (msg.includes("WALLET_HOLD_ACTIVE")) {
        return NextResponse.json(
          { error: "Refund blocked: user balance is held pending reconciliation resolution." },
          { status: 409 },
        );
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
      balanceAuthority: canonical ? "canonical_account_permanent" : "legacy_spendable",
      ...(canonical
        ? { accountPermanentBalance: result?.total_balance ?? null }
        : { legacySpendableBalance: result?.total_balance ?? null }),
      transactionId: result?.transaction_id ?? null,
    });
  } catch (err) {
    console.error("[CONNECTS REFUND] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
