import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────
// A guard for one recurring class of defect, not a style rule.
//
// Four separate instances were found on 2026-08-31, every one invisible to a
// passing test suite and every one found only by opening the page:
//
//   A-064  "Verified ScoutIt connection" awarded on the mere presence of a
//          uuid, with no foreign key behind it — two live entries claimed a
//          handshake that did not exist.
//   A-065  "Computed only from activity completed through ScoutIt" and
//          "Measured on ScoutIt activity only" printed over seeded figures.
//   A-066  Four fabricated signals published as REGISTRY CONFIRMED /
//          ORDINANCE RATIFIED with no sample disclosure at all.
//   A-067  "Intel source: ScoutIt Verified" hardcoded on every property, plus
//          "Verification: ScoutIT Pros" and a "Verified Commercial" zoning
//          default that this guard was not watching for. Resolved 2026-09-03;
//          both new phrases are now patterns.
//
// The shape is always the same: a claim about verification, computation, or
// public record, rendered where nothing established it.
//
// ── Why this is an allowlist and not a cleverer test ──────────────────────
//
// The first version tried to decide automatically whether each occurrence sat
// inside a conditional. It was tested by injecting a real regression — a bare
// "ScoutIt Verified" added to the record chart footer — and it **passed**,
// because walking outward for an enclosing conditional eventually reaches a
// `?` or an `if (` somewhere in the function and calls everything guarded.
// Properly deciding this needs a JSX parser, and a heuristic that cannot be
// trusted to fail is worse than no guard at all.
//
// So every occurrence must be named here with the reason it is honest. That
// cannot silently pass: a new claim anywhere fails this test until somebody
// writes down what makes it true. The cost is an entry per legitimate claim,
// which is the point rather than the price.
// ─────────────────────────────────────────────────────────────────────────

const ROOTS = ["src/components", "src/app"];

/** Phrases that assert verification, computation, or public-record status. */
const CLAIM_PATTERNS = [
  "ScoutIt Verified",
  "Verified ScoutIt",
  "REGISTRY CONFIRMED",
  "ORDINANCE RATIFIED",
  "Computed only from activity",
  "Measured on ScoutIt activity",
  // Added when A-067 was resolved (2026-09-03). Both were hardcoded in the
  // property flows, both asserted verification for a listing that had none,
  // and neither was caught because the guard was not watching the phrase.
  // A defect class is only guarded once the guard knows its vocabulary.
  "ScoutIT Pros",
  "Verified Commercial",
];

/**
 * Every place a claim phrase may appear, and what makes it true there.
 *
 * `count` pins how many occurrences that file may hold, so a second, unearned
 * copy cannot hide behind an existing allowance — the exact way A-065 survived
 * its first fix, where correcting the panel note left the chart footer still
 * asserting the same thing.
 */
const ALLOWED = [
  {
    file: "src/components/brokers/BrokerDossierIdentity.js",
    phrase: "Computed only from activity",
    count: 1,
    reason:
      "A-065: rendered only in the else-branch of `record.isExampleSeed`, so a seeded snapshot shows the demonstration note instead. Covered behaviourally by brokerRecordProvenance.test.js.",
  },
  {
    file: "src/components/brokers/BrokerRecordChart.js",
    phrase: "Measured on ScoutIt activity",
    count: 1,
    reason:
      "A-065: the second provenance statement, branched on the same `record.isExampleSeed` flag as the panel note. brokerRecordProvenance.test.js fails if either copy stops checking the flag.",
  },
  {
    file: "src/components/dashboard/RecommendationInvitation.js",
    phrase: "Verified ScoutIt",
    count: 1,
    reason:
      "A-038: rendered from `invitation.verifiedConnection`, and the eligibility endpoint only emits an invitation after confirming a completed two-sided handshake server-side.",
  },
  {
    file: "src/components/dashboard/BrokerMode.js",
    phrase: "ScoutIt Verified",
    count: 1,
    reason:
      "Names the ID-card product ('ScoutIt Verified Broker ID card') offered to a broker who has already passed PRC verification. A product name behind an entitlement gate, not a claim about arbitrary data.",
  },
  {
    file: "src/app/api/broker/recommendations/route.js",
    phrase: "Verified ScoutIt",
    count: 1,
    reason:
      "The route's header comment explaining what the label means and that it must not be claimable. Comment text, never rendered.",
  },
  {
    file: "src/app/researchers/[researcher-slug]/page.js",
    phrase: "Verified ScoutIt",
    count: 1,
    reason:
      "Metadata description fallback used only when the researcher record is absent, i.e. for a page that does not resolve to a provider. Not rendered beside any provider's details.",
  },
  {
    file: "src/app/photographers/[photographer-slug]/page.js",
    phrase: "Verified ScoutIt",
    count: 1,
    reason: "Metadata description fallback for an unresolved photographer, as above.",
  },
  {
    file: "src/app/event-planners/[planner-slug]/page.js",
    phrase: "Verified ScoutIt",
    count: 1,
    reason: "Metadata description fallback for an unresolved event planner, as above.",
  },
];

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === "__tests__" || entry === "node_modules") continue;
      sourceFiles(full, out);
    } else if (entry.endsWith(".js") && !entry.endsWith(".test.js")) {
      out.push(full);
    }
  }
  return out;
}

const occurrences = (source, phrase) => source.split(phrase).length - 1;

function scan() {
  const files = ROOTS.flatMap((root) => sourceFiles(resolve(process.cwd(), root)));
  const found = [];

  for (const full of files) {
    const rel = relative(process.cwd(), full).split("\\").join("/");
    const source = readFileSync(full, "utf8");
    for (const phrase of CLAIM_PATTERNS) {
      const count = occurrences(source, phrase);
      if (count > 0) found.push({ file: rel, phrase, count });
    }
  }

  return { files, found };
}

describe("every verification claim is a recorded decision", () => {
  const { files, found } = scan();

  it("scans a meaningful number of source files", () => {
    // A guard that silently stops scanning passes forever.
    expect(files.length).toBeGreaterThan(100);
  });

  it("emits no claim that is not named in the allowlist", () => {
    const allowed = new Set(ALLOWED.map((entry) => `${entry.file}::${entry.phrase}`));
    const unlisted = found
      .filter((hit) => !allowed.has(`${hit.file}::${hit.phrase}`))
      .map((hit) => `${hit.file} — "${hit.phrase}" (${hit.count}x)`);

    // Each entry is a public surface asserting something ScoutIt may not have
    // established. Either drive it from data, or add it to ALLOWED with the
    // reason it is true.
    expect(unlisted).toEqual([]);
  });

  it("holds each allowed file to its recorded number of claims", () => {
    const drift = [];
    for (const entry of ALLOWED) {
      const hit = found.find((f) => f.file === entry.file && f.phrase === entry.phrase);
      if (!hit) {
        drift.push(`${entry.file} — "${entry.phrase}" is allowed but no longer present (stale)`);
      } else if (hit.count !== entry.count) {
        drift.push(
          `${entry.file} — "${entry.phrase}" appears ${hit.count}x, allowance records ${entry.count}x`,
        );
      }
    }
    expect(drift).toEqual([]);
  });

  it("keeps every allowance justified", () => {
    for (const entry of ALLOWED) {
      expect(entry.reason.length).toBeGreaterThan(40);
    }
  });
});
