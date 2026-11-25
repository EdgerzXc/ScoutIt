import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sanitizeError } from "@/lib/sanitizeError";
import { isBlocked, checkBlockGuard } from "@/lib/connectBlocks";
import { normalizeConnectSource, connectSourceMetadata } from "@/lib/connectSource";
import { checkReceiverGate, IDEMPOTENCY_WINDOW_MINUTES } from "@/lib/connectGates";
import { logActivity } from "@/lib/crmActivity";
import { notifyUser } from "@/lib/notifications";
import { ensureConnectBalancesWallet } from "@/lib/connectsWallet";
import { recordSystemEvent } from "@/lib/systemEvents";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";

export const checkInviteRate = createRateLimiter({
  limit: 20,
  windowMs: 60_000,
  maxKeys: 10_000,
});

// Per-(owner, listing, broker) serialization queue so concurrent duplicate
// invite clicks execute sequentially, deduplicate against the committed deal,
// and charge at most 1 Connect.
const activeInviteQueues = new Map();

function withInviteQueue(key, task) {
  let entry = activeInviteQueues.get(key);
  if (!entry) {
    entry = { tail: Promise.resolve(), refCount: 0 };
    activeInviteQueues.set(key, entry);
  }
  entry.refCount += 1;

  const run = entry.tail.then(() => task());
  entry.tail = run.catch(() => {});

  return run.finally(() => {
    entry.refCount -= 1;
    if (entry.refCount <= 0 && activeInviteQueues.get(key) === entry) {
      activeInviteQueues.delete(key);
    }
  });
}

export async function POST(request) {
  try {
    // 1. Extract token from Authorization header to prevent identity spoofing
    const authHeader = request.headers.get("Authorization") || "";
    const token = /^Bearer\s+(.+)$/i.exec(authHeader.trim())?.[1]?.trim();
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const userId = user.id;

    const rate = checkInviteRate(`${clientIp(request)}:${userId}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many invitation requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    // Remove userId from the body destructuring, trust the token
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }
    const { listingId, brokerName, source_type, source_id, reason_tag, sender_identity_mode } = body;
    const connectSource = normalizeConnectSource({ source_type, source_id, reason_tag, sender_identity_mode });

    if (!listingId || !brokerName || typeof brokerName !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (brokerName.trim().length < 2 || brokerName.length > 120) {
      return NextResponse.json({ error: "Broker name must be between 2 and 120 characters." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select("id, owner_id")
      .eq("id", listingId)
      .single();
    if (propertyError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (property.owner_id !== userId) return NextResponse.json({ error: "You do not own this property" }, { status: 403 });
    // Resolve the typed name to a real broker's user id — `deals.broker_id`
    // must be a UUID for GET /api/deals's `.eq("broker_id", userId)` to ever
    // find this deal. Storing the raw typed string here (the previous
    // behavior) permanently orphaned the invite: no broker account could
    // ever see it in their Inbox, since their real user id never matched.
    const { data: brokerCandidates, error: brokerLookupError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, role, active_roles')
      // Escape LIKE wildcards so the typed name is matched literally. Without
      // this, "%" or "_" patterns turn the 404/409 responses into an oracle
      // for enumerating broker display names.
      .ilike('display_name', brokerName.trim().replace(/[\\%_]/g, (c) => `\\${c}`));

    if (brokerLookupError) {
      console.error("[INVITE API] Broker lookup failed:", brokerLookupError);
      return NextResponse.json({ error: "Failed to look up broker" }, { status: 500 });
    }

    const brokerMatches = (brokerCandidates || []).filter((p) => {
      const r = Array.isArray(p.active_roles) ? p.active_roles : [p.role].filter(Boolean);
      return r.length === 0 || r.some((item) => ["broker", "salesperson"].includes(String(item).toLowerCase()));
    });
    if (!brokerMatches || brokerMatches.length === 0) {
      return NextResponse.json({ error: `No broker named "${brokerName}" found. Check the spelling or PRC number.` }, { status: 404 });
    }
    if (brokerMatches.length > 1) {
      return NextResponse.json({ error: `Multiple brokers named "${brokerName}" found — ask them for their PRC number to disambiguate.` }, { status: 409 });
    }
    const resolvedBrokerId = brokerMatches[0].id;
    // A-144 invariant #6 FIRST + A-305: a broker who blocked the owner fails with 0 spend.
    // In post-O-004 fail-closed posture, an unavailable guard returns 503 with 0 spend.
    const blockGuard = await checkBlockGuard(supabaseAdmin, userId, [resolvedBrokerId]);
    if (!blockGuard.ok && blockGuard.unavailable) {
      return NextResponse.json(
        { error: "Block safety check unavailable. No Connect was spent." },
        { status: 503 },
      );
    }
    if (blockGuard.blocked) {
      return NextResponse.json(
        { error: "This request can't be sent. No Connect was spent." },
        { status: 403 },
      );
    }

    const inviteQueueKey = `${userId}:${listingId}:${resolvedBrokerId}`;
    return await withInviteQueue(inviteQueueKey, async () => {
      // A-144 §10.10 + A-363 invite dedup: a recent identical invite is reused,
      // never re-spent. Running inside the per-(owner, listing, broker) queue
      // guarantees concurrent duplicate submissions see the first committed deal.
      try {
        const inviteWindowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000).toISOString();
        const { data: recentInvites } = await supabaseAdmin
          .from("deals")
          .select("id, created_at")
          .eq("property_id", listingId)
          .eq("broker_id", resolvedBrokerId)
          .eq("status", "invited")
          .gte("created_at", inviteWindowStart)
          .order("created_at", { ascending: true })
          .limit(1);
        if (Array.isArray(recentInvites) && recentInvites.length > 0) {
          return NextResponse.json({
            success: true,
            dealId: recentInvites[0].id,
            connects_spent: 0,
            deduped: true,
            source_context: connectSource,
          });
        }
      } catch {
        // Dedup is best-effort — a lookup failure never blocks a first send.
      }

      // A-144 §8 receiver gate for the invited broker.
      const brokerGate = await checkReceiverGate(supabaseAdmin, resolvedBrokerId, listingId);
      if (!brokerGate.ok) {
        return NextResponse.json(
          { error: brokerGate.message || "This broker isn't accepting new Connects right now. No Connect was spent." },
          { status: 403 },
        );
      }

      const { data: existingRepresentation, error: representationLookupError } = await supabaseAdmin
        .from('property_broker_representations')
        .select("id, status")
        .eq("property_id", listingId)
        .eq("broker_id", resolvedBrokerId)
        .maybeSingle();
      if (representationLookupError) return NextResponse.json({ error: "Representation service unavailable" }, { status: 503 });
      if (existingRepresentation?.status === "active") return NextResponse.json({ error: "This broker already represents the property" }, { status: 409 });
      if (existingRepresentation?.status === "locked" || existingRepresentation?.status === "suspended") return NextResponse.json({ error: "This broker is not currently eligible for a new representation request" }, { status: 409 });
      let createdRepresentationId = null;
      if (!existingRepresentation) {
        const { data: createdRepresentation, error: representationError } = await supabaseAdmin.from("property_broker_representations").insert({
          property_id: listingId,
          broker_id: resolvedBrokerId,
          status: "pending",
          source: "owner_invite",
        }).select("id").maybeSingle();
        if (representationError) return NextResponse.json({ error: "Failed to create representation request" }, { status: 503 });
        createdRepresentationId = createdRepresentation?.id || null;
      }
      // A-144 §10.10: a failed invite leaves no phantom representation.
      const rollbackInviteSideEffects = async (dealId) => {
        try {
          if (dealId) {
            const { error } = await supabaseAdmin.from('deals').delete().eq('id', dealId);
            if (error) throw error;
          }
          if (createdRepresentationId) {
            const { error } = await supabaseAdmin.from('property_broker_representations')
              .delete()
              .eq('id', createdRepresentationId)
              .eq('status', 'pending');
            if (error) throw error;
          }
          return true;
        } catch (error) {
          console.error("[INVITE API] Cleanup needs reconciliation:", { dealId, createdRepresentationId, code: error?.code });
          return false;
        }
      };

      const buildCorrelation = (dealId = null) => ({
        dealId,
        propertyId: listingId,
        ownerId: userId,
        brokerId: resolvedBrokerId,
        representationId: createdRepresentationId || existingRepresentation?.id || null,
      });

      // 1. Insert the handshake deal first — rolled back below if the Connect spend fails
      const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
        property_id: listingId,
        broker_id: resolvedBrokerId,
        status: 'invited',
        pitch_message: `Owner invited ${brokerMatches[0].display_name} to represent this property.`
      }]).select();

      if (dealError || !dealData?.[0]?.id) {
        console.error("[INVITE API] Failed to insert deal:", dealError);
        const cleanedUp = await rollbackInviteSideEffects(null);
        const correlation = buildCorrelation(null);
        if (!cleanedUp) {
          await recordSystemEvent({
            event: "connects.invite.reconciliation_required",
            severity: "error",
            subjectTable: "property_broker_representations",
            subjectId: correlation.representationId || listingId,
            summary: "Broker invitation deal insert failed and representation cleanup requires reconciliation",
            detail: { ...correlation, stage: "deal_insert", cleanedUp },
          });
        }
        return NextResponse.json({
          error: cleanedUp ? "Failed to create handshake" : "Invitation cleanup needs review. Contact ScoutIt support.",
          reconciliationRequired: !cleanedUp,
          ...(cleanedUp ? {} : { correlation }),
        }, { status: 500 });
      }

      const committedDealId = dealData[0].id;
      const correlation = buildCorrelation(committedDealId);

      // 2. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
      // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
      await ensureConnectBalancesWallet(supabaseAdmin, userId, 'owner', 'starry');

      const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
        p_user_id: userId,
        p_amount: 1,
        p_reason: 'Owner invited a broker (handshake)',
        p_ref_type: 'handshake',
        p_ref_id: String(committedDealId),
      });

      if (spendError) {
        console.error("[INVITE API] Connect spend failed:", spendError);
        const cleanedUp = await rollbackInviteSideEffects(dealData[0].id);
        if (!cleanedUp) {
          await recordSystemEvent({
            event: "connects.invite.reconciliation_required",
            severity: "error",
            subjectTable: "deals",
            subjectId: committedDealId,
            summary: "Broker invitation Connect charge failed and rollback cleanup requires reconciliation",
            detail: { ...correlation, stage: "spend_rollback", cleanedUp },
          });
        }
        const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
        return NextResponse.json(
          cleanedUp
            ? { error: insufficient ? "Insufficient Connects balance." : "The Connect charge could not be confirmed. Check your balance before trying again." }
            : { error: "Invitation cleanup needs review. Contact ScoutIt support.", reconciliationRequired: true, correlation },
          { status: insufficient && cleanedUp ? 403 : 500 }
        );
      }

      const newBalance = spendData?.[0]?.total_balance ?? null;

      // Keep the user_profiles cache in sync (best-effort display cache; not the source of truth)
      if (newBalance !== null) {
        await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', userId);
      }

      try {
        // A-144 audit: source context on the handshake activity row (no schema change).
        await logActivity(supabaseAdmin, {
          dealId: committedDealId,
          propertyId: listingId,
          activityType: 'deal_created',
          actorId: userId,
          metadata: { source: 'owner_invite', ...connectSourceMetadata(connectSource, { reason_tag: 'REPRESENTATION_REQUEST' }) },
        });

        // GAP-21: Notify invited broker of representation request
        await notifyUser(supabaseAdmin, {
          userId: resolvedBrokerId,
          title: "New representation invitation",
          desc: "An owner has invited you to represent their property listing.",
          propertyId: listingId,
          notificationType: "broker_invite",
        });

        return NextResponse.json({
          success: true,
          dealId: committedDealId,
          connects_spent: 1,
          deduped: false,
          newBalance,
          source_context: connectSource,
        });
      } catch (postSpendErr) {
        console.error("[INVITE API] Post-spend side effect failure, issuing compensating refund:", postSpendErr);
        let refundConfirmed = false;
        try {
          const { data: refundRows, error: refundError } = await supabaseAdmin.rpc('refund_connects_system_error', {
            p_user_id: userId,
            p_amount: 1,
            p_reason: `Compensating refund: invite delivery failed for deal ${committedDealId}`,
            p_staff_id: "system",
            p_ref_id: String(committedDealId),
          });
          refundConfirmed = !refundError && Boolean(refundRows?.[0]?.transaction_id);
          if (!refundConfirmed) {
            console.error("[INVITE API] Refund needs reconciliation:", { dealId: committedDealId, code: refundError?.code });
          }
        } catch (refundError) {
          console.error("[INVITE API] Refund needs reconciliation:", { dealId: committedDealId, code: refundError?.code });
        }
        const cleanedUp = await rollbackInviteSideEffects(committedDealId);
        const reconciliationRequired = !refundConfirmed || !cleanedUp;
        if (reconciliationRequired) {
          await recordSystemEvent({
            event: "connects.invite.reconciliation_required",
            severity: "error",
            subjectTable: "deals",
            subjectId: committedDealId,
            summary: "Broker invitation post-spend refund or cleanup requires operator reconciliation",
            detail: { ...correlation, stage: "post_spend_compensation", refundConfirmed, cleanedUp },
          });
        }
        return NextResponse.json({
          error: !reconciliationRequired
            ? "Invitation delivery failed. Your Connect has been refunded."
            : "Invitation delivery needs review. Contact ScoutIt support before retrying.",
          refundConfirmed,
          reconciliationRequired,
          ...(reconciliationRequired ? { correlation } : {}),
        }, { status: 500 });
      }
    });

  } catch (err) {
    console.error("[INVITE API] Error during invite process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
