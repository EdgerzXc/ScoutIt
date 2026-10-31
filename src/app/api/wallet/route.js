import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveConnectRole, ensureConnectBalancesWallet } from "@/lib/connectsWallet";
import { monthlyAllowance } from "@/lib/entitlements";
import { sanitizeError } from "@/lib/sanitizeError";

export const dynamic = "force-dynamic";

/**
 * GET /api/wallet?role=seeker
 * Returns the authenticated user's authoritative Connects balance across:
 *   1. Role Monthly Granted (expiring on calendar month rollover)
 *   2. Account-wide Purchased (permanent)
 *   3. Account-wide Reward (permanent)
 *
 * Enforces lazy calendar-month rollover if the user's granted_month is stale.
 */
export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Sign in to view wallet balance" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database service unavailable" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawRole = searchParams.get("role");

    // Fetch user profile for subscription tier and default role
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, provider_type, subscription_tier")
      .eq("id", userId)
      .maybeSingle();

    const mapAliasToWalletRole = (inputRole) => {
      if (!inputRole || typeof inputRole !== "string") return inputRole;
      const lower = inputRole.trim().toLowerCase();
      if (lower === "salesperson") return "broker";
      if (lower === "operator") return "seeker";
      if (lower === "provider") return String(profile?.provider_type || "photographer").trim().toLowerCase();
      return inputRole;
    };

    const role = rawRole
      ? resolveConnectRole(mapAliasToWalletRole(rawRole), "seeker")
      : (resolveConnectRole(mapAliasToWalletRole(profile?.role || "seeker"), "seeker") || "seeker");
    if (!role) {
      return NextResponse.json(
        { error: "Invalid role specified for wallet" },
        { status: 400 }
      );
    }

    const tier = (profile?.subscription_tier || "starry").toLowerCase();
    const allowance = monthlyAllowance(role, tier);
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 1. Fetch or lazy-reset role-scoped granted wallet
    let { data: wallet, error: walletErr } = await supabaseAdmin
      .from("user_connect_wallets")
      .select("*")
      .eq("user_id", userId)
      .eq("role", role)
      .maybeSingle();

    if (!walletErr && !wallet) {
      // First access: idempotent initialization with (user_id, role) conflict recovery (GAP-40)
      const walletsTable = supabaseAdmin.from("user_connect_wallets");
      const newRow = {
        user_id: userId,
        role,
        granted_balance: allowance,
        granted_month: currentMonth,
      };
      let created = null;
      if (typeof walletsTable.upsert === "function") {
        const upsertStep = walletsTable
          .upsert(newRow, { onConflict: "user_id,role", ignoreDuplicates: true })
          .select();
        const res =
          typeof upsertStep.maybeSingle === "function"
            ? await upsertStep.maybeSingle()
            : await upsertStep.single();
        created = res?.data || null;
      } else if (typeof walletsTable.insert === "function") {
        const insertStep = walletsTable.insert(newRow).select();
        const res =
          typeof insertStep.maybeSingle === "function"
            ? await insertStep.maybeSingle()
            : await insertStep.single();
        created = res?.data || null;
      }
      if (created) {
        wallet = created;
      } else {
        // Recover from concurrent 23505 unique conflict or ignoreDuplicates no-op
        const { data: existing } = await supabaseAdmin
          .from("user_connect_wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("role", role)
          .maybeSingle();
        if (existing) wallet = existing;
      }
    } else if (wallet && wallet.granted_month !== currentMonth) {
      // Month rollover: optimistic concurrency guard on stale granted_month (GAP-49)
      let updateStep = supabaseAdmin
        .from("user_connect_wallets")
        .update({
          granted_balance: allowance,
          granted_month: currentMonth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);

      if (typeof updateStep.neq === "function") {
        updateStep = updateStep.neq("granted_month", currentMonth);
      } else if (typeof updateStep.eq === "function") {
        updateStep = updateStep.eq("granted_month", wallet.granted_month);
      }

      const selectedStep = updateStep.select();
      const { data: updated } =
        typeof selectedStep.maybeSingle === "function"
          ? await selectedStep.maybeSingle()
          : await selectedStep.single();

      if (updated) {
        wallet = updated;
      } else {
        const { data: refreshed } = await supabaseAdmin
          .from("user_connect_wallets")
          .select("*")
          .eq("user_id", userId)
          .eq("role", role)
          .maybeSingle();
        wallet = refreshed || wallet;
      }
    }

    // 2. Fetch account-wide permanent pool (purchased + reward)
    const { data: acct } = await supabaseAdmin
      .from("user_connect_accounts")
      .select("purchased_balance, reward_balance")
      .eq("user_id", userId)
      .maybeSingle();

    const granted = wallet ? wallet.granted_balance : allowance;
    const purchased = acct ? (acct.purchased_balance || 0) : 0;
    const reward = acct ? (acct.reward_balance || 0) : 0;
    const balance = granted + purchased + reward;

    // Synchronize legacy connect_balances mirror so server spend routes and
    // dashboard HUD always reflect identical authoritative figures.
    await ensureConnectBalancesWallet(supabaseAdmin, userId, role, tier);

    return NextResponse.json({
      success: true,
      balance,
      granted,
      purchased,
      reward,
      grantedMonth: wallet?.granted_month || currentMonth,
      role,
      tier,
    });
  } catch (error) {
    console.error("[WALLET API] GET failed:", error);
    return NextResponse.json(
      { error: sanitizeError(error, "Could not load wallet balance.") },
      { status: 500 }
    );
  }
}
