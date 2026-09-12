import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// U-010 — /api/reactions was an unauthenticated POST that wrote a row into
// Airtable with no validation, no allowlist, no length caps and no rate limit.
// It also caught every error and returned { ok: true } regardless, so a total
// write failure was indistinguishable from a success.
//
// A-142 — the Airtable table never existed, so every reaction was lost.
// Reactions now land in Supabase `property_reactions`, anonymously.

const mocks = vi.hoisted(() => {
  const insert = vi.fn();
  const from = vi.fn(() => ({ insert }));
  return { insert, from, client: { from } };
});

vi.mock("@/lib/supabaseAdmin", () => ({
  get supabaseAdmin() {
    return mocks.client;
  },
}));

const { POST, REACTION_TYPES } = await import("@/app/api/reactions/route");

let ipCounter = 0;
const request = (body, ip) =>
  new Request("https://www.scoutit.space/api/reactions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // Each test gets its own identity so the in-process limiter does not
      // leak state between cases.
      "x-forwarded-for": ip || `198.51.100.${(ipCounter += 1)}`,
      "user-agent": "vitest-agent",
      authorization: "Bearer someone-signed-in",
    },
    body: JSON.stringify(body),
  });

const validBody = (overrides = {}) => ({
  property_id: "rec1234567890",
  reaction_type: "Save",
  city: "Taguig",
  category: "commercial",
  ...overrides,
});

describe("/api/reactions", () => {
  beforeEach(() => {
    mocks.client = { from: mocks.from };
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.from.mockClear();
  });

  afterEach(() => vi.restoreAllMocks());

  it("records a well-formed reaction in property_reactions", async () => {
    const res = await POST(request(validBody()));

    expect(res.status).toBe(200);
    expect(mocks.from).toHaveBeenCalledWith("property_reactions");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("stores the reaction anonymously — exactly four fields, no identity", async () => {
    await POST(request(validBody()));

    const row = mocks.insert.mock.calls[0][0];
    expect(row).toEqual({
      property_ref: "rec1234567890",
      reaction_type: "Save",
      city: "Taguig",
      category: "commercial",
    });
    expect(JSON.stringify(row)).not.toMatch(/198\.51\.100|vitest-agent|someone-signed-in/);
  });

  it("rejects a reaction_type outside the allowlist without writing", async () => {
    const res = await POST(request(validBody({ reaction_type: "arbitrary-string" })));

    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an oversized field instead of writing it", async () => {
    const res = await POST(request(validBody({ city: "x".repeat(5000) })));

    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a property_id that is not a plausible record reference", async () => {
    const res = await POST(request(validBody({ property_id: { $ne: null } })));

    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("reports a failed write instead of claiming success", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "42P01", message: "relation missing" } });

    const res = await POST(request(validBody()));
    const payload = await res.json();

    expect(res.status).toBe(502);
    expect(payload.ok).not.toBe(true);
  });

  it("answers 503 when no service client is configured", async () => {
    mocks.client = null;

    const res = await POST(request(validBody()));

    expect(res.status).toBe(503);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rate-limits a flood from one identity", async () => {
    const ip = "198.51.100.250";
    const results = [];
    for (let i = 0; i < 40; i += 1) {
      results.push((await POST(request(validBody(), ip))).status);
    }

    expect(results).toContain(429);
  });

  it("does not leak database error text to the caller", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "XX000", message: "SUPABASE_KEY=secret leaked" } });

    const payload = await (await POST(request(validBody()))).json();

    expect(JSON.stringify(payload)).not.toContain("secret");
  });
});

// The allowlist, the UI and the database are three lists that must stay
// identical. The first draft of the allowlist invented its own vocabulary
// ("love", "saved") and would have rejected every real reaction the product
// actually sends. A drift guard is cheaper than that outage.
describe("the allowlist matches what the UI sends and the database accepts", () => {
  const fs = require("node:fs");

  it("accepts every reaction_type defined in ReactionButtons", () => {
    const source = fs.readFileSync("src/components/ui/ReactionButtons.js", "utf8");
    const shapes = source.slice(source.indexOf("const REACTION_SHAPES"));
    const uiTypes = [...shapes.matchAll(/^\s{2}"([^"]+)":\s*\{/gm)].map((m) => m[1]);

    expect(uiTypes.length).toBeGreaterThan(0);
    for (const type of uiTypes) {
      expect(REACTION_TYPES).toContain(type);
    }
  });

  it("accepts the reaction_type BottomNav sends", () => {
    const source = fs.readFileSync("src/components/layout/BottomNav.js", "utf8");
    const match = source.match(/reaction_type:\s*"([^"]+)"/);

    expect(match).not.toBeNull();
    expect(REACTION_TYPES).toContain(match[1]);
  });

  it("the migration's CHECK constraint holds the same four types", () => {
    const sql = fs.readFileSync("supabase/migrations/20260911000005_property_reactions.sql", "utf8");
    const check = sql.match(/reaction_type IN \(([^)]*)\)/);

    expect(check).not.toBeNull();
    const dbTypes = [...check[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect([...dbTypes].sort()).toEqual([...REACTION_TYPES].sort());
  });

  it("the migration keeps the table server-only and identity-free", () => {
    const sql = fs
      .readFileSync("supabase/migrations/20260911000005_property_reactions.sql", "utf8")
      .replace(/--.*$/gm, "");

    expect(sql).toMatch(/ENABLE ROW LEVEL SECURITY/);
    expect(sql).toMatch(/REVOKE ALL ON TABLE public\.property_reactions FROM PUBLIC, anon, authenticated/);
    // The columns, not the table comment (which names what is absent).
    const columns = sql.slice(sql.indexOf("CREATE TABLE"), sql.indexOf("CREATE INDEX"));
    expect(columns).toContain("property_ref");
    expect(columns).not.toMatch(/user|viewer|device|\bip\b|ip_address|agent/i);
  });
});
