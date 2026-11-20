import { NextResponse } from "next/server";
import { z } from "zod";
import { isRoutedDealRecipient } from "@/lib/dealParty";
import { DEAL_SUPPORT_CATEGORIES, MAX_DEAL_SUPPORT_MESSAGE } from "@/lib/dealSupport";
import { createRateLimiter } from "@/lib/rateLimit";
import { resolveUserId } from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const schema = z.object({
  requestId: z.uuid(),
  category: z.enum(Object.keys(DEAL_SUPPORT_CATEGORIES)),
  message: z.string().trim().min(1).max(MAX_DEAL_SUPPORT_MESSAGE),
});
const checkSupportRate = createRateLimiter({ limit: 8, windowMs: 60_000 });

function reply(body, status = 200, headers = {}) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store", ...headers } });
}

export async function POST(request, { params }) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return reply({ error: "Sign in to request staff support." }, 401);
    if (!supabaseAdmin) return reply({ error: "Staff support is temporarily unavailable." }, 503);
    const { id: dealId } = await params;
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!z.uuid().safeParse(dealId).success || !parsed.success) {
      return reply({ error: "Choose a category and enter a message of up to 4,000 characters." }, 400);
    }

    const rate = checkSupportRate(userId);
    if (!rate.allowed) {
      return reply({ error: "Too many support requests. Please wait and try again." }, 429, {
        "Retry-After": String(rate.retryAfterSeconds),
      });
    }

    const { data: deal, error: dealError } = await supabaseAdmin.from("deals")
      .select("id, buyer_id, broker_id, properties(owner_id)")
      .eq("id", dealId).maybeSingle();
    if (dealError) throw dealError;
    const isParty = deal && (
      deal.buyer_id === userId || deal.broker_id === userId || deal.properties?.owner_id === userId
      || await isRoutedDealRecipient(supabaseAdmin, dealId, userId)
    );
    if (!isParty) return reply({ error: "Deal room not found." }, 404);

    const { data: account, error: accountError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (accountError) throw accountError;
    const { user } = account;
    const email = z.email().max(200).safeParse(user?.email);
    if (!user?.email_confirmed_at || !email.success) {
      return reply({ error: "Verify your account email so staff can reply to you." }, 422);
    }

    const { requestId, category, message } = parsed.data;
    const subject = `[DIRECT SUPPORT] Deal room ${deal.id} · ${DEAL_SUPPORT_CATEGORIES[category]}`;
    const { error: insertError } = await supabaseAdmin.from("contact_messages").insert({
      id: requestId,
      user_id: userId,
      name: "ScoutIt member",
      email: email.data,
      subject,
      message,
      status: "new",
    });
    if (!insertError) return reply({ ticketId: requestId }, 201);
    if (insertError.code !== "23505") throw insertError;

    const { data: previous, error: lookupError } = await supabaseAdmin.from("contact_messages")
      .select("message").eq("id", requestId).eq("user_id", userId).eq("subject", subject).maybeSingle();
    if (lookupError) throw lookupError;
    if (previous?.message === message) return reply({ ticketId: requestId });
    return reply({ error: "We could not confirm this request. Review your message and try again." }, 409);
  } catch (error) {
    console.error("[Deal support] Request failed:", error?.code || error?.name);
    return reply({ error: "We could not save your support request. Please try again." }, 503);
  }
}
