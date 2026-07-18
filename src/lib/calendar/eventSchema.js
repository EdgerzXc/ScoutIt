// Shared validation + serialization for calendar events, used by both the
// collection route and the [id] route so the contract stays in one place.
import { z } from "zod";

export const EVENT_COLORS = ["gold", "blue", "green", "red", "purple"];
export const EVENT_STATUSES = ["confirmed", "tentative", "cancelled"];

const baseFields = {
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  allDay: z.boolean().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  color: z.enum(EVENT_COLORS).optional(),
};

// End must not precede start — the one cross-field invariant.
const endAfterStart = (data) => {
  if (!data.startsAt || !data.endsAt) return true;
  return new Date(data.endsAt).getTime() >= new Date(data.startsAt).getTime();
};

export const createEventSchema = z
  .object(baseFields)
  .refine(endAfterStart, { message: "End time cannot be before start time", path: ["endsAt"] });

// PATCH: every field optional, but if BOTH times are present the invariant holds.
export const updateEventSchema = z
  .object({
    title: baseFields.title.optional(),
    description: baseFields.description,
    location: baseFields.location,
    startsAt: baseFields.startsAt.optional(),
    endsAt: baseFields.endsAt.optional(),
    allDay: baseFields.allDay,
    status: baseFields.status,
    color: baseFields.color,
  })
  .refine(endAfterStart, { message: "End time cannot be before start time", path: ["endsAt"] });

/** DB row (snake_case) -> API/UI shape (camelCase, kind-tagged). */
export function serializeEvent(row) {
  return {
    id: row.id,
    kind: "event",
    title: row.title,
    description: row.description || "",
    location: row.location || "",
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    status: row.status,
    color: row.color,
    source: row.source,
  };
}

/** Map validated camelCase input -> DB columns (only defined keys). */
export function toEventRow(input) {
  const row = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description || null;
  if (input.location !== undefined) row.location = input.location || null;
  if (input.startsAt !== undefined) row.starts_at = input.startsAt;
  if (input.endsAt !== undefined) row.ends_at = input.endsAt;
  if (input.allDay !== undefined) row.all_day = input.allDay;
  if (input.status !== undefined) row.status = input.status;
  if (input.color !== undefined) row.color = input.color;
  return row;
}
