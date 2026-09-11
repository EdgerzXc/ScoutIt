// ═══════════════════════════════════════════════════════════════
// A-135 — the signed-in person's own plan and Connects, from the account
//
// Two traps this route exists to avoid:
//
// 1. It does NOT use `resolveServerTier`. That helper answers "what may this
//    person access right now", and while `pre_launch_free_mode` is on it
//    answers "universe" for everyone. Shown as "your plan", that would tell
//    every user they are on the top tier. The plan here is the account's own
//    `subscription_tier`; free mode is reported separately, as what it is.
//
// 2. It never reads `getCurrentTier()`, which comes from the browser's
//    localStorage and is tamperable by design (see entitlements.js).
//
// The balance is the legacy `connect_balances` wallet, because every paid
// route still spends from it. While the canonical wallet is switched on
// (CONNECTS_CANONICAL_ACTIVE) that number would be the wrong one, so the route
// reports the balance as unknown rather than guessing.
// ═══════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isPreLaunchFreeMode } from "@/lib/featureFlags";
import { isCanonicalConnectWalletActive } from "@/lib/connectsSchemaGate";
import { TIERS, TIER_LABELS } from "@/lib/entitlements";
import { sanitizeError } from "@/lib/sanitizeError";

const PRIVATE = { "Cache-Control": "private, no-store" };
const json = (body, status = 200) => NextResponse.json(body, { status, headers: PRIVATE });

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return json({ error: "Sign in to see your plan." }, 401);
    if (!supabaseAdmin) return json({ error: "Plan details are unavailable right now." }, 503);

    const [{ data: profile, error: profileError }, freeMode] = await Promise.all([
      supabaseAdmin.from("user_profiles").select("subscription_tier").eq("id", userId).maybeSingle(),
      isPreLaunchFreeMode(),
    ]);
    if (profileError) return json({ error: "Could not load your plan." }, 500);

    // An unrecognised or missing value is reported as "no plan recorded",
    // never rounded to a real tier name.
    const raw = String(profile?.subscription_tier || "").toLowerCase();
    const tier = TIERS.includes(raw) ? raw : null;

    let connects = { balance: null, hasWallet: false };
    if (!isCanonicalConnectWalletActive()) {
      const { data: wallet, error: walletError } = await supabaseAdmin
        .from("connect_balances")
        .select("total_balance")
        .eq("user_id", userId)
        .maybeSingle();
      if (!walletError) {
        connects = wallet
          ? { balance: Number(wallet.total_balance ?? 0), hasWallet: true }
          : { balance: 0, hasWallet: false };
      }
    }

    return json({
      success: true,
      plan: { tier, label: tier ? TIER_LABELS[tier] : null },
      connects,
      freeMode: freeMode === true,
    });
  } catch (error) {
    console.error("[api/user/plan] GET failed:", error);
    return json({ error: sanitizeError(error, "Could not load your plan.") }, 500);
  }
}
