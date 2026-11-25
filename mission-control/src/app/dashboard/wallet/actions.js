"use server";

import { getCurrentStaff, assertTier, logActionStrict, TIERS } from "@/lib/rbac";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateRefundRequest, validateGrantRequest } from "@/lib/walletPolicy.mjs";
import { notifyUser } from "@/lib/notifications";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isRpcMissingError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || "");
  return (
    code === "42883" ||
    code === "PGRST202" ||
    /could not find the function/i.test(msg)
  );
}

function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function lookupUserWallet({ query }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.OPS_MANAGER);

  if (!query || typeof query !== "string" || !query.trim()) {
    return { error: "Please provide a user ID or email address to search." };
  }

  const cleanQuery = query.trim();
  const admin = createAdminClient();

  // Try finding user profile
  let targetUserId = cleanQuery;
  let userProfile = null;
  let resolvedEmail = null;

  // UUID pattern
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

  if (!isUuid) {
    // Email lookup via Supabase Auth admin when query looks like email
    if (cleanQuery.includes("@") && typeof admin.auth?.admin?.listUsers === "function") {
      const targetEmail = cleanQuery.toLowerCase();
      for (let page = 1; page <= 5 && !userProfile; page += 1) {
        const { data: authData } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        const users = authData?.users || [];
        const matched = users.find((u) => u.email?.toLowerCase() === targetEmail);
        if (matched) {
          targetUserId = matched.id;
          resolvedEmail = matched.email || null;
          const { data: profile } = await admin
            .from("user_profiles")
            .select("id, display_name, role, primary_mode, active_roles, subscription_tier")
            .eq("id", targetUserId)
            .maybeSingle();
          userProfile = profile ? { ...profile, email: resolvedEmail } : { id: targetUserId, email: resolvedEmail };
          break;
        }
        if (users.length < 1000) break;
      }
    }

    if (!userProfile) {
      // Search by display_name (strip PostgREST filter delimiters first; user_profiles has no email column)
      const safeSearch = cleanQuery.replace(/[(),%*\\]/g, "").trim();
      if (!safeSearch) {
        return { error: "Please provide a valid user ID, email, or name to search." };
      }
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("id, display_name, role, primary_mode, active_roles, subscription_tier")
        .ilike("display_name", `%${safeSearch}%`)
        .limit(1);

      if (profiles && profiles.length > 0) {
        userProfile = profiles[0];
        targetUserId = userProfile.id;
      } else {
        return { error: `No user profile found matching "${cleanQuery}".` };
      }
    }
  } else {
    const { data: profile } = await admin
      .from("user_profiles")
      .select("id, display_name, role, primary_mode, active_roles, subscription_tier")
      .eq("id", targetUserId)
      .maybeSingle();
    if (typeof admin.auth?.admin?.getUserById === "function") {
      try {
        const { data: authRes } = await admin.auth.admin.getUserById(targetUserId);
        resolvedEmail = authRes?.user?.email || null;
      } catch {
        // Non-fatal in mock/preview
      }
    }
    userProfile = profile ? { ...profile, email: resolvedEmail } : null;
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

  if (!staff.is_finance) {
    return { error: "Finance authorization (is_finance) is required to issue Connects refunds." };
  }
  if (typeof userId !== "string" || !UUID_RE.test(userId.trim())) {
    return { error: "A valid target user UUID is required." };
  }
  const cleanUserId = userId.trim();
  const cleanReason = typeof reason === "string" ? reason.trim() : reason;
  const cleanRefId = typeof refId === "string" && refId.trim() ? refId.trim().slice(0, 128) : null;

  const validation = validateRefundRequest({ amount, reason: cleanReason });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const admin = createAdminClient();

  // Fail closed if an unresolved reconciliation hold is active
  const { data: activeHolds, error: holdsErr } = await admin
    .from("connect_backfill_holds")
    .select("id")
    .eq("user_id", cleanUserId)
    .eq("resolved", false)
    .limit(1);
  if (holdsErr) {
    return { error: "Failed to verify wallet hold status." };
  }
  if (activeHolds && activeHolds.length > 0) {
    return { error: "Refund blocked: user balance is held pending reconciliation resolution." };
  }

  // Idempotency check when caller supplies a reference ID
  if (cleanRefId) {
    const [{ data: existingCanonical, error: canDupErr }, { data: existingLegacy, error: legDupErr }] = await Promise.all([
      admin
        .from("connect_wallet_ledger")
        .select("id")
        .eq("user_id", cleanUserId)
        .eq("reference_id", cleanRefId)
        .eq("transaction_type", "refund")
        .limit(1),
      admin
        .from("connect_transactions")
        .select("id")
        .eq("user_id", cleanUserId)
        .eq("ref_id", cleanRefId)
        .eq("kind", "refund")
        .limit(1),
    ]);
    if (canDupErr || legDupErr) {
      return { error: "Failed to verify refund idempotency." };
    }
    if ((existingCanonical && existingCanonical.length > 0) || (existingLegacy && existingLegacy.length > 0)) {
      return { error: "Duplicate refund blocked: this reference ID has already been refunded." };
    }
  }

  let refundSuccess = false;
  let transactionId = null;

  const { data: rpcData, error: rpcErr } = await admin.rpc("refund_connects_system_error_canonical", {
    p_user_id: cleanUserId,
    p_amount: amount,
    p_reason: cleanReason,
    p_staff_id: staff.id,
    p_ref_id: cleanRefId,
  });

  if (!rpcErr) {
    refundSuccess = true;
    transactionId = Array.isArray(rpcData) ? rpcData[0]?.transaction_id : rpcData?.transaction_id;
  } else {
    const msg = String(rpcErr.message || "");
    if (msg.includes("WALLET_HOLD_ACTIVE")) {
      return { error: "Refund blocked: user balance is held pending reconciliation resolution." };
    }
    if (msg.includes("WALLET_NOT_FOUND")) {
      return { error: "Failed to credit refund: user has no established wallet." };
    }
    if (!isRpcMissingError(rpcErr)) {
      return { error: "Refund RPC failed. No Connects were credited." };
    }

    // Only fall back to legacy atomic RPC when canonical RPC function is not deployed
    const { data: rpcLegacy, error: legacyErr } = await admin.rpc("refund_connects_system_error", {
      p_user_id: cleanUserId,
      p_amount: amount,
      p_reason: cleanReason,
      p_staff_id: staff.id,
      p_ref_id: cleanRefId,
    });

    if (legacyErr) {
      const legacyMsg = String(legacyErr.message || "");
      if (legacyMsg.includes("WALLET_HOLD_ACTIVE")) {
        return { error: "Refund blocked: user balance is held pending reconciliation resolution." };
      }
      if (legacyMsg.includes("WALLET_NOT_FOUND")) {
        return { error: "Failed to credit refund: user has no established wallet." };
      }
      return { error: "Failed to credit refund: atomic refund RPC failed." };
    }

    refundSuccess = true;
    transactionId = Array.isArray(rpcLegacy) ? rpcLegacy[0]?.transaction_id : rpcLegacy?.transaction_id;
  }

  if (!refundSuccess) {
    return { error: "Failed to credit refund: wallet not found or database error." };
  }

  // GAP-21: Notify user via canonical user_notifications table
  await notifyUser(admin, {
    userId: cleanUserId,
    title: "Connects Refunded",
    desc: `${amount} Connects have been credited back to your account: ${cleanReason}`,
    notificationType: "connects_refund",
  });

  // Immutable audit write
  await logActionStrict({
    staff,
    action: "STAFF_CONNECTS_REFUND",
    targetTable: "connect_wallet_ledger",
    targetId: transactionId || cleanUserId,
    reason: cleanReason,
    metadata: {
      user_id: cleanUserId,
      amount,
      ref_id: cleanRefId,
    },
  });

  return { success: true, amount, transactionId };
}

export async function grantDiscretionaryConnectsAction({ userId, amount, reason, role = "seeker", refId = null }) {
  const staff = await getCurrentStaff();
  assertTier(staff, TIERS.SUPER_ADMIN);

  if (!staff.is_finance) {
    return { error: "Finance authorization (is_finance) is required to issue discretionary Connects grants." };
  }
  if (typeof userId !== "string" || !UUID_RE.test(userId.trim())) {
    return { error: "A valid target user UUID is required." };
  }
  const cleanUserId = userId.trim();
  const cleanReason = typeof reason === "string" ? reason.trim() : reason;
  const cleanRefId = typeof refId === "string" && refId.trim() ? refId.trim().slice(0, 128) : null;

  const validation = validateGrantRequest({ amount, reason: cleanReason, role });
  if (!validation.valid) {
    return { error: validation.error };
  }

  const admin = createAdminClient();

  // Fail closed if an unresolved reconciliation hold is active
  const { data: activeHolds, error: holdsErr } = await admin
    .from("connect_backfill_holds")
    .select("id")
    .eq("user_id", cleanUserId)
    .eq("resolved", false)
    .limit(1);
  if (holdsErr) {
    return { error: "Failed to verify wallet hold status." };
  }
  if (activeHolds && activeHolds.length > 0) {
    return { error: "Grant blocked: user balance is held pending reconciliation resolution." };
  }

  if (cleanRefId) {
    const [{ data: existingCanonical, error: canDupErr }, { data: existingLegacy, error: legDupErr }] = await Promise.all([
      admin
        .from("connect_wallet_ledger")
        .select("id")
        .eq("user_id", cleanUserId)
        .eq("reference_id", cleanRefId)
        .eq("transaction_type", "grant")
        .limit(1),
      admin
        .from("connect_transactions")
        .select("id")
        .eq("user_id", cleanUserId)
        .eq("ref_id", cleanRefId)
        .eq("kind", "grant")
        .limit(1),
    ]);
    if (canDupErr || legDupErr) {
      return { error: "Failed to verify grant idempotency." };
    }
    if ((existingCanonical && existingCanonical.length > 0) || (existingLegacy && existingLegacy.length > 0)) {
      return { error: "Duplicate grant blocked: this reference ID has already been granted." };
    }
  }

  // Update reward_balance in user_connect_accounts
  const { data: acct, error: acctErr } = await admin
    .from("user_connect_accounts")
    .select("purchased_balance, reward_balance")
    .eq("user_id", cleanUserId)
    .maybeSingle();

  if (acctErr) {
    return { error: "Failed to read user connect account." };
  }

  let txId = null;
  const referenceId = cleanRefId || `GRANT-${staff.id.slice(0, 8)}-${Date.now()}`;

  if (acct) {
    const prevPurchased = acct.purchased_balance ?? 0;
    const prevBalance = acct.reward_balance ?? 0;
    const nextBalance = prevBalance + amount;
    const { data: updatedAcct, error: updErr } = await admin
      .from("user_connect_accounts")
      .update({
        reward_balance: nextBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", cleanUserId)
      .eq("reward_balance", prevBalance)
      .select("user_id")
      .maybeSingle();

    if (updErr || !updatedAcct) {
      return { error: "Failed to update canonical wallet balance (concurrent modification or DB error)." };
    }

    const { data: tx, error: ledgerErr } = await admin
      .from("connect_wallet_ledger")
      .insert({
        user_id: cleanUserId,
        role,
        amount,
        transaction_type: "grant",
        source: "staff_discretionary_grant",
        reason: cleanReason,
        reference_id: referenceId,
        before_granted: 0,
        after_granted: 0,
        before_purchased: prevPurchased,
        after_purchased: prevPurchased,
        before_reward: prevBalance,
        after_reward: nextBalance,
      })
      .select("id")
      .single();

    if (ledgerErr || !tx?.id) {
      await admin
        .from("user_connect_accounts")
        .update({
          reward_balance: prevBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", cleanUserId)
        .eq("reward_balance", nextBalance);
      return { error: "Failed to record canonical ledger entry; wallet balance was rolled back." };
    }
    txId = tx.id;
  } else {
    // Fallback legacy table when canonical account row does not exist
    const { data: leg, error: legErr } = await admin
      .from("connect_balances")
      .select("earned_balance, total_balance")
      .eq("user_id", cleanUserId)
      .maybeSingle();

    if (legErr) {
      return { error: "Failed to read legacy wallet balance." };
    }
    if (!leg) {
      return { error: "Failed to grant Connects: user has no initialized wallet row." };
    }

    const prevEarned = leg.earned_balance ?? 0;
    const prevTotal = leg.total_balance ?? 0;
    const nextEarned = prevEarned + amount;
    const nextTotal = prevTotal + amount;
    const { data: updatedLeg, error: legUpdErr } = await admin
      .from("connect_balances")
      .update({
        earned_balance: nextEarned,
        total_balance: nextTotal,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", cleanUserId)
      .eq("total_balance", prevTotal)
      .select("user_id")
      .maybeSingle();

    if (legUpdErr || !updatedLeg) {
      return { error: "Failed to update legacy wallet balance (concurrent modification or DB error)." };
    }

    const { data: legTx, error: legTxErr } = await admin
      .from("connect_transactions")
      .insert({
        user_id: cleanUserId,
        kind: "grant",
        bucket: "earned",
        amount,
        reason: cleanReason,
        ref_type: "staff_discretionary_grant",
        ref_id: referenceId,
      })
      .select("id")
      .single();

    if (legTxErr || !legTx?.id) {
      await admin
        .from("connect_balances")
        .update({
          earned_balance: prevEarned,
          total_balance: prevTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", cleanUserId)
        .eq("total_balance", nextTotal);
      return { error: "Failed to record legacy ledger entry; wallet balance was rolled back." };
    }
    txId = legTx.id;
  }

  // Audit
  await logActionStrict({
    staff,
    action: "STAFF_CONNECTS_DISCRETIONARY_GRANT",
    targetTable: "connect_wallet_ledger",
    targetId: txId || cleanUserId,
    reason: cleanReason,
    metadata: {
      user_id: cleanUserId,
      amount,
      role,
      reference_id: referenceId,
    },
  });

  return { success: true, amount, transactionId: txId };
}
