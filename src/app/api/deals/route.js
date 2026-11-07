import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { logActivity } from "@/lib/crmActivity";
import { sanitizeError } from "@/lib/sanitizeError";
import { isIdentityPublic, counterpartyDisplayName } from "@/lib/identityDisclosure";
import * as userDealsModule from "@/lib/deals/userDeals";
const { deriveMyRole, loadDealMessageActivity, loadUserDealRows } = userDealsModule;

function fallbackExtractServiceRole(row) {
  try {
    if (typeof userDealsModule.extractServiceTargetRole === "function") {
      return userDealsModule.extractServiceTargetRole(row);
    }
  } catch {
    // Partially mocked userDeals module in tests
  }
  const snapRole = String(
    row?.routing_snapshot?.target_role ||
    row?.routing_snapshot?.professional_category ||
    row?.routing_snapshot?.recipient_role ||
    ""
  ).trim().toLowerCase();
  if (["photographer", "designer", "event_planner", "researcher", "operator", "broker", "owner"].includes(snapRole)) {
    return snapRole === "event_planner" ? "designer" : snapRole;
  }
  const pitch = String(row?.pitch_message || "");
  const tagMatch = /^\[LAYER\s*4\s*·\s*(PHOTOGRAPHER|DESIGNER|EVENT_PLANNER|RESEARCHER|BROKER)\]/i.exec(pitch);
  if (tagMatch) {
    const matched = tagMatch[1].toLowerCase();
    return matched === "event_planner" ? "designer" : matched;
  }
  return null;
}

function resolveIntentInfo(row, myRole) {
  try {
    if (typeof userDealsModule.describeDealIntent === "function") {
      return userDealsModule.describeDealIntent(row, myRole);
    }
  } catch {
    // Partially mocked userDeals module in tests
  }
  const role = String(myRole || "buyer").trim().toLowerCase();
  const propTitle = row?.properties?.title || row?.routing_snapshot?.signal_title || "Untitled Property";
  if (role === "owner") {
    return {
      targetRole: "owner",
      sourceLayer: row?.open_gate_inbound ? "open_gate" : "property_listing",
      intentBadge: "PROPERTY · REQUIRES OWNER",
      intentSummary: `Wants Property: ${propTitle} (Requires Owner Action)`,
    };
  }
  if (role === "photographer" || role === "designer" || role === "researcher") {
    const label = role === "photographer" ? "Spatial Photographer" : role === "designer" ? "Event & Concept Designer" : "Zoning & Land Researcher";
    return {
      targetRole: role,
      sourceLayer: "layer_4_professionals",
      intentBadge: `LAYER 4 · REQUIRES ${role.toUpperCase()}`,
      intentSummary: `Needs ${label} · Layer 4 Professional Request`,
    };
  }
  if (role === "broker") {
    return {
      targetRole: "broker",
      sourceLayer: "broker_representation",
      intentBadge: "MANDATE · REQUIRES BROKER",
      intentSummary: `Wants Property via Broker: ${propTitle}`,
    };
  }
  return {
    targetRole: "owner",
    sourceLayer: "property_listing",
    intentBadge: "YOUR SEEKER INQUIRY",
    intentSummary: `You inquired about Property: ${propTitle}`,
  };
}
import { isManualCreatableStatus } from "@/lib/deals/dealStatus";
import { isBlocked, checkBlockGuard } from "@/lib/connectBlocks";
import { checkReceiverGate } from "@/lib/connectGates";
import { notifyUser } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// Lists every deal the current user is a party to (as buyer, broker, or
// property owner) for the Inbox. The existing DashboardContext.js deals
// fetch pulls ALL deals client-side with no filter and relies on RLS alone
// -- this route does the party-membership check server-side instead (same
// auth pattern as /api/deals/[id]/messages), so it's additive/parallel, not
// a replacement for that existing (separately flagged) mechanism.


export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Invalid session or missing token" }, { status: 401 });
    }
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // Party membership is an authorization decision and lives in
    // lib/deals/userDeals.js so the dashboard attention rail asks the same
    // question of the same code rather than re-deriving the answer.
    const { rows: deals, error: dealsError, routedRecipients = [] } = await loadUserDealRows(supabaseAdmin, userId);
    if (dealsError === "routing_unavailable") {
      return NextResponse.json({ error: "Failed to load routed conversations" }, { status: 503 });
    }
    if (dealsError) {
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 500 });
    }

    // Best-effort display names for the "other party" -- these id columns
    // aren't real FKs so this is a manual lookup, not an embedded join.
    // The buyer deal stores no broker_id when a roster receives it. Use the
    // immutable routing snapshot to name a directed broker, never the owner.
    const routedBrokerByDeal = new Map();
    const routedOperatorByDeal = new Map();
    for (const recipient of routedRecipients) {
      if (recipient.recipient_type === "operator" && !routedOperatorByDeal.has(recipient.deal_id)) {
        routedOperatorByDeal.set(recipient.deal_id, recipient.recipient_id);
      }
      if (recipient.recipient_type === "broker" && !routedBrokerByDeal.has(recipient.deal_id)) {
        routedBrokerByDeal.set(recipient.deal_id, recipient.recipient_id);
      }
    }
    const otherPartyIds = new Set();
    for (const d of deals) {
      if (d.buyer_id && d.buyer_id !== userId) otherPartyIds.add(d.buyer_id);
      if (d.broker_id && d.broker_id !== userId) otherPartyIds.add(d.broker_id);
      if (routedOperatorByDeal.has(d.id) && routedOperatorByDeal.get(d.id) !== userId) otherPartyIds.add(routedOperatorByDeal.get(d.id));
      if (routedBrokerByDeal.has(d.id) && routedBrokerByDeal.get(d.id) !== userId) otherPartyIds.add(routedBrokerByDeal.get(d.id));
      if (d.properties?.owner_id && d.properties.owner_id !== userId) otherPartyIds.add(d.properties.owner_id);
    }

    let namesById = {};
    let publicById = {};
    if (otherPartyIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("user_profiles")
        .select("id, display_name, is_profile_public")
        .in("id", [...otherPartyIds]);
      namesById = Object.fromEntries((profiles || []).map((p) => [p.id, p.display_name]));
      // The privacy flag travels with the name so the disclosure rule below can
      // ask about it. Fetching the name without it is what made the leak
      // possible: the value was always available, nothing consulted it.
      publicById = Object.fromEntries((profiles || []).map((p) => [p.id, isIdentityPublic(p)]));
    }

    // Deals has no updated_at column, so "most recent conversation first" is
    // derived from message timestamps instead.
    const { lastMessageByDeal, lastActivityByDeal, unreadByDeal } =
      await loadDealMessageActivity(supabaseAdmin, deals.map((d) => d.id), userId);

    const result = deals
      .map((d) => {
        const myRole = routedOperatorByDeal.get(d.id) === userId ? "operator" : deriveMyRole(d, userId);
        const serviceRole = fallbackExtractServiceRole(d);
        const otherId =
          myRole === "buyer"
            ? (d.broker_id || routedOperatorByDeal.get(d.id) || routedBrokerByDeal.get(d.id) || d.properties?.owner_id)
            : myRole === "broker" || myRole === "photographer" || myRole === "designer" || myRole === "researcher" || myRole === "provider"
              ? (d.buyer_id || d.properties?.owner_id)
              : (d.broker_id || d.buyer_id);
        const otherRoleLabel =
          myRole === "buyer"
            ? serviceRole === "photographer"
              ? "Photographer"
              : serviceRole === "designer"
                ? "Designer"
                : serviceRole === "researcher"
                  ? "Researcher"
                  : routedOperatorByDeal.has(d.id)
                    ? "Operator"
                    : (d.broker_id || routedBrokerByDeal.has(d.id))
                      ? "Broker"
                      : "Owner"
            : myRole === "broker" || myRole === "photographer" || myRole === "designer" || myRole === "researcher" || myRole === "provider"
              ? (d.buyer_id ? "Buyer" : "Owner")
              : (d.broker_id ? "Broker" : "Buyer");
        let userScopedNote = "";
        if (d.private_notes) {
          try {
            const parsedNotes = JSON.parse(d.private_notes);
            if (parsedNotes && typeof parsedNotes === "object" && !Array.isArray(parsedNotes)) {
              userScopedNote = parsedNotes[userId] || "";
            } else {
              userScopedNote = String(d.private_notes);
            }
          } catch {
            userScopedNote = String(d.private_notes);
          }
        }

        const fallbackServiceTitle =
          serviceRole === "photographer"
            ? "Spatial Photography Brief"
            : serviceRole === "designer"
              ? "Event & Concept Design Brief"
              : serviceRole === "researcher"
                ? "Zoning & Land Research Brief"
                : "Untitled Property";
        const resolvedTitle = d.properties?.title || d.routing_snapshot?.signal_title || fallbackServiceTitle;
        const intentInfo = resolveIntentInfo({ ...d, propertyTitle: resolvedTitle }, myRole);

        return {
          id: d.id,
          status: d.status,
          propertyId: d.properties?.id || null,
          propertyTitle: resolvedTitle,
          propertySlug: d.properties?.slug || null,
          propertyPrice: d.properties?.price ?? null,
          unitId: d.unit_id || null,
          myRole,
          targetRole: intentInfo.targetRole,
          sourceLayer: intentInfo.sourceLayer,
          intentBadge: intentInfo.intentBadge,
          intentSummary: intentInfo.intentSummary,
          // A pending Connect is anonymous: the recipient learns the intent and
          // the tier, not the identity (§38.3). Acceptance is the act that
          // reveals a name; the handshake later reveals contact details. This
          // used to hand out the real display name to whoever asked, with no
          // check on status and no check on the person's own privacy setting —
          // so the Inbox list showed the very name the panel beside it promised
          // to withhold.
          // A-148: a sender's explicit per-request anonymity ("Anonymous",
          // the owner's word) conceals the sender from the recipient while
          // unanswered — never the recipient from the sender. Only
          // buyer-initiated rows can carry the flag (the inquiry modals), so
          // it applies exactly when the viewer is not the buyer.
          otherParty: counterpartyDisplayName({
            dealStatus: d.status,
            counterpartyIsPublic: otherId ? publicById[otherId] === true : false,
            senderAnonymous: myRole !== "buyer" && d.sender_anonymous === true,
            name: otherId ? namesById[otherId] : "",
            roleLabel: otherRoleLabel,
          }),
          otherPartyId: otherId || null,
          otherPartyRole: otherRoleLabel, // "Broker" | "Buyer" | "Owner" — which template a UI card should use
          lastMessage: lastMessageByDeal[d.id] || d.pitch_message || "",
          pitch_message: d.pitch_message,
          unreadCount: unreadByDeal[d.id] || 0,
          createdAt: d.created_at,
          lastActivityAt: lastActivityByDeal[d.id] || d.created_at,
          closedAt: d.closed_at,
          expiresAt: d.expires_at,
          // NULL for every row created before 2026-08-05 (§40.14). Passed
          // through as-is so the UI can tell "cost nothing" apart from "we
          // never wrote it down" — it renders the badge only for real numbers.
          connects_spent: d.connects_spent ?? null,
          open_gate_inbound: d.open_gate_inbound === true,
          // §40.15 lifecycle. archived_at NULL = not archived; the reset
          // timestamp is the single origin both the 7-day and 30-day
          // deadlines are measured from, so the client never computes one.
          archivedAt: d.archived_at ?? null,
          pendingClockResetAt: d.pending_clock_reset_at ?? null,
          private_notes: userScopedNote,
        };
      })
      .sort((a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt));

    return NextResponse.json({ deals: result });
  } catch (err) {
    console.error("[DEALS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

const postSchema = z.object({
  propertyId: z.string().optional().nullable(),
  propertySlug: z.string().optional().nullable(),
  otherPartyEmail: z.string(), // Recipient user UUID
  status: z.string().optional(),
  initialMessage: z.string().optional(),
  targetRole: z.enum(["owner", "broker", "photographer", "designer", "event_planner", "researcher", "operator"]).optional(),
  serviceTitle: z.string().max(160).optional(),
  sourceLayer: z.string().max(64).optional(),
});

export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const {
      propertyId,
      propertySlug,
      otherPartyEmail,
      status,
      initialMessage,
      targetRole,
      serviceTitle,
      sourceLayer,
    } = parsed.data;
    const userId = await resolveUserId(request);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const normalizedTargetRole = targetRole === "event_planner" ? "designer" : (targetRole || null);
    const isLayer4ServiceInquiry = ["photographer", "designer", "researcher"].includes(normalizedTargetRole);

    let property = null;
    if (propertyId) {
      const { data: propData, error: propError } = await supabaseAdmin
        .from("properties")
        .select("id, title, slug, owner_id")
        .eq("id", propertyId)
        .single();
      if ((propError || !propData) && !isLayer4ServiceInquiry) {
        return NextResponse.json({ error: "Property not found — use the Supabase property ID" }, { status: 404 });
      }
      property = propData || null;
    } else if (propertySlug) {
      const { data: propBySlug } = await supabaseAdmin
        .from("properties")
        .select("id, title, slug, owner_id")
        .eq("slug", propertySlug)
        .maybeSingle();
      property = propBySlug || null;
    } else if (!isLayer4ServiceInquiry) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const isOwner = property ? property.owner_id === userId : false;
    // A-144 §10.10: a manual send starts a request — it cannot manufacture an
    // accepted/connected/closed relationship from a client string. Rejected
    // BEFORE any spend so a forged outcome never costs a Connect.
    const requestedStatus = status || "pending";
    if (!isManualCreatableStatus(requestedStatus)) {
      return NextResponse.json(
        { error: "Manual deals start as pending or invited. No Connect was spent." },
        { status: 400 },
      );
    }
    // A-144 §10.10: resolve a real recipient before spending. The field
    // carries a user UUID (see NewDealModal); anything else fails here with
    // 0 spent instead of stranding a debit on a failed insert.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(otherPartyEmail)) {
      return NextResponse.json(
        { error: "Unknown recipient. Use the person's user UUID. No Connect was spent." },
        { status: 400 },
      );
    }
    const { data: recipientProfile, error: recipientError } = await supabaseAdmin
      .from("user_profiles")
      .select("id")
      .eq("id", otherPartyEmail)
      .maybeSingle();
    if (recipientError || !recipientProfile) {
      return NextResponse.json(
        { error: "Recipient account not found. No Connect was spent." },
        { status: 404 },
      );
    }
    if (otherPartyEmail === userId) {
      return NextResponse.json(
        { error: "You cannot open a deal with yourself. No Connect was spent." },
        { status: 400 },
      );
    }
    // A-144 shared send gates + A-305: blocked / paused / capped recipients fail
    // before any spend. In post-O-004 fail-closed posture, unavailable guard returns 503.
    const blockGuard = await checkBlockGuard(supabaseAdmin, userId, [otherPartyEmail]);
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
    const manualGate = await checkReceiverGate(supabaseAdmin, otherPartyEmail, property?.id || null);
    if (!manualGate.ok) {
      return NextResponse.json(
        { error: manualGate.message || "This account isn't accepting new Connects right now. No Connect was spent." },
        { status: 403 },
      );
    }
    // A-144: manual deal creation is a paid Connect action, not a free write.
    // Spend FIRST so a failed payment never leaves a phantom conversation.
    // Legacy per-user wallet stays authoritative (owner decision, A-144).
    const spendRefId = property?.id || otherPartyEmail;
    const { data: spendData, error: spendError } = await supabaseAdmin.rpc('spend_connects', {
      p_user_id: userId,
      p_amount: 1,
      p_reason: isLayer4ServiceInquiry
        ? `Layer 4 ${normalizedTargetRole} inquiry`
        : 'Manual deal created from dashboard',
      p_ref_type: isLayer4ServiceInquiry ? 'layer4_service_deal' : 'manual_deal',
      p_ref_id: spendRefId,
    });
    if (spendError) {
      const insufficient = spendError.message?.includes('insufficient balance') || spendError.message?.includes('no wallet found');
      return NextResponse.json(
        { error: insufficient ? "Insufficient Connects balance." : "Transaction failed. No Connects spent." },
        { status: insufficient ? 403 : 500 }
      );
    }
    const nowIso = new Date().toISOString();
    const rawMsg = initialMessage || "";
    const formattedMessage = isLayer4ServiceInquiry && !/^\[LAYER\s*4\s*·/i.test(rawMsg)
      ? `[LAYER 4 · ${normalizedTargetRole.toUpperCase()}] ${rawMsg}`.trim()
      : rawMsg;
    const resolvedServiceTitle =
      property?.title ||
      serviceTitle ||
      (normalizedTargetRole === "photographer"
        ? "Spatial Photography Brief"
        : normalizedTargetRole === "designer"
          ? "Event & Concept Design Brief"
          : normalizedTargetRole === "researcher"
            ? "Zoning & Land Research Brief"
            : "Untitled Property");

    const baseInsertRow = {
      status: requestedStatus,
      pitch_message: formattedMessage,
      buyer_id: isLayer4ServiceInquiry ? userId : otherPartyEmail,
      broker_id: isLayer4ServiceInquiry ? otherPartyEmail : (isOwner ? null : userId),
      property_id: property?.id || null,
      connects_spent: 1,
      pending_clock_reset_at: nowIso,
    };

    let inserted = null;
    let error = null;
    if (isLayer4ServiceInquiry || normalizedTargetRole) {
      const snapshotPayload = {
        ...baseInsertRow,
        routing_snapshot: {
          recipient_ids: [otherPartyEmail],
          recipient_type: normalizedTargetRole || (isOwner ? "owner" : "broker"),
          target_role: normalizedTargetRole || (isOwner ? "owner" : "broker"),
          source_layer: sourceLayer || (isLayer4ServiceInquiry ? "layer_4_professionals" : "property_listing"),
          signal_title: resolvedServiceTitle,
          initiator_id: userId,
          captured_at: nowIso,
        },
      };
      const firstTry = await supabaseAdmin
        .from("deals")
        .insert(snapshotPayload)
        .select("*, properties(id, title, slug, owner_id)")
        .single();
      if (firstTry.error && (firstTry.error.code === "42703" || /does not exist|undefined_column/i.test(firstTry.error.message || ""))) {
        const retryTry = await supabaseAdmin
          .from("deals")
          .insert(baseInsertRow)
          .select("*, properties(id, title, slug, owner_id)")
          .single();
        inserted = retryTry.data;
        error = retryTry.error;
      } else {
        inserted = firstTry.data;
        error = firstTry.error;
      }
    } else {
      const stdTry = await supabaseAdmin
        .from("deals")
        .insert(baseInsertRow)
        .select("*, properties(id, title, slug, owner_id)")
        .single();
      inserted = stdTry.data;
      error = stdTry.error;
    }

    if (error) {
      // A-144 §10.10: a failed insert must not strand the debit — refund it
      // as a platform error (same pattern as the A-148 anonymity rollback).
      console.error("[DEALS API] POST error:", error);
      let refundSucceeded = false;
      try {
        const { error: refundErr } = await supabaseAdmin.rpc('refund_connects_system_error', {
          p_user_id: userId,
          p_amount: 1,
          p_reason: 'Manual deal insert failed after spend',
          p_staff_id: 'system',
          p_ref_id: spendRefId,
        });
        if (!refundErr) {
          refundSucceeded = true;
        } else {
          console.error("[DEALS API] Refund RPC returned error:", refundErr);
        }
      } catch (refundEx) {
        console.error("[DEALS API] Refund RPC threw exception:", refundEx);
      }

      if (refundSucceeded) {
        return NextResponse.json({ error: "Failed to create deal. Your Connect token has been refunded." }, { status: 500 });
      }

      // If refund failed, record emergency log so ledger can be reconciled
      try {
        await supabaseAdmin.from('security_access_logs').insert({
          event_type: 'connects_refund_failed',
          user_id: userId,
          ip_hash: 'system_reconciliation',
          user_agent: 'deals_post_rollback',
        });
      } catch {}

      return NextResponse.json({
        error: "Failed to create deal. Connect refund encountered a sync issue and has been flagged for staff review.",
        ref_id: spendRefId,
      }, { status: 500 });
    }
    const manualBalance = spendData?.[0]?.total_balance ?? null;
    if (manualBalance !== null) {
      await supabaseAdmin.from('user_profiles').update({ connects_balance: manualBalance }).eq('id', userId);
    }

    // GAP-69: Notify recipient of the newly created manual or Layer 4 service deal
    const serviceRoleLabel =
      normalizedTargetRole === "photographer"
        ? "Spatial Photographer"
        : normalizedTargetRole === "designer"
          ? "Event & Concept Designer"
          : normalizedTargetRole === "researcher"
            ? "Zoning & Land Researcher"
            : null;
    await notifyUser(supabaseAdmin, {
      userId: otherPartyEmail,
      title: serviceRoleLabel
        ? `New ${serviceRoleLabel} inquiry`
        : isOwner
          ? "New property invitation"
          : "New Connect request",
      desc: serviceRoleLabel
        ? `Someone requested your ${serviceRoleLabel} services via Layer 4 Professionals.`
        : `A new Connect request was opened for "${property?.title || "a property"}".`,
      propertyId: property?.id || null,
      notificationType: "deal_created",
    });

    await logActivity(supabaseAdmin, {
      dealId: inserted.id,
      propertyId: property?.id || null,
      activityType: "deal_created",
      actorId: userId,
      metadata: {
        source: isLayer4ServiceInquiry ? "layer_4_professionals" : "manual",
        targetRole: normalizedTargetRole || (isOwner ? "owner" : "broker"),
        status: inserted.status,
      },
    });

    const createdMyRole = isLayer4ServiceInquiry ? "buyer" : (isOwner ? "owner" : "broker");
    const createdIntent = resolveIntentInfo(
      { ...inserted, propertyTitle: resolvedServiceTitle },
      createdMyRole
    );

    // Format like the GET endpoint
    const deal = {
      id: inserted.id,
      status: inserted.status,
      propertyId: inserted.properties?.id || property?.id || propertyId || null,
      propertyTitle: inserted.properties?.title || resolvedServiceTitle,
      propertySlug: inserted.properties?.slug || property?.slug || null,
      myRole: createdMyRole,
      targetRole: createdIntent.targetRole,
      sourceLayer: createdIntent.sourceLayer,
      intentBadge: createdIntent.intentBadge,
      intentSummary: createdIntent.intentSummary,
      otherParty: otherPartyEmail || "Buyer",
      lastMessage: inserted.pitch_message || "",
      unreadCount: 0,
      createdAt: inserted.created_at,
      lastActivityAt: inserted.created_at,
      closedAt: inserted.closed_at,
      expiresAt: inserted.expires_at,
      private_notes: inserted.private_notes,
    };

    return NextResponse.json({ success: true, deal });
  } catch (err) {
    console.error("[DEALS API] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
