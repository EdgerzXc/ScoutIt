import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { reviewClaimEvidence } from "../src/lib/claimEvidenceDisposition.mjs";

import {
  maskUserId,
  calculateSlaStatus,
} from "../src/lib/privacyPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("maskUserId generates non-PII compliance tokens", () => {
  assert.equal(maskUserId("550e8400-e29b-41d4-a716-446655440000"), "USR-***-0000");
  assert.equal(maskUserId("usr_abc_789f"), "USR-***-789F");
  assert.equal(maskUserId(null), "USR-ANON-0000");
  assert.equal(maskUserId(""), "USR-ANON-0000");
});

test("calculateSlaStatus tracks the internal review target and overdue state", () => {
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

test("layout.js registers Data Privacy & SLA under Administration for Ops Manager tier", async () => {
  const layout = await readFile(path.join(root, "src", "app", "dashboard", "layout.js"), "utf8");
  assert.match(layout, /href:\s*["']\/dashboard\/privacy["']/);
  assert.match(layout, /Data Privacy & SLA/);
  assert.match(layout, /href:\s*["']\/dashboard\/privacy["'][\s\S]*?minTier:\s*TIERS\.OPS_MANAGER/);
});

test("privacy review is Ops Manager gated and commits status and audit in one service-only transaction", async () => {
  const actions = await readFile(path.join(root, "src", "app", "dashboard", "privacy", "actions.js"), "utf8");
  const sql = await readFile(path.join(root, "..", "supabase", "migrations", "20261121000005_privacy_request_reviews.sql"), "utf8");
  assert.match(actions, /export async function loadPrivacyConsoleData[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /export async function updateDsrResolution[\s\S]*?assertTier\(staff,\s*TIERS\.OPS_MANAGER\)/);
  assert.match(actions, /\.rpc\("review_privacy_request"/);
  assert.match(sql, /INSERT INTO public\.privacy_request_reviews/);
  assert.match(sql, /INSERT INTO public\.mission_control_actions/);
  assert.match(sql, /FROM PUBLIC, anon, authenticated;\s*GRANT EXECUTE/);
  assert.doesNotMatch(actions, /\.update\(/);
});

test("identity proof uses the signed-in Contact subject and erasure waits for actual evidence", async () => {
  const sql = await readFile(path.join(root, "..", "supabase", "migrations", "20261121000005_privacy_request_reviews.sql"), "utf8");
  assert.match(sql, /verified_subject := contact\.user_id/);
  assert.match(sql, /staff_tier >= 3 AND contact\.user_id IS NULL/);
  assert.match(sql, /request_kind = 'erasure'[\s\S]*?'erasure_evidence_required'/);
});

const evidenceRequest = {
  requestId: "00000000-0000-4000-8000-000000000001",
  documentId: "00000000-0000-4000-8000-000000000002",
  actorId: "00000000-0000-4000-8000-000000000003",
  revision: 2,
  decision: "remove",
  note: "Verified the retention and dispute checks.",
};
const lease = "00000000-0000-4000-8000-000000000004";
const privatePath = "00000000-0000-4000-8000-000000000005/listing/00000000-0000-4000-8000-000000000006_fixture.pdf";
const missing = { error: { statusCode: "404" } };
const existing = { data: { version: "reviewed-version" } };

function evidenceProviders({
  info = [existing, missing], result = "reserved", confirm = "saved", privateBucket = true,
  removal = async () => ({ data: [] }), expiresAt = new Date(Date.now() + 60_000).toISOString(),
} = {}) {
  const trace = [];
  const admin = {
    async rpc(name, args) {
      assert.equal(name, "review_claim_evidence_disposition");
      assert.equal(args.p_request, evidenceRequest.requestId);
      assert.equal(args.p_document, evidenceRequest.documentId);
      assert.equal(args.p_actor, evidenceRequest.actorId);
      assert.equal(args.p_revision, evidenceRequest.revision);
      assert.equal(args.p_notes, evidenceRequest.note);
      const action = args.p_action;
      if (["confirm", "retry"].includes(action)) assert.equal(args.p_lease, lease);
      trace.push(action);
      if (action === "confirm") return { data: { state: confirm } };
      if (action === "retry") return { data: { state: "retry" } };
      return { data: { state: result, path: privatePath, version: existing.data.version, lease, expiresAt } };
    },
    storage: {
      async getBucket(name) {
        assert.equal(name, "claim-documents");
        return { data: { public: !privateBucket } };
      },
      from(name) {
        assert.equal(name, "claim-documents");
        return {
          async info(requestedPath) {
            assert.equal(requestedPath, privatePath);
            trace.push("info");
            return info.shift();
          },
          async remove(paths) {
            assert.deepEqual(paths, [privatePath]);
            trace.push("storage-remove");
            return removal();
          },
        };
      },
    },
  };
  return { admin, trace };
}

test("claim evidence removal requires both provider absence and the database receipt", async () => {
  const { admin, trace } = evidenceProviders();
  assert.equal(await reviewClaimEvidence(admin, evidenceRequest), "saved");
  assert.deepEqual(trace, ["remove", "info", "storage-remove", "info", "confirm"]);

  const stale = evidenceProviders({ confirm: "storage_unconfirmed" });
  assert.equal(await reviewClaimEvidence(stale.admin, evidenceRequest), "storage_unconfirmed");
  assert.deepEqual(stale.trace, ["remove", "info", "storage-remove", "info", "confirm", "retry"]);
});

test("claim evidence removal fails closed on a hold, changed object, public bucket, or expiring lease", async () => {
  for (const [providerOptions, expected, calls] of [
    [{ result: "held" }, "held", ["remove"]],
    [{ info: [{ data: { version: "different" } }] }, "storage_unconfirmed", ["remove", "info", "retry"]],
    [{ info: [{ error: { statusCode: "403" } }] }, "storage_unconfirmed", ["remove", "info", "retry"]],
    [{ privateBucket: false }, "storage_unconfirmed", ["remove", "retry"]],
    [{ expiresAt: new Date(Date.now() - 1).toISOString() }, "storage_unconfirmed", ["remove", "info", "retry"]],
  ]) {
    const { admin, trace } = evidenceProviders(providerOptions);
    assert.equal(await reviewClaimEvidence(admin, evidenceRequest), expected);
    assert.deepEqual(trace, calls);
  }
});

test("a network interruption can be retried, and an absent reserved file needs no second delete", async () => {
  const lost = evidenceProviders({ removal: async () => { throw new Error("provider timeout"); } });
  assert.equal(await reviewClaimEvidence(lost.admin, evidenceRequest), "storage_unconfirmed");
  assert.deepEqual(lost.trace, ["remove", "info", "storage-remove", "retry"]);

  const retried = evidenceProviders({ info: [missing] });
  assert.equal(await reviewClaimEvidence(retried.admin, evidenceRequest), "saved");
  assert.deepEqual(retried.trace, ["remove", "info", "confirm"]);
});
