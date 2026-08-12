import "server-only";

const MANAGEMENT_API = "https://api.supabase.com/v1";
const PROTECTED_TABLES = ["properties", "user_profiles", "deals", "saved_intel", "connect_balances", "connect_transactions", "projects", "waitlist"];

const SECURITY_QUERY = `select json_build_object(
  'tables', coalesce((select json_agg(json_build_object('schema', n.nspname, 'table', c.relname, 'rls', c.relrowsecurity) order by c.relname)
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname = any(array['properties','user_profiles','deals','saved_intel','connect_balances','connect_transactions','projects','waitlist'])), '[]'::json),
  'policies', coalesce((select json_agg(json_build_object('schema', schemaname, 'table', tablename, 'name', policyname, 'command', cmd, 'roles', roles, 'using', qual, 'check', with_check) order by schemaname, tablename, policyname)
    from pg_policies where (schemaname='public' and tablename = any(array['properties','user_profiles','deals','saved_intel','connect_balances','connect_transactions','projects','waitlist']))
      or (schemaname='storage' and tablename='objects')), '[]'::json),
  'migration_versions', coalesce((select json_agg(version order by version) from supabase_migrations.schema_migrations
    where version in ('20260803000001','20260806000001')), '[]'::json)
) as security_state;`;

function projectRefFromUrl(value) {
  try { const [ref, ...rest] = new URL(value).hostname.split("."); return rest.join(".") === "supabase.co" && ref ? ref : null; }
  catch { return null; }
}

export function getDatabaseSecurityConfiguration() {
  const projectRef = projectRefFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAccessToken = Boolean(process.env.SUPABASE_ACCESS_TOKEN);
  return { ready: Boolean(projectRef && hasAccessToken), projectRef, hasAccessToken,
    missing: [!projectRef ? "a valid NEXT_PUBLIC_SUPABASE_URL" : null, !hasAccessToken ? "SUPABASE_ACCESS_TOKEN" : null].filter(Boolean) };
}

async function runFixedRead() {
  const configuration = getDatabaseSecurityConfiguration();
  if (!configuration.ready) throw new Error(`Database security evidence is not configured: ${configuration.missing.join(", ")}.`);
  const response = await fetch(`${MANAGEMENT_API}/projects/${configuration.projectRef}/database/query`, {
    method: "POST", cache: "no-store",
    headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: SECURITY_QUERY, read_only: true }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Supabase Management API rejected the fixed security read: ${body?.message || body?.error || `HTTP ${response.status}`}`);
  const rows = Array.isArray(body) ? body : Array.isArray(body?.result) ? body.result : Array.isArray(body?.data) ? body.data : [];
  const value = rows[0]?.security_state;
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return null; } }
  return value;
}

function roles(policy) { return Array.isArray(policy?.roles) ? policy.roles.map((role) => String(role).toLowerCase()) : []; }
function isOpenWrite(policy) {
  const command = String(policy?.command || "").toUpperCase();
  const publicRole = roles(policy).some((role) => role === "public" || role === "anon");
  const unrestricted = String(policy?.using || "").trim() === "true" || String(policy?.check || "").trim() === "true";
  return publicRole && ["ALL", "INSERT", "UPDATE", "DELETE"].includes(command) && unrestricted;
}

export function classifyDatabaseSecurityState(raw) {
  const tables = raw?.tables ?? [];
  const policies = raw?.policies ?? [];
  const missingRls = PROTECTED_TABLES.filter((name) => !tables.some((table) => table.table === name && table.rls === true));
  const unsafePolicies = policies.filter((policy) => /dev_all|allow public uploads|public access/i.test(policy.name || "") || isOpenWrite(policy));
  const anonymousPropertyPhotoUploads = policies.filter((policy) => policy.schema === "storage" && policy.table === "objects" &&
    ["ALL", "INSERT"].includes(String(policy.command || "").toUpperCase()) && roles(policy).some((role) => role === "public" || role === "anon") &&
    (/property_photos/i.test(String(policy.check || "")) || /property_photos/i.test(String(policy.using || "")) || /allow public uploads/i.test(policy.name || "")));
  const migrationVersions = (raw?.migration_versions ?? []).map(String);
  const replacementApplied = migrationVersions.includes("20260803000001") && migrationVersions.includes("20260806000001");
  return { tables, policies, missingRls, unsafePolicies, anonymousPropertyPhotoUploads, migrationVersions, replacementApplied,
    ready: !missingRls.length && !unsafePolicies.length && !anonymousPropertyPhotoUploads.length && replacementApplied };
}

export async function getDatabaseSecurityReadiness() {
  const configuration = getDatabaseSecurityConfiguration();
  if (!configuration.ready) return { configuration, evidence: null };
  const raw = await runFixedRead();
  if (!raw) throw new Error("The fixed security query returned no evidence.");
  return { configuration, evidence: classifyDatabaseSecurityState(raw) };
}

