"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { crmFetch } from "../../../lib/crmClient";
import { CheckCircle2, Circle, CircleDashed, Trash2, Plus } from "lucide-react";
import { sanitizeError } from "@/lib/sanitizeError";
import {
  isTaskOverdue,
  OPEN_TASK_STATUSES,
  sortTasks,
  summarizeTasks,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
} from "@/lib/crm/taskModel";

// The CRM "don't forget" engine (crm_tasks). Mobile-first: single column,
// large touch targets, add-form collapses to one row. Used by BrokerMode's
// command center and the Master CRM's Tasks tab.
//
// A task has a LIFECYCLE now, not a checkbox: to do -> in progress -> done,
// plus cancelled. The circle cycles through those three; "cancelled" is
// reachable only by deleting or via the API, because a rail is not the place
// to bury a fourth state behind a click.
//
// Ordering, overdue, and the summary counts all come from lib/crm/taskModel.js,
// which the API uses too — so "overdue" cannot mean one thing here and another
// thing on the server.

/** What the circle button does next, and how it reads to a screen reader. */
const NEXT_STATUS = { todo: "in_progress", in_progress: "done", done: "todo" };
const NEXT_STATUS_LABEL = {
  todo: "Start this task",
  in_progress: "Mark this task done",
  done: "Reopen this task",
};

const PRIORITY_STYLES = {
  high: "text-error border-error/40",
  normal: "text-text-secondary border-surface-variant",
  low: "text-text-muted border-surface-variant",
};

export default function TaskRail({ mockUserId, dealId = null, onSummary }) {
  const [tasks, setTasks] = useState(null); // null = loading
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(async () => {
    if (!mockUserId && process.env.NODE_ENV === "development") return;
    try {
      const data = await crmFetch("/api/crm/tasks", { mockUserId });
      setTasks(data.tasks || []);
    } catch (e) {
      console.error("Failed to load tasks", e);
      setTasks([]);
      setError("Couldn't load your tasks.");
    }
  }, [mockUserId]);

  useEffect(() => { load(); }, [load]);

  // Let the parent (Scout Insight) know the open/overdue counts without
  // fetching the list twice.
  useEffect(() => {
    if (!tasks || !onSummary) return;
    const { open, overdue } = summarizeTasks(tasks);
    onSummary({ open, overdue });
  }, [tasks, onSummary]);

  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const data = await crmFetch("/api/crm/tasks", {
        method: "POST",
        mockUserId,
        body: {
          title: title.trim(),
          // 17:00 local on the chosen day. Explicit rather than midnight, so a
          // task due "today" is not already overdue the moment it is created.
          dueAt: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : null,
          priority,
          dealId: dealId || null,
        },
      });
      setTasks((prev) => [data.task, ...(prev || [])]);
      setTitle("");
      setDueDate("");
      setPriority("normal");
    } catch (err) {
      setError(sanitizeError(err, "Couldn't save the task."));
    } finally {
      setBusy(false);
    }
  };

  const advanceTask = async (task) => {
    const nextStatus = NEXT_STATUS[task.status] || "done";
    const previous = tasks;
    // Optimistic; reverted on failure.
    setTasks((prev) => prev.map((t) => (
      t.id === task.id
        ? { ...t, status: nextStatus, completedAt: nextStatus === "done" ? new Date().toISOString() : null }
        : t
    )));
    try {
      const data = await crmFetch(`/api/crm/tasks/${task.id}`, {
        method: "PATCH", mockUserId, body: { status: nextStatus },
      });
      // Take the server's row back: it owns completed_at.
      setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
    } catch (err) {
      console.error("Failed to update task", err);
      setTasks(previous);
      setError("Couldn't update the task.");
    }
  };

  const deleteTask = async (task) => {
    const prevTasks = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await crmFetch(`/api/crm/tasks/${task.id}`, { method: "DELETE", mockUserId });
    } catch (err) {
      console.error("Failed to delete task", err);
      setTasks(prevTasks);
      setError("Couldn't delete the task.");
    }
  };

  const formatDue = (iso) => {
    const due = new Date(iso);
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const dayDiff = Math.round((startOfDue - startOfToday) / 86400000);
    if (dayDiff < 0) return `Overdue — ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
    if (dayDiff === 0) return "Due today";
    if (dayDiff === 1) return "Due tomorrow";
    return `Due ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  };

  // A cancelled task is neither open nor done — it belongs in the closed
  // drawer, not on the active list. The old completedAt split had nowhere to
  // put it and would have shown it as outstanding work forever.
  const { open, closed } = useMemo(() => {
    const all = sortTasks(tasks || []);
    return {
      open: all.filter((t) => OPEN_TASK_STATUSES.includes(t.status)),
      closed: all.filter((t) => !OPEN_TASK_STATUSES.includes(t.status)),
    };
  }, [tasks]);

  return (
    <div className="card-atmosphere rounded-lg p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-surface-variant pb-2">
        <h3 className="font-working-title text-base text-on-surface">Tasks</h3>
        <span className="text-text-secondary font-label-caps text-[12px] tracking-widest uppercase">
          {tasks === null ? "…" : `${open.length} open`}
        </span>
      </div>

      <form onSubmit={addTask} className="flex flex-col gap-3">
        <input
          type="text"
          className="w-full bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition"
          placeholder={dealId ? "Add a task for this deal…" : "Add a task…"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
        />
        <div className="flex gap-2 w-full">
          <input
            type="date"
            aria-label="Due date"
            className="flex-1 min-w-0 bg-surface-alt border border-surface-variant rounded px-2 py-2.5 text-xs text-text-secondary focus:outline-none focus:border-gold-accent transition"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <select
            aria-label="Priority"
            className="shrink-0 bg-surface-alt border border-surface-variant rounded px-2 py-2.5 text-xs text-text-secondary focus:outline-none focus:border-gold-accent transition"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!title.trim() || busy}
            aria-label="Add task"
            className="shrink-0 bg-gold-accent text-background font-working-title font-bold px-4 py-2.5 rounded hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1 text-sm"
          >
            <Plus size={16} /> Add
          </button>
        </div>
      </form>

      {error && <p className="text-error text-xs">{error}</p>}

      <div className="flex flex-col gap-1">
        {tasks === null && <p className="text-text-muted text-sm py-4 text-center animate-pulse">Loading tasks…</p>}
        {tasks !== null && open.length === 0 && (
          <p className="text-text-secondary text-sm py-4 text-center">Nothing on your list. Add a follow-up above.</p>
        )}
        {open.map((task) => {
          const overdue = isTaskOverdue(task);
          const inProgress = task.status === "in_progress";
          return (
            <div
              key={task.id}
              className={`group flex items-start gap-3 py-2.5 px-2 rounded transition hover:bg-surface-alt/60 ${overdue ? "border-l-2 border-error pl-3" : ""}`}
            >
              <button
                onClick={() => advanceTask(task)}
                aria-label={NEXT_STATUS_LABEL[task.status] || "Advance this task"}
                className={`mt-0.5 transition shrink-0 ${inProgress ? "text-gold-accent" : "text-text-muted hover:text-gold-accent"}`}
              >
                {inProgress ? <CircleDashed size={18} /> : <Circle size={18} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface leading-snug">{task.title}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                  {inProgress && (
                    <span className="text-[12px] font-label-caps tracking-widest uppercase text-gold-accent">
                      In progress
                    </span>
                  )}
                  {task.dueAt && (
                    <span className={`text-[12px] font-data-tabular ${overdue ? "text-error font-bold" : "text-text-secondary"}`}>
                      {formatDue(task.dueAt)}
                    </span>
                  )}
                  {task.priority && task.priority !== "normal" && (
                    <span className={`text-[12px] px-1.5 py-px rounded border font-label-caps tracking-widest uppercase ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.normal}`}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                  )}
                  {(task.dealTitle || task.propertyTitle) && (
                    <span className="text-[12px] text-text-muted truncate">
                      {task.dealTitle || task.propertyTitle}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task)}
                aria-label="Delete task"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-muted hover:text-error transition shrink-0 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {closed.length > 0 && (
        <div className="border-t border-surface-variant pt-2">
          <button
            onClick={() => setShowDone((v) => !v)}
            className="text-[12px] font-label-caps tracking-widest uppercase text-text-secondary hover:text-on-surface transition"
          >
            {showDone ? "Hide" : "Show"} completed ({closed.length})
          </button>
          {showDone && (
            <div className="flex flex-col gap-1 mt-2">
              {closed.map((task) => (
                <div key={task.id} className="group flex items-start gap-3 py-2 px-2 rounded opacity-60">
                  <button
                    onClick={() => advanceTask(task)}
                    aria-label={NEXT_STATUS_LABEL[task.status] || "Reopen this task"}
                    className="mt-0.5 text-success shrink-0"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-secondary line-through leading-snug">{task.title}</p>
                    {task.status === "cancelled" && (
                      <span className="text-[12px] font-label-caps tracking-widest uppercase text-text-muted">
                        Cancelled
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => deleteTask(task)}
                    aria-label="Delete task"
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition shrink-0 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
