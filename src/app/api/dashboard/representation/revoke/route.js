import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { logActivity } from "@/lib/crmActivity";
import { notifyUser } from "@/lib/notifications";
import { sanitizeError } from "@/lib/sanitizeError";
import { representationStatusUpdate, REPRESENTATION_STATES } from "@/lib/brokerRepresentation";
import {
  REVOKED_STATUS,
  REVOKE_ACTIVITY,
  revokePlanFor,
  revokedThreadNotice,
} from "@/lib/deals/delegationRevoke";

// ─────────────────────────────────────────────────────────────────────────
// A-131 — THE OWNER'S EXIT.
//
// An owner hands a property to a broker and later wants it back. Until this
// route existed there was no way: `units/delegate` accepts only accept/decline
// and both answer a still-pending request, so an accepted arrangement had no
// end. An owner could close conversations one at a time — thirty units, thirty
// manual closes — and nothing in the product called that "ending the
// delegation".
//
// WHY IT HAD TO EXIST BEFORE A-130. The owner decided a broker needs no owner
// approval to run a delegated listing ("we don't transact"). That is the right
// boundary and it rests entirely on the owner being able to leave. Without an
// exit, "no owner veto" becomes "no owner recourse".
//
// THE RULES LIVE IN `lib/deals/delegationRevoke.js`, not here. This route
// authorises, orders the writes, and reports; it does not decide what a revoke
// means. A route that re-derives the rule is how two answers appear.
// ─────────────────────────────────────────────────────────────────────────

// Two ways in, and the first one exists so the UI never needs a broker's user
// id. `OwnerMode` renders deals, not identities — handing the client a
// counterparty UUID just to enable a button would widen what the API discloses
// for no reason. `dealId` lets the server resolve the pair it already knows.
const bodySchema = z
  .object({
    dealId: z.string().min(1).optional(),
    propertyId: z.string().min(1).optional(),
    brokerId: z.string().min(1).optional(),
  })
  .refine((v) => Boolean(v.dealId) || Boolean(v.propertyId && v.brokerId), {
    message: "Provide dealId, or both propertyId and brokerId",
  });

// Only an arrangement that is actually running can be ended. `pending` is
// included because an owner may want out of a request they already accepted
// in spirit but which never advanced — and because `declined` has its own path.
const ENDABLE_REPRESENTATION_STATES = ["pending", "active"];

export async function POST(request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Server error: auth is not configured" }, { status: 500 });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }
    const userId = user.id;

    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    let { propertyId, brokerId } = parsed.data;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Server error: missing service role configuration" },
        { status: 500 },
      );
    }

    // ── RESOLVE dealId → (property, broker) ───────────────────────────────
    // Done BEFORE the ownership check, so the check below still runs against
    // the resolved property. Resolving after would authorise one property and
    // act on another.
    if (parsed.data.dealId) {
      const { data: sourceDeal, error: sourceErr } = await supabaseAdmin
        .from("deals")
        .select("property_id, broker_id")
        .eq("id", parsed.data.dealId)
        .maybeSingle();
      if (sourceErr) {
        return NextResponse.json({ error: "Failed to load that conversation" }, { status: 503 });
      }
      if (!sourceDeal?.broker_id) {
        // A deal with no broker is a buyer inquiry, not a representation.
        // Ending "the representation" on one would be a no-op dressed as an
        // action, so say what is actually wrong.
        return NextResponse.json(
          { error: "That conversation is not a broker representation." },
          { status: 400 },
        );
      }
      propertyId = sourceDeal.property_id;
      brokerId = sourceDeal.broker_id;
    }

    // ── AUTHORISATION: the property owner, and nobody else ────────────────
    // Deliberately NOT "any party". A broker must not be able to end their own
    // representation through this route and have it recorded as the owner's
    // decision — a broker who wants out has their own exit, and conflating the
    // two would rewrite who ended the arrangement, the same defect the
    // `withdrawn` guard in /api/deals/[id] exists to prevent.
    const { data: property, error: propErr } = await supabaseAdmin
      .from("properties")
      .select("id, owner_id, title")
      .eq("id", propertyId)
      .single();
    if (propErr || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (property.owner_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this property" },
        { status: 403 },
      );
    }

    const { data: representation, error: repErr } = await supabaseAdmin
      .from("property_broker_representations")
      .select("id, status")
      .eq("property_id", propertyId)
      .eq("broker_id", brokerId)
      .maybeSingle();
    if (repErr) {
      return NextResponse.json({ error: "Representation service unavailable" }, { status: 503 });
    }
    if (!representation) {
      return NextResponse.json(
        { error: "This broker does not represent this property." },
        { status: 404 },
      );
    }
    if (!ENDABLE_REPRESENTATION_STATES.includes(representation.status)) {
      // Idempotent rather than an error the caller must interpret: ending an
      // arrangement that already ended is not a failure, and reporting it as
      // one invites a retry loop.
      return NextResponse.json({
        success: true,
        alreadyEnded: true,
        status: representation.status,
        dealsClosed: 0,
        buyerThreadsClosed: 0,
      });
    }

    // ── PLAN BEFORE WRITING ───────────────────────────────────────────────
    // Every deal on this property, so the shared rule decides which are in
    // scope. Reading wider than needed and letting one module filter is what
    // keeps the answer identical to what the tests assert.
    const { data: deals, error: dealsErr } = await supabaseAdmin
      .from("deals")
      .select("id, status, broker_id, buyer_id")
      .eq("property_id", propertyId);
    if (dealsErr) {
      return NextResponse.json({ error: "Failed to load conversations" }, { status: 503 });
    }

    const plan = revokePlanFor({ deals: deals || [], brokerId });

    // ── ORDER MATTERS ─────────────────────────────────────────────────────
    // Representation first. If the deal close fails afterwards the broker is
    // already off the roster, which fails CLOSED — they stop receiving routed
    // leads immediately. The reverse order would leave a broker on the roster
    // with closed threads, still collecting new enquiries.
    const { error: repUpdateErr } = await supabaseAdmin
      .from("property_broker_representations")
      .update(representationStatusUpdate({ status: REPRESENTATION_STATES.ENDED }))
      .eq("id", representation.id);
    if (repUpdateErr) {
      return NextResponse.json(
        { error: "Could not end the representation. Nothing was changed.", retryable: true },
        { status: 503 },
      );
    }

    let dealsClosed = 0;
    if (plan.allDealIds.length > 0) {
      const { data: closed, error: closeErr } = await supabaseAdmin
        .from("deals")
        .update({ status: REVOKED_STATUS, closed_at: new Date().toISOString() })
        .in("id", plan.allDealIds)
        .select("id");
      if (closeErr) {
        // The representation is already ended, which is the half that protects
        // the owner. Say plainly that the rest needs reconciliation instead of
        // reporting a clean success (Standing Rule: never report success on a
        // partial write).
        console.error("[REPRESENTATION REVOKE] Deal close failed:", closeErr);
        return NextResponse.json(
          {
            error:
              "The broker was removed, but some conversations could not be closed. Please retry.",
            retryable: true,
            representationEnded: true,
          },
          { status: 503 },
        );
      }
      dealsClosed = closed?.length || 0;
    }

    // ── THE BUYER IS TOLD WHY ─────────────────────────────────────────────
    // Closing buyer threads was authorised. Closing them SILENTLY was not.
    // The buyer is the only party here who did nothing and gets no refund —
    // a conversation that vanishes with no explanation reads as a bug or a
    // snub, and they have no other way to find out.
    //
    // A system message rather than a new column: `deals` has no close-reason
    // field and adding one is owner-gated (O-004), while `[SYSTEM]` messages
    // are an established pattern here (see /api/deals/[id]/schedule). It also
    // puts the explanation where the person is already looking.
    //
    // Only buyer threads. The broker learns through the notification below,
    // and posting this into their own delegation row would tell them about
    // themselves in the third person.
    if (plan.buyerDealIds.length > 0) {
      const notice = revokedThreadNotice();
      const { error: noticeError } = await supabaseAdmin.from("deal_messages").insert(
        plan.buyerDealIds.map((id) => ({
          deal_id: id,
          sender_id: userId,
          sender_role: "owner",
          body: `[SYSTEM] ${notice}`,
        })),
      );
      // Never fatal. A missing explanation is bad; an owner who cannot leave
      // because a message insert failed is worse, and the revoke has already
      // happened by this point.
      if (noticeError) {
        console.error("[REPRESENTATION REVOKE] Buyer notice insert failed:", noticeError);
      }
    }

    // ── THE RECORD ────────────────────────────────────────────────────────
    // `deals` has no close-reason column (adding one is owner-gated, O-004),
    // so this row IS the reason those conversations closed. Without it a
    // revoke is indistinguishable from everyone closing their chats at once.
    await logActivity(supabaseAdmin, {
      propertyId,
      activityType: REVOKE_ACTIVITY,
      actorId: userId,
      metadata: {
        brokerId,
        dealsClosed,
        buyerThreadsClosed: plan.buyerDealIds.length,
        representationId: representation.id,
      },
    });

    // ── THE WARNING ───────────────────────────────────────────────────────
    // Owner decision: "instantly, but they still get warned." The removal has
    // already happened above — this tells them it did. Notification failure
    // must not fail the revoke, which is why it is not awaited into the
    // response path: an owner's ability to leave cannot depend on a mail row.
    try {
      await notifyUser(supabaseAdmin, {
        userId: brokerId,
        title: "A representation ended",
        desc: `${property.title || "A property"} — the owner has ended your representation. ${
          plan.buyerDealIds.length > 0
            ? `${plan.buyerDealIds.length} buyer conversation${
                plan.buyerDealIds.length === 1 ? "" : "s"
              } closed with it.`
            : ""
        }`.trim(),
        // No `icon` on purpose. A-098 freezes emoji iconography at a baseline
        // and this is a new file, so passing one here would grow the drift the
        // guardrail exists to stop. `notifyUser` supplies the default, which
        // lives in an already-baselined module.
        propertyId,
        notificationType: REVOKE_ACTIVITY,
      });
    } catch (notifyErr) {
      console.error("[REPRESENTATION REVOKE] Broker notification failed:", notifyErr);
    }

    return NextResponse.json({
      success: true,
      dealsClosed,
      buyerThreadsClosed: plan.buyerDealIds.length,
      // Returned so the caller can show the buyer-facing sentence without
      // composing its own — one wording, one place.
      buyerNotice: revokedThreadNotice(),
    });
  } catch (err) {
    console.error("[REPRESENTATION REVOKE] error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
