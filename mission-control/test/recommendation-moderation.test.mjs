import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DECISION_EVENTS,
  MODERATION_DECISIONS,
  MODERATION_STATES,
  evaluateDecision,
  isPubliclyVisible,
  moderationPatch,
  publicStateLabel,
  publicationBlocker,
  verificationLabel,
} from "../src/lib/recommendationModerationPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "recommendations", "actions.js"),
  "utf8",
);
const page = await readFile(
  path.join(root, "src", "app", "dashboard", "recommendations", "page.js"),
  "utf8",
);
const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
const migration = await readFile(
  path.join(
    root,
    "..",
    "supabase",
    "migrations",
    "20260826000002_broker_recommendations_contributions.sql",
  ),
  "utf8",
);

const consented = (overrides = {}) => ({
  id: "r1",
  broker_id: "b1",
  moderation_state: MODERATION_STATES.PENDING,
  consent_granted: true,
  consent_recorded_at: "2026-08-31T00:00:00.000Z",
  withdrawn_at: null,
  disputed_at: null,
  redacted_at: null,
  qualifying_handshake_id: "h1",
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────
// A-038 — consent gates publication.
//
// This is the rule the whole feature rests on. A recommendation is a named
// person's public statement about a licensed professional; if consent is
// absent or revoked, no tier and no note may publish it.
// ─────────────────────────────────────────────────────────────────────────

test("a consented, undisputed recommendation has nothing blocking publication", () => {
  assert.equal(publicationBlocker(consented()), null);
  assert.equal(evaluateDecision(consented(), MODERATION_DECISIONS.APPROVE).allowed, true);
});

test("consent that was never granted blocks publication", () => {
  const row = consented({ consent_granted: false });
  assert.match(publicationBlocker(row), /never granted consent/);
  assert.equal(evaluateDecision(row, MODERATION_DECISIONS.APPROVE).allowed, false);
});

test("a withdrawn recommendation can never be approved", () => {
  const row = consented({ withdrawn_at: "2026-08-31T01:00:00.000Z" });
  assert.match(publicationBlocker(row), /withdrew/);
  assert.equal(evaluateDecision(row, MODERATION_DECISIONS.APPROVE).allowed, false);
});

test("a disputed or redacted recommendation can never be approved", () => {
  for (const field of ["disputed_at", "redacted_at"]) {
    const row = consented({ [field]: "2026-08-31T01:00:00.000Z" });
    assert.notEqual(publicationBlocker(row), null, `${field} must block publication`);
    assert.equal(evaluateDecision(row, MODERATION_DECISIONS.APPROVE).allowed, false);
  }
});

test("a blocked recommendation can still be rejected", () => {
  // Otherwise a withdrawn entry sits in the queue forever with no way to
  // record that staff saw it and closed it.
  const row = consented({ withdrawn_at: "2026-08-31T01:00:00.000Z" });
  assert.equal(evaluateDecision(row, MODERATION_DECISIONS.REJECT).allowed, true);
});

test("a decision cannot be repeated, and an unknown decision is refused", () => {
  const approved = consented({ moderation_state: MODERATION_STATES.APPROVED });
  assert.equal(evaluateDecision(approved, MODERATION_DECISIONS.APPROVE).allowed, false);

  const rejected = consented({ moderation_state: MODERATION_STATES.REJECTED });
  assert.equal(evaluateDecision(rejected, MODERATION_DECISIONS.REJECT).allowed, false);

  assert.equal(evaluateDecision(consented(), "publish_everywhere").allowed, false);
  assert.equal(evaluateDecision(null, MODERATION_DECISIONS.APPROVE).allowed, false);
});

test("an approved row may still be rejected later", () => {
  // Consent revoked after approval is exactly the case that must remain
  // closable, and the public projection already hides it.
  const row = consented({
    moderation_state: MODERATION_STATES.APPROVED,
    withdrawn_at: "2026-08-31T02:00:00.000Z",
  });
  assert.equal(evaluateDecision(row, MODERATION_DECISIONS.REJECT).allowed, true);
});

test("the patch records who decided and when, and never deletes", () => {
  const now = "2026-08-31T03:00:00.000Z";
  const patch = moderationPatch({
    decision: MODERATION_DECISIONS.APPROVE,
    staffId: "staff-1",
    note: "  Verified against the handshake.  ",
    now,
  });

  assert.equal(patch.moderation_state, MODERATION_STATES.APPROVED);
  assert.equal(patch.moderated_by, "staff-1");
  assert.equal(patch.moderated_at, now);
  assert.equal(patch.moderation_note, "Verified against the handshake.");

  const rejection = moderationPatch({
    decision: MODERATION_DECISIONS.REJECT,
    staffId: "staff-1",
    note: "Contains contact details.",
    now,
  });
  assert.equal(rejection.moderation_state, MODERATION_STATES.REJECTED);
});

test("an over-long note is truncated rather than rejected at the database", () => {
  const patch = moderationPatch({
    decision: MODERATION_DECISIONS.REJECT,
    staffId: "s",
    note: "x".repeat(5000),
    now: "2026-08-31T03:00:00.000Z",
  });
  assert.equal(patch.moderation_note.length, 1000);
});

// ─────────────────────────────────────────────────────────────────────────
// The console must describe what the SITE shows, not its own status column.
// ─────────────────────────────────────────────────────────────────────────

test("public visibility mirrors the database's public index exactly", () => {
  const live = consented({ moderation_state: MODERATION_STATES.APPROVED });
  assert.equal(isPubliclyVisible(live), true);
  assert.equal(publicStateLabel(live), "Live on the dossier");

  // Approved, then consent revoked: the column says approved, the site shows
  // nothing, and the console must say so.
  const revoked = consented({
    moderation_state: MODERATION_STATES.APPROVED,
    withdrawn_at: "2026-08-31T04:00:00.000Z",
  });
  assert.equal(isPubliclyVisible(revoked), false);
  assert.equal(publicStateLabel(revoked), "Approved, not public");

  assert.equal(publicStateLabel(consented()), "Awaiting review");
});

test("the public index and isPubliclyVisible agree on their conditions", () => {
  const index = migration.slice(migration.indexOf("broker_recommendations_public_idx"));
  const definition = index.slice(0, index.indexOf(";"));

  for (const clause of [
    "moderation_state = 'approved'",
    "consent_granted IS TRUE",
    "withdrawn_at IS NULL",
    "disputed_at IS NULL",
  ]) {
    assert.ok(definition.includes(clause), `public index must still filter on ${clause}`);
  }
});

test("verification is labelled from the handshake, never from a moderator", () => {
  assert.equal(verificationLabel(consented()), "Verified ScoutIt connection");
  assert.equal(
    verificationLabel(consented({ qualifying_handshake_id: null })),
    "Client-submitted · unverified",
  );
});

// ─────────────────────────────────────────────────────────────────────────
// The action and the surface.
// ─────────────────────────────────────────────────────────────────────────

test("moderation requires Ops Manager and is audited immutably", () => {
  assert.match(actions, /assertTier\(staff, TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /logActionStrict\(/);
  assert.match(actions, /recommendation\.\$\{decision\}/);
});

test("the row is re-read at decision time, not trusted from the page", () => {
  const decide = actions.slice(actions.indexOf("export async function decideRecommendation"));
  const read = decide.indexOf('.from("broker_recommendations")');
  const evaluate = decide.indexOf("evaluateDecision(row, decision)");
  const update = decide.indexOf(".update(moderationPatch(");

  assert.ok(read > -1 && evaluate > read, "the policy must run on a freshly read row");
  assert.ok(update > evaluate, "the write must come after the policy verdict");
});

test("the update is guarded against a state that moved underneath it", () => {
  assert.match(actions, /\.eq\("moderation_state", row\.moderation_state\)/);
});

test("a rejection requires a reason", () => {
  assert.match(actions, /REJECT && !note[\s\S]*rejection requires a reason/);
});

test("nothing in the moderation surface deletes a row", () => {
  // Rejection retains the row so the consent record survives the decision.
  assert.doesNotMatch(actions, /\.delete\(\)/);
  assert.doesNotMatch(page, /\.delete\(\)/);
});

test("a failed audit fails the decision", () => {
  assert.match(actions, /could not be audited/);
  assert.equal(DECISION_EVENTS.approve, "recommendation_approved");
  assert.equal(DECISION_EVENTS.reject, "recommendation_rejected");
});

test("the audit event types exist in the database's CHECK constraint", () => {
  for (const event of Object.values(DECISION_EVENTS)) {
    assert.ok(migration.includes(`'${event}'`), `${event} must be an allowed audit event type`);
  }
});

test("the page shows the client's exact words and no score", () => {
  assert.match(page, /\{row\.body\}/);
  assert.doesNotMatch(page, /aggregateRating|averageRating|★/);
});

test("the approve control is disabled when publication is blocked", () => {
  assert.match(page, /disabled=\{Boolean\(blocker\)\}/);
  assert.match(page, /publicationBlocker\(row\)/);
});

test("private moderation evidence is never selected onto the page", () => {
  // `evidence_url` is moderation evidence, not presentation. Not selecting it
  // is a stronger guarantee than selecting it and remembering not to render it.
  assert.doesNotMatch(page, /evidence_url/);
});

test("the queue is reachable from the console navigation at Ops Manager", () => {
  assert.match(layout, /href: "\/dashboard\/recommendations"[\s\S]{0,120}TIERS\.OPS_MANAGER/);
});

test("an empty queue is described as normal, not as a fault", () => {
  assert.match(page, /empty queue is the normal state, not\s*\n?\s*a fault/);
});
