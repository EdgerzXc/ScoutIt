import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const entries = new Map();
const get = vi.fn(async (key) => {
  const entry = entries.get(key);
  if (!entry || (entry.expiresAt && entry.expiresAt <= Date.now())) {
    entries.delete(key);
    return null;
  }
  return entry.value;
});
const set = vi.fn(async (key, value, options = {}) => {
  if (options.nx && (await get(key)) !== null) return null;
  entries.set(key, { value, expiresAt: options.ex ? Date.now() + options.ex * 1000 : null });
  return "OK";
});
const del = vi.fn(async (key) => Number(entries.delete(key)));
const incr = vi.fn(async (key) => {
  const value = Number(await get(key) || 0) + 1;
  entries.set(key, { value, expiresAt: null });
  return value;
});
const incrby = vi.fn(async (key, count) => {
  const value = Number(await get(key) || 0) + count;
  entries.set(key, { value, expiresAt: null });
  return value;
});
const expire = vi.fn(async (key, seconds) => {
  const entry = entries.get(key);
  if (!entry) return 0;
  entry.expiresAt = Date.now() + seconds * 1000;
  return 1;
});
const evalScript = vi.fn(async (_script, keys, args) => {
  if (keys.length === 2) {
    if (String(await get(keys[0]) ?? 0) !== String(args[0])) return 0;
    await set(keys[1], JSON.parse(args[1]), { ex: args[2] });
    return 1;
  }
  if ((await get(keys[0])) === args[0]) return del(keys[0]);
  return 0;
});

vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = get;
    set = set;
    del = del;
    incr = incr;
    incrby = incrby;
    expire = expire;
    eval = evalScript;
  },
}));

const fetchProperties = vi.fn(async (_key, _base, options) => {
  options?.onAttempt?.();
  return [{ id: "rec1", slug: "real-space", latitude: 14.55, longitude: 121.05 }];
});
const fetchIntel = vi.fn(async (_key, _base, options) => { options?.onAttempt?.(); return []; });
const fetchBrokers = vi.fn(async (_key, _base, options) => { options?.onAttempt?.(); return []; });
const fetchHomepageConfig = vi.fn(async (_key, _base, options) => { options?.onAttempt?.(); return null; });
vi.mock("@/lib/airtable", () => ({ fetchProperties, fetchIntel, fetchBrokers, fetchHomepageConfig }));
vi.mock("@/lib/mapboxToken", () => ({ getServerMapboxToken: () => null }));
vi.mock("@/lib/supabaseAdmin", () => ({
  supabaseAdmin: {
    from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [] }) }) }) }),
  },
}));
const recordSystemEvent = vi.fn(async () => {});
vi.mock("@/lib/systemEvents", () => ({ recordSystemEvent }));

const prior = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  key: process.env.AIRTABLE_API_KEY,
  base: process.env.AIRTABLE_BASE_ID,
};

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
  entries.clear();
  for (const mock of [get, set, del, incr, evalScript, fetchProperties, fetchIntel, fetchBrokers, fetchHomepageConfig, recordSystemEvent]) mock.mockClear();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.AIRTABLE_API_KEY = "test-key";
  process.env.AIRTABLE_BASE_ID = "test-base";
});

afterEach(() => {
  vi.useRealTimers();
  for (const [key, value] of Object.entries({
    UPSTASH_REDIS_REST_URL: prior.url,
    UPSTASH_REDIS_REST_TOKEN: prior.token,
    AIRTABLE_API_KEY: prior.key,
    AIRTABLE_BASE_ID: prior.base,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("U-042 Free-plan CMS read budget", () => {
  it("reuses one four-table build throughout the twelve-hour shared TTL", async () => {
    const { getCmsBundle, CMS_SHARED_TTL_S } = await import("@/lib/cmsCache");
    expect(CMS_SHARED_TTL_S).toBe(12 * 60 * 60);

    expect((await getCmsBundle()).source).toBe("airtable");
    vi.setSystemTime(new Date("2026-10-01T11:59:00.000Z"));
    expect((await getCmsBundle()).source).toBe("upstash_redis");
    expect(fetchProperties).toHaveBeenCalledTimes(1);
    expect(fetchIntel).toHaveBeenCalledTimes(1);
    expect(fetchBrokers).toHaveBeenCalledTimes(1);
    expect(fetchHomepageConfig).toHaveBeenCalledTimes(1);
    expect(recordSystemEvent).toHaveBeenCalledWith(expect.objectContaining({
      detail: expect.objectContaining({ airtableRequestAttempts: 4 }),
    }));

    vi.setSystemTime(new Date("2026-10-01T12:00:01.000Z"));
    expect((await getCmsBundle()).source).toBe("airtable");
    expect(fetchProperties).toHaveBeenCalledTimes(2);
  });

  it("rebuilds promptly after an explicit publish or takedown invalidation", async () => {
    const { getCmsBundle, invalidateCmsBundle } = await import("@/lib/cmsCache");
    await getCmsBundle();
    expect(await invalidateCmsBundle()).toEqual({ sharedCachePurged: true });
    await getCmsBundle();
    expect(fetchProperties).toHaveBeenCalledTimes(2);
    expect(incr).toHaveBeenCalledWith("cms_bundle_generation");
  });

  it("reports a local-only purge when shared Redis is not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { invalidateCmsBundle } = await import("@/lib/cmsCache");
    expect(await invalidateCmsBundle()).toEqual({ sharedCachePurged: false });
    expect(incr).not.toHaveBeenCalled();
  });

  it("does not restore a snapshot when another instance invalidates during its build", async () => {
    let finishProperties;
    fetchProperties.mockImplementationOnce(() => new Promise((resolve) => { finishProperties = resolve; }));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { getCmsBundle } = await import("@/lib/cmsCache");
    const pending = getCmsBundle();
    for (let tick = 0; tick < 10 && !finishProperties; tick += 1) await Promise.resolve();
    expect(finishProperties).toBeTypeOf("function");

    await incr("cms_bundle_generation");
    await del("cms_bundle");
    finishProperties([{ id: "rec1", slug: "withdrawn" }]);

    expect((await pending).source).toBe("empty_fallback_on_error");
    expect(await get("cms_bundle")).toBeNull();
    vi.restoreAllMocks();
  });

  it("waits for another instance's rebuild instead of fanning out to Airtable", async () => {
    entries.set("cms_bundle_build_lock", { value: "another-instance", expiresAt: Date.now() + 30_000 });
    const { getCmsBundle } = await import("@/lib/cmsCache");
    const pending = getCmsBundle();
    for (let tick = 0; tick < 10; tick += 1) await Promise.resolve();
    entries.set("cms_bundle", {
      value: { source: "airtable", properties: [{ slug: "real-space" }], intel: [], brokers: [], homepage: null },
      expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    });
    await vi.advanceTimersByTimeAsync(500);

    expect((await pending).source).toBe("upstash_redis");
    expect(fetchProperties).not.toHaveBeenCalled();
  });
});
