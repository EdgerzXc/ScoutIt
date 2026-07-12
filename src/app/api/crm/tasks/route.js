import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";
import { resolveUserId } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

// CRM "don't forget" engine (crm_tasks). Same dev-mock convention as
// /api/notifications and /api/deals -- mockOwnerId only takes effect when no
// real Bearer token was sent, so real sessions are unaffected.


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const { data: tasks, error } = await supabaseAdmin
      .from("crm_tasks")
      .select("id, deal_id, title, due_at, completed_at, created_at")
      .eq("owner_user_id", userId)
      .order("completed_at", { ascending: true, nullsFirst: true })
      .order("due_at", { ascending: true, nullsFirst: false })
      .limit(200);

    if (error) {
      console.error("[CRM TASKS API] GET error:", error);
      return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
    }

    // Best-effort property titles for deal-linked tasks so the list reads
    // "Follow up — Paragon Tower" instead of a bare UUID.
    const dealIds = [...new Set((tasks || []).map((t) => t.deal_id).filter(Boolean))];
    let dealTitleById = {};
    if (dealIds.length > 0) {
      const { data: deals } = await supabaseAdmin
        .from("deals")
        .select("id, properties(title)")
        .in("id", dealIds);
      dealTitleById = Object.fromEntries((deals || []).map((d) => [d.id, d.properties?.title || null]));
    }

    const result = (tasks || []).map((t) => ({
      id: t.id,
      dealId: t.deal_id,
      dealTitle: t.deal_id ? dealTitleById[t.deal_id] || null : null,
      title: t.title,
      dueAt: t.due_at,
      completedAt: t.completed_at,
      createdAt: t.created_at,
    }));

    return NextResponse.json({ tasks: result });
  } catch (err) {
    console.error("[CRM TASKS API] GET error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

const postSchema = z.object({
  title: z.string().min(1).max(300),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  });

export async function POST(request) {
  try {
    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { title, dueAt, dealId  } = parsed.data;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    // A deal-linked task must belong to a deal the user is actually party to.
    if (dealId) {
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("buyer_id, broker_id, properties(owner_id)")
        .eq("id", dealId)
        .single();
      if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      const isParty =
        deal.buyer_id === userId ||
        deal.broker_id === userId ||
        deal.properties?.owner_id === userId;
      if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("crm_tasks")
      .insert([{ owner_user_id: userId, title: title.trim(), due_at: dueAt || null, deal_id: dealId || null }])
      .select("id, deal_id, title, due_at, completed_at, created_at")
      .single();

    if (error) {
      console.error("[CRM TASKS API] POST error:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: inserted.id,
        dealId: inserted.deal_id,
        dealTitle: null,
        title: inserted.title,
        dueAt: inserted.due_at,
        completedAt: inserted.completed_at,
        createdAt: inserted.created_at,
      },
    });
  } catch (err) {
    console.error("[CRM TASKS API] POST error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
