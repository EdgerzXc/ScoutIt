import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION = "supabase/migrations/20260831000001_broker_satisfaction_signal.sql";

describe("A-038 broker satisfaction migration", () => {
  const sql = () => readFileSync(resolve(process.cwd(), MIGRATION), "utf8");

  it("adds one nullable legacy-safe constrained satisfaction authority", () => {
    const source = sql();
    expect(source).toMatch(/ADD COLUMN IF NOT EXISTS satisfaction_level TEXT/);
    expect(source).toContain("broker_recommendations_satisfaction_level_check");
    for (const level of ["angry", "sad", "smile", "happy"]) {
      expect(source).toContain(`'${level}'`);
    }
    expect(source).toMatch(/satisfaction_level IS NULL\s+OR satisfaction_level IN/);
    expect(source).not.toMatch(/UPDATE\s+public\.broker_recommendations/i);
  });

  it("allows the settled optional comment without weakening its length ceiling", () => {
    const source = sql();
    expect(source).toContain("ALTER COLUMN body SET DEFAULT ''");
    expect(source).toContain("broker_recommendations_body_check");
    expect(source).toMatch(/length\(body\) BETWEEN 0 AND 2000/);
  });

  it("is additive, transactional, and does not change browser access", () => {
    const source = sql();
    expect(source).toMatch(/^BEGIN;/m);
    expect(source).toMatch(/^COMMIT;/m);
    expect(source).not.toMatch(/CREATE POLICY|GRANT .*anon|GRANT .*authenticated/i);
    expect(source).not.toMatch(/DROP TABLE|DELETE FROM|TRUNCATE/i);
  });
});
