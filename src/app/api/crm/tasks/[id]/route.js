import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { z } from "zod";

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

async function loadOwnedTask(taskId, userId) {
  const { data: task, error } = await supabaseAdmin
    .from("crm_tasks")
    .select("id, owner_user_id")
    .eq("id", taskId)
    .single();
  if (error || !task) return { status: 404, error: "Task not found" };
  if (task.owner_user_id !== userId) return { status: 403, error: "Forbidden" };
  return { task };
}

const patchSchema = z.object({
  completed: z.boolean().optional(),
  title: z.string().min(1).max(300).optional(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  mockOwnerId: z.string().optional(),
});

export async function PATCH(request, { params }) {
  try {
    const { id: taskId } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }
    const { completed, title, dueAt, mockOwnerId } = parsed.data;
    const userId = await resolveUserId(request, mockOwnerId);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const owned = await loadOwnedTask(taskId, userId);
    if (owned.error) return NextResponse.json({ error: owned.error }, { status: owned.status });

    const updateData = {};
    if (completed !== undefined) updateData.completed_at = completed ? new Date().toISOString() : null;
    if (title !== undefined) updateData.title = title.trim();
    if (dueAt !== undefined) updateData.due_at = dueAt;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("crm_tasks")
      .update(updateData)
      .eq("id", taskId)
      .select("id, deal_id, title, due_at, completed_at, created_at")
      .single();

    if (error) {
      console.error("[CRM TASKS API] PATCH error:", error);
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: updated.id,
        dealId: updated.deal_id,
        title: updated.title,
        dueAt: updated.due_at,
        completedAt: updated.completed_at,
        createdAt: updated.created_at,
      },
    });
  } catch (err) {
    console.error("[CRM TASKS API] PATCH error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = await resolveUserId(request, searchParams.get("mockOwnerId"));
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!supabaseAdmin) return NextResponse.json({ error: "Server error: missing service role configuration" }, { status: 500 });

    const owned = await loadOwnedTask(taskId, userId);
    if (owned.error) return NextResponse.json({ error: owned.error }, { status: owned.status });

    const { error } = await supabaseAdmin.from("crm_tasks").delete().eq("id", taskId);
    if (error) {
      console.error("[CRM TASKS API] DELETE error:", error);
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CRM TASKS API] DELETE error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
