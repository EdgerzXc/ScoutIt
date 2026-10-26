import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  REVIEW_DISPUTE_OUTCOMES,
  daysPending,
  isStalledDispute,
  validateDisputeResolution,
  formatDisputeNotification,
} from "../src/lib/reviewDisputePolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("daysPending calculates correct calendar day delta", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  assert.equal(daysPending("2026-10-26T12:00:00Z", now), 0);
  assert.equal(daysPending("2026-10-25T12:00:00Z", now), 1);
  assert.equal(daysPending("2026-10-19T12:00:00Z", now), 7);
  assert.equal(daysPending(null, now), 0);
  assert.equal(daysPending("invalid-date", now), 0);
});

test("isStalledDispute flags disputes open for 7 or more days", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  assert.equal(isStalledDispute("2026-10-22T12:00:00Z", 7, now), false); // 4 days
  assert.equal(isStalledDispute("2026-10-20T12:00:00Z", 7, now), false); // 6 days
  assert.equal(isStalledDispute("2026-10-19T12:00:00Z", 7, now), true); // 7 days
  assert.equal(isStalledDispute("2026-10-10T12:00:00Z", 7, now), true); // 16 days
});

test("validateDisputeResolution enforces valid outcomes and substantive reasons", () => {
  assert.equal(
    validateDisputeResolution({ outcome: "invalid_choice", reason: "Valid reason here" }).valid,
    false
  );
  assert.equal(
    validateDisputeResolution({ outcome: REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW, reason: "Too short" }).valid,
    false
  );
  assert.equal(
    validateDisputeResolution({
      outcome: REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW,
      reason: "Verified payment receipts confirm legitimate review rating.",
    }).valid,
    true
  );
  assert.equal(
    validateDisputeResolution({
      outcome: REVIEW_DISPUTE_OUTCOMES.REMOVE_REVIEW,
      reason: "Party communication logs prove retaliatory nature of rating.",
    }).valid,
    true
  );
});

test("formatDisputeNotification crafts differentiated notices for parties", () => {
  const reason = "Verified transaction documentation confirms rating validity.";
  const reviewerUpheld = formatDisputeNotification({
    outcome: REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW,
    reason,
    isReviewer: true,
  });
  const targetUpheld = formatDisputeNotification({
    outcome: REVIEW_DISPUTE_OUTCOMES.UPHOLD_REVIEW,
    reason,
    isReviewer: false,
  });

  assert.match(reviewerUpheld.title, /Review Upheld/);
  assert.match(reviewerUpheld.desc, /meets community integrity standards/);
  assert.match(targetUpheld.title, /Review Dispute Concluded/);
  assert.match(targetUpheld.desc, /upheld and restored to standing/);

  const reviewerRemoved = formatDisputeNotification({
    outcome: REVIEW_DISPUTE_OUTCOMES.REMOVE_REVIEW,
    reason,
    isReviewer: true,
  });
  const targetRemoved = formatDisputeNotification({
    outcome: REVIEW_DISPUTE_OUTCOMES.REMOVE_REVIEW,
    reason,
    isReviewer: false,
  });

  assert.match(reviewerRemoved.desc, /removed from the user's behavioral record/);
  assert.match(targetRemoved.desc, /permanently quarantined from your standing/);
});

test("layout.js registers Review Disputes at Ops Manager tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/reviews["']/);
  assert.match(layout, /Review Disputes/);
  assert.match(layout, /href:\s*["']\/dashboard\/reviews["'][\s\S]*?minTier:\s*TIERS\.OPS_MANAGER/);
});

test("reviews/actions.js enforces Ops Manager tier and audit logging", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "reviews", "actions.js"), "utf8");
  assert.match(actions, /assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /logActionStrict\(\{[\s\S]*?targetTable:\s*["']user_behavioral_reviews["']/);
  assert.match(actions, /recomputeTargetUserMetrics/);
  assert.match(actions, /notifyUser/);
});

test("dashboard/page.js checks for pending review disputes and links to /dashboard/reviews", async () => {
  const page = await readFile(path.join(root, "src", "app", "dashboard", "page.js"), "utf8");
  assert.match(page, /user_behavioral_reviews/);
  assert.match(page, /href=["']\/dashboard\/reviews["']/);
  assert.match(page, /Behavioral Review/);
});
