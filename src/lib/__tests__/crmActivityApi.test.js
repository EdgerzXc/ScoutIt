import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/crm/activity/route";
import * as serverAuth from "@/lib/serverAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

vi.mock("@/lib/serverAuth", () => ({ resolveUserId: vi.fn() }));
vi.mock("@/lib/supabaseAdmin", () => ({ supabaseAdmin: { from: vi.fn() } }));

const USER = "11111111-1111-4111-8111-111111111111";
const PROPERTY = "22222222-2222-4222-8222-222222222222";
const OWNER_DEAL = "33333333-3333-4333-8333-333333333333";
const ACTIVITY = "44444444-4444-4444-8444-444444444444";

let activityScope = "";

function queryFor(table) {
  const filters = {};
  const chain = {
    select: () => chain,
    eq: (column, value) => {
      filters[column] = value;
      return chain;
    },
    in: (column, value) => {
      filters[column] = value;
      return chain;
    },
    or: (value) => {
      if (table === "crm_activity_log") activityScope = value;
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    then(resolve, reject) {
      let result;
      if (table === "properties") {
        result = { data: [{ id: PROPERTY, title: "Owner Property" }], error: null };
      } else if (table === "deals" && filters.property_id) {
        result = { data: [{ id: OWNER_DEAL }], error: null };
      } else if (table === "deals") {
        result = { data: [], error: null };
      } else if (table === "crm_activity_log") {
        result = {
          data: [{
            id: ACTIVITY,
            deal_id: OWNER_DEAL,
            property_id: null,
            activity_type: "status_change",
            actor_id: USER,
            metadata: {},
            created_at: "2026-08-29T01:00:00.000Z",
          }],
          error: null,
        };
      } else {
        throw new Error(`Unexpected table: ${table}`);
      }
      return Promise.resolve(result).then(resolve, reject);
    },
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  activityScope = "";
  serverAuth.resolveUserId.mockResolvedValue(USER);
  supabaseAdmin.from.mockImplementation(queryFor);
});

describe("GET /api/crm/activity merged feed", () => {
  it("includes deals reached through property ownership even when a row has no property_id", async () => {
    const response = await GET(new Request("http://localhost/api/crm/activity"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(activityScope).toContain(OWNER_DEAL);
    expect(body.activity).toHaveLength(1);
    expect(body.activity[0].dealId).toBe(OWNER_DEAL);
  });

  it("rejects malformed ids before they reach Postgres", async () => {
    const response = await GET(new Request("http://localhost/api/crm/activity?dealId=not-a-uuid"));
    expect(response.status).toBe(400);
  });
});
