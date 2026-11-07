import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabaseAdmin
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockIn = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: (...args) => mockFrom(...args),
  },
}));

vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: vi.fn(async () => "viewer-123"),
  assertAdultEligibility: vi.fn(async () => true),
}));

import { listSavedSignals } from "../communityStore";

describe("A-324: Saved Signals Expiration Filter & Feed Parity (D-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters out expired signals (older than 7 days) by default", async () => {
    const now = new Date("2026-11-07T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const freshDate = new Date("2026-11-05T12:00:00Z").toISOString(); // 2 days ago -> fresh
    const expiredDate = new Date("2026-10-25T12:00:00Z").toISOString(); // 13 days ago -> expired

    mockFrom.mockImplementation((table) => {
      if (table === "signal_saves") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { signal_id: "sig-fresh", created_at: "2026-11-06T00:00:00Z" },
                  { signal_id: "sig-expired", created_at: "2026-11-06T00:00:00Z" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "stratosphere_signals") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sig-fresh",
                  author_account_id: "author-1",
                  scout_id_snapshot: "SC-001",
                  public_identity_mode: "anonymous",
                  signal_type: "LOOKING_FOR",
                  status: "live",
                  title: "Fresh Signal",
                  body: "Looking for space",
                  created_at: freshDate,
                  last_confirmed_at: freshDate,
                },
                {
                  id: "sig-expired",
                  author_account_id: "author-2",
                  scout_id_snapshot: "SC-002",
                  public_identity_mode: "anonymous",
                  signal_type: "LOOKING_FOR",
                  status: "live",
                  title: "Expired Signal",
                  body: "Old listing",
                  created_at: expiredDate,
                  last_confirmed_at: expiredDate,
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "signal_locations" || table === "signal_requirements") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "deals") {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "user_behavioral_metrics") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    // Default call: includeExpired defaults to false
    const result = await listSavedSignals("viewer-123");
    expect(result.signals).toHaveLength(1);
    expect(result.signals[0].id).toBe("sig-fresh");
    expect(result.signals[0].freshness).toBe("fresh");

    vi.useRealTimers();
  });

  it("retains expired signals when includeExpired=true is explicitly requested", async () => {
    const now = new Date("2026-11-07T12:00:00Z");
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const freshDate = new Date("2026-11-05T12:00:00Z").toISOString();
    const expiredDate = new Date("2026-10-25T12:00:00Z").toISOString();

    mockFrom.mockImplementation((table) => {
      if (table === "signal_saves") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: [
                  { signal_id: "sig-fresh", created_at: "2026-11-06T00:00:00Z" },
                  { signal_id: "sig-expired", created_at: "2026-11-06T00:00:00Z" },
                ],
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "stratosphere_signals") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [
                {
                  id: "sig-fresh",
                  author_account_id: "author-1",
                  scout_id_snapshot: "SC-001",
                  public_identity_mode: "anonymous",
                  signal_type: "LOOKING_FOR",
                  status: "live",
                  title: "Fresh Signal",
                  body: "Looking for space",
                  created_at: freshDate,
                  last_confirmed_at: freshDate,
                },
                {
                  id: "sig-expired",
                  author_account_id: "author-2",
                  scout_id_snapshot: "SC-002",
                  public_identity_mode: "anonymous",
                  signal_type: "LOOKING_FOR",
                  status: "live",
                  title: "Expired Signal",
                  body: "Old listing",
                  created_at: expiredDate,
                  last_confirmed_at: expiredDate,
                },
              ],
              error: null,
            }),
          }),
        };
      }
      if (table === "signal_locations" || table === "signal_requirements") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      if (table === "deals") {
        return {
          select: vi.fn().mockReturnValue({
            is: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                not: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "user_behavioral_metrics") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      };
    });

    const result = await listSavedSignals("viewer-123", { includeExpired: true });
    expect(result.signals).toHaveLength(2);
    expect(result.signals[0].id).toBe("sig-fresh");
    expect(result.signals[1].id).toBe("sig-expired");
    expect(result.signals[1].freshness).toBe("expired");

    vi.useRealTimers();
  });
});
