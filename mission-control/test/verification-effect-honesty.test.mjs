import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DECISION_EFFECT_NOTICE,
  DOWNSTREAM_BADGE_WRITER,
  decisionButtonLabel,
  describesEffect,
} from "../src/lib/verificationEffectPolicy.mjs";

// A-070 — Approving a verification in Mission Control changes nothing.
// `verification_requests` is written and read only inside Mission Control:
// a decision sets status='approved' and writes an audit row, and stops there.
// It does not set `user_profiles.prc_verified`, does not touch
// `broker_profiles`, and lights no badge anywhere.
//
// The harm is not the missing sync. It is that there are TWO competing PRC
// surfaces and staff are pointed at the one with no effect, behind a button
// labelled "Verify" with a shield icon. A staff member who approved a PRC
// licence here would reasonably believe the badge was now live.
//
// Reconciling the two writers is owner-gated (see WAITING). What is fixed
// here is the false promise: the console now says what it actually does.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const page = await readFile(
  path.join(root, "src", "app", "dashboard", "verification", "page.js"),
  "utf8",
);
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "verification", "actions.js"),
  "utf8",
);

test("the control records a decision and does not claim to verify", () => {
  assert.equal(decisionButtonLabel("approved"), "Record approval");
  assert.equal(decisionButtonLabel("rejected"), "Record rejection");
  assert.ok(!decisionButtonLabel("approved").match(/^Verify$/));
});

test("the notice states plainly that no badge is applied, and names the real writer", () => {
  assert.match(DECISION_EFFECT_NOTICE, /does not/i);
  assert.match(DECISION_EFFECT_NOTICE, /badge/i);
  assert.match(DECISION_EFFECT_NOTICE, /prc_verified/);
  assert.equal(DOWNSTREAM_BADGE_WRITER, "/api/admin/prc");
  assert.match(DECISION_EFFECT_NOTICE, /\/api\/admin\/prc/);
});

test("describesEffect refuses a claim the action cannot keep", () => {
  assert.equal(describesEffect("This marks the broker as PRC verified."), false);
  assert.equal(describesEffect("This verifies the licence and lights the badge."), false);
  assert.equal(describesEffect(DECISION_EFFECT_NOTICE), true);
});

test("the verification page renders the notice rather than an unqualified Verify button", () => {
  // Assert it is RENDERED, not merely imported. The first version of this
  // check passed with the notice deleted, because the import line still
  // mentioned the symbol — the same vacuous-guard shape U-021 was opened for.
  assert.match(page, /\{DECISION_EFFECT_NOTICE\}/);
  assert.match(page, /\{decisionButtonLabel\("approved"\)\}/);
  assert.match(page, /\{decisionButtonLabel\("rejected"\)\}/);
  assert.ok(!page.includes("                    Verify\n"));
});

test("the action records why it stops at the decision, naming A-070", () => {
  assert.match(actions, /A-070/);
  assert.match(actions, /prc_verified/);
});

test("the action still writes no downstream flag — a second writer is the defect, not the fix", () => {
  // A-070's acceptance test 3: two independent writers of the same flag is
  // the defect. Wiring a second one here without retiring /api/admin/prc
  // would create exactly that, and could half-fail across two systems.
  // Check for a WRITE, not a mention — the comment above `approveVerification`
  // names both tables deliberately, to record why it does not touch them.
  assert.ok(!/\.from\(\s*["'`]user_profiles["'`]/.test(actions));
  assert.ok(!/\.from\(\s*["'`]broker_profiles["'`]/.test(actions));
  assert.ok(!/prc_verified\s*:/.test(actions));
  // The only table this action writes is its own queue.
  const written = [...actions.matchAll(/\.from\(\s*["'`]([a-z_]+)["'`]/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(written)], ["verification_requests"]);
});
