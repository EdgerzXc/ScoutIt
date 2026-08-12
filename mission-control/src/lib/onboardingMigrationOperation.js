import "server-only";

import { createHash } from "node:crypto";

const MANAGEMENT_API = "https://api.supabase.com/v1";

const ONBOARDING_MIGRATION_SQL = String.raw`-- ONBOARDING COMPLETION CONTRACT
-- Prepared 2026-08-09. Owner-gated: apply only through ScoutIt's approved,
-- audited Mission Control migration operation. Do not paste ad hoc into SQL.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS primary_mode TEXT,
  ADD COLUMN IF NOT EXISTS location_focus TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_primary_mode_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_primary_mode_check
  CHECK (primary_mode IS NULL OR primary_mode IN ('buyer', 'owner', 'broker'));

COMMENT ON COLUMN public.user_profiles.primary_mode IS
  'Initial dashboard mode. buyer is the UI alias for the legacy seeker role. Signup permits exactly buyer, owner, or broker; additional roles are activated later.';
COMMENT ON COLUMN public.user_profiles.location_focus IS
  'Private optional scouting-area preference collected during buyer/seeker onboarding. Never expose through public_profiles or the public CMS.';
COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS
  'Set only after the profile and Connect wallet are successfully provisioned. NULL means the authenticated account must finish onboarding.';

-- Derive existing users without inventing new capabilities. active_roles wins
-- because founder/admin and multi-role accounts cannot be represented safely by
-- the legacy role column alone. Buyer/seeker is preferred when already present.
UPDATE public.user_profiles
SET primary_mode = CASE
  WHEN active_roles && ARRAY['buyer', 'seeker']::TEXT[] THEN 'buyer'
  WHEN active_roles @> ARRAY['owner']::TEXT[] THEN 'owner'
  WHEN active_roles @> ARRAY['broker']::TEXT[] THEN 'broker'
  WHEN role IN ('buyer', 'seeker') THEN 'buyer'
  WHEN role = 'owner' THEN 'owner'
  WHEN role = 'broker' THEN 'broker'
  ELSE NULL
END
WHERE primary_mode IS NULL;

-- Mark only accounts whose role can be derived and whose age state is allowed.
-- Explicit underage is always excluded. The fixed date matches AGE_GATE_CUTOFF
-- in src/lib/adultEligibility.js and must never move forward.
UPDATE public.user_profiles
SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE primary_mode IS NOT NULL
  AND adult_eligibility_status <> 'underage'
  AND (
    adult_eligibility_status IN ('declared_adult', 'verified_adult')
    OR created_at < TIMESTAMPTZ '2026-08-06T00:00:00.000Z'
    OR is_example_account IS TRUE
  );
`;

export const ONBOARDING_MIGRATION = Object.freeze({
  id: "20260809000002_onboarding_completion_contract",
  filename: "20260809000002_onboarding_completion_contract.sql",
  expectedChecksum: "CF7D01ED0B0F878EF8B88F6AA72139DE72B5A400C2B7FA774412CB985059F8D0",
  confirmationPhrase: "APPLY ONBOARDING CONTRACT",
  affectedTable: "public.user_profiles",
});

const EXPECTED_COLUMNS = {
  primary_mode: "text",
  location_focus: "text",
  onboarding_completed_at: "timestamp with time zone",
};
const REQUIRED_BASE_COLUMNS = [
  "active_roles", "role", "adult_eligibility_status", "created_at", "is_example_account",
];

const SCHEMA_QUERY = `select json_build_object(
  'table_exists', to_regclass('public.user_profiles') is not null,
  'columns', coalesce((select json_agg(json_build_object(
    'name', column_name, 'type', data_type, 'nullable', is_nullable
  ) order by ordinal_position) from information_schema.columns
    where table_schema = 'public' and table_name = 'user_profiles'
      and column_name in ('primary_mode', 'location_focus', 'onboarding_completed_at',
        'active_roles', 'role', 'adult_eligibility_status', 'created_at', 'is_example_account')
  ), '[]'::json),
  'constraint_definition', (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and conname = 'user_profiles_primary_mode_check'),
  'privacy_exposures', coalesce((select json_agg(json_build_object(
    'schema', table_schema, 'view', table_name
  )) from information_schema.views
    where lower(coalesce(view_definition, '')) like '%location_focus%'
       or lower(coalesce(view_definition, '')) like '%onboarding_completed_at%'
  ), '[]'::json)
) as operation_state;`;

const PENDING_COUNTS_QUERY = `select count(*)::int as total_profiles,
  count(*) filter (where active_roles && array['buyer','seeker','owner','broker']::text[]
    or role in ('buyer','seeker','owner','broker'))::int as primary_mode_candidates,
  count(*) filter (where (active_roles && array['buyer','seeker','owner','broker']::text[]
      or role in ('buyer','seeker','owner','broker'))
    and adult_eligibility_status <> 'underage'
    and (adult_eligibility_status in ('declared_adult','verified_adult')
      or created_at < timestamptz '2026-08-06T00:00:00.000Z'
      or is_example_account is true))::int as completion_candidates,
  count(*) filter (where adult_eligibility_status = 'underage')::int as underage_excluded
from public.user_profiles;`;

const APPLIED_COUNTS_QUERY = `select count(*)::int as total_profiles,
  count(*) filter (where primary_mode is not null)::int as primary_mode_backfilled,
  count(*) filter (where onboarding_completed_at is not null)::int as onboarding_completed,
  count(*) filter (where onboarding_completed_at is null)::int as onboarding_incomplete,
  count(*) filter (where adult_eligibility_status = 'underage')::int as underage_excluded,
  count(*) filter (where location_focus is not null and btrim(location_focus) <> '')::int as private_locations_stored
from public.user_profiles;`;

function projectRefFromUrl(value) {
  try {
    const hostname = new URL(value).hostname;
    const [ref, ...rest] = hostname.split(".");
    return rest.join(".") === "supabase.co" && ref ? ref : null;
  } catch { return null; }
}

export function getOperationConfiguration() {
  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
  return {
    ready: Boolean(projectRef && hasAccessToken), projectRef, hasAccessToken,
    missing: [!projectRef ? "a valid NEXT_PUBLIC_SUPABASE_URL" : null,
      !hasAccessToken ? "SUPABASE_ACCESS_TOKEN" : null].filter(Boolean),
  };
}

async function fixedManagementRequest(path, options = {}) {
  const config = getOperationConfiguration();
  if (!config.ready) {
    throw new Error(`Mission Control database operations are not configured: ${config.missing.join(", ")}.`);
  }
  const response = await fetch(`${MANAGEMENT_API}/projects/${config.projectRef}${path}`, {
    ...options, cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Supabase Management API rejected the fixed operation: ${body?.message || body?.error || `HTTP ${response.status}`}`);
  }
  return body;
}

async function runFixedRead(query) {
  return fixedManagementRequest("/database/query", {
    method: "POST", body: JSON.stringify({ query, read_only: true }),
  });
}

async function loadBackups() {
  return fixedManagementRequest("/database/backups");
}

function rows(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

function firstValue(response, key) {
  const value = rows(response)[0]?.[key];
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
}

export async function loadOnboardingMigrationSql() {
  const sql = ONBOARDING_MIGRATION_SQL;
  const checksum = createHash("sha256").update(sql, "utf8").digest("hex").toUpperCase();
  return { sql, checksum, checksumMatches: checksum === ONBOARDING_MIGRATION.expectedChecksum };
}

function classifySchema(raw) {
  const columns = Object.fromEntries((raw?.columns ?? []).map((column) => [column.name, column]));
  const present = Object.keys(EXPECTED_COLUMNS).filter((name) => columns[name]);
  const missingBase = REQUIRED_BASE_COLUMNS.filter((name) => !columns[name]);
  const constraint = raw?.constraint_definition || null;
  const constraintValid = Boolean(constraint &&
    ["buyer", "owner", "broker", "primary_mode"].every((token) => constraint.includes(token)));
  const typesValid = Object.entries(EXPECTED_COLUMNS).every(
    ([name, type]) => !columns[name] || columns[name].type === type);
  let state = "drift";
  if (raw?.table_exists && !missingBase.length && !present.length && !constraint) state = "pending";
  if (raw?.table_exists && !missingBase.length && present.length === 3 && typesValid && constraintValid) state = "applied";
  return { state, columns, missingBase, constraint, constraintValid,
    privacyExposures: raw?.privacy_exposures ?? [] };
}

function backupEvidence(raw) {
  const backups = (raw?.backups ?? []).filter((backup) => backup.status === "COMPLETED")
    .sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
  const latestBackup = backups[0] ?? null;
  const pitrUnix = raw?.physical_backup_data?.latest_physical_backup_date_unix;
  const pitrAt = pitrUnix ? new Date(Number(pitrUnix) * 1000).toISOString() : null;
  const candidateAt = latestBackup?.inserted_at || pitrAt;
  const ageHours = candidateAt ? (Date.now() - new Date(candidateAt).getTime()) / 3_600_000 : null;
  return { ready: Boolean(candidateAt && ageHours >= 0 && ageHours <= 36), latestBackup,
    pitrEnabled: Boolean(raw?.pitr_enabled), pitrAt, ageHours,
    requirement: "A completed backup or PITR point no older than 36 hours." };
}

export async function getOnboardingMigrationStatus() {
  const configuration = getOperationConfiguration();
  const source = await loadOnboardingMigrationSql();
  if (!configuration.ready) {
    return { configuration, source, schema: null, counts: null, backup: null,
      privacySafe: null, canApply: false };
  }
  const [schemaResponse, backupsResponse] = await Promise.all([
    runFixedRead(SCHEMA_QUERY), loadBackups(),
  ]);
  const schema = classifySchema(firstValue(schemaResponse, "operation_state"));
  const countsResponse = schema.state === "applied" ? await runFixedRead(APPLIED_COUNTS_QUERY)
    : schema.state === "pending" ? await runFixedRead(PENDING_COUNTS_QUERY) : null;
  const counts = countsResponse ? rows(countsResponse)[0] ?? null : null;
  const backup = backupEvidence(backupsResponse);
  const privacySafe = schema.privacyExposures.length === 0;
  return { configuration, source, schema, counts, backup, privacySafe,
    canApply: source.checksumMatches && schema.state === "pending" && backup.ready && privacySafe };
}

export async function applyFixedOnboardingMigration() {
  const status = await getOnboardingMigrationStatus();
  if (!status.canApply) throw new Error("Preflight is not green. Migration was not sent.");
  const { sql } = await loadOnboardingMigrationSql();
  const fixedQuery = `begin;
select pg_advisory_xact_lock(hashtext('${ONBOARDING_MIGRATION.id}'));
do $guard$ declare present_count integer; begin
  select count(*) into present_count from information_schema.columns
  where table_schema='public' and table_name='user_profiles'
    and column_name in ('primary_mode','location_focus','onboarding_completed_at');
  if present_count <> 0 then raise exception 'Fixed migration guard rejected schema drift'; end if;
end $guard$;
${sql}
commit;`;
  return fixedManagementRequest("/database/query", {
    method: "POST", body: JSON.stringify({ query: fixedQuery, read_only: false }),
  });
}

export const ONBOARDING_ROLLBACK_PLAN = `Restore from the captured backup/PITR point if data correctness is affected.

Schema-only rollback, after confirming no onboarding data must be retained:
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_primary_mode_check,
  DROP COLUMN IF EXISTS onboarding_completed_at,
  DROP COLUMN IF EXISTS location_focus,
  DROP COLUMN IF EXISTS primary_mode;

This is evidence, not an executable control. Dropping these columns destroys onboarding data and requires a separately reviewed MMC operation.`;
