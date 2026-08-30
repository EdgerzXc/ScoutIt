import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  EVENTS,
  SEVERITIES,
  SOURCES,
  buildSystemEvent,
  isKnownEvent,
  severityForOutcome,
} from "../src/lib/systemEventPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainRoot = path.join(root, "..");

const read = (...p) => readFile(path.join(...p), "utf8");

const migration = await read(root, "supabase", "migrations", "0010_system_events.sql");
const mcPolicy = await read(root, "src", "lib", "systemEventPolicy.mjs");
const mainPolicy = await read(mainRoot, "src", "lib", "systemEventPolicy.mjs");
const mcRecorder = await read(root, "src", "lib", "systemEvents.js");
const mainRecorder = await read(mainRoot, "src", "lib", "systemEvents.js");
const cronWrapper = await read(mainRoot, "src", "lib", "cronEventLog.js");
const systemPage = await read(root, "src", "app", "dashboard", "system", "page.js");
const auditPage = await read(root, "src", "app", "dashboard", "audit", "page.js");

// ── The copy that cannot be an import ────────────────────────────────────────
// Two deployments write to one table. A log whose event names drift between its
// writers cannot be filtered, which is the same as not having one.

test("both apps carry a byte-identical copy of the event vocabulary", () => {
  assert.equal(mcPolicy, mainPolicy);
});

test("every event name the vocabulary declares is actually emitted somewhere", async () => {
  const emitters = await Promise.all([
    read(root, "src", "app", "dashboard", "coordinates", "actions.js"),
    read(root, "src", "app", "dashboard", "cms", "actions.js"),
    read(mainRoot, "src", "lib", "cronEventLog.js"),
    read(mainRoot, "src", "lib", "cmsCache.js"),
  ]);
  const all = emitters.join("\n");

  for (const key of Object.keys(EVENTS)) {
    assert.match(
      all,
      new RegExp(`EVENTS\\.${key}\\b`),
      `EVENTS.${key} is declared but nothing emits it — a silence would read as ` +
        `"did not happen" when it means "was never wired"`,
    );
  }
});

// ── The row shape ────────────────────────────────────────────────────────────

test("an event is normalised into the exact columns the table accepts", () => {
  const row = buildSystemEvent({
    event: "  cron.completed  ",
    source: SOURCES.MAIN_SITE,
    subjectId: 42,
    detail: { job: "x" },
  });
  assert.equal(row.event, "cron.completed");
  assert.equal(row.severity, "info");
  assert.equal(row.subject_id, "42", "a numeric id must become the table's text");
  assert.equal(row.subject_table, null);
  assert.ok(row.occurred_at, "every event needs a time it happened");
});

test("a failure can never be filed as routine", () => {
  assert.equal(severityForOutcome(false), "error");
  assert.equal(severityForOutcome(true), "info");
  assert.ok(SEVERITIES.includes(severityForOutcome(false)));
});

test("a nameless event or an invented severity is a programming error, not a row", () => {
  assert.throws(() => buildSystemEvent({ source: "x" }), /event name/);
  assert.throws(() => buildSystemEvent({ event: "a", source: "x", severity: "critical" }), /severity/);
  assert.throws(() => buildSystemEvent({ event: "a" }), /source/);
});

test("a non-object detail is carried rather than rejected", () => {
  // An event is a by-product of work that already happened. Refusing a slightly
  // malformed detail would turn "we could not describe it" into "it failed".
  assert.deepEqual(buildSystemEvent({ event: "a", source: "b", detail: "oops" }).detail, {
    value: "oops",
  });
});

test("isKnownEvent catches a typo at the call site", () => {
  assert.ok(isKnownEvent(EVENTS.CRON_FAILED));
  assert.ok(!isKnownEvent("cron.failedd"));
});

// ── Recording must never break the work it describes ─────────────────────────

for (const [name, source] of [["Mission Control", mcRecorder], ["the main site", mainRecorder]]) {
  test(`${name}'s recorder swallows its own failure instead of failing the caller`, () => {
    assert.match(source, /try \{/);
    assert.match(source, /catch \(err\)/);
    assert.doesNotMatch(source, /throw /, "a log outage would break a publish, purge or cron");
    assert.match(source, /return false/);
  });
}

// ── The cron wrapper ─────────────────────────────────────────────────────────

test("a rejected cron probe is not recorded as a job run", () => {
  assert.match(cronWrapper, /status === 401 \|\| response\.status === 503/);
});

test("a crashed cron is recorded and then re-thrown, never swallowed", () => {
  const catchBlock = cronWrapper.slice(cronWrapper.indexOf("} catch (err) {"));
  assert.match(catchBlock, /EVENTS\.CRON_FAILED/);
  assert.match(catchBlock, /throw err;/);
});

test("instrumenting a cron cannot change the response Vercel sees", () => {
  assert.match(cronWrapper, /response\.clone\(\)\.json\(\)/);
  assert.match(cronWrapper, /return response;/);
});

test("every scheduled cron route is wrapped", async () => {
  const jobs = [
    "check-stale-listings",
    "purge-chat-messages",
    "recompute-broker-metrics",
    "sweep-pending-requests",
  ];
  for (const job of jobs) {
    const route = await read(mainRoot, "src", "app", "api", "cron", job, "route.js");
    assert.match(
      route,
      new RegExp(`withCronEventLog\\("${job}"`),
      `${job} runs in production and records nothing`,
    );
    assert.doesNotMatch(
      route,
      /export async function GET\(/,
      `${job} still exports a bare GET, so the wrapper is bypassed`,
    );
  }
});

// ── The table ────────────────────────────────────────────────────────────────

test("the system log is a separate table from the human action log", () => {
  assert.match(migration, /create table if not exists public\.system_events/);
  assert.doesNotMatch(migration, /alter table public\.mission_control_actions/);
  assert.doesNotMatch(migration, /actor_id/, "a system event has no actor and must not pretend to");
});

test("the table is service-role only, like every other Mission Control table", () => {
  assert.match(migration, /alter table public\.system_events enable row level security/);
  assert.doesNotMatch(migration, /create policy/);
});

test("severity is constrained at the database boundary, not only in JavaScript", () => {
  assert.match(migration, /system_events_severity_check/);
  for (const s of SEVERITIES) assert.match(migration, new RegExp(`'${s}'`));
});

test("the migration is additive and idempotent", () => {
  assert.match(migration, /create table if not exists/);
  assert.doesNotMatch(migration, /drop table/i);
  for (const m of migration.match(/create index/g) || []) {
    // every index creation must be guarded
  }
  assert.equal(
    (migration.match(/create index /g) || []).length,
    (migration.match(/create index if not exists /g) || []).length,
    "an unguarded index makes the migration fail on a re-run",
  );
});

test("finding what went wrong stays fast as routine rows accumulate", () => {
  assert.match(migration, /idx_system_events_problems/);
  assert.match(migration, /where severity in \('warning', 'error'\)/);
});

// ── The surface ──────────────────────────────────────────────────────────────

test("system events are shown on their own page, not mixed into the audit log", () => {
  assert.match(systemPage, /from\("system_events"\)/);
  assert.doesNotMatch(
    auditPage,
    /system_events/,
    "machine events in the human accountability log make both harder to read",
  );
});

test("the page can be narrowed to problems", () => {
  assert.match(systemPage, /filter=problems/);
  assert.match(systemPage, /\.in\("severity", \["warning", "error"\]\)/);
});

test("the page is Ops Manager and above, like the audit log", () => {
  assert.match(systemPage, /staff\.tier < TIERS\.OPS_MANAGER/);
});
