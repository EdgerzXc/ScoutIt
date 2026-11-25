import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ actor: null, client: null, rows: {}, calls: [], fail: null }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => state.actor }));
vi.mock("@/lib/supabaseAdmin", () => ({ get supabaseAdmin() { return state.client; } }));

const { GET } = await import("@/app/api/dashboard/inventory/route");
const request = new Request("https://www.scoutit.space/api/dashboard/inventory?owner_id=another-owner");
const uuid = (i) => `10000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const A = uuid(1);
const B = uuid(2);
const OTHER = uuid(3);

beforeEach(() => {
  state.actor = "owner";
  state.fail = null;
  state.calls = [];
  state.rows = {
    properties: [
      { id: A, owner_id: "owner", slug: "one", canonical_slug: "the-one" },
      { id: B, owner_id: "owner", slug: "two", canonical_slug: "the-two" },
      { id: OTHER, owner_id: "another-owner", slug: "other" },
    ],
    saved_intel: [
      ...Array.from({ length: 1010 }, (_, i) => ({ id: uuid(i + 10), property_id: A })),
      { id: uuid(2001), property_id: OTHER },
    ],
    property_units: [
      { id: uuid(2002), property_id: A, availability_status: "occupied" },
      { id: uuid(2003), property_id: A, availability_status: "available" },
      { id: uuid(2004), property_id: B, availability_status: "maintenance" },
    ],
  };
  state.client = {
    from(table) {
      let propertyIds;
      let owner;
      let after;
      let limit;
      const builder = {
        select: () => builder,
        order: () => builder,
        eq: (_column, value) => { owner = value; return builder; },
        in: (_column, values) => { propertyIds = values; return builder; },
        gt: (_column, value) => { after = value; return builder; },
        limit: (value) => { limit = value; return builder; },
        then(resolve) {
          state.calls.push({ table, owner, propertyIds, after });
          if (state.fail?.(table, after)) return resolve({ data: null, error: { code: "57014" } });
          const data = state.rows[table]
            .filter((row) => (!owner || row.owner_id === owner) && (!propertyIds || propertyIds.includes(row.property_id)))
            .filter((row) => !after || row.id > after)
            .sort((a, b) => a.id.localeCompare(b.id))
            .slice(0, Math.min(limit, 200));
          return resolve({ data, error: null });
        },
      };
      return builder;
    },
  };
});

it("counts every UUID-scoped save across pages and separates actual zero", async () => {
  const res = await GET(request);
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({
    properties: [{ id: A, saved_count: 1010 }, { id: B, saved_count: 0 }],
    stats: { total: 3, occupied: 1, vacant: 1, maintenance: 1, saved_intel_count: 1010 },
  });
  expect(state.calls.filter(({ table }) => table === "saved_intel").length).toBeGreaterThan(5);
  expect(state.calls.filter(({ table }) => table !== "properties").every((call) => (
    JSON.stringify(call.propertyIds) === JSON.stringify([A, B])
  ))).toBe(true);
});

it("preserves inventory and marks counts unknown if a later metrics page fails", async () => {
  state.fail = (table, after) => table === "saved_intel" && Boolean(after);
  const res = await GET(request);
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({
    properties: [{ id: A, saved_count: null }, { id: B, saved_count: null }],
    stats: { total: 3, saved_intel_count: null },
  });
});

it("returns a genuine empty inventory without querying related rows", async () => {
  state.rows.properties = [];
  expect(await (await GET(request)).json()).toEqual({
    properties: [], units: [],
    stats: { total: 0, occupied: 0, vacant: 0, maintenance: 0, saved_intel_count: 0 },
  });
  expect(state.calls.map(({ table }) => table)).toEqual(["properties"]);
});

it("separates authorization, configuration failure and a failed unit read", async () => {
  state.fail = (table) => table === "property_units";
  expect((await GET(request)).status).toBe(503);
  state.client = null;
  expect((await GET(request)).status).toBe(503);
  state.actor = null;
  expect((await GET(request)).status).toBe(401);
});
