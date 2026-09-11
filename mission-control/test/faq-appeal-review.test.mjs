import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  APPEAL_ACTIONS,
  APPEAL_STATES,
  expectedStatusFor,
  nextStatusFor,
  reviewBlockedReason,
} from "../src/lib/faqAppealReviewPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "faq-appeals", "actions.js"),
  "utf8",
);
const page = await readFile(
  path.join(root, "src", "app", "dashboard", "faq-appeals", "page.js"),
  "utf8",
);
const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
const migration = await readFile(
  path.join(root, "..", "supabase", "migrations", "20260814000003_faq_block_appeals.sql"),
  "utf8",
);

// ─────────────────────────────────────────────────────────────────────────
// A-133 — FAQ block appeals need a staff review screen before appeals switch
// on. The main-site route answers 503 while FAQ_APPEAL_ACTIVE is unset, and
// no component calls its GET or PATCH. This screen is the missing caller,
// and it must call the same review_faq_block_appeal function so there is
// exactly one writer of an appeal's state.
// ─────────────────────────────────────────────────────────────────────────

test("policy: start_review moves pending to under_review and nothing else", () => {
  assert.equal(nextStatusFor(APPEAL_STATES.PENDING, APPEAL_ACTIONS.START_REVIEW), "under_review");
  assert.equal(nextStatusFor(APPEAL_STATES.UNDER_REVIEW, APPEAL_ACTIONS.START_REVIEW), null);
});

test("policy: approve records a verdict from under_review only", () => {
  assert.equal(nextStatusFor(APPEAL_STATES.UNDER_REVIEW, APPEAL_ACTIONS.APPROVE), "approved");
  assert.equal(nextStatusFor(APPEAL_STATES.PENDING, APPEAL_ACTIONS.APPROVE), null);
});

test("policy: reject works from pending or under_review, never from decided", () => {
  assert.equal(nextStatusFor(APPEAL_STATES.PENDING, APPEAL_ACTIONS.REJECT), "rejected");
  assert.equal(nextStatusFor(APPEAL_STATES.UNDER_REVIEW, APPEAL_ACTIONS.REJECT), "rejected");
  assert.equal(nextStatusFor(APPEAL_STATES.APPROVED, APPEAL_ACTIONS.REJECT), null);
  assert.equal(nextStatusFor(APPEAL_STATES.REJECTED, APPEAL_ACTIONS.APPROVE), null);
});

test("policy: a stale view is a conflict, surfaced as reload-before-review", () => {
  assert.equal(expectedStatusFor(APPEAL_ACTIONS.START_REVIEW), "pending");
  assert.equal(expectedStatusFor(APPEAL_ACTIONS.APPROVE), "under_review");
  assert.match(reviewBlockedReason({ status: "approved" }, APPEAL_ACTIONS.APPROVE), /reload/i);
});

test("policy: rejection requires reviewer notes", () => {
  assert.match(reviewBlockedReason({ status: "pending" }, APPEAL_ACTIONS.REJECT, ""), /reason/i);
  assert.equal(reviewBlockedReason({ status: "pending" }, APPEAL_ACTIONS.REJECT, "spam"), null);
});

test("actions call the one writer and audit strictly", () => {
  assert.match(actions, /review_faq_block_appeal/);
  assert.match(actions, /logActionStrict/);
  assert.match(actions, /assertTier\(staff, TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /reload before reviewing/);
});

test("page shows block evidence with the owner's exact explanation", () => {
  assert.match(page, /explanation/);
  assert.match(page, /rule_code/);
  assert.match(page, /block_context/);
  // Approve writes a verdict only — it must never read as publishing the
  // blocked answer, because the RPC changes status and nothing else.
  assert.match(page, /verdict/i);
  assert.doesNotMatch(page, /Publish answer/);
});

test("page gates decisions to Ops Manager and keeps loading/empty/error states", () => {
  assert.match(page, /OPS_MANAGER/);
  assert.match(page, /Nothing is waiting/);
  assert.match(page, /unavailable/);
});

test("queue is reachable from the dashboard nav", () => {
  assert.match(layout, /faq-appeals/);
});

test("migration backs the states the screen acts on", () => {
  assert.match(migration, /pending.*under_review.*approved.*rejected/s);
  assert.match(migration, /APPEAL_CONFLICT/);
});
