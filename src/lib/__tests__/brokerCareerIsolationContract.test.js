import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const readCode = (p) =>
  read(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/^\s*--.*$/gm, "");

const CAREER = "src/lib/brokerCareerHistory.js";
const METRICS = "src/lib/brokerMetrics.js";
const PAGE = "src/app/brokers/[broker-slug]/page.js";
const MIGRATION = "supabase/migrations/20260827000003_broker_career_claims.sql";

// ─────────────────────────────────────────────────────────────────────────
// A-023's hardest rule: the two statistics templates must stay isolated in
// storage, projection, UI, ranking and rating. These pin the isolation at
// every one of those layers, because a future edit that merges them would
// look perfectly reasonable in a diff.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 the two templates never merge", () => {
  it("shares no module between the career projection and the metric projection", () => {
    const career = readCode(CAREER);
    const metrics = readCode(METRICS);
    expect(career).not.toContain("brokerMetrics");
    expect(career).not.toMatch(/snapshot|completedTransactions|responseRate/);
    expect(metrics).not.toContain("brokerCareerHistory");
    expect(metrics).not.toMatch(/careerHistory|career_claims/);
  });

  it("builds each section from its own lookup on the page", () => {
    const page = readCode(PAGE);
    expect(page).toContain("buildScoutItRecord({ lookup: metricLookup })");
    expect(page).toMatch(/buildCareerHistorySection\(\{ authorityId, lookup: careerLookup \}\)/);
    // Neither may be passed the other's data.
    expect(page).not.toMatch(/buildCareerHistorySection\([^)]*metricLookup/);
    expect(page).not.toMatch(/buildScoutItRecord\([^)]*careerLookup/);
  });

  it("renders the ScoutIt Record before Career History", () => {
    const page = read(PAGE);
    // The record lives in the identity block, which must precede the section.
    expect(page.indexOf("<BrokerDossierIdentity")).toBeLessThan(
      page.indexOf("<BrokerCareerHistory"),
    );
  });

  it("keeps career claims in a separate table with no join to snapshots", () => {
    const sql = readCode(MIGRATION);
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.broker_career_claims");
    expect(sql).not.toContain("broker_metric_snapshots");
  });

  it("carries no score, weight or rating anywhere in the career projection", () => {
    expect(readCode(CAREER)).not.toMatch(/score|weight|rating|rank\b|aggregate/i);
  });

  it("requires attestation before publication, in the schema itself", () => {
    const sql = readCode(MIGRATION);
    expect(sql).toContain("broker_career_claims_published_is_attested");
    expect(sql).toContain("broker_career_claims_review_is_named");
    // Rule 7: attestation must never be defaulted into existence.
    expect(sql).not.toMatch(/attested_at\s+TIMESTAMPTZ\s+NOT NULL DEFAULT/);
    expect(sql).toContain("verification_state TEXT NOT NULL DEFAULT 'broker_declared'");
  });

  it("keeps the career table unreachable from a browser", () => {
    const sql = readCode(MIGRATION);
    expect(sql).toContain("ALTER TABLE public.broker_career_claims ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("REVOKE ALL ON TABLE public.broker_career_claims FROM PUBLIC, anon, authenticated");
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});
