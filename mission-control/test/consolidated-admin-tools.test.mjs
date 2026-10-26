import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateRefundRequest,
  validateGrantRequest,
  formatTransactionKind,
} from "../src/lib/walletPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("validateRefundRequest enforces positive amounts, max 500, and >= 10 char reasons", () => {
  assert.equal(validateRefundRequest({ amount: 0, reason: "Valid detailed reason here" }).valid, false);
  assert.equal(validateRefundRequest({ amount: -5, reason: "Valid detailed reason here" }).valid, false);
  assert.equal(validateRefundRequest({ amount: 501, reason: "Valid detailed reason here" }).valid, false);
  assert.equal(validateRefundRequest({ amount: 10, reason: "short" }).valid, false);
  assert.equal(validateRefundRequest({ amount: 10, reason: "Platform double debit on proposal submit" }).valid, true);
});

test("validateGrantRequest enforces positive amounts, max 1000, and >= 5 char reasons", () => {
  assert.equal(validateGrantRequest({ amount: 0, reason: "Bonus" }).valid, false);
  assert.equal(validateGrantRequest({ amount: 1001, reason: "Bonus grant" }).valid, false);
  assert.equal(validateGrantRequest({ amount: 50, reason: "abc" }).valid, false);
  assert.equal(validateGrantRequest({ amount: 50, reason: "Founding member bonus" }).valid, true);
});

test("formatTransactionKind produces consistent sign and label mappings", () => {
  const refund = formatTransactionKind("refund");
  assert.equal(refund.sign, "+");
  assert.equal(refund.label, "Refund");

  const spend = formatTransactionKind("spend");
  assert.equal(spend.sign, "-");
  assert.equal(spend.label, "Connects Spent");

  const grant = formatTransactionKind("grant");
  assert.equal(grant.sign, "+");
  assert.equal(grant.label, "Monthly Grant");
});

test("layout.js registers Submissions, PRC Licenses, and Connects Wallet at Ops Manager tier", async () => {
  const layoutSource = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layoutSource, /name:\s*"Submissions & PDF",\s*href:\s*"\/dashboard\/submissions",\s*icon:[^,]+,\s*minTier:\s*TIERS\.OPS_MANAGER/);
  assert.match(layoutSource, /name:\s*"PRC Licenses",\s*href:\s*"\/dashboard\/prc",\s*icon:[^,]+,\s*minTier:\s*TIERS\.OPS_MANAGER/);
  assert.match(layoutSource, /name:\s*"Connects Wallet",\s*href:\s*"\/dashboard\/wallet",\s*icon:[^,]+,\s*minTier:\s*TIERS\.OPS_MANAGER/);
});

test("Server Actions strictly enforce RBAC across all consolidated admin tools", async () => {
  const walletActions = await readFile(path.join(root, "src", "app", "dashboard", "wallet", "actions.js"), "utf8");
  assert.match(walletActions, /lookupUserWallet[\s\S]*?assertTier\(staff,\s*TIERS\.AGENT\)/);
  assert.match(walletActions, /refundConnectsAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(walletActions, /grantDiscretionaryConnectsAction[\s\S]*?assertTier\(staff,\s*TIERS\.SUPER_ADMIN\)/);

  const prcActions = await readFile(path.join(root, "src", "app", "dashboard", "prc", "actions.js"), "utf8");
  assert.match(prcActions, /loadPrcProfiles[\s\S]*?assertTier\(staff,\s*TIERS\.AGENT\)/);
  assert.match(prcActions, /updatePrcVerificationAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);

  const subActions = await readFile(path.join(root, "src", "app", "dashboard", "submissions", "actions.js"), "utf8");
  assert.match(subActions, /loadSubmissionsQueue[\s\S]*?assertTier\(staff,\s*TIERS\.AGENT\)/);
  assert.match(subActions, /verifyPdfDraftAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(subActions, /approveSubmissionAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(subActions, /generatePropertySeoAction[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
});
