import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { canPostInDealStatus } from "@/lib/deals/dealStatus";
import { notifyUser } from "@/lib/notifications";
import { createRateLimiter } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Same dev-mock convention as /api/notifications and /api/dashboard/units --
// ?mockOwnerId=master-dev only takes effect when no real Bearer token was
// sent, so real user sessions are unaffected.

// ─────────────────────────────────────────────────────────────────────────
// A-236 (GAP-102). The chat write path had no size bound and no rate
// limit. A script could post a thousand oversized messages in a second: each
// one stored a row AND fired a notification to every counterparty — which
// costs an email per recipient.
//
// Both bounds are checked BEFORE the write, so a rejected message costs
// nothing: no row, no notification, no email.
//
// The size bound matches the database's own CHECK on deal_messages.body
// (length between 1 and 2000), so an oversized message is refused with the
// truth (413) instead of failing a constraint as a 500.
//
// The limiter is in-process; lib/rateLimit.js documents honestly what that
// does and does not guarantee on a multi-instance deployment.
// ─────────────────────────────────────────────────────────────────────────
const MAX_MESSAGE_CHARS = 2000;
const THREAD_MESSAGE_LIMIT = 20; // per user, per conversation, per minute
const USER_MESSAGE_LIMIT = 60; // per user, across conversations, per minute

const threadMessageLimiter = createRateLimiter({ limit: THREAD_MESSAGE_LIMIT, windowMs: 60_000 });
const userMessageLimiter = createRateLimiter({ limit: USER_MESSAGE_LIMIT, windowMs: 60_000 });



export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate access (buyer, broker, or owner)
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabaseAdmin
      .from('deal_messages')
      .select('*')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: true });

    if (msgError) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let payload = null;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    const body = payload?.body;

    if (typeof body !== "string" || body.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    // A-236: the size bound is enforced before the write, and answers with
    // the reason instead of a constraint violation.
    if (body.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          error: `Message is too long. The limit is ${MAX_MESSAGE_CHARS} characters.`,
          code: "MESSAGE_TOO_LONG",
          limit: MAX_MESSAGE_CHARS,
        },
        { status: 413 }
      );
    }

    // A-236: the rate bound, per thread and per account, before any storage
    // or notification work happens.
    const threadCheck = threadMessageLimiter(`${userId}:${dealId}`);
    const userCheck = userMessageLimiter(userId);
    if (!threadCheck.allowed || !userCheck.allowed) {
      const retryAfter = Math.max(threadCheck.retryAfterSeconds, userCheck.retryAfterSeconds);
      return NextResponse.json(
        {
          error: "You're sending messages too quickly. Wait a moment and try again.",
          code: "MESSAGE_RATE_LIMIT",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }


    // Validate access & check if deal is active
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, property_id, buyer_id, broker_id, properties(id, title, owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (deal.status === 'closed') {
      return NextResponse.json({ error: "This conversation has been closed and is read-only." }, { status: 403 });
    }

    // A-144 §10.10: chat is an accepted-relationship act. Waiting rows
    // (pending/invited) and finished rows (declined/withdrawn/...) cannot
    // post — membership alone is not permission before acceptance. The open
    // conversation states (active/accepted/connected/pitching) post free.
    if (!canPostInDealStatus(deal.status)) {
      return NextResponse.json({ error: "This conversation isn't open yet — messages unlock on acceptance." }, { status: 403 });
    }

    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // GAP-68: Enforce account suspension / shadowban check before writing messages
    try {
      const { data: senderProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('is_shadowbanned, archived_at')
        .eq('id', userId)
        .maybeSingle();
      if (senderProfile?.is_shadowbanned === true || Boolean(senderProfile?.archived_at)) {
        return NextResponse.json(
          { error: "Account is restricted from sending messages.", code: "ACCOUNT_RESTRICTED" },
          { status: 403 }
        );
      }
    } catch {
      // Fail open if moderation columns are not yet present
    }

    // GAP-56: Derive sender_role strictly server-side from verified deal membership
    const verifiedSenderRole =
      deal.buyer_id === userId
        ? "buyer"
        : deal.properties?.owner_id === userId
          ? "owner"
          : "broker";

    // Insert message
    const { data: message, error: insertError } = await supabaseAdmin
      .from('deal_messages')
      .insert([{
        deal_id: dealId,
        sender_id: userId,
        sender_role: verifiedSenderRole,
        body
      }])
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });

    // GAP-21: Notify counterparties of new message
    const recipients = [deal.buyer_id, deal.broker_id, deal.properties?.owner_id]
      .filter((pid) => pid && pid !== userId);
    const uniqueRecipients = [...new Set(recipients)];

    for (const recipientId of uniqueRecipients) {
      await notifyUser(supabaseAdmin, {
        userId: recipientId,
        title: "New message",
        desc: `New message on ${deal.properties?.title || "your deal"}: "${body.slice(0, 60)}${body.length > 60 ? "..." : ""}"`,
        propertyId: deal.properties?.id || deal.property_id || null,
        notificationType: "deal_message",
      });
    }

    // Note: there's no updated_at column on deals to bump for an inactivity
    // timer -- GET /api/deals derives "most recent conversation" from
    // deal_messages.created_at directly instead, so no write-back is needed
    // here (a previous version of this route silently failed trying to
    // update a column that doesn't exist).

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}

// Marks every message NOT sent by the current user as read -- called when the
// Inbox opens a conversation, so unread badges (GET /api/deals) clear.
export async function PATCH(request, { params }) {
  try {
    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isRoutedRecipient = await isRoutedDealRecipient(supabaseAdmin, dealId, userId);

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId ||
      isRoutedRecipient;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error: updateError } = await supabaseAdmin
      .from('deal_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('deal_id', dealId)
      .neq('sender_id', userId)
      .is('read_at', null);

    if (updateError) return NextResponse.json({ error: "Failed to mark messages read" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: sanitizeError(error) }, { status: 500 });
  }
}
