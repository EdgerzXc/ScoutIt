import { describe, it, expect } from "vitest";
import {
  buildBusyIntervals,
  computeSlots,
  getDayWindows,
  mergeIntervals,
  normalizeAvailability,
  validateSlot,
} from "./slots";
import {
  addDaysToDateKey,
  dateKeyRange,
  getZonedDateKey,
  getZonedParts,
  isValidDateKey,
  offsetAt,
  timeStringToMinutes,
  zonedWallTimeToUtc,
} from "./timezone";

// 2026-09-01 is a Tuesday. Manila is UTC+8 year round (no DST).
const MANILA = "Asia/Manila";
const NINE_TO_FIVE = {
  monday: { active: true, start: "09:00", end: "17:00" },
  tuesday: { active: true, start: "09:00", end: "17:00" },
  wednesday: { active: true, start: "09:00", end: "17:00" },
  thursday: { active: true, start: "09:00", end: "17:00" },
  friday: { active: true, start: "09:00", end: "17:00" },
  saturday: { active: false, start: "09:00", end: "17:00" },
  sunday: { active: false, start: "09:00", end: "17:00" },
};

// A fixed clock well before the test days, so minimum notice never interferes
// unless a test is specifically about it.
const CLOCK = new Date("2026-08-25T00:00:00.000Z").getTime();

const baseAvailability = {
  timezone: MANILA,
  weekly_schedule: NINE_TO_FIVE,
  date_overrides: {},
  default_duration_minutes: 60,
  slot_interval_minutes: 60,
  buffer_before_minutes: 0,
  buffer_after_minutes: 0,
  minimum_notice_minutes: 0,
};

describe("timezone", () => {
  it("converts a Manila wall clock to the correct UTC instant", () => {
    // 09:00 in Manila (UTC+8) is 01:00 UTC the same day.
    const instant = zonedWallTimeToUtc("2026-09-01", "09:00", MANILA);
    expect(instant.toISOString()).toBe("2026-09-01T01:00:00.000Z");
  });

  it("reports the Manila offset as +480 minutes", () => {
    expect(offsetAt(new Date("2026-09-01T00:00:00Z"), MANILA)).toBe(480);
  });

  it("handles a zone that observes DST on both sides of the transition", () => {
    // US DST ended 2026-11-01. New York is UTC-4 before, UTC-5 after.
    expect(offsetAt(new Date("2026-10-15T12:00:00Z"), "America/New_York")).toBe(-240);
    expect(offsetAt(new Date("2026-11-15T12:00:00Z"), "America/New_York")).toBe(-300);

    expect(zonedWallTimeToUtc("2026-10-15", "09:00", "America/New_York").toISOString())
      .toBe("2026-10-15T13:00:00.000Z");
    expect(zonedWallTimeToUtc("2026-11-15", "09:00", "America/New_York").toISOString())
      .toBe("2026-11-15T14:00:00.000Z");
  });

  it("rejects a wall time that does not exist in a spring-forward gap", () => {
    const missing = zonedWallTimeToUtc("2026-03-08", "02:30", "America/New_York");
    expect(Number.isNaN(missing.getTime())).toBe(true);
  });

  it("reads the calendar day in the host zone, not the server zone", () => {
    // 2026-09-01T23:00Z is already 2026-09-02 in Manila.
    expect(getZonedDateKey(new Date("2026-09-01T23:00:00Z"), MANILA)).toBe("2026-09-02");
    expect(getZonedParts(new Date("2026-09-01T04:00:00Z"), MANILA).weekday).toBe("tuesday");
  });

  it("parses and rejects time strings", () => {
    expect(timeStringToMinutes("09:30")).toBe(570);
    expect(timeStringToMinutes("9:05")).toBe(545);
    expect(timeStringToMinutes("nope")).toBeNull();
    expect(timeStringToMinutes("25:00")).toBeNull();
    expect(timeStringToMinutes("24:30")).toBeNull();
    expect(timeStringToMinutes("24:00")).toBe(1440);
  });

  it("walks date keys across a month boundary", () => {
    expect(addDaysToDateKey("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysToDateKey("2026-09-01", -1)).toBe("2026-08-31");
  });

  it("accepts only real ordered calendar keys", () => {
    expect(isValidDateKey("2026-02-28")).toBe(true);
    expect(isValidDateKey("2026-02-30")).toBe(false);
    expect(dateKeyRange("2026-09-02", "2026-09-01")).toEqual([]);
  });
});

describe("normalizeAvailability", () => {
  it("falls back to safe defaults for an empty config", () => {
    const policy = normalizeAvailability({});
    expect(policy.timezone).toBe(MANILA);
    expect(policy.defaultDurationMinutes).toBe(60);
    expect(policy.minimumNoticeMinutes).toBe(120);
  });

  it("rejects a garbage timezone instead of throwing", () => {
    expect(normalizeAvailability({ timezone: "Mars/Olympus" }).timezone).toBe(MANILA);
  });

  it("clamps absurd values rather than trusting them", () => {
    const policy = normalizeAvailability({ slot_interval_minutes: 0, buffer_after_minutes: 99999 });
    expect(policy.slotIntervalMinutes).toBe(5);
    expect(policy.bufferAfterMinutes).toBe(240);
  });
});

describe("getDayWindows", () => {
  it("returns the weekly window for a normal day", () => {
    expect(getDayWindows({
      dateKey: "2026-09-01", weekday: "tuesday", weeklySchedule: NINE_TO_FIVE,
    })).toEqual([{ start: 540, end: 1020 }]);
  });

  it("returns nothing on an inactive weekday", () => {
    expect(getDayWindows({
      dateKey: "2026-09-05", weekday: "saturday", weeklySchedule: NINE_TO_FIVE,
    })).toEqual([]);
  });

  it("lets a date override close an otherwise open day", () => {
    expect(getDayWindows({
      dateKey: "2026-09-01",
      weekday: "tuesday",
      weeklySchedule: NINE_TO_FIVE,
      dateOverrides: { "2026-09-01": { active: false } },
    })).toEqual([]);
  });

  it("lets a date override open an otherwise closed day", () => {
    expect(getDayWindows({
      dateKey: "2026-09-05",
      weekday: "saturday",
      weeklySchedule: NINE_TO_FIVE,
      dateOverrides: { "2026-09-05": { active: true, start: "10:00", end: "12:00" } },
    })).toEqual([{ start: 600, end: 720 }]);
  });

  it("supports a split shift", () => {
    expect(getDayWindows({
      dateKey: "2026-09-01",
      weekday: "tuesday",
      weeklySchedule: {
        tuesday: { active: true, windows: [
          { start: "09:00", end: "12:00" },
          { start: "14:00", end: "17:00" },
        ] },
      },
    })).toEqual([{ start: 540, end: 720 }, { start: 840, end: 1020 }]);
  });

  it("drops a window whose end is not after its start instead of inventing hours", () => {
    expect(getDayWindows({
      dateKey: "2026-09-01",
      weekday: "tuesday",
      weeklySchedule: { tuesday: { active: true, start: "17:00", end: "09:00" } },
    })).toEqual([]);
  });
});

describe("mergeIntervals", () => {
  it("merges overlapping and touching intervals", () => {
    expect(mergeIntervals([
      { start: 10, end: 20 }, { start: 15, end: 25 }, { start: 25, end: 30 }, { start: 40, end: 50 },
    ])).toEqual([{ start: 10, end: 30 }, { start: 40, end: 50 }]);
  });
});

describe("buildBusyIntervals", () => {
  it("gives an appointment without an end time the default duration", () => {
    const busy = buildBusyIntervals({
      appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", status: "confirmed" }],
      defaultDurationMinutes: 60,
    });
    expect(busy).toEqual([{
      start: Date.parse("2026-09-01T02:00:00Z"),
      end: Date.parse("2026-09-01T03:00:00Z"),
    }]);
  });

  it("prefers a stored end over the default duration", () => {
    const busy = buildBusyIntervals({
      appointments: [{
        scheduled_at: "2026-09-01T02:00:00Z",
        ends_at: "2026-09-01T04:00:00Z",
        duration_minutes: 120,
        status: "pending",
      }],
    });
    expect(busy[0].end).toBe(Date.parse("2026-09-01T04:00:00Z"));
  });

  it("ignores cancelled viewings and deleted or cancelled events", () => {
    const busy = buildBusyIntervals({
      appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", status: "cancelled" }],
      events: [
        { starts_at: "2026-09-01T05:00:00Z", ends_at: "2026-09-01T06:00:00Z", is_deleted: true },
        { starts_at: "2026-09-01T07:00:00Z", ends_at: "2026-09-01T08:00:00Z", status: "cancelled" },
      ],
    });
    expect(busy).toEqual([]);
  });

  it("counts calendar events as busy alongside viewings", () => {
    const busy = buildBusyIntervals({
      appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", duration_minutes: 60, status: "confirmed" }],
      events: [{ starts_at: "2026-09-01T05:00:00Z", ends_at: "2026-09-01T06:00:00Z" }],
    });
    expect(busy).toHaveLength(2);
  });
});

describe("computeSlots", () => {
  it("produces the host's working hours as UTC instants", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: baseAvailability,
      now: CLOCK,
    });
    // 09:00-17:00 Manila at 60-minute steps with 60-minute viewings = 8 slots,
    // 09:00 through 16:00, which is 01:00Z through 08:00Z.
    expect(slots).toHaveLength(8);
    expect(slots[0].startsAt).toBe("2026-09-01T01:00:00.000Z");
    expect(slots[0].endsAt).toBe("2026-09-01T02:00:00.000Z");
    expect(slots[7].startsAt).toBe("2026-09-01T08:00:00.000Z");
  });

  it("returns nothing on a day the host is closed", () => {
    // 2026-09-05 is a Saturday.
    expect(computeSlots({
      fromDateKey: "2026-09-05",
      toDateKey: "2026-09-05",
      availability: baseAvailability,
      now: CLOCK,
    })).toEqual([]);
  });

  it("never offers a slot that does not fit inside the window", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, default_duration_minutes: 90, slot_interval_minutes: 60 },
      now: CLOCK,
    });
    const last = slots[slots.length - 1];
    // The window closes at 17:00 Manila = 09:00Z; a 90-minute slot must end by then.
    expect(new Date(last.endsAt).getTime()).toBeLessThanOrEqual(Date.parse("2026-09-01T09:00:00Z"));
  });

  it("removes a slot taken by an existing viewing", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: baseAvailability,
      busy: buildBusyIntervals({
        appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", duration_minutes: 60, status: "confirmed" }],
      }),
      now: CLOCK,
    });
    expect(slots.map((s) => s.startsAt)).not.toContain("2026-09-01T02:00:00.000Z");
    expect(slots).toHaveLength(7);
  });

  it("removes a slot taken by a synced calendar event", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: baseAvailability,
      busy: buildBusyIntervals({
        events: [{ starts_at: "2026-09-01T03:00:00Z", ends_at: "2026-09-01T04:00:00Z" }],
      }),
      now: CLOCK,
    });
    expect(slots.map((s) => s.startsAt)).not.toContain("2026-09-01T03:00:00.000Z");
  });

  it("applies buffers around an existing booking", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, buffer_before_minutes: 30, buffer_after_minutes: 30 },
      busy: buildBusyIntervals({
        appointments: [{ scheduled_at: "2026-09-01T03:00:00Z", duration_minutes: 60, status: "confirmed" }],
      }),
      now: CLOCK,
    });
    const starts = slots.map((s) => s.startsAt);
    expect(starts).not.toContain("2026-09-01T03:00:00.000Z"); // the booking itself
    expect(starts).not.toContain("2026-09-01T02:00:00.000Z"); // 30min after-buffer bleeds back
    expect(starts).not.toContain("2026-09-01T04:00:00.000Z"); // 30min before-buffer bleeds forward
    expect(starts).toContain("2026-09-01T01:00:00.000Z");
  });

  it("honours minimum notice against the injected clock", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, minimum_notice_minutes: 180 },
      // 01:00Z on the day itself: 09:00 Manila. With 3h notice the first
      // bookable start is 04:00Z (12:00 Manila).
      now: Date.parse("2026-09-01T01:00:00Z"),
    });
    expect(slots[0].startsAt).toBe("2026-09-01T04:00:00.000Z");
  });

  it("never offers a slot in the past", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: baseAvailability,
      now: Date.parse("2026-09-01T06:00:00Z"),
    });
    expect(slots.every((s) => new Date(s.startsAt) >= new Date("2026-09-01T06:00:00Z"))).toBe(true);
  });

  it("closes a day once the daily cap is reached", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, max_bookings_per_day: 1 },
      busy: buildBusyIntervals({
        appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", duration_minutes: 60, status: "confirmed" }],
      }),
      bookingStarts: ["2026-09-01T02:00:00Z"],
      now: CLOCK,
    });
    expect(slots).toEqual([]);
  });

  it("does not count an unrelated calendar event toward the daily booking cap", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, max_bookings_per_day: 1 },
      busy: buildBusyIntervals({
        events: [{ starts_at: "2026-09-01T02:00:00Z", ends_at: "2026-09-01T03:00:00Z" }],
      }),
      bookingStarts: [],
      now: CLOCK,
    });
    expect(slots.length).toBeGreaterThan(0);
  });

  it("does not offer shifted phantom slots during a DST gap", () => {
    const slots = computeSlots({
      fromDateKey: "2026-03-08",
      toDateKey: "2026-03-08",
      availability: {
        ...baseAvailability,
        timezone: "America/New_York",
        weekly_schedule: {
          sunday: { active: true, start: "02:00", end: "04:00" },
        },
        default_duration_minutes: 30,
        slot_interval_minutes: 30,
      },
      now: Date.parse("2026-03-01T00:00:00Z"),
    });
    const wallHours = slots.map((slot) => (
      getZonedParts(new Date(slot.startsAt), "America/New_York").hour
    ));
    expect(wallHours).not.toContain(2);
  });

  it("computes a host's day in the host's zone even for a far-away host", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-01",
      availability: { ...baseAvailability, timezone: "America/New_York" },
      now: CLOCK,
    });
    // 09:00 New York (UTC-4 in September) is 13:00Z.
    expect(slots[0].startsAt).toBe("2026-09-01T13:00:00.000Z");
  });

  it("spans a multi-day range and skips the weekend", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-04", // Friday
      toDateKey: "2026-09-07",   // Monday
      availability: baseAvailability,
      now: CLOCK,
    });
    const days = [...new Set(slots.map((s) => getZonedDateKey(new Date(s.startsAt), MANILA)))];
    expect(days).toEqual(["2026-09-04", "2026-09-07"]);
  });
});

describe("validateSlot", () => {
  const ctx = { availability: baseAvailability, now: CLOCK };

  it("accepts an offered slot and returns its end", () => {
    const result = validateSlot({ startsAt: "2026-09-01T01:00:00.000Z", ...ctx });
    expect(result).toEqual({ ok: true, endsAt: "2026-09-01T02:00:00.000Z" });
  });

  it("rejects a time inside the window that is not on the slot grid", () => {
    // 01:30Z = 09:30 Manila. Inside working hours, but not an offered start.
    expect(validateSlot({ startsAt: "2026-09-01T01:30:00.000Z", ...ctx }))
      .toEqual({ ok: false, reason: "not_available" });
  });

  it("rejects 3am, the case the old endpoint accepted", () => {
    // 19:00Z = 03:00 Manila the next day — far outside any window.
    expect(validateSlot({ startsAt: "2026-09-01T19:00:00.000Z", ...ctx }).ok).toBe(false);
  });

  it("rejects a day the host marked unavailable", () => {
    expect(validateSlot({
      startsAt: "2026-09-01T01:00:00.000Z",
      availability: { ...baseAvailability, date_overrides: { "2026-09-01": { active: false } } },
      now: CLOCK,
    })).toEqual({ ok: false, reason: "not_available" });
  });

  it("rejects a slot already taken", () => {
    expect(validateSlot({
      startsAt: "2026-09-01T02:00:00.000Z",
      ...ctx,
      busy: buildBusyIntervals({
        appointments: [{ scheduled_at: "2026-09-01T02:00:00Z", duration_minutes: 60, status: "pending" }],
      }),
    })).toEqual({ ok: false, reason: "not_available" });
  });

  it("rejects a past time", () => {
    expect(validateSlot({
      startsAt: "2026-09-01T01:00:00.000Z",
      availability: baseAvailability,
      now: Date.parse("2026-09-02T00:00:00Z"),
    })).toEqual({ ok: false, reason: "in_the_past" });
  });

  it("rejects a time inside the minimum-notice window with its own reason", () => {
    expect(validateSlot({
      startsAt: "2026-09-01T01:00:00.000Z",
      availability: { ...baseAvailability, minimum_notice_minutes: 120 },
      now: Date.parse("2026-09-01T00:30:00Z"),
    })).toEqual({ ok: false, reason: "too_soon" });
  });

  it("rejects unparseable input instead of throwing", () => {
    expect(validateSlot({ startsAt: "not a date", ...ctx }))
      .toEqual({ ok: false, reason: "invalid_time" });
  });

  it("agrees with computeSlots on every slot it offers", () => {
    const slots = computeSlots({
      fromDateKey: "2026-09-01",
      toDateKey: "2026-09-03",
      availability: baseAvailability,
      now: CLOCK,
    });
    expect(slots.length).toBeGreaterThan(0);
    for (const slot of slots) {
      expect(validateSlot({ startsAt: slot.startsAt, ...ctx }).ok).toBe(true);
    }
  });
});
