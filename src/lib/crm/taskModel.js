// CRM task model — statuses, priorities, validation, and ordering.
//
// Ported from Twenty's record model: a task is a first-class record with a
// lifecycle, not a boolean. Previously crm_tasks carried only
// title/due_at/completed_at, so "started but not finished" had nowhere to live
// and TaskRail could not show a pipeline.
//
// Pure and shared: the API route validates with the schemas here, and the UI
// orders and labels with the helpers here.

import { z } from "zod";

export const TASK_STATUSES = Object.freeze(["todo", "in_progress", "done", "cancelled"]);
export const TASK_PRIORITIES = Object.freeze(["low", "normal", "high"]);

/** Statuses that still want the user's attention. */
export const OPEN_TASK_STATUSES = Object.freeze(["todo", "in_progress"]);

export const TASK_STATUS_LABELS = Object.freeze({
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
  cancelled: "Cancelled",
});

export const TASK_PRIORITY_LABELS = Object.freeze({
  low: "Low",
  normal: "Normal",
  high: "High",
});

/** Sort weight — high first, then normal, then low. */
const PRIORITY_RANK = Object.freeze({ high: 0, normal: 1, low: 2 });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "A task needs a title").max(300),
  description: z.string().trim().max(2000).optional().nullable(),
  dueAt: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dealId: z.string().uuid().optional().nullable(),
  propertyId: z.string().uuid().optional().nullable(),
  assigneeUserId: z.string().uuid().optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
    dueAt: z.string().datetime({ offset: true }).optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    assigneeUserId: z.string().uuid().optional().nullable(),
    // `completed` is kept for the old checkbox callers; it is translated into a
    // status below so there is still exactly one source of truth.
    completed: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update" });

/** DB row (snake_case) -> API/UI shape (camelCase). */
export function serializeTask(row, { dealTitle = null, propertyTitle = null } = {}) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    status: row.status || (row.completed_at ? "done" : "todo"),
    priority: row.priority || "normal",
    dueAt: row.due_at,
    completedAt: row.completed_at,
    dealId: row.deal_id,
    dealTitle,
    propertyId: row.property_id,
    propertyTitle,
    assigneeUserId: row.assignee_user_id || row.owner_user_id,
    ownerUserId: row.owner_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Validated camelCase input -> DB columns.
 *
 * `status` and `completed_at` are kept consistent HERE rather than at each call
 * site: marking a task done always stamps a completion time, and reopening one
 * always clears it. A row with status "done" and a null completed_at (or the
 * reverse) is not a state this function can produce.
 *
 * @param {object} input validated by createTaskSchema / updateTaskSchema
 * @param {Date}   [now] injected clock so the stamp is testable
 */
export function toTaskRow(input, now = new Date()) {
  const row = {};

  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.dueAt !== undefined) row.due_at = input.dueAt || null;
  if (input.priority !== undefined) row.priority = input.priority;
  if (input.dealId !== undefined) row.deal_id = input.dealId || null;
  if (input.propertyId !== undefined) row.property_id = input.propertyId || null;
  if (input.assigneeUserId !== undefined) row.assignee_user_id = input.assigneeUserId || null;

  // Translate the legacy boolean first, so an explicit `status` still wins.
  let status = input.status;
  if (status === undefined && input.completed !== undefined) {
    status = input.completed ? "done" : "todo";
  }

  if (status !== undefined) {
    row.status = status;
    row.completed_at = status === "done" ? now.toISOString() : null;
  }

  return row;
}

/** A task is overdue when it is still open and its due time has passed. */
export function isTaskOverdue(task, now = Date.now()) {
  if (!task?.dueAt) return false;
  if (!OPEN_TASK_STATUSES.includes(task.status)) return false;
  const due = new Date(task.dueAt).getTime();
  return Number.isFinite(due) && due < (now instanceof Date ? now.getTime() : now);
}

/**
 * The order a human wants to see: overdue first, then everything still open by
 * due date (undated last), then closed tasks newest-first. Priority breaks ties
 * within each band.
 */
export function sortTasks(tasks, now = Date.now()) {
  const nowMs = now instanceof Date ? now.getTime() : now;

  const band = (task) => {
    if (isTaskOverdue(task, nowMs)) return 0;
    if (OPEN_TASK_STATUSES.includes(task.status)) return 1;
    return 2;
  };

  return [...tasks].sort((a, b) => {
    const bandDiff = band(a) - band(b);
    if (bandDiff !== 0) return bandDiff;

    if (band(a) === 2) {
      // Closed: most recently touched first.
      return dateValue(b.completedAt || b.updatedAt || b.createdAt)
        - dateValue(a.completedAt || a.updatedAt || a.createdAt);
    }

    // Open: soonest due first, undated to the back.
    const aDue = a.dueAt ? dateValue(a.dueAt) : Infinity;
    const bDue = b.dueAt ? dateValue(b.dueAt) : Infinity;
    if (aDue !== bDue) return aDue - bDue;

    const priorityDiff = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
    if (priorityDiff !== 0) return priorityDiff;

    return dateValue(a.createdAt) - dateValue(b.createdAt);
  });
}

function dateValue(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

/** Counts for the TaskRail header, computed once instead of in three places. */
export function summarizeTasks(tasks, now = Date.now()) {
  return {
    total: tasks.length,
    open: tasks.filter((t) => OPEN_TASK_STATUSES.includes(t.status)).length,
    overdue: tasks.filter((t) => isTaskOverdue(t, now)).length,
    done: tasks.filter((t) => t.status === "done").length,
  };
}
