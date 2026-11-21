import { createHash } from "node:crypto";

export function publicCatalogueCacheKey(key) {
  const target = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV;
  if (!target || target === "production" || target === "development") return key;

  const airtableBase = process.env.AIRTABLE_BASE_ID?.trim() || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, "") || "";
  const scope = createHash("sha256").update(JSON.stringify([target, airtableBase, supabaseUrl])).digest("base64url");
  return `scoutit:catalogue:${scope}:${key}`;
}

const READ_LAST_GOOD = `
  local value = redis.call('GET', KEYS[1])
  return value and ('!' .. value) or ''
`;

const REPLACE_AFTER_WITHDRAWAL = `
  local current = redis.call('GET', KEYS[3])
  local expected = ARGV[1]
  if expected ~= 'force' and (current and ('!' .. current) or '') ~= expected then return 0 end
  redis.call('INCR', KEYS[1])
  redis.call('DEL', KEYS[2])
  if current then
    if ARGV[2] == '' then
      redis.call('DEL', KEYS[3])
    elseif ARGV[2] ~= current then
      redis.call('SET', KEYS[3], ARGV[2], 'KEEPTTL')
    end
  end
  return 1
`;

function filterWithdrawnProperties(snapshot, withdrawn) {
  if (!Array.isArray(snapshot?.properties)) return null;
  const legacySlugs = new Set(withdrawn.filter(({ recordId }) => !recordId).map(({ slug }) => slug).filter(Boolean));
  const allSlugs = new Set(withdrawn.map(({ slug }) => slug).filter(Boolean));
  const ids = new Set(withdrawn.map(({ recordId }) => recordId).filter(Boolean));
  const properties = snapshot.properties.filter((property) => {
    if (!property) return true;
    const matches = property.id
      ? ids.has(property.id) || legacySlugs.has(property.slug)
      : allSlugs.has(property.slug);
    if (!matches) return true;
    if (property.id) ids.add(property.id);
    return false;
  });
  const homepage = snapshot.homepage;
  return {
    ...snapshot,
    properties,
    homepage: Array.isArray(homepage?.featuredProperties)
      ? { ...homepage, featuredProperties: homepage.featuredProperties.filter((id) => !ids.has(id)) }
      : homepage,
  };
}

export async function evictWithdrawnCatalogueEntries(runScript, withdrawn) {
  const keys = ["cms_bundle_generation", "cms_bundle", "cms_bundle_last_good"].map(publicCatalogueCacheKey);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const expected = await runScript(READ_LAST_GOOD, [keys[2]], []);
    let replacement = "";
    if (typeof expected === "string" && expected.startsWith("!")) {
      try {
        const filtered = filterWithdrawnProperties(JSON.parse(expected.slice(1)), withdrawn);
        if (filtered) replacement = JSON.stringify(filtered);
      } catch {
        // A malformed snapshot cannot safely be served after a withdrawal.
      }
    }
    if (Number(await runScript(REPLACE_AFTER_WITHDRAWAL, keys, [expected, replacement])) === 1) return;
  }
  // Repeated concurrent changes must not leave an unverified fallback available.
  if (Number(await runScript(REPLACE_AFTER_WITHDRAWAL, keys, ["force", ""])) !== 1) {
    throw new Error("Could not invalidate withdrawn catalogue entries.");
  }
}
