import "server-only";

import { createHash } from "node:crypto";

const MANAGEMENT_API = "https://api.supabase.com/v1";
const MIGRATION_SQL = String.raw`-- Private registry for invited human-testing cohorts.
-- This is operational metadata only: public sample inventory remains identified
-- by Airtable Is_Sample, while product writes are traced by the participant's
-- existing user_id. Raw temporary email addresses are deliberately not stored.

create table public.pilot_cohorts (
  id uuid primary key default gen_random_uuid(),
  cohort_key text not null unique,
  name text not null,
  status text not null default 'planned',
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  constraint pilot_cohorts_key_check
    check (cohort_key ~ '^[a-z0-9][a-z0-9_-]{2,47}$'),
  constraint pilot_cohorts_name_check
    check (char_length(btrim(name)) between 3 and 80),
  constraint pilot_cohorts_status_check
    check (status in ('planned', 'active', 'closed', 'archived')),
  constraint pilot_cohorts_window_check
    check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint pilot_cohorts_closed_check
    check ((status in ('closed', 'archived')) = (closed_at is not null))
);

create table public.pilot_participants (
  cohort_id uuid not null references public.pilot_cohorts(id) on delete restrict,
  user_id uuid not null,
  roles text[] not null,
  enrolled_by uuid not null,
  enrolled_at timestamptz not null default now(),
  offboarded_by uuid,
  offboarded_at timestamptz,
  account_deleted_at timestamptz,
  cleanup_note text,
  primary key (cohort_id, user_id),
  constraint pilot_participants_roles_check
    check (cardinality(roles) between 1 and 4
      and roles <@ array['owner', 'seeker', 'broker', 'provider']::text[]),
  constraint pilot_participants_offboard_check
    check ((offboarded_at is null) = (offboarded_by is null)),
  constraint pilot_participants_delete_check
    check (account_deleted_at is null or offboarded_at is not null),
  constraint pilot_participants_cleanup_note_check
    check (cleanup_note is null or char_length(cleanup_note) <= 500)
);

create unique index pilot_participants_one_active_cohort_idx
  on public.pilot_participants(user_id)
  where offboarded_at is null;

create index pilot_participants_user_history_idx
  on public.pilot_participants(user_id, enrolled_at desc);

alter table public.pilot_cohorts enable row level security;
alter table public.pilot_participants enable row level security;

revoke all on table public.pilot_cohorts from anon, authenticated;
revoke all on table public.pilot_participants from anon, authenticated;

comment on table public.pilot_cohorts is
  'Service-role-only registry for time-bounded invited human-testing cohorts.';
comment on table public.pilot_participants is
  'Service-role-only cohort membership. Rows survive account deletion as cleanup evidence; never store raw temporary email addresses.';
comment on column public.pilot_participants.user_id is
  'Existing authenticated tester ID used to trace related private writes without adding pilot flags to product tables.';
`;

export const PILOT_COHORT_MIGRATION = Object.freeze({
  id: "20260811000002_pilot_cohort_registry",
  filename: "20260811000002_pilot_cohort_registry.sql",
  expectedChecksum: "C3910F49F333B023FF2B99F558F0057E954314E8302AA12C5DB018C03ED36140",
  confirmationPhrase: "APPLY PILOT COHORT REGISTRY",
  affectedTable: "public.pilot_cohorts, public.pilot_participants",
});

const STATE_QUERY = `select json_build_object(
  'cohorts_exists', to_regclass('public.pilot_cohorts') is not null,
  'participants_exists', to_regclass('public.pilot_participants') is not null,
  'columns', coalesce((select json_agg(json_build_object(
    'table', table_name, 'name', column_name, 'type', data_type, 'nullable', is_nullable
  ) order by table_name, ordinal_position) from information_schema.columns
    where table_schema='public' and table_name in ('pilot_cohorts','pilot_participants')), '[]'::json),
  'rls', coalesce((select json_object_agg(relname, relrowsecurity) from pg_class
    where oid in (to_regclass('public.pilot_cohorts'), to_regclass('public.pilot_participants'))), '{}'::json),
  'client_privileges', coalesce((select json_agg(json_build_object(
    'table', table_name, 'grantee', grantee, 'privilege', privilege_type
  )) from information_schema.role_table_grants where table_schema='public'
    and table_name in ('pilot_cohorts','pilot_participants')
    and grantee in ('anon','authenticated')), '[]'::json),
  'indexes', coalesce((select json_agg(indexname order by indexname) from pg_indexes
    where schemaname='public' and tablename in ('pilot_cohorts','pilot_participants')), '[]'::json)
) as operation_state;`;

function projectRefFromUrl(value) {
  try {
    const [ref, ...rest] = new URL(value).hostname.split(".");
    return rest.join(".") === "supabase.co" && ref ? ref : null;
  } catch { return null; }
}

export function getPilotCohortOperationConfiguration() {
  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
  return {
    ready: Boolean(projectRef && hasAccessToken), projectRef, hasAccessToken,
    missing: [!projectRef ? "a valid NEXT_PUBLIC_SUPABASE_URL" : null,
      !hasAccessToken ? "SUPABASE_ACCESS_TOKEN" : null].filter(Boolean),
  };
}

async function request(path, options = {}) {
  const config = getPilotCohortOperationConfiguration();
  if (!config.ready) throw new Error(`Mission Control database operations are not configured: ${config.missing.join(", ")}.`);
  const response = await fetch(`${MANAGEMENT_API}/projects/${config.projectRef}${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Supabase Management API rejected the fixed operation: ${body?.message || body?.error || `HTTP ${response.status}`}`);
  return body;
}

function rows(response) {
  return Array.isArray(response) ? response
    : Array.isArray(response?.result) ? response.result
      : Array.isArray(response?.data) ? response.data : [];
}

function firstValue(response, key) {
  const value = rows(response)[0]?.[key];
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return value; } }
  return value;
}

function backupEvidence(raw) {
  const completed = (raw?.backups ?? []).filter((item) => item.status === "COMPLETED")
    .sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
  const latestBackup = completed[0] ?? null;
  const unix = raw?.physical_backup_data?.latest_physical_backup_date_unix;
  const pitrAt = unix ? new Date(Number(unix) * 1000).toISOString() : null;
  const candidateAt = latestBackup?.inserted_at || pitrAt;
  const ageHours = candidateAt ? (Date.now() - new Date(candidateAt).getTime()) / 3_600_000 : null;
  return { ready: Boolean(candidateAt && ageHours >= 0 && ageHours <= 36), latestBackup,
    pitrEnabled: Boolean(raw?.pitr_enabled), pitrAt, ageHours };
}

export async function loadPilotCohortMigrationSql() {
  const checksum = createHash("sha256").update(MIGRATION_SQL, "utf8").digest("hex").toUpperCase();
  return { sql: MIGRATION_SQL, checksum, checksumMatches: checksum === PILOT_COHORT_MIGRATION.expectedChecksum };
}

function classify(raw) {
  const exists = [raw?.cohorts_exists, raw?.participants_exists];
  if (exists.every((value) => value === false)) return { state: "pending", raw };
  if (!exists.every(Boolean)) return { state: "drift", raw };
  const columns = new Set((raw.columns ?? []).map((column) => `${column.table}.${column.name}:${column.type}:${column.nullable}`));
  const requiredColumns = [
    "pilot_cohorts.id:uuid:NO", "pilot_cohorts.cohort_key:text:NO", "pilot_cohorts.status:text:NO",
    "pilot_cohorts.created_by:uuid:NO", "pilot_cohorts.closed_at:timestamp with time zone:YES",
    "pilot_participants.cohort_id:uuid:NO", "pilot_participants.user_id:uuid:NO",
    "pilot_participants.roles:ARRAY:NO", "pilot_participants.enrolled_by:uuid:NO",
    "pilot_participants.offboarded_at:timestamp with time zone:YES",
    "pilot_participants.account_deleted_at:timestamp with time zone:YES",
  ];
  const indexes = new Set(raw.indexes ?? []);
  const valid = requiredColumns.every((column) => columns.has(column))
    && raw.rls?.pilot_cohorts === true && raw.rls?.pilot_participants === true
    && !(raw.client_privileges ?? []).length
    && indexes.has("pilot_participants_one_active_cohort_idx")
    && indexes.has("pilot_participants_user_history_idx");
  return { state: valid ? "applied" : "drift", raw };
}

export async function getPilotCohortMigrationStatus() {
  const configuration = getPilotCohortOperationConfiguration();
  const source = await loadPilotCohortMigrationSql();
  if (!configuration.ready) return { configuration, source, schema: null, backup: null, canApply: false };
  const [stateResponse, backupResponse] = await Promise.all([
    request("/database/query", { method: "POST", body: JSON.stringify({ query: STATE_QUERY, read_only: true }) }),
    request("/database/backups"),
  ]);
  const schema = classify(firstValue(stateResponse, "operation_state"));
  const backup = backupEvidence(backupResponse);
  return { configuration, source, schema, backup,
    canApply: source.checksumMatches && schema.state === "pending" && backup.ready };
}

export async function applyFixedPilotCohortMigration() {
  const status = await getPilotCohortMigrationStatus();
  if (!status.canApply) throw new Error("Preflight is not green. Migration was not sent.");
  const { sql } = await loadPilotCohortMigrationSql();
  const fixedQuery = `begin;
select pg_advisory_xact_lock(hashtext('${PILOT_COHORT_MIGRATION.id}'));
do $guard$ begin
  if to_regclass('public.pilot_cohorts') is not null or to_regclass('public.pilot_participants') is not null
  then raise exception 'Fixed migration guard rejected schema drift'; end if;
end $guard$;
${sql}
commit;`;
  return request("/database/query", {
    method: "POST", body: JSON.stringify({ query: fixedQuery, read_only: false }),
  });
}

export const PILOT_COHORT_ROLLBACK_PLAN = `Restore from the captured backup/PITR point if correctness is affected. A separately reviewed rollback may drop public.pilot_participants and public.pilot_cohorts only before pilot membership or cleanup evidence exists. This evidence is not an executable control.`;

