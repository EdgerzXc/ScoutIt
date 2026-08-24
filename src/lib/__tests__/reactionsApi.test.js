import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// U-010 — /api/reactions was an unauthenticated POST that wrote a row into
// Airtable with no validation, no allowlist, no length caps and no rate limit.
// It also caught every error and returned { ok: true } regardless, so a total
// write failure was indistinguishable from a success.

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
  let fetchSpy;

  beforeEach(() => {
    process.env.AIRTABLE_API_KEY = "keyTest";
    process.env.AIRTABLE_BASE_ID = "appTest";
    process.env.AIRTABLE_REACTIONS_TABLE_ID = "tblTest";
    fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(JSON.stringify({ id: "rec1" }), { status: 200 }));
  });

  afterEach(() => vi.restoreAllMocks());

  it("accepts a well-formed reaction", async () => {
    const res = await POST(request(validBody()));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("rejects a reaction_type outside the allowlist without writing", async () => {
    const res = await POST(request(validBody({ reaction_type: "arbitrary-string" })));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects an oversized field instead of forwarding it to Airtable", async () => {
    const res = await POST(request(validBody({ city: "x".repeat(5000) })));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects a property_id that is not a plausible record reference", async () => {
    const res = await POST(request(validBody({ property_id: { $ne: null } })));

    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports a failed Airtable write instead of claiming success", async () => {
    fetchSpy.mockResolvedValue(new Response("upstream exploded", { status: 500 }));

    const res = await POST(request(validBody()));
    const payload = await res.json();

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(payload.ok).not.toBe(true);
  });

  it("rate-limits a flood from one identity", async () => {
    const ip = "198.51.100.250";
    const results = [];
    for (let i = 0; i < 40; i += 1) {
      results.push((await POST(request(validBody(), ip))).status);
    }

    expect(results).toContain(429);
  });

  it("does not leak upstream error text to the caller", async () => {
    fetchSpy.mockResolvedValue(new Response("AIRTABLE_KEY=secret leaked", { status: 500 }));

    const payload = await (await POST(request(validBody()))).json();

    expect(JSON.stringify(payload)).not.toContain("secret");
  });
});

// The allowlist and the UI are two lists that must stay identical. This test is
// here because the first draft of the allowlist invented its own vocabulary
// ("love", "saved") and would have rejected every real reaction the product
// actually sends. A drift guard is cheaper than that outage.
describe("the allowlist matches what the UI actually sends", () => {
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
});
