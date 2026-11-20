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
vi.mock("server-only", () => ({}));

const prior = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  key: process.env.AIRTABLE_API_KEY,
  base: process.env.AIRTABLE_BASE_ID,
};

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("VERCEL_TARGET_ENV", undefined);
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
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
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

  it("keeps Preview snapshots, locks and both invalidators out of the production namespace", async () => {
    const production = await import("@/lib/cmsCache");
    await production.getCmsBundle();
    const productionKeys = [...entries.keys()].filter((key) => key.startsWith("cms_"));
    const snapshot = await get("cms_bundle");

    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("AIRTABLE_BASE_ID", "sandbox-base");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sandbox.supabase.co");
    vi.resetModules();
    const { getCmsBundle, invalidateCmsBundle } = await import("@/lib/cmsCache");
    const { publicCatalogueCacheKey } = await import("@/lib/publicCatalogueCacheKey.mjs");
    fetchProperties.mockResolvedValueOnce([{ id: "rec-preview", slug: "preview-space" }]);
    const firstPreview = await getCmsBundle();
    expect(firstPreview.source).toBe("airtable");
    expect(firstPreview.properties.map(({ slug }) => slug)).toContain("preview-space");
    expect(fetchProperties).toHaveBeenLastCalledWith("test-key", "sandbox-base", expect.any(Object));
    expect(evalScript).toHaveBeenCalledWith(expect.any(String), [publicCatalogueCacheKey("cms_bundle_build_lock")], expect.any(Array));
    expect(await get(publicCatalogueCacheKey("cms_bundle_last_good"))).toBeTruthy();

    const { purgePublicCatalogueCache } = await import("../../../mission-control/src/lib/publicCatalogueCache.js");
    const redisRest = vi.fn(async (url) => {
      const [, command, argument] = new URL(url).pathname.split("/");
      const key = decodeURIComponent(argument);
      const result = command === "incr" ? await incr(key) : await del(key);
      return Response.json({ result });
    });
    vi.stubGlobal("fetch", redisRest);
    expect(await purgePublicCatalogueCache()).toMatchObject({ purged: true });
    expect(await get(publicCatalogueCacheKey("cms_bundle"))).toBeNull();
    expect(await get(publicCatalogueCacheKey("cms_bundle_generation"))).toBe(1);
    expect(await invalidateCmsBundle()).toMatchObject({ sharedCachePurged: true });
    expect(await get(publicCatalogueCacheKey("cms_bundle_generation"))).toBe(2);
    expect(await get(publicCatalogueCacheKey("cms_publisher_rebuild_until"))).toBeTruthy();
    expect(await get("cms_bundle")).toEqual(snapshot);
    expect([...entries.keys()].filter((key) => key.startsWith("cms_"))).toEqual(productionKeys);
  });

  it("scopes the same Preview key independently by target, Airtable base and Supabase host", async () => {
    const { publicCatalogueCacheKey } = await import("@/lib/publicCatalogueCacheKey.mjs");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("AIRTABLE_BASE_ID", "sandbox-base");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sandbox.supabase.co/");
    const previewKey = publicCatalogueCacheKey("cms_bundle");
    expect(previewKey).not.toBe("cms_bundle");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sandbox.supabase.co");
    expect(publicCatalogueCacheKey("cms_bundle")).toBe(previewKey);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://other.supabase.co");
    expect(publicCatalogueCacheKey("cms_bundle")).not.toBe(previewKey);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://sandbox.supabase.co");
    vi.stubEnv("AIRTABLE_BASE_ID", "other-base");
    expect(publicCatalogueCacheKey("cms_bundle")).not.toBe(previewKey);
    vi.stubEnv("AIRTABLE_BASE_ID", "sandbox-base");
    vi.stubEnv("VERCEL_TARGET_ENV", "qa");
    expect(publicCatalogueCacheKey("cms_bundle")).not.toBe(previewKey);
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
