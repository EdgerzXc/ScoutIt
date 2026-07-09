import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// Same dev-mock convention as /api/notifications and /api/dashboard/units --
// ?mockOwnerId=master-dev only takes effect when no real Bearer token was
// sent, so real user sessions are unaffected.
async function resolveUserId(request, mockOwnerId) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : null;

  if (token && token.trim() !== "") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (!error && user) return user.id;
  }
  // Dev-only fallback -- rejected in production, where identity must come
  // from a verified session token (same gate as /api/dashboard/publish).
  if (process.env.NODE_ENV !== "production" && mockOwnerId) return mockOwnerId;
  return null;
}

export async function GET(request, { params }) {
  try {
    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request, searchParams.get("mockOwnerId"));
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

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id: dealId } = await params;
    const { body, role, mockOwnerId } = await request.json();
    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!body || !role) {
      return NextResponse.json({ error: "Missing body or role" }, { status: 400 });
    }

    // Validate access & check if deal is active
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('status, buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    if (deal.status === 'closed') {
      return NextResponse.json({ error: "This conversation has been closed and is read-only." }, { status: 403 });
    }

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId;

    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Insert message
    const { data: message, error: insertError } = await supabaseAdmin
      .from('deal_messages')
      .insert([{
        deal_id: dealId,
        sender_id: userId,
        sender_role: role,
        body
      }])
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: "Failed to send message" }, { status: 500 });

    // Note: there's no updated_at column on deals to bump for an inactivity
    // timer -- GET /api/deals derives "most recent conversation" from
    // deal_messages.created_at directly instead, so no write-back is needed
    // here (a previous version of this route silently failed trying to
    // update a column that doesn't exist).

    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Marks every message NOT sent by the current user as read -- called when the
// Inbox opens a conversation, so unread badges (GET /api/deals) clear.
export async function PATCH(request, { params }) {
  try {
    const { id: dealId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request, searchParams.get("mockOwnerId"));
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: deal, error: dealError } = await supabaseAdmin
      .from('deals')
      .select('buyer_id, broker_id, properties(owner_id)')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });

    const isParty =
      deal.buyer_id === userId ||
      deal.broker_id === userId ||
      deal.properties?.owner_id === userId;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
