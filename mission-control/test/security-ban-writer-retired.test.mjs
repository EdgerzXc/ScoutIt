import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

// A-105 — follow the A-080 retirement through. The Security Center's
// Block/Unblock forms wrote to `blocked_access`, a list nothing enforces
// (the middleware guard was retired under A-080 and the page says so
// honestly). A labelled no-op writer is worse than a removed control: staff
// can keep adding rows, and the day anyone re-wires enforcement the table
// still holds the two live rows that banned one visitor for abandoning an
// inquiry modal.
//
// Source assertion is the right shape: the property is the absence of the
// writer on this surface. Comments stripped before matching per the
// proxyBanGuardRetired precedent. Out of scope and deliberately untouched:
// `audit/actions.js` generic undo (can only remove rows for already-logged
// actions — no new block is creatable once these forms are gone) and the
// read-only traffic log + Blocked Access read, which stay. The two live
// punitive rows need an owner delete/annotate (live-data write, no agent
// gate) and are recorded as the remaining boundary, not claimed here.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = path.join(root, "src", "app", "dashboard", "security", "page.js");
const actionsPath = path.join(root, "src", "app", "dashboard", "security", "actions.js");

const pageSource = readFileSync(pagePath, "utf8");
const pageCode = pageSource
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .split(/\r?\n/)
  .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
  .join("\n");

function strip(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/(^|\s)\/\/.*/, "$1"))
    .join("\n");
}

test("guards the guard — reads the real page", () => {
  assert.ok(pageCode.includes("Blocked Access"));
  assert.ok(pageCode.length > 2000);
});

test("renders no Block/Unblock form", () => {
  assert.ok(!pageCode.includes("action={blockHash}"));
  assert.ok(!pageCode.includes("action={unblockHash}"));
  assert.ok(!/<form[\s>]/.test(pageCode));
});

test("imports no ban-writer action", () => {
  assert.ok(!pageCode.includes("blockHash"));
  assert.ok(!pageCode.includes("unblockHash"));
  assert.ok(!pageCode.includes('from "./actions"'));
});

test("the retired server actions are gone — no insert/delete on blocked_access here", () => {
  assert.equal(existsSync(actionsPath), false);
});

test("keeps the honest disclaimer and the read-only log", () => {
  assert.ok(pageSource.includes("does not block anything"));
  assert.ok(pageCode.includes('from("blocked_access")'));
  assert.ok(pageCode.includes(".select("));
});
