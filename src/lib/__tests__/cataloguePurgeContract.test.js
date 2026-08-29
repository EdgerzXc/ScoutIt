import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path) => readFileSync(path, "utf8");

const cmsCache = read("src/lib/cmsCache.js");

// Every route that changes what the public catalogue contains. A write here
// that does not purge leaves the change invisible — or worse, leaves a
// withdrawn listing publicly served — for up to the Redis TTL.
const MUTATING_ROUTES = {
  withdraw: "src/app/api/dashboard/archive/route.js",
  remove: "src/app/api/dashboard/delete/route.js",
  publish: "src/app/api/dashboard/publish/route.js",
  update: "src/app/api/dashboard/update/route.js",
};

describe("A-054 public catalogue purge on takedown", () => {
  it("every route that changes public visibility purges the catalogue", () => {
    for (const [name, path] of Object.entries(MUTATING_ROUTES)) {
      const source = read(path);
      expect(source, `${name} (${path}) does not import the purge`)
        .toContain('invalidateCmsBundle } from "@/lib/cmsCache"');
      expect(source, `${name} (${path}) never calls the purge`)
        .toMatch(/invalidateCmsBundle\(\)|purgePublicCatalogue\(\)/);
    }
  });

  it("purges after the write, never before it", () => {
    // Purging first would repopulate the cache from pre-change data on the
    // very next read, which is worse than not purging at all.
    //
    // Call SITES only — a helper defined at the top of the file legitimately
    // appears before the write, so matching the definition would fail a
    // correct route.
    for (const [name, path] of Object.entries(MUTATING_ROUTES)) {
      const source = read(path);
      const firstUpdate = source.indexOf(".update(");
      const callSites = [];
      const pattern = /await (?:invalidateCmsBundle|purgePublicCatalogue)\(\)/g;
      for (let m = pattern.exec(source); m; m = pattern.exec(source)) callSites.push(m.index);

      expect(callSites.length, `${name} has no awaited purge`).toBeGreaterThan(0);
      if (firstUpdate > -1) {
        expect(
          callSites.some((at) => at > firstUpdate),
          `${name} only purges before its write`,
        ).toBe(true);
      }
    }
  });

  it("never fails a completed takedown because the purge failed", () => {
    // The removal is already written. Reporting it as failed would invite a
    // retry of a destructive operation.
    for (const [name, path] of Object.entries(MUTATING_ROUTES)) {
      const source = read(path);
      // Either shape is fine: a .catch() on the call, or a try/catch in a
      // helper. What matters is that the failure never reaches the caller.
      expect(source, `${name} does not swallow purge failures`)
        .toMatch(/\.catch\(\(cacheError\)|catch \(cacheError\)/);
      expect(source).toContain("Catalogue cache purge failed");
    }
  });

  it("removes both cache layers and waits out an in-flight rebuild", () => {
    // A rebuild that started before the takedown would otherwise repopulate
    // the cache with the pre-takedown bundle immediately after it is cleared.
    expect(cmsCache).toContain("export async function invalidateCmsBundle()");
    expect(cmsCache).toContain("if (inflight) await inflight.catch(() => null);");
    expect(cmsCache).toContain("cache = { bundle: null, fetchedAt: 0 };");
    expect(cmsCache).toContain('await redis.del("cms_bundle")');
  });

  it("purges the retained-removal path, not only the idempotent repair", () => {
    const remove = read("src/app/api/dashboard/delete/route.js");
    const calls = remove.match(/await purgePublicCatalogue\(\)/g) || [];
    // One for the idempotent repair branch, one for the real removal.
    expect(calls.length).toBeGreaterThanOrEqual(2);
  });
});
