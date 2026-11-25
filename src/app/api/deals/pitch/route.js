import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { validateSampleInquiryRecipients } from "@/lib/sampleInventory";
import { isBlocked, checkBlockGuard } from "@/lib/connectBlocks";
import { normalizeConnectSource, connectSourceMetadata } from "@/lib/connectSource";
import { findRecentPendingDeal, checkReceiverGate } from "@/lib/connectGates";
import { ensureConnectBalancesWallet } from "@/lib/connectsWallet";
import { createRateLimiter } from "@/lib/rateLimit";
import { clientIp } from "@/lib/clientIp";
import { recordSystemEvent } from "@/lib/systemEvents";

// Broker-initiated pitch (Market Intelligence Feed -> "Open Deal File").
// `deals` has an explicit RLS policy blocking ALL direct client inserts
// ("Users cannot insert deals directly", with_check: false) — DashboardContext's
// old sendPitch() called supabase.from('deals').insert() directly from the
// client, which the RLS hardening pass silently started rejecting on every
// single call. Combined with an unawaited promise in BrokerMode's
// handleSendPitch, the failure was invisible: the modal closed as if the
// pitch succeeded, the Connect was spent (client-side optimistic display),
// and no deal was ever created. This route follows the same
// verified-token + supabaseAdmin + spend_connects pattern already proven in
// /api/dashboard/invite and /api/deals/initiate.

export const checkPitchRate = createRateLimiter({ limit: 15, windowMs: 60_000, maxKeys: 10_000 });

const pitchQueue = new Map();

function withPitchQueue(key, task) {
  let entry = pitchQueue.get(key);
  if (!entry) {
    entry = { tail: Promise.resolve(), refCount: 0 };
    pitchQueue.set(key, entry);
  }
  entry.refCount += 1;

  const run = entry.tail.then(() => task());
  entry.tail = run.catch(() => {});

  return run.finally(() => {
    entry.refCount -= 1;
    if (entry.refCount <= 0 && pitchQueue.get(key) === entry) {
      pitchQueue.delete(key);
    }
  });
}

export async function POST(request) {
  try {
    const brokerId = await resolveUserId(request);
    if (!brokerId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    const rl = checkPitchRate(`${brokerId}:${clientIp(request)}`);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many pitch requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } }
      );
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const { listingId, message: rawMessage, source_type, source_id, reason_tag, sender_identity_mode } = body;
    if (rawMessage !== undefined && rawMessage !== null && typeof rawMessage !== "string") {
      return NextResponse.json({ error: "Pitch message must be a string" }, { status: 400 });
    }
    const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
    if (message.length > 2000) {
      return NextResponse.json({ error: "Pitch message must be 2,000 characters or fewer" }, { status: 400 });
    }
    const connectSource = normalizeConnectSource({ source_type, source_id, reason_tag, sender_identity_mode });

    if (!listingId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: brokerProfile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, active_roles, subscription_tier")
      .eq("id", brokerId)
      .maybeSingle();

    const callerRoles = [
      brokerProfile?.role,
      ...(Array.isArray(brokerProfile?.active_roles) ? brokerProfile.active_roles : []),
    ]
      .map((r) => String(r || "").trim().toLowerCase())
      .filter(Boolean);

    const isAuthorizedBroker =
      callerRoles.some((r) =>
        ["broker", "salesperson", "admin", "staff"].includes(r)
      ) ||
      (process.env.NODE_ENV !== "production" && brokerId === "master-dev");

    if (!isAuthorizedBroker) {
      return NextResponse.json(
        { error: "Representation pitches require a verified broker account under R.A. 9646." },
        { status: 403 }
      );
    }

    const { data: property, error: propertyError } = await supabaseAdmin
      .from("properties")
      .select("id, slug, owner_id, lifecycle_state, pipeline_status")
      .eq("id", listingId)
      .single();
    if (propertyError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
    if (!property.owner_id) {
      return NextResponse.json(
        {
          error: "This listing has no verified owner yet and cannot accept representation pitches. No Connect was spent.",
          code: "PROPERTY_UNCLAIMED",
        },
        { status: 422 }
      );
    }
    if (property.owner_id === brokerId) return NextResponse.json({ error: "Owners cannot pitch their own property" }, { status: 400 });
    const sampleRouting = validateSampleInquiryRecipients({
      slug: property.slug,
      recipientIds: [property.owner_id].filter(Boolean),
      allowlistValue: process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS,
    });
    if (!sampleRouting.ok) {
      return NextResponse.json(
        { error: "Sample broker pitches are unavailable until test routing is configured. No Connect was spent." },
        { status: 503 },
      );
    }

    return withPitchQueue(`${brokerId}:${listingId}`, async () => {
    const { data: existingRepresentation, error: representationLookupError } = await supabaseAdmin
      .from("property_broker_representations")
      .select("id, status")
      .eq("property_id", listingId)
      .eq("broker_id", brokerId)
      .maybeSingle();
    if (representationLookupError) return NextResponse.json({ error: "Representation service unavailable" }, { status: 503 });
    if (existingRepresentation?.status === "active") return NextResponse.json({ error: "You already represent this property" }, { status: 409 });
    if (existingRepresentation?.status === "locked" || existingRepresentation?.status === "suspended") return NextResponse.json({ error: "You are not currently eligible for a new representation request" }, { status: 409 });
    // A-144 double-tap guard FIRST (before any write): reuse a recent pending
    // pitch instead of spending again. findRecentPendingDeal now matches the
    // broker_id sender column (§10.10), so broker retries actually dedupe.
    const recentDealId = await findRecentPendingDeal(supabaseAdmin, brokerId, listingId);
    if (recentDealId) {
      return NextResponse.json({ success: true, dealId: recentDealId, connects_spent: 0, deduped: true, source_context: connectSource });
    }

    let createdRepresentationId = null;
    let resetRepresentationFromStatus = null;
    if (!existingRepresentation) {
      const { data: createdRepresentation, error: representationError } = await supabaseAdmin.from("property_broker_representations").insert({
        property_id: listingId,
        broker_id: brokerId,
        status: "pending",
        source: "broker_pitch",
      }).select("id").maybeSingle();
      if (representationError) return NextResponse.json({ error: "Failed to create representation request" }, { status: 503 });
      createdRepresentationId = createdRepresentation?.id || null;
    } else if (existingRepresentation.status === "declined" || existingRepresentation.status === "revoked") {
      const { error: resetError } = await supabaseAdmin
        .from("property_broker_representations")
        .update({ status: "pending", source: "broker_pitch" })
        .eq("id", existingRepresentation.id)
        .in("status", ["declined", "revoked"]);
      if (resetError) return NextResponse.json({ error: "Failed to reopen representation request" }, { status: 503 });
      resetRepresentationFromStatus = existingRepresentation.status;
    }
    // A-144 §10.10: a failed send must leave no actionable phantom — clean up
    // the representation row this send created, not just the deal row.
    const rollbackPitchSideEffects = async (dealId) => {
      if (dealId) {
        try { await supabaseAdmin.from('deals').delete().eq('id', dealId); } catch {}
      }
      if (createdRepresentationId) {
        try { await supabaseAdmin.from('property_broker_representations').delete().eq('id', createdRepresentationId); } catch {}
      } else if (resetRepresentationFromStatus && existingRepresentation?.id) {
        try {
          await supabaseAdmin
            .from('property_broker_representations')
            .update({ status: resetRepresentationFromStatus })
            .eq('id', existingRepresentation.id);
        } catch {}
      }
    };

    // 1. Insert the pitch deal first — rolled back below if a gate or the Connect spend fails.
    const { data: dealData, error: dealError } = await supabaseAdmin.from('deals').insert([{
      property_id: listingId,
      broker_id: brokerId,
      status: 'pending',
      pitch_message: message || 'A broker has expressed interest in representing this property.',
    }]).select();

    if (dealError || !dealData) {
      console.error("[PITCH API] Failed to insert deal:", dealError);
      await rollbackPitchSideEffects(null);
      return NextResponse.json({ error: "Failed to create pitch" }, { status: 500 });
    }

    // A-144 invariant #6 + §8 + A-305: blocked / paused / capped recipients fail before any spend.
    const ownerIdForGate = property?.owner_id || null;
    if (ownerIdForGate) {
      const blockGuard = await checkBlockGuard(supabaseAdmin, brokerId, [ownerIdForGate]);
      if (!blockGuard.ok && blockGuard.unavailable) {
        await rollbackPitchSideEffects(dealData[0].id);
        return NextResponse.json({ error: "Block safety check unavailable. No Connect was spent." }, { status: 503 });
      }
      if (blockGuard.blocked) {
        await rollbackPitchSideEffects(dealData[0].id);
        return NextResponse.json({ error: "This request can't be sent. No Connect was spent." }, { status: 403 });
      }
    }
    if (ownerIdForGate) {
      const gate = await checkReceiverGate(supabaseAdmin, ownerIdForGate, listingId, dealData[0].id);
      if (!gate.ok) {
        await rollbackPitchSideEffects(dealData[0].id);
        return NextResponse.json({ error: gate.message || "This account isn't accepting new Connects right now. No Connect was spent." }, { status: 403 });
      }
    }

    // 2. Atomic Connect spend — pinned to spend_connects_atomic RPC
    let spendError = null;
    let spendData = null;
    let spentConnects = false;

    if (process.env.NODE_ENV !== 'production' && brokerId === 'master-dev') {
      spendData = [{ success: true, total_balance: 99, remaining_total: 99 }];
    } else {
      await ensureConnectBalancesWallet(supabaseAdmin, brokerId, "broker", brokerProfile?.subscription_tier || "starry");
      const res = await supabaseAdmin.rpc('spend_connects_atomic', {
        p_user_id: brokerId,
        p_role: 'broker',
        p_amount: 1,
        p_tier: brokerProfile?.subscription_tier || "starry",
        p_source: 'pitch',
        p_reason: 'Broker pitched an owner (deal file)',
        p_reference_id: listingId,
      });
      spendError = res.error;
      spendData = res.data;
    }

    if (spendError) {
      console.error("[PITCH API] Connect spend failed:", spendError);
      await rollbackPitchSideEffects(dealData[0].id);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }
    const spendRow = Array.isArray(spendData) ? spendData[0] : spendData;
    if (!spendRow || spendRow.success === false) {
      await rollbackPitchSideEffects(dealData[0].id);
      return NextResponse.json(
        { error: "Insufficient Connects balance." },
        { status: 403 }
      );
    }
    spentConnects = true;

    const newBalance = spendData?.[0]?.remaining_total ?? spendData?.[0]?.total_balance ?? null;

    // Wrap post-spend side effects so any unexpected downstream error (stamp, notification,
    // logging, or property query) issues a compensating refund and removes the deal.
    try {
      // Tie the successful one-Connect ledger spend to this conversation (§40.14)
      const { error: stampError } = await supabaseAdmin
        .from('deals')
        .update({ connects_spent: 1 })
        .eq('id', dealData[0].id);
      if (stampError) {
        throw new Error(`Pitch connect cost stamp failed: ${stampError.message}`);
      }

      if (newBalance !== null) {
        try {
          await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', brokerId);
        } catch {}
      }

      // Notify the owner — the same real-time signal every other deal-creating
      // route sends; a pitch landing with no notification is exactly the kind
      // of silent gap this route exists to close.
      const { data: propertyRow } = await supabaseAdmin
        .from('properties')
        .select('title, owner_id')
        .eq('id', listingId)
        .single();

      if (propertyRow?.owner_id && propertyRow.owner_id !== brokerId) {
        await notifyUser(supabaseAdmin, {
          userId: propertyRow.owner_id,
          title: 'New broker pitch',
          desc: `A broker wants to represent "${propertyRow.title || 'your property'}".`,
          icon: '🤝',
          propertyId: listingId,
          notificationType: 'broker_pitch',
        });
      }

      await logActivity(supabaseAdmin, {
        dealId: dealData[0].id,
        propertyId: listingId,
        activityType: 'deal_created',
        actorId: brokerId,
        metadata: { source: 'broker_pitch', ...connectSourceMetadata(connectSource, { reason_tag: 'REPRESENTATION_REQUEST' }) },
      });

      return NextResponse.json({ success: true, dealId: dealData[0].id, newBalance, propertyTitle: propertyRow?.title, source_context: connectSource });
    } catch (postSpendErr) {
      console.error("[PITCH API] Post-spend side effect failure, issuing compensating refund:", postSpendErr);
      if (spentConnects && brokerId !== 'master-dev') {
        try {
          const { data: refundRows, error: refundRpcErr } = await supabaseAdmin.rpc('refund_connects_system_error', {
            p_user_id: brokerId,
            p_amount: 1,
            p_reason: `Compensating refund: pitch delivery failed for deal ${dealData[0].id} (${postSpendErr.message})`,
            p_staff_id: "system",
            p_ref_id: String(listingId),
          });
          const refundConfirmed =
            !refundRpcErr &&
            (!Array.isArray(refundRows) ||
              (refundRows.length > 0 && refundRows[0]?.success !== false));
          if (!refundConfirmed) {
            console.error("[PITCH API] Compensating refund unconfirmed:", refundRpcErr);
            await recordSystemEvent({
              event: "connects.pitch.reconciliation_required",
              severity: "error",
              subjectTable: "deals",
              subjectId: String(dealData?.[0]?.id || listingId),
              summary: "Compensating Connect refund failed after pitch delivery error",
              detail: {
                brokerId,
                listingId,
                dealId: dealData?.[0]?.id || null,
                error: refundRpcErr?.message || postSpendErr?.message || "unknown",
              },
            });
          }
        } catch (refundErr) {
          console.error("[PITCH API] Compensating refund RPC failed:", refundErr);
          await recordSystemEvent({
            event: "connects.pitch.reconciliation_required",
            severity: "error",
            subjectTable: "deals",
            subjectId: String(dealData?.[0]?.id || listingId),
            summary: "Compensating Connect refund failed after pitch delivery error",
            detail: {
              brokerId,
              listingId,
              dealId: dealData?.[0]?.id || null,
              error: refundErr?.message || postSpendErr?.message || "unknown",
            },
          });
        }
      }
      await rollbackPitchSideEffects(dealData[0].id);
      return NextResponse.json({ error: "Pitch delivery failed. Your Connect has been refunded." }, { status: 500 });
    }
    });

  } catch (err) {
    console.error("[PITCH API] Error during pitch process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
