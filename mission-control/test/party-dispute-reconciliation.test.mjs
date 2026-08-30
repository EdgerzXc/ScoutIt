import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  PARTY_HOLD_STATUSES,
  PARTY_INITIAL_STATUS,
  PARTY_REASON_LABELS,
  holdsThread,
  mirrorStatusFor,
  partyStatusForTransition,
  releasesHold,
  titleForFiling,
} from "../src/lib/partyDisputePolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainSiteRetention = await readFile(
  path.join(root, "..", "src", "lib", "chatRetention.js"),
  "utf8",
);
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "disputes", "actions.js"),
  "utf8",
);
const page = await readFile(
  path.join(root, "src", "app", "dashboard", "disputes", "page.js"),
  "utf8",
);

// ── The copy that cannot be an import ────────────────────────────────────────
// Mission Control and the main site are separate packages, so the hold
// vocabulary is duplicated here by necessity. A duplicate nobody checks is how
// a thread gets purged while it is under mediation: the console would believe
// it had placed a hold in a word the purge job has never heard of.

test("the hold statuses match the main site's retention module exactly", () => {
  const declared = mainSiteRetention.match(
    /DISPUTE_HOLD_STATUSES = Object\.freeze\(\[([^\]]*)\]\)/,
  );
  assert.ok(declared, "the main site no longer declares DISPUTE_HOLD_STATUSES as a frozen array");

  const mainSite = declared[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  assert.deepEqual([...PARTY_HOLD_STATUSES], mainSite);
});

test("the initial status matches the one filing actually writes", () => {
  const declared = mainSiteRetention.match(/INITIAL_DISPUTE_STATUS = "([^"]+)"/);
  assert.ok(declared, "the main site no longer declares INITIAL_DISPUTE_STATUS");
  assert.equal(PARTY_INITIAL_STATUS, declared[1]);
  assert.ok(holdsThread(PARTY_INITIAL_STATUS), "a filing must arrive holding the thread");
});

test("every ground a party can file on has the label they were shown", () => {
  const declared = mainSiteRetention.match(/DISPUTE_REASONS = Object\.freeze\(\[([^\]]*)\]\)/);
  assert.ok(declared, "the main site no longer declares DISPUTE_REASONS as a frozen array");

  const reasons = declared[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  assert.deepEqual(Object.keys(PARTY_REASON_LABELS).sort(), [...reasons].sort());

  for (const reason of reasons) {
    const label = mainSiteRetention.match(
      new RegExp(`${reason}:\\s*"([^"]+)"`),
    );
    assert.ok(label, `${reason} has no label on the main site`);
    assert.equal(
      PARTY_REASON_LABELS[reason],
      label[1],
      `${reason} reads differently to staff than it did to the person who filed it`,
    );
  }
});

// ── The transitions ─────────────────────────────────────────────────────────

test("taking mediation keeps the conversation held", () => {
  const status = partyStatusForTransition("claim");
  assert.ok(holdsThread(status), "claiming a dispute must not expose the thread to the purge");
  assert.equal(releasesHold("claim"), false);
  assert.equal(mirrorStatusFor(status), "investigating");
});

test("closing a dispute releases the hold, in both outcomes", () => {
  for (const outcome of ["resolved", "dismissed"]) {
    assert.equal(partyStatusForTransition(outcome), outcome);
    assert.equal(holdsThread(outcome), false);
    assert.equal(releasesHold(outcome), true, `${outcome} must be recorded as releasing the hold`);
    assert.equal(mirrorStatusFor(outcome), outcome);
  }
});

test("an unrecognised transition throws rather than guessing a status", () => {
  assert.throws(() => partyStatusForTransition("escalate"), /Unknown dispute transition/);
});

test("a filing gets a title a mediator can read without opening it", () => {
  const title = titleForFiling({
    reason: "abuse_or_threat",
    dealId: "3f2b91ca-0000-4000-8000-000000000000",
  });
  assert.match(title, /I was abused or threatened/);
  assert.match(title, /3f2b91ca/);
});

// ── The connector itself ────────────────────────────────────────────────────

test("the console reads the table a party actually files into", () => {
  assert.match(page, /from\("deal_disputes"\)/, "the queue never reads deal_disputes");
  assert.match(actions, /from\("deal_disputes"\)/, "no action ever touches deal_disputes");
});

test("every closing transition writes back to the party's row", () => {
  for (const name of ["claimDispute", "closeDispute", "adoptPartyDispute"]) {
    const start = actions.indexOf(`export async function ${name}(`);
    assert.notEqual(start, -1, `${name} is not exported`);
    const next = actions.indexOf("export async function ", start + 1);
    const body = actions.slice(start, next === -1 ? actions.length : next);
    assert.match(body, /await syncPartyDispute\(/, `${name} decides a status it never writes back`);
  }
});

test("adoption is tier-gated and enforces the tier before it touches data", () => {
  const start = actions.indexOf("export async function adoptPartyDispute(");
  const next = actions.indexOf("export async function ", start + 1);
  const body = actions.slice(start, next === -1 ? actions.length : next);

  const guard = body.indexOf("assertTier(staff, TIERS.AGENT)");
  const client = body.indexOf("const admin = createAdminClient();");
  const firstQuery = body.indexOf("await admin");

  assert.notEqual(guard, -1, "adoption is not tier-gated");
  assert.ok(guard < client, "adoption creates an admin client before enforcing the tier");
  assert.ok(client < firstQuery, "adoption queries before creating its client");
});

test("closing a party filing warns that the hold is about to be released", () => {
  assert.match(page, /releases the retention hold/i);
  assert.match(actions, /retention hold on that conversation is released/i);
});
