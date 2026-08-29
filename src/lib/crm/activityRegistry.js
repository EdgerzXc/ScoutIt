// The CRM timeline's type registry — one definition per activity kind.
//
// Ported from Twenty's timeline model: an activity is a TYPED record, not a
// free-form blob that each screen re-interprets. Before this, crm_activity_log
// rows carried untyped `metadata` jsonb and every consumer invented its own
// label map and its own metadata reader, so a new activity type shipped by one
// route rendered as a raw snake_case string somewhere else.
//
// Pure and dependency-free on purpose: the API routes import it to validate
// what they are about to write, and the React components import it to render
// what they read. One list, two consumers, no drift.
//
// Icons are lucide-react component NAMES, not emoji. RULES Part B rules out
// emoji as production iconography — they render differently on every platform
// and cannot be styled, sized, or given an accessible name reliably.

/**
 * `tone` maps to the existing semantic colours (gold accent / success / error /
 * neutral) so the timeline reads at a glance without inventing a new palette.
 */
export const ACTIVITY_TYPES = Object.freeze({
  inquiry: {
    label: "New inquiry",
    icon: "MessageSquare",
    tone: "accent",
    describe: (meta) => {
      if (meta.source !== "public_form") return null;
      const who = meta.name || meta.email || "A visitor";
      if (meta.message) return `${who}: "${truncate(meta.message, 120)}"`;
      return `${who} reached out via the property page`;
    },
  },
  operator_request: {
    label: "Operator request",
    icon: "Building2",
    tone: "neutral",
    describe: () => null,
  },
  deal_created: {
    label: "Deal created",
    icon: "FolderPlus",
    tone: "accent",
    describe: () => null,
  },
  status_change: {
    label: "Status changed",
    icon: "RefreshCw",
    tone: "neutral",
    describe: (meta) => (meta.from && meta.to ? `${meta.from} → ${meta.to}` : null),
  },
  note_added: {
    label: "Notes updated",
    icon: "PenLine",
    tone: "neutral",
    describe: () => null,
  },
  task_created: {
    label: "Task added",
    icon: "CirclePlus",
    tone: "neutral",
    describe: (meta) => (meta.title ? truncate(meta.title, 120) : null),
  },
  task_completed: {
    label: "Task completed",
    icon: "CircleCheck",
    tone: "success",
    describe: (meta) => (meta.title ? truncate(meta.title, 120) : null),
  },
  viewing_scheduled: {
    label: "Viewing scheduled",
    icon: "CalendarPlus",
    tone: "accent",
    describe: (meta) => formatWhen(meta.scheduledAt, meta.endsAt),
  },
  viewing_rescheduled: {
    label: "Viewing moved",
    icon: "CalendarClock",
    tone: "neutral",
    describe: (meta) => formatWhen(meta.scheduledAt, meta.endsAt),
  },
  viewing_confirmed: {
    label: "Viewing confirmed",
    icon: "CalendarCheck",
    tone: "success",
    describe: (meta) => formatWhen(meta.scheduledAt, meta.endsAt),
  },
  viewing_cancelled: {
    label: "Viewing cancelled",
    icon: "CalendarX",
    tone: "error",
    describe: (meta) => (meta.reason ? truncate(meta.reason, 120) : null),
  },
  viewing_completed: {
    label: "Viewing completed",
    icon: "Flag",
    tone: "success",
    describe: () => null,
  },
  delegation_accepted: {
    label: "Units delegated",
    icon: "Handshake",
    tone: "success",
    describe: (meta) => (meta.unitCount
      ? `${meta.unitCount} unit${meta.unitCount === 1 ? "" : "s"} handed to the operator`
      : null),
  },
  delegation_declined: {
    label: "Delegation declined",
    icon: "Ban",
    tone: "error",
    describe: () => null,
  },
});

/** Every registered key — the allowlist a writer is checked against. */
export const ACTIVITY_TYPE_KEYS = Object.freeze(Object.keys(ACTIVITY_TYPES));

export function isKnownActivityType(type) {
  return Object.prototype.hasOwnProperty.call(ACTIVITY_TYPES, type);
}

/**
 * Render-ready description of one timeline row.
 *
 * An unregistered type degrades VISIBLY rather than vanishing — the same rule
 * KanbanBoard follows for unknown deal statuses. A silently dropped row is how
 * a broken writer stays undiscovered.
 *
 * @param {{activityType:string, metadata?:object}} item
 * @returns {{label:string, icon:string, tone:string, detail:string|null, known:boolean}}
 */
export function describeActivity(item) {
  const definition = ACTIVITY_TYPES[item?.activityType];
  if (!definition) {
    return {
      label: String(item?.activityType || "Activity").replace(/_/g, " "),
      icon: "Dot",
      tone: "neutral",
      detail: null,
      known: false,
    };
  }

  let detail = null;
  try {
    detail = definition.describe(item.metadata || {}) || null;
  } catch {
    // A malformed metadata blob must never break the whole timeline render.
    detail = null;
  }

  return { label: definition.label, icon: definition.icon, tone: definition.tone, detail, known: true };
}

function truncate(text, max) {
  const str = String(text);
  return str.length > max ? `${str.slice(0, max)}…` : str;
}

function formatWhen(startsAt, endsAt) {
  if (!startsAt) return null;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return null;
  const startLabel = start.toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  if (!endsAt) return `For ${startLabel}`;
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return `For ${startLabel}`;
  const endLabel = end.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `For ${startLabel} – ${endLabel}`;
}
