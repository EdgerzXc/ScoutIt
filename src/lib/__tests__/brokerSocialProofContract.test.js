import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
// Assertions about what a module *selects* must not be satisfied or broken by
// prose in its own comments explaining what it deliberately does not select.
const readCode = (path) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const PAGE = "src/app/brokers/[broker-slug]/page.js";
const SERVER = "src/lib/serverBrokerSocialProof.js";
const MIGRATION = "supabase/migrations/20260826000002_broker_recommendations_contributions.sql";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 4 source contracts.
//
// The behavioural rules live in the unit tests for the two pure modules. These
// pin the things a unit test cannot see: that the private evidence column is
// never selected, that the migration's defaults cannot manufacture consent,
// and that the dossier actually renders both sections.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 phase 4 - social proof wiring", () => {
  it("renders both sections from their own authorities on the canonical dossier", () => {
    const page = read(PAGE);
    expect(page).toContain("<BrokerRecommendations");
    expect(page).toContain("<BrokerContributions");
    expect(page).toContain("buildRecommendationSection({");
    expect(page).toContain("buildContributionSection({");
    // Read in parallel: neither authority may serialise behind the other.
    expect(page).toMatch(/Promise\.all\(\[\s*loadBrokerRecommendationAuthority/);
  });

  it("never selects private moderation evidence into a public projection", () => {
    const server = readCode(SERVER);
    // `evidence_url` is moderation proof. Not selecting it is a stronger
    // guarantee than selecting it and stripping it downstream.
    expect(server).not.toMatch(/"evidence_url"|'evidence_url'/);
    expect(server).not.toMatch(/author_user_id/);
    expect(server).not.toContain('select("*")');
    // Every failure path must be a failed read, never an empty list.
    expect(server).toMatch(/ok: false, reason: "authority_unavailable"/);
  });

  it("keeps the public reader's column list explicit for both tables", () => {
    const server = readCode(SERVER);
    expect(server).toContain("RECOMMENDATION_COLUMNS");
    expect(server).toContain("CONTRIBUTION_COLUMNS");
    expect(server).toContain("attribution_mode");
    expect(server).toContain("qualifying_handshake_id");
  });
});

describe("A-023 phase 4 - prepared migration", () => {
  it("refuses to manufacture consent or attribution through a default", () => {
    const sql = read(MIGRATION);
    // Rule 7: a schema default must never manufacture a claim.
    expect(sql).toMatch(/consent_granted BOOLEAN NOT NULL,/);
    expect(sql).not.toMatch(/consent_granted BOOLEAN NOT NULL DEFAULT/);
    expect(sql).toMatch(/attribution_mode TEXT NOT NULL\s*\n\s*CHECK/);
    expect(sql).not.toMatch(/attribution_mode TEXT NOT NULL DEFAULT/);
    // The safe default publishes nothing.
    expect(sql).toContain("moderation_state TEXT NOT NULL DEFAULT 'pending'");
    expect(sql).toContain("status TEXT NOT NULL DEFAULT 'draft'");
  });

  it("excludes self-dealing and duplicate recommendations in the schema", () => {
    const sql = read(MIGRATION);
    expect(sql).toContain("broker_recommendations_no_self_dealing");
    expect(sql).toContain("broker_recommendations_unique_author_handshake");
    expect(sql).toContain("broker_recommendations_consent_is_dated");
  });

  it("enables RLS with no policy and revokes the default grant", () => {
    const sql = read(MIGRATION);
    for (const table of [
      "broker_recommendations",
      "broker_contributions",
      "broker_social_proof_audit_events",
    ]) {
      expect(sql).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
      expect(sql).toMatch(
        new RegExp(`REVOKE ALL ON TABLE public\\.${table} FROM PUBLIC, anon, authenticated`),
      );
    }
    // Rule 8 / Rule 5: RLS on with zero policies denies everything to the
    // browser. A policy here is the moment consent records become reachable.
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });

  it("stores only site-internal artifact paths", () => {
    const sql = read(MIGRATION);
    expect(sql).toContain("artifact_path LIKE '/%' AND artifact_path NOT LIKE '//%'");
  });
});
