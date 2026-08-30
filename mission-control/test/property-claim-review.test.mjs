import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CLAIM_STATUSES,
  DECISION_REASON_CODES,
  NOT_YET_A_CLAIM,
  OPEN_CLAIM_STATUSES,
  REVIEW_TRANSITIONS,
  canTransition,
  describeConflict,
  validateDecision,
} from "../src/lib/propertyClaimPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "claims", "actions.js"),
  "utf8",
);
const page = await readFile(path.join(root, "src", "app", "dashboard", "claims", "page.js"), "utf8");

const GOOD_NOTE = "The title document matches the claimant's identification.";

// ── The queue shows the right things ─────────────────────────────────────────

test("a draft is never put in front of a reviewer", () => {
  for (const s of NOT_YET_A_CLAIM) {
    assert.ok(
      !OPEN_CLAIM_STATUSES.includes(s),
      `${s} is the claimant's unfinished sentence and must not appear in the queue`,
    );
  }
});

test("every open status is a status the database accepts", () => {
  for (const s of OPEN_CLAIM_STATUSES) assert.ok(CLAIM_STATUSES.includes(s), s);
});

// ── Nobody decides a claim they have not opened ──────────────────────────────

test("a claim cannot be approved or rejected straight off the queue", () => {
  for (const from of ["submitted", "technical_review", "needs_information", "disputed"]) {
    assert.equal(canTransition(from, "approve"), false, `approved from ${from}`);
    assert.equal(canTransition(from, "reject"), false, `rejected from ${from}`);
  }
  assert.equal(canTransition("human_review", "approve"), true);
  assert.equal(canTransition("human_review", "reject"), true);
});

test("taking a claim somebody already holds is refused", () => {
  assert.equal(canTransition("human_review", "take"), false);
  assert.equal(canTransition("submitted", "take"), true);
});

test("a decided claim is finished — reopening is a new claim, not an edit", () => {
  for (const done of ["approved", "rejected", "withdrawn", "closed"]) {
    for (const t of Object.keys(REVIEW_TRANSITIONS)) {
      assert.equal(canTransition(done, t), false, `${t} from ${done}`);
    }
  }
});

test("an unknown status denies rather than defaulting to allowed", () => {
  assert.equal(canTransition("something_new", "approve"), false);
  assert.equal(canTransition(undefined, "take"), false);
  assert.equal(canTransition("submitted", "delete_everything"), false);
});

// ── A decision carries a reason somebody signed ──────────────────────────────

test("approving or rejecting without a reason code is refused", () => {
  for (const t of ["approve", "reject"]) {
    const r = validateDecision({ transition: t, fromStatus: "human_review", reasonCode: "", note: GOOD_NOTE });
    assert.equal(r.ok, false);
    assert.match(r.message, /reason/i);
  }
});

test("a reason code borrowed from a different outcome is refused", () => {
  const r = validateDecision({
    transition: "approve",
    fromStatus: "human_review",
    reasonCode: "insufficient_evidence", // a rejection reason
    note: GOOD_NOTE,
  });
  assert.equal(r.ok, false);
});

test("'ok' is not an explanation for taking somebody's listing", () => {
  for (const note of ["", "ok", "n/a", "   ", "approved."]) {
    const r = validateDecision({
      transition: "approve",
      fromStatus: "human_review",
      reasonCode: "documents_verified",
      note,
    });
    assert.equal(r.ok, false, `accepted note: ${JSON.stringify(note)}`);
  }
});

test("a complete approval is accepted and is the only transition that moves a listing", () => {
  const r = validateDecision({
    transition: "approve",
    fromStatus: "human_review",
    reasonCode: "documents_verified",
    note: GOOD_NOTE,
  });
  assert.deepEqual(r, { ok: true, status: "approved", transfersListing: true });

  for (const t of ["take", "request_information", "reject"]) {
    assert.equal(REVIEW_TRANSITIONS[t].transfersListing, false, `${t} must not move a listing`);
  }
});

test("taking a claim needs no reason — it is not yet a decision", () => {
  const r = validateDecision({ transition: "take", fromStatus: "submitted" });
  assert.deepEqual(r, { ok: true, status: "human_review", transfersListing: false });
});

test("every reason code list belongs to a real outcome", () => {
  for (const outcome of Object.keys(DECISION_REASON_CODES)) {
    assert.ok(CLAIM_STATUSES.includes(outcome), `${outcome} is not a claim status`);
  }
});

// ── The comparison a reviewer actually needs ─────────────────────────────────

test("two people both claiming to own it is flagged as a direct conflict", () => {
  const c = describeConflict({ listerRelationship: "owner", claimedRelationship: "owner" });
  assert.equal(c.level, "direct");
  assert.match(c.text, /One of them is wrong/);
});

test("an owner claiming a broker's listing is the ordinary case, not an alarm", () => {
  const c = describeConflict({
    listerRelationship: "authorized_broker",
    claimedRelationship: "owner",
  });
  assert.equal(c.level, "expected");
});

test("a listing with no declared relationship says so instead of assuming owner", () => {
  const c = describeConflict({ listerRelationship: null, claimedRelationship: "owner" });
  assert.equal(c.level, "unknown");
  assert.match(c.text, /documents alone/);
});

// ── The action ───────────────────────────────────────────────────────────────

test("approval is Super Admin; the rest are Ops Manager", () => {
  assert.match(
    actions,
    /assertTier\(staff, rule\.transfersListing \? TIERS\.SUPER_ADMIN : TIERS\.OPS_MANAGER\)/,
  );
});

test("the status is re-checked against the live row, not the rendered page", () => {
  const readIdx = actions.indexOf('.from("property_claims")');
  const validateIdx = actions.indexOf("validateDecision({");
  assert.ok(readIdx !== -1 && validateIdx > readIdx, "the claim is validated before it is read");
  assert.match(actions, /fromStatus: claim\.status/);
});

test("the previous holder is recorded before the listing moves", () => {
  const body = actions.slice(actions.indexOf("if (verdict.transfersListing)"));
  const capture = body.indexOf("from_owner_id: property.owner_id");
  const write = body.indexOf('.from("properties")\n      .update(');
  assert.notEqual(capture, -1, "the previous owner is never captured");
  assert.ok(capture < write, "the listing moves before the previous holder is recorded");
});

test("a failed transfer never leaves a claim marked approved", () => {
  const body = actions.slice(actions.indexOf("if (transferErr)"));
  assert.match(body.slice(0, 400), /return \{ ok: false/);
});

test("a claim with no signed-in claimant cannot transfer a listing to nobody", () => {
  assert.match(actions, /if \(!claim\.claimant_user_id\)/);
});

test("every decision writes a claim event, an audit entry, and a transfer writes a system event", () => {
  assert.match(actions, /addClaimEvent\(admin, \{/);
  assert.match(actions, /action: `claim\.\$\{transition\}`/);
  assert.match(actions, /EVENTS\.LISTING_OWNERSHIP_TRANSFERRED/);
  assert.match(actions, /severity: "warning"/);
});

// ── The surface ──────────────────────────────────────────────────────────────

test("the page is Ops Manager and above", () => {
  assert.match(page, /staff\.tier < TIERS\.OPS_MANAGER/);
});

test("the reviewer is shown the conflict, not left to work it out", () => {
  assert.match(page, /describeConflict/);
});

test("an unscanned document is called out rather than quietly listed", () => {
  assert.match(page, /malware_scan_status !== "clean"/);
  assert.match(page, /Do not\s*\n?\s*open them/);
});
