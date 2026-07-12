"use client";

import { useState, useEffect, useCallback } from "react";
import { crmFetch } from "../../../lib/crmClient";
import { CheckCircle2, Circle, Trash2, Plus } from "lucide-react";

// The CRM "don't forget" engine (crm_tasks). Mobile-first: single column,
// large touch targets, add-form collapses to one row. Used by BrokerMode's
// command center and the Master CRM's Tasks tab.
export default function TaskRail({ mockUserId, dealId = null, onSummary }) {
  const [tasks, setTasks] = useState(null); // null = loading
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
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
    const open = tasks.filter((t) => !t.completedAt);
    const overdue = open.filter((t) => t.dueAt && new Date(t.dueAt) < new Date());
    onSummary({ open: open.length, overdue: overdue.length });
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
          dueAt: dueDate ? new Date(`${dueDate}T17:00:00`).toISOString() : null,
          dealId: dealId || null,
        },
      });
      setTasks((prev) => [data.task, ...(prev || [])]);
      setTitle("");
      setDueDate("");
    } catch (err) {
      setError(err.message || "Couldn't save the task.");
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task) => {
    const completed = !task.completedAt;
    // Optimistic; reverted on failure.
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completedAt: completed ? new Date().toISOString() : null } : t)));
    try {
      await crmFetch(`/api/crm/tasks/${task.id}`, { method: "PATCH", mockUserId, body: { completed } });
    } catch (err) {
      console.error("Failed to toggle task", err);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completedAt: task.completedAt } : t)));
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

  const open = (tasks || []).filter((t) => !t.completedAt);
  const done = (tasks || []).filter((t) => t.completedAt);

  return (
    <div className="card-atmosphere rounded-lg p-5 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-surface-variant pb-2">
        <h3 className="font-working-title text-base text-on-surface">Tasks</h3>
        <span className="text-text-secondary font-label-caps text-[10px] tracking-widest uppercase">
          {tasks === null ? "…" : `${open.length} open`}
        </span>
      </div>

      <form onSubmit={addTask} className="flex flex-col gap-3">
        <input
          type="text"
          className="w-full bg-surface-alt border border-surface-variant rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors"
          placeholder={dealId ? "Add a task for this deal…" : "Add a task…"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
        />
        <div className="flex gap-2 w-full">
          <input
            type="date"
            aria-label="Due date"
            className="flex-1 min-w-0 bg-surface-alt border border-surface-variant rounded px-2 py-2.5 text-xs text-text-secondary focus:outline-none focus:border-gold-accent transition-colors"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
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
          const isOverdue = task.dueAt && new Date(task.dueAt) < new Date();
          return (
            <div key={task.id} className={`group flex items-start gap-3 py-2.5 px-2 rounded transition-colors hover:bg-surface-alt/60 ${isOverdue ? "border-l-2 border-error pl-3" : ""}`}>
              <button onClick={() => toggleTask(task)} aria-label="Mark task done" className="mt-0.5 text-text-muted hover:text-gold-accent transition-colors shrink-0">
                <Circle size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-on-surface leading-snug">{task.title}</p>
                <div className="flex flex-wrap gap-x-3 mt-0.5">
                  {task.dueAt && (
                    <span className={`text-[11px] font-data-tabular ${isOverdue ? "text-error font-bold" : "text-text-secondary"}`}>
                      {formatDue(task.dueAt)}
                    </span>
                  )}
                  {task.dealTitle && <span className="text-[11px] text-text-muted truncate">{task.dealTitle}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task)}
                aria-label="Delete task"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-text-muted hover:text-error transition-all shrink-0 p-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {done.length > 0 && (
        <div className="border-t border-surface-variant pt-2">
          <button onClick={() => setShowDone((v) => !v)} className="text-[11px] font-label-caps tracking-widest uppercase text-text-secondary hover:text-on-surface transition-colors">
            {showDone ? "Hide" : "Show"} completed ({done.length})
          </button>
          {showDone && (
            <div className="flex flex-col gap-1 mt-2">
              {done.map((task) => (
                <div key={task.id} className="group flex items-start gap-3 py-2 px-2 rounded opacity-60">
                  <button onClick={() => toggleTask(task)} aria-label="Mark task not done" className="mt-0.5 text-success shrink-0">
                    <CheckCircle2 size={18} />
                  </button>
                  <p className="flex-1 text-sm text-text-secondary line-through leading-snug">{task.title}</p>
                  <button onClick={() => deleteTask(task)} aria-label="Delete task" className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all shrink-0 p-1">
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
