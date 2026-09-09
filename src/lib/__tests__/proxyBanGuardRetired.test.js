import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { isSensitivePath, rateLimitTier } from "@/lib/sensitiveRoutes";

// A-080 — the masked-IP ban guard is retired, on owner decision 2026-09-04.
//
// ── WHAT WAS REMOVED AND WHY ─────────────────────────────────────────
// `src/proxy.js` carried `maskIp`, `getBanSet`, `recordAccess` and their
// caches, written for "A7 Phase 2" and **never wired into `proxy()`**. Nothing
// called them, so `blocked_access` had no reader and blocking an IP in Mission
// Control did nothing at all.
//
// The audit that found this also found why finishing it would have been worse
// than deleting it: the table the console ranks on, `security_access_logs`, is
// fed by `/api/telemetry/device` — 1,755 of its 1,820 rows are anonymous
// visitor analytics. Its "velocity" ranking sorts page views, and all ten
// flagged anomalies are one product event, `abandoned_inquiry_modal`. Two live
// `blocked_access` rows are the same visitor two seconds apart, reason
// "User Friction: abandoned_inquiry_modal" — a person who gave up on a form.
// Switching enforcement on would have banned real visitors for hesitating.
//
// The owner chose retirement over completion. The telemetry itself is correct
// for its own purpose and is untouched.
//
// ── WHY A SOURCE ASSERTION IS THE RIGHT SHAPE HERE, FOR ONCE ─────────
// This ledger keeps recording that a source grep is a vacuous guard, and that
// is right when the property is behavioural. Here the property **is absence**:
// the claim is that the middleware makes no ban lookup and no masked-access
// write. There is no behaviour left to exercise — that is the point. So the
// absence is asserted directly, and the second half of this file asserts the
// machinery that had to SURVIVE, which is what proves the deletion was
// surgical rather than broad.

const proxySource = fs.readFileSync("src/proxy.js", "utf8");

/**
 * The file's own comments explain what was removed and name it, so a naive
 * match finds the words in the explanation and reports the defect it is
 * documenting. This is a recorded failure in this repo — the intel-publish
 * guard hit it first: *"a source-text assertion has to read code, not prose,
 * otherwise the explanation of a bug reads as the bug."* Comments are stripped
 * before matching. Strings are left intact, because a table name would appear
 * in one.
 *
 * ⚠️ The `$` anchor is deliberately absent, and that is not style. This repo's
 * files use CRLF, and JavaScript's `.` does not match `\r` — so `//.*$` finds
 * no match on any line of a CRLF file, silently strips nothing, and every
 * absence assertion below then reads the explanatory comments as the code they
 * describe. It cost a red run here before it was understood; leave it off.
 */
const proxyCode = proxySource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(/\r?\n/)
  .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
  .join("\n");

describe("A-080 · the unwired ban guard is gone", () => {
  it("strips comments but keeps the code it is asserting over", () => {
    // Guards the guard: if the stripper ever removed everything, every
    // absence assertion below would pass vacuously.
    expect(proxyCode).toContain("export async function proxy(");
    expect(proxyCode.length).toBeGreaterThan(2000);
    expect(proxySource).toContain("RETIRED here on 2026-09-04"); // comment survives in source
    expect(proxyCode).not.toContain("RETIRED here on 2026-09-04"); // and not in code
  });

  it("makes no ban-list lookup and no masked-access write", () => {
    for (const gone of [
      "blocked_access",       // the ban table — had no reader
      "log_masked_access",    // the counting RPC — had no caller
      "getBanSet",
      "recordAccess",
      "maskIp",
      "banCache",
      "BAN_CACHE_TTL_MS",
    ]) {
      expect(proxyCode).not.toContain(gone);
    }
  });

  it("no longer reads IP_SALT, because nothing hashes an IP here", () => {
    // `/api/contact` has its own unrelated `maskIp` and keeps using the salt.
    // The middleware does not, and must not quietly start again.
    expect(proxyCode).not.toContain("IP_SALT");
  });
});

describe("A-080 · everything that was actually working still is", () => {
  it("keeps the feature-flag kill switch", () => {
    expect(proxySource).toContain("feature_flags");
    expect(proxySource).toContain("getFlags");
    expect(proxySource).toContain("supabaseHeaders");
  });

  it("keeps the rate limiter and the QuestIT gate", () => {
    expect(proxySource).toContain("Ratelimit");
    expect(proxySource).toContain("isSensitivePath");
    expect(proxySource).toContain("rateLimitTier");
    expect(proxySource).toContain("shouldBlockQuestIt");
  });

  it("still exports the middleware and its matcher", () => {
    expect(proxySource).toMatch(/export async function proxy\(/);
    expect(proxySource).toMatch(/export const config = \{/);
  });

  it("the limiter classifiers behave unchanged — by calling them, not reading them", () => {
    expect(isSensitivePath("/api/intel/ingest")).toBe(true);
    expect(rateLimitTier("/api/intel/ingest")).toBe("ai");
    expect(isSensitivePath("/api/cms")).toBe(false);
  });
});
