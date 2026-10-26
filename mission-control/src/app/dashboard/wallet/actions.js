"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateRefundRequest, validateGrantRequest } from "@/lib/walletPolicy.mjs";

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function lookupUserWallet({ query }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.AGENT);

  if (!query || typeof query !== "string" || !query.trim()) {
    return { error: "Please provide a user ID or email address to search." };
  }

  const cleanQuery = query.trim();
  const admin = createAdminClient();

  // Try finding user profile
  let targetUserId = cleanQuery;
  let userProfile = null;

  // UUID pattern
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

  if (!isUuid) {
    // Search by email or display_name
    const { data: profiles } = await admin
      .from("user_profiles")
      .select("id, display_name, role, primary_mode, active_roles, subscription_tier, email")
      .or(`email.ilike.%${cleanQuery}%,display_name.ilike.%${cleanQuery}%`)
      .limit(1);

    if (profiles && profiles.length > 0) {
      userProfile = profiles[0];
      targetUserId = userProfile.id;
    } else {
      return { error: `No user profile found matching "${cleanQuery}".` };
    }
  } else {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id, display_name, role, primary_mode, active_roles, subscription_tier, email")
      .eq("id", targetUserId)
      .maybeSingle();
    userProfile = profile;
  }

  const thisMonth = currentYearMonth();

  // Attempt canonical wallet query
  const [
    { data: acct },
    { data: wallets },
    { data: ledger },
    { data: holds },
    { data: legacyBal },
    { data: legacyLedger },
  ] = await Promise.all([
    admin.from("user_connect_accounts").select("*").eq("user_id", targetUserId).maybeSingle(),
    admin.from("user_connect_wallets").select("*").eq("user_id", targetUserId),
    admin.from("connect_wallet_ledger").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(50),
    admin.from("connect_backfill_holds").select("*").eq("user_id", targetUserId).eq("resolved", false),
    admin.from("connect_balances").select("*").eq("user_id", targetUserId).maybeSingle(),
    admin.from("connect_transactions").select("*").eq("user_id", targetUserId).order("created_at", { ascending: false }).limit(50),
  ]);

  const hasCanonical = Boolean(acct || (wallets && wallets.length > 0));

  let spendable = 0;
  let purchased = 0;
  let rewards = 0;
  let grants = 0;

  if (hasCanonical) {
    purchased = acct?.purchased_balance || 0;
    rewards = acct?.reward_balance || 0;
    const currentWallets = (wallets || []).filter((w) => w.granted_month === thisMonth);
    grants = currentWallets.reduce((acc, w) => acc + (w.granted_balance || 0), 0);
    spendable = purchased + rewards + grants;
  } else if (legacyBal) {
    purchased = legacyBal.purchased_balance || 0;
    rewards = legacyBal.earned_balance || 0;
    grants = legacyBal.granted_balance || 0;
    spendable = legacyBal.total_balance || 0;
  }

  const transactions = hasCanonical && ledger && ledger.length > 0
    ? ledger.map((t) => ({
        id: t.id,
        role: t.role,
        kind: t.transaction_type,
        amount: t.amount,
        reason: t.reason,
        source: t.source,
        referenceId: t.reference_id,
        createdAt: t.created_at,
      }))
    : (legacyLedger || []).map((t) => ({
        id: t.id,
        role: "legacy",
        kind: t.kind,
        amount: t.amount,
        reason: t.reason,
        source: t.ref_type,
        referenceId: t.ref_id,
        createdAt: t.created_at,
      }));

  return {
    success: true,
    user: {
      id: targetUserId,
      email: userProfile?.email || "Unknown",
      displayName: userProfile?.display_name || "Anonymous Member",
      role: userProfile?.role || userProfile?.primary_mode || "seeker",
      subscriptionTier: userProfile?.subscription_tier || "free",
    },
    wallet: {
      authority: hasCanonical ? "canonical" : legacyBal ? "legacy" : "uninitialized",
      spendable,
      purchased,
      rewards,
      grants,
      holds: holds || [],
      wallets: wallets || [],
    },
    transactions,
  };
}

export async function refundConnectsAction({ userId, amount, reason, refId = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  const validation = validateRefundRequest({ amount, reason });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const admin = createAdminClient();

  // Try calling canonical or legacy refund RPC first
  let refundSuccess = false;
  let transactionId = null;

  try {
    const { data: rpcData, error: rpcErr } = await admin.rpc("refund_connects_system_error_canonical", {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason,
      p_staff_id: staff.id,
      p_ref_id: refId,
    });

    if (!rpcErr) {
      refundSuccess = true;
      transactionId = Array.isArray(rpcData) ? rpcData[0]?.transaction_id : rpcData?.transaction_id;
    }
  } catch (_e) {
    // Fall back to direct ledger update if RPC is missing
  }

  if (!refundSuccess) {
    try {
      const { data: rpcLegacy, error: legacyErr } = await admin.rpc("refund_connects_system_error", {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
        p_staff_id: staff.id,
        p_ref_id: refId,
      });

      if (!legacyErr) {
        refundSuccess = true;
        transactionId = Array.isArray(rpcLegacy) ? rpcLegacy[0]?.transaction_id : rpcLegacy?.transaction_id;
      }
    } catch (_e) {
      // Direct write fallback
    }
  }

  if (!refundSuccess) {
    // Direct credit to user_connect_accounts or connect_balances
    const { data: acct } = await admin
      .from("user_connect_accounts")
      .select("purchased_balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (acct) {
      await admin
        .from("user_connect_accounts")
        .update({
          purchased_balance: (acct.purchased_balance || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      const { data: newTx } = await admin
        .from("connect_wallet_ledger")
        .insert({
          user_id: userId,
          role: "all",
          amount,
          transaction_type: "refund",
          source: "system_error_refund",
          reason,
          reference_id: refId || `REF-${Date.now()}`,
        })
        .select("id")
        .single();
      transactionId = newTx?.id;
      refundSuccess = true;
    } else {
      // Legacy table
      const { data: leg } = await admin
        .from("connect_balances")
        .select("purchased_balance, total_balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (leg) {
        await admin
          .from("connect_balances")
          .update({
            purchased_balance: (leg.purchased_balance || 0) + amount,
            total_balance: (leg.total_balance || 0) + amount,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        const { data: legTx } = await admin
          .from("connect_transactions")
          .insert({
            user_id: userId,
            kind: "refund",
            bucket: "purchased",
            amount,
            reason,
            ref_type: "system_error_refund",
            ref_id: refId || `REF-${Date.now()}`,
          })
          .select("id")
          .single();
        transactionId = legTx?.id;
        refundSuccess = true;
      }
    }
  }

  if (!refundSuccess) {
    return { error: "Failed to credit refund: wallet not found or database error." };
  }

  // GAP-21: Notify user
  try {
    await admin.from("notifications").insert({
      user_id: userId,
      title: "Connects Refunded",
      message: `${amount} Connects have been credited back to your account: ${reason}`,
      type: "connects_refund",
      created_at: new Date().toISOString(),
    });
  } catch (_notifErr) {
    // Non-blocking notification
  }

  // Immutable audit write
  await logActionStrict({
    staff,
    action: "STAFF_CONNECTS_REFUND",
    targetTable: "connect_wallet_ledger",
    targetId: transactionId || userId,
    reason,
    metadata: {
      user_id: userId,
      amount,
      ref_id: refId,
    },
  });

  return { success: true, amount, transactionId };
}

export async function grantDiscretionaryConnectsAction({ userId, amount, reason, role = "seeker" }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  const validation = validateGrantRequest({ amount, reason });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const admin = createAdminClient();

  // Update reward_balance in user_connect_accounts
  const { data: acct } = await admin
    .from("user_connect_accounts")
    .select("reward_balance")
    .eq("user_id", userId)
    .maybeSingle();

  let txId = null;

  if (acct) {
    await admin
      .from("user_connect_accounts")
      .update({
        reward_balance: (acct.reward_balance || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    const { data: tx } = await admin
      .from("connect_wallet_ledger")
      .insert({
        user_id: userId,
        role,
        amount,
        transaction_type: "grant",
        source: "staff_discretionary_grant",
        reason,
        reference_id: `GRANT-${staff.id.slice(0, 8)}-${Date.now()}`,
      })
      .select("id")
      .single();
    txId = tx?.id;
  } else {
    // Fallback legacy table
    const { data: leg } = await admin
      .from("connect_balances")
      .select("earned_balance, total_balance")
      .eq("user_id", userId)
      .maybeSingle();

    if (leg) {
      await admin
        .from("connect_balances")
        .update({
          earned_balance: (leg.earned_balance || 0) + amount,
          total_balance: (leg.total_balance || 0) + amount,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      const { data: legTx } = await admin
        .from("connect_transactions")
        .insert({
          user_id: userId,
          kind: "grant",
          bucket: "earned",
          amount,
          reason,
          ref_type: "staff_discretionary_grant",
          ref_id: `GRANT-${staff.id.slice(0, 8)}-${Date.now()}`,
        })
        .select("id")
        .single();
      txId = legTx?.id;
    }
  }

  // Audit
  await logActionStrict({
    staff,
    action: "STAFF_CONNECTS_DISCRETIONARY_GRANT",
    targetTable: "connect_wallet_ledger",
    targetId: txId || userId,
    reason,
    metadata: {
      user_id: userId,
      amount,
      role,
    },
  });

  return { success: true, amount, transactionId: txId };
}
