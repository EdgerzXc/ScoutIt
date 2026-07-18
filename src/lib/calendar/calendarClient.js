// Thin client wrappers around the /api/calendar/events endpoints.
// Keeps crmFetch call-shapes in one place so components stay declarative.
import { crmFetch } from "@/lib/crmClient";

/** Fetch this user's events overlapping [from, to] (ISO strings). */
export async function fetchCalendarEvents({ from, to, userId }) {
  const qs = new URLSearchParams({ from, to }).toString();
  const res = await crmFetch(`/api/calendar/events?${qs}`, { mockUserId: userId });
  return Array.isArray(res.events) ? res.events : [];
}

export async function createCalendarEvent(payload, userId) {
  const res = await crmFetch("/api/calendar/events", {
    method: "POST",
    body: payload,
    mockUserId: userId,
  });
  return res.event;
}

export async function updateCalendarEvent(id, payload, userId) {
  const res = await crmFetch(`/api/calendar/events/${id}`, {
    method: "PATCH",
    body: payload,
    mockUserId: userId,
  });
  return res.event;
}

export async function deleteCalendarEvent(id, userId) {
  await crmFetch(`/api/calendar/events/${id}`, {
    method: "DELETE",
    mockUserId: userId,
  });
}
