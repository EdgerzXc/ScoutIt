// One answer to "is anything on fire?" for the home dashboard.
//
// The bell (user_notifications) records events that already happened. It
// cannot answer the question an owner actually opens the dashboard with,
// because the things that hurt are states, not events: a task whose due date
// passed, a Connect request two days from being archived, a viewing tomorrow
// morning that nobody confirmed. None of those fire a notification when they
// become urgent — they simply age into it.
//
// So this module reads the CRM, Inbox and Calendar state and decides, on one
// shared set of rules, what deserves the user's attention right now. It is
// pure: the API route fetches, this decides, the UI renders. That split is why
// the thresholds below can be tested against a fixed clock instead of being
// re-argued in three components.

import { isTaskOverdue, OPEN_TASK_STATUSES } from "./crm/taskModel";
import { bucketOfDeal, isDeletedDeal } from "./deals/dealStatus";
import { daysUntilArchive } from "./pendingRequestLifecycle";

/** Ordered weakest to strongest so a comparison is just an index lookup. */
export const ATTENTION_SEVERITIES = Object.freeze(["clear", "attention", "urgent"]);

const HOUR_MS = 3_600_000;

// A message unanswered for a day has stopped being "new" and started being a
// reputation problem. Below that it is ordinary inbox traffic.
const UNREAD_URGENT_HOURS = 24;

// The window a person can actually act inside. Anything further out is a plan,
// not a demand, and putting it on the dashboard trains people to ignore it.
const SOON_HOURS = 24;

// A viewing is confirmable up to the moment it starts, but two days out is the
// last point where the other party still has time to answer.
const UNCONFIRMED_VIEWING_HOURS = 48;

// §40.15: a pending request archives after 7 days. Two days of runway is the
// last useful moment to say so.
const ARCHIVE_WARNING_DAYS = 2;

const WORKSPACES = Object.freeze([
  { id: "inbox", label: "Inbox", href: "/dashboard/inbox" },
  { id: "crm", label: "CRM", href: "/dashboard/crm" },
  { id: "calendar", label: "Calendar", href: "/dashboard/calendar" },
]);

/** Viewing states that still involve the user. */
const LIVE_APPOINTMENT_STATUSES = ["pending", "confirmed"];

const strongest = (a, b) =>
  ATTENTION_SEVERITIES.indexOf(a) >= ATTENTION_SEVERITIES.indexOf(b) ? a : b;

const rows = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

/** Milliseconds, or null when the value is missing or not a real date. */
function timeOf(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Whole non-negative count, or 0. Guards string columns and nulls alike. */
function countOf(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/**
 * Whether a still-waiting request is waiting on *this* user rather than on the
 * person they sent it to.
 *
 * The buyer who spent Connects is never the one being waited on. Every other
 * party might be — including a routed recipient, whose role the deals API
 * reports as "broker". When the role is missing we count it: quietly hiding a
 * paid lead that is days from being archived is the more expensive mistake.
 */
function isWaitingOnMe(deal) {
  if (bucketOfDeal(deal) !== "waiting") return false;
  const role = deal?.myRole;
  if (!role) return true;
  if (deal?.status === "invited") return role !== "owner";
  return role !== "buyer";
}

function inboxSignal(deals, now) {
  const live = deals.filter((deal) => {
    if (isDeletedDeal(deal)) return false;
    const bucket = bucketOfDeal(deal);
    return bucket === "active" || bucket === "waiting";
  });

  let unread = 0;
  let oldestUnreadAt = null;
  for (const deal of live) {
    const count = countOf(deal.unreadCount);
    if (count === 0) continue;
    unread += count;
    const at = timeOf(deal.oldestUnreadAt ?? deal.lastActivityAt);
    if (at !== null && (oldestUnreadAt === null || at < oldestUnreadAt)) oldestUnreadAt = at;
  }

  const waiting = live.filter(isWaitingOnMe);
  const archiveDeadlines = waiting
    .map((deal) => daysUntilArchive(
      deal.pendingClockResetAt ?? deal.pending_clock_reset_at,
      deal.archivedAt ?? deal.archived_at,
      new Date(now),
    ))
    .filter((days) => days !== null);
  const soonestArchive = archiveDeadlines.length ? Math.min(...archiveDeadlines) : null;

  const unreadHours = oldestUnreadAt === null ? 0 : (now - oldestUnreadAt) / HOUR_MS;
  const staleUnread = unread > 0 && unreadHours >= UNREAD_URGENT_HOURS;
  const archivingSoon = soonestArchive !== null && soonestArchive <= ARCHIVE_WARNING_DAYS;

  const count = unread + waiting.length;
  let severity = "clear";
  if (staleUnread || archivingSoon) severity = "urgent";
  else if (count > 0) severity = "attention";

  let headline = "No unread messages";
  if (unread > 0) {
    headline = plural(unread, "unread message", "unread messages");
  } else if (waiting.length > 0) {
    headline = `${plural(waiting.length, "Connect request", "Connect requests")} waiting on you`;
  }

  // Composed, not overwritten. The count on the card is unread + waiting, so a
  // detail line that mentions only one of them makes the number look wrong.
  const details = [];
  if (staleUnread) details.push(`Oldest unanswered for ${describeAge(unreadHours)}`);
  if (unread > 0 && waiting.length > 0) {
    details.push(`${plural(waiting.length, "Connect request", "Connect requests")} also waiting`);
  }
  if (archivingSoon) {
    details.push(soonestArchive === 0
      ? "Archives today unless you answer"
      : `Archives in ${plural(soonestArchive, "day", "days")} unless you answer`);
  }
  const detail = details.length > 0 ? details.join(" · ") : null;

  return { severity, count, headline, detail };
}

/** "3 hours" / "1 day" / "4 days" — never a fabricated precision. */
function describeAge(hours) {
  if (hours < 48) {
    const whole = Math.max(1, Math.floor(hours / 24)) ;
    return hours < 24 ? plural(Math.max(1, Math.floor(hours)), "hour", "hours") : plural(whole, "day", "days");
  }
  return plural(Math.floor(hours / 24), "day", "days");
}

function crmSignal(tasks, now) {
  const open = tasks.filter((task) => OPEN_TASK_STATUSES.includes(task?.status));

  const overdue = open
    .filter((task) => isTaskOverdue(task, now))
    .sort((a, b) => (timeOf(a.dueAt) ?? 0) - (timeOf(b.dueAt) ?? 0));

  const dueSoon = open.filter((task) => {
    const due = timeOf(task.dueAt);
    return due !== null && due >= now && due <= now + SOON_HOURS * HOUR_MS;
  });

  const count = overdue.length + dueSoon.length;
  let severity = "clear";
  if (overdue.length > 0) severity = "urgent";
  else if (dueSoon.length > 0) severity = "attention";

  let headline = "Nothing overdue";
  let detail = null;
  if (overdue.length > 0) {
    headline = plural(overdue.length, "overdue task", "overdue tasks");
    detail = overdue[0]?.title || null;
    if (dueSoon.length > 0) {
      detail = `${detail ? `${detail} · ` : ""}${dueSoon.length} more due in the next 24 hours`;
    }
  } else if (dueSoon.length > 0) {
    headline = `${plural(dueSoon.length, "task", "tasks")} due in the next 24 hours`;
    detail = dueSoon[0]?.title || null;
  }

  return { severity, count, headline, detail };
}

function calendarSignal(appointments, now) {
  const live = appointments.filter((appointment) => {
    if (!LIVE_APPOINTMENT_STATUSES.includes(appointment?.status)) return false;
    const at = timeOf(appointment.scheduledAt ?? appointment.scheduled_at);
    return at !== null && at >= now;
  });

  const withinHours = (appointment, hours) => {
    const at = timeOf(appointment.scheduledAt ?? appointment.scheduled_at);
    return at !== null && at <= now + hours * HOUR_MS;
  };

  const soon = live.filter((appointment) => withinHours(appointment, SOON_HOURS));
  const unconfirmed = live.filter(
    (appointment) => appointment.status === "pending" && withinHours(appointment, UNCONFIRMED_VIEWING_HOURS),
  );

  // One viewing that is both imminent and unconfirmed is still one viewing.
  const involved = new Set([...soon, ...unconfirmed].map((appointment) => appointment.id));

  let severity = "clear";
  if (unconfirmed.length > 0) severity = "urgent";
  else if (soon.length > 0) severity = "attention";

  let headline = "No viewings in the next 24 hours";
  let detail = null;
  if (unconfirmed.length > 0) {
    headline = `${plural(unconfirmed.length, "viewing", "viewings")} still unconfirmed`;
    detail = describeViewing(unconfirmed[0]);
  } else if (soon.length > 0) {
    headline = `${plural(soon.length, "viewing", "viewings")} in the next 24 hours`;
    detail = describeViewing(soon[0]);
  }

  return { severity, count: involved.size, headline, detail };
}

function describeViewing(appointment) {
  const title = appointment?.propertyTitle || appointment?.property_title;
  return title ? `Next: ${title}` : null;
}

/**
 * Reads the three workspaces and returns what needs the user now.
 *
 * @param {object}   input
 * @param {Array}    [input.deals]        /api/deals shape
 * @param {Array}    [input.tasks]        serializeTask() shape
 * @param {Array}    [input.appointments] /api/viewing-appointments shape
 * @param {number}   [input.now]          injected clock, so thresholds are testable
 */
export function computeAttention({ deals, tasks, appointments, now = Date.now() } = {}) {
  const at = now instanceof Date ? now.getTime() : now;

  const computed = {
    inbox: inboxSignal(rows(deals), at),
    crm: crmSignal(rows(tasks), at),
    calendar: calendarSignal(rows(appointments), at),
  };

  const signals = WORKSPACES.map((workspace) => ({ ...workspace, ...computed[workspace.id] }));

  const severity = signals.reduce((worst, signal) => strongest(worst, signal.severity), "clear");
  const urgentCount = signals.filter((signal) => signal.severity === "urgent").length;
  const attentionCount = signals.filter((signal) => signal.severity === "attention").length;
  const totalCount = signals.reduce((sum, signal) => sum + signal.count, 0);

  let summary = "Nothing needs you right now";
  if (urgentCount > 0) summary = `${plural(urgentCount, "thing needs", "things need")} you now`;
  else if (attentionCount > 0) summary = `${plural(totalCount, "item", "items")} waiting, nothing urgent`;

  return { severity, urgentCount, attentionCount, totalCount, summary, signals };
}
