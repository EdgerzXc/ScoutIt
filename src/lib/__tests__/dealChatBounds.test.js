import { describe, it, expect, vi, beforeEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────
// A-236 (GAP-102). The deal chat write path had no size bound and no rate
// limit. Each accepted message stored a row AND notified every
// counterparty, so a script could write a thousand rows and fire a
// thousand emails in a minute.
//
// The bounds must be checked BEFORE the write: a refused message must cost
// no row, no notification and no email.
// ─────────────────────────────────────────────────────────────────────────

const state = vi.hoisted(() => ({
  user: "user-a",
  inserted: [],
  notifications: 0,
}));

function rowsFor(table, filters) {
  const match = (row) => filters.every(([k, v]) => row[k] === v);
  if (table === "deals") {
    return [
      {
        id: "deal-1",
        status: "accepted",
        property_id: "prop-1",
        buyer_id: state.user,
        broker_id: null,
        properties: { id: "prop-1", title: "Tower One", owner_id: "owner-1" },
      },
    ].filter(match);
  }
  if (table === "deal_routing_recipients") return [];
  if (table === "user_profiles") {
    return [{ id: state.user, is_shadowbanned: false, archived_at: null }].filter(match);
  }
  return [];
}

function admin() {
  return {
    from(table) {
      const filters = [];
      let insertRows = null;
      const q = {
        select() {
          return q;
        },
        eq(key, value) {
          filters.push([key, value]);
          return q;
        },
        insert(rows) {
          insertRows = rows;
          return q;
        },
        async single() {
          if (insertRows) {
            state.inserted.push(...insertRows);
            return { data: { id: "msg-1", ...insertRows[0] }, error: null };
          }
          const rows = rowsFor(table, filters);
          return { data: rows[0] ?? null, error: rows.length ? null : { message: "No rows" } };
        },
        async maybeSingle() {
          const rows = rowsFor(table, filters);
          return { data: rows[0] ?? null, error: null };
        },
        then(resolve) {
          resolve({ data: rowsFor(table, filters), error: null });
        },
      };
      return q;
    },
  };
}

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return admin();
  },
}));
vi.mock("@/lib/serverAuth", () => ({
  resolveUserId: async () => state.user,
}));
vi.mock("@/lib/notifications", () => ({
  notifyUser: async () => {
    state.notifications += 1;
    return true;
  },
}));

const { POST } = await import("@/app/api/deals/[id]/messages/route");

const post = (body, user = state.user) => {
  state.user = user;
  return POST(
    new Request("https://www.scoutit.space/api/deals/deal-1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: "Bearer tok" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "deal-1" }) }
  );
};

beforeEach(() => {
  state.inserted = [];
  state.notifications = 0;
});

describe("A-236 deal chat bounds", () => {
  it("still accepts an ordinary message", async () => {
    const res = await post({ body: "Is this still available?" }, "user-normal");
    expect(res.status).toBe(200);
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0].body).toBe("Is this still available?");
    expect(state.notifications).toBe(1);
  });

  it("refuses an empty message", async () => {
    const res = await post({ body: "   " }, "user-empty");
    expect(res.status).toBe(400);
    expect(state.inserted).toHaveLength(0);
  });

  it("refuses a body that is not a string", async () => {
    const res = await post({ body: { nested: "object" } }, "user-object");
    expect(res.status).toBe(400);
    expect(state.inserted).toHaveLength(0);
  });

  it("refuses an oversized message with 413 and stores nothing", async () => {
    const res = await post({ body: "x".repeat(2001) }, "user-oversize");
    expect(res.status).toBe(413);
    expect(state.inserted).toHaveLength(0);
    expect(state.notifications).toBe(0);
    const data = await res.json();
    expect(data.code).toBe("MESSAGE_TOO_LONG");
  });

  it("accepts a message exactly at the limit", async () => {
    const res = await post({ body: "x".repeat(2000) }, "user-exact");
    expect(res.status).toBe(200);
    expect(state.inserted).toHaveLength(1);
  });

  it("stops a burst and stores nothing past the limit", async () => {
    const user = "user-burst";
    for (let i = 0; i < 20; i += 1) {
      const res = await post({ body: `message ${i}` }, user);
      expect(res.status).toBe(200);
    }
    const blocked = await post({ body: "message 21" }, user);
    expect(blocked.status).toBe(429);
    const data = await blocked.json();
    expect(data.code).toBe("MESSAGE_RATE_LIMIT");
    expect(blocked.headers.get("Retry-After")).toBeTruthy();

    // 20 stored, the 21st refused — and the refusal cost no row and no email.
    expect(state.inserted).toHaveLength(20);
    expect(state.notifications).toBe(20);
  });
});
