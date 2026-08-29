import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listEvents: vi.fn(),
  insert: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      if (table !== "calendar_events") throw new Error(`Unexpected table: ${table}`);
      const chain = {
        select: () => chain,
        eq: () => chain,
        maybeSingle: mocks.maybeSingle,
        insert: mocks.insert,
      };
      return chain;
    },
  },
}));

vi.mock("./connectionStore", () => ({
  getValidGoogleAccessToken: vi.fn(async () => "token"),
  markConnectionStatus: vi.fn(),
}));

vi.mock("./googleClient", () => ({
  listEvents: mocks.listEvents,
  insertEvent: vi.fn(),
  patchEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

import { pullInbound } from "./googleSync";

const event = (id, hour) => ({
  id,
  status: "confirmed",
  summary: `Event ${id}`,
  start: { dateTime: `2026-09-01T${hour}:00:00.000Z` },
  end: { dateTime: `2026-09-01T${String(Number(hour) + 1).padStart(2, "0")}:00:00.000Z` },
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
  mocks.insert.mockResolvedValue({ error: null });
});

describe("pullInbound", () => {
  it("walks every Google page instead of silently stopping at the first", async () => {
    mocks.listEvents
      .mockResolvedValueOnce({ items: [event("one", "01")], nextPageToken: "page-2" })
      .mockResolvedValueOnce({ items: [event("two", "03")] });

    const result = await pullInbound("user-1", {
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-10-01T00:00:00.000Z",
    });

    expect(result.created).toBe(2);
    expect(mocks.insert).toHaveBeenCalledTimes(2);
    expect(mocks.listEvents).toHaveBeenNthCalledWith(2, "token", expect.objectContaining({
      pageToken: "page-2",
    }));
  });

  it("does not report a successful sync when the local write failed", async () => {
    mocks.listEvents.mockResolvedValue({ items: [event("one", "01")] });
    mocks.insert.mockResolvedValue({ error: { message: "database unavailable" } });

    await expect(pullInbound("user-1", {
      from: "2026-08-01T00:00:00.000Z",
      to: "2026-10-01T00:00:00.000Z",
    })).rejects.toThrow("Calendar event insert failed");
  });
});
