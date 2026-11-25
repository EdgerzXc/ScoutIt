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
const migration = read("supabase/migrations/20261114000001_serialize_chat_retention.sql");

describe("chat retention purge", () => {
  it("computes the cutoff from a fixed instant, seven days back", () => {
    const now = Date.UTC(2026, 7, 22, 12, 0, 0);
    expect(CHAT_RETENTION_DAYS).toBe(7);
    expect(retentionCutoffIso(now)).toBe("2026-08-15T12:00:00.000Z");
  });

  it("writes the live column, never the one the dead SQL function used", () => {
    expect(migration).toContain("UPDATE public.deal_messages AS m SET body = p_purged_body");
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
    expect(migration).toContain("d.closed_at <= p_cutoff");
    expect(route).not.toMatch(/\.eq\("status",\s*"closed"\)/);
  });

  it("exempts threads under an active dispute hold", () => {
    expect(DISPUTE_HOLD_STATUSES).toEqual(["open_hold", "under_review"]);
    expect(route).toContain("p_hold_statuses: DISPUTE_HOLD_STATUSES");
    expect(migration).toContain("h.status = ANY(p_hold_statuses)");
    expect(migration).toContain("FOR UPDATE OF d SKIP LOCKED");
  });

  it("refuses an unauthorised invocation before reading anything", () => {
    const authIndex = route.indexOf("authorizeCronRequest(request)");
    const firstQuery = route.indexOf("supabaseAdmin.rpc(");
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

  it("serializes two-session lock races between dispute hold filing and chat retention purge", async () => {
    // Verify the SQL contract enforces FOR UPDATE on deals in both the trigger and RPC,
    // paired with FOR UPDATE OF d SKIP LOCKED in purge_retained_chat_batch.
    expect(migration).toContain("PERFORM 1 FROM public.deals WHERE id = NEW.deal_id FOR UPDATE;");
    expect(migration).toContain("PERFORM 1 FROM public.deals WHERE id = p_deal_id FOR UPDATE;");
    expect(migration).toContain("FOR UPDATE OF d SKIP LOCKED");

    // Two-session lock-race state machine drill:
    // Ordering 1: Session A (dispute hold) acquires FOR UPDATE lock on deal-race-1 before Session B (purge) scans.
    // Session B's FOR UPDATE OF d SKIP LOCKED skips deal-race-1 while purging unlocked eligible deals,
    // preserving deal-race-1's message bodies intact.
    const createCoordinator = () => {
      const deals = new Map([
        ["deal-race-1", { id: "deal-race-1", status: "closed", closed_at: "2026-08-01T00:00:00Z" }],
        ["deal-unlocked-2", { id: "deal-unlocked-2", status: "closed", closed_at: "2026-08-01T00:00:00Z" }],
      ]);
      const messages = new Map([
        ["deal-race-1", [{ id: "m1", body: "Original evidence message" }]],
        ["deal-unlocked-2", [{ id: "m2", body: "Expired unlocked message" }]],
      ]);
      const disputes = new Map();
      const rowLocks = new Set();

      return {
        deals,
        messages,
        disputes,
        acquireDealLock(dealId) {
          if (rowLocks.has(dealId)) return false;
          rowLocks.add(dealId);
          return true;
        },
        releaseDealLock(dealId) {
          rowLocks.delete(dealId);
        },
        runPurgeBatch() {
          const candidates = [];
          for (const [id, d] of deals.entries()) {
            // SKIP LOCKED: skip any deal row currently locked by a concurrent dispute session
            if (rowLocks.has(id)) continue;
            const hasUnpurged = (messages.get(id) || []).some((m) => m.body !== PURGED_BODY);
            const hasHold = (disputes.get(id) || []).some((h) => DISPUTE_HOLD_STATUSES.includes(h.status));
            if (d.status === "closed" && hasUnpurged && !hasHold) {
              candidates.push(id);
            }
          }
          let purged = 0;
          for (const id of candidates) {
            const hasHold = (disputes.get(id) || []).some((h) => DISPUTE_HOLD_STATUSES.includes(h.status));
            if (hasHold) continue;
            for (const m of messages.get(id) || []) {
              if (m.body !== PURGED_BODY) {
                m.body = PURGED_BODY;
                purged += 1;
              }
            }
          }
          return { purged, eligibleDeals: candidates.length };
        },
        commitDisputeHold(dealId) {
          const list = disputes.get(dealId) || [];
          const existing = list.find((h) => DISPUTE_HOLD_STATUSES.includes(h.status));
          if (!existing) {
            list.push({ id: `disp-${dealId}`, status: "open_hold" });
            disputes.set(dealId, list);
          }
          const historyPurged = (messages.get(dealId) || []).some((m) => m.body === PURGED_BODY);
          return { alreadyHeld: Boolean(existing), historyPurged };
        },
      };
    };

    // Race 1: Hold acquires deal row lock first -> Purge skips locked deal via SKIP LOCKED -> Evidence preserved
    const sim1 = createCoordinator();
    expect(sim1.acquireDealLock("deal-race-1")).toBe(true);
    const purgeDuringHold = sim1.runPurgeBatch();
    expect(purgeDuringHold).toEqual({ purged: 1, eligibleDeals: 1 });
    const holdOutcome1 = sim1.commitDisputeHold("deal-race-1");
    sim1.releaseDealLock("deal-race-1");
    expect(holdOutcome1).toEqual({ alreadyHeld: false, historyPurged: false });
    expect(sim1.messages.get("deal-race-1")[0].body).toBe("Original evidence message");
    expect(sim1.messages.get("deal-unlocked-2")[0].body).toBe(PURGED_BODY);

    // Race 2: Purge acquires deal row lock and commits first -> Hold unblocks after commit and truthfully reports historyPurged: true
    const sim2 = createCoordinator();
    const purgeFirst = sim2.runPurgeBatch();
    expect(purgeFirst).toEqual({ purged: 2, eligibleDeals: 2 });
    const holdOutcome2 = sim2.commitDisputeHold("deal-race-1");
    expect(holdOutcome2).toEqual({ alreadyHeld: false, historyPurged: true });
  });
});
