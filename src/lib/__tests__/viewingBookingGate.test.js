import { describe, it, expect, vi, beforeEach } from "vitest";
import { bookViewing } from "@/lib/viewings/bookingService";

// The booking GATE, tested against the real rules rather than a route mock.
//
// This is the path that was unguarded: before this work, both booking endpoints
// accepted any timestamp at all — 3am, a day the host had marked unavailable, a
// slot someone else already held — and one of them never checked whether the
// deal was still open. These tests exist so that cannot come back.
//
// createViewingMeet is mocked because a booking must not depend on Google, and
// its absence is the normal case for almost every host.
vi.mock("@/lib/calendar/meetLink", () => ({
  createViewingMeet: vi.fn(async () => ({ meetLink: null, googleEventId: null })),
  cancelViewingMeet: vi.fn(async () => true),
}));

const HOST = "11111111-1111-4111-8111-111111111111";
const BUYER = "22222222-2222-4222-8222-222222222222";
const STRANGER = "33333333-3333-4333-8333-333333333333";
const DEAL = "44444444-4444-4444-8444-444444444444";
const PROPERTY = "55555555-5555-4555-8555-555555555555";

// 2026-09-01 is a Tuesday. Manila is UTC+8, so 09:00-17:00 local is 01:00-09:00Z.
const MANILA_9_TO_5 = {
  weekly_schedule: {
    monday: { active: true, start: "09:00", end: "17:00" },
    tuesday: { active: true, start: "09:00", end: "17:00" },
    wednesday: { active: true, start: "09:00", end: "17:00" },
    thursday: { active: true, start: "09:00", end: "17:00" },
    friday: { active: true, start: "09:00", end: "17:00" },
    saturday: { active: false, start: "09:00", end: "17:00" },
    sunday: { active: false, start: "09:00", end: "17:00" },
  },
  date_overrides: {},
  timezone: "Asia/Manila",
  default_duration_minutes: 60,
  slot_interval_minutes: 60,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  minimum_notice_minutes: 0,
  max_bookings_per_day: null,
};

const NOW = Date.parse("2026-08-25T00:00:00Z");
const VALID_SLOT = "2026-09-01T01:00:00.000Z"; // 09:00 Tuesday, Manila

/**
 * A fake service-role client that answers exactly the chains the booking path
 * uses, and records every insert. Any table the code asks for that the test did
 * not configure throws, so a query the test did not anticipate fails loudly
 * instead of quietly resolving to an empty result.
 */
function makeClient({
  deal,
  availability = MANILA_9_TO_5,
  appointments = [],
  events = [],
  eventsError = null,
  insertError = null,
} = {}) {
  const inserts = [];

  const builder = (result) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      in: () => chain,
      neq: () => chain,
      gte: () => chain,
      lt: () => chain,
      order: () => chain,
      limit: () => chain,
      single: async () => result,
      maybeSingle: async () => result,
      // Awaiting the chain itself is how the list reads resolve.
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    };
    return chain;
  };

  return {
    inserts,
    from(table) {
      switch (table) {
        case "deals":
          return builder(deal
            ? { data: deal, error: null }
            : { data: null, error: { message: "not found" } });

        case "user_availability":
          return builder({ data: availability, error: null });

        case "calendar_events":
          return builder({ data: events, error: eventsError });

        case "viewing_appointments":
          return {
            ...builder({ data: appointments, error: null }),
            insert(rows) {
              inserts.push({ table, rows });
              const row = {
                id: "appt-1",
                ...rows[0],
                ends_at: new Date(
                  new Date(rows[0].scheduled_at).getTime() + rows[0].duration_minutes * 60000,
                ).toISOString(),
              };
              return builder(insertError
                ? { data: null, error: insertError }
                : { data: row, error: null });
            },
            update() { return builder({ data: null, error: null }); },
          };

        case "crm_activity_log":
          return {
            insert(rows) {
              inserts.push({ table, rows });
              return Promise.resolve({ error: null });
            },
          };

        default:
          throw new Error(`Unexpected table read in the booking path: ${table}`);
      }
    },
  };
}

const openDeal = (over = {}) => ({
  id: DEAL,
  status: "accepted",
  buyer_id: BUYER,
  broker_id: null,
  property_id: PROPERTY,
  properties: { id: PROPERTY, owner_id: HOST, title: "The Paragon Tower", location: "BGC" },
  ...over,
});

const book = (client, over = {}) => bookViewing(client, {
  dealId: DEAL,
  requesterId: BUYER,
  scheduledAt: VALID_SLOT,
  now: NOW,
  ...over,
});

beforeEach(() => vi.clearAllMocks());

describe("bookViewing — access", () => {
  it("creates the appointment for a party booking an offered slot", async () => {
    const client = makeClient({ deal: openDeal() });
    const result = await book(client);

    expect(result.ok).toBe(true);
    expect(result.appointment.scheduled_at).toBe(VALID_SLOT);
    expect(result.appointment.duration_minutes).toBe(60);
    expect(result.requesterRole).toBe("buyer");
  });

  it("rejects a stranger to the deal", async () => {
    const result = await book(makeClient({ deal: openDeal() }), { requesterId: STRANGER });
    expect(result).toMatchObject({ ok: false, status: 403 });
  });

  it("rejects a deal that does not exist", async () => {
    const result = await book(makeClient({ deal: null }));
    expect(result).toMatchObject({ ok: false, status: 404 });
  });

  it("refuses to let someone book a viewing with themselves", async () => {
    // Owner is also the buyer: there is no counterparty to host it.
    const deal = openDeal({ properties: { id: PROPERTY, owner_id: BUYER, title: "T" } });
    const result = await book(makeClient({ deal }));
    expect(result).toMatchObject({ ok: false, status: 400 });
  });

  it("records the host as the broker when one represents the property", async () => {
    const client = makeClient({ deal: openDeal({ broker_id: HOST }) });
    const result = await book(client);
    expect(result.ok).toBe(true);
    expect(result.appointment.host_id).toBe(HOST);
  });
});

describe("bookViewing — deal lifecycle", () => {
  // The old /api/viewing-appointments never checked this, so a closed
  // conversation could still gain viewings through it.
  for (const status of ["closed", "declined", "withdrawn", "expired", "reported"]) {
    it(`rejects a booking on a ${status} deal`, async () => {
      const result = await book(makeClient({ deal: openDeal({ status }) }));
      expect(result).toMatchObject({ ok: false, status: 409 });
    });
  }

  for (const status of ["connected", "pitching", "pending", "invited", "accepted", "active"]) {
    it(`allows a booking on a ${status} deal`, async () => {
      const result = await book(makeClient({ deal: openDeal({ status }) }));
      expect(result.ok).toBe(true);
    });
  }
});

describe("bookViewing — the availability gate", () => {
  it("rejects 3am, which the old endpoint accepted", async () => {
    // 19:00Z = 03:00 Manila the next day.
    const result = await book(makeClient({ deal: openDeal() }), {
      scheduledAt: "2026-09-01T19:00:00.000Z",
    });
    expect(result).toMatchObject({ ok: false, status: 409, reason: "not_available" });
  });

  it("rejects a day the host is closed", async () => {
    // 2026-09-05 is a Saturday.
    const result = await book(makeClient({ deal: openDeal() }), {
      scheduledAt: "2026-09-05T01:00:00.000Z",
    });
    expect(result).toMatchObject({ ok: false, reason: "not_available" });
  });

  it("rejects a date the host blocked with an override", async () => {
    const client = makeClient({
      deal: openDeal(),
      availability: { ...MANILA_9_TO_5, date_overrides: { "2026-09-01": { active: false } } },
    });
    expect(await book(client)).toMatchObject({ ok: false, reason: "not_available" });
  });

  it("rejects a slot already held by another viewing", async () => {
    const client = makeClient({
      deal: openDeal(),
      appointments: [{ id: "other", scheduled_at: VALID_SLOT, duration_minutes: 60, status: "confirmed" }],
    });
    expect(await book(client)).toMatchObject({ ok: false, reason: "not_available" });
  });

  it("rejects a slot covered by a synced calendar event", async () => {
    // The old availability read ignored calendar_events entirely.
    const client = makeClient({
      deal: openDeal(),
      events: [{ starts_at: VALID_SLOT, ends_at: "2026-09-01T02:00:00.000Z" }],
    });
    expect(await book(client)).toMatchObject({ ok: false, reason: "not_available" });
  });

  it("fails closed when synced-calendar busy time cannot be read", async () => {
    const client = makeClient({
      deal: openDeal(),
      eventsError: { message: "calendar read failed" },
    });
    expect(await book(client)).toMatchObject({
      ok: false,
      status: 503,
      reason: "availability_unavailable",
    });
    expect(client.inserts).toHaveLength(0);
  });

  it("rejects a time inside the minimum-notice window with its own reason", async () => {
    const client = makeClient({
      deal: openDeal(),
      availability: { ...MANILA_9_TO_5, minimum_notice_minutes: 240 },
    });
    const result = await book(client, { now: Date.parse("2026-09-01T00:00:00Z") });
    expect(result).toMatchObject({ ok: false, reason: "too_soon" });
  });

  it("rejects a time in the past", async () => {
    const result = await book(makeClient({ deal: openDeal() }), {
      now: Date.parse("2026-09-02T00:00:00Z"),
    });
    expect(result).toMatchObject({ ok: false, reason: "in_the_past" });
  });

  it("rejects an unparseable time rather than writing it", async () => {
    const client = makeClient({ deal: openDeal() });
    const result = await book(client, { scheduledAt: "whenever" });
    expect(result).toMatchObject({ ok: false, reason: "invalid_time" });
    expect(client.inserts).toHaveLength(0);
  });

  it("respects a buffer around an existing booking", async () => {
    const client = makeClient({
      deal: openDeal(),
      availability: { ...MANILA_9_TO_5, buffer_after_minutes: 60 },
      appointments: [{
        id: "other", scheduled_at: "2026-09-01T02:00:00.000Z", duration_minutes: 60, status: "confirmed",
      }],
    });
    // 01:00Z ends at 02:00Z; a 60-minute after-buffer pushes into the booking.
    expect(await book(client)).toMatchObject({ ok: false, reason: "not_available" });
  });

  it("ignores a cancelled viewing when deciding whether a slot is free", async () => {
    const client = makeClient({
      deal: openDeal(),
      appointments: [{ id: "old", scheduled_at: VALID_SLOT, duration_minutes: 60, status: "cancelled" }],
    });
    expect((await book(client)).ok).toBe(true);
  });
});

describe("bookViewing — what it writes", () => {
  it("stores the duration and the timezone the guest saw", async () => {
    const client = makeClient({ deal: openDeal() });
    await book(client, { timezone: "Asia/Singapore" });

    const row = client.inserts.find((i) => i.table === "viewing_appointments").rows[0];
    expect(row).toMatchObject({
      deal_id: DEAL,
      host_id: HOST,
      guest_id: BUYER,
      property_id: PROPERTY,
      duration_minutes: 60,
      booked_timezone: "Asia/Singapore",
      status: "pending",
    });
  });

  it("rejects an invalid guest timezone before writing", async () => {
    const client = makeClient({ deal: openDeal() });
    expect(await book(client, { timezone: "Mars/Olympus" })).toMatchObject({
      ok: false,
      status: 400,
      reason: "invalid_timezone",
    });
    expect(client.inserts).toHaveLength(0);
  });

  it("falls back to the host's timezone when the guest sent none", async () => {
    const client = makeClient({ deal: openDeal() });
    await book(client);
    const row = client.inserts.find((i) => i.table === "viewing_appointments").rows[0];
    expect(row.booked_timezone).toBe("Asia/Manila");
  });

  it("writes a timeline entry carrying the real end time", async () => {
    const client = makeClient({ deal: openDeal() });
    await book(client);

    const activity = client.inserts.find((i) => i.table === "crm_activity_log").rows[0];
    expect(activity.activity_type).toBe("viewing_scheduled");
    expect(activity.metadata).toMatchObject({
      scheduledAt: VALID_SLOT,
      endsAt: "2026-09-01T02:00:00.000Z",
      durationMinutes: 60,
    });
  });

  it("writes nothing at all when the gate rejects the time", async () => {
    const client = makeClient({ deal: openDeal() });
    await book(client, { scheduledAt: "2026-09-01T19:00:00.000Z" });
    expect(client.inserts).toHaveLength(0);
  });

  it("reports a failed insert instead of claiming success", async () => {
    const client = makeClient({ deal: openDeal(), insertError: { message: "boom" } });
    expect(await book(client)).toMatchObject({ ok: false, status: 500 });
  });

  it("maps a database overlap race to a retryable slot conflict", async () => {
    const client = makeClient({
      deal: openDeal(),
      insertError: { code: "23P01", message: "exclusion constraint" },
    });
    expect(await book(client)).toMatchObject({
      ok: false,
      status: 409,
      reason: "not_available",
    });
  });
});
