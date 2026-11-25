import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  row: null, actor: null, updateError: null, beforeUpdate: null,
  notify: vi.fn(), activity: vi.fn(), checkSlot: vi.fn(), moveMeet: vi.fn(),
}));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => db.actor }));
vi.mock("@/lib/crmActivity", () => ({ logActivity: db.activity, createTask: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ notifyUser: db.notify }));
vi.mock("@/lib/calendar/availabilityService", () => ({ assertSlotBookable: db.checkSlot }));
vi.mock("@/lib/calendar/meetLink", () => ({
  rescheduleViewingMeet: db.moveMeet, cancelViewingMeet: vi.fn(), enqueueCalendarSyncRetry: vi.fn(),
}));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from() {
      const conditions = new Map();
      let changes;
      const query = {
        select: () => query,
        eq: (key, value) => { conditions.set(key, value); return query; },
        update: (value) => { changes = value; return query; },
        async maybeSingle() {
          if (changes) {
            await db.beforeUpdate?.();
            if (db.updateError) return { error: db.updateError };
          }
          if (!db.row || [...conditions].some(([key, value]) => db.row[key] !== value)) {
            return { data: null };
          }
          if (changes) db.row = { ...db.row, ...changes, updated_at: NEW_VERSION };
          return { data: { ...db.row } };
        },
      };
      return query;
    },
  },
}));

const { PATCH } = await import("@/app/api/viewing-appointments/[id]/route");

const ID = "11111111-1111-4111-8111-111111111111";
const OLD_VERSION = "2026-11-13T04:00:00.000001+00:00";
const NEW_VERSION = "2026-11-13T04:00:00.000002+00:00";
const NEW_SLOT = "2026-11-20T02:00:00.000Z";

function update(body) {
  return PATCH(
    new Request(`https://www.scoutit.space/api/viewing-appointments/${ID}`, {
      method: "PATCH", body: JSON.stringify({ expectedUpdatedAt: OLD_VERSION, ...body }),
    }),
    { params: Promise.resolve({ id: ID }) },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  db.actor = "host";
  db.beforeUpdate = null;
  db.updateError = null;
  db.row = {
    id: ID, host_id: "host", guest_id: "guest", status: "pending", updated_at: OLD_VERSION,
    scheduled_at: "2026-11-19T02:00:00.000Z", duration_minutes: 45,
  };
  db.checkSlot.mockResolvedValue({ ok: true, durationMinutes: 45, timezone: "Asia/Manila" });
});

describe("Viewing update version checks", () => {
  it("rejects confirmation from before a reschedule, even when both versions are pending", async () => {
    expect((await update({ scheduledAt: NEW_SLOT })).status).toBe(200);
    const response = await update({ status: "confirmed" });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "VIEWING_CHANGED" });
    expect(db.row).toMatchObject({ status: "pending", scheduled_at: NEW_SLOT });
    expect(db.notify).toHaveBeenCalledTimes(1);
  });

  it("rejects a reschedule whose version changes between its read and write", async () => {
    db.row.google_event_id = "event";
    db.beforeUpdate = () => { db.row = { ...db.row, status: "cancelled", updated_at: NEW_VERSION }; };
    const response = await update({ scheduledAt: NEW_SLOT });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "VIEWING_CHANGED" });
    expect(db.row.status).toBe("cancelled");
    expect(db.row.scheduled_at).not.toBe(NEW_SLOT);
    expect(db.moveMeet).not.toHaveBeenCalled();
    expect(db.activity).not.toHaveBeenCalled();
    expect(db.notify).not.toHaveBeenCalled();
  });

  it("allows just one overlapping status update and returns the winning version", async () => {
    db.activity.mockRejectedValue(new Error("Timeline unavailable"));
    const responses = await Promise.all([update({ status: "confirmed" }), update({ status: "cancelled" })]);
    expect(responses.map((res) => res.status).sort()).toEqual([200, 409]);
    const successful = responses.find((res) => res.ok);
    expect(await successful.json()).toMatchObject({ appointment: { updated_at: NEW_VERSION, status: db.row.status } });
    expect(db.notify).toHaveBeenCalledTimes(1);
  });

  it("returns a slot conflict if another booking takes the requested time", async () => {
    db.updateError = { code: "23P01" };
    const response = await update({ scheduledAt: NEW_SLOT });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ reason: "not_available" });
    expect(db.notify).not.toHaveBeenCalled();
  });

  it("requires the reviewed version and rejects guest confirmation", async () => {
    expect((await update({ status: "confirmed", expectedUpdatedAt: undefined })).status).toBe(400);
    db.actor = "guest";
    expect((await update({ status: "confirmed" })).status).toBe(403);
    expect(db.row.updated_at).toBe(OLD_VERSION);
  });
});
