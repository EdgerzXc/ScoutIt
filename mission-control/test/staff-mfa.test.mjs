import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  MFA_TIERS,
  requiresAal2,
  isSessionAal2,
  evaluateMfaStatus,
} from "../src/lib/mfaPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("requiresAal2 enforces MFA strictly on Tier 2+ staff", () => {
  assert.equal(requiresAal2(MFA_TIERS.AGENT), false);
  assert.equal(requiresAal2(1), false);
  assert.equal(requiresAal2(MFA_TIERS.OPS_MANAGER), true);
  assert.equal(requiresAal2(2), true);
  assert.equal(requiresAal2(MFA_TIERS.SUPER_ADMIN), true);
  assert.equal(requiresAal2(3), true);
  assert.equal(requiresAal2(undefined), false);
  assert.equal(requiresAal2(null), false);
});

test("isSessionAal2 correctly detects AAL2 assurance", () => {
  assert.equal(isSessionAal2("aal2"), true);
  assert.equal(isSessionAal2("aal1"), false);
  assert.equal(isSessionAal2(null), false);
  assert.equal(isSessionAal2(""), false);
});

test("evaluateMfaStatus grants Agent access without requiring AAL2", () => {
  const result = evaluateMfaStatus({
    tier: MFA_TIERS.AGENT,
    currentLevel: "aal1",
    nextLevel: "aal1",
  });
  assert.equal(result.mfaRequired, false);
  assert.equal(result.allowAccess, true);
});

test("evaluateMfaStatus blocks Tier 2+ staff on AAL1 and prompts enrollment or challenge", () => {
  // Not yet enrolled
  const unenrolled = evaluateMfaStatus({
    tier: MFA_TIERS.OPS_MANAGER,
    currentLevel: "aal1",
    nextLevel: "aal1",
  });
  assert.equal(unenrolled.mfaRequired, true);
  assert.equal(unenrolled.enrolledMfa, false);
  assert.equal(unenrolled.allowAccess, false);
  assert.match(unenrolled.reason, /MFA_ENROLLMENT_REQUIRED/);

  // Enrolled but not yet challenged for current session
  const enrolledUnchallenged = evaluateMfaStatus({
    tier: MFA_TIERS.SUPER_ADMIN,
    currentLevel: "aal1",
    nextLevel: "aal2",
  });
  assert.equal(enrolledUnchallenged.mfaRequired, true);
  assert.equal(enrolledUnchallenged.enrolledMfa, true);
  assert.equal(enrolledUnchallenged.allowAccess, false);
  assert.match(enrolledUnchallenged.reason, /MFA_CHALLENGE_REQUIRED/);
});

test("evaluateMfaStatus allows Tier 2+ staff once session achieves AAL2", () => {
  const verified = evaluateMfaStatus({
    tier: MFA_TIERS.OPS_MANAGER,
    currentLevel: "aal2",
    nextLevel: "aal2",
  });
  assert.equal(verified.mfaRequired, false);
  assert.equal(verified.enrolledMfa, true);
  assert.equal(verified.allowAccess, true);
});

test("STAFF_MFA_RECOVERY_RUNBOOK exists and specifies break-glass SOP", () => {
  const runbookPath = path.resolve(
    root,
    "..",
    "_SCOUTIT_BRAIN",
    "02_ARCHITECTURE_AND_STRUCTURE",
    "STAFF_MFA_RECOVERY_RUNBOOK.md"
  );
  assert.ok(existsSync(runbookPath), "Recovery runbook document must exist");
  const content = readFileSync(runbookPath, "utf8");
  assert.match(content, /AAL2/);
  assert.match(content, /break-glass|recovery/i);
  assert.match(content, /admin_users/);
  assert.match(content, /totp/i);
});
