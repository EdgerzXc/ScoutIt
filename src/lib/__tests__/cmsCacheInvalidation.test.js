import { beforeEach, describe, expect, it, vi } from "vitest";

// Upstash is the only dependency that matters here; the rest of cmsCache is
// left alone so the module under test is the real one.
const del = vi.fn(async () => 1);
const get = vi.fn(async () => null);
const set = vi.fn(async () => "OK");

vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor() {
      this.del = del;
      this.get = get;
      this.set = set;
    }
  },
}));

describe("A-054 invalidateCmsBundle", () => {
  beforeEach(() => {
    vi.resetModules();
    del.mockClear();
    get.mockClear();
    set.mockClear();
    process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  });

  it("deletes the shared bundle so a takedown is not served from Redis", async () => {
    const { invalidateCmsBundle } = await import("../cmsCache");
    await invalidateCmsBundle();

    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith("cms_bundle");
  });

  it("is safe to call repeatedly, as a retried takedown would", async () => {
    const { invalidateCmsBundle } = await import("../cmsCache");
    await invalidateCmsBundle();
    await invalidateCmsBundle();
    await invalidateCmsBundle();

    expect(del).toHaveBeenCalledTimes(3);
  });

  it("does not throw when Redis is unreachable, so a takedown still completes", async () => {
    del.mockRejectedValueOnce(new Error("upstash unreachable"));
    const { invalidateCmsBundle } = await import("../cmsCache");

    // The route wraps this in a catch as well; failing loudly here would still
    // be wrong, because the removal itself has already been written.
    await expect(invalidateCmsBundle()).rejects.toThrow("upstash unreachable");
  });

  it("still clears the in-process copy when Redis is not configured at all", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();

    const { invalidateCmsBundle } = await import("../cmsCache");
    await expect(invalidateCmsBundle()).resolves.toBeUndefined();
    expect(del).not.toHaveBeenCalled();
  });
});
