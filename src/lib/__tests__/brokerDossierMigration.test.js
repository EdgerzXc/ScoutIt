import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const migrationPath = "supabase/migrations/20260826000001_broker_dossier_drafts.sql";
const readMigration = () => readFileSync(resolve(process.cwd(), migrationPath), "utf8");

describe("A-023 phase 3 - prepared broker dossier migration", () => {
  it("creates private draft and append-only audit authorities", () => {
    const sql = readMigration();

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.broker_dossier_drafts");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.broker_dossier_audit_events");
    expect(sql).toContain("ALTER TABLE public.broker_dossier_drafts ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("ALTER TABLE public.broker_dossier_audit_events ENABLE ROW LEVEL SECURITY");
    expect(sql).not.toMatch(/CREATE POLICY[\s\S]*broker_dossier_/i);
  });

  it("keeps saves owner-bound, revision-checked, and allowlisted in SQL", () => {
    const sql = readMigration();

    expect(sql).toContain("p_actor_id IS DISTINCT FROM p_broker_id");
    expect(sql).toContain("STALE_DRAFT_REVISION");
    expect(sql).toContain("p_expected_revision");
    expect(sql).toContain("UNKNOWN_DRAFT_FIELD");
    expect(sql).toContain("broker_dossier_saved");
  });

  it("marks publication only after a confirmed Airtable record and audits it", () => {
    const sql = readMigration();

    expect(sql).toContain("mark_broker_dossier_published");
    expect(sql).toContain("p_airtable_record_id");
    expect(sql).toContain("broker_dossier_published");
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.save_broker_dossier_draft/i);
    expect(sql).toMatch(/REVOKE ALL ON FUNCTION public\.mark_broker_dossier_published/i);
    expect(sql).toMatch(/GRANT EXECUTE ON FUNCTION public\.save_broker_dossier_draft[\s\S]*service_role/i);
  });
});
