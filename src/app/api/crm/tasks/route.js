import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { logActivity } from "@/lib/crmActivity";
import {
  createTaskSchema,
  serializeTask,
  sortTasks,
  summarizeTasks,
  TASK_STATUSES,
  toTaskRow,
} from "@/lib/crm/taskModel";

export const dynamic = "force-dynamic";

// The CRM task engine (crm_tasks).
//
// A task is a record with a lifecycle now — status, priority, an assignee, and
// an optional property as well as a deal — rather than a title with a
// completion timestamp. The shapes and ordering live in lib/crm/taskModel.js so
// the API and TaskRail cannot disagree about what "overdue" means.

const TASK_COLUMNS =
  "id, owner_user_id, assignee_user_id, deal_id, property_id, title, description, " +
  "status, priority, due_at, completed_at, created_at, updated_at";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request) {
  try {
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get("status");
    const dealFilter = searchParams.get("dealId");
    const propertyFilter = searchParams.get("propertyId");
    if ((dealFilter && !UUID_RE.test(dealFilter)) || (propertyFilter && !UUID_RE.test(propertyFilter))) {
      return NextResponse.json({ error: "Invalid record id" }, { status: 400 });
    }

    let query = supabaseAdmin
      .from("crm_tasks")
      .select(TASK_COLUMNS)
      // A task assigned to someone else is still their work to do, so both
      // sides see it. The old query only matched owner_user_id, which made
      // delegation invisible to the person it was delegated to.
      .or(`owner_user_id.eq.${userId},assignee_user_id.eq.${userId}`)
      .limit(300);

    if (statusFilter && TASK_STATUSES.includes(statusFilter)) {
      query = query.eq("status", statusFilter);
    }
    if (dealFilter) query = query.eq("deal_id", dealFilter);
    if (propertyFilter) query = query.eq("property_id", propertyFilter);

    const { data: rows, error } = await query;
    if (error) {
      console.error("[CRM TASKS API] GET error:", error);
      return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
    }

    const titles = await loadLinkedTitles(rows || []);
    const tasks = sortTasks((rows || []).map((row) => serializeTask(row, {
      dealTitle: row.deal_id ? titles.deals[row.deal_id] || null : null,
      propertyTitle: row.property_id ? titles.properties[row.property_id] || null : null,
    })));

    return NextResponse.json({ tasks, summary: summarizeTasks(tasks) });
  } catch (err) {
    console.error("[CRM TASKS API] GET error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const parsed = createTaskSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues?.[0]?.message || "Invalid data format" },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    // A deal-linked task must belong to a deal the user is actually party to.
    let linkedDeal = null;
    if (input.dealId) {
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("buyer_id, broker_id, properties(owner_id)")
        .eq("id", input.dealId)
        .single();
      if (dealError || !deal) return NextResponse.json({ error: "Deal not found" }, { status: 404 });
      const isParty =
        deal.buyer_id === userId ||
        deal.broker_id === userId ||
        deal.properties?.owner_id === userId;
      if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      linkedDeal = deal;
    }

    // Same rule for a property-linked task: you may only pin work to a property
    // you own. Without this check the property link would be a way to read back
    // any property's title through the task list.
    if (input.propertyId) {
      const { data: property, error: propError } = await supabaseAdmin
        .from("properties")
        .select("owner_id")
        .eq("id", input.propertyId)
        .single();
      if (propError || !property) return NextResponse.json({ error: "Property not found" }, { status: 404 });
      if (property.owner_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cross-account assignment is allowed only among parties to the linked
    // deal. Without this check, any authenticated user could push arbitrary
    // tasks into any account by guessing its auth UUID.
    const assigneeId = input.assigneeUserId || userId;
    if (assigneeId !== userId) {
      const allowed = linkedDeal && [
        linkedDeal.buyer_id,
        linkedDeal.broker_id,
        linkedDeal.properties?.owner_id,
      ].includes(assigneeId);
      if (!allowed) {
        return NextResponse.json(
          { error: "Tasks can only be assigned to a party on the linked deal" },
          { status: 403 },
        );
      }
    }

    const row = toTaskRow(input);
    const { data: inserted, error } = await supabaseAdmin
      .from("crm_tasks")
      .insert([{
        owner_user_id: userId,
        // Unassigned work belongs to whoever created it.
        assignee_user_id: assigneeId,
        status: "todo",
        priority: "normal",
        ...row,
      }])
      .select(TASK_COLUMNS)
      .single();

    if (error) {
      console.error("[CRM TASKS API] POST error:", error);
      return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }

    // A task pinned to a deal or property is part of that record's story.
    if (inserted.deal_id || inserted.property_id) {
      await logActivity(supabaseAdmin, {
        dealId: inserted.deal_id,
        propertyId: inserted.property_id,
        activityType: "task_created",
        actorId: userId,
        metadata: { taskId: inserted.id, title: inserted.title },
      });
    }

    return NextResponse.json({ success: true, task: serializeTask(inserted) });
  } catch (err) {
    console.error("[CRM TASKS API] POST error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

/**
 * Best-effort display titles so the list reads "Follow up — Paragon Tower"
 * instead of a bare UUID. A missing title is not an error.
 */
async function loadLinkedTitles(rows) {
  const dealIds = [...new Set(rows.map((r) => r.deal_id).filter(Boolean))];
  const propertyIds = [...new Set(rows.map((r) => r.property_id).filter(Boolean))];

  const [deals, properties] = await Promise.all([
    dealIds.length
      ? supabaseAdmin.from("deals").select("id, properties(title)").in("id", dealIds)
      : Promise.resolve({ data: [] }),
    propertyIds.length
      ? supabaseAdmin.from("properties").select("id, title").in("id", propertyIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    deals: Object.fromEntries((deals.data || []).map((d) => [d.id, d.properties?.title || null])),
    properties: Object.fromEntries((properties.data || []).map((p) => [p.id, p.title])),
  };
}
