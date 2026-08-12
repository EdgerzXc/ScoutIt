import "server-only";

import { createHash } from "node:crypto";

const MANAGEMENT_API = "https://api.supabase.com/v1";
const MIGRATION_SQL = String.raw`-- C17: owner-controlled revocation watermark for public Board share links.
-- The service role is the only application actor that reads or writes this
-- table. A watermark invalidates every token issued at or before its time;
-- generating a newer token does not revive older links.

create table if not exists public.wishlist_share_revocations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revoked_before timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.wishlist_share_revocations enable row level security;

revoke all on table public.wishlist_share_revocations from anon, authenticated;

comment on table public.wishlist_share_revocations is
  'Service-role-only high-watermark used to revoke public wishlist share tokens without storing bearer credentials.';

`;

export const WISHLIST_REVOCATION_MIGRATION = Object.freeze({
  id: "20260811000001_wishlist_share_revocation",
  filename: "20260811000001_wishlist_share_revocation.sql",
  expectedChecksum: "A38EA1213432886619147933E0D103341D94E5A83DA1AE94FDEEFB69CD731E69",
  confirmationPhrase: "APPLY WISHLIST REVOCATION",
  affectedTable: "public.wishlist_share_revocations",
});

const STATE_QUERY = `select json_build_object(
  'table_exists', to_regclass('public.wishlist_share_revocations') is not null,
  'columns', coalesce((select json_agg(json_build_object('name', column_name, 'type', data_type, 'nullable', is_nullable) order by ordinal_position)
    from information_schema.columns where table_schema='public' and table_name='wishlist_share_revocations'), '[]'::json),
  'rls_enabled', coalesce((select relrowsecurity from pg_class where oid=to_regclass('public.wishlist_share_revocations')), false),
  'anon_privileges', coalesce((select json_agg(privilege_type) from information_schema.role_table_grants where table_schema='public' and table_name='wishlist_share_revocations' and grantee in ('anon','authenticated')), '[]'::json),
  'row_count', case when to_regclass('public.wishlist_share_revocations') is null then 0 else (select count(*) from public.wishlist_share_revocations) end
) as operation_state;`;

function projectRefFromUrl(value) {
  try { const [ref, ...rest] = new URL(value).hostname.split("."); return rest.join(".") === "supabase.co" && ref ? ref : null; }
  catch { return null; }
}

export function getWishlistRevocationOperationConfiguration() {
  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
  return { ready: Boolean(projectRef && hasAccessToken), projectRef, hasAccessToken,
    missing: [!projectRef ? "a valid NEXT_PUBLIC_SUPABASE_URL" : null, !hasAccessToken ? "SUPABASE_ACCESS_TOKEN" : null].filter(Boolean) };
}

async function request(path, options = {}) {
  const config = getWishlistRevocationOperationConfiguration();
  if (!config.ready) throw new Error(`Mission Control database operations are not configured: ${config.missing.join(", ")}.`);
  const response = await fetch(`${MANAGEMENT_API}/projects/${config.projectRef}${path}`, { ...options, cache: "no-store", headers: {
    Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Supabase Management API rejected the fixed operation: ${body?.message || body?.error || `HTTP ${response.status}`}`);
  return body;
}

function rows(response) { return Array.isArray(response) ? response : Array.isArray(response?.result) ? response.result : Array.isArray(response?.data) ? response.data : []; }
function firstValue(response, key) { const value = rows(response)[0]?.[key]; if (typeof value === "string") { try { return JSON.parse(value); } catch { return value; } } return value; }

async function backups() { return request("/database/backups"); }
function backupEvidence(raw) {
  const completed = (raw?.backups ?? []).filter((item) => item.status === "COMPLETED").sort((a, b) => new Date(b.inserted_at) - new Date(a.inserted_at));
  const latestBackup = completed[0] ?? null;
  const unix = raw?.physical_backup_data?.latest_physical_backup_date_unix;
  const pitrAt = unix ? new Date(Number(unix) * 1000).toISOString() : null;
  const candidateAt = latestBackup?.inserted_at || pitrAt;
  const ageHours = candidateAt ? (Date.now() - new Date(candidateAt).getTime()) / 3_600_000 : null;
  return { ready: Boolean(candidateAt && ageHours >= 0 && ageHours <= 36), latestBackup, pitrEnabled: Boolean(raw?.pitr_enabled), pitrAt, ageHours };
}

export async function loadWishlistRevocationMigrationSql() {
  const checksum = createHash("sha256").update(MIGRATION_SQL, "utf8").digest("hex").toUpperCase();
  return { sql: MIGRATION_SQL, checksum, checksumMatches: checksum === WISHLIST_REVOCATION_MIGRATION.expectedChecksum };
}

function classify(raw) {
  if (!raw?.table_exists) return { state: "pending", raw };
  const columns = Object.fromEntries((raw.columns ?? []).map((column) => [column.name, column]));
  const valid = columns.user_id?.type === "uuid" && columns.user_id?.nullable === "NO" &&
    columns.revoked_before?.type === "timestamp with time zone" && columns.revoked_before?.nullable === "NO" &&
    columns.updated_at?.type === "timestamp with time zone" && columns.updated_at?.nullable === "NO" && raw.rls_enabled && !(raw.anon_privileges ?? []).length;
  return { state: valid ? "applied" : "drift", raw };
}

export async function getWishlistRevocationMigrationStatus() {
  const configuration = getWishlistRevocationOperationConfiguration();
  const source = await loadWishlistRevocationMigrationSql();
  if (!configuration.ready) return { configuration, source, schema: null, backup: null, canApply: false };
  const [stateResponse, backupResponse] = await Promise.all([
    request("/database/query", { method: "POST", body: JSON.stringify({ query: STATE_QUERY, read_only: true }) }), backups(),
  ]);
  const schema = classify(firstValue(stateResponse, "operation_state"));
  const backup = backupEvidence(backupResponse);
  return { configuration, source, schema, backup, canApply: source.checksumMatches && schema.state === "pending" && backup.ready };
}

export async function applyFixedWishlistRevocationMigration() {
  const status = await getWishlistRevocationMigrationStatus();
  if (!status.canApply) throw new Error("Preflight is not green. Migration was not sent.");
  const { sql } = await loadWishlistRevocationMigrationSql();
  const fixedQuery = `begin;
select pg_advisory_xact_lock(hashtext('${WISHLIST_REVOCATION_MIGRATION.id}'));
do $guard$ begin if to_regclass('public.wishlist_share_revocations') is not null then raise exception 'Fixed migration guard rejected schema drift'; end if; end $guard$;
${sql}
commit;`;
  return request("/database/query", { method: "POST", body: JSON.stringify({ query: fixedQuery, read_only: false }) });
}

export const WISHLIST_REVOCATION_ROLLBACK_PLAN = `Restore from the captured backup/PITR point if data correctness is affected. A separately reviewed rollback may drop public.wishlist_share_revocations only after confirming link-revocation history can be discarded. This evidence is not an executable control.`;

