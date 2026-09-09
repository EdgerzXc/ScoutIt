import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A-079 — `src/lib/airtable.js` had no `offset` handling anywhere. The Airtable
// REST API returns at most 100 records per request and supplies an `offset`
// token for the next page; `fetchTable` issued one request and returned
// `data.records`, so every bulk fetch was capped at 100 rows.
//
// Against the 200-listing pre-launch north star the public catalogue would have
// served half the inventory with no error and nothing in the UI to show it —
// and the failure mode is a shorter list, which looks exactly like a correct
// shorter list.

const requests = [];
vi.mock("@/lib/fetchWithRetry", () => ({
  fetchWithRetry: async (url) => {
    requests.push(url);
    const parsed = new URL(url);
    const offset = parsed.searchParams.get("offset");
    const page = offset ? Number(offset.replace("page", "")) : 0;
    const body = pages[page] ?? { records: [] };
    return { ok: true, status: 200, statusText: "OK", json: async () => body };
  },
}));

let pages = [];
const { fetchBrokers, AIRTABLE_MAX_PAGES, AIRTABLE_MAX_RECORDS } = await import("@/lib/airtable");

/** A page of `count` approved brokers, optionally handing back a next offset. */
const brokerPage = (count, startAt, nextOffset) => ({
  records: Array.from({ length: count }, (_, i) => ({
    id: `rec${startAt + i}`,
    fields: { Name: `Broker ${startAt + i}`, Approved_For_Live_Site: true },
  })),
  ...(nextOffset ? { offset: nextOffset } : {}),
});

describe("A-079 · bulk Airtable fetches follow `offset` to the end", () => {
  beforeEach(() => {
    requests.length = 0;
    pages = [];
  });
  afterEach(() => vi.restoreAllMocks());

  it("retrieves a table of more than 100 records in full", async () => {
    pages = [brokerPage(100, 0, "page1"), brokerPage(100, 100, "page2"), brokerPage(37, 200)];

    const brokers = await fetchBrokers("key", "base");

    expect(brokers).toHaveLength(237);
    expect(requests).toHaveLength(3);
  });

  it("stops as soon as Airtable stops returning an offset", async () => {
    pages = [brokerPage(42, 0)];

    const brokers = await fetchBrokers("key", "base");

    expect(brokers).toHaveLength(42);
    expect(requests).toHaveLength(1);
  });

  it("sends the offset token Airtable handed back, on the right parameter", async () => {
    pages = [brokerPage(100, 0, "page1"), brokerPage(5, 100)];

    await fetchBrokers("key", "base");

    expect(requests[0]).not.toContain("offset=");
    expect(requests[1]).toContain("offset=page1");
  });

  it("preserves the caller's own query parameters across pages", async () => {
    pages = [brokerPage(100, 0, "page1"), brokerPage(1, 100)];

    await fetchBrokers("key", "base");

    // fetchBrokers passes no params, so assert the URL stays well-formed and
    // the offset is added as a real query parameter rather than concatenated.
    expect(() => new URL(requests[1])).not.toThrow();
    expect(new URL(requests[1]).searchParams.get("offset")).toBe("page1");
  });
});

describe("A-079 · pagination is bounded, so a runaway loop cannot hang the cache fill", () => {
  beforeEach(() => {
    requests.length = 0;
    pages = [];
  });

  it("exposes both caps", () => {
    expect(AIRTABLE_MAX_PAGES).toBeGreaterThan(2);
    expect(AIRTABLE_MAX_PAGES).toBeLessThanOrEqual(50);
    expect(AIRTABLE_MAX_RECORDS).toBeGreaterThanOrEqual(1000);
  });

  it("terminates against an Airtable that never stops handing back an offset", async () => {
    // Every page returns an offset forever. Without a cap this never returns.
    pages = new Proxy({}, { get: () => brokerPage(100, 0, "page0") });

    const brokers = await fetchBrokers("key", "base");

    expect(requests.length).toBeLessThanOrEqual(AIRTABLE_MAX_PAGES);
    expect(brokers.length).toBeLessThanOrEqual(AIRTABLE_MAX_RECORDS);
  });
});
