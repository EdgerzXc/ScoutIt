import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  SIGNAL_STATUSES,
  MODERATION_ACTIONS,
  targetStatusForAction,
  isReasonRequired,
  allowedActionsForStatus,
  evaluateSignalDecision,
  signalModerationPatch,
  isPubliclyVisibleSignal,
  signalStatusLabel,
} from "../src/lib/signalModerationPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const actionsSrc = await readFile(
  path.join(root, "src", "app", "dashboard", "community", "actions.js"),
  "utf8"
);
const pageSrc = await readFile(
  path.join(root, "src", "app", "dashboard", "community", "page.js"),
  "utf8"
);
const layoutSrc = await readFile(
  path.join(root, "src", "app", "dashboard", "layout.js"),
  "utf8"
);

const makeSignal = (status = SIGNAL_STATUSES.UNDER_REVIEW, overrides = {}) => ({
  id: "00000000-0000-0000-0000-000000000001",
  author_account_id: "acc_test_123",
  scout_id_snapshot: "SCOUT-1234",
  public_identity_mode: "anonymous",
  signal_type: "LOOKING_FOR",
  commercial_flag: false,
  status,
  title: "Looking for 500sqm office in BGC",
  body: "Need 500sqm fitted space with parking.",
  created_at: "2026-10-11T12:00:00.000Z",
  updated_at: "2026-10-11T12:00:00.000Z",
  last_confirmed_at: "2026-10-11T12:00:00.000Z",
  closed_at: null,
  ...overrides,
});

// ─────────────────────────────────────────────────────────────────────────
// A-145 P2a Policy Transitions
// ─────────────────────────────────────────────────────────────────────────

test("targetStatusForAction maps every action to a valid non-closed, non-expired status", () => {
  assert.equal(targetStatusForAction(MODERATION_ACTIONS.RESTORE_LIVE), SIGNAL_STATUSES.LIVE);
  assert.equal(targetStatusForAction(MODERATION_ACTIONS.HOLD_FOR_REVIEW), SIGNAL_STATUSES.UNDER_REVIEW);
  assert.equal(targetStatusForAction(MODERATION_ACTIONS.LIMIT), SIGNAL_STATUSES.LIMITED);
  assert.equal(targetStatusForAction(MODERATION_ACTIONS.REQUEST_EDIT), SIGNAL_STATUSES.NEEDS_EDIT);
  assert.equal(targetStatusForAction(MODERATION_ACTIONS.REMOVE), SIGNAL_STATUSES.REMOVED);

  // Policy never maps any action to closed or expired
  for (const action of Object.values(MODERATION_ACTIONS)) {
    const target = targetStatusForAction(action);
    assert.notEqual(target, SIGNAL_STATUSES.CLOSED, "moderation must never target closed");
    assert.notEqual(target, SIGNAL_STATUSES.EXPIRED, "moderation must never target expired");
  }

  assert.equal(targetStatusForAction("invalid_action"), null);
});

test("isReasonRequired marks destructive/restricting decisions as requiring explanation", () => {
  assert.equal(isReasonRequired(MODERATION_ACTIONS.REMOVE), true);
  assert.equal(isReasonRequired(MODERATION_ACTIONS.LIMIT), true);
  assert.equal(isReasonRequired(MODERATION_ACTIONS.REQUEST_EDIT), true);
  assert.equal(isReasonRequired(MODERATION_ACTIONS.HOLD_FOR_REVIEW), false);
  assert.equal(isReasonRequired(MODERATION_ACTIONS.RESTORE_LIVE), false);
});

test("under_review signal can be approved to live, requested edit, or removed", () => {
  const signal = makeSignal(SIGNAL_STATUSES.UNDER_REVIEW);

  // Approve to live
  const approve = evaluateSignalDecision(signal, MODERATION_ACTIONS.RESTORE_LIVE);
  assert.equal(approve.allowed, true);
  assert.equal(approve.targetStatus, SIGNAL_STATUSES.LIVE);

  // Request edit with reason
  const reqEdit = evaluateSignalDecision(signal, MODERATION_ACTIONS.REQUEST_EDIT, {
    reason: "Please clarify square footage range",
  });
  assert.equal(reqEdit.allowed, true);
  assert.equal(reqEdit.targetStatus, SIGNAL_STATUSES.NEEDS_EDIT);

  // Request edit without reason is refused
  const reqEditNoReason = evaluateSignalDecision(signal, MODERATION_ACTIONS.REQUEST_EDIT, { reason: "" });
  assert.equal(reqEditNoReason.allowed, false);
  assert.match(reqEditNoReason.reason, /non-empty reason is strictly required/);

  // Remove with reason
  const remove = evaluateSignalDecision(signal, MODERATION_ACTIONS.REMOVE, {
    reason: "Direct phone number dump violates posting rules",
  });
  assert.equal(remove.allowed, true);
  assert.equal(remove.targetStatus, SIGNAL_STATUSES.REMOVED);

  // Remove without reason is refused
  const removeNoReason = evaluateSignalDecision(signal, MODERATION_ACTIONS.REMOVE, { reason: "   " });
  assert.equal(removeNoReason.allowed, false);
  assert.match(removeNoReason.reason, /non-empty reason is strictly required/);
});

test("live signal can be held for review, limited, or removed", () => {
  const live = makeSignal(SIGNAL_STATUSES.LIVE);

  const review = evaluateSignalDecision(live, MODERATION_ACTIONS.HOLD_FOR_REVIEW);
  assert.equal(review.allowed, true);
  assert.equal(review.targetStatus, SIGNAL_STATUSES.UNDER_REVIEW);

  const limitWithReason = evaluateSignalDecision(live, MODERATION_ACTIONS.LIMIT, {
    reason: "Repetitive intent in the same district",
  });
  assert.equal(limitWithReason.allowed, true);
  assert.equal(limitWithReason.targetStatus, SIGNAL_STATUSES.LIMITED);

  const limitNoReason = evaluateSignalDecision(live, MODERATION_ACTIONS.LIMIT, { reason: "" });
  assert.equal(limitNoReason.allowed, false);

  const removeWithReason = evaluateSignalDecision(live, MODERATION_ACTIONS.REMOVE, {
    reason: "Prohibited commercial solicitation",
  });
  assert.equal(removeWithReason.allowed, true);
});

test("limited signal can be restored to live, held for review, or removed", () => {
  const limited = makeSignal(SIGNAL_STATUSES.LIMITED);

  const restore = evaluateSignalDecision(limited, MODERATION_ACTIONS.RESTORE_LIVE);
  assert.equal(restore.allowed, true);
  assert.equal(restore.targetStatus, SIGNAL_STATUSES.LIVE);

  const review = evaluateSignalDecision(limited, MODERATION_ACTIONS.HOLD_FOR_REVIEW);
  assert.equal(review.allowed, true);

  const remove = evaluateSignalDecision(limited, MODERATION_ACTIONS.REMOVE, {
    reason: "Flagged spam",
  });
  assert.equal(remove.allowed, true);
});

test("needs_edit signal can be restored to live or removed", () => {
  const needsEdit = makeSignal(SIGNAL_STATUSES.NEEDS_EDIT);

  const restore = evaluateSignalDecision(needsEdit, MODERATION_ACTIONS.RESTORE_LIVE);
  assert.equal(restore.allowed, true);

  const remove = evaluateSignalDecision(needsEdit, MODERATION_ACTIONS.REMOVE, {
    reason: "Author refused revision",
  });
  assert.equal(remove.allowed, true);
});

test("removed signal can be restored to live by staff", () => {
  const removed = makeSignal(SIGNAL_STATUSES.REMOVED);

  const restore = evaluateSignalDecision(removed, MODERATION_ACTIONS.RESTORE_LIVE);
  assert.equal(restore.allowed, true);
  assert.equal(restore.targetStatus, SIGNAL_STATUSES.LIVE);
});

test("closed signals are author-owned and can never be moderated", () => {
  const closed = makeSignal(SIGNAL_STATUSES.CLOSED, { closed_at: "2026-10-11T12:00:00Z" });

  for (const action of Object.values(MODERATION_ACTIONS)) {
    const verdict = evaluateSignalDecision(closed, action, { reason: "Trying to moderate closed" });
    assert.equal(verdict.allowed, false);
    assert.match(verdict.reason, /author-owned/);
  }
});

test("expired signals are lifecycle-owned and can never be moderated", () => {
  const expired = makeSignal(SIGNAL_STATUSES.EXPIRED);

  for (const action of Object.values(MODERATION_ACTIONS)) {
    const verdict = evaluateSignalDecision(expired, action, { reason: "Trying to moderate expired" });
    assert.equal(verdict.allowed, false);
    assert.match(verdict.reason, /lifecycle-owned/);
  }
});

test("a signal already in target status cannot transition to itself", () => {
  const live = makeSignal(SIGNAL_STATUSES.LIVE);
  const verdict = evaluateSignalDecision(live, MODERATION_ACTIONS.RESTORE_LIVE);
  assert.equal(verdict.allowed, false);
  assert.match(verdict.reason, /already in "live" status/);
});

test("signalModerationPatch builds atomic status and timestamp update", () => {
  const now = "2026-10-11T14:30:00.000Z";
  const patch = signalModerationPatch({ action: MODERATION_ACTIONS.LIMIT, now });
  assert.deepEqual(patch, {
    status: SIGNAL_STATUSES.LIMITED,
    updated_at: now,
  });
});

test("isPubliclyVisibleSignal reflects public feed projection (live and limited only)", () => {
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.LIVE), true);
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.LIMITED), true);

  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.UNDER_REVIEW), false);
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.NEEDS_EDIT), false);
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.REMOVED), false);
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.CLOSED), false);
  assert.equal(isPubliclyVisibleSignal(SIGNAL_STATUSES.EXPIRED), false);

  assert.equal(isPubliclyVisibleSignal({ status: SIGNAL_STATUSES.LIVE }), true);
  assert.equal(isPubliclyVisibleSignal({ status: SIGNAL_STATUSES.REMOVED }), false);
});

// ─────────────────────────────────────────────────────────────────────────
// Structural Contract & Boundary Checks
// ─────────────────────────────────────────────────────────────────────────

test("actions.js enforces Ops Manager (Tier 2)+ and strict immutable audit", () => {
  assert.match(actionsSrc, /assertTier\s*\(\s*staff\s*,\s*TIERS\.OPS_MANAGER\s*\)/);
  assert.match(actionsSrc, /logActionStrict\s*\(\{/);
  assert.match(actionsSrc, /targetTable:\s*["']stratosphere_signals["']/);
  assert.match(actionsSrc, /revalidatePath\s*\(\s*["']\/dashboard\/community["']\s*\)/);
});

test("actions.js never deletes records (history retention invariant)", () => {
  assert.doesNotMatch(actionsSrc, /\.delete\s*\(/);
  assert.doesNotMatch(actionsSrc, /DELETE FROM/i);
});

test("actions.js re-reads live row and applies optimistic status guard", () => {
  assert.match(actionsSrc, /\.from\s*\(\s*["']stratosphere_signals["']\s*\)\s*\.select/);
  assert.match(actionsSrc, /\.eq\s*\(\s*["']status["']\s*,\s*row\.status\s*\)/);
});

test("layout.js registers Community Signals at Ops Manager tier", () => {
  assert.match(layoutSrc, /\/dashboard\/community/);
  assert.match(layoutSrc, /Community Signals/);
});

test("page.js guards action forms with canDecide check", () => {
  assert.match(pageSrc, /staff\.tier\s*>=\s*TIERS\.OPS_MANAGER/);
  assert.match(pageSrc, /canDecide/);
});
