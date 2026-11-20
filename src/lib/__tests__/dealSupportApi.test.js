// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isSensitivePath } from "@/lib/sensitiveRoutes";

const buyer = "10000000-0000-4000-8000-000000000001";
const broker = "10000000-0000-4000-8000-000000000002";
const owner = "10000000-0000-4000-8000-000000000003";
const routed = "10000000-0000-4000-8000-000000000004";
const outsider = "10000000-0000-4000-8000-000000000005";
const dealId = "10000000-0000-4000-8000-000000000006";
const requestId = "10000000-0000-4000-8000-000000000007";
const message = "I could not attach a document.";
const mocks = vi.hoisted(() => ({
  resolveUserId: vi.fn(), isRoutedDealRecipient: vi.fn(), getUserById: vi.fn(), from: vi.fn(),
}));

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: mocks.resolveUserId }));
vi.mock("@/lib/dealParty", () => ({ isRoutedDealRecipient: mocks.isRoutedDealRecipient }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: { from: mocks.from, auth: { admin: { getUserById: mocks.getUserById } } },
}));

let POST;
let rows;
let inserted;
let failure;

function table(name) {
  const filters = {};
  const query = {
    select: () => query,
    eq: (field, value) => { filters[field] = value; return query; },
    maybeSingle: async () => {
      const row = name === "deals"
        ? { id: dealId, buyer_id: buyer, broker_id: broker, properties: { owner_id: owner } }
        : rows.get(filters.id);
      return { data: row && Object.entries(filters).every(([key, value]) => row[key] === value) ? row : null };
    },
    insert: async (row) => {
      inserted.push(row);
      if (failure) return { error: failure };
      if (rows.has(row.id)) return { error: { code: "23505" } };
      rows.set(row.id, row);
      return { error: null };
    },
  };
  return query;
}

function submit(overrides = {}, id = dealId) {
  return POST(new Request(`https://scoutit.space/api/deals/${id}/support`, {
    method: "POST",
    body: JSON.stringify({ requestId, category: "glitch", message, ...overrides }),
  }), { params: Promise.resolve({ id }) });
}

describe("private deal-room support intake", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    rows = new Map();
    inserted = [];
    failure = null;
    mocks.resolveUserId.mockResolvedValue(buyer);
    mocks.isRoutedDealRecipient.mockImplementation(async (_db, id, user) => id === dealId && user === routed);
    mocks.getUserById.mockResolvedValue({ data: { user: { email: "participant@example.test", email_confirmed_at: "2026-11-20" } } });
    mocks.from.mockImplementation(table);
    ({ POST } = await import("@/app/api/deals/[id]/support/route"));
  });

  afterEach(() => vi.restoreAllMocks());

  it.each([buyer, broker, owner, routed])("accepts an authorized participant and queues the ticket under Direct Support", async (user) => {
    mocks.resolveUserId.mockResolvedValue(user);
    const response = await submit({ email: "forged@example.test", status: "resolved" });
    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ticketId: requestId });
    expect(inserted).toEqual([{
      id: requestId, user_id: user, name: "ScoutIt member", email: "participant@example.test",
      subject: `[DIRECT SUPPORT] Deal room ${dealId} · Technical issue or upload error`,
      message, status: "new",
    }]);
    expect(mocks.from.mock.calls.flat()).toEqual(["deals", "contact_messages"]);
  });

  it("denies signed-out users and hides the deal from nonparticipants", async () => {
    mocks.resolveUserId.mockResolvedValueOnce(null);
    expect((await submit()).status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.resolveUserId.mockResolvedValueOnce(outsider);
    expect((await submit()).status).toBe(404);
    expect(mocks.getUserById).not.toHaveBeenCalled();
    expect(inserted).toEqual([]);
  });

  it("rejects invalid inputs and accounts without a confirmed email", async () => {
    expect((await submit({ message: " " })).status).toBe(400);
    expect((await submit({ message: "x".repeat(4001) })).status).toBe(400);
    expect((await submit({ category: "urgent" })).status).toBe(400);
    expect((await submit({}, "invalid-id")).status).toBe(400);
    expect(mocks.from).not.toHaveBeenCalled();
    mocks.getUserById.mockResolvedValue({ data: { user: { email: "unverified@example.test" } } });
    expect((await submit()).status).toBe(422);
    expect(inserted).toEqual([]);
  });

  it("returns the existing receipt on a retry and denies collisions with other tickets", async () => {
    expect((await submit()).status).toBe(201);
    const retry = await submit();
    expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual({ ticketId: requestId });
    expect((await submit({ message: "Changed text" })).status).toBe(409);
    mocks.resolveUserId.mockResolvedValue(broker);
    expect((await submit()).status).toBe(409);
    expect(rows.size).toBe(1);
    expect(rows.get(requestId).user_id).toBe(buyer);
  });

  it("returns no receipt when persistence fails and meters repeated valid requests", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    failure = { code: "XX000", message: "raw database detail" };
    const response = await submit();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "We could not save your support request. Please try again." });
    expect(rows.size).toBe(0);
    for (let remaining = 7; remaining > 0; remaining -= 1) await submit();
    const blocked = await submit();
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(isSensitivePath(`/api/deals/${dealId}/support`)).toBe(true);
  });
});
