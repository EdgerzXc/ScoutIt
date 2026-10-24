import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  TRANSACTION_REQUIRED_SIGNAL_TYPES,
  TRANSACTION_TYPES,
  activeSignalCutoffIso,
  activeSignalFilter,
  isSignalActive,
  validateDraft,
} from "@/lib/communityPosting";
import { SIGNAL_TYPES } from "@/lib/communitySignalsAdapter";

const read = (relative) => readFileSync(resolve(process.cwd(), relative), "utf8");
const stripComments = (code) =>
  code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

const NOW = Date.parse("2026-10-20T00:00:00.000Z");
const DAY = 86_400_000;

// ─────────────────────────────────────────────────────────────────────────
// A-238 (GAP-94). The composer collected a transaction type it never showed a
// control for, so every signal stored a blank one.
//
// A-237 (GAP-104 / GAP-106 / GAP-116). The public feed limited to 60 rows
// in SQL and dropped the expired ones in memory, so sixty aged signals could
// starve a live feed. The capacity counter ignored expiry, so an expired
// signal kept consuming an author's allowance. The public saved count was
// never written at all, so a card's counter froze at zero.
// ─────────────────────────────────────────────────────────────────────────

const draft = (overrides = {}) => ({
  authorAccountId: "author-1",
  signalType: SIGNAL_TYPES.LOOKING_FOR,
  title: "Need 1,200 sqm near C5",
  body: "Cold storage, 8m ceiling, Q1 2027.",
  city: "Taguig",
  district: "BGC",
  identityMode: "anonymous",
  ...overrides,
});

describe("A-238 transaction intent", () => {
  it("refuses a demand signal with no transaction stated", () => {
    const result = validateDraft(draft());
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("NO_TRANSACTION");
  });

  it("accepts each stated intent", () => {
    for (const transactionType of TRANSACTION_TYPES) {
      const result = validateDraft(draft({ transactionType }));
      expect(result.ok, transactionType).toBe(true);
      expect(result.normalized.transactionType).toBe(transactionType);
    }
  });

  it("refuses an intent the platform does not know", () => {
    const result = validateDraft(draft({ transactionType: "swap" }));
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.code)).toContain("BAD_TRANSACTION");
    expect(result.normalized.transactionType).toBe("");
  });

  it("normalises the casing a member typed", () => {
    const result = validateDraft(draft({ transactionType: "Lease" }));
    expect(result.ok).toBe(true);
    expect(result.normalized.transactionType).toBe("lease");
  });

  it("does not ask for a transaction where the idea does not apply", () => {
    for (const signalType of [SIGNAL_TYPES.MARKET_OBSERVATION, SIGNAL_TYPES.COMMERCIAL_PROMOTION]) {
      const result = validateDraft(draft({ signalType }));
      expect(result.ok, signalType).toBe(true);
      expect(result.normalized.transactionType).toBe("");
    }
  });

  it("names the signal types that carry a transaction", () => {
    expect(TRANSACTION_REQUIRED_SIGNAL_TYPES.has(SIGNAL_TYPES.LOOKING_FOR)).toBe(true);
    expect(TRANSACTION_REQUIRED_SIGNAL_TYPES.has(SIGNAL_TYPES.MARKET_OBSERVATION)).toBe(false);
  });

  it("gives the composer a control for the transaction", () => {
    const code = stripComments(read("src/components/stratosphere/SignalComposer.js"));
    expect(code).toContain("TRANSACTION_OPTIONS");
    expect(code).toMatch(/aria-label="Transaction type"/);
    expect(code).toContain("TRANSACTION_REQUIRED_SIGNAL_TYPES");
  });
});

describe("A-237 one expiry rule for the feed and the counter", () => {
  it("cuts a signal off 7 days (1 week) after its last confirmation", () => {
    const cutoff = activeSignalCutoffIso(NOW);
    expect(Date.parse(cutoff)).toBe(NOW - 7 * DAY);
  });

  it("keeps a row inside the 7-day window and drops one past the cut-off", () => {
    const fresh = new Date(NOW - 3 * DAY).toISOString();
    const expired = new Date(NOW - 8 * DAY).toISOString();
    expect(isSignalActive(fresh, new Date(NOW))).toBe(true);
    expect(isSignalActive(expired, new Date(NOW))).toBe(false);
    // The column is NOT NULL in the database, so a missing date is not a
    // live signal — it must not be let back in by the filter.
    expect(isSignalActive(null, new Date(NOW))).toBe(false);
  });

  it("writes the filter the database can apply", () => {
    const filter = activeSignalFilter(new Date(NOW));
    expect(filter).toContain("last_confirmed_at.gte.");
    expect(filter).not.toContain("is.null");
  });

  it("filters the feed in SQL, before the limit", () => {
    const code = stripComments(read("src/lib/communityStore.js"));
    const feed = code.slice(code.indexOf("export async function listLiveSignals"));
    const feedBody = feed.slice(0, feed.indexOf("export ", 10));
    expect(feedBody).toContain("activeSignalFilter");
    // The filter has to come before the limit, or the limit still applies to
    // the aged rows and the feed starves.
    expect(feedBody.indexOf("activeSignalFilter")).toBeLessThan(feedBody.indexOf(".limit("));
  });

  it("applies the same rule to the capacity count", () => {
    const code = stripComments(read("src/lib/communityStore.js"));
    const counter = code.slice(code.indexOf("export async function countActiveSignals"));
    expect(counter).toContain("activeSignalFilter");
  });

  it("keeps the public saved count in step with the rows", () => {
    const code = stripComments(read("src/app/api/community/signals/[id]/save/route.js"));
    expect(code).toContain("syncSavedCount");
    expect(code).toContain("saved_count");
    // Both directions have to reconcile it.
    expect(code.match(/await syncSavedCount\(id\);/g)?.length).toBe(2);
  });
});

describe("A-237 the files still exist", () => {
  it("composer, store and save route are all present", () => {
    expect(existsSync(resolve(process.cwd(), "src/components/stratosphere/SignalComposer.js"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/lib/communityStore.js"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/app/api/community/signals/[id]/save/route.js"))).toBe(true);
  });
});
