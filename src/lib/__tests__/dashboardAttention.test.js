import { describe, expect, it } from "vitest";
import { computeAttention, ATTENTION_SEVERITIES } from "../dashboardAttention";

const NOW = new Date("2026-08-29T10:00:00.000Z").getTime();
const hoursFromNow = (h) => new Date(NOW + h * 3_600_000).toISOString();
const hoursAgo = (h) => new Date(NOW - h * 3_600_000).toISOString();
const daysAgo = (d) => new Date(NOW - d * 86_400_000).toISOString();

const signalFor = (result, id) => result.signals.find((s) => s.id === id);

describe("A-051 dashboard attention signals", () => {
  it("reports a quiet workspace as clear rather than inventing work", () => {
    const result = computeAttention({ now: NOW });

    expect(result.severity).toBe("clear");
    expect(result.urgentCount).toBe(0);
    expect(result.totalCount).toBe(0);
    expect(result.signals).toHaveLength(3);
    for (const signal of result.signals) {
      expect(signal.severity).toBe("clear");
      expect(signal.count).toBe(0);
      expect(signal.headline).toMatch(/^(Nothing|No)/);
    }
  });

  it("exposes every workspace with a stable id, label and destination", () => {
    const result = computeAttention({ now: NOW });
    expect(result.signals.map((s) => s.id)).toEqual(["inbox", "crm", "calendar"]);
    expect(result.signals.map((s) => s.href)).toEqual([
      "/dashboard/inbox",
      "/dashboard/crm",
      "/dashboard/calendar",
    ]);
    expect(ATTENTION_SEVERITIES).toEqual(["clear", "attention", "urgent"]);
  });

  describe("inbox", () => {
    it("treats a fresh unread reply as attention, not an emergency", () => {
      const result = computeAttention({
        now: NOW,
        deals: [{ id: "d1", status: "accepted", unreadCount: 2, oldestUnreadAt: hoursAgo(2) }],
      });

      const inbox = signalFor(result, "inbox");
      expect(inbox.severity).toBe("attention");
      expect(inbox.count).toBe(2);
      expect(inbox.headline).toBe("2 unread messages");
      expect(result.severity).toBe("attention");
    });

    it("escalates a message that has gone unanswered for a day", () => {
      const result = computeAttention({
        now: NOW,
        deals: [{ id: "d1", status: "accepted", unreadCount: 1, oldestUnreadAt: hoursAgo(30) }],
      });

      const inbox = signalFor(result, "inbox");
      expect(inbox.severity).toBe("urgent");
      expect(inbox.headline).toBe("1 unread message");
      expect(inbox.detail).toMatch(/unanswered/i);
    });

    it("escalates a Connect request that is about to be archived", () => {
      const result = computeAttention({
        now: NOW,
        deals: [{
          id: "d2",
          status: "pending",
          unreadCount: 0,
          archivedAt: null,
          pendingClockResetAt: daysAgo(6),
        }],
      });

      const inbox = signalFor(result, "inbox");
      expect(inbox.severity).toBe("urgent");
      expect(inbox.count).toBe(1);
      expect(inbox.headline).toBe("1 Connect request waiting on you");
      expect(inbox.detail).toMatch(/archive/i);
    });

    it("leaves an already archived request out of the urgent path", () => {
      const result = computeAttention({
        now: NOW,
        deals: [{
          id: "d2",
          status: "pending",
          archivedAt: daysAgo(1),
          pendingClockResetAt: daysAgo(8),
        }],
      });

      expect(signalFor(result, "inbox").severity).toBe("clear");
    });

    it("does not nag the buyer about a request they sent themselves", () => {
      const result = computeAttention({
        now: NOW,
        deals: [{
          id: "d5",
          status: "pending",
          myRole: "buyer",
          archivedAt: null,
          pendingClockResetAt: daysAgo(6),
        }],
      });

      expect(signalFor(result, "inbox").count).toBe(0);
      expect(signalFor(result, "inbox").severity).toBe("clear");
    });

    it("ignores deleted and closed conversations entirely", () => {
      const result = computeAttention({
        now: NOW,
        deals: [
          { id: "d3", status: "deleted", unreadCount: 5, oldestUnreadAt: daysAgo(4) },
          { id: "d4", status: "declined", unreadCount: 3, oldestUnreadAt: daysAgo(4) },
        ],
      });

      expect(signalFor(result, "inbox").count).toBe(0);
      expect(signalFor(result, "inbox").severity).toBe("clear");
    });
  });

  describe("crm", () => {
    it("escalates overdue tasks and counts them honestly", () => {
      const result = computeAttention({
        now: NOW,
        tasks: [
          { id: "t1", status: "todo", dueAt: hoursAgo(5), title: "Call the owner back" },
          { id: "t2", status: "in_progress", dueAt: hoursAgo(50), title: "Send the term sheet" },
          { id: "t3", status: "done", dueAt: hoursAgo(60), title: "Already handled" },
        ],
      });

      const crm = signalFor(result, "crm");
      expect(crm.severity).toBe("urgent");
      expect(crm.count).toBe(2);
      expect(crm.headline).toBe("2 overdue tasks");
      expect(crm.detail).toBe("Send the term sheet");
    });

    it("flags work due in the next day as attention", () => {
      const result = computeAttention({
        now: NOW,
        tasks: [{ id: "t1", status: "todo", dueAt: hoursFromNow(6), title: "Confirm the viewing" }],
      });

      const crm = signalFor(result, "crm");
      expect(crm.severity).toBe("attention");
      expect(crm.count).toBe(1);
      expect(crm.headline).toBe("1 task due in the next 24 hours");
    });

    it("stays clear for open work with no deadline pressure", () => {
      const result = computeAttention({
        now: NOW,
        tasks: [
          { id: "t1", status: "todo", dueAt: null, title: "Someday" },
          { id: "t2", status: "todo", dueAt: hoursFromNow(96), title: "Next week" },
        ],
      });

      expect(signalFor(result, "crm").severity).toBe("clear");
      expect(signalFor(result, "crm").count).toBe(0);
    });
  });

  describe("calendar", () => {
    it("escalates a viewing nobody has confirmed yet", () => {
      const result = computeAttention({
        now: NOW,
        appointments: [{
          id: "a1",
          status: "pending",
          scheduledAt: hoursFromNow(20),
          propertyTitle: "Two Roxas Triangle",
        }],
      });

      const calendar = signalFor(result, "calendar");
      expect(calendar.severity).toBe("urgent");
      expect(calendar.count).toBe(1);
      expect(calendar.headline).toBe("1 viewing still unconfirmed");
      expect(calendar.detail).toContain("Two Roxas Triangle");
    });

    it("surfaces a confirmed viewing in the next day as attention", () => {
      const result = computeAttention({
        now: NOW,
        appointments: [{ id: "a1", status: "confirmed", scheduledAt: hoursFromNow(3) }],
      });

      const calendar = signalFor(result, "calendar");
      expect(calendar.severity).toBe("attention");
      expect(calendar.headline).toBe("1 viewing in the next 24 hours");
    });

    it("does not count cancelled, completed or past viewings", () => {
      const result = computeAttention({
        now: NOW,
        appointments: [
          { id: "a1", status: "cancelled", scheduledAt: hoursFromNow(3) },
          { id: "a2", status: "completed", scheduledAt: hoursFromNow(3) },
          { id: "a3", status: "confirmed", scheduledAt: hoursAgo(3) },
        ],
      });

      expect(signalFor(result, "calendar").count).toBe(0);
      expect(signalFor(result, "calendar").severity).toBe("clear");
    });

    it("counts one viewing once even when it is both soon and unconfirmed", () => {
      const result = computeAttention({
        now: NOW,
        appointments: [{ id: "a1", status: "pending", scheduledAt: hoursFromNow(2) }],
      });

      expect(signalFor(result, "calendar").count).toBe(1);
    });
  });

  it("rolls the workspaces up into one headline severity and total", () => {
    const result = computeAttention({
      now: NOW,
      deals: [{ id: "d1", status: "accepted", unreadCount: 1, oldestUnreadAt: hoursAgo(1) }],
      tasks: [{ id: "t1", status: "todo", dueAt: hoursAgo(1), title: "Overdue" }],
      appointments: [{ id: "a1", status: "confirmed", scheduledAt: hoursFromNow(4) }],
    });

    expect(result.severity).toBe("urgent");
    expect(result.urgentCount).toBe(1);
    expect(result.totalCount).toBe(3);
    expect(result.summary).toBe("1 thing needs you now");
  });

  it("summarises several urgent workspaces in plural", () => {
    const result = computeAttention({
      now: NOW,
      deals: [{ id: "d1", status: "accepted", unreadCount: 1, oldestUnreadAt: daysAgo(2) }],
      tasks: [{ id: "t1", status: "todo", dueAt: hoursAgo(1), title: "Overdue" }],
    });

    expect(result.urgentCount).toBe(2);
    expect(result.summary).toBe("2 things need you now");
  });

  it("survives malformed rows instead of throwing on the dashboard", () => {
    const result = computeAttention({
      now: NOW,
      deals: [null, { id: "d1", unreadCount: "3", oldestUnreadAt: "not-a-date" }],
      tasks: [null, { id: "t1", status: "todo", dueAt: "nonsense" }],
      appointments: [null, { id: "a1", status: "confirmed", scheduledAt: undefined }],
    });

    expect(result.severity).toBe("clear");
    expect(result.totalCount).toBe(0);
  });
});
