import { describe, it, expect } from "vitest";
import {
  ACTIVITY_TYPE_KEYS,
  describeActivity,
  isKnownActivityType,
} from "./activityRegistry";
import {
  createTaskSchema,
  isTaskOverdue,
  serializeTask,
  sortTasks,
  summarizeTasks,
  toTaskRow,
  updateTaskSchema,
} from "./taskModel";

const NOW = new Date("2026-09-01T00:00:00.000Z");

describe("activityRegistry", () => {
  it("covers every type the application actually writes", () => {
    // Grepped from the logActivity call sites. If a route starts writing a new
    // type, it belongs in the registry too — that is what this test enforces.
    const written = [
      "inquiry", "deal_created", "status_change", "note_added",
      "viewing_scheduled", "delegation_accepted", "delegation_declined",
    ];
    for (const type of written) expect(ACTIVITY_TYPE_KEYS).toContain(type);
  });

  it("uses icon names rather than emoji", () => {
    for (const key of ACTIVITY_TYPE_KEYS) {
      const { icon } = describeActivity({ activityType: key, metadata: {} });
      expect(icon).toMatch(/^[A-Z][A-Za-z0-9]*$/);
    }
  });

  it("describes a status change from its metadata", () => {
    expect(describeActivity({
      activityType: "status_change",
      metadata: { from: "pending", to: "accepted" },
    }).detail).toBe("pending → accepted");
  });

  it("describes a scheduled viewing with a start and an end", () => {
    const detail = describeActivity({
      activityType: "viewing_scheduled",
      metadata: { scheduledAt: "2026-09-01T01:00:00Z", endsAt: "2026-09-01T02:00:00Z" },
    }).detail;
    expect(detail).toMatch(/^For .+ – .+$/);
  });

  it("degrades an unknown type visibly instead of dropping it", () => {
    const result = describeActivity({ activityType: "brand_new_thing", metadata: {} });
    expect(result.known).toBe(false);
    expect(result.label).toBe("brand new thing");
    expect(isKnownActivityType("brand_new_thing")).toBe(false);
  });

  it("survives malformed metadata without throwing", () => {
    expect(describeActivity({ activityType: "status_change", metadata: null }).detail).toBeNull();
    expect(describeActivity({ activityType: "viewing_scheduled", metadata: { scheduledAt: "nope" } }).detail)
      .toBeNull();
  });

  it("truncates a long inquiry message", () => {
    const detail = describeActivity({
      activityType: "inquiry",
      metadata: { source: "public_form", name: "Ana", message: "x".repeat(400) },
    }).detail;
    expect(detail.length).toBeLessThan(200);
    expect(detail).toContain("Ana");
  });
});

describe("task validation", () => {
  it("accepts a minimal task", () => {
    expect(createTaskSchema.safeParse({ title: "Call the owner" }).success).toBe(true);
  });

  it("rejects an empty title and an unknown status", () => {
    expect(createTaskSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "x", status: "almost" }).success).toBe(false);
  });

  it("rejects an empty update", () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(false);
  });

  it("requires an explicit assignee to be a real auth UUID", () => {
    expect(createTaskSchema.safeParse({
      title: "Call",
      assigneeUserId: "someone-else",
    }).success).toBe(false);
    expect(updateTaskSchema.safeParse({
      assigneeUserId: "11111111-1111-4111-8111-111111111111",
    }).success).toBe(true);
  });
});

describe("toTaskRow", () => {
  it("stamps completed_at when a task is marked done", () => {
    expect(toTaskRow({ status: "done" }, NOW)).toEqual({
      status: "done",
      completed_at: NOW.toISOString(),
    });
  });

  it("clears completed_at when a task is reopened", () => {
    expect(toTaskRow({ status: "in_progress" }, NOW)).toEqual({
      status: "in_progress",
      completed_at: null,
    });
  });

  it("translates the legacy completed boolean into a status", () => {
    expect(toTaskRow({ completed: true }, NOW).status).toBe("done");
    expect(toTaskRow({ completed: false }, NOW).status).toBe("todo");
  });

  it("lets an explicit status win over the legacy boolean", () => {
    expect(toTaskRow({ completed: true, status: "cancelled" }, NOW)).toEqual({
      status: "cancelled",
      completed_at: null,
    });
  });

  it("omits fields that were not supplied", () => {
    expect(toTaskRow({ title: "Only this" }, NOW)).toEqual({ title: "Only this" });
  });
});

describe("serializeTask", () => {
  it("infers a status for a legacy row that predates the column", () => {
    expect(serializeTask({ id: "1", title: "t", completed_at: "2026-08-01T00:00:00Z" }).status)
      .toBe("done");
    expect(serializeTask({ id: "1", title: "t", completed_at: null }).status).toBe("todo");
  });

  it("falls back to the owner when no assignee is set", () => {
    expect(serializeTask({ id: "1", title: "t", owner_user_id: "u1" }).assigneeUserId).toBe("u1");
  });
});

describe("task ordering", () => {
  const task = (over) => ({
    id: over.id, title: over.id, status: "todo", priority: "normal",
    dueAt: null, completedAt: null, createdAt: "2026-08-01T00:00:00Z", ...over,
  });

  it("flags an open task past its due time as overdue", () => {
    expect(isTaskOverdue(task({ id: "a", dueAt: "2026-08-30T00:00:00Z" }), NOW)).toBe(true);
    expect(isTaskOverdue(task({ id: "b", dueAt: "2026-09-30T00:00:00Z" }), NOW)).toBe(false);
  });

  it("does not call a completed task overdue", () => {
    expect(isTaskOverdue(
      task({ id: "c", dueAt: "2026-08-30T00:00:00Z", status: "done" }), NOW,
    )).toBe(false);
  });

  it("orders overdue, then soonest due, then undated, then closed", () => {
    const ordered = sortTasks([
      task({ id: "done", status: "done", completedAt: "2026-08-31T00:00:00Z" }),
      task({ id: "undated" }),
      task({ id: "later", dueAt: "2026-09-10T00:00:00Z" }),
      task({ id: "overdue", dueAt: "2026-08-20T00:00:00Z" }),
      task({ id: "soon", dueAt: "2026-09-02T00:00:00Z" }),
    ], NOW);
    expect(ordered.map((t) => t.id)).toEqual(["overdue", "soon", "later", "undated", "done"]);
  });

  it("breaks a due-date tie by priority", () => {
    const ordered = sortTasks([
      task({ id: "low", priority: "low" }),
      task({ id: "high", priority: "high" }),
      task({ id: "normal", priority: "normal" }),
    ], NOW);
    expect(ordered.map((t) => t.id)).toEqual(["high", "normal", "low"]);
  });

  it("does not mutate the array it was given", () => {
    const input = [task({ id: "b", dueAt: "2026-09-10T00:00:00Z" }), task({ id: "a", dueAt: "2026-09-01T00:00:00Z" })];
    sortTasks(input, NOW);
    expect(input.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("summarises the counts the rail header shows", () => {
    expect(summarizeTasks([
      task({ id: "1", dueAt: "2026-08-20T00:00:00Z" }),
      task({ id: "2", status: "in_progress" }),
      task({ id: "3", status: "done" }),
      task({ id: "4", status: "cancelled" }),
    ], NOW)).toEqual({ total: 4, open: 2, overdue: 1, done: 1 });
  });
});
