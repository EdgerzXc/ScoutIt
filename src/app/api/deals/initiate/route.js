import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyUser } from "@/lib/notifications";
import { logActivity } from "@/lib/crmActivity";
import { resolveUserId, assertAdultEligibility } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { canContactProperty, normalizeLifecycleState, PROPERTY_LIFECYCLE_STATES } from "@/lib/propertyLifecycle";
import { routingFailureStatus } from "@/lib/brokerRepresentation";
import { validateIntroMessage, INTRO_MAX } from "@/lib/connectIntro";
import { validateSampleInquiryRecipients } from "@/lib/sampleInventory";
import { anyBlocked, anyBlockedStrict } from "@/lib/connectBlocks";
import { normalizeConnectSource, connectSourceMetadata } from "@/lib/connectSource";
import { findRecentPendingDeal, checkReceiverGate } from "@/lib/connectGates";
import { freeInboundRecipient, isOpenGateAvailable } from "@/lib/openGate";



export async function POST(request) {
  try {
    // role is a display/reason-text hint only, never persisted to a column —
    // connect_balances/connect_transactions have no ole` column in the live
    // schema (per-role wallets are a documented but unbuilt design; the
    // wallet is per user_id only). unitId is optional: set when this initiate
    // is scoped to one delegated unit (Unit Master Page "Your Move") or when
    // an operator (role: 'operator') is opening the initial ask to a building
    // owner about delegating units (SCOUTIT_MASTER_BUILD_SPEC.md §9.2) — left
    // null until the owner picks specific units to hand over.
    // A-148: `anonymous` is the sender's per-request anonymity choice
    // (persisted to deals.sender_anonymous, migration-gated under O-004) —
    // distinct from `sender_identity_mode`, which is analytics-only source
    // context and never a send behavior.
    const { listingId, propertySlug, message, role = 'buyer', unitId, preferredBrokerId, source_type, source_id, reason_tag, sender_identity_mode, anonymous, expectOpenGate } = await request.json();
    let requestedAnonymous = anonymous === true;
    // A-144: source context is analytics + audit, never a send blocker.
    const connectSource = normalizeConnectSource({ source_type, source_id, reason_tag, sender_identity_mode });

    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    if (!listingId && !propertySlug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ── 18+ legal capacity (§34.2, §48) ──
    // Initiating a conversation spends Connects and opens a negotiation — a
    // contractual act under RA 8792, which requires a capacitated party.
    // Checked BEFORE the spend so an ineligible user is never charged.
    // Accounts predating 2026-08-06 are grandfathered (AGE_GATE_CUTOFF).
    if (!(await assertAdultEligibility(userId))) {
      return NextResponse.json(
        { error: "You must confirm you are 18 or older before contacting a listing." },
        { status: 403 },
      );
    }

    // §38.3 intro cap, enforced HERE because the composer's maxLength is a
    // suggestion to anyone posting directly. The message is optional (some
    // callers, e.g. unit delegation, pass none and fall through to the
    // defaultMessage below) — but if one is supplied it must fit the request
    // card the recipient will read it on.
    let introMessage = null;
    if (typeof message === "string" && message.trim() !== "") {
      const intro = validateIntroMessage(message);
      if (!intro.ok) {
        return NextResponse.json({ error: intro.error, maxLength: INTRO_MAX }, { status: 400 });
      }
      introMessage = intro.value;
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Public property pages are sourced from Airtable and only ever carry an
    // Airtable record id, never the Supabase properties.id UUID that
    // deals.property_id actually foreign-keys to (Airtable has no such field
    // synced back yet — a separate, pre-existing gap, not something to patch
    // via an Airtable schema change while that work is paused). Callers that
    // only know the public slug pass propertySlug instead, and we resolve the
    // real UUID here — slug is already identical on both sides today.
    let resolvedListingId = listingId;
    if (!resolvedListingId && propertySlug) {
      const { data: propBySlug, error: slugErr } = await supabaseAdmin
        .from('properties')
        .select('id')
        .eq('slug', propertySlug)
        .single();
      if (slugErr || !propBySlug) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      resolvedListingId = propBySlug.id;
    }

    // Needed for the owner notification below regardless of which lookup path
    // resolved the property (listingId vs propertySlug).
    const { data: propertyRow } = await supabaseAdmin
      .from('properties')
      .select('title, slug, owner_id, lifecycle_state, pipeline_status, quietly_open_to_offers')
      .eq('id', resolvedListingId)
      .single();

    if (!propertyRow) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    const propertyState = normalizeLifecycleState(propertyRow);
    if (propertyState === PROPERTY_LIFECYCLE_STATES.OFF_MARKET && !canContactProperty(propertyRow)) {
      return NextResponse.json({ error: "This off-market listing is view-only; the owner has not opened quiet offers" }, { status: 403 });
    }
    if (propertyState === PROPERTY_LIFECYCLE_STATES.PERMANENTLY_REMOVED) {
      return NextResponse.json({ error: "This listing has been permanently removed" }, { status: 410 });
    }
    if (propertyState !== PROPERTY_LIFECYCLE_STATES.LIVE && propertyState !== PROPERTY_LIFECYCLE_STATES.OFF_MARKET) {
      return NextResponse.json({ error: "Property is not available for contact" }, { status: 404 });
    }

    // If this is a per-unit contact (Unit Master Page "Your Move"), look up
    // whether the unit has a delegated operator so the ledger reason text is
    // accurate about who's actually being contacted.
    let unitOperatorId = null;
    if (unitId) {
      const { data: unitRow } = await supabaseAdmin
        .from('property_units')
        .select('operator_id, property_id')
        .eq('id', unitId)
        .single();
      if (!unitRow || unitRow.property_id !== resolvedListingId) {
        return NextResponse.json({ error: "Unit does not belong to this property. No Connect was spent." }, { status: 404 });
      }
      unitOperatorId = unitRow.operator_id || null;
    }

    // A-144 §10.10 pre-check: a recent pending send for the same sender +
    // property is reused BEFORE any row is created, so a double-click never
    // writes a phantom row that the post-creation check must then delete. The
    // post-creation check below stays as race safety for interleaved submits.
    const preExistingDealId = await findRecentPendingDeal(supabaseAdmin, userId, resolvedListingId);
    if (preExistingDealId) {
      return NextResponse.json({
        success: true,
        dealId: preExistingDealId,
        connects_spent: 0,
        deduped: true,
        status: "pending",
      });
    }

    // The database RPC captures the active roster and inserts the deal plus its
    // recipient snapshot under one property-roster advisory lock. This keeps
    // concurrent representation changes from splitting one lead between owner
    // and broker paths.
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const defaultMessage = role === 'operator'
      ? 'Operator requested to discuss operating units in this property.'
      : unitOperatorId
      ? 'Buyer contacted the unit operator.'
      : 'Buyer initiated contact.';

    const operatorOpenGate = role === "buyer" && unitId && unitOperatorId
      && await isOpenGateAvailable(supabaseAdmin, resolvedListingId, unitOperatorId, "operator", unitId);
    const legacyRouteArgs = {
      p_property_id: resolvedListingId, p_buyer_id: userId,
      p_message: introMessage || defaultMessage, p_expires_at: expiresAt.toISOString(),
      p_unit_id: unitId || null, p_preferred_broker_id: preferredBrokerId || null,
    };
    const directedOperator = role === "buyer" && Boolean(unitId && unitOperatorId);
    let routedResult = directedOperator
      ? await supabaseAdmin.rpc("create_routed_operator_deal", {
        p_property_id: resolvedListingId, p_unit_id: unitId, p_buyer_id: userId,
        p_message: introMessage || defaultMessage, p_expires_at: expiresAt.toISOString(),
        p_open_gate: Boolean(operatorOpenGate),
      })
      : await supabaseAdmin.rpc("create_routed_buyer_deal", legacyRouteArgs);
    // Until O-004 row 10 is applied, keep the existing paid unit flow
    // available. A quoted-free request never falls back to a paid route.
    const missingOperatorRpc = directedOperator && !operatorOpenGate && routedResult.error
      && (routedResult.error.code === "PGRST202" || routedResult.error.code === "42883"
        || /function.*does not exist/i.test(routedResult.error.message || ""));
    if (missingOperatorRpc) routedResult = await supabaseAdmin.rpc("create_routed_buyer_deal", legacyRouteArgs);
    const { data: routedDeal, error: routingError } = routedResult;
    if (routingError || !routedDeal?.[0]?.deal_id) {
      console.error("[INITIATE API] Routed deal creation failed:", routingError);
      const reason = routingError?.message?.includes("BROKER_NOT_CONTACTABLE") ? "broker_not_contactable" : "routing_unavailable";
      return NextResponse.json({ error: reason === "broker_not_contactable" ? "That broker is no longer available for this property." : "Lead routing is temporarily unavailable; no Connect was spent." }, { status: routingFailureStatus(reason) });
    }
    const dealId = routedDeal[0].deal_id;
    const recipientIds = routedDeal[0].recipient_ids || [];
    const routedToRoster = routedDeal[0].routed_to_roster === true;
    // Human-testing samples may notify only explicitly designated test accounts.
    // Validate the server-resolved recipient snapshot before spending a Connect.
    // A missing allowlist fails closed and removes the just-created pending deal.
    const sampleRouting = validateSampleInquiryRecipients({
      slug: propertyRow.slug || propertySlug,
      recipientIds: [...recipientIds, unitOperatorId].filter(Boolean),
      allowlistValue: process.env.HUMAN_TEST_SAMPLE_RECIPIENT_IDS,
    });
    if (!sampleRouting.ok) {
      await supabaseAdmin.from('deals').delete().eq('id', dealId);
      return NextResponse.json(
        { error: "Sample inquiries are unavailable until test routing is configured. No Connect was spent." },
        { status: 503 },
      );
    }

    // A-144 double-tap guard: a pending deal for the same sender+property
    // inside the window is reused, never re-spent. Checked after routing so
    // the property is resolved, before any money moves.
    const recentDealId = await findRecentPendingDeal(supabaseAdmin, userId, resolvedListingId);
    if (recentDealId && recentDealId !== dealId) {
      await supabaseAdmin.from('deals').delete().eq('id', dealId);
      return NextResponse.json({
        success: true,
        dealId: recentDealId,
        connects_spent: 0,
        deduped: true,
        status: "pending",
      });
    }

    // A-144 invariant #6: blocked sends fail BEFORE any spend. The pending
    // row created above is rolled back so no phantom request remains.
    if (await anyBlocked(supabaseAdmin, userId, [...recipientIds, unitOperatorId].filter(Boolean))) {
      await supabaseAdmin.from('deals').delete().eq('id', dealId);
      return NextResponse.json(
        { error: "This request can't be sent. No Connect was spent." },
        { status: 403 },
      );
    }

    // A-144 receiver gates (§8): paused accounts and full pending queues
    // refuse new paid approaches; existing conversations are untouched.
    for (const recipientId of [...recipientIds, unitOperatorId].filter(Boolean)) {
      const gate = await checkReceiverGate(supabaseAdmin, recipientId, resolvedListingId, dealId);
      if (!gate.ok) {
        await supabaseAdmin.from('deals').delete().eq('id', dealId);
        return NextResponse.json(
          { error: gate.message || "This account isn't accepting new Connects right now. No Connect was spent." },
          { status: 403 },
        );
      }
    }

    // 2. Atomic Connect spend — balance check + 3-bucket deduction (granted → purchased →
    // earned) + ledger insert, all in one indivisible Postgres transaction (spend_connects RPC).
    // Matches the pattern already proven correct in /api/dashboard/invite/route.js.
    // A-144 decision: legacy per-user wallet stays authoritative (no role column).
    let spendError = null;
    let spendData = null;

    // Open Gate is inbound-only, per represented broker and listing. The
    // routed recipient snapshot, not the browser flag, decides the price.
    const brokerFree = freeInboundRecipient(recipientIds, preferredBrokerId, unitId, role)
      && await isOpenGateAvailable(supabaseAdmin, resolvedListingId, preferredBrokerId);
    const ownerFree = role === "buyer" && !unitId && !preferredBrokerId
      && recipientIds.length === 1 && recipientIds[0] === propertyRow.owner_id
      && await isOpenGateAvailable(supabaseAdmin, resolvedListingId, propertyRow.owner_id, "owner");
    const openGateFree = Boolean(operatorOpenGate || brokerFree || ownerFree);
    if (expectOpenGate === true && !openGateFree) {
      await supabaseAdmin.from("deals").delete().eq("id", dealId);
      return NextResponse.json({ error: "Open Gate has closed. No Connect was spent. Refresh the contact card." }, { status: 409 });
    }
    if (openGateFree) {
      const blockState = await anyBlockedStrict(supabaseAdmin, userId, recipientIds);
      if (!blockState.ok || blockState.blocked) {
        await supabaseAdmin.from("deals").delete().eq("id", dealId);
        return NextResponse.json({ error: blockState.blocked ? "This recipient has blocked the request. No Connect was spent." : "Open Gate safety check unavailable. No request was sent." }, { status: blockState.blocked ? 403 : 503 });
      }
      const { data: admitted, error: admissionError } = await supabaseAdmin.rpc("admit_open_gate_free_deal", {
        p_deal_id: dealId, p_buyer_id: userId,
      });
      if (admissionError || admitted !== true) {
        await supabaseAdmin.from("deals").delete().eq("id", dealId);
        return NextResponse.json({ error: admissionError ? "Open Gate is temporarily unavailable. No request was sent." : "Free inquiry limit reached. Try again later." }, { status: admissionError ? 503 : 429 });
      }
    }
    if (openGateFree) {
      const { data: senderProfile, error: senderError } = await supabaseAdmin
        .from("user_profiles").select("is_profile_public").eq("id", userId).maybeSingle();
      if (senderError || !senderProfile) {
        await supabaseAdmin.from("deals").delete().eq("id", dealId);
        return NextResponse.json({ error: "Privacy setting unavailable. No request was sent." }, { status: 503 });
      }
      // Open Gate identity follows the sender's own profile choice; a browser
      // cannot make a private profile public or opt out of this path's rule.
      requestedAnonymous = senderProfile.is_profile_public !== true;
    }

    const spendResult = openGateFree
      ? { data: null, error: null }
      : await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: role === 'operator'
        ? 'Operator contacted building owner'
        : unitOperatorId
        ? 'Buyer contacted unit operator'
        : 'Buyer contacted owner',
      p_ref_type: 'initiate_chat',
      p_ref_id: resolvedListingId,
    });
    spendError = spendResult.error;
    spendData = spendResult.data;

    if (spendError) {
      console.error("[INITIATE API] Connect spend failed:", spendError);
      await supabaseAdmin.from('deals').delete().eq('id', dealId);
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }

    const newBalance = spendData?.[0]?.total_balance ?? null;

    // Record what this conversation cost, on the conversation (§40.14).
    // Previously the amount was returned to the client and then discarded, so
    // nothing tied a spend to the thread it bought — which is how a hardcoded
    // "3 Connects Spent" ended up in the chat header while the ledger charged 1.
    //
    // Tie the successful one-Connect ledger spend to this conversation.
    const { error: stampError } = await supabaseAdmin
      .from('deals')
      .update({ connects_spent: openGateFree ? 0 : 1, ...(openGateFree ? { open_gate_inbound: true } : {}) })
      .eq('id', dealId);
      if (stampError) {
        console.error("[INITIATE API] Could not stamp Connect cost:", stampError);
        await supabaseAdmin.from("deals").delete().eq("id", dealId);
        if (!openGateFree) {
          await supabaseAdmin.rpc("refund_connects_system_error", {
            p_user_id: userId, p_amount: 1, p_reason: "Connect cost stamp failed",
            p_staff_id: "system", p_ref_id: dealId,
          });
        }
        return NextResponse.json({ error: "Could not complete this request. No request was delivered." }, { status: 503 });
      }

    // A-148: persist the anonymity choice on the conversation, next to what
    // it cost. The column is migration-gated: mention it ONLY when requested,
    // so ordinary sends never touch a column that may not exist yet. A
    // missing column fails only anonymous sends — honestly, with the deal
    // rolled back and the just-spent Connect refunded as a platform error —
    // never ordinary ones.
    if (requestedAnonymous) {
      const { error: anonError } = await supabaseAdmin
        .from('deals')
        .update({ sender_anonymous: true })
        .eq('id', dealId);
      if (anonError) {
        console.error("[INITIATE API] Could not stamp sender_anonymous:", anonError);
        await supabaseAdmin.from('deals').delete().eq('id', dealId);
        if (!openGateFree) {
          await supabaseAdmin.rpc('refund_connects_system_error', {
            p_user_id: userId,
            p_amount: 1,
            p_reason: 'Anonymous-send stamp failed after spend',
            p_staff_id: 'system',
            p_ref_id: dealId,
          });
        }
        const missingColumn = anonError?.code === "42703" || /does not exist|undefined_column/i.test(anonError?.message || "");
        return NextResponse.json(
          { error: missingColumn ? "Anonymous sending isn't available yet. No Connect was spent." : "Could not record your anonymity choice. No Connect was spent." },
          { status: missingColumn ? 503 : 500 }
        );
      }
    }

    // Keep the user_profiles cache in sync (best-effort display cache; not the source of truth)
    if (newBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: newBalance }).eq('id', userId);
    }

    // Signal exactly the recipient snapshot. When the active roster is
    // non-empty the owner is deliberately absent; when it is empty the RPC
    // returns the owner/lister as the sole recipient.
    const propertyTitle = propertyRow?.title || 'your property';
    for (const recipientId of recipientIds) {
      if (!recipientId || recipientId === userId) continue;
      await notifyUser(supabaseAdmin, {
        userId: recipientId,
        title: role === 'operator' ? 'New operator request' : 'New inquiry',
        desc: role === 'operator'
          ? `Someone wants to operate units in "${propertyTitle}".`
          : `Someone is asking about "${propertyTitle}".`,
        icon: role === 'operator' ? '🏢' : '💬',
        propertyId: resolvedListingId,
        notificationType: role === 'operator' ? 'operator_request' : 'new_inquiry',
      });
    }
    if (unitOperatorId && unitOperatorId !== userId && !recipientIds.includes(unitOperatorId)) {
      await notifyUser(supabaseAdmin, {
        userId: unitOperatorId,
        title: 'New inquiry on your unit',
        desc: `Someone is asking about a unit you operate in "${propertyTitle}".`,
        icon: '💬',
        propertyId: resolvedListingId,
        notificationType: 'new_inquiry',
      });
    }

    // CRM Timeline: an initiated contact IS the inquiry event -- log it so it
    // shows up on the deal's and property's Timeline immediately.
    // A-144: source context + identity mode + bucket detail ride in metadata
    // (no deals schema change — O-004 gates columns).
    await logActivity(supabaseAdmin, {
      dealId,
      propertyId: resolvedListingId,
      activityType: role === 'operator' ? 'operator_request' : 'inquiry',
      actorId: userId,
      metadata: {
        unitId: unitId || null,
        recipientIds,
        routedToRoster,
        openGateFree,
        ...connectSourceMetadata(connectSource, {
          // Bucket detail when the RPC returns it (legacy RPC: total only).
          spent: spendData?.[0] || null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      dealId,
      connects_spent: openGateFree ? 0 : 1,
      open_gate: openGateFree,
      connects_remaining: newBalance,
      newBalance,
      routedToRoster,
      recipientCount: recipientIds.length,
      status: "pending",
      source_context: connectSource,
      sender_anonymous: requestedAnonymous,
    });

  } catch (err) {
    console.error("[INITIATE API] Error during initiate process:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
