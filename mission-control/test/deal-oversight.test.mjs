import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DISPUTE_OPEN_STATUSES,
  mayReadMessageBodies,
  summarise,
  toOversightRow,
} from "../src/lib/dealOversightPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const page = await readFile(path.join(root, "src", "app", "dashboard", "deals", "page.js"), "utf8");
const retention = await readFile(path.join(root, "..", "src", "lib", "chatRetention.js"), "utf8");
const policy = await readFile(path.join(root, "src", "lib", "dealOversightPolicy.mjs"), "utf8");

const DEAL = { id: "d-1", status: "active", buyer_id: "b", broker_id: "k", created_at: "2026-08-01T00:00:00Z" };
const MESSAGES = [{ id: "m1", body: "the private words", sender_role: "buyer", created_at: "2026-08-02T00:00:00Z" }];

// ── The promise the product makes ────────────────────────────────────────────

test("a deal with no dispute never shows what anybody said", () => {
  const row = toOversightRow({ deal: DEAL, messages: MESSAGES, messageCount: 1 });
  assert.equal(row.messagesVisible, false);
  assert.equal(row.messages, null, "the bodies were attached anyway");
  assert.match(JSON.stringify(row), /^(?!.*the private words).*$/s);
});

test("passing bodies in does not make them visible — the rule decides, not the caller", () => {
  for (const statuses of [[], ["resolved"], ["dismissed"]]) {
    const row = toOversightRow({ deal: DEAL, messages: MESSAGES, disputeStatuses: statuses });
    assert.equal(row.messages, null, `bodies leaked for disputeStatuses=${JSON.stringify(statuses)}`);
  }
});

test("an open dispute is the one thing that opens the conversation", () => {
  for (const status of DISPUTE_OPEN_STATUSES) {
    const row = toOversightRow({ deal: DEAL, messages: MESSAGES, disputeStatuses: [status] });
    assert.equal(row.messagesVisible, true, status);
    assert.equal(row.messages.length, 1);
  }
});

test("a closed dispute closes the conversation again", () => {
  const row = toOversightRow({ deal: DEAL, messages: MESSAGES, disputeStatuses: ["resolved"] });
  assert.equal(row.messagesVisible, false);
});

test("the hold statuses match the main site's retention module exactly", () => {
  // Same drift guard as A-061: if the purge job's vocabulary changes and this
  // does not, oversight would open a conversation the product still calls
  // private, or keep one closed that a dispute has opened.
  const declared = retention.match(/DISPUTE_HOLD_STATUSES = Object\.freeze\(\[([^\]]*)\]\)/);
  assert.ok(declared, "the main site no longer declares DISPUTE_HOLD_STATUSES");
  const mainSite = declared[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  assert.deepEqual([...DISPUTE_OPEN_STATUSES], mainSite);
});

test("staff are told which rule applied, in both directions", () => {
  assert.match(mayReadMessageBodies({}).reason, /Private between the parties/);
  assert.match(mayReadMessageBodies({ disputeStatuses: ["open_hold"] }).reason, /filed a dispute/);
});

// ── What is always visible is enough to be useful ────────────────────────────

test("staff can always see that a deal exists and whether it is moving", () => {
  const row = toOversightRow({
    deal: DEAL,
    messageCount: 4,
    lastMessageAt: "2026-08-20T00:00:00Z",
  });
  assert.equal(row.messageCount, 4);
  assert.equal(row.lastMessageAt, "2026-08-20T00:00:00Z");
  assert.equal(row.buyerId, "b");
  assert.equal(row.brokerId, "k");
  assert.equal(row.isActive, true);
});

test("a half-signed handshake is surfaced — somebody is waiting on somebody", () => {
  const row = toOversightRow({
    deal: DEAL,
    handshakes: [
      { id: "h1", handshake_type: "intro", status: "pending", party_a_signed_at: "2026-08-02T00:00:00Z", party_b_signed_at: null },
      { id: "h2", handshake_type: "intro", status: "complete", party_a_signed_at: "2026-08-02T00:00:00Z", party_b_signed_at: "2026-08-03T00:00:00Z" },
    ],
  });
  assert.equal(row.handshakes[0].awaitingCountersignature, true);
  assert.equal(row.handshakes[1].awaitingCountersignature, false);
  assert.match(summarise(row), /waiting on the other/);
});

test("a dispute outranks everything else in the one-line reading", () => {
  const row = toOversightRow({
    deal: DEAL,
    disputeStatuses: ["open_hold"],
    handshakes: [{ id: "h", handshake_type: "intro", status: "pending", party_a_signed_at: "x", party_b_signed_at: null }],
  });
  assert.match(summarise(row), /In dispute/);
});

test("an open deal nobody has spoken in is called out rather than looking healthy", () => {
  assert.match(summarise(toOversightRow({ deal: DEAL, messageCount: 0 })), /nobody has said anything/);
});

// ── The shape cannot silently grow ───────────────────────────────────────────

test("the row is built field by field, never spread from the database row", () => {
  assert.doesNotMatch(
    policy,
    /\.\.\.deal\b/,
    "spreading the row would put whatever column the table gains next onto the screen",
  );
});

// ── The surface ──────────────────────────────────────────────────────────────

test("the page is Ops Manager and above", () => {
  assert.match(page, /staff\.tier < TIERS\.OPS_MANAGER/);
});

test("the page is read-only — there is nothing here that mutates a deal", () => {
  for (const forbidden of [".update(", ".insert(", ".delete(", ".upsert("]) {
    assert.ok(!page.includes(forbidden), `the oversight page performs ${forbidden}`);
  }
  assert.doesNotMatch(page, /"use server"/);
});

test("message bodies are only fetched for deals that have an open dispute", () => {
  assert.match(page, /disputedIds/);
  assert.match(page, /if \(disputedIds\.length\)/);
  const bodyQuery = page.slice(page.indexOf("if (disputedIds.length)"));
  assert.match(bodyQuery.slice(0, 500), /\.in\("deal_id", disputedIds\)/);
});

test("the privacy rule is stated on every deal, not only the private ones", () => {
  assert.match(page, /row\.messagesReason/);
});
