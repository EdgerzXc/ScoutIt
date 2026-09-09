import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CHAT_RETENTION_DAYS,
  DISPUTE_HOLD_STATUSES,
  PURGED_BODY,
  retentionCutoffIso,
} from "@/lib/chatRetention";

const read = (file) => readFileSync(resolve(process.cwd(), file), "utf8");
const route = read("src/app/api/cron/purge-chat-messages/route.js");

describe("chat retention purge", () => {
  it("computes the cutoff from a fixed instant, seven days back", () => {
    const now = Date.UTC(2026, 7, 22, 12, 0, 0);
    expect(CHAT_RETENTION_DAYS).toBe(7);
    expect(retentionCutoffIso(now)).toBe("2026-08-15T12:00:00.000Z");
  });

  it("writes the live column, never the one the dead SQL function used", () => {
    expect(route).toContain('.update({ body: PURGED_BODY })');
    expect(route).not.toMatch(/content:\s*PURGED_BODY/);
    expect(PURGED_BODY).toMatch(/Purged/);
  });

  it("purges every terminal status past the cutoff — not only closed", () => {
    // A-103: the UI decline path writes `declined` and the sender-withdraw
    // path writes `withdrawn`, both stamping `closed_at` — but the job only
    // selected `closed`, so those threads kept bodies forever against the
    // published seven-day promise. The candidate set is the shared terminal
    // list; `reported` is deliberately absent (it files a dispute hold at
    // report time instead — purging it would destroy evidence under review).
    expect(route).toContain("PURGE_ELIGIBLE_STATUSES");
    expect(route).toContain('.lte("closed_at", cutoff)');
    expect(route).not.toMatch(/\.eq\("status",\s*"closed"\)/);
  });

  it("exempts threads under an active dispute hold", () => {
    expect(DISPUTE_HOLD_STATUSES).toEqual(["open_hold", "under_review"]);
    expect(route).toContain('.in("status", DISPUTE_HOLD_STATUSES)');
    expect(route).toContain("held.has(id)");
  });

  it("refuses an unauthorised invocation before reading anything", () => {
    const authIndex = route.indexOf("authorizeCronRequest(request)");
    const firstQuery = route.indexOf("supabaseAdmin\n      .from");
    expect(authIndex).toBeGreaterThan(-1);
    expect(authIndex).toBeLessThan(firstQuery === -1 ? route.length : firstQuery);
  });

  it("has a named consumer registered as a scheduled job", () => {
    const vercel = JSON.parse(read("vercel.json"));
    const job = vercel.crons.find((c) => c.path === "/api/cron/purge-chat-messages");
    expect(job).toBeDefined();
    expect(job.schedule).toMatch(/^\S+ \S+ \S+ \S+ \S+$/);
  });

  it("leaves exactly one implementation of the rule", () => {
    const drop = read("supabase/migrations/20260822000001_drop_broken_chat_purge_function.sql");
    expect(drop).toContain("DROP FUNCTION IF EXISTS public.purge_expired_chat_messages()");
  });
});
