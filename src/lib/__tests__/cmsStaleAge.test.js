import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisGet = vi.fn();
vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = redisGet;
    set = vi.fn(async () => "OK");
    del = vi.fn();
    eval = vi.fn(async () => 0);
  },
}));
vi.mock("@/lib/airtable", () => {
  const unavailable = async () => { throw new Error("Airtable unavailable"); };
  return {
    fetchProperties: unavailable,
    fetchIntel: unavailable,
    fetchBrokers: unavailable,
    fetchHomepageConfig: unavailable,
  };
});

const oldEnv = {
  node: process.env.NODE_ENV,
  offline: process.env.SCOUTIT_OFFLINE_CMS,
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  key: process.env.AIRTABLE_API_KEY,
  base: process.env.AIRTABLE_BASE_ID,
};

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-28T02:00:00.000Z"));
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.AIRTABLE_API_KEY = "test-key";
  process.env.AIRTABLE_BASE_ID = "test-base";
  redisGet.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  for (const [key, value] of Object.entries({
    NODE_ENV: oldEnv.node,
    SCOUTIT_OFFLINE_CMS: oldEnv.offline,
    UPSTASH_REDIS_REST_URL: oldEnv.url,
    UPSTASH_REDIS_REST_TOKEN: oldEnv.token,
    AIRTABLE_API_KEY: oldEnv.key,
    AIRTABLE_BASE_ID: oldEnv.base,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("U-042 bounded stale catalogue", () => {
  it("never borrows the production CMS in offline development mode", async () => {
    process.env.NODE_ENV = "development";
    process.env.SCOUTIT_OFFLINE_CMS = "1";
    redisGet.mockResolvedValue(null);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("unexpected network call");
    });
    const { getCmsBundle } = await import("@/lib/cmsCache");

    expect((await getCmsBundle()).source).toBe("empty_fallback_on_error");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("serves a brief stale copy, then reports unavailable after two minutes", async () => {
    redisGet.mockResolvedValueOnce({
      source: "airtable",
      properties: [{ id: "rec1", slug: "known-listing" }],
      intel: [],
      brokers: [],
      homepage: null,
    }).mockResolvedValue(null);
    const { getCmsBundle } = await import("@/lib/cmsCache");

    expect((await getCmsBundle()).properties).toHaveLength(1);
    vi.setSystemTime(new Date("2026-09-28T02:01:10.000Z"));
    expect((await getCmsBundle()).source).toBe("airtable_stale");
    vi.setSystemTime(new Date("2026-09-28T02:02:10.000Z"));
    expect((await getCmsBundle()).source).toBe("empty_fallback_on_error");
  });
});
