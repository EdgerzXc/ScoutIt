import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  maskUserId,
  calculateSlaStatus,
  isPrivacySubject,
  detectDsrType,
  DSR_TYPES,
  DSR_SLA_DAYS,
} from "../src/lib/privacyPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("maskUserId generates non-PII compliance tokens", () => {
  assert.equal(maskUserId("550e8400-e29b-41d4-a716-446655440000"), "USR-***-0000");
  assert.equal(maskUserId("usr_abc_789f"), "USR-***-789F");
  assert.equal(maskUserId(null), "USR-ANON-0000");
  assert.equal(maskUserId(""), "USR-ANON-0000");
});

test("calculateSlaStatus tracks statutory SLA deadline and breach state", () => {
  const now = new Date("2026-10-26T12:00:00Z");

  // Created 2 days ago -> 13 days remaining (on track)
  const recent = calculateSlaStatus("2026-10-24T12:00:00Z", 15, now);
  assert.equal(recent.daysRemaining, 13);
  assert.equal(recent.isBreached, false);
  assert.equal(recent.isUrgent, false);

  // Created 13 days ago -> 2 days remaining (urgent)
  const urgent = calculateSlaStatus("2026-10-13T12:00:00Z", 15, now);
  assert.equal(urgent.daysRemaining, 2);
  assert.equal(urgent.isBreached, false);
  assert.equal(urgent.isUrgent, true);

  // Created 20 days ago -> breached
  const breached = calculateSlaStatus("2026-10-06T12:00:00Z", 15, now);
  assert.equal(breached.isBreached, true);
  assert.equal(breached.daysRemaining < 0, true);
});

test("isPrivacySubject identifies RA 10173 and DSR inquiries", () => {
  assert.equal(isPrivacySubject("Request for account deletion", "Please remove all my data"), true);
  assert.equal(isPrivacySubject("Inquiry regarding RA 10173", "I want to exercise right to access"), true);
  assert.equal(isPrivacySubject("General Inquiry", "Can you tell me about the building?"), false);
  assert.equal(isPrivacySubject("Viewing appointment question", "Is Saturday available?"), false);
});

test("detectDsrType categorizes request type accurately", () => {
  assert.equal(detectDsrType("Account deletion", "Please erase all my data"), DSR_TYPES.ERASURE);
  assert.equal(detectDsrType("Rectification request", "Please correct my phone number"), DSR_TYPES.RECTIFICATION);
  assert.equal(detectDsrType("Access to personal data", "Send me a copy of my records"), DSR_TYPES.ACCESS);
  assert.equal(detectDsrType("Privacy policy question", "Who is your DPO?"), DSR_TYPES.INQUIRY);
});

test("layout.js registers Data Privacy & SLA under Administration for Ops Manager tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/privacy["']/);
  assert.match(layout, /Data Privacy & SLA/);
  assert.match(layout, /href:\s*["']\/dashboard\/privacy["'][\s\S]*?minTier:\s*TIERS\.OPS_MANAGER/);
});

test("privacy/actions.js enforces Ops Manager tier and audit logging", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "privacy", "actions.js"), "utf8");
  assert.match(actions, /export async function loadPrivacyConsoleData[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function updateDsrResolution[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /logActionStrict\(\{[\s\S]*?targetTable:\s*["']contact_messages["']/);
});
