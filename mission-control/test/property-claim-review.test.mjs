import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { hasVerifiedClaimScan } from "../src/lib/claimDocumentPath.mjs";
import { reviewPropertyClaim } from "../src/lib/claimReview.mjs";
import { freshClamdSignatures, processPrivateClaimDocuments, removeExpiredClaimUploads } from "../src/lib/claimPrivateScanner.mjs";

import {
  CLAIM_STATUSES,
  DECISION_REASON_CODES,
  NOT_YET_A_CLAIM,
  OPEN_CLAIM_STATUSES,
  REVIEW_TRANSITIONS,
  canTransition,
  describeConflict,
  validateDecision,
} from "../src/lib/propertyClaimPolicy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = await readFile(
  path.join(root, "..", "supabase", "migrations", "20261121000002_atomic_staff_claim_review.sql"),
  "utf8",
);
const actions = await readFile(
  path.join(root, "src", "app", "dashboard", "claims", "actions.js"),
  "utf8",
);
const page = await readFile(path.join(root, "src", "app", "dashboard", "claims", "page.js"), "utf8");

const GOOD_NOTE = "The title document matches the claimant's identification.";

// ── The queue shows the right things ─────────────────────────────────────────

test("a draft is never put in front of a reviewer", () => {
  for (const s of NOT_YET_A_CLAIM) {
    assert.ok(
      !OPEN_CLAIM_STATUSES.includes(s),
      `${s} is the claimant's unfinished sentence and must not appear in the queue`,
    );
  }
});

test("every open status is a status the database accepts", () => {
  for (const s of OPEN_CLAIM_STATUSES) assert.ok(CLAIM_STATUSES.includes(s), s);
});

// ── Nobody decides a claim they have not opened ──────────────────────────────

test("a claim cannot be approved or rejected straight off the queue", () => {
  for (const from of ["submitted", "technical_review", "needs_information", "disputed"]) {
    assert.equal(canTransition(from, "approve"), false, `approved from ${from}`);
    assert.equal(canTransition(from, "reject"), false, `rejected from ${from}`);
  }
  assert.equal(canTransition("human_review", "approve"), true);
  assert.equal(canTransition("human_review", "reject"), true);
});

test("taking a claim somebody already holds is refused", () => {
  assert.equal(canTransition("human_review", "take"), false);
  assert.equal(canTransition("submitted", "take"), true);
});

test("a decided claim is finished — reopening is a new claim, not an edit", () => {
  for (const done of ["approved", "rejected", "withdrawn", "closed"]) {
    for (const t of Object.keys(REVIEW_TRANSITIONS)) {
      assert.equal(canTransition(done, t), false, `${t} from ${done}`);
    }
  }
});

test("an unknown status denies rather than defaulting to allowed", () => {
  assert.equal(canTransition("something_new", "approve"), false);
  assert.equal(canTransition(undefined, "take"), false);
  assert.equal(canTransition("submitted", "delete_everything"), false);
});

// ── A decision carries a reason somebody signed ──────────────────────────────

test("approving or rejecting without a reason code is refused", () => {
  for (const t of ["approve", "reject"]) {
    const r = validateDecision({ transition: t, fromStatus: "human_review", reasonCode: "", note: GOOD_NOTE });
    assert.equal(r.ok, false);
    assert.match(r.message, /reason/i);
  }
});

test("a reason code borrowed from a different outcome is refused", () => {
  const r = validateDecision({
    transition: "approve",
    fromStatus: "human_review",
    reasonCode: "insufficient_evidence", // a rejection reason
    note: GOOD_NOTE,
  });
  assert.equal(r.ok, false);
});

test("'ok' is not an explanation for taking somebody's listing", () => {
  for (const note of ["", "ok", "n/a", "   ", "approved."]) {
    const r = validateDecision({
      transition: "approve",
      fromStatus: "human_review",
      reasonCode: "documents_verified",
      note,
    });
    assert.equal(r.ok, false, `accepted note: ${JSON.stringify(note)}`);
  }
});

test("a complete approval is accepted and is the only transition that moves a listing", () => {
  const r = validateDecision({
    transition: "approve",
    fromStatus: "human_review",
    reasonCode: "documents_verified",
    note: GOOD_NOTE,
  });
  assert.deepEqual(r, { ok: true, status: "approved", transfersListing: true });

  for (const t of ["take", "request_information", "reject"]) {
    assert.equal(REVIEW_TRANSITIONS[t].transfersListing, false, `${t} must not move a listing`);
  }
});

test("taking a claim needs no reason — it is not yet a decision", () => {
  const r = validateDecision({ transition: "take", fromStatus: "submitted" });
  assert.deepEqual(r, { ok: true, status: "human_review", transfersListing: false });
});

test("every reason code list belongs to a real outcome", () => {
  for (const outcome of Object.keys(DECISION_REASON_CODES)) {
    assert.ok(CLAIM_STATUSES.includes(outcome), `${outcome} is not a claim status`);
  }
});

// ── The comparison a reviewer actually needs ─────────────────────────────────

test("two people both claiming to own it is flagged as a direct conflict", () => {
  const c = describeConflict({ listerRelationship: "owner", claimedRelationship: "owner" });
  assert.equal(c.level, "direct");
  assert.match(c.text, /One of them is wrong/);
});

test("an owner claiming a broker's listing is the ordinary case, not an alarm", () => {
  const c = describeConflict({
    listerRelationship: "authorized_broker",
    claimedRelationship: "owner",
  });
  assert.equal(c.level, "expected");
});

test("a listing with no declared relationship says so instead of assuming owner", () => {
  const c = describeConflict({ listerRelationship: null, claimedRelationship: "owner" });
  assert.equal(c.level, "unknown");
  assert.match(c.text, /documents alone/);
});

// ── The action ───────────────────────────────────────────────────────────────

test("approval is Super Admin; the rest are Ops Manager", () => {
  assert.match(
    actions,
    /assertTier\(staff, rule\.transfersListing \? TIERS\.SUPER_ADMIN : TIERS\.OPS_MANAGER\)/,
  );
});

test("the status is re-checked against the live row, not the rendered page", () => {
  const readIdx = actions.indexOf('.from("property_claims")');
  const validateIdx = actions.indexOf("validateDecision({");
  assert.ok(readIdx !== -1 && validateIdx > readIdx, "the claim is validated before it is read");
  assert.match(actions, /fromStatus: claim\.status/);
});

test("the previous holder is recorded before the listing moves", () => {
  const capture = migration.indexOf("'from_owner_id', v_property.owner_id");
  const write = migration.indexOf("owner_id = v_claim.claimant_user_id::text,");
  assert.notEqual(capture, -1, "the previous owner is never captured");
  assert.ok(capture < write, "the listing moves before the previous holder is recorded");
});

test("a claim with no signed-in claimant cannot transfer a listing to nobody", () => {
  assert.match(migration, /IF v_claim\.claimant_user_id IS NULL/);
});

test("every decision writes a claim event, an audit entry, and a transfer writes a system event", () => {
  assert.match(migration, /INSERT INTO public\.property_claim_events/);
  assert.match(migration, /'claim\.' \|\| p_transition/);
  assert.match(migration, /'listing\.ownership\.transferred', 'mission-control', 'warning'/);
  assert.match(migration, /FROM PUBLIC, anon, authenticated;\s*GRANT EXECUTE ON FUNCTION public\.review_property_claim/);
  assert.match(actions, /if \(!result\.ok\) return result;/);
});

const claimContext = {
  claimId: "claim-id", staffId: "staff-id", transition: "approve",
  expectedUpdatedAt: "2026-11-21T01:00:00Z", reason: "lister_conceded",
  note: "The previous lister confirmed the transfer.",
};

function claimReviewFixture(responses, cachePurged = true) {
  const calls = [];
  const lease = new Date().toISOString();
  const admin = {
    async rpc(functionName, args) {
      assert.equal(functionName, "review_property_claim");
      calls.push(args.p_phase);
      assert.equal(args.p_expected_updated_at, claimContext.expectedUpdatedAt);
      if (args.p_phase !== "decide") assert.equal(args.p_lease, lease);
      return { data: args.p_phase === "decide" ? { state: "withdraw", slug: "fixture", recordId: "recFixture", lease } : responses[args.p_phase] };
    },
  };
  async function unpublish(binding) {
    assert.deepEqual(binding, { slug: "fixture", recordId: "recFixture" });
    calls.push("catalogue");
    return { recordId: "recFixture", cache: { purged: cachePurged } };
  }
  return { run: () => reviewPropertyClaim({ admin, unpublish, ...claimContext }), calls };
}

test("approval follows confirmed withdrawal and catalogue refresh", async () => {
  const transfer = { defaultedToOffMarket: true };
  const { run, calls } = claimReviewFixture({ confirm: { state: "saved", status: "approved", transfer } });
  assert.deepEqual(await run(), { ok: true, status: "approved", updatedAt: undefined, transfer });
  assert.deepEqual(calls, ["decide", "catalogue", "confirm"]);
});

test("an unconfirmed catalogue refresh keeps the transfer pending", async () => {
  const { run, calls } = claimReviewFixture({ release: { state: "retry" } }, false);
  assert.match((await run()).message, /still belongs to its current holder/);
  assert.deepEqual(calls, ["decide", "catalogue", "release"]);
});

test("an uncertain final database decision tells staff to check the queue", async () => {
  const { run, calls } = claimReviewFixture({ confirm: { state: "retry" }, release: { state: "retry" } });
  const result = await run();
  assert.equal(result.ok, false);
  assert.match(result.message, /confirm whether ownership transferred/);
  assert.deepEqual(calls, ["decide", "catalogue", "confirm", "release"]);
});

// ── The surface ──────────────────────────────────────────────────────────────

test("the page is Ops Manager and above", () => {
  assert.match(page, /staff\.tier < TIERS\.OPS_MANAGER/);
});

test("the reviewer is shown the conflict, not left to work it out", () => {
  assert.match(page, /describeConflict/);
});

test("an unscanned document is called out rather than quietly listed", () => {
  assert.match(page, /malware_scan_status === "pending"/);
  assert.match(page, /needs a verified security scan/);
  assert.match(actions, /downloadHref: scanConfirmed/);
  assert.doesNotMatch(actions, /createSignedUrl/);
});

test("a claim attachment needs a verified scan for this claimant and listing", () => {
  const reviewerRecord = {
    private_storage_path: "claimant/listing/1763654400000_title.pdf",
    checksum: "a".repeat(64),
    malware_scan_status: "clean",
    malware_scan_engine: "clamd-local-v1",
    malware_scan_object_version: "version-a",
  };
  assert.equal(hasVerifiedClaimScan(reviewerRecord, "claimant", ["listing"]), true);
  assert.equal(hasVerifiedClaimScan({ ...reviewerRecord, checksum: null }, "claimant", ["listing"]), false);
  assert.equal(hasVerifiedClaimScan({ ...reviewerRecord, malware_scan_status: "pending" }, "claimant", ["listing"]), false);
  assert.equal(hasVerifiedClaimScan({ ...reviewerRecord, malware_scan_engine: "magic-bytes" }, "claimant", ["listing"]), false);
  assert.equal(hasVerifiedClaimScan(reviewerRecord, "claimant", ["another-listing"]), false);
  assert.equal(hasVerifiedClaimScan(reviewerRecord, "another-claimant", ["listing"]), false);
});

test("a stale or unavailable signature database cannot produce claim scan receipts", () => {
  const now = Date.parse("2026-11-21T12:00:00Z");
  assert.equal(freshClamdSignatures("ClamAV 1.4.3/28000/Fri Nov 20 13:00:00 2026", now), true);
  assert.equal(freshClamdSignatures("ClamAV 1.4.3/28000/Mon Nov 16 13:00:00 2026", now), false);
  assert.equal(freshClamdSignatures("ClamAV 1.4.3", now), false);
});

test("the worker binds the trusted verdict to one immutable version", async () => {
  const file = new Blob(["%PDF-1.7 fixture"], { type: "application/pdf" });
  const job = {
    document_id: "document", lease: "lease", object_path: "claimant/listing/1763654400000_title.pdf",
    declared_mime: "application/pdf", byte_count: file.size, claimant_id: "claimant", property_id: "listing",
  };
  let version = "version-a";
  let filed;
  const storage = {
    getBucket: async () => ({ data: { public: false } }),
    from: () => ({
      info: async () => ({ data: { size: file.size, contentType: file.type, version } }),
      download: async () => ({ data: file }),
    }),
  };
  const admin = {
    storage,
    rpc: async (method, args) => {
      if (method === "lease_claim_document_scans") return { data: [job] };
      filed = args;
      return { data: true };
    },
  };
  assert.equal((await processPrivateClaimDocuments(admin, async () => "clean")).clean, 1);
  assert.equal(filed.p_version, "version-a");
  assert.match(filed.p_checksum, /^[0-9a-f]{64}$/);
  assert.equal((await processPrivateClaimDocuments(admin, async () => {
    version = "version-b";
    return "clean";
  })).pending, 1);
  assert.equal(filed.p_checksum, null);
  assert.equal((await processPrivateClaimDocuments(admin, async () => "blocked")).blocked, 1);
  assert.equal(filed.p_version, null);
});

test("expiry removal confirms the original object and its absence using Storage", async () => {
  const candidates = [
    { object_path: "old-upload", object_version: "version-a" },
    { object_path: "replaced-upload", object_version: "previous-version" },
  ];
  const removed = [];
  const admin = {
    rpc: async () => ({ data: candidates }),
    storage: {
      getBucket: async () => ({ data: { public: false } }),
      from: () => ({
        info: async (path) => removed.includes(path) ? { error: { status: 404 } } : { data: { version: "version-a" } },
        remove: async ([path]) => removed.push(path),
      }),
    },
  };
  assert.deepEqual(await removeExpiredClaimUploads(admin), { removed: 1, unconfirmed: 1 });
  assert.deepEqual(removed, ["old-upload"]);
});
