import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadPublicCatalog, publicCatalogUrl } from "../cms/publicCatalog";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const ok = (body) => ({ ok: true, status: 200, json: async () => body });

describe("A-053 public catalogue request coalescing", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("url", () => {
    it("always asks for the cacheable public scope", () => {
      expect(publicCatalogUrl()).toBe("/api/cms?scope=public");
    });

    it("carries a radius search and its centre", () => {
      expect(publicCatalogUrl({ radius: 5, lng: 121.02, lat: 14.55 }))
        .toBe("/api/cms?scope=public&radius=5&lng=121.02&lat=14.55");
    });

    it("omits an absent radius rather than sending an empty one", () => {
      expect(publicCatalogUrl({ radius: "", lng: 1, lat: 2 })).toBe("/api/cms?scope=public");
      expect(publicCatalogUrl({ radius: null })).toBe("/api/cms?scope=public");
    });
  });

  describe("coalescing", () => {
    it("serves two components on one page from a single request", async () => {
      const gate = deferred();
      global.fetch.mockReturnValue(gate.promise);

      const first = loadPublicCatalog();
      const second = loadPublicCatalog();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith("/api/cms?scope=public");

      gate.resolve(ok({ properties: [{ id: "p1" }] }));
      await expect(first).resolves.toEqual({ properties: [{ id: "p1" }] });
      await expect(second).resolves.toEqual({ properties: [{ id: "p1" }] });
    });

    it("never serves a radius search the unfiltered catalogue", async () => {
      const wide = deferred();
      const narrow = deferred();
      global.fetch.mockReturnValueOnce(wide.promise).mockReturnValueOnce(narrow.promise);

      const all = loadPublicCatalog();
      const near = loadPublicCatalog({ radius: 5, lng: 121, lat: 14 });
      expect(global.fetch).toHaveBeenCalledTimes(2);

      wide.resolve(ok({ properties: [{ id: "far" }, { id: "near" }] }));
      narrow.resolve(ok({ properties: [{ id: "near" }] }));
      await expect(all).resolves.toEqual({ properties: [{ id: "far" }, { id: "near" }] });
      await expect(near).resolves.toEqual({ properties: [{ id: "near" }] });
    });

    it("does not hold a copy — freshness stays the cache header's job", async () => {
      global.fetch.mockResolvedValueOnce(ok({ properties: [{ id: "old" }] }));
      await expect(loadPublicCatalog()).resolves.toEqual({ properties: [{ id: "old" }] });

      global.fetch.mockResolvedValueOnce(ok({ properties: [{ id: "new" }] }));
      await expect(loadPublicCatalog()).resolves.toEqual({ properties: [{ id: "new" }] });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("rejects a non-OK response so callers can fall back", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });
      await expect(loadPublicCatalog()).rejects.toThrow("503");
    });

    it("shares a failure without poisoning the next call", async () => {
      const gate = deferred();
      global.fetch.mockReturnValueOnce(gate.promise);
      const first = loadPublicCatalog();
      const second = loadPublicCatalog();
      gate.reject(new Error("offline"));

      await expect(first).rejects.toThrow("offline");
      await expect(second).rejects.toThrow("offline");

      global.fetch.mockResolvedValueOnce(ok({ properties: [] }));
      await expect(loadPublicCatalog()).resolves.toEqual({ properties: [] });
    });
  });
});
