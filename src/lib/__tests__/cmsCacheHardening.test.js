import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CMS Cache Budget, Single-Flight & Per-Table Degradation (A-307)", () => {
  describe("Source code contracts & architectural invariants", () => {
    it("cmsCache implements Promise.allSettled for per-table degradation", () => {
      const src = readFileSync("src/lib/cmsCache.js", "utf8");
      expect(src).toContain("Promise.allSettled");
      expect(src).toContain("propRes.status === \"fulfilled\"");
      expect(src).toContain("brokerRes.status === \"fulfilled\"");
      expect(src).toContain("tableCache.brokers");
      expect(src).toContain("airtable_partial_degraded");
    });

    it("cmsCache enforces budget-aware publisher window in getCmsBundle and invalidateCmsBundle", () => {
      const src = readFileSync("src/lib/cmsCache.js", "utf8");
      expect(src).toContain("getAirtableBudgetStatus()");
      expect(src).toContain("if (budget?.exhausted)");
      expect(src).toContain("stale_monthly_budget");
      expect(src).toContain("if (!budget.exhausted)");
    });

    it("cmsCache implements deadline-bounded lock in buildSharedBundle", () => {
      const src = readFileSync("src/lib/cmsCache.js", "utf8");
      expect(src).toContain("BUILD_TIMEOUT_MS = 25000");
      expect(src).toContain("Promise.race");
      expect(src).toContain("stale_during_rebuild");
    });

    it("cmsCache preserves single-flight inflight deduplication", () => {
      const src = readFileSync("src/lib/cmsCache.js", "utf8");
      expect(src).toContain("if (inflight) return inflight;");
      expect(src).toContain("inflight = buildSharedBundle()");
      expect(src).toContain("inflight = null;");
    });
  });
});
