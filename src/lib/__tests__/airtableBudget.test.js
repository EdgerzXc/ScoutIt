import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Shared fake Redis. cmsCache.js and airtableBudget.js each build their own
// client from the mocked class, but both close over this one Map, which is how
// the real deployment shares one counter across every Vercel instance.
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
  // Atomic on purpose: no await between read and write, because real Redis
  // INCRBY is. An awaiting read here would let four concurrent attempts in one
  // rebuild each read 0 and write 1, reporting a spend of 1 instead of 4.
  const entry = entries.get(key);
  const expired = entry && entry.expiresAt && entry.expiresAt <= Date.now();
  const base = !entry || expired ? 0 : Number(entry.value || 0);
  const value = base + count;
  entries.set(key, { value, expiresAt: entry?.expiresAt ?? null });
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

// Four tables per rebuild, so a budget of 4 is exactly one build's worth.
const BUDGET = 4;
const prior = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  key: process.env.AIRTABLE_API_KEY,
  base: process.env.AIRTABLE_BASE_ID,
  budget: process.env.AIRTABLE_MONTHLY_BUDGET,
};

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-01T00:00:00.000Z"));
  entries.clear();
  for (const mock of [get, set, del, incr, incrby, expire, evalScript, fetchProperties, fetchIntel, fetchBrokers, fetchHomepageConfig, recordSystemEvent]) mock.mockClear();
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.AIRTABLE_API_KEY = "test-key";
  process.env.AIRTABLE_BASE_ID = "test-base";
  process.env.AIRTABLE_MONTHLY_BUDGET = String(BUDGET);
});

afterEach(() => {
  vi.useRealTimers();
  for (const [key, value] of Object.entries({
    UPSTASH_REDIS_REST_URL: prior.url,
    UPSTASH_REDIS_REST_TOKEN: prior.token,
    AIRTABLE_API_KEY: prior.key,
    AIRTABLE_BASE_ID: prior.base,
    AIRTABLE_MONTHLY_BUDGET: prior.budget,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const flush = async () => { for (let tick = 0; tick < 20; tick += 1) await Promise.resolve(); };
const expireSnapshot = () => vi.setSystemTime(new Date("2026-10-01T12:00:01.000Z"));

describe("U-042 Airtable monthly call budget", () => {
  it("counts every Airtable attempt against one shared monthly counter", async () => {
    const { getCmsBundle } = await import("@/lib/cmsCache");
    const { getAirtableBudgetStatus } = await import("@/lib/airtableBudget");

    await getCmsBundle();
    await flush();

    const status = await getAirtableBudgetStatus();
    expect(status).toEqual(expect.objectContaining({
      tracked: true,
      month: "2026-10",
      attempts: BUDGET,
      budget: BUDGET,
      exhausted: true,
    }));
  });

  it("serves the last good snapshot instead of spending calls once the budget is spent", async () => {
    const { getCmsBundle } = await import("@/lib/cmsCache");
    await getCmsBundle();
    await flush();
    expect(fetchProperties).toHaveBeenCalledTimes(1);

    expireSnapshot();
    const result = await getCmsBundle();

    expect(result.source).toBe("stale_monthly_budget");
    expect(result.properties).toHaveLength(1);
    expect(fetchProperties).toHaveBeenCalledTimes(1);
    expect(recordSystemEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: "cms.bundle.budget_guarded",
      severity: "warning",
    }));
  });

  it("still rebuilds after a publish or takedown when the budget is spent", async () => {
    const { getCmsBundle, invalidateCmsBundle } = await import("@/lib/cmsCache");
    await getCmsBundle();
    await flush();
    expireSnapshot();

    await invalidateCmsBundle();
    const result = await getCmsBundle();

    expect(result.source).toBe("airtable");
    expect(fetchProperties).toHaveBeenCalledTimes(2);
  });

  it("reports the count as unknown rather than zero when Redis is absent", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { getAirtableBudgetStatus } = await import("@/lib/airtableBudget");

    expect(await getAirtableBudgetStatus()).toEqual(expect.objectContaining({
      tracked: false,
      attempts: null,
      exhausted: false,
    }));
  });
});

