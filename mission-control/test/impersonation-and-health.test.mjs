import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateImpersonationRequest,
  generateImpersonationToken,
  verifyImpersonationToken,
} from "../src/lib/impersonationPolicy.mjs";
import {
  getLatencyGrade,
  evaluateCompositeHealth,
  HEALTH_STATUS,
} from "../src/lib/healthPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("validateImpersonationRequest enforces user UUID, justification length, and max duration", () => {
  assert.equal(validateImpersonationRequest({ targetUserId: "", reason: "Valid ticket ref 123", durationMinutes: 15 }).valid, false);
  assert.equal(validateImpersonationRequest({ targetUserId: "usr-1", reason: "short", durationMinutes: 15 }).valid, false);
  assert.equal(validateImpersonationRequest({ targetUserId: "usr-1", reason: "Valid ticket ref 123", durationMinutes: 90 }).valid, false);
  assert.equal(validateImpersonationRequest({ targetUserId: "usr-1", reason: "Valid ticket ref 123", durationMinutes: 15 }).valid, true);
});

test("generateImpersonationToken creates verifiable cryptographically signed tokens", () => {
  const secret = "test_super_secret_key_12345";
  const { token, exp } = generateImpersonationToken({
    staffId: "staff-01",
    staffEmail: "admin@scoutit.space",
    staffTier: 3,
    targetUserId: "target-usr-99",
    reason: "Debugging listing claim",
    durationMinutes: 15,
    secret,
  });

  assert.ok(token.includes("."), "Token must contain serialized payload and signature separated by dot");
  const verification = verifyImpersonationToken({ token, secret });
  assert.equal(verification.valid, true);
  assert.equal(verification.payload.targetUserId, "target-usr-99");
  assert.equal(verification.payload.readOnly, true);

  // Rejects invalid secret
  const badVerification = verifyImpersonationToken({ token, secret: "wrong_secret" });
  assert.equal(badVerification.valid, false);
  assert.match(badVerification.error, /signature/i);

  // Rejects tampered token
  const tamperedToken = token.slice(0, -3) + "xyz";
  const tamperedVerification = verifyImpersonationToken({ token: tamperedToken, secret });
  assert.equal(tamperedVerification.valid, false);
});

test("getLatencyGrade returns appropriate performance tiers", () => {
  assert.equal(getLatencyGrade(50), "optimal");
  assert.equal(getLatencyGrade(450), "acceptable");
  assert.equal(getLatencyGrade(1200), "degraded");
  assert.equal(getLatencyGrade(2500), "unresponsive");
  assert.equal(getLatencyGrade(-1), "unresponsive");
});

test("evaluateCompositeHealth correctly diagnoses composite state", () => {
  const healthyProbes = [
    { key: "supabase", status: HEALTH_STATUS.OPERATIONAL, latencyMs: 50 },
    { key: "airtable", status: HEALTH_STATUS.OPERATIONAL, latencyMs: 120 },
  ];
  assert.equal(evaluateCompositeHealth(healthyProbes, 0).overall, HEALTH_STATUS.OPERATIONAL);

  // Elevated cron failures degrades posture
  assert.equal(evaluateCompositeHealth(healthyProbes, 2).overall, HEALTH_STATUS.DEGRADED);

  // Any outage marks system outage
  const outageProbes = [
    { key: "supabase", status: HEALTH_STATUS.OUTAGE, latencyMs: 0 },
    { key: "airtable", status: HEALTH_STATUS.OPERATIONAL, latencyMs: 120 },
  ];
  assert.equal(evaluateCompositeHealth(outageProbes, 0).overall, HEALTH_STATUS.OUTAGE);
});

test("layout.js registers System Health at Ops Manager and Impersonation at Super Admin", async () => {
  const source = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(source, /name:\s*"System Health",\s*href:\s*"\/dashboard\/health",\s*icon:[^,]+,\s*minTier:\s*TIERS\.OPS_MANAGER/);
  assert.match(source, /name:\s*"View As User",\s*href:\s*"\/dashboard\/impersonation",\s*icon:[^,]+,\s*minTier:\s*TIERS\.SUPER_ADMIN/);
});

test("impersonation actions enforce Tier 3 Super Admin strictly", async () => {
  const source = await readFile(path.join(root, "src", "app", "dashboard", "impersonation", "actions.js"), "utf8");
  assert.match(source, /createImpersonationSessionAction[\s\S]*?assertTier\(staff,\s*TIERS\.SUPER_ADMIN\)/);
  assert.match(source, /terminateImpersonationAction[\s\S]*?assertTier\(staff,\s*TIERS\.SUPER_ADMIN\)/);
  assert.match(source, /logActionStrict[\s\S]*?STAFF_IMPERSONATION_STARTED/);
});
