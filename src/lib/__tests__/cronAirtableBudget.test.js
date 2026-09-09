import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");

// ── A-116 — the nightly staleness sweep must not inherit a page budget ──────
//
// `check-stale-listings` returned 500 on 2026-09-02 and 2026-09-08, both with
// `durationMs: 5006` recorded in `system_events` — the 5,000ms Airtable budget
// to the millisecond. That budget is correct for the CMS bundle, which fans out
// to four tables plus Mapbox inside a page render; it is wrong for a cron that
// makes one call with the whole function to itself. Two nights of staleness
// notifications were silently skipped.
//
// The failures were visible the whole time in the log A-063 built. Nobody was
// reading it, which is the other half of what went wrong here.
describe("A-116 cron Airtable budget", () => {
  const cron = read("src/app/api/cron/check-stale-listings/route.js");
  const airtable = read("src/lib/airtable.js");

  it("the cron asks for a budget larger than the page-render default", () => {
    const budget = cron.match(/CRON_AIRTABLE_BUDGET_MS = (\d+)/);
    const attempt = cron.match(/CRON_AIRTABLE_ATTEMPT_MS = (\d+)/);
    expect(budget, "CRON_AIRTABLE_BUDGET_MS is declared").not.toBeNull();
    expect(attempt, "CRON_AIRTABLE_ATTEMPT_MS is declared").not.toBeNull();
    expect(Number(budget[1])).toBeGreaterThan(5000);
    expect(Number(attempt[1])).toBeGreaterThan(2500);
  });

  it("the cron actually passes that budget to the Airtable call", () => {
    // The constants existing is not the fix; handing them to the fetch is.
    expect(cron).toMatch(/fetchPropertyVerificationDates\(\s*apiKey,\s*baseId,\s*\{/);
    expect(cron).toContain("budgetMs: CRON_AIRTABLE_BUDGET_MS");
    expect(cron).toContain("attemptTimeoutMs: CRON_AIRTABLE_ATTEMPT_MS");
  });

  it("declares a maxDuration that can contain the budget it asks for", () => {
    const maxDuration = cron.match(/export const maxDuration = (\d+)/);
    expect(maxDuration, "maxDuration is declared").not.toBeNull();
    const budgetSeconds = Number(cron.match(/CRON_AIRTABLE_BUDGET_MS = (\d+)/)[1]) / 1000;
    expect(Number(maxDuration[1])).toBeGreaterThan(budgetSeconds);
  });

  it("leaves every other Airtable caller on the tight page budget", () => {
    // The defaults are the contract for the CMS bundle. Widening them globally
    // is the change this fix deliberately did NOT make.
    expect(airtable).toContain("budgetMs: options.budgetMs ?? 5000");
    expect(airtable).toContain("attemptTimeoutMs: options.attemptTimeoutMs ?? 2500");
  });
});
