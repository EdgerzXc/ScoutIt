import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/availability/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Guards the two defects this route shipped with:
//
//  1. It upserted `date_overrides: date_overrides || {}` and
//     `timezone: timezone || 'Asia/Manila'`. The availability screen only ever
//     sent weekly_schedule, so EVERY save silently erased the host's blocked
//     dates and reset their timezone. Data loss with no error and no warning.
//  2. GET accepted ?userId= for any user and returned that host's pending and
//     confirmed appointment times, letting any signed-in account enumerate a
//     stranger's schedule.

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

const USER = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

const STORED = {
  weekly_schedule: { monday: { active: true, start: "10:00", end: "16:00" } },
  date_overrides: { "2026-12-25": { active: false } },
  timezone: "Asia/Singapore",
  default_duration_minutes: 45,
  slot_interval_minutes: 15,
  buffer_before_minutes: 10,
  buffer_after_minutes: 20,
  minimum_notice_minutes: 720,
  max_bookings_per_day: 4,
};

/** Records what the route upserts so the test can assert on the exact payload. */
function mockTable({ existing = STORED } = {}) {
  const upserts = [];
  supabaseAdmin.from.mockImplementation((table) => {
    if (table !== "user_availability") {
      throw new Error(`Unexpected table: ${table}`);
    }
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => ({ data: existing, error: null }),
      single: async () => ({ data: upserts[upserts.length - 1]?.payload || existing, error: null }),
      upsert: (payload) => {
        upserts.push({ payload });
        return chain;
      },
    };
    return chain;
  });
  return upserts;
}

const post = (body) => POST(new Request("http://localhost/api/availability", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
}));

const get = (query = "") => GET(new Request(`http://localhost/api/availability${query}`));

beforeEach(() => {
  vi.clearAllMocks();
  serverAuth.resolveUserId.mockResolvedValue(USER);
});

describe("GET /api/availability", () => {
  it("returns the caller's own stored policy", async () => {
    mockTable();
    const body = await (await get()).json();

    expect(body.isConfigured).toBe(true);
    expect(body.config.timezone).toBe("Asia/Singapore");
    expect(body.config.date_overrides).toEqual({ "2026-12-25": { active: false } });
    expect(body.config.minimum_notice_minutes).toBe(720);
  });

  it("answers an unconfigured host with documented defaults, not an empty object", async () => {
    mockTable({ existing: null });
    const body = await (await get()).json();

    expect(body.isConfigured).toBe(false);
    expect(body.config.timezone).toBe("Asia/Manila");
    expect(body.config.default_duration_minutes).toBe(60);
    expect(body.config.minimum_notice_minutes).toBe(120);
  });

  it("refuses to read another user's schedule", async () => {
    mockTable();
    const res = await get(`?userId=${OTHER}`);
    expect(res.status).toBe(403);
  });

  it("never discloses appointment times", async () => {
    mockTable();
    const body = await (await get()).json();
    // The old response carried an `appointments` array of the host's real
    // pending and confirmed viewing times.
    expect(body.appointments).toBeUndefined();
  });

  it("rejects an anonymous caller", async () => {
    serverAuth.resolveUserId.mockResolvedValue(null);
    expect((await get()).status).toBe(401);
  });
});

describe("POST /api/availability — partial update", () => {
  it("does not erase date overrides when only weekly hours are sent", async () => {
    const upserts = mockTable();
    const res = await post({
      weekly_schedule: { monday: { active: true, start: "08:00", end: "12:00" } },
    });

    expect(res.status).toBe(200);
    const { payload } = upserts[0];
    expect(payload.weekly_schedule.monday.start).toBe("08:00");
    // The whole point: untouched fields survive.
    expect(payload.date_overrides).toEqual({ "2026-12-25": { active: false } });
    expect(payload.timezone).toBe("Asia/Singapore");
    expect(payload.minimum_notice_minutes).toBe(720);
    expect(payload.max_bookings_per_day).toBe(4);
  });

  it("does not reset the timezone to Asia/Manila on an unrelated save", async () => {
    const upserts = mockTable();
    await post({ buffer_after_minutes: 45 });
    expect(upserts[0].payload.timezone).toBe("Asia/Singapore");
  });

  it("applies the fields that WERE sent", async () => {
    const upserts = mockTable();
    await post({ timezone: "Asia/Tokyo", max_bookings_per_day: 2 });
    expect(upserts[0].payload.timezone).toBe("Asia/Tokyo");
    expect(upserts[0].payload.max_bookings_per_day).toBe(2);
  });

  it("clears the daily cap when it is explicitly nulled", async () => {
    const upserts = mockTable();
    await post({ max_bookings_per_day: null });
    expect(upserts[0].payload.max_bookings_per_day).toBeNull();
  });

  it("scopes the write to the caller", async () => {
    const upserts = mockTable();
    await post({ timezone: "Asia/Tokyo" });
    expect(upserts[0].payload.user_id).toBe(USER);
  });

  it("never writes updated_at, which the trigger owns", async () => {
    const upserts = mockTable({ existing: { ...STORED, updated_at: "2026-01-01T00:00:00Z" } });
    await post({ timezone: "Asia/Tokyo" });
    expect(upserts[0].payload.updated_at).toBeUndefined();
  });

  it("creates a row for a host who has never configured availability", async () => {
    const upserts = mockTable({ existing: null });
    await post({ weekly_schedule: { monday: { active: true, start: "09:00", end: "17:00" } } });
    expect(upserts[0].payload.user_id).toBe(USER);
    expect(upserts[0].payload.weekly_schedule.monday.start).toBe("09:00");
  });
});

describe("POST /api/availability — validation", () => {
  it("rejects an unrecognised timezone", async () => {
    mockTable();
    const res = await post({ timezone: "Mars/Olympus" });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/timezone/i);
  });

  it("rejects a malformed time string", async () => {
    mockTable();
    const res = await post({ weekly_schedule: { monday: { active: true, start: "9am", end: "17:00" } } });
    expect(res.status).toBe(400);
  });

  it("rejects an override key that is not a date", async () => {
    mockTable();
    const res = await post({ date_overrides: { christmas: { active: false } } });
    expect(res.status).toBe(400);
  });

  it("rejects out-of-range booking rules", async () => {
    mockTable();
    expect((await post({ slot_interval_minutes: 1 })).status).toBe(400);
    expect((await post({ minimum_notice_minutes: -5 })).status).toBe(400);
    expect((await post({ default_duration_minutes: 900 })).status).toBe(400);
  });

  it("rejects an empty payload", async () => {
    mockTable();
    expect((await post({})).status).toBe(400);
  });

  it("rejects an anonymous caller", async () => {
    serverAuth.resolveUserId.mockResolvedValue(null);
    expect((await post({ timezone: "Asia/Tokyo" })).status).toBe(401);
  });
});
