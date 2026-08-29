import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveUserId } from "@/lib/serverAuth";
import { sanitizeError } from "@/lib/sanitizeError";
import { logActivity } from "@/lib/crmActivity";
import { serializeTask, toTaskRow, updateTaskSchema } from "@/lib/crm/taskModel";

export const dynamic = "force-dynamic";

const TASK_COLUMNS =
  "id, owner_user_id, assignee_user_id, deal_id, property_id, title, description, " +
  "status, priority, due_at, completed_at, created_at, updated_at";

/**
 * Who may touch a task.
 *
 * The owner may do anything. The assignee may work the task — that is the point
 * of assigning it — but may not reassign or delete it, which stays with the
 * owner.
 */
async function loadTaskAccess(taskId, userId) {
  const { data: task, error } = await supabaseAdmin
    .from("crm_tasks")
    .select("id, owner_user_id, assignee_user_id, deal_id, property_id, status, title")
    .eq("id", taskId)
    .single();

  if (error || !task) return { status: 404, error: "Task not found" };

  const isOwner = task.owner_user_id === userId;
  const isAssignee = task.assignee_user_id === userId;
  if (!isOwner && !isAssignee) return { status: 403, error: "Forbidden" };

  return { task, isOwner, isAssignee };
}

export async function PATCH(request, { params }) {
  try {
    const { id: taskId } = await params;
    const parsed = updateTaskSchema.safeParse(await request.json());
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

    const access = await loadTaskAccess(taskId, userId);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    if (input.assigneeUserId !== undefined && !access.isOwner) {
      return NextResponse.json({ error: "Only the task's owner can reassign it" }, { status: 403 });
    }
    if (
      input.assigneeUserId &&
      input.assigneeUserId !== userId
    ) {
      if (!access.task.deal_id) {
        return NextResponse.json(
          { error: "Tasks can only be assigned to a party on the linked deal" },
          { status: 403 },
        );
      }
      const { data: deal, error: dealError } = await supabaseAdmin
        .from("deals")
        .select("buyer_id, broker_id, properties(owner_id)")
        .eq("id", access.task.deal_id)
        .single();
      const allowed = !dealError && deal && [
        deal.buyer_id,
        deal.broker_id,
        deal.properties?.owner_id,
      ].includes(input.assigneeUserId);
      if (!allowed) {
        return NextResponse.json(
          { error: "Tasks can only be assigned to a party on the linked deal" },
          { status: 403 },
        );
      }
    }

    // toTaskRow keeps status and completed_at consistent — marking a task done
    // always stamps a completion time and reopening one always clears it, so
    // the database CHECK constraint can never be violated from here.
    const updateData = toTaskRow(input);
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("crm_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select(TASK_COLUMNS)
      .single();

    if (error) {
      console.error("[CRM TASKS API] PATCH error:", error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    // Completion is worth a timeline entry; every other edit is not.
    const justCompleted = updated.status === "done" && access.task.status !== "done";
    if (justCompleted && (updated.deal_id || updated.property_id)) {
      await logActivity(supabaseAdmin, {
        dealId: updated.deal_id,
        propertyId: updated.property_id,
        activityType: "task_completed",
        actorId: userId,
        metadata: { taskId: updated.id, title: updated.title },
      });
    }

    return NextResponse.json({ success: true, task: serializeTask(updated) });
  } catch (err) {
    console.error("[CRM TASKS API] PATCH error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: taskId } = await params;
    const userId = await resolveUserId(request);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });
    }

    const access = await loadTaskAccess(taskId, userId);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });
    if (!access.isOwner) {
      return NextResponse.json({ error: "Only the task's owner can delete it" }, { status: 403 });
    }

    const { error } = await supabaseAdmin.from("crm_tasks").delete().eq("id", taskId);
    if (error) {
      console.error("[CRM TASKS API] DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CRM TASKS API] DELETE error:", err);
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
