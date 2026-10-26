import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  isViewingStalled,
  formatWaitlistRole,
  generateWaitlistCsv,
} from "../src/lib/pipelinePolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("isViewingStalled identifies overdue active viewings", () => {
  const now = new Date("2026-10-26T12:00:00Z");

  // Scheduled in past -> stalled
  assert.equal(
    isViewingStalled({ scheduled_at: "2026-10-26T10:00:00Z", status: "scheduled" }, now),
    true
  );

  // Scheduled in future -> not stalled
  assert.equal(
    isViewingStalled({ scheduled_at: "2026-10-26T14:00:00Z", status: "scheduled" }, now),
    false
  );

  // Completed or cancelled in past -> not stalled
  assert.equal(
    isViewingStalled({ scheduled_at: "2026-10-26T10:00:00Z", status: "completed" }, now),
    false
  );
  assert.equal(
    isViewingStalled({ scheduled_at: "2026-10-26T10:00:00Z", status: "cancelled" }, now),
    false
  );
});

test("formatWaitlistRole maps role keys to readable labels", () => {
  assert.equal(formatWaitlistRole("seeker"), "Verified Seeker");
  assert.equal(formatWaitlistRole("owner"), "Asset Owner");
  assert.equal(formatWaitlistRole("broker"), "Licensed Broker");
  assert.equal(formatWaitlistRole(null), "General Seeker");
});

test("generateWaitlistCsv generates valid RFC 4180 CSV with escaped characters", () => {
  const rows = [
    {
      id: "w-1",
      email: "founder@domain.com",
      role: "owner",
      tier: "Founding Member",
      source: "homepage",
      created_at: "2026-10-25T10:00:00Z",
    },
    {
      id: "w-2",
      email: "partner@firm.com",
      role: "broker",
      tier: "Founding Partner",
      source: 'partner "ad"',
      created_at: "2026-10-26T08:00:00Z",
    },
  ];

  const csv = generateWaitlistCsv(rows);
  assert.match(csv, /^"ID","Email","Target Role"/m);
  assert.match(csv, /"w-1","founder@domain\.com","owner","Founding Member","homepage"/);
  assert.match(csv, /"partner ""ad"""/); // double-quote escaping check
});

test("layout.js registers Pipeline Demand under Content & People for Ops Manager tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/pipeline["']/);
  assert.match(layout, /Pipeline Demand/);
  assert.match(layout, /href:\s*["']\/dashboard\/pipeline["'][\s\S]*?minTier:\s*TIERS\.OPS_MANAGER/);
});

test("pipeline/actions.js enforces Ops Manager tier and audit logging on export", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "pipeline", "actions.js"), "utf8");
  assert.match(actions, /export async function loadPipelineData[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function exportWaitlistCsv[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /logActionStrict\(\{[\s\S]*?action:\s*["']pipeline\.export_waitlist["']/);
  assert.match(actions, /targetTable:\s*["']waitlist["']/);
});
