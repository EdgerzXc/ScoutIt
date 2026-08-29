import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(process.cwd(), path), "utf8");
const readCode = (path) =>
  read(path)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^\s*--.*$/gm, "");

const SNAPSHOT_MIGRATION = "supabase/migrations/20260827000001_broker_metric_snapshots.sql";
const SEED_MIGRATION = "supabase/migrations/20260827000002_seed_example_broker_metrics.sql";
const SERVER = "src/lib/serverBrokerMetrics.js";
const IDENTITY = "src/components/brokers/BrokerDossierIdentity.js";

// ─────────────────────────────────────────────────────────────────────────
// A-023 phase 5 source contracts.
//
// The arithmetic is unit-tested in brokerMetrics.test.js. These pin the rules
// that live in SQL and in the seed, where a mistake publishes an unearned
// number on a public page.
// ─────────────────────────────────────────────────────────────────────────

describe("A-023 phase 5 - what may count toward the ScoutIt Record", () => {
  const sql = readCode(SNAPSHOT_MIGRATION);

  it("counts only completed two-sided TRANSACTION handshakes", () => {
    // A-023's locked rule: representation acceptance never qualifies.
    expect(sql).toContain("h.handshake_type = 'transaction_handshake'");
    expect(sql).toContain("h.status = 'completed'");
    expect(sql).toContain("h.party_a_signed_at IS NOT NULL");
    expect(sql).toContain("h.party_b_signed_at IS NOT NULL");
    expect(sql).not.toContain("representation_handshake");
  });

  it("excludes self-dealing, duplicates and live disputes", () => {
    expect(sql).toContain("h.party_a_id IS DISTINCT FROM h.party_b_id");
    // DISTINCT deal_id: a retried handshake cannot double-count (idempotency).
    expect(sql).toContain("count(DISTINCT h.deal_id)");
    expect(sql).toContain("d.status <> 'dismissed'");
  });

  it("publishes every rate with a denominator it cannot exceed", () => {
    expect(sql).toContain("response_rate_numerator <= response_rate_denominator");
  });

  it("locks the recompute function to the service role", () => {
    // Rule 8: a SECURITY DEFINER function must revoke the default grant.
    expect(sql).toContain("SECURITY DEFINER");
    expect(sql).toContain("SET search_path = ''");
    expect(sql).toMatch(
      /REVOKE ALL ON FUNCTION public\.recompute_broker_metric_snapshot\(TEXT\)\s*\n?\s*FROM PUBLIC, anon, authenticated/,
    );
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.recompute_broker_metric_snapshot\(TEXT\) TO service_role/);
  });

  it("keeps the snapshot table unreachable from a browser", () => {
    expect(sql).toContain("ALTER TABLE public.broker_metric_snapshots ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain(
      "REVOKE ALL ON TABLE public.broker_metric_snapshots FROM PUBLIC, anon, authenticated",
    );
    expect(sql).not.toMatch(/CREATE POLICY/i);
  });
});

describe("A-023 phase 5 - demo seed cannot reach a real broker", () => {
  const seed = readCode(SEED_MIGRATION);

  it("selects its targets through the example-account guard", () => {
    // Structural, not procedural: there is no broker id literal to mistype.
    expect(seed).toContain("FROM public.user_profiles up");
    expect(seed).toContain("WHERE up.is_example_account IS TRUE");
    expect(seed).not.toMatch(/broker_id\s*=\s*'[0-9a-f-]{36}'/i);
  });

  it("marks every seeded row as demo scaffolding in the database", () => {
    expect(seed).toContain("'example_seed'");
    expect(seed).toContain("source = 'example_seed'");
  });

  it("cannot be laundered into computed data by a later recompute", () => {
    const sql = readCode(SNAPSHOT_MIGRATION);
    expect(sql).toContain("result.source = 'example_seed'");
    expect(sql).toMatch(/IF FOUND AND result\.source = 'example_seed' THEN\s*\n\s*RETURN result;/);
  });
});

describe("A-023 phase 5 - the record never overstates itself", () => {
  it("carries the example-seed flag out of the server projection", () => {
    expect(readCode(SERVER)).toContain('isExampleSeed: row.source === "example_seed"');
  });

  it("labels an example profile on the canonical dossier, not only the directory", () => {
    // The directory always flagged example profiles; the dossier did not, so a
    // visitor arriving directly had no notice that figures were illustrative.
    const identity = read(IDENTITY);
    expect(identity).toContain("identity.isExample");
    expect(identity).toContain("Example profile");
  });

  it("renders no star, score or out-of-100 rating anywhere in the record", () => {
    const identity = readCode(IDENTITY);
    expect(identity).not.toMatch(/\/100|out of 5|star/i);
    expect(identity).not.toContain("scoutRating");
  });

  it("states that career history never contributes to the figures", () => {
    // JSX wraps this sentence across lines; the assertion is about the claim,
    // not about where the source happens to break.
    expect(read(IDENTITY)).toMatch(/career history\s+never contributes/i);
  });
});
