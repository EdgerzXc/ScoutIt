import { beforeEach, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  updated: null, writeError: null, notify: vi.fn(), insertEvent: vi.fn(), patchEvent: vi.fn(), deleteEvent: vi.fn(),
}));
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent: db.notify }));
vi.mock("@/lib/calendar/connectionStore", () => ({
  getValidGoogleAccessToken: async () => "fixture-token",
  markConnectionStatus: vi.fn(),
}));
vi.mock("@/lib/calendar/googleClient", () => ({
  listEvents: vi.fn(), insertEvent: db.insertEvent, patchEvent: db.patchEvent, deleteEvent: db.deleteEvent,
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from() {
      let writing = false;
      const chain = {
        select: () => chain,
        eq: () => chain,
        update: (row) => { writing = true; db.updated = row; return chain; },
        async maybeSingle() {
          if (writing) return { data: db.writeError ? null : { id: "event" }, error: db.writeError };
          return { data: { title: "Tour", source: "scoutit", starts_at: "2026-11-20T02:00:00Z", ends_at: "2026-11-20T03:00:00Z" } };
        },
      };
      return chain;
    },
  },
}));

const { enqueueCalendarSyncRetry, processCalendarSyncQueue, viewingGoogleEventId } = await import("@/lib/calendar/meetLink");
const { syncOutbound } = await import("@/lib/calendar/googleSync");

beforeEach(() => {
  vi.clearAllMocks();
  db.writeError = null;
  db.updated = null;
  db.insertEvent.mockResolvedValue({ id: "google-event" });
});

it("reports an unpersisted retry through the operations event writer", async () => {
  const client = { from: () => ({ insert: async () => ({ error: { code: "42P01" } }) }) };
  expect(await enqueueCalendarSyncRetry(client, {
    appointmentId: "appointment", hostUserId: "host", operation: "create",
    payload: { notes: "Private meeting notes" },
  })).toBe(false);
  expect(db.notify).toHaveBeenCalledWith({
    event: "calendar.sync.failed", severity: "error", subjectTable: "viewing_appointments",
    subjectId: "appointment", summary: expect.any(String), detail: { operation: "create", errorCode: "42P01" },
  });
});

it("only acknowledges a queued retry after the database accepts it", async () => {
  const client = { from: () => ({ insert: async () => ({ error: null }) }) };
  expect(await enqueueCalendarSyncRetry(client, { appointmentId: "appointment", operation: "cancel" })).toBe(true);
  expect(db.notify).not.toHaveBeenCalled();
});

it("reports a database failure after Google successfully creates an event", async () => {
  db.writeError = { code: "57014" };
  expect(await syncOutbound("owner", "event", "create")).toEqual({ error: "Google Calendar sync failed." });
  expect(db.updated.google_event_id).toBe("google-event");
  expect(db.notify).toHaveBeenCalledWith(expect.objectContaining({
    event: "calendar.sync.failed", subjectId: "event",
    detail: { operation: "create", errorCode: "57014" },
  }));
});

it("returns success after the local Google event binding is saved", async () => {
  expect(await syncOutbound("owner", "event", "create")).toMatchObject({ ok: true, googleId: "google-event" });
  expect(db.notify).not.toHaveBeenCalled();
});

it("reuses its Google event ID when the provider write succeeded but saving the binding failed", async () => {
  db.writeError = { code: "57014" };
  db.insertEvent.mockImplementationOnce(async (_token, { id }) => ({ id }));
  await syncOutbound("owner", "event", "create");
  const id = db.insertEvent.mock.calls[0][1].id;
  expect(id).toMatch(/^[a-v0-9]{64}$/);

  db.writeError = null;
  db.insertEvent.mockRejectedValueOnce(Object.assign(new Error("Duplicate event"), { status: 409 }));
  db.patchEvent.mockResolvedValueOnce({ id });
  expect(await syncOutbound("owner", "event", "update")).toMatchObject({ ok: true, googleId: id });
  expect(db.insertEvent.mock.calls[1][1].id).toBe(id);
  expect(db.patchEvent).toHaveBeenCalledWith("fixture-token", id, expect.any(Object));
  expect(await syncOutbound("owner", "event", "delete")).toMatchObject({ ok: true, op: "delete" });
  expect(db.deleteEvent).toHaveBeenCalledWith("fixture-token", id);
});

function createRetryTestClient({ queue = [], appointments = {} }) {
  return {
    queue,
    appointments,
    from(table) {
      if (table === "calendar_sync_queue") {
        let filterStatus = null;
        let filterId = null;
        let filterAppointmentId = null;
        let updatePayload = null;
        const chain = {
          select: () => chain,
          eq: (col, val) => {
            if (col === "status") filterStatus = val;
            if (col === "id") filterId = val;
            if (col === "appointment_id") filterAppointmentId = val;
            return chain;
          },
          lte: () => chain,
          order: () => chain,
          limit: async () => ({
            data: queue.filter((r) => (!filterStatus || r.status === filterStatus)),
            error: null,
          }),
          update: (vals) => {
            updatePayload = vals;
            return {
              eq: (col, val) => {
                if (col === "id") filterId = val;
                if (col === "appointment_id") filterAppointmentId = val;
                return {
                  eq: (col2, val2) => {
                    if (col2 === "status") filterStatus = val2;
                    for (const row of queue) {
                      const matchId = !filterId || row.id === filterId;
                      const matchAppt = !filterAppointmentId || row.appointment_id === filterAppointmentId;
                      const matchStatus = !filterStatus || row.status === filterStatus;
                      if (matchId && matchAppt && matchStatus) {
                        Object.assign(row, updatePayload);
                      }
                    }
                    return Promise.resolve({ data: null, error: null });
                  },
                  then: (resolve) => {
                    for (const row of queue) {
                      const matchId = !filterId || row.id === filterId;
                      const matchAppt = !filterAppointmentId || row.appointment_id === filterAppointmentId;
                      if (matchId && matchAppt) {
                        Object.assign(row, updatePayload);
                      }
                    }
                    return Promise.resolve({ data: null, error: null }).then(resolve);
                  },
                };
              },
            };
          },
        };
        return chain;
      }

      if (table === "viewing_appointments") {
        let targetId = null;
        let updatePayload = null;
        const chain = {
          select: () => chain,
          eq: (col, val) => {
            if (col === "id") targetId = val;
            return chain;
          },
          update: (vals) => {
            updatePayload = vals;
            return chain;
          },
          maybeSingle: async () => {
            const appt = appointments[targetId] || null;
            if (updatePayload && appt) {
              Object.assign(appt, updatePayload);
            }
            return { data: appt ? { ...appt } : null, error: null };
          },
        };
        return chain;
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

it("recovers a failed create operation without duplicate provider events even if Google already created the event on the first attempt (409)", async () => {
  const apptId = "appt-create-1";
  const expectedEventId = viewingGoogleEventId("host-1", apptId);
  expect(expectedEventId).toMatch(/^[a-v0-9]{64}$/);

  const client = createRetryTestClient({
    queue: [
      {
        id: "q-create-1",
        appointment_id: apptId,
        host_user_id: "host-1",
        google_event_id: null,
        operation: "create",
        payload: {
          scheduledAt: "2026-11-25T03:00:00.000Z",
          durationMinutes: 45,
          propertyTitle: "BGC Penthouse",
        },
        status: "pending",
        attempt_count: 0,
        max_attempts: 5,
      },
    ],
    appointments: {
      [apptId]: {
        id: apptId,
        host_id: "host-1",
        status: "pending",
        scheduled_at: "2026-11-25T03:00:00.000Z",
        duration_minutes: 45,
        notes: "Bring ID",
        google_event_id: null,
        meet_link: null,
        deals: { properties: { title: "BGC Penthouse", location: "Taguig" } },
      },
    },
  });

  // Simulate 409 Conflict on insertEvent (provider created it previously before timeout),
  // followed by patchEvent returning the existing event + Meet link
  db.insertEvent.mockRejectedValueOnce(Object.assign(new Error("Duplicate event ID"), { status: 409 }));
  db.patchEvent.mockResolvedValueOnce({
    id: expectedEventId,
    hangoutLink: "https://meet.google.com/abc-defg-hij",
  });

  const summary = await processCalendarSyncQueue(client);
  expect(summary.completed).toBe(1);
  expect(client.queue[0].status).toBe("completed");
  expect(client.appointments[apptId]).toMatchObject({
    google_event_id: expectedEventId,
    meet_link: "https://meet.google.com/abc-defg-hij",
  });
  expect(db.insertEvent).toHaveBeenCalledTimes(1);
  expect(db.insertEvent.mock.calls[0][1].id).toBe(expectedEventId);
  expect(db.patchEvent).toHaveBeenCalledTimes(1);
});

it("recovers failed reschedule and cancel operations cleanly without stale Meet links", async () => {
  const rescheduleApptId = "appt-resched-1";
  const cancelApptId = "appt-cancel-1";

  const client = createRetryTestClient({
    queue: [
      {
        id: "q-resched-1",
        appointment_id: rescheduleApptId,
        host_user_id: "host-1",
        google_event_id: "g-ev-resched",
        operation: "reschedule",
        payload: { scheduledAt: "2026-11-26T04:00:00.000Z", durationMinutes: 60 },
        status: "pending",
        attempt_count: 1,
        max_attempts: 5,
      },
      {
        id: "q-stale-create-for-cancelled",
        appointment_id: cancelApptId,
        host_user_id: "host-1",
        google_event_id: "g-ev-cancel",
        operation: "create",
        payload: { scheduledAt: "2026-11-27T04:00:00.000Z", durationMinutes: 45 },
        status: "pending",
        attempt_count: 0,
        max_attempts: 5,
      },
      {
        id: "q-cancel-1",
        appointment_id: cancelApptId,
        host_user_id: "host-1",
        google_event_id: "g-ev-cancel",
        operation: "cancel",
        payload: {},
        status: "pending",
        attempt_count: 0,
        max_attempts: 5,
      },
    ],
    appointments: {
      [rescheduleApptId]: {
        id: rescheduleApptId,
        host_id: "host-1",
        status: "pending",
        scheduled_at: "2026-11-26T04:00:00.000Z",
        duration_minutes: 60,
        google_event_id: "g-ev-cancel-no",
        meet_link: "https://meet.google.com/keep-same-room",
      },
      [cancelApptId]: {
        id: cancelApptId,
        host_id: "host-1",
        status: "cancelled",
        scheduled_at: "2026-11-27T04:00:00.000Z",
        duration_minutes: 45,
        google_event_id: "g-ev-cancel",
        meet_link: "https://meet.google.com/stale-room-must-clear",
      },
    },
  });
  client.appointments[rescheduleApptId].google_event_id = "g-ev-resched";

  db.patchEvent.mockResolvedValueOnce({ id: "g-ev-resched" });
  db.deleteEvent.mockResolvedValueOnce(null);

  const summary = await processCalendarSyncQueue(client);
  expect(summary.completed).toBeGreaterThanOrEqual(2);
  expect(db.patchEvent).toHaveBeenCalledWith(
    "fixture-token",
    "g-ev-resched",
    expect.objectContaining({
      start: { dateTime: "2026-11-26T04:00:00.000Z" },
      end: { dateTime: "2026-11-26T05:00:00.000Z" },
    })
  );
  expect(db.deleteEvent).toHaveBeenCalledWith("fixture-token", "g-ev-cancel");
  expect(client.appointments[cancelApptId].meet_link).toBeNull();
  expect(client.appointments[cancelApptId].google_event_id).toBeNull();
  expect(client.queue.find((q) => q.id === "q-cancel-1").status).toBe("completed");
});

it("bounds retry attempts and marks exhausted queue items failed_permanent with a system event", async () => {
  const apptId = "appt-exhausted";
  const client = createRetryTestClient({
    queue: [
      {
        id: "q-exhaust-1",
        appointment_id: apptId,
        host_user_id: "host-1",
        google_event_id: "g-ev-broken",
        operation: "cancel",
        payload: {},
        status: "pending",
        attempt_count: 4,
        max_attempts: 5,
      },
    ],
    appointments: {
      [apptId]: {
        id: apptId,
        host_id: "host-1",
        status: "cancelled",
        google_event_id: "g-ev-broken",
        meet_link: null,
      },
    },
  });

  db.deleteEvent.mockRejectedValueOnce(new Error("Google 503 Unavailable"));

  const summary = await processCalendarSyncQueue(client);
  expect(summary.failedPermanent).toBe(1);
  expect(client.queue[0].status).toBe("failed_permanent");
  expect(client.queue[0].attempt_count).toBe(5);
  expect(db.notify).toHaveBeenCalledWith(
    expect.objectContaining({
      event: "calendar.sync.failed",
      severity: "error",
      subjectTable: "viewing_appointments",
      subjectId: apptId,
    })
  );
});
