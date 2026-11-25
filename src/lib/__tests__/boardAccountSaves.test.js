import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ actor: "account", error: null, missingReactionCol: false, queries: [] }));
vi.mock("@/lib/serverAuth", () => ({ resolveUserId: async () => state.actor }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from(table) {
      const query = { table, filter: {}, cursor: null, deleted: false };
      const builder = {
        select: (columns) => { query.columns = columns; return builder; },
        delete: () => { query.deleted = true; return builder; },
        eq: (key, value) => { query.filter[key] = value; return builder; },
        gt: (_key, value) => { query.cursor = value; return builder; },
        not: () => builder,
        order: () => builder,
        limit: () => builder,
        then(resolve) {
          state.queries.push(query);
          if (state.error) return resolve({ error: state.error });
          if (state.missingReactionCol && query.columns?.includes("reaction_type")) {
            return resolve({ error: { code: "42703", message: "column saved_intel.reaction_type does not exist" } });
          }
          return resolve({
            data: query.cursor || query.deleted ? [] : [{
              id: "first",
              property_id: "10000000-0000-4000-8000-000000000001",
              properties: { canonical_slug: "a-public-listing" },
              created_at: "2026-11-13T00:00:00Z",
            }],
          });
        },
      };
      return builder;
    },
  },
}));

const { GET, DELETE } = await import("@/app/api/wishlist/saved/route");
const url = "https://www.scoutit.space/api/wishlist/saved?user_id=someone-else";
const id = "10000000-0000-4000-8000-000000000001";

beforeEach(() => {
  state.actor = "account";
  state.error = null;
  state.missingReactionCol = false;
  state.queries = [];
});

it("resolves public URLs while retaining the UUID used to remove an account save", async () => {
  const res = await GET(new Request(url));
  expect(await res.json()).toEqual({
    items: [{ account_property_id: id, property_id: "a-public-listing", created_at: "2026-11-13T00:00:00Z", reaction_type: "Save" }],
  });
  expect(state.queries.map(({ filter, cursor }) => [filter, cursor])).toEqual([
    [{ user_id: "account" }, null], [{ user_id: "account" }, "first"],
  ]);
  expect(state.queries[0].columns).toContain("properties!saved_intel_property_id_fkey(canonical_slug)");
});

it("only removes rows for the signed-in account and selected property UUID", async () => {
  const response = await DELETE(new Request(url, {
    method: "DELETE", body: JSON.stringify({ propertyId: id, userId: "someone-else" }),
  }));
  expect(response.status).toBe(200);
  expect(state.queries).toMatchObject([{ table: "saved_intel", filter: { user_id: "account", property_id: id }, deleted: true }]);
});

it("keeps a failed account read distinct from a signed-out request", async () => {
  state.error = { code: "57014" };
  expect((await GET(new Request(url))).status).toBe(503);
  state.actor = null;
  expect((await GET(new Request(url))).status).toBe(401);
});

it("falls back cleanly when saved_intel lacks reaction_type column (live schema)", async () => {
  state.missingReactionCol = true;
  const res = await GET(new Request(url));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({
    items: [{ account_property_id: id, property_id: "a-public-listing", created_at: "2026-11-13T00:00:00Z", reaction_type: "Save" }],
  });
  expect(state.queries[0].columns).toContain("reaction_type");
  expect(state.queries[1].columns).not.toContain("reaction_type");
});
