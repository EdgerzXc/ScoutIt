import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/deals/[id]/slots/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getBookableSlots,
  loadAvailabilityPolicy,
} from "@/lib/calendar/availabilityService";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));
vi.mock("@/lib/calendar/availabilityService", () => ({
  loadAvailabilityPolicy: vi.fn(),
  getBookableSlots: vi.fn(),
}));

const USER = "11111111-1111-4111-8111-111111111111";
const HOST = "22222222-2222-4222-8222-222222222222";
const DEAL_ID = "33333333-3333-4333-8333-333333333333";

let deal;

function mockDealRead() {
  supabaseAdmin.from.mockImplementation((table) => {
    if (table !== "deals") throw new Error(`Unexpected table: ${table}`);
    const chain = {
      select: () => chain,
      eq: () => chain,
      single: async () => ({ data: deal, error: null }),
    };
    return chain;
  });
}

const get = (query = "") => GET(
  new Request(`http://localhost/api/deals/${DEAL_ID}/slots${query}`),
  { params: Promise.resolve({ id: DEAL_ID }) },
);

beforeEach(() => {
  vi.clearAllMocks();
  deal = {
    id: DEAL_ID,
    status: "accepted",
    buyer_id: USER,
    broker_id: null,
    properties: { id: "44444444-4444-4444-8444-444444444444", owner_id: HOST },
  };
  serverAuth.resolveUserId.mockResolvedValue(USER);
  loadAvailabilityPolicy.mockResolvedValue({
    timezone: "Asia/Manila",
    defaultDurationMinutes: 60,
  });
  getBookableSlots.mockResolvedValue({
    slots: [{ startsAt: "2026-09-01T01:00:00.000Z", endsAt: "2026-09-01T02:00:00.000Z" }],
    timezone: "Asia/Manila",
  });
  mockDealRead();
});

describe("GET /api/deals/[id]/slots", () => {
  it("rejects impossible dates instead of normalizing them silently", async () => {
    expect((await get("?from=2026-02-30&to=2026-03-01")).status).toBe(400);
  });

  it("rejects a reversed range instead of walking the maximum fallback range", async () => {
    expect((await get("?from=2026-09-10&to=2026-09-01")).status).toBe(400);
  });

  it("rejects fractional and out-of-range durations", async () => {
    expect((await get("?duration=30.5")).status).toBe(400);
    expect((await get("?duration=999")).status).toBe(400);
  });

  it("does not advertise slots for a closed deal", async () => {
    deal.status = "closed";
    expect((await get()).status).toBe(409);
    expect(getBookableSlots).not.toHaveBeenCalled();
  });

  it("returns the exact effective duration used to compute the slots", async () => {
    const response = await get("?from=2026-09-01&to=2026-09-02&duration=45");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.durationMinutes).toBe(45);
    expect(getBookableSlots).toHaveBeenCalledWith(supabaseAdmin, expect.objectContaining({
      hostId: HOST,
      durationMinutes: 45,
    }));
  });
});
